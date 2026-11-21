"""
Cloudflare Workers AI Pipeline Adapter for Kiaan Studio
Provides unified hosted inference for FLUX.2 Klein 4B and FLUX.1 Schnell.
"""

import os
import json
import base64
import time
from pathlib import Path
from typing import Dict, Any, Optional

try:
    import urllib.request
    import urllib.error
except ImportError:
    pass

ENGINE_ROOT = Path(__file__).resolve().parent.parent
PROJECT_ROOT = ENGINE_ROOT.parent

CANDIDATE_ENV_PATHS = [
    PROJECT_ROOT / "Kiaan-ai-image-generator-backend" / ".env",
    PROJECT_ROOT / "backend" / ".env",
    PROJECT_ROOT / ".env"
]

def load_backend_env_if_missing():
    """Load credentials from backend .env if not present in os.environ"""
    if os.environ.get("CLOUDFLARE_ACCOUNT_ID") and os.environ.get("CLOUDFLARE_API_TOKEN"):
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
                if os.environ.get("CLOUDFLARE_ACCOUNT_ID") and os.environ.get("CLOUDFLARE_API_TOKEN"):
                    break
            except Exception:
                pass

class CloudflarePipelineAdapter:
    CLOUDFLARE_MODELS = {
        "flux-2-klein-4b": {
            "cf_id": "@cf/black-forest-labs/flux-2-klein-4b",
            "format": "multipart",
            "default_steps": 4
        },
        "flux_klein": {
            "cf_id": "@cf/black-forest-labs/flux-2-klein-4b",
            "format": "multipart",
            "default_steps": 4
        },
        "flux-1-schnell": {
            "cf_id": "@cf/black-forest-labs/flux-1-schnell",
            "format": "json",
            "default_steps": 4
        },
        "flux_schnell": {
            "cf_id": "@cf/black-forest-labs/flux-1-schnell",
            "format": "json",
            "default_steps": 4
        }
    }

    DIMENSIONS = {
        "1:1": (1024, 1024),
        "16:9": (1024, 576),
        "9:16": (576, 1024),
        "4:3": (1024, 768),
        "3:4": (768, 1024),
        "21:9": (1024, 448)
    }

    @classmethod
    def get_dimensions(cls, aspect_ratio: str = "1:1", width: Optional[int] = None, height: Optional[int] = None) -> tuple:
        """
        Resolves model-supported (width, height) within Cloudflare Workers AI limits (max 1024).
        Safely parses ratio strings including descriptive labels (e.g. '16:9 Landscape').
        """
        import re
        raw_str = str(aspect_ratio or "1:1").strip()
        match = re.search(r"(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)", raw_str)
        clean_aspect = f"{match.group(1)}:{match.group(2)}" if match else raw_str

        if clean_aspect in cls.DIMENSIONS:
            return cls.DIMENSIONS[clean_aspect]

        if width and height:
            try:
                w = max(256, min(1024, int(width)))
                h = max(256, min(1024, int(height)))
                return (w, h)
            except Exception:
                pass

        return cls.DIMENSIONS.get("1:1", (1024, 1024))

    def __init__(self):
        load_backend_env_if_missing()
        self.account_id = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "").strip()
        self.api_token = os.environ.get("CLOUDFLARE_API_TOKEN", "").strip()

    def is_configured(self) -> bool:
        return bool(self.account_id and self.api_token)

    def generate(
        self,
        prompt: str,
        model_id: str = "flux-2-klein-4b",
        aspect_ratio: str = "1:1",
        width: Optional[int] = None,
        height: Optional[int] = None,
        steps: Optional[int] = None,
        seed: Optional[int] = None,
        output_dir: Optional[Path] = None,
        job_id: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        if not self.is_configured():
            raise RuntimeError("Cloudflare credentials missing (CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN)")

        model_key = model_id.lower()
        cfg = self.CLOUDFLARE_MODELS.get(model_key)
        if not cfg:
            raise ValueError(f"Model '{model_id}' is not supported by Cloudflare adapter")

        cf_model = cfg["cf_id"]
        req_format = cfg["format"]
        url = f"https://api.cloudflare.com/client/v4/accounts/{self.account_id}/ai/run/{cf_model}"
        width, height = self.get_dimensions(aspect_ratio, width or kwargs.get("width"), height or kwargs.get("height"))

        start_time = time.time()
        headers = {
            "Authorization": f"Bearer {self.api_token}"
        }

        image_bytes = None

        if req_format == "multipart":
            # FLUX.2 Klein 4B: multipart/form-data
            boundary = f"----WebKitFormBoundary{int(time.time()*1000)}"
            headers["Content-Type"] = f"multipart/form-data; boundary={boundary}"

            parts = []
            parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"prompt\"\r\n\r\n{prompt}\r\n")
            parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"width\"\r\n\r\n{width}\r\n")
            parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"height\"\r\n\r\n{height}\r\n")
            if seed is not None:
                parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"seed\"\r\n\r\n{seed}\r\n")
            parts.append(f"--{boundary}--\r\n")

            body_bytes = "".join(parts).encode("utf-8")
        else:
            # FLUX.1 Schnell: application/json (prompt, steps, width, height)
            headers["Content-Type"] = "application/json"
            step_count = min(8, max(1, steps or cfg["default_steps"]))
            payload = {
                "prompt": prompt,
                "steps": step_count,
                "width": width,
                "height": height
            }
            body_bytes = json.dumps(payload).encode("utf-8")

        req = urllib.request.Request(url, data=body_bytes, headers=headers, method="POST")

        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                content_type = resp.headers.get("Content-Type", "")
                raw_data = resp.read()

                if "application/json" in content_type:
                    resp_json = json.loads(raw_data.decode("utf-8"))
                    img_b64 = resp_json.get("result", {}).get("image") or resp_json.get("image")
                    if not img_b64:
                        raise RuntimeError(f"Cloudflare response missing image: {resp_json}")
                    if "," in img_b64:
                        img_b64 = img_b64.split(",", 1)[1]
                    image_bytes = base64.b64decode(img_b64)
                else:
                    image_bytes = raw_data
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="replace")
            # Map provider-side output safety flag to clean user guidance
            if any(term in err_body.lower() for term in ["flagged", "content moderation", "safety"]):
                raise RuntimeError("The AI safety filter flagged the generated output for this prompt. Please try a different description or prompt variation. Your reserved credits have been fully refunded.")
            raise RuntimeError(f"Cloudflare API HTTP {e.code}: {err_body}")

        if not image_bytes or len(image_bytes) < 100:
            raise RuntimeError("Invalid or empty image data received from Cloudflare AI")

        # Save to disk
        out_dir = output_dir or (ENGINE_ROOT / "outputs")
        out_dir.mkdir(parents=True, exist_ok=True)
        filename = f"gen_{job_id}_{int(time.time()*1000)}.jpg" if job_id else f"cf_{int(time.time())}_{width}x{height}.jpg"
        file_path = out_dir / filename

        with open(file_path, "wb") as f:
            f.write(image_bytes)

        latency = time.time() - start_time
        return {
            "success": True,
            "file_path": str(file_path),
            "dimensions": f"{width}x{height}",
            "latency_seconds": latency,
            "model": model_id,
            "cf_model": cf_model
        }
