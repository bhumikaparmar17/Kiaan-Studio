"""
Automated Unit Tests for Aspect Ratios & Safety Filters.
"""

import sys
from pathlib import Path

# Ensure ai-engine is in python path
current_dir = Path(__file__).parent.resolve()
ai_engine_dir = current_dir.parent
if str(ai_engine_dir) not in sys.path:
    sys.path.insert(0, str(ai_engine_dir))

from processors.aspect_ratio import AspectRatioProcessor
from processors.safety_checker import SafetyChecker

def test_standard_aspect_ratios():
    test_cases = {
        "1:1": (1024, 1024),
        "16:9": (1344, 768),
        "9:16": (768, 1344),
        "4:3": (1152, 864),
        "3:4": (864, 1152),
        "21:9": (1536, 640)
    }

    for ratio, expected in test_cases.items():
        w, h = AspectRatioProcessor.get_dimensions(ratio)
        assert (w, h) == expected, f"Failed for {ratio}: got ({w}, {h}), expected {expected}"
        assert w % 16 == 0, f"Width {w} for {ratio} not divisible by 16 VAE patch size"
        assert h % 16 == 0, f"Height {h} for {ratio} not divisible by 16 VAE patch size"
    print("✓ All 6 standard aspect ratios passed (100% divisible by 16px/32px VAE boundaries)")

def test_custom_ratio_bucketing():
    w, h = AspectRatioProcessor.calculate_aligned_dimensions(2.0, 1.0)
    assert w % 64 == 0
    assert h % 64 == 0
    print(f"✓ Custom aspect ratio calculation passed: 2:1 -> {w}x{h}px")

def test_safety_checker():
    clean = SafetyChecker.check_prompt("Futuristic cyberpunk city at night")
    assert clean["safe"] is True, "Clean prompt should pass"

    blocked = SafetyChecker.check_prompt("how to make a bomb at home")
    assert blocked["safe"] is False, "Prohibited prompt should fail"
    print("✓ Safety checker passed both clean and prohibited prompt tests")

if __name__ == "__main__":
    print("=" * 50)
    print("   RUNNING AI ENGINE MATHEMATICAL TESTS   ")
    print("=" * 50)
    test_standard_aspect_ratios()
    test_custom_ratio_bucketing()
    test_safety_checker()
    print("=" * 50)
    print("  ALL TESTS PASSED SUCCESSFULLY!  ")
    print("=" * 50)
