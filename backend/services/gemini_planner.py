"""Optional Gemini-based intent → JSON planning."""

from __future__ import annotations

import asyncio
import json
import re
from typing import Any

from config import get_settings
from routes.ai.tool_registry import ALL_ACTIONS, build_system_prompt_actions_block

SYSTEM = """You are an AI assistant that converts user commands into structured JSON actions for a PDF toolkit backend.

""" + build_system_prompt_actions_block() + """

Rules:
- Choose exactly one "action" from the list above.
- Put extra options in "parameters" (language, pages, password, level, order, text, target_size_kb, etc.).
- If the user wants a smaller PDF, specific file size (e.g. "100kb", "under 2mb"), use action "compress_pdf" with parameters {"target_size_kb": <number>} (convert MB to KB: 2mb → 2048).
- "resize PDF", "reduce file size", "make PDF lighter" → compress_pdf with target_size_kb if a number is given, else compress_pdf with level medium/high.
- merge → merge_pdf. split → split_pdf.
- Return ONLY valid JSON, no markdown fences:
{"action":"<snake_case_action>","parameters":{}}
"""


def _parse_json_loose(text: str) -> dict[str, Any]:
    text = text.strip()
    m = re.search(r"\{[\s\S]*\}", text)
    if m:
        text = m.group(0)
    return json.loads(text)


async def plan_with_gemini(user_text: str) -> dict[str, Any] | None:
    settings = get_settings()
    if not settings.gemini_api_key:
        return None
    try:
        import google.generativeai as genai
    except ImportError:
        return None

    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel(settings.gemini_model)

    def _sync() -> str:
        r = model.generate_content(
            SYSTEM + "\n\nUser:\n" + user_text,
            generation_config={"temperature": 0.1, "max_output_tokens": 2048},
        )
        if not r.candidates:
            return "{}"
        return r.text or "{}"

    try:
        raw = await asyncio.to_thread(_sync)
        data = _parse_json_loose(raw)
        action = data.get("action", "")
        if action not in ALL_ACTIONS:
            return None
        return {"action": action, "parameters": data.get("parameters") or {}}
    except (json.JSONDecodeError, ValueError, Exception):
        return None
