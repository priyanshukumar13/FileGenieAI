"""Simple upload endpoint for client-side history / chaining."""

from fastapi import APIRouter, File, HTTPException, UploadFile

from config import get_settings
from utils.temp_storage import new_job_id, write_upload

router = APIRouter(tags=["upload"])
settings = get_settings()


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(400, "No filename")
    data = await file.read()
    max_b = settings.max_upload_mb * 1024 * 1024
    if len(data) > max_b:
        raise HTTPException(413, f"File exceeds {settings.max_upload_mb}MB")
    jid = new_job_id()
    path = await write_upload(jid, file.filename, data)
    
    from utils.cloudinary_upload import upload_to_cloudinary
    file_url = await upload_to_cloudinary(str(path), folder="filegenie/uploads")
    
    if not file_url:
        raise HTTPException(500, "Cloudinary upload failed")

    return {
        "ok": True,
        "filename": file.filename,
        "size_bytes": len(data),
        "file_url": file_url,
    }
