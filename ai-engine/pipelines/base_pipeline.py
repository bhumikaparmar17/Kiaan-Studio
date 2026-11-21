"""
Base Pipeline Definition & Standard Execution Contract.
All generative model pipelines inherit from this class.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Callable, Optional
import time

class BasePipeline(ABC):
    def __init__(self, model_id: str, execution_mode: str = "mock"):
        self.model_id = model_id
        self.execution_mode = execution_mode.lower()
        self.model_loaded = False
        self.pipeline = None

    @abstractmethod
    def load_model(self) -> bool:
        """
        Loads model weights into memory/VRAM (in CUDA mode)
        or initializes simulation state (in Mock mode).
        """
        pass

    @abstractmethod
    def generate(
        self,
        prompt: str,
        aspect_ratio: str = "1:1",
        steps: Optional[int] = None,
        seed: Optional[int] = None,
        guidance_scale: Optional[float] = None,
        progress_callback: Optional[Callable[[int, int, str], None]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Executes generation and returns structured metadata + output path.
        """
        pass

    def get_info(self) -> Dict[str, Any]:
        return {
            "model_id": self.model_id,
            "execution_mode": self.execution_mode,
            "loaded": self.model_loaded
        }
