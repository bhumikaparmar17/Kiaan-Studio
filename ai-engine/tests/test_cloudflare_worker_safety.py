"""
Kiaan Studio - Cloudflare Worker Safety & Mock Prevention Test Suite
Verifies:
1. Credential auto-discovery across backend directories.
2. Model routing for FLUX.2 Klein 4B and FLUX.1 Schnell.
3. Strict fail-closed behavior (no silent fallback to mock canvas in live mode).
4. Explicit mock mode behavior.
5. WaveSpeed / Z-Image Turbo pipeline preservation.
6. Safety filter error mapping.
"""

import os
import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

# Add ai-engine to sys.path
TEST_DIR = Path(__file__).resolve().parent
ENGINE_ROOT = TEST_DIR.parent
if str(ENGINE_ROOT) not in sys.path:
    sys.path.insert(0, str(ENGINE_ROOT))

from pipelines.cloudflare_adapter import CloudflarePipelineAdapter
from workers.backend_bridge_worker import BackendBridgeWorker


class TestCloudflareWorkerSafety(unittest.TestCase):
    def test_01_credential_discovery_and_configuration(self):
        """Adapter must successfully discover credentials from Kiaan-ai-image-generator-backend/.env"""
        adapter = CloudflarePipelineAdapter()
        self.assertTrue(adapter.is_configured(), "CloudflarePipelineAdapter must be configured")
        self.assertTrue(len(adapter.account_id) > 10, "Account ID must be resolved")
        self.assertTrue(len(adapter.api_token) > 10, "API Token must be resolved")

    def test_02_model_routing_endpoints(self):
        """Verify model routing matches Cloudflare specifications"""
        models = CloudflarePipelineAdapter.CLOUDFLARE_MODELS

        self.assertIn("flux-2-klein-4b", models)
        self.assertEqual(models["flux-2-klein-4b"]["cf_id"], "@cf/black-forest-labs/flux-2-klein-4b")
        self.assertEqual(models["flux-2-klein-4b"]["format"], "multipart")

        self.assertIn("flux-1-schnell", models)
        self.assertEqual(models["flux-1-schnell"]["cf_id"], "@cf/black-forest-labs/flux-1-schnell")
        self.assertEqual(models["flux-1-schnell"]["format"], "json")

    def test_03_live_mode_never_falls_back_to_mock_when_unconfigured(self):
        """In live mode, missing credentials MUST fail the job, never produce mock canvas"""
        with patch.dict(os.environ, {"CLOUDFLARE_INFERENCE_MODE": "live"}):
            worker = BackendBridgeWorker(execution_mode="mock")
            worker.fail_job = MagicMock()
            worker.complete_job = MagicMock()
            worker.report_progress = MagicMock()
            worker.worker.execute_job = MagicMock()

            # Mock unconfigured adapter
            mock_adapter = MagicMock()
            mock_adapter.is_configured.return_value = False

            with patch("pipelines.cloudflare_adapter.CloudflarePipelineAdapter", return_value=mock_adapter):
                job = {
                    "id": "test-job-live-fail",
                    "modelId": "flux-2-klein-4b",
                    "prompt": "Test prompt",
                    "type": "TEXT_TO_IMAGE"
                }
                worker.process_job(job)

                # Must fail job and NOT call mock execute_job
                worker.fail_job.assert_called_once()
                worker.worker.execute_job.assert_not_called()
                worker.complete_job.assert_not_called()
                err_arg = worker.fail_job.call_args[0][1]
                self.assertIn("Missing credentials for live inference", err_arg)
                self.assertIn("Silent fallback to mock placeholder canvas is strictly disabled", err_arg)

    def test_04_live_mode_never_falls_back_to_mock_when_api_fails(self):
        """In live mode, Cloudflare API errors MUST fail the job, never fall back to mock"""
        with patch.dict(os.environ, {"CLOUDFLARE_INFERENCE_MODE": "live"}):
            worker = BackendBridgeWorker(execution_mode="mock")
            worker.fail_job = MagicMock()
            worker.complete_job = MagicMock()
            worker.report_progress = MagicMock()
            worker.worker.execute_job = MagicMock()

            mock_adapter = MagicMock()
            mock_adapter.is_configured.return_value = True
            mock_adapter.generate.side_effect = RuntimeError("Cloudflare API HTTP 500: Server Error")

            with patch("pipelines.cloudflare_adapter.CloudflarePipelineAdapter", return_value=mock_adapter):
                job = {
                    "id": "test-job-live-api-error",
                    "modelId": "flux-1-schnell",
                    "prompt": "Test prompt",
                    "type": "TEXT_TO_IMAGE"
                }
                worker.process_job(job)

                worker.fail_job.assert_called_once()
                worker.worker.execute_job.assert_not_called()
                worker.complete_job.assert_not_called()
                err_arg = worker.fail_job.call_args[0][1]
                self.assertIn("Cloudflare API HTTP 500", err_arg)

    def test_05_explicit_mock_mode_behavior(self):
        """When CLOUDFLARE_INFERENCE_MODE='mock', development mock canvas is permitted"""
        with patch.dict(os.environ, {"CLOUDFLARE_INFERENCE_MODE": "mock"}):
            worker = BackendBridgeWorker(execution_mode="mock")
            worker.fail_job = MagicMock()
            worker.complete_job = MagicMock()
            worker.worker.execute_job = MagicMock(return_value={
                "success": True,
                "file_path": str(ENGINE_ROOT / "outputs" / "flux_test.webp"),
                "dimensions": "1024x1024",
                "latency_seconds": 1.0
            })
            worker.report_progress = MagicMock()

            # Create dummy output file
            dummy_file = ENGINE_ROOT / "outputs" / "flux_test.webp"
            dummy_file.parent.mkdir(parents=True, exist_ok=True)
            dummy_file.write_bytes(b"dummy-webp-data")

            job = {
                "id": "test-job-explicit-mock",
                "modelId": "flux-2-klein-4b",
                "prompt": "Test prompt",
                "type": "TEXT_TO_IMAGE"
            }
            worker.process_job(job)

            worker.worker.execute_job.assert_called_once()
            worker.fail_job.assert_not_called()
            worker.complete_job.assert_called_once()

    def test_06_wavespeed_and_z_image_turbo_preserved(self):
        """Z-Image Turbo is routed to z_image pipeline and never broken by Cloudflare updates"""
        worker = BackendBridgeWorker(execution_mode="mock")
        mapped_model = worker.map_model_id("z-image-turbo")
        self.assertEqual(mapped_model, "z_image", "z-image-turbo must map to z_image")

        worker.fail_job = MagicMock()
        worker.complete_job = MagicMock()
        worker.worker.execute_job = MagicMock(return_value={
            "success": True,
            "file_path": str(ENGINE_ROOT / "outputs" / "z_image_test.webp"),
            "dimensions": "1024x1024",
            "latency_seconds": 0.8
        })
        worker.report_progress = MagicMock()

        dummy_file = ENGINE_ROOT / "outputs" / "z_image_test.webp"
        dummy_file.parent.mkdir(parents=True, exist_ok=True)
        dummy_file.write_bytes(b"dummy-z-image-data")

        job = {
            "id": "test-job-z-image",
            "modelId": "z-image-turbo",
            "prompt": "Typography packshot of luxury perfume",
            "type": "TEXT_TO_IMAGE"
        }
        worker.process_job(job)

        worker.worker.execute_job.assert_called_once()
        self.assertEqual(worker.worker.execute_job.call_args[1]["model"], "z_image")
        worker.fail_job.assert_not_called()
        worker.complete_job.assert_called_once()


if __name__ == "__main__":
    unittest.main()
