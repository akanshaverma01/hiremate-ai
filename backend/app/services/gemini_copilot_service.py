"""
AI Resume Copilot: section-by-section resume improvement via Gemini.

Separate module from gemini_service.py (Recruiter Feedback) per project
requirements - that feature must not be touched. Some logic (JSON extraction)
is imported/reused from it rather than duplicated.

Design note: this app stores resumes as one flat text blob (no section
parsing), so there's no independent "current summary" or "current experience"
to display before calling Gemini. Instead, each prompt asks Gemini to BOTH
locate the relevant section in the raw resume text AND improve it, returning
both the located original and the improved version in one response. This is
a reasonable tradeoff, not a full resume-parsing subsystem.
"""
import time
import requests
from pydantic import ValidationError

from app.config import settings
from app.services.gemini_service import _extract_json, GEMINI_URL_TEMPLATE
from app.schemas import CopilotTextSectionPayload, CopilotSkillsPayload, CopilotGrammarPayload

MAX_RETRIES = 3
RETRY_BACKOFF_SECONDS = [1, 2, 4]  # wait before retry attempts 1, 2, 3
RETRYABLE_STATUS_CODES = {429, 503}

FRIENDLY_BUSY_MESSAGE = "AI Resume Copilot is temporarily busy. Please try again shortly."


class CopilotServiceError(Exception):
    """Raised for any Copilot-facing failure. Message is always safe to show the user."""


SHARED_RULES = """Rules you must follow strictly:
- Only improve the requested section. Do not invent experience, companies, job titles, dates, certifications, projects, or metrics that are not already present in the resume text.
- Only use measurable/quantified wording (numbers, percentages, scale) if a number or measurable claim already exists in the original text for that item. Do not add fabricated metrics.
- Keep the tone professional and ATS-friendly (plain language, standard section wording, no graphics/tables assumed).
- Output JSON only. No markdown fences, no commentary before or after the JSON.
"""

SUMMARY_PROMPT = """You are an expert resume writer helping a candidate improve their resume's professional summary section for a specific job.

### Full Resume Text
{resume_text}

### Target Job Description
{job_description}

Task: Find the professional summary / objective section in the resume text above (if there isn't an explicit one, use the most summary-like opening lines, or state "No summary section found" if genuinely absent). Rewrite it to better target the job description, using only facts already present elsewhere in the resume.

{shared_rules}

Return ONLY this JSON shape:
{{
  "before": "the original summary text as found in the resume (or 'No summary section found')",
  "after": "the improved summary",
  "tips": ["tip 1", "tip 2", "tip 3"]
}}
"""

EXPERIENCE_PROMPT = """You are an expert resume writer helping a candidate improve their resume's work/internship experience bullet points for a specific job.

### Full Resume Text
{resume_text}

### Target Job Description
{job_description}

Task: Find the work experience / internship section in the resume text above. Rewrite the bullet points using stronger action verbs and clearer impact framing, while preserving every fact (company, role, dates, responsibilities) exactly as given.

{shared_rules}

Return ONLY this JSON shape:
{{
  "before": "the original experience bullet points, newline separated",
  "after": "the rewritten experience bullet points, newline separated",
  "tips": ["tip 1", "tip 2", "tip 3"]
}}
"""

PROJECTS_PROMPT = """You are an expert resume writer helping a candidate improve their resume's projects section for a specific job.

### Full Resume Text
{resume_text}

### Target Job Description
{job_description}

Task: Find the projects section in the resume text above. Rewrite the project descriptions to be more ATS-optimized and to emphasize technologies already mentioned in each project that are also relevant to the job description. Do not add technologies that aren't already listed for that project.

{shared_rules}

Return ONLY this JSON shape:
{{
  "before": "the original project descriptions, newline separated",
  "after": "the rewritten project descriptions, newline separated",
  "tips": ["tip 1 naming which technologies were emphasized and why", "tip 2", "tip 3"]
}}
"""

