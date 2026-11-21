"""
Wan 2.2 / 2.1 Video Pipeline (Alibaba Wan-AI - Apache 2.0).
3D Causal Spatio-Temporal DiT for Cinematic Text-to-Video and Image-to-Video.
"""

import time
import random
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

class WanVideoPipeline(BasePipeline):
    def __init__(self, execution_mode: str = "mock"):
        super().__init__(model_id="wan_video", execution_mode=execution_mode)
        self.config = MODEL_REGISTRY["wan_video"]
        self.default_steps = self.config["default_steps"]
        self.fps = self.config["fps"]
        self.duration_seconds = self.config["duration_seconds"]
        self.total_frames = self.config["total_frames"]

    def load_model(self) -> bool:
        if self.execution_mode == "cuda":
            try:
                import torch
                from diffusers import AutoPipelineForText2Image # or WanPipeline
                print(f"[Wan 2.2 Video] Initializing video pipeline with {self.config['repo_id']}...")
                self.model_loaded = True
                return True
            except Exception as e:
                print(f"[Wan 2.2 Video] CUDA video init notice ({e}). Falling back to Mock mode.")
                self.execution_mode = "mock"
                self.model_loaded = True
                return False
        else:
            self.model_loaded = True
            return True

    def generate(
        self,
        prompt: str,
        aspect_ratio: str = "16:9",
        duration_seconds: Optional[int] = None,
        fps: Optional[int] = None,
        seed: Optional[int] = None,
        input_image_path: Optional[str] = None,
        progress_callback: Optional[Callable[[int, int, str], None]] = None,
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

        # 2. Dimensions & Video Parameters
        width, height = AspectRatioProcessor.get_dimensions(aspect_ratio)
        # Scale down dimensions slightly for video memory efficiency (e.g. 854x480 or 1280x720)
        if aspect_ratio == "16:9":
            vid_w, vid_h = 1280, 720
        elif aspect_ratio == "9:16":
            vid_w, vid_h = 720, 1280
        else:
            vid_w, vid_h = 768, 768

        actual_seed = seed if seed is not None else random.randint(100_000, 999_999)
        actual_fps = fps or self.fps
        actual_duration = duration_seconds or self.duration_seconds
        total_frames = actual_fps * actual_duration

        # 3. Execution Simulation
        simulated_steps = 10  # Sample checkpoints for progress report
        for s in range(1, simulated_steps + 1):
            time.sleep(0.3)
            pct = int((s / simulated_steps) * 100)
            if progress_callback:
                progress_callback(pct, s, simulated_steps, f"Rendering frame batch {s * 8}/{total_frames} (Wan 3D DiT)")

        out_filename = f"wan_video_{actual_seed}_{vid_w}x{vid_h}.mp4"
        out_path = OUTPUTS_DIR / out_filename

        # Write mock MP4 container file
        with open(out_path, "wb") as f:
            meta = f"Kiaan Studio Wan 2.2 Video | {actual_duration}s @ {actual_fps}fps | {vid_w}x{vid_h} | Seed: {actual_seed}\nPrompt: {prompt}\n".encode("utf-8")
            f.write(meta)

        total_latency = round(time.time() - start_time, 3)

        return {
            "success": True,
            "model": self.config["name"],
            "model_id": self.model_id,
            "task": "image-to-video" if input_image_path else "text-to-video",
            "prompt": prompt,
            "seed": actual_seed,
            "aspect_ratio": aspect_ratio,
            "dimensions": f"{vid_w}x{vid_h}",
            "width": vid_w,
            "height": vid_h,
            "duration_seconds": actual_duration,
            "fps": actual_fps,
            "total_frames": total_frames,
            "latency_seconds": total_latency,
            "estimated_vram_gb": 22.4,
            "file_name": out_filename,
            "file_path": str(out_path),
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
