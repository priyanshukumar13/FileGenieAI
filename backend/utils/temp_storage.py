import asyncio
import shutil
import time
import uuid
from pathlib import Path
from typing import Any

import aiofiles

from config import get_settings


_settings = get_settings()
_DOWNLOAD_REGISTRY: dict[str, dict[str, Any]] = {}


def new_job_id() -> str:
    return uuid.uuid4().hex


def save_path_for(job_id: str, name: str) -> Path:
    safe = Path(name).name.replace("..", "_")
    return _settings.temp_dir / f"{job_id}_{safe}"


async def write_upload(job_id: str, filename: str, data: bytes) -> Path:
    path = save_path_for(job_id, filename)
    async with aiofiles.open(path, "wb") as f:
        await f.write(data)
    return path


def register_download(path: Path, media_type: str = "application/octet-stream") -> str:
    fid = uuid.uuid4().hex
    _DOWNLOAD_REGISTRY[fid] = {
        "path": path,
        "media_type": media_type,
        "created": time.time(),
    }
    return fid


def get_download(fid: str) -> dict[str, Any] | None:
    entry = _DOWNLOAD_REGISTRY.get(fid)
    if not entry:
        return None
    if time.time() - entry["created"] > _settings.download_ttl_seconds:
        p = entry["path"]
        try:
            if isinstance(p, Path) and p.exists():
                p.unlink()
        except OSError:
            pass
        del _DOWNLOAD_REGISTRY[fid]
        return None
    return entry


def cleanup_job_dir(job_id: str) -> None:
    for p in _settings.temp_dir.glob(f"{job_id}_*"):
        try:
            p.unlink()
        except OSError:
            pass


async def cleanup_old_downloads() -> None:
    now = time.time()
    ttl = _settings.download_ttl_seconds
    to_del: list[str] = []
    for fid, entry in list(_DOWNLOAD_REGISTRY.items()):
        if now - entry["created"] > ttl:
            to_del.append(fid)
    for fid in to_del:
        entry = _DOWNLOAD_REGISTRY.pop(fid, None)
        if entry:
            p = entry["path"]
            try:
                if isinstance(p, Path) and p.exists():
                    p.unlink()
            except OSError:
                pass


