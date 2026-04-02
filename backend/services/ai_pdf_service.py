from __future__ import annotations

from pathlib import Path
from typing import Any

import fitz  # PyMuPDF
from openai import AsyncOpenAI

from config import get_settings


async def summarize_pdf_text(path: Path, client: AsyncOpenAI | None = None) -> str:
    settings = get_settings()
    with fitz.open(path) as doc:
        text = "\n".join(doc[i].get_text() for i in range(min(doc.page_count, 40)))
    text = text[:120_000]
    if not settings.openai_api_key:
        return text[:2000] + ("\n\n[OpenAI API key not set — raw text preview above]" if len(text) > 2000 else "")
    c = client or AsyncOpenAI(api_key=settings.openai_api_key)
    r = await c.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": "Summarize the document clearly in a few paragraphs."},
            {"role": "user", "content": text},
        ],
    )
    return r.choices[0].message.content or ""


async def translate_pdf_text(path: Path, target_language: str, client: AsyncOpenAI | None = None) -> str:
    settings = get_settings()
    with fitz.open(path) as doc:
        text = "\n".join(doc[i].get_text() for i in range(min(doc.page_count, 25)))
    text = text[:80_000]
    if not settings.openai_api_key:
        return f"[Translation to {target_language} requires OPENAI_API_KEY]\n\n" + text[:3000]
    c = client or AsyncOpenAI(api_key=settings.openai_api_key)
    r = await c.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {
                "role": "system",
                "content": f"Translate the following document text to {target_language}. Preserve structure where possible.",
            },
            {"role": "user", "content": text},
        ],
    )
    return r.choices[0].message.content or ""


def ocr_pdf_to_text(path: Path, out_txt: Path) -> dict[str, Any]:
    try:
        import pytesseract
        from pdf2image import convert_from_path
    except ImportError as e:
        raise RuntimeError("Install pytesseract and pdf2image; also install Tesseract OCR and Poppler.") from e

    pages = convert_from_path(path.as_posix(), dpi=200, fmt="png", thread_count=2)
    chunks: list[str] = []
    for i, im in enumerate(pages[:30]):
        txt = pytesseract.image_to_string(im)
        chunks.append(f"--- Page {i + 1} ---\n{txt}")
    out_txt.write_text("\n\n".join(chunks), encoding="utf-8")
    return {"pages": len(chunks)}


def translated_text_to_pdf(text: str, out: Path) -> None:
    with fitz.open() as doc:
        page = doc.new_page()
        page.insert_textbox(fitz.Rect(50, 50, 550, 750), text[:15_000], fontsize=10)
        doc.save(out.as_posix())


async def translate_pdf_file(path: Path, out: Path, target_language: str) -> None:
    translated = await translate_pdf_text(path, target_language)
    translated_text_to_pdf(translated, out)


async def summarize_to_pdf(path: Path, out: Path) -> None:
    s = await summarize_pdf_text(path)
    translated_text_to_pdf(s, out)
