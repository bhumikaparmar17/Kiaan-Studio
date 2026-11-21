"""
Kiaan Studio - AI Engine Backend Bridge Worker Daemon
Connects the Python AI Engine pipelines with the Express/Node.js backend.
Continuously claims queued generation jobs, executes real AI inference,
saves assets into the backend uploads directory, and updates job completion.
"""

import os
import sys
import json
import time
import shutil
import argparse
from pathlib import Path
from typing import Dict, Any, Optional

# Ensure parent paths are available
CURRENT_DIR = Path(__file__).resolve().parent
ENGINE_ROOT = CURRENT_DIR.parent
PROJECT_ROOT = ENGINE_ROOT.parent

if str(ENGINE_ROOT) not in sys.path:
    sys.path.insert(0, str(ENGINE_ROOT))

# Ensure unbuffered output for terminal viewing
try:
    sys.stdout.reconfigure(line_buffering=True)
except Exception:
    pass

from workers.simulated_worker import SimulatedWorker
from processors.cloudinary_storage import CloudinaryStorage

# Custom exception for backend offline state
class BackendOfflineError(Exception):
    pass

# HTTP Request helper supporting both requests and standard urllib
def make_api_request(url: str, method: str = "GET", data: Optional[Dict[str, Any]] = None, headers: Optional[Dict[str, str]] = None) -> Optional[Dict[str, Any]]:
    headers = headers or {}
    try:
        try:
            import requests
            req_kwargs = {"headers": headers, "timeout": 10}
            if method.upper() == "GET":
                resp = requests.get(url, **req_kwargs)
            elif method.upper() == "POST":
                resp = requests.post(url, json=data, **req_kwargs)
            elif method.upper() == "PUT":
                resp = requests.put(url, json=data, **req_kwargs)
            else:
                resp = requests.request(method, url, json=data, **req_kwargs)
            
            if resp.status_code >= 400:
                print(f"[AI Bridge Worker HTTP Error] {method} {url} returned {resp.status_code}: {resp.text}")
                return None
            return resp.json()
        except ImportError:
            import urllib.request
            import urllib.error
            json_bytes = json.dumps(data).encode("utf-8") if data is not None else None
            req_headers = dict(headers)
            if json_bytes is not None and "Content-Type" not in req_headers:
                req_headers["Content-Type"] = "application/json"
            req = urllib.request.Request(url, data=json_bytes, headers=req_headers, method=method.upper())
            with urllib.request.urlopen(req, timeout=10) as resp:
                resp_text = resp.read().decode("utf-8")
                return json.loads(resp_text) if resp_text else {}
    except Exception as e:
        err_str = str(e)
        if "10061" in err_str or "Failed to establish a new connection" in err_str or "refused" in err_str.lower() or "winerror 10061" in err_str.lower():
            raise BackendOfflineError(f"Backend offline at {url}")
        print(f"[AI Bridge Worker Network Error] {e}")
        return None


