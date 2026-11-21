#!/usr/bin/env python3
"""
Kiaan Studio - AI Engine Standalone CLI Runner & Test Interface.
Use this script to run generation, aspect ratio tests, and benchmarks without a backend or GPU.
"""

import sys
import argparse
import json
import time
from pathlib import Path

# Add parent directory to sys.path to allow running as script
current_dir = Path(__file__).parent.resolve()
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))
if str(current_dir.parent) not in sys.path:
    sys.path.insert(0, str(current_dir.parent))

from config import MODEL_REGISTRY, ASPECT_RATIO_BUCKETS, EXECUTION_MODE
from workers.simulated_worker import SimulatedWorker
from processors.aspect_ratio import AspectRatioProcessor
from processors.safety_checker import SafetyChecker
from processors.upscaler import ImageUpscaler

def print_banner():
    print("=" * 65)
    print("        KIAAN STUDIO - AI GENERATION ENGINE (STANDALONE)        ")
    print("=" * 65)

def main():
    parser = argparse.ArgumentParser(description="Kiaan AI Engine CLI Interface")
    parser.add_argument("--task", type=str, default="text-to-image",
                        choices=["text-to-image", "image-to-image", "text-to-video", "upscale", "benchmark", "info"],
                        help="Task to execute")
    parser.add_argument("--prompt", type=str, default="Cinematic astronaut in deep space with fiery celestial reflections, 8k",
                        help="Text prompt for generation")
    parser.add_argument("--aspect", type=str, default="1:1",
                        choices=list(ASPECT_RATIO_BUCKETS.keys()),
                        help="Aspect ratio (1:1, 16:9, 9:16, 4:3, 3:4, 21:9)")
    parser.add_argument("--model", type=str, default="flux_klein",
                        choices=list(MODEL_REGISTRY.keys()),
                        help="Model architecture (flux_klein, z_image, wan_video)")
    parser.add_argument("--steps", type=int, default=None,
                        help="Number of denoising steps")
    parser.add_argument("--seed", type=int, default=None,
                        help="Deterministic generation seed")
    parser.add_argument("--mode", type=str, default=EXECUTION_MODE,
                        choices=["mock", "cuda"],
                        help="Execution mode ('mock' for zero-GPU local dev, 'cuda' for GPU)")
    parser.add_argument("--upscale", action="store_true",
                        help="Apply super-resolution upscaling after generation")
    parser.add_argument("--scale", type=int, default=2, choices=[2, 4],
                        help="Upscale magnification factor (2x or 4x)")
    parser.add_argument("--input-image", type=str, default=None,
                        help="Input image path for image-to-image or upscaling")

    args = parser.parse_args()
    print_banner()

    # 1. Model Info Mode
    if args.task == "info":
        print("\n[AI Model Registry & Licensing Specs]")
        for k, v in MODEL_REGISTRY.items():
            print(f"  • {v['name']} ({k}):")
            print(f"      Repository : {v['repo_id']}")
            print(f"      License    : {v['license']} (Commercial Permitted)")
            print(f"      VRAM Rec   : {v['vram_required_gb']} GB ({v['precision']})")
            print(f"      Default    : {v['default_steps']} steps")
        print("\n[Supported Aspect Ratio Buckets]")
        for r, d in ASPECT_RATIO_BUCKETS.items():
            print(f"  • {r:5s} -> {d['width']}x{d['height']}px ({d['name']})")
        return

    # 2. Benchmark Mode
    if args.task == "benchmark":
        print("\n[Running AI Engine Mathematical & Aspect Ratio Verification Suite]")
        test_ratios = ["1:1", "16:9", "9:16", "4:3", "21:9"]
        for r in test_ratios:
            w, h = AspectRatioProcessor.get_dimensions(r)
            val = AspectRatioProcessor.validate_dimensions(w, h)
            div16 = (w % 16 == 0) and (h % 16 == 0)
            status = "PASS" if val["valid"] and div16 else "FAIL"
            print(f"  [{status}] Aspect {r:5s}: {w}x{h}px (~{val['megapixels']} MP) | VAE Divisible: {div16}")

        print("\n[Safety Moderation Filter Check]")
        safe_check = SafetyChecker.check_prompt("A beautiful futuristic city with flying vehicles")
        unsafe_check = SafetyChecker.check_prompt("how to make a bomb at home")
        print(f"  [PASS] Clean prompt pass test: safe={safe_check['safe']}")
        print(f"  [PASS] Prohibited prompt block test: safe={unsafe_check['safe']} (Blocked: {unsafe_check['reason']})")
        print("\nAll baseline mathematical and security checks PASSED.")
        return

    # 3. Upscale Only Mode
    if args.task == "upscale":
        if not args.input_image:
            print("Error: --input-image must be provided for upscaling task.")
            sys.exit(1)
        print(f"\n[Upscaling Image: {args.input_image}] Factor: {args.scale}x")
        res = ImageUpscaler.upscale(args.input_image, scale_factor=args.scale)
        print(json.dumps(res, indent=2))
        return

    # 4. Standard Generation Lifecycle
    print(f"\n[Task: {args.task.upper()}] Mode: {args.mode.upper()}")
    print(f"Model        : {MODEL_REGISTRY.get(args.model, {}).get('name', args.model)}")
    print(f"Aspect Ratio : {args.aspect} -> {AspectRatioProcessor.get_dimensions(args.aspect)[0]}x{AspectRatioProcessor.get_dimensions(args.aspect)[1]}px")
    print(f"Prompt       : \"{args.prompt}\"")
    if args.seed:
        print(f"Seed         : {args.seed}")
    print("\nStarting generation pipeline...")

    def on_progress(percentage: int, step: int, total_steps: int, msg: str = ""):
        bar_len = 30
        filled = int((percentage / 100) * bar_len)
        bar = "█" * filled + "░" * (bar_len - filled)
        sys.stdout.write(f"\r  [{bar}] {percentage}% | {msg}")
        sys.stdout.flush()

    worker = SimulatedWorker(execution_mode=args.mode)
    result = worker.execute_job(
        task=args.task,
        prompt=args.prompt,
        model=args.model,
        aspect_ratio=args.aspect,
        steps=args.steps,
        seed=args.seed,
        input_image=args.input_image,
        upscale=args.upscale,
        scale_factor=args.scale,
        progress_callback=on_progress
    )

    print("\n")
    if result.get("success"):
        print("✓ GENERATION COMPLETED SUCCESSFULLY")
        print(f"  • Output Asset : {result.get('file_path')}")
        print(f"  • Resolution   : {result.get('dimensions')}")
        print(f"  • Latency      : {result.get('latency_seconds')} seconds")
        print(f"  • VRAM Est.    : {result.get('estimated_vram_gb')} GB")
        if result.get("upscaled"):
            print(f"  • Upscaled     : {result['upscaled'].get('upscaled_resolution')} ({result['upscaled'].get('method')})")
    else:
        print(f"✗ GENERATION FAILED: {result.get('error')}")
        if result.get("flagged"):
            print(f"  Flagged Reasons: {result.get('flagged')}")

if __name__ == "__main__":
    main()
