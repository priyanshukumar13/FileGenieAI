from __future__ import annotations

import io
import shutil
from pathlib import Path
from typing import Any

import fitz  # PyMuPDF
import pikepdf
from PIL import Image


def merge_pdfs(paths: list[Path], out: Path) -> None:
    out.parent.mkdir(parents=True, exist_ok=True)
    with fitz.open() as merged:
        for p in paths:
            with fitz.open(p) as src:
                merged.insert_pdf(src)
        merged.save(out.as_posix(), garbage=4, deflate=True)


def split_pdf(
    path: Path,
    out_dir: Path,
    ranges: list[list[int]] | None = None,
    individual_pages: list[int] | None = None,
) -> list[Path]:
    """ranges: [[start,end], ...] 1-based inclusive. individual_pages: single pages."""
    out_dir.mkdir(parents=True, exist_ok=True)
    outputs: list[Path] = []
    stem = path.stem
    with fitz.open(path) as doc:
        if individual_pages:
            for i in individual_pages:
                if i < 1 or i > doc.page_count:
                    continue
                with fitz.open() as newd:
                    newd.insert_pdf(doc, from_page=i - 1, to_page=i - 1)
                    outp = out_dir / f"{stem}_p{i}.pdf"
                    newd.save(outp.as_posix(), garbage=4, deflate=True)
                outputs.append(outp)
            return outputs
        if not ranges:
            ranges = [[1, doc.page_count]]
        for idx, r in enumerate(ranges):
            a, b = max(1, r[0]), min(doc.page_count, r[1])
            with fitz.open() as newd:
                newd.insert_pdf(doc, from_page=a - 1, to_page=b - 1)
                outp = out_dir / f"{stem}_part{idx + 1}.pdf"
                newd.save(outp.as_posix(), garbage=4, deflate=True)
            outputs.append(outp)
    return outputs


def remove_pages(path: Path, pages: list[int], out: Path) -> None:
    with fitz.open(path) as doc:
        to_del = sorted({p - 1 for p in pages if 1 <= p <= doc.page_count}, reverse=True)
        for p in to_del:
            doc.delete_page(p)
        doc.save(out.as_posix(), garbage=4, deflate=True)


def extract_pages(path: Path, pages: list[int], out: Path) -> None:
    with fitz.open(path) as doc:
        with fitz.open() as newd:
            for p in sorted(set(pages)):
                if 1 <= p <= doc.page_count:
                    newd.insert_pdf(doc, from_page=p - 1, to_page=p - 1)
            newd.save(out.as_posix(), garbage=4, deflate=True)


def rotate_pages(path: Path, angle: int, pages: list[int] | None, out: Path) -> None:
    doc = fitz.open(path)
    rot = angle % 360
    if rot not in (0, 90, 180, 270):
        rot = 90
    r = list(range(doc.page_count)) if not pages else [p - 1 for p in pages if 1 <= p <= doc.page_count]
    for i in r:
        doc[i].set_rotation((doc[i].rotation + rot) % 360)
    doc.save(out.as_posix(), garbage=4, deflate=True)
    doc.close()


def crop_pdf(path: Path, out: Path, rect_norm: tuple[float, float, float, float] | None = None) -> None:
    """rect_norm: (x0,y0,x1,y1) in 0-1 relative to mediabox."""
    with fitz.open(path) as doc:
        for i in range(doc.page_count):
            page = doc[i]
            r = page.rect
            if rect_norm:
                x0, y0, x1, y1 = rect_norm
                clip = fitz.Rect(r.x0 + x0 * r.width, r.y0 + y0 * r.height, r.x0 + x1 * r.width, r.y0 + y1 * r.height)
            else:
                m = 36
                clip = fitz.Rect(r.x0 + m, r.y0 + m, r.x1 - m, r.y1 - m)
            page.set_cropbox(clip)
            page.set_mediabox(clip)
        doc.save(out.as_posix(), garbage=4, deflate=True)


