"""
Simulated AI Worker for Standalone Local Execution.
Coordinates model pipelines, aspect ratios, and progress monitoring without requiring a live queue or GPU.
"""

from typing import Dict, Any, Callable, Optional
try:
    from pipelines.flux_pipeline import FluxKleinPipeline
    from pipelines.z_image_pipeline import ZImagePipeline
    from pipelines.wan_video_pipeline import WanVideoPipeline
    from processors.upscaler import ImageUpscaler
except (ImportError, ValueError):
    from ..pipelines.flux_pipeline import FluxKleinPipeline
    from ..pipelines.z_image_pipeline import ZImagePipeline
    from ..pipelines.wan_video_pipeline import WanVideoPipeline
    from ..processors.upscaler import ImageUpscaler

class SimulatedWorker:
    def __init__(self, execution_mode: str = "mock"):
        self.execution_mode = execution_mode
        self.pipelines = {
            "flux_klein": FluxKleinPipeline(execution_mode=execution_mode),
            "z_image": ZImagePipeline(execution_mode=execution_mode),
            "wan_video": WanVideoPipeline(execution_mode=execution_mode)
        }

    def execute_job(
        self,
        task: str,
        prompt: str,
        model: str = "flux_klein",
        aspect_ratio: str = "1:1",
        width: Optional[int] = None,
        height: Optional[int] = None,
        steps: Optional[int] = None,
        seed: Optional[int] = None,
        input_image: Optional[str] = None,
        upscale: bool = False,
        scale_factor: int = 2,
        progress_callback: Optional[Callable[[int, int, str], None]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Executes an AI generation job across the designated pipeline.
        """
        pipeline = self.pipelines.get(model, self.pipelines["flux_klein"])
        pipeline.load_model()

        # Execute generation
        result = pipeline.generate(
            prompt=prompt,
            aspect_ratio=aspect_ratio,
            width=width,
            height=height,
            steps=steps,
            seed=seed,
            input_image_path=input_image,
            progress_callback=progress_callback,
            **kwargs
        )

        if not result.get("success"):
            return result

        # Optional Upscaling Post-Processing
        if upscale and result.get("file_path"):
            upscale_res = ImageUpscaler.upscale(
                input_image_path=result["file_path"],
                scale_factor=scale_factor
            )
            result["upscaled"] = upscale_res

        return result
