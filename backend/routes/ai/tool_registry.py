"""
Central registry of all backend PDF/tool actions.
Each key maps to a handler name in services.tool_executor.
"""

from typing import Any

# Human-readable categories for dashboard / docs
TOOL_CATEGORIES: dict[str, list[str]] = {
    "organization": [
        "organize_pdf",
        "merge_pdf",
        "split_pdf",
        "remove_pages",
        "extract_pages",
        "rotate_pdf",
        "crop_pdf",
    ],
    "create_convert_to_pdf": [
        "scan_to_pdf",
        "jpg_to_pdf",
        "word_to_pdf",
        "powerpoint_to_pdf",
        "excel_to_pdf",
        "html_to_pdf",
    ],
    "convert_from_pdf": [
        "pdf_to_jpg",
        "pdf_to_word",
        "pdf_to_powerpoint",
        "pdf_to_excel",
        "pdf_to_pdfa",
    ],
    "optimization": [
        "compress_pdf",
        "optimize_pdf",
        "repair_pdf",
    ],
    "ai_intelligence": [
        "ocr_pdf",
        "summarize_pdf",
        "translate_pdf",
    ],
    "editing": [
        "edit_pdf_text",
        "add_remove_images",
        "add_page_numbers",
        "watermark_pdf",
        "sign_pdf",
        "redact_pdf",
        "compare_pdfs",
    ],
    "security": [
        "protect_pdf",
        "unlock_pdf",
        "detect_encryption",
        "secure_validation",
        "redact_sensitive",
    ],
    "utility": [
        "image_convert",
        "password_strength",
        "file_scanner",
    ],
}

ALL_ACTIONS: list[str] = sorted({a for acts in TOOL_CATEGORIES.values() for a in acts})

# Default parameters schema hints for LLM (minimal)
ACTION_PARAMETER_HINTS: dict[str, dict[str, Any]] = {
    "merge_pdf": {"file_paths": "list of paths in order"},
    "split_pdf": {"ranges": "e.g. [[1,3],[4,5]] or pages: [1,2,3]"},
    "remove_pages": {"pages": "1-based page numbers"},
    "extract_pages": {"pages": "1-based page numbers"},
    "rotate_pdf": {"pages": "optional", "angle": "90|180|270"},
    "crop_pdf": {"rect": "optional x0,y0,x1,y1 per page or global"},
    "organize_pdf": {"order": "1-based new order e.g. [3,1,2]"},
    "compress_pdf": {"level": "low|medium|high", "target_size_kb": "optional max size in KB (triggers stronger shrink)"},
    "optimize_pdf": {},
    "repair_pdf": {},
    "protect_pdf": {"password": "string"},
    "unlock_pdf": {"password": "string"},
    "watermark_pdf": {"text": "string"},
    "add_page_numbers": {"position": "bottom-center|..."},
    "translate_pdf": {"target_language": "e.g. Hindi"},
    "summarize_pdf": {},
    "ocr_pdf": {},
    "redact_pdf": {"rects": "optional"},
    "compare_pdfs": {},
    "sign_pdf": {"image_path": "optional signature image"},
    "pdf_to_jpg": {"dpi": "optional"},
    "html_to_pdf": {},
    "password_strength": {"password": "string"},
    "file_scanner": {},
}


def build_system_prompt_actions_block() -> str:
    lines = ["Available actions (use exact snake_case keys):"]
    for cat, actions in TOOL_CATEGORIES.items():
        lines.append(f"\n[{cat}]")
        for a in actions:
            hint = ACTION_PARAMETER_HINTS.get(a, {})
            lines.append(f"  - {a}" + (f" params: {hint}" if hint else ""))
    return "\n".join(lines)
