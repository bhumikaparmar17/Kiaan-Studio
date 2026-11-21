"""
Kiaan Studio - Aspect Ratio & Canvas Dimensions Multi-Model Regression Test Suite
Verifies:
1. Z-Image Turbo passes exact model-supported dimensions as "size": "width*height" to WaveSpeed.
2. FLUX.2 Klein 4B passes multipart form fields width and height correctly to Cloudflare.
3. FLUX.1 Schnell passes JSON payload width, height, and steps to Cloudflare.
4. All 5 aspect ratios (1:1, 16:9, 9:16, 4:3, 21:9) map to model-supported dimensions.
5. Descriptive labels ("16:9 Landscape", "21:9 Ultra-wide") are safely parsed and never fall back to 1024x1024.
6. BackendBridgeWorker correctly extracts dimensions and passes them to asset creation.
ZERO paid API requests are made (100% mocked).
"""

import os
import sys
import json
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

TEST_DIR = Path(__file__).resolve().parent
ENGINE_ROOT = TEST_DIR.parent
if str(ENGINE_ROOT) not in sys.path:
    sys.path.insert(0, str(ENGINE_ROOT))

from processors.aspect_ratio import AspectRatioProcessor
from pipelines.z_image_pipeline import ZImagePipeline
from pipelines.cloudflare_adapter import CloudflarePipelineAdapter
from workers.backend_bridge_worker import BackendBridgeWorker


