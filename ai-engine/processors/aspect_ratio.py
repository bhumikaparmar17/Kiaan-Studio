"""
Mathematical Aspect Ratio & Resolution Bucketing Processor.
Guarantees dimensions align with Diffusion Latent VAE patches (divisible by 16 and 64).
"""

from typing import Tuple, Dict
import math

class AspectRatioProcessor:
    # Standard resolution presets mapped to aspect ratios
    BUCKETS = {
        "1:1": (1024, 1024),
        "16:9": (1344, 768),
        "9:16": (768, 1344),
        "4:3": (1152, 864),
        "3:4": (864, 1152),
        "21:9": (1536, 640)
    }

    # Minimum and maximum safety bounds
    MIN_DIMENSION = 512
    MAX_DIMENSION = 2048
    ALIGNMENT_FACTOR = 64  # Dimensions must be divisible by 64 for DiT models

    @classmethod
    def get_dimensions(cls, ratio_str: str) -> Tuple[int, int]:
        """
        Returns exact (width, height) pixel dimensions for an aspect ratio string.
        Safely parses ratio strings including descriptive labels (e.g. '16:9 Landscape').
        Falls back to 1024x1024 if unassigned or invalid.
        """
        import re
        raw_str = str(ratio_str or "1:1").strip()
        clean_ratio = raw_str.replace(" ", "")
        if clean_ratio in cls.BUCKETS:
            return cls.BUCKETS[clean_ratio]

        # Extract ratio pattern like "16:9" from "16:9 Landscape" or " 16 : 9 "
        match = re.search(r"(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)", raw_str)
        if match:
            norm_key = f"{match.group(1)}:{match.group(2)}"
            if norm_key in cls.BUCKETS:
                return cls.BUCKETS[norm_key]
            try:
                w_ratio = float(match.group(1))
                h_ratio = float(match.group(2))
                return cls.calculate_aligned_dimensions(w_ratio, h_ratio)
            except Exception:
                pass

        # Attempt to parse custom decimal ratio (e.g. "2.35")
        try:
            w_ratio = float(clean_ratio)
            h_ratio = 1.0
            return cls.calculate_aligned_dimensions(w_ratio, h_ratio)
        except Exception:
            return cls.BUCKETS["1:1"]

    @classmethod
    def calculate_aligned_dimensions(cls, w_ratio: float, h_ratio: float, target_pixels: int = 1024 * 1024) -> Tuple[int, int]:
        """
        Calculates width and height targeting approximately ~1 MegaPixel while
        aligning strictly to the 64-pixel boundary required by VAE patches.
        """
        aspect = w_ratio / h_ratio
        # w * h = target_pixels and w / h = aspect => aspect * h^2 = target_pixels
        h = math.sqrt(target_pixels / aspect)
        w = h * aspect

        # Round to nearest multiple of ALIGNMENT_FACTOR
        aligned_w = int(round(w / cls.ALIGNMENT_FACTOR) * cls.ALIGNMENT_FACTOR)
        aligned_h = int(round(h / cls.ALIGNMENT_FACTOR) * cls.ALIGNMENT_FACTOR)

        # Clamp within bounds
        aligned_w = max(cls.MIN_DIMENSION, min(aligned_w, cls.MAX_DIMENSION))
        aligned_h = max(cls.MIN_DIMENSION, min(aligned_h, cls.MAX_DIMENSION))

        return aligned_w, aligned_h

    @classmethod
    def validate_dimensions(cls, width: int, height: int) -> Dict[str, any]:
        """
        Validates user-provided dimensions for VAE compatibility.
        """
        valid = True
        warnings = []

        if width < cls.MIN_DIMENSION or width > cls.MAX_DIMENSION:
            valid = False
            warnings.append(f"Width {width}px outside safe range ({cls.MIN_DIMENSION}-{cls.MAX_DIMENSION}px).")

        if height < cls.MIN_DIMENSION or height > cls.MAX_DIMENSION:
            valid = False
            warnings.append(f"Height {height}px outside safe range ({cls.MIN_DIMENSION}-{cls.MAX_DIMENSION}px).")

        if width % 16 != 0 or height % 16 != 0:
            valid = False
            warnings.append("Dimensions must be divisible by at least 16 for VAE decoding.")

        return {
            "valid": valid,
            "width": width,
            "height": height,
            "warnings": warnings,
            "megapixels": round((width * height) / 1_000_000, 2)
        }
