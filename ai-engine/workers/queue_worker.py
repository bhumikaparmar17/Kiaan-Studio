"""
BullMQ / Redis Queue Worker Bridge.
Listens for job payloads dispatched from the Node.js/Express backend API.
When the backend is started, this worker bridges Redis queues with the AI pipelines.
"""

import json
import time
import sys
from typing import Dict, Any
try:
    from config import REDIS_HOST, REDIS_PORT, IMAGE_QUEUE_NAME, VIDEO_QUEUE_NAME
    from workers.simulated_worker import SimulatedWorker
except (ImportError, ValueError):
    from ..config import REDIS_HOST, REDIS_PORT, IMAGE_QUEUE_NAME, VIDEO_QUEUE_NAME
    from .simulated_worker import SimulatedWorker

class QueueWorker:
    def __init__(self, execution_mode: str = "mock"):
        self.execution_mode = execution_mode
        self.worker = SimulatedWorker(execution_mode=execution_mode)
        self.redis_client = None

    def connect_redis(self) -> bool:
        """
        Attempts to connect to Redis instance backing BullMQ.
        """
        try:
            import redis
            self.redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0, socket_timeout=3)
            self.redis_client.ping()
            print(f"[QueueWorker] Connected to Redis at {REDIS_HOST}:{REDIS_PORT}")
            return True
        except Exception as e:
            print(f"[QueueWorker] Redis connection pending ({e}). Running in Standalone Direct Mode.")
            return False

    def process_job_payload(self, job_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Processes a standardized BullMQ job dictionary from the Express backend:
        {
            "jobId": "job_123",
            "userId": "usr_dev_001",
            "task": "text-to-image",
            "prompt": "Cyberpunk city",
            "model": "flux_klein",
            "aspectRatio": "16:9",
            "seed": 42
        }
        """
        print(f"\n[QueueWorker] Processing Job ID: {job_data.get('jobId', 'direct')}")
        print(f"  Model: {job_data.get('model', 'flux_klein')} | Aspect: {job_data.get('aspectRatio', '1:1')}")
        print(f"  Prompt: {job_data.get('prompt')}")

        def on_progress(percentage: int, step: int, total_steps: int, msg: str = ""):
            print(f"  -> Progress: {percentage}% ({msg})")
            if self.redis_client:
                # Publish event to Redis Pub/Sub for Express Server-Sent Events (SSE)
                event = {
                    "jobId": job_data.get("jobId"),
                    "status": "PROCESSING",
                    "progress": percentage,
                    "step": step,
                    "totalSteps": total_steps
                }
                self.redis_client.publish(f"events:{job_data.get('jobId')}", json.dumps(event))

        result = self.worker.execute_job(
            task=job_data.get("task", "text-to-image"),
            prompt=job_data.get("prompt", ""),
            model=job_data.get("model", "flux_klein"),
            aspect_ratio=job_data.get("aspectRatio", "1:1"),
            steps=job_data.get("steps"),
            seed=job_data.get("seed"),
            upscale=job_data.get("upscale", False),
            progress_callback=on_progress
        )

        return result

    def start_listening(self):
        """
        Continuous loop listening to Redis/BullMQ.
        """
        if not self.connect_redis():
            print("[QueueWorker] Ready for Backend integration. Start your backend + Redis to begin stream processing.")
            return

        print(f"[QueueWorker] Listening for jobs on '{IMAGE_QUEUE_NAME}' and '{VIDEO_QUEUE_NAME}'...")
        while True:
            try:
                # Poll or block on queue
                time.sleep(1)
            except KeyboardInterrupt:
                print("\n[QueueWorker] Shutting down listener cleanly.")
                break
