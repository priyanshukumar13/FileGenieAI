from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Form

from services.security_service import password_strength, scan_file
from utils.temp_storage import new_job_id, write_upload
from fastapi import File, UploadFile, HTTPException
from config import get_settings

router = APIRouter(prefix="/security", tags=["security"])
settings = get_settings()


@router.post("/password-strength")
async def check_password(password: Annotated[str, Form()]):
    return password_strength(password)


@router.post("/scan-file")
async def scan_upload(file: UploadFile = File(...)):
    data = await file.read()
    if len(data) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(413, "File too large")
    jid = new_job_id()
    path = await write_upload(jid, file.filename or "upload.bin", data)
    return scan_file(path)