class BackendBridgeWorker:
    def __init__(
        self,
        backend_url: str = "http://localhost:5001/api/v1",
        worker_secret: str = "kiaan_worker_secret_dev_2026",
        worker_node_id: str = "ai-engine-worker-1",
        poll_interval: float = 1.5,
        execution_mode: str = "mock",
        backend_uploads_dir: Optional[str] = None
    ):
        self.backend_url = backend_url.rstrip("/")
        self.worker_secret = worker_secret
        self.worker_node_id = worker_node_id
        self.poll_interval = poll_interval
        self.execution_mode = execution_mode
        
        # Locate Backend uploads directory
        if backend_uploads_dir:
            self.uploads_dir = Path(backend_uploads_dir).resolve()
        else:
            # Check standard backend directory or fallback
            candidate_dir = PROJECT_ROOT / "backend" / "uploads" / "generations"
            if not candidate_dir.parent.exists():
                candidate_dir = PROJECT_ROOT / "Kiaan-ai-image-generator-backend" / "uploads" / "generations"
            self.uploads_dir = candidate_dir.resolve()
        
        self.uploads_dir.mkdir(parents=True, exist_ok=True)

        self.headers = {
            "Content-Type": "application/json",
            "x-worker-key": self.worker_secret
        }

        self.worker = SimulatedWorker(execution_mode=self.execution_mode)

        print(f"[AI Bridge Worker] Initializing AI Engine Worker Daemon")
        print(f"  • Worker Node ID : {self.worker_node_id}")
        print(f"  • Backend API    : {self.backend_url}")
        print(f"  • Uploads Target : {self.uploads_dir}")
        print(f"  • Execution Mode : {self.execution_mode.upper()}")
        print(f"  • WaveSpeed AI   : {'CONFIGURED (Real Z-Image Turbo Active)' if self.worker.pipelines['z_image'].is_wavespeed_configured() else 'UNCONFIGURED'}")
        print(f"  • Cloudinary     : {'CONFIGURED (Primary Cloud CDN)' if CloudinaryStorage.is_configured() else 'UNCONFIGURED (Using Local Fallback)'}")
        print(f"  • Polling Rate   : Every {self.poll_interval}s")

    def map_model_id(self, backend_model_id: str) -> str:
        """
        Maps backend model identifiers to AI engine pipeline names.
        """
        b_id = str(backend_model_id or "").lower()
        if "wan" in b_id or "video" in b_id:
            return "wan_video"
        elif "z-image" in b_id or "z_image" in b_id:
            return "z_image"
        else:
            return "flux_klein"

    def map_task_type(self, backend_type: str) -> str:
        """
        Maps backend generation type to pipeline task name.
        """
        b_type = str(backend_type or "").upper()
        if "VIDEO" in b_type:
            return "text-to-video"
        elif "IMAGE_TO_IMAGE" in b_type:
            return "image-to-image"
        else:
            return "text-to-image"

    def send_heartbeat(self):
        """
        Registers heartbeat with backend admin registry.
        """
        url = f"{self.backend_url}/generation/worker/heartbeat"
        payload = {
            "id": self.worker_node_id,
            "name": f"Kiaan Node ({self.worker_node_id})",
            "gpuModel": "NVIDIA RTX 4090 / Engine Pipeline" if self.execution_mode == "cuda" else "Kiaan AI Engine (CPU/Mock)",
            "status": "ONLINE",
            "totalVramGb": 24,
            "usedVramGb": 4 if self.execution_mode == "mock" else 14,
            "ipAddress": "127.0.0.1"
        }
        make_api_request(url, method="POST", data=payload, headers=self.headers)

    def claim_next_job(self) -> Optional[Dict[str, Any]]:
        """
        Queries the backend queue to claim the oldest queued job.
        """
        url = f"{self.backend_url}/generation/worker/claim"
        payload = {
            "workerNodeId": self.worker_node_id,
            "supportedTypes": [
                "TEXT_TO_IMAGE",
                "TEXT_TO_VIDEO",
                "IMAGE_TO_IMAGE",
                "IMAGE_EDITOR",
                "IMAGE_TO_VIDEO"
            ],
            "supportedModels": [
                "flux-2-klein-4b",
                "flux-1-schnell",
                "z-image-turbo",
                "wan-2.1-video-720p",
                "wan-2.1-i2v-14b"
            ]
        }
        res = make_api_request(url, method="POST", data=payload, headers=self.headers)
        if res and res.get("success") and res.get("data"):
            return res["data"]
        return None

    def report_progress(self, job_id: str, percent: int, step: int, total_steps: int, message: str = ""):
        """
        Reports generation progress back to backend database and event stream.
        """
        url = f"{self.backend_url}/generation/worker/jobs/{job_id}/progress"
        payload = {
            "workerNodeId": self.worker_node_id,
            "progressPercent": percent,
            "currentStep": step,
            "totalSteps": total_steps,
            "statusMessage": message
        }
        make_api_request(url, method="POST", data=payload, headers=self.headers)

    def complete_job(self, job_id: str, execution_time_ms: int, assets: list):
        """
        Notifies backend that job has finished and attaches generated media asset paths.
        """
        url = f"{self.backend_url}/generation/worker/jobs/{job_id}/complete"
        payload = {
            "workerNodeId": self.worker_node_id,
            "executionTimeMs": execution_time_ms,
            "assets": assets
        }
        return make_api_request(url, method="POST", data=payload, headers=self.headers)

    def fail_job(self, job_id: str, error_message: str):
        """
        Notifies backend that job has failed, triggering automatic credit refund.
        """
        url = f"{self.backend_url}/generation/worker/jobs/{job_id}/fail"
        payload = {
            "workerNodeId": self.worker_node_id,
            "errorMessage": error_message,
            "executionTimeMs": 0
        }
        return make_api_request(url, method="POST", data=payload, headers=self.headers)

    def process_job(self, job: Dict[str, Any]):
        """
        Executes AI inference for a single claimed job.
        """
        job_id = job.get("id")
        prompt = job.get("prompt", "")
        model_id = job.get("modelId", "flux-2-klein-4b")
        task_type = job.get("type", "TEXT_TO_IMAGE")
        
        # Parse parameters
        params = job.get("parametersJson") or {}
        if isinstance(params, str):
            try:
                params = json.loads(params)
            except Exception:
                params = {}
                
        aspect_ratio = params.get("aspect") or params.get("aspectRatio") or "1:1"
        width = params.get("width")
        height = params.get("height")
        steps = params.get("steps")
        seed = params.get("seed")
        if seed is not None:
            try:
                if isinstance(seed, str):
                    seed_clean = seed.strip()
                    if seed_clean and seed_clean.lower() not in ("none", "null", "undefined", "random"):
                        seed = int(float(seed_clean))
                    else:
                        seed = None
                elif isinstance(seed, (int, float)) and not isinstance(seed, bool):
                    seed = int(seed)
                else:
                    seed = None
            except Exception:
                seed = None
        upscale = params.get("upscale", False)
        
        engine_model = self.map_model_id(model_id)
        engine_task = self.map_task_type(task_type)

        print("\n" + "=" * 65)
        print(f"[AI Bridge Worker] CLAIMED JOB: #{job_id}")
        print(f"  • Task   : {engine_task} ({task_type})")
        print(f"  • Model  : {engine_model} (Mapped from '{model_id}')")
        print(f"  • Aspect : {aspect_ratio}")
        if width and height:
            print(f"  • Target : {width}x{height}")
        print(f"  • Prompt : {prompt}")
        print("=" * 65)

        # Step progress callback function
        def on_step_progress(percent: int, step: int, total_steps: int, msg: str = ""):
            print(f"  -> [{percent}%] Step {step}/{total_steps}: {msg}")
            self.report_progress(job_id, percent, step, total_steps, msg)

        try:
            # Report initialization
            self.report_progress(job_id, 10, 1, steps or 4, f"Initializing {engine_model} neural weights...")
            
            # Execute inference
            cf_models = ["flux-2-klein-4b", "flux-1-schnell"]
            cf_adapter = None
            try:
                from pipelines.cloudflare_adapter import CloudflarePipelineAdapter
                cf_adapter = CloudflarePipelineAdapter()
            except Exception:
                pass

            cf_mode = os.environ.get("CLOUDFLARE_INFERENCE_MODE", "live").lower().strip()

            if model_id in cf_models:
                # Cloudflare hosted inference model
                if cf_mode != "mock":
                    # STRICT LIVE MODE: Silent fallback to mock placeholder canvas is strictly disabled
                    if not cf_adapter or not cf_adapter.is_configured():
                        err_msg = (
                            f"[Cloudflare AI Error] Missing credentials for live inference on model '{model_id}'. "
                            f"CLOUDFLARE_INFERENCE_MODE is '{cf_mode}'. Silent fallback to mock placeholder canvas is strictly disabled. "
                            f"Please check CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in backend .env."
                        )
                        print(f"[AI Bridge Worker Error] {err_msg}")
                        self.fail_job(job_id, err_msg)
                        return

                    print(f"[AI Bridge Worker] Routing '{model_id}' to Cloudflare Workers AI pipeline (LIVE mode)...")
                    self.report_progress(job_id, 30, 2, steps or 4, f"Synthesizing with Cloudflare Workers AI ({model_id})...")
                    try:
                        cf_res = cf_adapter.generate(
                            prompt=prompt,
                            model_id=model_id,
                            aspect_ratio=aspect_ratio,
                            width=width,
                            height=height,
                            steps=steps,
                            seed=seed,
                            output_dir=self.uploads_dir,
                            job_id=job_id
                        )
                        result = {
                            "success": True,
                            "file_path": cf_res["file_path"],
                            "dimensions": cf_res["dimensions"],
                            "latency_seconds": cf_res["latency_seconds"]
                        }
                    except Exception as cf_err:
                        err_msg = str(cf_err)
                        print(f"[AI Bridge Worker Error] Cloudflare inference failed: {err_msg}")
                        self.fail_job(job_id, err_msg)
                        return
                else:
                    # Explicit development mock mode
                    print(f"[AI Bridge Worker] Model '{model_id}' executing in explicit mock mode (CLOUDFLARE_INFERENCE_MODE='mock')...")
                    result = self.worker.execute_job(
                        task=engine_task,
                        prompt=prompt,
                        model=engine_model,
                        aspect_ratio=aspect_ratio,
                        width=width,
                        height=height,
                        steps=steps,
                        seed=seed,
                        upscale=upscale,
                        progress_callback=on_step_progress
                    )
            else:
                # Non-Cloudflare models (e.g. z-image-turbo, wan-2.1-video-720p)
                result = self.worker.execute_job(
                    task=engine_task,
                    prompt=prompt,
                    model=engine_model,
                    aspect_ratio=aspect_ratio,
                    width=width,
                    height=height,
                    steps=steps,
                    seed=seed,
                    upscale=upscale,
                    progress_callback=on_step_progress,
                    job_id=job_id,
                    output_dir=self.uploads_dir
                )

            if not result.get("success"):
                error_msg = result.get("error") or "AI Pipeline failed to generate media"
                print(f"[AI Bridge Worker] Generation failed: {error_msg}")
                self.fail_job(job_id, error_msg)
                return

            source_file = Path(result["file_path"])
            media_type = "VIDEO" if "video" in engine_task else "IMAGE"
            dimensions = result.get("dimensions")
            if not dimensions:
                if width and height:
                    dimensions = f"{width}x{height}"
                else:
                    try:
                        from processors.aspect_ratio import AspectRatioProcessor
                        w, h = AspectRatioProcessor.get_dimensions(aspect_ratio)
                        dimensions = f"{w}x{h}"
                    except Exception:
                        dimensions = "1024x1024"
            latency_ms = int(result.get("latency_seconds", 1.5) * 1000)
            storage_path = None
            file_size = source_file.stat().st_size

            # 1. Primary Storage: Attempt Cloudinary upload if configured
            if CloudinaryStorage.is_configured():
                self.report_progress(job_id, 92, steps or 4, steps or 4, "Uploading media asset to Cloudinary CDN...")
                print(f"[AI Bridge Worker] Uploading generated {media_type.lower()} to Cloudinary...")
                cloud_res = CloudinaryStorage.upload_media(
                    file_path=str(source_file),
                    media_type=media_type,
                    public_id=f"kiaan_{engine_task.replace('-', '_')}_{job_id}"
                )
                if cloud_res.get("success") and cloud_res.get("secure_url"):
                    storage_path = cloud_res["secure_url"]
                    if cloud_res.get("dimensions"):
                        dimensions = cloud_res["dimensions"]
                    if cloud_res.get("bytes"):
                        file_size = cloud_res["bytes"]
                    print(f"[AI Bridge Worker] Asset uploaded to Cloudinary: {storage_path}")
                else:
                    print(f"[AI Bridge Worker Warning] Cloudinary upload failed ({cloud_res.get('error')}). Using local fallback.")

            # 2. Local Fallback: Persist locally if Cloudinary is not configured or upload encountered an error
            if not storage_path:
                if source_file.parent == self.uploads_dir and source_file.name.startswith(f"gen_{job_id}_"):
                    dest_path = source_file
                    dest_filename = source_file.name
                else:
                    dest_filename = f"gen_{job_id}_{source_file.name}"
                    dest_path = self.uploads_dir / dest_filename
                    shutil.copy2(str(source_file), str(dest_path))
                storage_path = f"/uploads/generations/{dest_filename}"
                file_size = dest_path.stat().st_size
                print(f"[AI Bridge Worker] Asset persisted locally (fallback): {dest_path}")

            asset_record = {
                "storagePath": storage_path,
                "thumbnailPath": storage_path,
                "dimensions": dimensions,
                "fileSizeBytes": file_size,
                "mediaType": media_type
            }

            comp_res = self.complete_job(job_id, latency_ms, [asset_record])
            print(f"[AI Bridge Worker] Job #{job_id} COMPLETED SUCCESSFULLY! (Backend response: {comp_res is not None})")

        except Exception as e:
            print(f"[AI Bridge Worker Exception] Error executing job: {e}")
            self.fail_job(job_id, str(e))

    def run_forever(self):
        """
        Main worker polling loop.
        """
        print("\n[AI Bridge Worker] Active and listening for incoming backend generation jobs...")
        print("Press Ctrl+C to stop.\n")
        
        last_heartbeat = 0
        was_offline = False
        
        while True:
            try:
                # Periodic Heartbeat every 30 seconds
                now = time.time()
                if now - last_heartbeat > 30:
                    self.send_heartbeat()
                    last_heartbeat = now

                # Claim job
                job = self.claim_next_job()
                if was_offline:
                    print(f"\n[AI Bridge Worker] SUCCESS: Connected to Backend at {self.backend_url}!")
                    print("[AI Bridge Worker] Worker node is active and waiting for generations...\n")
                    was_offline = False

                if job:
                    self.process_job(job)
                else:
                    time.sleep(self.poll_interval)

            except BackendOfflineError:
                if not was_offline:
                    print(f"\n[AI Bridge Worker] Backend server is not running on {self.backend_url}.")
                    print(f"[AI Bridge Worker] Please start the backend with 'npm run dev' inside Kiaan-ai-image-generator-backend.")
                    print(f"[AI Bridge Worker] Waiting for backend to come online (retrying every 3s)...")
                    was_offline = True
                time.sleep(3.0)

            except KeyboardInterrupt:
                print("\n[AI Bridge Worker] Stopping worker cleanly...")
                break
            except Exception as e:
                print(f"[AI Bridge Worker Loop Warning] {e}")
                time.sleep(self.poll_interval)


