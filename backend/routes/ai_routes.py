from __future__ import annotations

import mimetypes
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from config import get_settings
from routes.ai.agent import run_ai_command
from utils.temp_storage import new_job_id, write_upload

router = APIRouter(prefix="/ai", tags=["ai"])
settings = get_settings()


def _guess_media(path: Path) -> str:
    mt, _ = mimetypes.guess_type(path.name)
    return mt or "application/octet-stream"


@router.post("/command")
async def ai_command(
    command: Annotated[str, Form()] = "",
    file: UploadFile | None = File(None),
    files: list[UploadFile] | None = File(None),
):
    """
    Natural language command + optional file(s).
    Supports: command only, file only (infer from extension), or both.
    """
    job_id = new_job_id()
    paths: list[Path] = []
    extra: dict = {}

    upload_list: list[UploadFile] = []
    if files:
        upload_list.extend(files)
    if file:
        upload_list.append(file)

    for uf in upload_list:
        if not uf.filename:
            continue
        data = await uf.read()
        max_b = settings.max_upload_mb * 1024 * 1024
        if len(data) > max_b:
            raise HTTPException(413, f"File exceeds {settings.max_upload_mb}MB limit")
        p = await write_upload(job_id, uf.filename, data)
        paths.append(p)

    cmd = (command or "").strip()
    if not cmd and not paths:
        raise HTTPException(400, "Provide a command and/or file upload")

    if not cmd and paths:
        ext = paths[0].suffix.lower()
        infer = {
            ".pdf": "Optimize and analyze this PDF.",
            ".docx": "Convert this Word document to PDF.",
            ".xlsx": "Convert this Excel file to PDF.",
            ".pptx": "Convert this PowerPoint to PDF.",
            ".jpg": "Convert this image to PDF.",
            ".jpeg": "Convert this image to PDF.",
            ".png": "Convert this image to PDF.",
            ".html": "Convert this HTML to PDF.",
            ".htm": "Convert this HTML to PDF.",
        }
        cmd = infer.get(ext, "Analyze this file and run the best PDF operation.")

    result = await run_ai_command(cmd, paths, extra)
    
    # Cleanup input paths immediately
    for p in paths:
        try:
            if p.exists():
                p.unlink()
        except OSError:
            pass

    message = "Done."
    if not result.get("ok"):
        message = result.get("error") or "Tool execution failed."
    else:
        action = result.get("action")
        if action == "password_strength":
            meta = result.get("meta") or {}
            message = f"Password strength: {meta.get('level')} (score {meta.get('score')}/{meta.get('max_score')}). Suggestions: {meta.get('suggestions')}"
        elif action in ("detect_encryption", "secure_validation", "file_scanner"):
            message = str(result.get("meta"))
        elif action in ("compress_pdf", "optimize_pdf"):
            meta = result.get("meta") or {}
            if isinstance(meta, dict) and meta.get("bytes_before") is not None:
                before = meta.get("bytes_before")
                after = meta.get("bytes_after")
                meth = meta.get("method", "")
                note = meta.get("note", "")
                pct = meta.get("saved_percent")
                extra = f" ({note})" if note else ""
                pct_s = f" — saved ~{pct}% " if pct is not None else " "
                message = f"Successfully executed: {action}.{pct_s}Size: {before} → {after} bytes ({meth}){extra}".strip()
            else:
                message = f"Successfully executed: {action}"
        else:
            message = f"Successfully executed: {action}"

    file_url = None
    op = result.get("output_path")
    if op and isinstance(op, Path) and op.exists():
        from utils.cloudinary_upload import upload_to_cloudinary
        file_url = await upload_to_cloudinary(str(op), folder="filegenie/ai_output")
        if not file_url:
            message += " (Cloudinary upload failed)"

    return {
        "message": message,
        "file_url": file_url,
        "action": result.get("action"),
        "parameters": result.get("parameters"),
        "meta": result.get("meta"),
        "ok": result.get("ok"),
    }


@router.post("/plan")
async def ai_plan_only(command: Annotated[str, Form()]):
    from routes.ai.agent import plan_command

    plan = await plan_command(command)
    return plan
