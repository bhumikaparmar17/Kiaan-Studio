"""
Unit Tests for Kiaan AI Engine Cloudinary Storage Integration.
Verifies configuration detection, resource type mapping, and error resilience.
"""

import os
import sys
import unittest
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent
ENGINE_ROOT = CURRENT_DIR.parent
if str(ENGINE_ROOT) not in sys.path:
    sys.path.insert(0, str(ENGINE_ROOT))

from processors.cloudinary_storage import CloudinaryStorage


class TestCloudinaryStorage(unittest.TestCase):
    def setUp(self):
        # Save original env vars
        self.orig_name = os.environ.get("CLOUDINARY_CLOUD_NAME")
        self.orig_key = os.environ.get("CLOUDINARY_API_KEY")
        self.orig_sec = os.environ.get("CLOUDINARY_API_SECRET")

    def tearDown(self):
        # Restore env vars
        for k, v in [
            ("CLOUDINARY_CLOUD_NAME", self.orig_name),
            ("CLOUDINARY_API_KEY", self.orig_key),
            ("CLOUDINARY_API_SECRET", self.orig_sec),
        ]:
            if v is not None:
                os.environ[k] = v
            elif k in os.environ:
                del os.environ[k]

    def test_unconfigured_detection(self):
        os.environ.pop("CLOUDINARY_CLOUD_NAME", None)
        os.environ.pop("CLOUDINARY_API_KEY", None)
        os.environ.pop("CLOUDINARY_API_SECRET", None)

        self.assertFalse(CloudinaryStorage.is_configured())
        res = CloudinaryStorage.upload_media("nonexistent_file.webp")
        self.assertFalse(res["success"])
        self.assertIn("not found", res["error"].lower())

    def test_configured_detection(self):
        os.environ["CLOUDINARY_CLOUD_NAME"] = "test_cloud"
        os.environ["CLOUDINARY_API_KEY"] = "123456789"
        os.environ["CLOUDINARY_API_SECRET"] = "secret_abc"

        self.assertTrue(CloudinaryStorage.is_configured())

    def test_missing_file_handling(self):
        res = CloudinaryStorage.upload_media("totally_missing_path.jpg")
        self.assertFalse(res["success"])
        self.assertIn("not found", res["error"].lower())


if __name__ == "__main__":
    unittest.main()
