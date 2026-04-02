from __future__ import annotations

import asyncio
import shutil
from pathlib import Path
from typing import Any

from config import get_settings

from services import ai_pdf_service, convert_service, pdf_core, security_service
from utils.temp_storage import new_job_id

settings = get_settings()

_ACTIONS_NO_FILE = frozenset({"password_strength", "html_to_pdf"})


async def execute_tool(
    action: str,
    paths: list[Path],
    parameters: dict[str, Any],
) -> dict[str, Any]:
    """Run a registered tool. paths[0] is primary input; merge/compare use multiple."""
    job = new_job_id()
    out_dir = settings.temp_dir / job
    out_dir.mkdir(parents=True, exist_ok=True)

    def out_file(name: str) -> Path:
        return out_dir / name

    primary = paths[0] if paths else None

    if action not in _ACTIONS_NO_FILE and primary is None:
        return {"ok": False, "error": "This action requires at least one uploaded file", "output_path": None, "meta": {}}

    try:
        if action == "merge_pdf":
            if len(paths) < 2:
                return {"ok": False, "error": "merge_pdf requires multiple files", "output_path": None, "meta": {}}
            dest = out_file("merged.pdf")
            await asyncio.to_thread(pdf_core.merge_pdfs, paths, dest)
            return {"ok": True, "error": None, "output_path": dest, "meta": {}, "download_name": "merged.pdf"}

        if action == "split_pdf":
            ranges = parameters.get("ranges")
            individual = parameters.get("individual_pages") or parameters.get("pages")
            dests = await asyncio.to_thread(
                pdf_core.split_pdf,
                primary,
                out_dir,
                ranges,
                individual if isinstance(individual, list) else None,
            )
            if len(dests) == 1:
                return {"ok": True, "error": None, "output_path": dests[0], "meta": {}, "download_name": dests[0].name}
            zip_path = out_file("split_bundle.zip")
            await asyncio.to_thread(_zip_files, dests, zip_path)
            return {"ok": True, "error": None, "output_path": zip_path, "meta": {"parts": len(dests)}, "download_name": "split.zip"}

        if action == "remove_pages":
            dest = out_file("out.pdf")
            pages = parameters.get("pages") or []
            await asyncio.to_thread(pdf_core.remove_pages, primary, pages, dest)
            return {"ok": True, "error": None, "output_path": dest, "meta": {}, "download_name": "edited.pdf"}

        if action == "extract_pages":
            dest = out_file("extract.pdf")
            pages = parameters.get("pages") or []
            await asyncio.to_thread(pdf_core.extract_pages, primary, pages, dest)
            return {"ok": True, "error": None, "output_path": dest, "meta": {}, "download_name": "extract.pdf"}

        if action == "rotate_pdf":
            dest = out_file("rotated.pdf")
            angle = int(parameters.get("angle") or 90)
            pages = parameters.get("pages")
            await asyncio.to_thread(pdf_core.rotate_pages, primary, angle, pages, dest)
            return {"ok": True, "error": None, "output_path": dest, "meta": {}, "download_name": "rotated.pdf"}

        if action == "crop_pdf":
            dest = out_file("cropped.pdf")
            rect = parameters.get("rect")
            rn = tuple(rect) if rect and len(rect) == 4 else None
            await asyncio.to_thread(pdf_core.crop_pdf, primary, dest, rn)
            return {"ok": True, "error": None, "output_path": dest, "meta": {}, "download_name": "cropped.pdf"}

        if action == "organize_pdf":
            dest = out_file("organized.pdf")
            order = parameters.get("order") or []
            await asyncio.to_thread(pdf_core.organize_pdf, primary, order, dest)
            return {"ok": True, "error": None, "output_path": dest, "meta": {}, "download_name": "organized.pdf"}

        if action == "compress_pdf":
            dest = out_file("compressed.pdf")
            level = str(parameters.get("level") or "medium")
            raw_t = parameters.get("target_size_kb") or parameters.get("target_kb")
            target_kb: int | None = None
            if raw_t is not None:
                try:
                    target_kb = int(float(raw_t))
                except (TypeError, ValueError):
                    target_kb = None
            meta = await asyncio.to_thread(pdf_core.compress_pdf, primary, dest, level, target_kb)
            return {"ok": True, "error": None, "output_path": dest, "meta": meta, "download_name": "compressed.pdf"}

        if action == "optimize_pdf":
            dest = out_file("optimized.pdf")
            meta = await asyncio.to_thread(pdf_core.optimize_pdf, primary, dest)
            return {"ok": True, "error": None, "output_path": dest, "meta": meta, "download_name": "optimized.pdf"}

        if action == "repair_pdf":
            dest = out_file("repaired.pdf")
            await asyncio.to_thread(pdf_core.repair_pdf, primary, dest)
            return {"ok": True, "error": None, "output_path": dest, "meta": {}, "download_name": "repaired.pdf"}

        if action == "protect_pdf":
            dest = out_file("protected.pdf")
            pw = str(parameters.get("password") or "password")
            await asyncio.to_thread(pdf_core.protect_pdf, primary, dest, pw)
            return {"ok": True, "error": None, "output_path": dest, "meta": {"note": "password applied"}, "download_name": "protected.pdf"}

        if action == "unlock_pdf":
            dest = out_file("unlocked.pdf")
            pw = str(parameters.get("password") or "")
            await asyncio.to_thread(pdf_core.unlock_pdf, primary, dest, pw)
            return {"ok": True, "error": None, "output_path": dest, "meta": {}, "download_name": "unlocked.pdf"}

        if action == "detect_encryption":
            meta = await asyncio.to_thread(pdf_core.detect_encryption, primary)
            return {"ok": True, "error": None, "output_path": None, "meta": meta, "download_name": None}

        if action == "secure_validation":
            meta = await asyncio.to_thread(pdf_core.validate_pdf, primary)
            return {"ok": True, "error": None, "output_path": None, "meta": meta, "download_name": None}

        if action == "watermark_pdf":
            dest = out_file("watermarked.pdf")
            text = str(parameters.get("text") or "CONFIDENTIAL")
            await asyncio.to_thread(pdf_core.watermark_pdf, primary, dest, text)
            return {"ok": True, "error": None, "output_path": dest, "meta": {}, "download_name": "watermarked.pdf"}

        if action == "add_page_numbers":
            dest = out_file("numbered.pdf")
            pos = str(parameters.get("position") or "bottom-center")
            await asyncio.to_thread(pdf_core.add_page_numbers, primary, dest, pos)
            return {"ok": True, "error": None, "output_path": dest, "meta": {}, "download_name": "numbered.pdf"}

        if action == "redact_pdf" or action == "redact_sensitive":
            dest = out_file("redacted.pdf")
            rects = parameters.get("rects")
            await asyncio.to_thread(pdf_core.redact_regions, primary, dest, rects)
            return {"ok": True, "error": None, "output_path": dest, "meta": {}, "download_name": "redacted.pdf"}

        if action == "compare_pdfs":
            if len(paths) < 2:
                return {"ok": False, "error": "compare_pdfs needs two PDFs", "output_path": None, "meta": {}}
            dest = out_file("compare_report.pdf")
            meta = await asyncio.to_thread(pdf_core.compare_pdfs, paths[0], paths[1], dest)
            return {"ok": True, "error": None, "output_path": dest, "meta": meta, "download_name": "compare_report.pdf"}

        if action == "sign_pdf":
            dest = out_file("signed.pdf")
            sig = Path(parameters["image_path"]) if parameters.get("image_path") else None
            if sig and not sig.exists():
                sig = None
            extra = paths[1] if len(paths) > 1 else None
            await asyncio.to_thread(pdf_core.sign_pdf_overlay, primary, sig or extra, dest)
            return {"ok": True, "error": None, "output_path": dest, "meta": {}, "download_name": "signed.pdf"}

        if action == "pdf_to_jpg":
            dpi = int(parameters.get("dpi") or 150)
            outs = await asyncio.to_thread(pdf_core.pdf_to_images, primary, out_dir, dpi)
            if len(outs) == 1:
                return {"ok": True, "error": None, "output_path": outs[0], "meta": {}, "download_name": outs[0].name}
            zip_path = out_file("images.zip")
            await asyncio.to_thread(_zip_files, outs, zip_path)
            return {"ok": True, "error": None, "output_path": zip_path, "meta": {"pages": len(outs)}, "download_name": "pages.zip"}

        if action in ("scan_to_pdf", "jpg_to_pdf", "image_convert"):
            dest = out_file("from_images.pdf")
            await asyncio.to_thread(pdf_core.images_to_pdf_simple, paths, dest)
            return {"ok": True, "error": None, "output_path": dest, "meta": {}, "download_name": "images.pdf"}

        if action == "word_to_pdf":
            dest = out_file("converted.pdf")
            await asyncio.to_thread(convert_service.word_to_pdf, primary, dest)
            return {"ok": True, "error": None, "output_path": dest, "meta": {}, "download_name": "converted.pdf"}

        if action == "excel_to_pdf":
            dest = out_file("converted.pdf")
            await asyncio.to_thread(convert_service.excel_to_pdf, primary, dest)
            return {"ok": True, "error": None, "output_path": dest, "meta": {}, "download_name": "converted.pdf"}

        if action == "powerpoint_to_pdf":
            dest = out_file("converted.pdf")
            await asyncio.to_thread(convert_service.powerpoint_to_pdf, primary, dest)
            return {"ok": True, "error": None, "output_path": dest, "meta": {}, "download_name": "converted.pdf"}

        if action == "html_to_pdf":
            dest = out_file("converted.pdf")
            html = parameters.get("html") or "<html><body><h1>Empty</h1></body></html>"
            await asyncio.to_thread(convert_service.html_to_pdf, str(html), dest)
            return {"ok": True, "error": None, "output_path": dest, "meta": {}, "download_name": "converted.pdf"}

        if action == "pdf_to_word":
            dest = out_file("converted.docx")
            await asyncio.to_thread(convert_service.pdf_to_word, primary, dest)
            return {"ok": True, "error": None, "output_path": dest, "meta": {}, "download_name": "converted.docx"}

        if action == "pdf_to_excel":
            dest = out_file("converted.xlsx")
            meta = await asyncio.to_thread(convert_service.pdf_to_excel_tables, primary, dest)
            return {"ok": True, "error": None, "output_path": dest, "meta": meta, "download_name": "converted.xlsx"}

        if action == "pdf_to_powerpoint":
            dest = out_file("converted.pptx")
            await asyncio.to_thread(convert_service.pdf_to_powerpoint, primary, dest)
            return {"ok": True, "error": None, "output_path": dest, "meta": {}, "download_name": "converted.pptx"}

        if action == "pdf_to_pdfa":
            dest = out_file("pdfa.pdf")
            await asyncio.to_thread(pdf_core.pdf_to_pdfa, primary, dest)
            return {"ok": True, "error": None, "output_path": dest, "meta": {}, "download_name": "pdfa.pdf"}

        if action == "ocr_pdf":
            dest_txt = out_file("ocr.txt")
            meta = await asyncio.to_thread(ai_pdf_service.ocr_pdf_to_text, primary, dest_txt)
            return {"ok": True, "error": None, "output_path": dest_txt, "meta": meta, "download_name": "ocr.txt"}

        if action == "summarize_pdf":
            dest = out_file("summary.pdf")
            await ai_pdf_service.summarize_to_pdf(primary, dest)
            return {"ok": True, "error": None, "output_path": dest, "meta": {}, "download_name": "summary.pdf"}

        if action == "translate_pdf":
            dest = out_file("translated.pdf")
            lang = str(parameters.get("target_language") or parameters.get("language") or "Spanish")
            await ai_pdf_service.translate_pdf_file(primary, dest, lang)
            return {"ok": True, "error": None, "output_path": dest, "meta": {"language": lang}, "download_name": "translated.pdf"}

        if action == "edit_pdf_text":
            dest = out_file("edited.pdf")
            text = str(parameters.get("text") or "Edited text")
            page = int(parameters.get("page") or 1)
            await asyncio.to_thread(pdf_core.edit_insert_text, primary, dest, text, page)
            return {"ok": True, "error": None, "output_path": dest, "meta": {}, "download_name": "edited.pdf"}

        if action == "add_remove_images":
            dest = out_file("edited.pdf")
            img_p = paths[1] if len(paths) > 1 else None
            if not img_p:
                return {"ok": False, "error": "add_remove_images requires an image file", "output_path": None, "meta": {}}
            page = int(parameters.get("page") or 1)
            await asyncio.to_thread(pdf_core.add_image_to_page, primary, img_p, dest, page)
            return {"ok": True, "error": None, "output_path": dest, "meta": {}, "download_name": "edited.pdf"}

        if action == "password_strength":
            pw = str(parameters.get("password") or "")
            meta = security_service.password_strength(pw)
            return {"ok": True, "error": None, "output_path": None, "meta": meta, "download_name": None}

        if action == "file_scanner":
            meta = security_service.scan_file(primary)
            return {"ok": True, "error": None, "output_path": None, "meta": meta, "download_name": None}

        return {"ok": False, "error": f"Unknown action: {action}", "output_path": None, "meta": {}}
    except Exception as e:
        return {"ok": False, "error": str(e), "output_path": None, "meta": {}}


def _zip_files(files: list[Path], dest: Path) -> None:
    import zipfile

    with zipfile.ZipFile(dest, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in files:
            zf.write(f, arcname=f.name)
