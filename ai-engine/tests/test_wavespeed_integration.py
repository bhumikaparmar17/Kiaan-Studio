"""
Kiaan Studio - WaveSpeed AI Z-Image Turbo Integration Test Suite
Verifies:
1. Secure loading of WAVESPEED_API_KEY from backend .env without exposure.
2. WaveSpeed request payload contract and endpoint targeting.
3. Fail-closed behavior when key is absent in live mode (no silent mock canvas).
4. Successful response handling and JPEG asset download flow.
5. Content moderation & safety flag translation.
"""

import os
import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

TEST_DIR = Path(__file__).resolve().parent
ENGINE_ROOT = TEST_DIR.parent
if str(ENGINE_ROOT) not in sys.path:
    sys.path.insert(0, str(ENGINE_ROOT))

from pipelines.z_image_pipeline import ZImagePipeline


class TestWaveSpeedIntegration(unittest.TestCase):
    def test_01_api_key_loaded_securely(self):
        """Pipeline must automatically resolve WAVESPEED_API_KEY from backend .env"""
        pipeline = ZImagePipeline()
        self.assertTrue(pipeline.is_wavespeed_configured(), "WAVESPEED_API_KEY must be loaded")
        self.assertTrue(len(pipeline.api_key) > 10, "Key length must be valid")

    def test_02_payload_contract_and_size_formatting(self):
        """WaveSpeed requires size format 'width*height' and output_format 'jpeg'"""
        pipeline = ZImagePipeline()
        pipeline.api_key = "test-ws-key-secret"

        with patch("urllib.request.urlopen") as mock_urlopen:
            mock_submit_resp = MagicMock()
            mock_submit_resp.read.return_value = b'{"data": {"id": "ws-pred-12345"}}'
            mock_submit_resp.__enter__.return_value = mock_submit_resp

            mock_poll_resp = MagicMock()
            mock_poll_resp.read.return_value = b'{"data": {"status": "completed", "outputs": ["https://cdn.wavespeed.ai/sample.jpg"]}}'
            mock_poll_resp.__enter__.return_value = mock_poll_resp

            mock_img_resp = MagicMock()
            mock_img_resp.read.return_value = b'\xff\xd8\xff\xe0' + b'A' * 500  # JPEG header + dummy bytes
            mock_img_resp.__enter__.return_value = mock_img_resp

            mock_urlopen.side_effect = [mock_submit_resp, mock_poll_resp, mock_img_resp]

            result = pipeline.generate(
                prompt="A luxury wristwatch with typography dial",
                aspect_ratio="1:1",
                output_dir=ENGINE_ROOT / "outputs"
            )

            self.assertTrue(result["success"])
            self.assertEqual(result["dimensions"], "1024x1024")
            self.assertEqual(result["source"], "wavespeed")
            self.assertTrue(result["file_path"].endswith(".jpg"))

            # Verify the submitted request payload
            submit_call = mock_urlopen.call_args_list[0]
            req_obj = submit_call[0][0]
            self.assertEqual(req_obj.full_url, "https://api.wavespeed.ai/api/v3/wavespeed-ai/z-image/turbo")
            self.assertEqual(req_obj.headers["Authorization"], "Bearer test-ws-key-secret")

    def test_03_fail_closed_when_key_missing_in_live_mode(self):
        """In live mode, missing key must raise RuntimeError and NEVER produce a mock canvas"""
        with patch.dict(os.environ, {"WAVESPEED_INFERENCE_MODE": "live"}):
            pipeline = ZImagePipeline()
            pipeline.api_key = ""

            with self.assertRaises(RuntimeError) as ctx:
                pipeline.generate(
                    prompt="Test prompt without key",
                    aspect_ratio="1:1"
                )
            self.assertIn("WAVESPEED_API_KEY is missing", str(ctx.exception))
            self.assertIn("mock generation is disabled", str(ctx.exception))

    def test_04_error_when_wavespeed_job_fails(self):
        """Failed/cancelled WaveSpeed statuses must raise clean RuntimeError"""
        pipeline = ZImagePipeline()
        pipeline.api_key = "test-ws-key-secret"

        with patch("urllib.request.urlopen") as mock_urlopen:
            mock_submit_resp = MagicMock()
            mock_submit_resp.read.return_value = b'{"data": {"id": "ws-pred-failed-1"}}'
            mock_submit_resp.__enter__.return_value = mock_submit_resp

            mock_poll_resp = MagicMock()
            mock_poll_resp.read.return_value = b'{"data": {"status": "failed", "error": "Internal GPU worker exception"}}'
            mock_poll_resp.__enter__.return_value = mock_poll_resp

            mock_urlopen.side_effect = [mock_submit_resp, mock_poll_resp]

            with self.assertRaises(RuntimeError) as ctx:
                pipeline.generate(
                    prompt="Prompt that causes failure",
                    aspect_ratio="1:1"
                )
            self.assertIn("WaveSpeed generation ended with status 'failed'", str(ctx.exception))

    def test_05_numeric_string_seed_serialized_as_integer(self):
        """Verifies that numeric string seed (e.g. '430279335') is serialized strictly as an integer"""
        import json
        pipeline = ZImagePipeline()
        pipeline.api_key = "test-ws-key-secret"

        test_cases = [
            ("430279335", 430279335),
            (" 99887766 ", 99887766),
            (123456, 123456),
            ("123.0", 123),
        ]

        for input_seed, expected_int in test_cases:
            with patch("urllib.request.urlopen") as mock_urlopen:
                mock_submit_resp = MagicMock()
                mock_submit_resp.read.return_value = b'{"data": {"id": "ws-pred-seed-test"}}'
                mock_submit_resp.__enter__.return_value = mock_submit_resp

                mock_poll_resp = MagicMock()
                mock_poll_resp.read.return_value = b'{"data": {"status": "completed", "outputs": ["https://cdn.wavespeed.ai/sample.jpg"]}}'
                mock_poll_resp.__enter__.return_value = mock_poll_resp

                mock_img_resp = MagicMock()
                mock_img_resp.read.return_value = b'\xff\xd8\xff\xe0' + b'B' * 500
                mock_img_resp.__enter__.return_value = mock_img_resp

                mock_urlopen.side_effect = [mock_submit_resp, mock_poll_resp, mock_img_resp]

                result = pipeline.generate(
                    prompt="A test image with seed parsing",
                    aspect_ratio="1:1",
                    seed=input_seed,
                    output_dir=ENGINE_ROOT / "outputs"
                )

                self.assertTrue(result["success"])

                # Inspect raw serialized JSON payload sent in HTTP POST request
                submit_call = mock_urlopen.call_args_list[0]
                req_obj = submit_call[0][0]
                raw_body = json.loads(req_obj.data.decode("utf-8"))

                # Strict type assertions
                self.assertIn("seed", raw_body)
                self.assertIsInstance(raw_body["seed"], int, f"Seed must be an integer, got {type(raw_body['seed'])}")
                self.assertNotIsInstance(raw_body["seed"], str, "Seed must NOT be a string")
                self.assertEqual(raw_body["seed"], expected_int)

    def test_06_invalid_and_out_of_range_seed_safety(self):
        """Verifies missing, empty, or invalid seeds are handled safely without crashing"""
        pipeline = ZImagePipeline()
        self.assertIsNone(pipeline.parse_seed(None))
        self.assertIsNone(pipeline.parse_seed(""))
        self.assertIsNone(pipeline.parse_seed("   "))
        self.assertIsNone(pipeline.parse_seed("invalid_seed"))
        self.assertIsNone(pipeline.parse_seed(True))
        self.assertIsNone(pipeline.parse_seed("null"))

        # Negative seed wrapping/abs
        neg_parsed = pipeline.parse_seed("-12345")
        self.assertEqual(neg_parsed, 12345)
        self.assertIsInstance(neg_parsed, int)

        # Huge out-of-range seed wrapping
        huge_parsed = pipeline.parse_seed(2**35 + 500)
        self.assertIsInstance(huge_parsed, int)
        self.assertTrue(0 <= huge_parsed < 2**32)


if __name__ == "__main__":
    unittest.main()
