"""
Kiaan Studio - Cloudinary Storage Integration Module
Manages secure uploads for AI-generated images and videos to Cloudinary.
Handles automatic resource-type detection (image vs video) and provides
safe error handling with local fallback capabilities.
"""

import os
from pathlib import Path
from typing import Dict, Any, Optional

try:
    from config import CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_FOLDER
except (ImportError, ValueError):
    from ..config import CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_FOLDER


class CloudinaryStorage:
    _initialized = False

    @classmethod
    def is_configured(cls) -> bool:
        """
        Returns True if Cloudinary credentials are provided via environment variables.
        """
        cloud_name = os.environ.get("CLOUDINARY_CLOUD_NAME", CLOUDINARY_CLOUD_NAME)
        api_key = os.environ.get("CLOUDINARY_API_KEY", CLOUDINARY_API_KEY)
        api_secret = os.environ.get("CLOUDINARY_API_SECRET", CLOUDINARY_API_SECRET)
        return bool(cloud_name and api_key and api_secret)

    @classmethod
    def _initialize_client(cls) -> bool:
        """
        Initializes Cloudinary configuration with provided credentials.
        """
        if cls._initialized:
            return True

        if not cls.is_configured():
            return False

        try:
            import cloudinary
            cloud_name = os.environ.get("CLOUDINARY_CLOUD_NAME", CLOUDINARY_CLOUD_NAME)
            api_key = os.environ.get("CLOUDINARY_API_KEY", CLOUDINARY_API_KEY)
            api_secret = os.environ.get("CLOUDINARY_API_SECRET", CLOUDINARY_API_SECRET)

            cloudinary.config(
                cloud_name=cloud_name,
                api_key=api_key,
                api_secret=api_secret,
                secure=True
            )
            cls._initialized = True
            return True
        except Exception as e:
            print(f"[CloudinaryStorage] Failed to initialize Cloudinary client: {e}")
            return False

    @classmethod
    def upload_media(
        cls,
        file_path: str,
        media_type: Optional[str] = None,
        public_id: Optional[str] = None,
        folder: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Uploads an image or video file to Cloudinary.
        Automatically detects correct resource_type ('image' or 'video').
        """
        p = Path(file_path).resolve()
        if not p.is_file():
            return {
                "success": False,
                "error": f"Local file not found at {file_path}"
            }

        if not cls.is_configured():
            return {
                "success": False,
                "error": "Cloudinary credentials not configured in environment variables",
                "unconfigured": True
            }

        if not cls._initialize_client():
            return {
                "success": False,
                "error": "Cloudinary client initialization failed"
            }

        try:
            import cloudinary.uploader

            # Detect resource_type
            ext = p.suffix.lower()
            if media_type:
                res_type = "video" if "video" in str(media_type).lower() else "image"
            elif ext in [".mp4", ".mov", ".avi", ".webm", ".mkv"]:
                res_type = "video"
            else:
                res_type = "image"

            target_folder = folder or os.environ.get("CLOUDINARY_FOLDER", CLOUDINARY_FOLDER)

            upload_kwargs = {
                "folder": target_folder,
                "resource_type": res_type,
                "use_filename": True,
                "unique_filename": True,
                "overwrite": False
            }

            if public_id:
                upload_kwargs["public_id"] = public_id

            resp = cloudinary.uploader.upload(str(p), **upload_kwargs)

            secure_url = resp.get("secure_url")
            if not secure_url:
                return {
                    "success": False,
                    "error": "Cloudinary did not return a secure_url"
                }

            file_size = resp.get("bytes") or p.stat().st_size
            width = resp.get("width")
            height = resp.get("height")
            dimensions = f"{width}x{height}" if width and height else None

            return {
                "success": True,
                "secure_url": secure_url,
                "public_id": resp.get("public_id"),
                "format": resp.get("format") or ext.replace(".", ""),
                "resource_type": res_type,
                "dimensions": dimensions,
                "bytes": file_size
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
