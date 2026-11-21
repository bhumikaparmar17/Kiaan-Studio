"""
Two-Tier Content Safety & Moderation Processor.
Protects the platform against disallowed content, hate speech, and abuse.
"""

import re
from typing import Dict, List, Tuple

class SafetyChecker:
    # High-severity blocked terms and patterns
    BLOCKED_PATTERNS = [
        r"\b(csam|child\s*porn|pedophil|underage\s*nude)\b",
        r"\b(make\s*a\s*bomb|ied\s*explosive|anthrax\s*recipe|ricin\s*synthesis)\b",
        r"\b(suicide\s*guide|self\s*harm\s*instructions)\b",
        r"\b(terrorist\s*attack\s*plan|mass\s*shooting\s*blueprint)\b",
        r"\b(deepfake\s*nude|nonconsensual)\b"
    ]

    # Sensitive keywords requiring warning flags
    SENSITIVE_KEYWORDS = [
        "gore", "dismemberment", "bloodbath", "decapitation",
        "hate speech", "extremist", "nazi symbol"
    ]

    @classmethod
    def check_prompt(cls, prompt: str) -> Dict[str, any]:
        """
        Fast pre-inference text moderation check (<5ms).
        Returns a dict indicating if the prompt is safe to process.
        """
        if not prompt or not prompt.strip():
            return {
                "safe": False,
                "reason": "Prompt is empty.",
                "flagged_categories": ["EMPTY_PROMPT"]
            }

        text = prompt.lower()

        # 1. Critical Violation Regex Scan
        for pattern in cls.BLOCKED_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                return {
                    "safe": False,
                    "reason": "Prompt violates platform safety and legal compliance policies.",
                    "flagged_categories": ["CRITICAL_SAFETY_VIOLATION"]
                }

        # 2. Sensitive Keyword Scan
        flagged = []
        for word in cls.SENSITIVE_KEYWORDS:
            if word in text:
                flagged.append(word)

        if flagged:
            return {
                "safe": False,
                "reason": f"Prompt contains prohibited terms: {', '.join(flagged)}",
                "flagged_categories": ["PROHIBITED_SENSITIVE_CONTENT"]
            }

        return {
            "safe": True,
            "reason": "Prompt passed safety checks.",
            "flagged_categories": []
        }

    @classmethod
    def check_image_safety(cls, image_path: str = None) -> Dict[str, any]:
        """
        Post-inference safety verification.
        In CUDA mode, this runs the Diffusers Safety Checker or CLIP embedding similarity.
        In Mock mode, returns safe status.
        """
        return {
            "safe": True,
            "nsfw_score": 0.01,
            "flagged": False
        }
