from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from utils.temp_storage import get_download

router = APIRouter(tags=["download"])


@router.get("/download/{file_id}")
async def download_file(file_id: str):
    entry = get_download(file_id)
    if not entry:
        raise HTTPException(404, "File not found or expired")
    path: Path = entry["path"]
    if not path.exists():
        raise HTTPException(404, "File missing")
    return FileResponse(path, media_type=entry["media_type"], filename=path.name)
