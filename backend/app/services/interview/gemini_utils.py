"""
Shared Gemini-calling utility for the AI Mock Interview feature.

One retry implementation used by transcription, per-answer evaluation, and
final report generation within THIS feature - satisfies "don't duplicate
retry logic" at the feature level. It's a separate implementation from
gemini_service.py / gemini_copilot_service.py / cover_letter_service.py /
interview_prep_service.py because those files are off-limits to modify
(standing rule across every feature added to this project so far); this
reuses only the JSON-extraction helper from gemini_service.py.
"""
import logging
import time
import requests

from app.config import settings
from app.services.gemini_service import _extract_json, GEMINI_URL_TEMPLATE

logger = logging.getLogger("gemini")

MAX_RETRIES = 3
RETRY_BACKOFF_SECONDS = [1, 2, 4]
RETRYABLE_STATUS_CODES = {429, 503}


class InterviewGeminiError(Exception):
    """Raised for any Mock-Interview-facing Gemini failure. Message is always safe to show the user."""


def call_gemini(parts: list, response_json: bool = True, temperature: float = 0.4, timeout: int = 60) -> dict:
    """
    Calls Gemini's generateContent with retry/backoff on 503/429.
    `parts` follows the Gemini "contents[0].parts" shape, e.g.
    [{"text": "..."}] for text-only, or [{"text": "..."}, {"inline_data": {...}}] for audio+text.
    Returns the raw parsed response JSON (caller extracts candidates[0].content.parts[0].text).
    """
    if not settings.GEMINI_API_KEY:
        raise InterviewGeminiError(
            "GEMINI_API_KEY is not set. Add it to backend/.env before using this AI feature."
        )

    url = GEMINI_URL_TEMPLATE.format(model=settings.GEMINI_MODEL)
    logger.info("Calling Gemini model=%s", settings.GEMINI_MODEL)
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": settings.GEMINI_API_KEY,
    }
    generation_config = {"temperature": temperature}
    if response_json:
        generation_config["responseMimeType"] = "application/json"

    payload = {
        "contents": [{"parts": parts}],
        "generationConfig": generation_config,
    }

    last_error = None
    for attempt in range(MAX_RETRIES):
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=timeout)
        except requests.RequestException as e:
            last_error = f"Network error contacting Gemini: {e}"
            logger.warning("Gemini attempt %d/%d failed: %s", attempt + 1, MAX_RETRIES, last_error)
        else:
            if response.status_code == 200:
                return response.json()
            if response.status_code in RETRYABLE_STATUS_CODES:
                last_error = f"Gemini returned {response.status_code}: {response.text[:300]}"
                logger.warning("Gemini attempt %d/%d failed: %s", attempt + 1, MAX_RETRIES, last_error)
            else:
                # Non-retryable (400/401/403/404/...) - this is almost always
                # a wrong GEMINI_MODEL name, a bad/expired GEMINI_API_KEY, or
                # a malformed request, not a transient "busy" state. Logged
                # in full here because the HTTP response to the browser only
                # ever says "temporarily busy" (see below).
                logger.error("Gemini returned %d: %s", response.status_code, response.text[:1000])
                raise InterviewGeminiError(f"Gemini API returned {response.status_code}: {response.text[:500]}")

        if attempt < MAX_RETRIES - 1:
            time.sleep(RETRY_BACKOFF_SECONDS[attempt])

    # NOTE: this helper is shared by Mock Interview AND Skill Gap Analyzer
    # (see skill_gap_service.py's import), so the message must not name one
    # specific feature - it used to say "AI Mock Interview is temporarily
    # busy" even when Skill Gap was the caller, which is what produced a
    # Mock-Interview error banner on the Skill Gap page.
    #
    # The real reason (rate limit, quota, network) is deliberately not sent
    # to the browser - only logged here - so check the backend terminal for
    # this line whenever this error shows up in the UI.
    logger.error("Gemini exhausted all %d retries. Last error: %s", MAX_RETRIES, last_error)
    raise InterviewGeminiError(
        "This AI feature is temporarily busy. Please try again shortly."
    ) from Exception(last_error)


def extract_text(raw_response: dict) -> str:
    try:
        return raw_response["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        raise InterviewGeminiError("Gemini returned an unexpected response shape.")


def extract_json(raw_response: dict) -> dict:
    text = extract_text(raw_response)
    if not text or not text.strip():
        raise InterviewGeminiError("Gemini returned an empty response.")
    return _extract_json(text)