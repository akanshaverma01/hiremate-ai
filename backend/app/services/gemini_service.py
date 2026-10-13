"""
Calls the Gemini API to get recruiter-style feedback on a resume/JD pair.

Important: this is an external LLM call, not a trained model built for this
project. Keep it described that way in any report/demo. It supplements the
in-house TF-IDF/cosine ATS score (app/ml/ats_scorer.py); it doesn't replace it.
"""
import json
import re

import requests
from pydantic import ValidationError

from app.config import settings
from app.schemas import GeminiFeedbackPayload

GEMINI_URL_TEMPLATE = (
    "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
)

PROMPT_TEMPLATE = """You are an experienced technical recruiter and ATS specialist with 10+ years of hiring experience in software engineering, data analytics, business analytics, and AI/ML roles.

Analyze the candidate's resume against the provided job description.

### Resume Text
{resume_text}

### Job Description
{job_description}

### ATS Score
{ats_score}

Return ONLY a valid JSON object in the following format:

{{
"overall_recruiter_decision": {{
"status": "High Match | Medium Match | Low Match",
"reason": "2-3 sentence recruiter explanation."
}},
"strengths": ["Strength 1", "Strength 2", "Strength 3", "Strength 4"],
"weaknesses": ["Weakness 1", "Weakness 2", "Weakness 3", "Weakness 4"],
"missing_keywords": ["Keyword 1", "Keyword 2", "Keyword 3"],
"suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3", "Suggestion 4"],
"section_scores": {{
"summary": 0,
"skills": 0,
"experience": 0,
"projects": 0,
"education": 0,
"formatting": 0
}},
"interview_probability": {{
"percentage": 0,
"reason": "Explain why the resume is likely or unlikely to get shortlisted."
}}
}}

Rules:
- Base feedback on both semantic relevance and ATS best practices.
- Be specific about missing technologies, weak wording, formatting, and measurable achievements.
- Do not invent experience that is not present in the resume.
- Keep every suggestion actionable and resume-focused.
- Output JSON only. No markdown fences, no commentary before or after the JSON.
"""


class GeminiServiceError(Exception):
    """Raised for any failure in calling Gemini or validating its output."""


def _extract_json(raw_text: str) -> dict:
    """
    LLMs frequently wrap JSON in ```json fences or add stray text around it,
    even when told not to. Strip fences first, then fall back to grabbing the
    outermost {...} block before attempting json.loads.
    """
    text = raw_text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise GeminiServiceError("Gemini response did not contain a JSON object.")

    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError as e:
        raise GeminiServiceError(f"Gemini response was not valid JSON: {e}")


def get_recruiter_feedback(resume_text: str, job_description: str, ats_score: float) -> GeminiFeedbackPayload:
    if not settings.GEMINI_API_KEY:
        raise GeminiServiceError(
            "GEMINI_API_KEY is not set. Get a free key from https://aistudio.google.com/app/apikey "
            "and add it to backend/.env"
        )

    prompt = PROMPT_TEMPLATE.format(
        resume_text=resume_text[:12000],  # keep prompt size sane
        job_description=job_description[:6000],
        ats_score=ats_score,
    )

    url = GEMINI_URL_TEMPLATE.format(model=settings.GEMINI_MODEL)
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": settings.GEMINI_API_KEY,
    }
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.3,
            "responseMimeType": "application/json",
        },
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=45)
    except requests.RequestException as e:
        raise GeminiServiceError(f"Could not reach Gemini API: {e}")

    if response.status_code != 200:
        raise GeminiServiceError(
            f"Gemini API returned {response.status_code}: {response.text[:500]}"
        )

    data = response.json()
    try:
        raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        raise GeminiServiceError(f"Unexpected Gemini response shape: {data}")

    parsed_json = _extract_json(raw_text)

    try:
        return GeminiFeedbackPayload.model_validate(parsed_json)
    except ValidationError as e:
        raise GeminiServiceError(f"Gemini response failed schema validation: {e}")