class TestAspectRatioAllModels(unittest.TestCase):
    def setUp(self):
        # Set dummy environment variables for safety
        os.environ["WAVESPEED_API_KEY"] = "mock_ws_test_key_12345"
        os.environ["CLOUDFLARE_ACCOUNT_ID"] = "mock_cf_account_12345"
        os.environ["CLOUDFLARE_API_TOKEN"] = "mock_cf_token_12345"
        os.environ["CLOUDFLARE_INFERENCE_MODE"] = "live"
        os.environ["WAVESPEED_INFERENCE_MODE"] = "live"

    # =========================================================================
    # SECTION 1: Aspect Ratio Processor & Descriptive Label Parsing
    # =========================================================================
    def test_01_descriptive_label_parsing_never_falls_back_to_square(self):
        """Descriptive labels from UI must cleanly resolve without defaulting to 1024x1024"""
        cases = {
            "1:1 Square": (1024, 1024),
            "16:9 Landscape": (1344, 768),
            "9:16 Portrait": (768, 1344),
            "4:3 Classic": (1152, 864),
            "21:9 Ultra-wide": (1536, 640),
            " 16 : 9 ": (1344, 768),
            "21:9": (1536, 640)
        }
        for label, expected in cases.items():
            w, h = AspectRatioProcessor.get_dimensions(label)
            self.assertEqual((w, h), expected, f"Failed for label '{label}': got ({w}, {h}), expected {expected}")

    # =========================================================================
    # SECTION 2: Z-Image Turbo (WaveSpeed AI) Aspect Ratios & Payload Contracts
    # =========================================================================
    def test_02_z_image_turbo_all_five_aspect_ratios(self):
        """Verify Z-Image Turbo passes 'size': 'width*height' across all 5 aspect ratios to WaveSpeed"""
        pipeline = ZImagePipeline(execution_mode="wavespeed")
        pipeline.api_key = "mock_ws_key"

        expected_cases = {
            "1:1": {"width": 1024, "height": 1024, "expected_size": "1024*1024"},
            "16:9": {"width": 1344, "height": 768, "expected_size": "1344*768"},
            "9:16": {"width": 768, "height": 1344, "expected_size": "768*1344"},
            "4:3": {"width": 1152, "height": 864, "expected_size": "1152*864"},
            "21:9": {"width": 1536, "height": 640, "expected_size": "1536*640"}
        }

        for ratio, spec in expected_cases.items():
            submitted_payload = None

            def mock_urlopen(req, timeout=None):
                nonlocal submitted_payload
                url = req.full_url if hasattr(req, "full_url") else str(req)
                if "wavespeed-ai/z-image/turbo" in url:
                    body = json.loads(req.data.decode("utf-8"))
                    submitted_payload = body
                    resp = MagicMock()
                    resp.read.return_value = json.dumps({
                        "code": 200,
                        "data": {"id": "mock-task-id-123", "status": "processing"}
                    }).encode("utf-8")
                    resp.__enter__.return_value = resp
                    return resp
                elif "predictions/mock-task-id-123/result" in url:
                    resp = MagicMock()
                    resp.read.return_value = json.dumps({
                        "code": 200,
                        "data": {
                            "id": "mock-task-id-123",
                            "status": "completed",
                            "outputs": ["https://mock.wavespeed.ai/output.jpg"]
                        }
                    }).encode("utf-8")
                    resp.__enter__.return_value = resp
                    return resp
                elif "https://mock.wavespeed.ai/output.jpg" in url:
                    resp = MagicMock()
                    resp.read.return_value = b"fake-jpg-binary-bytes-data" * 20
                    resp.__enter__.return_value = resp
                    return resp
                raise ValueError(f"Unexpected URL: {url}")

            with patch("urllib.request.urlopen", side_effect=mock_urlopen):
                with patch("time.sleep", return_value=None):
                    out_dir = ENGINE_ROOT / "outputs"
                    res = pipeline.generate(
                        prompt="A luxurious architectural villa",
                        aspect_ratio=ratio,
                        width=spec["width"],
                        height=spec["height"],
                        output_dir=out_dir,
                        job_id=f"test-{ratio.replace(':', '-')}"
                    )

            self.assertTrue(res["success"])
            self.assertIsNotNone(submitted_payload, f"WaveSpeed task must be submitted for {ratio}")
            self.assertEqual(
                submitted_payload.get("size"),
                spec["expected_size"],
                f"WaveSpeed payload 'size' mismatch for {ratio}: got {submitted_payload.get('size')}, expected {spec['expected_size']}"
            )
            self.assertEqual(res["dimensions"], f"{spec['width']}x{spec['height']}")
            self.assertEqual(res["width"], spec["width"])
            self.assertEqual(res["height"], spec["height"])

    # =========================================================================
    # SECTION 3: FLUX.2 Klein 4B (Cloudflare Multipart) Aspect Ratios
    # =========================================================================
    def test_03_flux_2_klein_multipart_all_five_aspect_ratios(self):
        """Verify FLUX.2 Klein passes multipart form fields width & height across all 5 ratios"""
        adapter = CloudflarePipelineAdapter()
        adapter.account_id = "test_cf_account"
        adapter.api_token = "test_cf_token"

        expected_cases = {
            "1:1": (1024, 1024),
            "16:9": (1024, 576),
            "9:16": (576, 1024),
            "4:3": (1024, 768),
            "21:9": (1024, 448)
        }

        for ratio, (expected_w, expected_h) in expected_cases.items():
            sent_body = None
            sent_headers = None

            def mock_cf_urlopen(req, timeout=None):
                nonlocal sent_body, sent_headers
                sent_body = req.data.decode("utf-8", errors="replace")
                sent_headers = req.headers
                resp = MagicMock()
                resp.headers = {"Content-Type": "image/jpeg"}
                resp.read.return_value = b"fake-cf-jpeg-data" * 20
                resp.__enter__.return_value = resp
                return resp

            with patch("urllib.request.urlopen", side_effect=mock_cf_urlopen):
                out_dir = ENGINE_ROOT / "outputs"
                res = adapter.generate(
                    prompt="A cosmic astronaut floating in nebula",
                    model_id="flux-2-klein-4b",
                    aspect_ratio=ratio,
                    output_dir=out_dir,
                    job_id=f"test-cf-{ratio.replace(':', '-')}"
                )

            self.assertTrue(res["success"])
            self.assertIn('Content-Disposition: form-data; name="width"', sent_body)
            self.assertIn(f'\r\n\r\n{expected_w}\r\n', sent_body, f"Width {expected_w} missing in multipart body for {ratio}")
            self.assertIn('Content-Disposition: form-data; name="height"', sent_body)
            self.assertIn(f'\r\n\r\n{expected_h}\r\n', sent_body, f"Height {expected_h} missing in multipart body for {ratio}")
            self.assertEqual(res["dimensions"], f"{expected_w}x{expected_h}")

    # =========================================================================
    # SECTION 4: FLUX.1 Schnell (Cloudflare JSON) Aspect Ratios
    # =========================================================================
    def test_04_flux_1_schnell_json_all_five_aspect_ratios(self):
        """Verify FLUX.1 Schnell passes JSON payload width & height across all 5 ratios"""
        adapter = CloudflarePipelineAdapter()
        adapter.account_id = "test_cf_account"
        adapter.api_token = "test_cf_token"

        expected_cases = {
            "1:1": (1024, 1024),
            "16:9": (1024, 576),
            "9:16": (576, 1024),
            "4:3": (1024, 768),
            "21:9": (1024, 448)
        }

        for ratio, (expected_w, expected_h) in expected_cases.items():
            sent_payload = None

            import base64
            fake_b64 = base64.b64encode(b"fake-image-bytes-data-over-100-bytes" * 10).decode("utf-8")

            def mock_cf_urlopen(req, timeout=None):
                nonlocal sent_payload
                sent_payload = json.loads(req.data.decode("utf-8"))
                resp = MagicMock()
                resp.headers = {"Content-Type": "application/json"}
                resp.read.return_value = json.dumps({
                    "result": {"image": fake_b64}
                }).encode("utf-8")
                resp.__enter__.return_value = resp
                return resp

            with patch("urllib.request.urlopen", side_effect=mock_cf_urlopen):
                out_dir = ENGINE_ROOT / "outputs"
                res = adapter.generate(
                    prompt="Ultra fast concept sketch of a futuristic sports car",
                    model_id="flux-1-schnell",
                    aspect_ratio=ratio,
                    output_dir=out_dir,
                    job_id=f"test-schnell-{ratio.replace(':', '-')}"
                )

            self.assertTrue(res["success"])
            self.assertIsNotNone(sent_payload)
            self.assertEqual(sent_payload.get("width"), expected_w, f"Width mismatch for Schnell {ratio}")
            self.assertEqual(sent_payload.get("height"), expected_h, f"Height mismatch for Schnell {ratio}")
            self.assertEqual(res["dimensions"], f"{expected_w}x{expected_h}")

    # =========================================================================
    # SECTION 5: Backend Bridge Worker End-to-End Extraction & Asset Dimensions
    # =========================================================================
    def test_05_backend_bridge_worker_preserves_dimensions_in_asset_record(self):
        """Verify BackendBridgeWorker extracts width/height and saves them to asset_record"""
        worker = BackendBridgeWorker(execution_mode="mock")
        worker.complete_job = MagicMock()
        worker.fail_job = MagicMock()
        worker.report_progress = MagicMock()

        # Mock dummy output file
        dummy_file = ENGINE_ROOT / "outputs" / "test_16_9.jpg"
        dummy_file.parent.mkdir(parents=True, exist_ok=True)
        dummy_file.write_bytes(b"dummy-image-bytes-16-9")

        # Mock adapter
        mock_adapter = MagicMock()
        mock_adapter.is_configured.return_value = True
        mock_adapter.generate.return_value = {
            "success": True,
            "file_path": str(dummy_file),
            "dimensions": "1024x576",
            "latency_seconds": 1.1
        }

        with patch("pipelines.cloudflare_adapter.CloudflarePipelineAdapter", return_value=mock_adapter):
            job = {
                "id": "job-test-16-9",
                "modelId": "flux-2-klein-4b",
                "prompt": "Test 16:9 generation",
                "type": "TEXT_TO_IMAGE",
                "parametersJson": json.dumps({
                    "aspect": "16:9",
                    "width": 1344,
                    "height": 768
                })
            }
            worker.process_job(job)

            # Verify complete_job was called with 1024x576 dimensions
            worker.complete_job.assert_called_once()
            call_args = worker.complete_job.call_args[0]
            job_id_arg = call_args[0]
            assets_arg = call_args[2]

            self.assertEqual(job_id_arg, "job-test-16-9")
            self.assertEqual(len(assets_arg), 1)
            self.assertEqual(assets_arg[0]["dimensions"], "1024x576")


if __name__ == "__main__":
    unittest.main()
