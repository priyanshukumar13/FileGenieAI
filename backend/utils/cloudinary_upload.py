import cloudinary.uploader
import asyncio
from typing import Optional
import os
import logging
from .cloudinary_config import cloudinary # ensuring config is loaded

logger = logging.getLogger(__name__)

async def upload_to_cloudinary(file_path: str, folder: str = "filegenie") -> Optional[str]:
    """
    Uploads a file to Cloudinary asynchronously and returns the secure URL.
    Deletes the local file after success/failure to save space.
    """
    loop = asyncio.get_event_loop()
    try:
        if not os.path.exists(file_path):
            logger.error(f"File not found: {file_path}")
            return None

        # run_in_executor for sync cloudinary upload
        result = await loop.run_in_executor(
            None,
            lambda: cloudinary.uploader.upload(
                file_path,
                folder=folder,
                resource_type="raw" # IMPORTANT for PDFs/non-image docs
            )
        )
        
        secure_url = result.get("secure_url")
        
        # Optionally delete local file after upload
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"Deleted local file: {file_path}")

        return secure_url

    except Exception as e:
        logger.error(f"Cloudinary upload failed: {e}")
        # Clean up local file even on failure
        if os.path.exists(file_path):
            os.remove(file_path)
        return None
