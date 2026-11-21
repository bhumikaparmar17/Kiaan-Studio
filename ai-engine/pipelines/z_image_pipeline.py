"""
Z-Image Turbo Pipeline (Alibaba Tongyi Lab - Apache 2.0).
Scalable Spatial-Semantic DiT (S3-DiT) optimized for typography and packshots.
Powered by WaveSpeed AI production API inference.
"""

import os
import json
import time
import random
from pathlib import Path
from typing import Dict, Any, Callable, Optional

try:
    import urllib.request
    import urllib.error
except ImportError:
    pass

try:
    from config import MODEL_REGISTRY, OUTPUTS_DIR
    from processors.aspect_ratio import AspectRatioProcessor
    from processors.safety_checker import SafetyChecker
    from pipelines.base_pipeline import BasePipeline
except (ImportError, ValueError):
    from ..config import MODEL_REGISTRY, OUTPUTS_DIR
    from ..processors.aspect_ratio import AspectRatioProcessor
    from ..processors.safety_checker import SafetyChecker
    from .base_pipeline import BasePipeline

ENGINE_ROOT = Path(__file__).resolve().parent.parent
PROJECT_ROOT = ENGINE_ROOT.parent

CANDIDATE_ENV_PATHS = [
    PROJECT_ROOT / "Kiaan-ai-image-generator-backend" / ".env",
    PROJECT_ROOT / "backend" / ".env",
    PROJECT_ROOT / ".env"
]

def load_backend_env_if_missing():
    """Load credentials from backend .env if not present in os.environ"""
    if os.environ.get("WAVESPEED_API_KEY"):
        return

    for env_path in CANDIDATE_ENV_PATHS:
        if env_path.exists():
            try:
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k, v = k.strip(), v.strip()
                            if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
                                v = v[1:-1]
                            if k not in os.environ:
                                os.environ[k] = v
                if os.environ.get("WAVESPEED_API_KEY"):
                    break
            except Exception:
                pass


