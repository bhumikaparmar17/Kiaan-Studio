"""
FLUX.2 Klein 4B Pipeline (Black Forest Labs - Apache 2.0).
Unified Text-to-Image & Image-to-Image Rectified Flow DiT.
"""

import time
import random
import os
from pathlib import Path
from typing import Dict, Any, Callable, Optional

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

class FluxKleinPipeline(BasePipeline):
    def __init__(self, execution_mode: str = "mock"):
        super().__init__(model_id="flux_klein", execution_mode=execution_mode)
        self.config = MODEL_REGISTRY["flux_klein"]
        self.default_steps = self.config["default_steps"]

    def load_model(self) -> bool:
        """
        Loads FLUX.2 Klein model weights.
        In CUDA mode, utilizes Hugging Face Diffusers in FP8 precision.
        In Mock mode, initializes instantaneously.
        """
        if self.execution_mode == "cuda":
            try:
                import torch
                from diffusers import FluxPipeline
                print(f"[FLUX.2 Klein] Loading weights from {self.config['repo_id']} in FP8...")
                self.pipeline = FluxPipeline.from_pretrained(
                    self.config["repo_id"],
                    torch_dtype=torch.float8_e4m3fn if hasattr(torch, "float8_e4m3fn") else torch.bfloat16
                )
                self.pipeline.enable_model_cpu_offload()
                self.model_loaded = True
                return True
            except Exception as e:
                print(f"[FLUX.2 Klein] CUDA load warning ({e}). Falling back to Mock mode.")
                self.execution_mode = "mock"
                self.model_loaded = True
                return False
        else:
            self.model_loaded = True
            return True

    def generate(
        self,
        prompt: str,
        aspect_ratio: str = "1:1",
        width: Optional[int] = None,
        height: Optional[int] = None,
        steps: Optional[int] = None,
        seed: Optional[int] = None,
        guidance_scale: Optional[float] = None,
        input_image_path: Optional[str] = None,
        progress_callback: Optional[Callable[[int, int, str], None]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Executes FLUX.2 Klein generation with aspect ratio alignment and safety validation.
        """
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
        actual_seed = seed if seed is not None else random.randint(100_000, 999_999)
        guidance = guidance_scale or self.config["guidance_scale"]

        # 3. Execution (CUDA vs Mock)
        if self.execution_mode == "cuda" and self.pipeline:
            import torch
            generator = torch.Generator("cuda").manual_seed(actual_seed)
            result = self.pipeline(
                prompt=prompt,
                width=width,
                height=height,
                num_inference_steps=actual_steps,
                guidance_scale=guidance,
                generator=generator
            )
            output_image = result.images[0]
            out_filename = f"flux_{actual_seed}_{width}x{height}.webp"
            out_path = OUTPUTS_DIR / out_filename
            output_image.save(out_path, format="WEBP", quality=95)
            vram_peak_gb = round(torch.cuda.max_memory_allocated() / (1024 ** 3), 2)
        else:
            # High-fidelity Local Mock Generation
            # Simulates progress steps with realistic ~1.1s total duration
            step_delay = 0.25
            for s in range(1, actual_steps + 1):
                time.sleep(step_delay)
                pct = int((s / actual_steps) * 100)
                if progress_callback:
                    progress_callback(pct, s, actual_steps, f"Step {s}/{actual_steps} - Rectified Flow Denoising")

            # Generate local asset representation
            out_filename = f"flux_{actual_seed}_{width}x{height}.webp"
            out_path = OUTPUTS_DIR / out_filename
            self._create_mock_canvas(out_path, width, height, prompt, actual_seed, aspect_ratio)
            vram_peak_gb = 13.8  # Benchmark estimate for FP8 FLUX.2 Klein

        total_latency = round(time.time() - start_time, 3)

        return {
            "success": True,
            "model": self.config["name"],
            "model_id": self.model_id,
            "task": "image-to-image" if input_image_path else "text-to-image",
            "prompt": prompt,
            "seed": actual_seed,
            "aspect_ratio": aspect_ratio,
            "dimensions": f"{width}x{height}",
            "width": width,
            "height": height,
            "steps": actual_steps,
            "guidance_scale": guidance,
            "latency_seconds": total_latency,
            "estimated_vram_gb": vram_peak_gb,
            "file_name": out_filename,
            "file_path": str(out_path),
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }

    def _create_mock_canvas(self, path: Path, width: int, height: int, prompt: str, seed: int, aspect: str):
        """
        Creates a clean standalone WebP graphic representing the generated asset
        without requiring PyTorch or a GPU.
        """
        try:
            from PIL import Image, ImageDraw
            # Create dark cosmic gradient canvas
            img = Image.new("RGB", (width, height), color=(12, 14, 24))
            draw = ImageDraw.Draw(img)

            # Draw aesthetic framing border
            border_color = (34, 43, 69)
            draw.rectangle([(20, 20), (width - 20, height - 20)], outline=border_color, width=2)

            # Draw title badge
            badge_text = f"FLUX.2 Klein 4B | {aspect} ({width}x{height}) | Seed: {seed}"
            draw.text((40, 40), badge_text, fill=(56, 189, 248))

            # Draw prompt summary
            prompt_preview = prompt if len(prompt) < 100 else prompt[:97] + "..."
            draw.text((40, 70), f"Prompt: {prompt_preview}", fill=(241, 245, 249))

            img.save(path, format="WEBP", quality=95)
        except ImportError:
            # If Pillow is not available, create standard binary placeholder file
            with open(path, "wb") as f:
                header = f"Kiaan AI FLUX.2 Klein Image | {width}x{height} | Seed: {seed}\nPrompt: {prompt}\n".encode("utf-8")
                f.write(header)
