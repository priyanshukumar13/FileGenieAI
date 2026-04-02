from __future__ import annotations

import re
import zipfile
from pathlib import Path
from typing import Any

import fitz

try:
    import magic
except ImportError:
    magic = None  # type: ignore

import filetype


# Suspicious byte patterns (non-exhaustive heuristic scanner)
_MALICIOUS_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("javascript_action", re.compile(rb"/JavaScript|/JS\b", re.IGNORECASE)),
    ("embedded_executable", re.compile(rb"MZ\x90\x00|This program cannot be run", re.IGNORECASE)),
    ("shell_invocation", re.compile(rb"cmd\.exe|powershell|/bin/sh|bash\s+-c", re.IGNORECASE)),
]


def password_strength(password: str) -> dict[str, Any]:
    score = 0
    suggestions: list[str] = []
    if len(password) >= 8:
        score += 1
    else:
        suggestions.append("Use at least 8 characters.")
    if len(password) >= 12:
        score += 1
    if re.search(r"[a-z]", password):
        score += 1
    else:
        suggestions.append("Add lowercase letters.")
    if re.search(r"[A-Z]", password):
        score += 1
    else:
        suggestions.append("Add uppercase letters.")
    if re.search(r"\d", password):
        score += 1
    else:
        suggestions.append("Add numbers.")
    if re.search(r"[^\w\s]", password):
        score += 1
    else:
        suggestions.append("Add special characters (!@#$…).")
    common = {"password", "123456", "qwerty", "letmein", "admin", "welcome"}
    if password.lower() in common:
        score = max(0, score - 3)
        suggestions.append("Avoid common passwords.")

    if score <= 2:
        level = "weak"
    elif score <= 4:
        level = "medium"
    else:
        level = "strong"

    return {
        "score": score,
        "max_score": 7,
        "level": level,
        "suggestions": suggestions[:6],
    }


def _mime_from_path(path: Path) -> str | None:
    if magic:
        try:
            return magic.from_file(str(path), mime=True)
        except Exception:
            pass
    kind = filetype.guess(path)
    return kind.mime if kind else None


def scan_file(path: Path, declared_ext: str | None = None) -> dict[str, Any]:
    raw = path.read_bytes()
    mime = _mime_from_path(path)
    issues: list[str] = []
    encrypted = False

    ext = (declared_ext or path.suffix).lower().lstrip(".")

    if path.suffix.lower() == ".pdf" or mime == "application/pdf":
        try:
            doc = fitz.open(path)
            encrypted = bool(doc.needs_pass or doc.is_encrypted)
            doc.close()
        except Exception as e:
            issues.append(f"pdf_open_error: {e}")

    if path.suffix.lower() in {".docx", ".pptx", ".xlsx"}:
        try:
            zf = zipfile.ZipFile(path)
            zf.testzip()
            zf.close()
        except zipfile.BadZipFile:
            issues.append("invalid_office_zip")

    for name, pat in _MALICIOUS_PATTERNS:
        if pat.search(raw[: min(len(raw), 5_000_000)]):
            issues.append(f"pattern:{name}")

    pdf_like = mime == "application/pdf" or raw[:4] == b"%PDF"
    if ext == "pdf" and mime and not pdf_like:
        issues.append(f"type_mismatch: expected PDF, got mime={mime}")
    if ext in {"jpg", "jpeg"} and mime and "image/jpeg" not in mime and "image/jpg" not in mime:
        if not mime.startswith("image/"):
            issues.append(f"type_mismatch: expected JPEG, got mime={mime}")

    return {
        "path": path.name,
        "mime": mime,
        "encrypted": encrypted,
        "issues": issues,
        "size_bytes": len(raw),
    }
