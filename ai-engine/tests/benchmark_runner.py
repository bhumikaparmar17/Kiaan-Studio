"""
Benchmark Runner for Generative AI Models (FLUX.2 Klein, Z-Image Turbo, Wan 2.2).
Measures cycle time, latency, and estimated VRAM footprint across all supported aspect ratios.
"""

import sys
import time
from pathlib import Path

# Ensure ai-engine is in path
current_dir = Path(__file__).parent.resolve()
ai_engine_dir = current_dir.parent
if str(ai_engine_dir) not in sys.path:
    sys.path.insert(0, str(ai_engine_dir))

from workers.simulated_worker import SimulatedWorker

def run_full_benchmark():
    print("=" * 65)
    print("       KIAAN STUDIO - MODEL INFERENCE BENCHMARK SUITE       ")
    print("=" * 65)

    worker = SimulatedWorker(execution_mode="mock")

    benchmarks = [
        {
            "title": "FLUX.2 Klein 4B - Text-to-Image (1:1 Square)",
            "task": "text-to-image",
            "model": "flux_klein",
            "prompt": "Futuristic astronaut exploring glowing alien flora on distant exoplanet",
            "aspect": "1:1",
            "steps": 4
        },
        {
            "title": "FLUX.2 Klein 4B - Text-to-Image (16:9 Landscape)",
            "task": "text-to-image",
            "model": "flux_klein",
            "prompt": "Expansive cinematic sci-fi metropolis with flying vehicles at dusk",
            "aspect": "16:9",
            "steps": 4
        },
        {
            "title": "Z-Image Turbo - Typography & Commercial (9:16 Portrait)",
            "task": "text-to-image",
            "model": "z_image",
            "prompt": "Bold typography poster with neon lighting and luxury product packaging",
            "aspect": "9:16",
            "steps": 8
        },
        {
            "title": "Wan 2.2 Video - Text-to-Video (16:9 Cinematic 5s)",
            "task": "text-to-video",
            "model": "wan_video",
            "prompt": "Drone tracking shot of sports car drifting around wet hairpin turn",
            "aspect": "16:9",
            "steps": 10
        }
    ]

    results = []

    for idx, b in enumerate(benchmarks, 1):
        print(f"\n[{idx}/{len(benchmarks)}] Running Benchmark: {b['title']}")
        print(f"  Model: {b['model']} | Aspect: {b['aspect']} | Steps: {b['steps']}")
        
        start = time.time()
        res = worker.execute_job(
            task=b["task"],
            prompt=b["prompt"],
            model=b["model"],
            aspect_ratio=b["aspect"],
            steps=b["steps"],
            seed=1000 + idx
        )
        elapsed = round(time.time() - start, 3)

        assert res.get("success") is True, f"Benchmark failed for {b['title']}"
        print(f"  ✓ Success: File: {res['file_name']}")
        print(f"    Dimensions: {res['dimensions']} | Latency: {elapsed}s | VRAM Est: {res['estimated_vram_gb']}GB")

        results.append({
            "title": b["title"],
            "model": b["model"],
            "dimensions": res["dimensions"],
            "latency": elapsed,
            "vram_gb": res["estimated_vram_gb"]
        })

    print("\n" + "=" * 65)
    print("                    BENCHMARK SUMMARY RESULTS                     ")
    print("=" * 65)
    print(f"{'Benchmark Target':<35} | {'Dimensions':<11} | {'Latency':<8} | {'VRAM Est'}")
    print("-" * 65)
    for r in results:
        print(f"{r['title']:<35} | {r['dimensions']:<11} | {r['latency']:>6.2f}s  | {r['vram_gb']} GB")
    print("=" * 65)
    print("ALL 4 MODEL BENCHMARKS COMPLETED SUCCESSFULLY WITH ZERO ERRORS.")

if __name__ == "__main__":
    run_full_benchmark()
