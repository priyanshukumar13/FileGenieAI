from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from openai import AsyncOpenAI

from config import get_settings
from routes.ai.tool_registry import ALL_ACTIONS, build_system_prompt_actions_block
from services.tool_executor import execute_tool

SYSTEM_PROMPT_TOOLS = """You are an AI assistant that converts user commands into structured JSON actions for a PDF toolkit backend.

""" + build_system_prompt_actions_block() + """

Rules:
- Choose exactly one "action" from the list above.
- Put extra options in "parameters" (language, pages, password, level, order, text, target_size_kb, etc.).
- For "resize PDF", "reduce file size", "compress to X kb/mb", use "compress_pdf" with parameters {{"target_size_kb": N}} (convert MB to KB: 2 MB → 2048).
- If the user wants to merge files, use "merge_pdf".
- For password strength with no file, use password_strength with parameters.password.
- Return ONLY valid JSON, no markdown fences:
{"action":"<snake_case_action>","parameters":{}}
"""


def _parse_json_loose(text: str) -> dict[str, Any]:
    text = text.strip()
    m = re.search(r"\{[\s\S]*\}", text)
    if m:
        text = m.group(0)
    return json.loads(text)


def _extract_target_kb(text: str) -> int | None:
    t = text.lower().replace(",", " ")
    m = re.search(r"(\d+(?:\.\d+)?)\s*(gb|mb|kb)\b", t)
    if m:
        val = float(m.group(1))
        u = m.group(2).lower()
        if u == "gb":
            return int(val * 1024 * 1024)
        if u == "mb":
            return int(val * 1024)
        return max(1, int(val))
    m = re.search(r"(\d+)\s*k\b", t)
    if m:
        return max(1, int(m.group(1)))
    return None


async def plan_command(user_text: str) -> dict[str, Any]:
    from services.gemini_planner import plan_with_gemini

    g = await plan_with_gemini(user_text)
    if g:
        return g

    settings = get_settings()
    if settings.openai_api_key:
        client = AsyncOpenAI(api_key=settings.openai_api_key)
        try:
            r = await client.chat.completions.create(
                model=settings.openai_model,
                temperature=0.1,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT_TOOLS},
                    {"role": "user", "content": user_text},
                ],
            )
            raw = r.choices[0].message.content or "{}"
            data = _parse_json_loose(raw)
            action = data.get("action", "")
            if action in ALL_ACTIONS:
                return {"action": action, "parameters": data.get("parameters") or {}}
        except (json.JSONDecodeError, ValueError, Exception):
            pass

    return _fallback_plan(user_text)


def _fallback_plan(user_text: str) -> dict[str, Any]:
    t = user_text.lower()
    tk = _extract_target_kb(user_text)

    if any(
        x in t
        for x in (
            "resize",
            "smaller",
            "reduce size",
            "file size",
            "compress",
            "lighter",
            "shrink",
            "make it smaller",
            "less mb",
            "less kb",
        )
    ):
        if tk:
            return {"action": "compress_pdf", "parameters": {"target_size_kb": tk}}
        return {"action": "compress_pdf", "parameters": {"level": "high"}}

    if "merge" in t:
        return {"action": "merge_pdf", "parameters": {}}
    if "compress" in t:
        return {"action": "compress_pdf", "parameters": {"level": "medium"}}
    if "word" in t or "docx" in t:
        if "pdf" in t and ("to" in t or "→" in user_text):
            return {"action": "pdf_to_word", "parameters": {}}
        return {"action": "word_to_pdf", "parameters": {}}
    if "summar" in t:
        return {"action": "summarize_pdf", "parameters": {}}
    if "translat" in t:
        lang = "Hindi" if "hindi" in t else "Spanish"
        return {"action": "translate_pdf", "parameters": {"target_language": lang}}
    if "password" in t and "strength" in t:
        return {"action": "password_strength", "parameters": {"password": ""}}
    if "split" in t:
        return {"action": "split_pdf", "parameters": {}}
    if "jpg" in t or "image" in t:
        return {"action": "jpg_to_pdf", "parameters": {}}
    return {"action": "compress_pdf", "parameters": {"level": "medium"}}


async def run_ai_command(
    command: str,
    file_paths: list[Path],
    extra_parameters: dict[str, Any] | None = None,
) -> dict[str, Any]:
    plan = await plan_command(command)
    params = {**(plan.get("parameters") or {}), **(extra_parameters or {})}
    action = plan["action"]
    try:
        result = await execute_tool(action, file_paths, params)
    except Exception as e:
        return {
            "action": action,
            "parameters": params,
            "ok": False,
            "error": f"Execution error: {e!s}",
            "output_path": None,
            "meta": {},
            "download_name": None,
        }
    return {
        "action": action,
        "parameters": params,
        "ok": result.get("ok"),
        "error": result.get("error"),
        "output_path": result.get("output_path"),
        "meta": result.get("meta"),
        "download_name": result.get("download_name"),
    }
