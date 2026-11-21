# Kiaan Studio - AI Generation Engine

This directory contains the standalone, decoupled AI Engine for **Kiaan Studio**, supporting self-hosted open-weight generative models under **Apache 2.0** commercial licensing.

---

## 1. Supported Models & Quality Targets

| Model Identifier | Model Architecture | Parameters | Modality | Default Steps | Precision | Target Hardware |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`flux_klein`** | FLUX.2 Klein (Black Forest Labs) | 4.0 Billion | Text-to-Image / Image-to-Image | 4 steps (Rectified Flow) | FP8 / BF16 | RTX 4090 (24GB) / A10G |
| **`z_image`** | Z-Image Turbo (Alibaba Tongyi Lab) | 6.0 Billion | Text-to-Image (Typography) | 8 steps (S3-DiT) | FP8 / BF16 | RTX 4090 (24GB) |
| **`wan_video`** | Wan 2.2 / 2.1 (Alibaba Wan-AI) | 1.3B – 14.0B | Text-to-Video / Image-to-Video | 40 steps (3D DiT) | BF16 / FP8 | RTX 4090 / A100 80GB |

---

## 2. Dual-Mode Architecture

The engine features a built-in **Dual-Mode Switch**:
* **`mock` Mode (Default for Local Development):** Executes complete end-to-end mathematical bucketing, safety validation, step progress simulation, and local file outputs without requiring an NVIDIA GPU or risking out-of-memory crashes.
* **`cuda` Mode (Production GPU Cloud):** Loads full PyTorch weights and Hugging Face Diffusers pipelines on NVIDIA GPUs with CUDA 12.x and FlashAttention.

---

## 3. How to Run the AI Engine (CLI Interface)

### Generate Text-to-Image (FLUX.2 Klein 4B with 16:9 Aspect Ratio)
```powershell
python ai-engine/run_engine.py --task text-to-image --prompt "Futuristic astronaut in deep space" --aspect 16:9 --model flux_klein
```

### Generate Z-Image Turbo (Typography & Packshots with 9:16 Portrait)
```powershell
python ai-engine/run_engine.py --task text-to-image --prompt "Bold neon typography poster" --aspect 9:16 --model z_image
```

### Generate Cinematic Video (Wan 2.2 5s 16:9)
```powershell
python ai-engine/run_engine.py --task text-to-video --prompt "Drone flyover above tropical waterfall at sunset" --aspect 16:9 --model wan_video
```

### Upscale an Existing Image (2x or 4x Super-Resolution)
```powershell
python ai-engine/run_engine.py --task upscale --input-image "ai-engine/outputs/your_image.webp" --scale 2
```

### View Model Registry & Aspect Ratio Presets
```powershell
python ai-engine/run_engine.py --task info
```

---

## 4. Automated Testing & Benchmarks

Run mathematical aspect ratio validation and prompt safety tests:
```powershell
python ai-engine/tests/test_aspect_ratios.py
```

Run latency and VRAM benchmarking across all 3 models:
```powershell
python ai-engine/tests/benchmark_runner.py
```

---

## 5. Connecting with Node.js / BullMQ Backend

When the Node.js/Express backend is ready:
1. Ensure your Redis server is running.
2. The Node.js API will push jobs into `bull:queue:image` and `bull:queue:video`.
3. Launch `workers/queue_worker.py` to listen and process incoming queue jobs:
   ```powershell
   python ai-engine/workers/queue_worker.py
   ```
4. The worker will pick up jobs, report progress to Redis Pub/Sub, and write completed assets to storage.