SKILLS_PROMPT = """You are an ATS and technical recruiting expert comparing a resume's skills against a job description.

### Full Resume Text
{resume_text}

### Target Job Description
{job_description}

Task: Extract technical skills mentioned in the resume, and technical skills required/preferred in the job description. Compare them.

{shared_rules}

Return ONLY this JSON shape:
{{
  "matched_skills": ["skills present in both resume and JD"],
  "missing_skills": ["skills the JD wants that the resume does not mention"],
  "recommended_skills": ["skills not required by this JD but commonly valuable alongside the candidate's existing skill set - suggestions only, never imply the candidate already has them"],
  "tips": ["tip 1", "tip 2"]
}}
"""

GRAMMAR_PROMPT = """You are a professional resume editor and ATS formatting expert.

### Full Resume Text
{resume_text}

Task: Review the resume text for language quality and ATS-friendliness only (not content strategy).

{shared_rules}

Return ONLY this JSON shape:
{{
  "grammar_issues": ["specific grammar or phrasing issue found, quoting the problematic phrase"],
  "repeated_keywords": ["words/phrases repeated too often across the resume"],
  "weak_action_verbs": ["weak verbs found (e.g. 'helped', 'worked on') with a suggested stronger replacement noted in the same string"],
  "formatting_suggestions": ["ATS formatting suggestion 1", "ATS formatting suggestion 2"]
}}
"""

SECTION_CONFIG = {
    "summary": (SUMMARY_PROMPT, CopilotTextSectionPayload, True),
    "experience": (EXPERIENCE_PROMPT, CopilotTextSectionPayload, True),
    "projects": (PROJECTS_PROMPT, CopilotTextSectionPayload, True),
    "skills": (SKILLS_PROMPT, CopilotSkillsPayload, True),
    "grammar": (GRAMMAR_PROMPT, CopilotGrammarPayload, False),  # no JD needed
}


def _call_gemini_with_retry(prompt: str) -> dict:
    """
    Calls Gemini's generateContent endpoint, retrying up to MAX_RETRIES times
    with exponential backoff on 503 (overloaded) / 429 (rate limited) or
    network errors. Any other failure (bad key, invalid request, schema
    mismatch) fails immediately without retrying, since a retry won't fix it.
    """
    if not settings.GEMINI_API_KEY:
        raise CopilotServiceError(
            "GEMINI_API_KEY is not set. Add it to backend/.env before using AI Resume Copilot."
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

    last_error = None
    for attempt in range(MAX_RETRIES):
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=45)
        except requests.RequestException as e:
            last_error = f"Network error contacting Gemini: {e}"
        else:
            if response.status_code == 200:
                return response.json()

            if response.status_code in RETRYABLE_STATUS_CODES:
                last_error = f"Gemini returned {response.status_code}: {response.text[:300]}"
            else:
                # Not retryable (bad request, auth failure, etc.) - fail immediately
                raise CopilotServiceError(
                    f"Gemini API returned {response.status_code}: {response.text[:500]}"
                )

        if attempt < MAX_RETRIES - 1:
            time.sleep(RETRY_BACKOFF_SECONDS[attempt])

    # Exhausted all retries on a retryable error - don't leak the raw Gemini
    # error to the end user, just log-worthy detail stays server-side.
    raise CopilotServiceError(FRIENDLY_BUSY_MESSAGE) from Exception(last_error)


def improve_resume_section(resume_text: str, job_description: str, section: str) -> dict:
    if section not in SECTION_CONFIG:
        raise CopilotServiceError(f"Unknown section: {section}")

    prompt_template, schema_cls, needs_jd = SECTION_CONFIG[section]

    if needs_jd and not job_description.strip():
        raise CopilotServiceError("This section requires a job description, but none was found for this analysis.")

    prompt = prompt_template.format(
        resume_text=resume_text[:12000],
        job_description=job_description[:6000],
        shared_rules=SHARED_RULES,
    )

    raw_response = _call_gemini_with_retry(prompt)

    try:
        raw_text = raw_response["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        raise CopilotServiceError(FRIENDLY_BUSY_MESSAGE)

    if not raw_text or not raw_text.strip():
        raise CopilotServiceError(FRIENDLY_BUSY_MESSAGE)

    try:
        parsed_json = _extract_json(raw_text)
    except Exception:
        raise CopilotServiceError(FRIENDLY_BUSY_MESSAGE)

    try:
        validated = schema_cls.model_validate(parsed_json)
    except ValidationError:
        raise CopilotServiceError(FRIENDLY_BUSY_MESSAGE)

    return validated.model_dump()