def organize_pdf(path: Path, order: list[int], out: Path) -> None:
    """order: 1-based new order of pages. If empty, keeps original order."""
    with fitz.open(path) as doc:
        if not order:
            order = list(range(1, doc.page_count + 1))
            
        with fitz.open() as newd:
            for p in order:
                if 1 <= p <= doc.page_count:
                    newd.insert_pdf(doc, from_page=p - 1, to_page=p - 1)
            
            if newd.page_count == 0:
                # Fallback if no valid pages in order list
                newd.insert_pdf(doc)
                
            newd.save(out.as_posix(), garbage=4, deflate=True)


def compress_pdf_structural(path: Path, out: Path, level: str = "medium") -> dict[str, Any]:
    """Rewrite PDF with garbage collection and deflate (often small gains on vector PDFs)."""
    orig = path.stat().st_size
    with fitz.open(path) as doc:
        g = {"low": 4, "medium": 4, "high": 3}.get(level.lower(), 4)
        out_path = out.as_posix()
        try:
            doc.save(
                out_path,
                garbage=g,
                deflate=True,
                clean=True,
                deflate_images=True,
                deflate_fonts=True,
            )
        except TypeError:
            try:
                doc.save(out_path, garbage=g, deflate=True, clean=True)
            except TypeError:
                doc.save(out_path, garbage=g, deflate=True)
    final = out.stat().st_size
    return {
        "bytes_before": orig,
        "bytes_after": final,
        "method": "structural",
        "level": level,
        "saved_percent": round(100 * (1 - final / max(orig, 1)), 1),
    }


def compress_pdf_to_target_kb(path: Path, out: Path, target_kb: int) -> dict[str, Any]:
    """
    Aggressively reduce size by re-rasterizing pages until under target (best-effort).
    Destroys vector text (image-only pages). Use when user asks for a max file size.
    """
    target_kb = max(1, int(target_kb))
    target_bytes = target_kb * 1024
    orig = path.stat().st_size
    if orig <= target_bytes:
        shutil.copy(path, out)
        return {
            "bytes_before": orig,
            "bytes_after": out.stat().st_size,
            "method": "copy",
            "note": "already under target",
            "target_size_kb": target_kb,
        }

    src = fitz.open(path)
    best_buf: bytes | None = None
    best_size = orig
    scales = [1.0, 0.92, 0.85, 0.78, 0.7, 0.62, 0.55, 0.48, 0.42, 0.36, 0.3, 0.25, 0.2, 0.16]
    hit_scale = 1.0

    try:
        for scale in scales:
            nd = fitz.open()
            try:
                m = fitz.Matrix(scale, scale)
                for i in range(src.page_count):
                    page = src[i]
                    pix = page.get_pixmap(matrix=m, alpha=False)
                    r = page.rect
                    np = nd.new_page(width=r.width, height=r.height)
                    np.insert_image(np.rect, pixmap=pix)
                bio = io.BytesIO()
                nd.save(bio, garbage=4, deflate=True)
                buf = bio.getvalue()
            finally:
                nd.close()

            sz = len(buf)
            if sz < best_size:
                best_size = sz
                best_buf = buf
                hit_scale = scale
            if sz <= target_bytes:
                out.write_bytes(buf)
                return {
                    "bytes_before": orig,
                    "bytes_after": sz,
                    "method": "rasterize",
                    "scale": scale,
                    "target_size_kb": target_kb,
                    "saved_percent": round(100 * (1 - sz / max(orig, 1)), 1),
                }
    finally:
        src.close()

    if best_buf is not None:
        out.write_bytes(best_buf)
        return {
            "bytes_before": orig,
            "bytes_after": len(best_buf),
            "method": "rasterize_best_effort",
            "scale": hit_scale,
            "target_size_kb": target_kb,
            "note": f"Could not reach {target_kb} KB; saved smallest attempt ({best_size // 1024} KB).",
            "saved_percent": round(100 * (1 - len(best_buf) / max(orig, 1)), 1),
        }

    shutil.copy(path, out)
    return {"bytes_before": orig, "bytes_after": out.stat().st_size, "error": "compression failed", "target_size_kb": target_kb}


def compress_pdf(
    path: Path,
    out: Path,
    level: str = "medium",
    target_size_kb: int | None = None,
) -> dict[str, Any]:
    """Structural compress, or target-size rasterization when target_size_kb is set."""
    if target_size_kb is not None:
        return compress_pdf_to_target_kb(path, out, target_size_kb)
    return compress_pdf_structural(path, out, level)


