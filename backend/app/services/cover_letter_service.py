"""
AI Cover Letter Generator.

Separate module from gemini_service.py (Recruiter Feedback) and
gemini_copilot_service.py (Resume Copilot) - neither of those is modified.
This module can't reuse Copilot's retry helper because that helper forces
JSON response mode (responseMimeType: application/json), which is wrong for
a plain-text cover letter. A small dedicated retry function is implemented
here instead, matching the spec's own "retry once on timeout" requirement.
"""
import re
import time

import requests

from app.config import settings
from app.services.gemini_service import GEMINI_URL_TEMPLATE

MAX_ATTEMPTS = 2  # "retry once" per spec = 2 total attempts
RETRY_DELAY_SECONDS = 2
RETRYABLE_STATUS_CODES = {429, 503}

PROMPT_TEMPLATE = """You are an expert recruiter and professional cover letter writer.

### Resume Text
{resume_text}

### Job Description
{job_description}

Write a professional cover letter for this candidate applying to this role.

Instructions:
- Maximum 300-350 words.
- Use only information present in the resume. Never invent experience, skills, companies, projects, or metrics that aren't in the resume.
- Mention specific internships/projects only if relevant to this job description.
- If the job description names a company or role title, address the letter to that company/role naturally in the text.
- Keep the language ATS-friendly and professional.
- End with a short thank-you / call-to-action closing paragraph.
- Return plain text only. No markdown formatting, no bullet points, no headers, no JSON, no code fences.
"""

# Best-effort company name extraction from the JD text. Job descriptions
# pasted by users are free text with no fixed structure, so this will often
# find nothing - that's expected, not a bug. Patterns tried in order.
_COMPANY_PATTERNS = [
    re.compile(r"(?:^|\n)\s*Company\s*[:\-]\s*(.+)", re.IGNORECASE),
    re.compile(r"(?i:\bat)\s+([A-Z][A-Za-z0-9&.,'\- ]{1,60}?)(?:\s+is\s|\s+we\s|[.,\n])"),
    re.compile(r"(?i:\bjoin)\s+([A-Z][A-Za-z0-9&.,'\- ]{1,60}?)(?:\s+as\s|\s+in\s|[.,\n])"),
]


class CoverLetterServiceError(Exception):
    """Raised for any Cover-Letter-facing failure. Message is always safe to show the user."""


def guess_company_name(job_description: str) -> str | None:
    for pattern in _COMPANY_PATTERNS:
        match = pattern.search(job_description)
        if match:
            candidate = match.group(1).strip().strip(".,")
            if 2 <= len(candidate) <= 80:
                return candidate
    return None


def _clean_plain_text(text: str) -> str:
    """Strip markdown code fences and surrounding whitespace Gemini sometimes adds
    even when told to return plain text only."""
    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:text|plaintext)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


def _call_gemini_plain_text(prompt: str) -> str:
    if not settings.GEMINI_API_KEY:
        raise CoverLetterServiceError(
            "GEMINI_API_KEY is not set. Add it to backend/.env before using the Cover Letter Generator."
        )

    url = GEMINI_URL_TEMPLATE.format(model=settings.GEMINI_MODEL)
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": settings.GEMINI_API_KEY,
    }
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.4},
    }

    last_error = None
    for attempt in range(MAX_ATTEMPTS):
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=45)
        except requests.Timeout:
            last_error = "Gemini request timed out."
        except requests.RequestException as e:
            last_error = f"Could not reach Gemini API: {e}"
        else:
            if response.status_code == 200:
                data = response.json()
                try:
                    raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
                except (KeyError, IndexError):
                    raise CoverLetterServiceError("Generation failed: Gemini returned an unexpected response.")

                cleaned = _clean_plain_text(raw_text)
                if not cleaned:
                    raise CoverLetterServiceError("Generation failed: Gemini returned an empty response.")
                return cleaned

            if response.status_code == 429:
                raise CoverLetterServiceError(
                    "Gemini quota exceeded for now. Please wait a bit before generating another cover letter."
                )
            if response.status_code in RETRYABLE_STATUS_CODES:
                last_error = f"Gemini returned {response.status_code}."
            else:
                raise CoverLetterServiceError(
                    f"Generation failed (Gemini returned {response.status_code})."
                )

        if attempt < MAX_ATTEMPTS - 1:
            time.sleep(RETRY_DELAY_SECONDS)

    raise CoverLetterServiceError(
        "Cover letter generation is temporarily unavailable. Please try again shortly."
    ) from Exception(last_error)


def generate_cover_letter(resume_text: str, job_description: str) -> dict:
    if not resume_text.strip():
        raise CoverLetterServiceError("Resume text not found for this analysis.")
    if not job_description.strip():
        raise CoverLetterServiceError("Job description not found for this analysis.")

    prompt = PROMPT_TEMPLATE.format(
        resume_text=resume_text[:12000],
        job_description=job_description[:6000],
    )
    letter_text = _call_gemini_plain_text(prompt)
    company_name = guess_company_name(job_description)

    return {"cover_letter": letter_text, "company_name": company_name}