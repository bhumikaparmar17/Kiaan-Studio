"""
Kiaan Studio - AI Engine Global Configuration & Hardware Presets
Configures models, execution modes (mock vs cuda), resolution buckets, and VRAM limits.
"""

import os
from pathlib import Path

# Base Paths
ENGINE_ROOT = Path(__file__).parent.resolve()
OUTPUTS_DIR = ENGINE_ROOT / "outputs"
PRESETS_DIR = ENGINE_ROOT / "presets"

# Ensure runtime directories exist
OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
PRESETS_DIR.mkdir(parents=True, exist_ok=True)

# Execution Mode: 'mock' for local dev (zero-GPU) or 'cuda' for NVIDIA GPU
EXECUTION_MODE = os.environ.get("KIAAN_AI_MODE", "mock").lower()

# Supported Model Registry & Licensing Compliance (Apache 2.0 Open Weights)
MODEL_REGISTRY = {
    "flux_klein": {
        "id": "flux_klein",
        "name": "FLUX.2 Klein 4B",
        "repo_id": "black-forest-labs/FLUX.2-klein-4B",
        "type": "image",
        "license": "Apache 2.0",
        "default_steps": 4,
        "max_steps": 12,
        "guidance_scale": 3.5,
        "precision": "fp8",
        "vram_required_gb": 14,
        "description": "Distilled Rectified Flow Transformer. Sub-second 1024x1024 photorealistic inference."
    },
    "z_image": {
        "id": "z_image",
        "name": "Z-Image Turbo",
        "repo_id": "Tongyi-MAI/Z-Image-Turbo",
        "type": "image",
        "license": "Apache 2.0",
        "default_steps": 8,
        "max_steps": 16,
        "guidance_scale": 4.0,
        "precision": "fp8",
        "vram_required_gb": 16,
        "description": "S3-DiT Spatial-Semantic Diffusion Transformer. High aesthetic layout & typography."
    },
    "wan_video": {
        "id": "wan_video",
        "name": "Wan 2.2 / 2.1 Video",
        "repo_id": "Wan-AI/Wan2.1-T2V-1.3B",
        "cinema_repo_id": "Wan-AI/Wan2.2-T2V-A14B",
        "type": "video",
        "license": "Apache 2.0",
        "default_steps": 40,
        "fps": 16,
        "duration_seconds": 5,
        "total_frames": 81,
        "precision": "bf16",
        "vram_required_gb": 24,
        "description": "3D Causal Spatio-Temporal DiT. Cinematic 5-second continuous motion."
    }
}

# Standard Dimension Buckets (multiples of 64 for VAE & DiT patch alignment)
ASPECT_RATIO_BUCKETS = {
    "1:1": {"width": 1024, "height": 1024, "name": "Square (Social Feed & Avatar)"},
    "16:9": {"width": 1344, "height": 768, "name": "Landscape (Cinema & Desktop)"},
    "9:16": {"width": 768, "height": 1344, "name": "Portrait (Stories, Reels & TikTok)"},
    "4:3": {"width": 1152, "height": 864, "name": "Standard Editorial"},
    "3:4": {"width": 864, "height": 1152, "name": "Portrait Editorial"},
    "21:9": {"width": 1536, "height": 640, "name": "Cinematic Ultrawide Banner"}
}

# Default Quality Presets
QUALITY_PRESETS = {
    "fast": {"steps": 4, "denoise": 0.7, "upscale": False},
    "standard": {"steps": 8, "denoise": 0.8, "upscale": False},
    "hd": {"steps": 12, "denoise": 0.85, "upscale": True, "scale_factor": 2},
    "ultra_4k": {"steps": 16, "denoise": 0.9, "upscale": True, "scale_factor": 4}
}

# Redis & Queue Settings (For connecting with Node.js / BullMQ later)
REDIS_HOST = os.environ.get("REDIS_HOST", "127.0.0.1")
REDIS_PORT = int(os.environ.get("REDIS_PORT", 6379))
IMAGE_QUEUE_NAME = "bull:queue:image"
VIDEO_QUEUE_NAME = "bull:queue:video"

# Cloudinary Storage Settings (Primary Media Storage Provider)
CLOUDINARY_CLOUD_NAME = os.environ.get("CLOUDINARY_CLOUD_NAME", "")
CLOUDINARY_API_KEY = os.environ.get("CLOUDINARY_API_KEY", "")
CLOUDINARY_API_SECRET = os.environ.get("CLOUDINARY_API_SECRET", "")
CLOUDINARY_FOLDER = os.environ.get("CLOUDINARY_FOLDER", "kiaan_generations")