def optimize_pdf(path: Path, out: Path) -> dict[str, Any]:
    orig = path.stat().st_size
    with fitz.open(path) as doc:
        out_path = out.as_posix()
        try:
            doc.save(out_path, garbage=4, deflate=True, clean=True, deflate_images=True, deflate_fonts=True)
        except TypeError:
            try:
                doc.save(out_path, garbage=4, deflate=True, clean=True)
            except TypeError:
                doc.save(out_path, garbage=4, deflate=True)
    final = out.stat().st_size
    return {
        "bytes_before": orig,
        "bytes_after": final,
        "method": "optimize",
        "saved_percent": round(100 * (1 - final / max(orig, 1)), 1),
    }


def repair_pdf(path: Path, out: Path) -> None:
    try:
        with pikepdf.open(path) as pdf:
            pdf.save(out)
    except Exception:
        shutil.copy(path, out)


def protect_pdf(path: Path, out: Path, user_password: str) -> None:
    with fitz.open(path) as doc:
        perm = int(fitz.PDF_PERM_ACCESSIBILITY | fitz.PDF_PERM_PRINT | fitz.PDF_PERM_COPY)
        doc.save(out.as_posix(), encryption=fitz.PDF_ENCRYPT_AES_256, user_pw=user_password, owner_pw=user_password, permissions=perm)


def unlock_pdf(path: Path, out: Path, password: str) -> None:
    with fitz.open(path, password=password) as doc:
        doc.save(out.as_posix(), garbage=4, deflate=True, encryption=fitz.PDF_ENCRYPT_NONE)


def watermark_pdf(path: Path, out: Path, text: str) -> None:
    with fitz.open(path) as doc:
        for i in range(doc.page_count):
            page = doc[i]
            r = page.rect
            page.insert_text(
                (r.width / 4, r.height / 2),
                text,
                fontsize=48,
                color=(0.8, 0.8, 0.8),
                render_mode=3,
            )
        doc.save(out.as_posix(), garbage=4, deflate=True)


def add_page_numbers(path: Path, out: Path, position: str = "bottom-center") -> None:
    with fitz.open(path) as doc:
        for i in range(doc.page_count):
            page = doc[i]
            r = page.rect
            label = f"{i + 1}"
            if position == "bottom-center":
                p = fitz.Point(r.width / 2 - 10, r.height - 30)
            elif position == "top-center":
                p = fitz.Point(r.width / 2 - 10, 30)
            else:
                p = fitz.Point(r.width - 80, r.height - 30)
            page.insert_text(p, label, fontsize=11)
        doc.save(out.as_posix(), garbage=4, deflate=True)


def redact_regions(path: Path, out: Path, rects: list[tuple[float, float, float, float]] | None) -> None:
    with fitz.open(path) as doc:
        for i in range(doc.page_count):
            page = doc[i]
            r = page.rect
            if rects:
                for t in rects:
                    x0, y0, x1, y1 = t
                    box = fitz.Rect(x0, y0, x1, y1)
                    page.add_redact_annot(box, fill=(0, 0, 0))
            else:
                page.add_redact_annot(fitz.Rect(r.x0, r.y0, r.x1, r.y1 * 0.15), fill=(0, 0, 0))
            page.apply_redactions()
        doc.save(out.as_posix(), garbage=4, deflate=True)