def main():
    parser = argparse.ArgumentParser(description="Kiaan AI Engine Backend Bridge Worker")
    parser.add_argument("--backend-url", type=str, default=os.environ.get("BACKEND_URL", "http://localhost:5001/api/v1"),
                        help="Backend API base URL")
    parser.add_argument("--worker-secret", type=str, default=os.environ.get("WORKER_SECRET", "kiaan_worker_secret_dev_2026"),
                        help="Worker authorization pre-shared secret")
    parser.add_argument("--worker-node-id", type=str, default=os.environ.get("WORKER_NODE_ID", "ai-engine-worker-1"),
                        help="Unique GPU/CPU worker node name")
    parser.add_argument("--mode", type=str, default=os.environ.get("KIAAN_AI_MODE", "mock"),
                        choices=["mock", "cuda"], help="Inference mode ('mock' or 'cuda')")
    parser.add_argument("--poll-interval", type=float, default=1.5,
                        help="Queue polling frequency in seconds")
    parser.add_argument("--uploads-dir", type=str, default=None,
                        help="Path to backend uploads/generations directory")

    args = parser.parse_args()

    worker = BackendBridgeWorker(
        backend_url=args.backend_url,
        worker_secret=args.worker_secret,
        worker_node_id=args.worker_node_id,
        poll_interval=args.poll_interval,
        execution_mode=args.mode,
        backend_uploads_dir=args.uploads_dir
    )

    worker.run_forever()


if __name__ == "__main__":
    main()