class ZImagePipeline(BasePipeline):
    def __init__(self, execution_mode: str = "wavespeed"):
        super().__init__(model_id="z_image", execution_mode=execution_mode)
        self.config = MODEL_REGISTRY["z_image"]
        self.default_steps = self.config["default_steps"]
        load_backend_env_if_missing()
        self.api_key = os.environ.get("WAVESPEED_API_KEY", "").strip()

    @staticmethod
    def parse_seed(raw_seed: Any) -> Optional[int]:
        """
        Safely parses and normalizes a seed value to a valid integer.
        Handles numeric strings, floats, missing, empty, and out-of-range values.
        Returns a valid non-negative integer or None if unparseable/missing.
        """
        if raw_seed is None:
            return None
        if isinstance(raw_seed, bool):
            return None
        if isinstance(raw_seed, int):
            parsed = raw_seed
        elif isinstance(raw_seed, float):
            parsed = int(raw_seed)
        elif isinstance(raw_seed, str):
            clean = raw_seed.strip()
            if not clean or clean.lower() in ("none", "null", "undefined", "random"):
                return None
            try:
                parsed = int(float(clean))
            except (ValueError, OverflowError):
                return None
        else:
            return None

        # Clamp/wrap to standard 32-bit unsigned integer range (0 to 2^32 - 1)
        if parsed < 0:
            parsed = abs(parsed)
        max_seed = 2**32 - 1
        if parsed > max_seed:
            parsed = parsed % max_seed
        return int(parsed)

    def is_wavespeed_configured(self) -> bool:
        """Returns True if WaveSpeed API key is present and configured"""
        return bool(self.api_key and len(self.api_key) > 5)

    def load_model(self) -> bool:
        if self.is_wavespeed_configured():
            print("[Z-Image Turbo] WaveSpeed AI hosted inference pipeline active.")
            self.model_loaded = True
            return True
        elif self.execution_mode == "cuda":
            try:
                import torch
                from diffusers import AutoPipelineForText2Image
                print(f"[Z-Image Turbo] Loading weights from {self.config['repo_id']} in FP8...")
                self.pipeline = AutoPipelineForText2Image.from_pretrained(
                    self.config["repo_id"],
                    torch_dtype=torch.float8_e4m3fn if hasattr(torch, "float8_e4m3fn") else torch.bfloat16
                )
                self.pipeline.enable_model_cpu_offload()
                self.model_loaded = True
                return True
            except Exception as e:
                print(f"[Z-Image Turbo] CUDA load warning ({e}). Falling back to Mock mode.")
                self.execution_mode = "mock"
                self.model_loaded = True
                return False
        else:
            self.model_loaded = True
            return True

    def _generate_wavespeed(
        self,
        prompt: str,
        width: int,
        height: int,
        actual_steps: int,
        actual_seed: int,
        aspect_ratio: str,
        out_path: Path,
        start_time: float,
        progress_callback: Optional[Callable[[int, int, str], None]] = None
    ) -> Dict[str, Any]:
        """
        Executes real Z-Image Turbo inference via WaveSpeed AI API.
        """
        submit_url = "https://api.wavespeed.ai/api/v3/wavespeed-ai/z-image/turbo"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "prompt": prompt,
            "size": f"{width}*{height}",
            "strength": 0.6,
            "output_format": "jpeg"
        }
        validated_seed = self.parse_seed(actual_seed)
        if validated_seed is not None:
            payload["seed"] = validated_seed

        if progress_callback:
            progress_callback(15, 1, actual_steps, "Submitting task to WaveSpeed AI...")

        req = urllib.request.Request(
            submit_url,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST"
        )

        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                resp_data = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="replace")
            if any(term in err_body.lower() for term in ["flagged", "content moderation", "safety", "nsfw"]):
                raise RuntimeError("The AI safety filter flagged the generated output for this prompt. Please try a different description or prompt variation. Your reserved credits have been fully refunded.")
            raise RuntimeError(f"WaveSpeed API HTTP {e.code}: {err_body}")

        task = resp_data.get("data") if isinstance(resp_data, dict) and "data" in resp_data else resp_data
        prediction_id = task.get("id") if isinstance(task, dict) else None

        if not prediction_id:
            raise RuntimeError(f"WaveSpeed task ID missing in response: {resp_data}")

        print(f"[Z-Image Turbo] WaveSpeed task submitted: {prediction_id}")
        if progress_callback:
            progress_callback(30, 2, actual_steps, f"WaveSpeed task queued ({prediction_id})...")

        result_url = f"https://api.wavespeed.ai/api/v3/predictions/{prediction_id}/result"
        poll_headers = {
            "Authorization": f"Bearer {self.api_key}"
        }

        # Poll for completion (up to ~120 attempts, ~1.5s apart)
        completed_result = None
        for attempt in range(1, 121):
            time.sleep(1.5)
            poll_req = urllib.request.Request(result_url, headers=poll_headers, method="GET")
            try:
                with urllib.request.urlopen(poll_req, timeout=20) as poll_resp:
                    body = json.loads(poll_resp.read().decode("utf-8"))
            except urllib.error.HTTPError as e:
                err_body = e.read().decode("utf-8", errors="replace")
                print(f"[Z-Image Turbo Warning] Polling HTTP {e.code}: {err_body}")
                continue

            result = body.get("data") if isinstance(body, dict) and "data" in body else body
            status = result.get("status") if isinstance(result, dict) else None

            # Smooth progress reporting
            pct = min(85, 30 + attempt * 5)
            step_num = min(actual_steps - 1, 2 + int(attempt / 2))
            if progress_callback:
                progress_callback(pct, step_num, actual_steps, f"WaveSpeed AI synthesizing ({status or 'processing'})...")

            if status == "completed":
                completed_result = result
                break

            if status in ["failed", "cancelled", "timeout", "deleted"]:
                err_details = result.get("error") or status
                raise RuntimeError(f"WaveSpeed generation ended with status '{status}': {err_details}")

        if not completed_result:
            raise RuntimeError("WaveSpeed polling timeout reached before completion.")

        if progress_callback:
            progress_callback(90, actual_steps, actual_steps, "Downloading high-resolution JPEG asset...")

        outputs = completed_result.get("outputs")
        if not outputs:
            raise RuntimeError(f"WaveSpeed completed but returned empty outputs: {completed_result}")

        image_url = outputs[0] if isinstance(outputs, list) else str(outputs)
        print(f"[Z-Image Turbo] Downloading WaveSpeed image from: {image_url}")

        img_req = urllib.request.Request(image_url, headers={"User-Agent": "KiaanStudio/1.0"})
        with urllib.request.urlopen(img_req, timeout=60) as img_resp:
            image_bytes = img_resp.read()

        if not image_bytes or len(image_bytes) < 100:
            raise RuntimeError("Downloaded WaveSpeed image is empty or invalid")

        with open(out_path, "wb") as f:
            f.write(image_bytes)

        total_latency = round(time.time() - start_time, 3)
        print(f"[Z-Image Turbo] Real WaveSpeed image saved successfully: {out_path} ({len(image_bytes)} bytes in {total_latency}s)")

        return {
            "success": True,
            "model": self.config["name"],
            "model_id": self.model_id,
            "task": "text-to-image",
            "prompt": prompt,
            "seed": actual_seed,
            "aspect_ratio": aspect_ratio,
            "dimensions": f"{width}x{height}",
            "width": width,
            "height": height,
            "steps": actual_steps,
            "latency_seconds": total_latency,
            "file_name": out_path.name,
            "file_path": str(out_path),
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "source": "wavespeed"
        }

    def generate(
        self,
        prompt: str,
        aspect_ratio: str = "1:1",
        width: Optional[int] = None,
        height: Optional[int] = None,
        steps: Optional[int] = None,
        seed: Optional[int] = None,
        guidance_scale: Optional[float] = None,
        progress_callback: Optional[Callable[[int, int, str], None]] = None,
        job_id: Optional[str] = None,
        output_dir: Optional[Path] = None,
        **kwargs
    ) -> Dict[str, Any]:
        start_time = time.time()

        # 1. Pre-Inference Safety Check
        safety = SafetyChecker.check_prompt(prompt)
        if not safety["safe"]:
            return {
                "success": False,
                "error": safety["reason"],
                "flagged": safety["flagged_categories"]
            }

        # 2. Dimensions & Aspect Ratio Math
        req_width = width or kwargs.get("width")
        req_height = height or kwargs.get("height")
        if req_width and req_height:
            try:
                rw = int(req_width)
                rh = int(req_height)
                val = AspectRatioProcessor.validate_dimensions(rw, rh)
                if val["valid"]:
                    resolved_width, resolved_height = rw, rh
                else:
                    resolved_width, resolved_height = AspectRatioProcessor.get_dimensions(aspect_ratio)
            except Exception:
                resolved_width, resolved_height = AspectRatioProcessor.get_dimensions(aspect_ratio)
        else:
            resolved_width, resolved_height = AspectRatioProcessor.get_dimensions(aspect_ratio)

        width, height = resolved_width, resolved_height
        actual_steps = steps or self.default_steps
        parsed_seed = self.parse_seed(seed)
        actual_seed = parsed_seed if parsed_seed is not None else random.randint(100_000, 999_999)

        out_dir = Path(output_dir).resolve() if output_dir else OUTPUTS_DIR
        out_dir.mkdir(parents=True, exist_ok=True)
        timestamp = int(time.time() * 1000)
        out_filename = f"gen_{job_id}_{timestamp}.jpg" if job_id else f"z_image_{actual_seed}_{width}x{height}.jpg"
        out_path = out_dir / out_filename

        # 3. Execution (WaveSpeed AI Primary Hosted Pipeline)
        inference_mode = os.environ.get("WAVESPEED_INFERENCE_MODE", "live").lower().strip()

        if self.is_wavespeed_configured() and inference_mode != "mock":
            # Real WaveSpeed AI Hosted Inference
            return self._generate_wavespeed(
                prompt=prompt,
                width=width,
                height=height,
                actual_steps=actual_steps,
                actual_seed=actual_seed,
                aspect_ratio=aspect_ratio,
                out_path=out_path,
                start_time=start_time,
                progress_callback=progress_callback
            )

        if not self.is_wavespeed_configured() and inference_mode != "mock" and self.execution_mode != "cuda":
            # Strict fail-closed: Do NOT silently generate mock canvas when key is missing in live mode
            raise RuntimeError(
                "[Z-Image Turbo Error] WAVESPEED_API_KEY is missing from backend .env. "
                "Real WaveSpeed AI inference cannot proceed and mock generation is disabled."
            )

        if self.execution_mode == "cuda" and self.pipeline:
            import torch
            generator = torch.Generator("cuda").manual_seed(actual_seed)
            result = self.pipeline(
                prompt=prompt,
                width=width,
                height=height,
                num_inference_steps=actual_steps,
                guidance_scale=guidance_scale or self.config["guidance_scale"],
                generator=generator
            )
            output_image = result.images[0]
            output_image.save(out_path, format="JPEG", quality=95)
            vram_peak_gb = round(torch.cuda.max_memory_allocated() / (1024 ** 3), 2)
        else:
            # High-fidelity Local Mock Generation (only if explicit mock mode requested)
            mock_filename = f"z_image_{actual_seed}_{width}x{height}.webp"
            mock_path = out_dir / mock_filename
            step_delay = 0.20
            for s in range(1, actual_steps + 1):
                time.sleep(step_delay)
                pct = int((s / actual_steps) * 100)
                if progress_callback:
                    progress_callback(pct, s, actual_steps, f"Step {s}/{actual_steps} - S3-DiT Spatial Attention")

            self._create_mock_canvas(mock_path, width, height, prompt, actual_seed, aspect_ratio)
            out_path = mock_path
            out_filename = mock_filename
            vram_peak_gb = 15.2

        total_latency = round(time.time() - start_time, 3)

        return {
            "success": True,
            "model": self.config["name"],
            "model_id": self.model_id,
            "task": "text-to-image",
            "prompt": prompt,
            "seed": actual_seed,
            "aspect_ratio": aspect_ratio,
            "dimensions": f"{width}x{height}",
            "width": width,
            "height": height,
            "steps": actual_steps,
            "guidance_scale": guidance_scale or self.config["guidance_scale"],
            "latency_seconds": total_latency,
            "estimated_vram_gb": vram_peak_gb if 'vram_peak_gb' in locals() else None,
            "file_name": out_filename,
            "file_path": str(out_path),
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }

    def _create_mock_canvas(self, path: Path, width: int, height: int, prompt: str, seed: int, aspect: str):
        try:
            from PIL import Image, ImageDraw
            img = Image.new("RGB", (width, height), color=(18, 12, 28))
            draw = ImageDraw.Draw(img)

            border_color = (60, 30, 85)
            draw.rectangle([(20, 20), (width - 20, height - 20)], outline=border_color, width=2)

            badge_text = f"Z-Image Turbo | {aspect} ({width}x{height}) | Seed: {seed}"
            draw.text((40, 40), badge_text, fill=(236, 72, 153))

            prompt_preview = prompt if len(prompt) < 100 else prompt[:97] + "..."
            draw.text((40, 70), f"Typography Prompt: {prompt_preview}", fill=(241, 245, 249))

            img.save(path, format="WEBP", quality=95)
        except ImportError:
            with open(path, "wb") as f:
                header = f"Kiaan AI Z-Image Turbo | {width}x{height} | Seed: {seed}\nPrompt: {prompt}\n".encode("utf-8")
                f.write(header)