def compare_pdfs(path_a: Path, path_b: Path, out: Path) -> dict[str, Any]:
    da = fitz.open(path_a)
    db = fitz.open(path_b)
    summary = {
        "pages_a": da.page_count,
        "pages_b": db.page_count,
        "text_diff_chars": 0,
    }
    ta = "\n".join(da[i].get_text() for i in range(da.page_count))
    tb = "\n".join(db[i].get_text() for i in range(db.page_count))
    summary["text_diff_chars"] = abs(len(ta) - len(tb))
    out_doc = fitz.open()
    page = out_doc.new_page()
    report = (
        f"Compare report\nPages A: {da.page_count}  Pages B: {db.page_count}\n"
        f"Text length A: {len(ta)}  B: {len(tb)}\n"
        "Pages with differing rendered previews are marked in the following pages.\n"
    )
    page.insert_text((50, 72), report, fontsize=10)
    mat = fitz.Matrix(0.35, 0.35)
    n = min(da.page_count, db.page_count, 5)
    for i in range(n):
        pa, pb = da[i], db[i]
        pix_a = pa.get_pixmap(matrix=mat, alpha=False)
        pix_b = pb.get_pixmap(matrix=mat, alpha=False)
        diff = pix_a.samples != pix_b.samples
        np = out_doc.new_page()
        if diff:
            np.insert_text((20, 40), f"Page {i + 1}: DIFF", color=(1, 0, 0), fontsize=14)
        else:
            np.insert_text((20, 40), f"Page {i + 1}: same raster preview", color=(0, 0.5, 0), fontsize=12)
        np.show_pdf_page(fitz.Rect(20, 60, 300, 400), da, i)
        np.show_pdf_page(fitz.Rect(320, 60, 600, 400), db, i)
    out_doc.save(out.as_posix(), garbage=4, deflate=True)
    out_doc.close()
    da.close()
    db.close()
    return summary


def sign_pdf_overlay(path: Path, sig_image: Path | None, out: Path) -> None:
    with fitz.open(path) as doc:
        last = doc.page_count - 1
        page = doc[last]
        r = page.rect
        if sig_image and sig_image.exists():
            ir = fitz.Rect(r.width - 200, r.height - 120, r.width - 20, r.height - 20)
            page.insert_image(ir, filename=sig_image.as_posix())
        else:
            page.insert_text((r.width - 200, r.height - 40), "Signed", fontsize=14, color=(0, 0, 1))
        doc.save(out.as_posix(), garbage=4, deflate=True)


def pdf_to_images(path: Path, out_dir: Path, dpi: int = 150) -> list[Path]:
    with fitz.open(path) as doc:
        out_dir.mkdir(parents=True, exist_ok=True)
        outs: list[Path] = []
        zoom = dpi / 72
        mat = fitz.Matrix(zoom, zoom)
        for i in range(doc.page_count):
            pix = doc[i].get_pixmap(matrix=mat, alpha=False)
            outp = out_dir / f"{path.stem}_p{i + 1}.jpg"
            pix.save(outp.as_posix())
            outs.append(outp)
    return outs


def images_to_pdf_simple(image_paths: list[Path], out: Path) -> None:
    with fitz.open() as doc:
        for p in image_paths:
            with Image.open(p) as im:
                if im.mode != "RGB":
                    im = im.convert("RGB")
                w, h = im.size
                page = doc.new_page(width=w, height=h)
                # Note: insert_image still needs a filename or stream
                page.insert_image(page.rect, filename=p.as_posix())
        doc.save(out.as_posix(), garbage=4, deflate=True)


def detect_encryption(path: Path) -> dict[str, Any]:
    with fitz.open(path) as doc:
        enc = doc.needs_pass or doc.is_encrypted
        meta = doc.metadata or {}
    return {"encrypted": bool(enc), "metadata": meta}


def validate_pdf(path: Path) -> dict[str, Any]:
    try:
        with fitz.open(path) as doc:
            ok = doc.page_count > 0
        return {"valid": ok, "error": None}
    except Exception as e:
        return {"valid": False, "error": str(e)}


def edit_insert_text(path: Path, out: Path, text: str, page: int = 1) -> None:
    with fitz.open(path) as doc:
        i = max(0, min(page - 1, doc.page_count - 1))
        page_o = doc[i]
        page_o.insert_text((50, 80), text, fontsize=12)
        doc.save(out.as_posix(), garbage=4, deflate=True)


def add_image_to_page(path: Path, image_path: Path, out: Path, page: int = 1) -> None:
    with fitz.open(path) as doc:
        i = max(0, min(page - 1, doc.page_count - 1))
        page_o = doc[i]
        r = page_o.rect
        ir = fitz.Rect(50, 100, min(r.width - 50, 400), min(r.height - 50, 400))
        page_o.insert_image(ir, filename=image_path.as_posix())
        doc.save(out.as_posix(), garbage=4, deflate=True)


def pdf_to_pdfa(path: Path, out: Path) -> None:
    with pikepdf.open(path) as pdf:
        pdf.save(out, linearize=True)
