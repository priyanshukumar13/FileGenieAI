from __future__ import annotations

import json
import mimetypes
from pathlib import Path
from typing import Annotated, Any

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

import fitz

from config import get_settings
from routes.ai.tool_registry import ALL_ACTIONS
from services.tool_executor import execute_tool
from utils.temp_storage import write_upload, new_job_id

router = APIRouter(prefix="/tools", tags=["tools"])
settings = get_settings()
_NO_FILE_ACTIONS = frozenset({"password_strength", "html_to_pdf"})


def _guess_media(path: Path) -> str:
    mt, _ = mimetypes.guess_type(path.name)
    return mt or "application/octet-stream"


@router.post("/execute")
async def execute_tool_direct(
    action: Annotated[str, Form()],
    parameters: Annotated[str, Form()] = "{}",
    files: list[UploadFile] | None = File(None),
):
    if action not in ALL_ACTIONS:
        raise HTTPException(400, f"Unknown action: {action}")
    try:
        params: dict[str, Any] = json.loads(parameters) if parameters else {}
    except json.JSONDecodeError:
        raise HTTPException(400, "Invalid JSON in parameters")

    job_id = new_job_id()
    paths: list[Path] = []
    if files:
        for uf in files:
            if not uf.filename:
                continue
            data = await uf.read()
            if len(data) > settings.max_upload_mb * 1024 * 1024:
                raise HTTPException(413, "File too large")
            paths.append(await write_upload(job_id, uf.filename, data))

    if action not in _NO_FILE_ACTIONS and not paths:
        raise HTTPException(400, "At least one file is required for this action")
    if action == "html_to_pdf" and not paths:
        if not params.get("html"):
            raise HTTPException(400, "html_to_pdf requires parameters.html or an HTML file upload")

    result = await execute_tool(action, paths, params)
    
    # Cleanup input paths immediately
    for p in paths:
        try:
            if p.exists():
                p.unlink()
        except OSError:
            # File might still be locked on Windows, skip it for now
            pass

    if not result.get("ok"):
        raise HTTPException(400, result.get("error") or "Execution failed")

    file_url = None
    op = result.get("output_path")
    if op and isinstance(op, Path) and op.exists():
        from utils.cloudinary_upload import upload_to_cloudinary
        file_url = await upload_to_cloudinary(str(op), folder="filegenie/output")
        if not file_url:
             raise HTTPException(500, "Failed to upload output to Cloudinary")

    return {
        "ok": True,
        "action": action,
        "message": "Completed",
        "file_url": file_url,
        "meta": result.get("meta"),
    }


@router.post("/pdf-info")
async def pdf_info(file: UploadFile = File(...)):
    """Return page count for building organize/split UIs."""
    if not file.filename:
        raise HTTPException(400, "No file")
    data = await file.read()
    if len(data) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(413, "File too large")
    jid = new_job_id()
    path = await write_upload(jid, file.filename, data)
    doc = fitz.open(path)
    n = doc.page_count
    meta = doc.metadata or {}
    doc.close()
    
    # Clean up local file after processing info
    if path.exists():
        path.unlink()
        
    return {"page_count": n, "metadata": meta}


@router.post("/split")
async def split_pdf_endpoint(
    file: UploadFile = File(...),
    mode: str = Form(...),
    ranges: str | None = Form(None),
    every_n: int | None = Form(None),
    pages: str | None = Form(None),
):
    import asyncio
    from services.split_service import split_pdf_pypdf2, create_zip
    
    if not file.filename:
        raise HTTPException(400, "No file provided")
    if mode not in ("range", "every_n", "extract"):
        raise HTTPException(422, "Invalid mode")
        
    data = await file.read()
    if len(data) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(413, "File too large")
        
    jid = new_job_id()
    path = await write_upload(jid, file.filename, data)
    out_dir = settings.temp_dir / jid
    
    try:
        outputs = await asyncio.to_thread(
            split_pdf_pypdf2, path, out_dir, mode, ranges, every_n, pages
        )
    except Exception as e:
        if path.exists(): path.unlink()
        raise HTTPException(400, str(e))
        
    # Cleanup input path
    try:
        if path.exists():
            path.unlink()
    except OSError:
        pass
        
    if not outputs:
        raise HTTPException(400, "Split failed, no output generated")
        
    from utils.cloudinary_upload import upload_to_cloudinary
    if len(outputs) == 1:
        op = outputs[0]
        file_url = await upload_to_cloudinary(str(op), folder="filegenie/split")
        if not file_url:
            raise HTTPException(500, "Cloudinary upload failed")
        return {"ok": True, "file_url": file_url, "message": "Split complete"}
    else:
        zip_path = out_dir / "split_results.zip"
        await asyncio.to_thread(create_zip, outputs, zip_path)
        file_url = await upload_to_cloudinary(str(zip_path), folder="filegenie/split")
        if not file_url:
            raise HTTPException(500, "Cloudinary upload failed")
        return {"ok": True, "file_url": file_url, "message": "Split complete"}

@router.get("/registry")
async def tool_registry():
    from routes.ai.tool_registry import TOOL_CATEGORIES

    return {"categories": TOOL_CATEGORIES, "actions": ALL_ACTIONS}
