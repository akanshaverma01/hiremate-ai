"""
AI Interview Preparation: generates 12 personalized interview questions from
a resume + job description + target role + difficulty.

Separate module, reuses only the JSON-extraction helper from gemini_service.py
(Recruiter Feedback) - does not modify that file or any other Gemini module.
"""
import time
import requests
from pydantic import ValidationError

from app.config import settings
from app.services.gemini_service import _extract_json, GEMINI_URL_TEMPLATE
from app.schemas import InterviewPrepPayload

MAX_RETRIES = 3
RETRY_BACKOFF_SECONDS = [1, 2, 4]
RETRYABLE_STATUS_CODES = {429, 503}
FRIENDLY_BUSY_MESSAGE = "AI Interview Prep is temporarily busy. Please try again shortly."


class InterviewPrepServiceError(Exception):
    """Raised for any Interview-Prep-facing failure. Message is always safe to show the user."""


PROMPT_TEMPLATE = """You are an experienced Senior Technical Interviewer conducting a first-round interview for a software engineering role.

Generate interview questions by analyzing BOTH:
1. The candidate's resume.
2. The target job description.

Questions must be personalized to the candidate's actual experience and the job requirements. Never generate random or generic interview questions that are unrelated to the resume or JD.

### Resume
{resume_text}

### Job Description
{job_description}

### Target Role
{role}

### Difficulty
{difficulty}

## Instructions

### Step 1 - Analyze the Resume
Extract and understand: technical skills, frameworks/tools, internship experience, projects, ML/AI work, APIs/authentication/database work, and any relevant achievements or certifications.

### Step 2 - Analyze the Job Description
Identify: required skills, preferred technologies, responsibilities, keywords, and expected experience level.

### Step 3 - Match Resume with JD
Prioritize questions in this order:
1. (Highest) Skills present in BOTH resume and JD.
2. Projects in the resume that demonstrate JD requirements.
3. Internship experience matching the role.
4. Resume skills missing from JD, only if they are important projects.
5. Missing JD skills become conceptual/learning-oriented questions (never assume experience the candidate doesn't have).

## Question Distribution
Generate EXACTLY 12 questions: 5 Technical, 3 Project-Based, 2 HR/Behavioral, 2 Scenario/Problem-Solving. Do not change this distribution.

## Difficulty Rules
Easy = definitions, syntax, basic concepts. Medium = why/comparison/implementation/debugging. Hard = system design, optimization, edge cases, architecture, trade-offs. Match the selected difficulty: {difficulty}.

## Personalization Guardrails
- Never ask about technologies not present in the resume unless they also appear in the job description.
- If a required JD skill is missing from the resume, ask a conceptual or learning-oriented question instead of assuming experience.
- Mention project names when referencing projects, and internship responsibilities when referencing internship experience.
- Keep company-specific terminology only if it exists in the job description.
- Every question must evaluate a different skill - no repeated concepts or near-duplicate wording.
- Project questions must ask WHY and HOW (design decisions, trade-offs), not just WHAT something is.
- Behavioral questions must connect to something specific in the resume (an internship challenge, an API integration, debugging something, learning a framework quickly) - avoid generic personality questions.
- Scenario questions should be realistic engineering situations (e.g. an API returning a 503, a slow database query, a failed upload, an expired auth token, a UI not updating after a response) and ask how the candidate would debug/solve it.
- Do not expose your internal reasoning/chain of thought anywhere in the output - "why_this_question" should be a short interviewer's rationale note, not a reasoning trace.

## Output Format
Return ONLY this JSON shape, with EXACTLY 12 entries in "questions":
{{
  "candidate_summary": {{
    "matched_skills": [],
    "missing_skills": [],
    "experience_level": "",
    "focus_areas": []
  }},
  "questions": [
    {{
      "id": 1,
      "category": "Technical",
      "difficulty": "{difficulty}",
      "skill": "",
      "question": "",
      "why_this_question": "",
      "expected_topics": [],
      "estimated_time_minutes": 5
    }}
  ]
}}

Output rules: no markdown, no explanations outside the JSON, no introduction or conclusion, no code fences.
"""


def _call_gemini_with_retry(prompt: str) -> dict:
    if not settings.GEMINI_API_KEY:
        raise InterviewPrepServiceError(
            "GEMINI_API_KEY is not set. Add it to backend/.env before using AI Interview Prep."
        )

    url = GEMINI_URL_TEMPLATE.format(model=settings.GEMINI_MODEL)
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": settings.GEMINI_API_KEY,
    }
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.4,
            "responseMimeType": "application/json",
        },
    }

    last_error = None
    for attempt in range(MAX_RETRIES):
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=60)
        except requests.RequestException as e:
            last_error = f"Network error contacting Gemini: {e}"
        else:
            if response.status_code == 200:
                return response.json()
            if response.status_code in RETRYABLE_STATUS_CODES:
                last_error = f"Gemini returned {response.status_code}: {response.text[:300]}"
            else:
                raise InterviewPrepServiceError(
                    f"Gemini API returned {response.status_code}: {response.text[:500]}"
                )

        if attempt < MAX_RETRIES - 1:
            time.sleep(RETRY_BACKOFF_SECONDS[attempt])

    raise InterviewPrepServiceError(FRIENDLY_BUSY_MESSAGE) from Exception(last_error)


def generate_interview_questions(
    resume_text: str, job_description: str, role: str, difficulty: str
) -> InterviewPrepPayload:
    if not resume_text.strip():
        raise InterviewPrepServiceError("Resume text not found for this analysis.")
    if not job_description.strip():
        raise InterviewPrepServiceError("Job description not found for this analysis.")

    prompt = PROMPT_TEMPLATE.format(
        resume_text=resume_text[:12000],
        job_description=job_description[:6000],
        role=role or "the role described in the job description",
        difficulty=difficulty,
    )

    raw_response = _call_gemini_with_retry(prompt)

    try:
        raw_text = raw_response["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        raise InterviewPrepServiceError(FRIENDLY_BUSY_MESSAGE)

    if not raw_text or not raw_text.strip():
        raise InterviewPrepServiceError(FRIENDLY_BUSY_MESSAGE)

    try:
        parsed_json = _extract_json(raw_text)
    except Exception:
        raise InterviewPrepServiceError(FRIENDLY_BUSY_MESSAGE)

    try:
        return InterviewPrepPayload.model_validate(parsed_json)
    except ValidationError as e:
        # Most likely cause in practice: Gemini didn't return exactly 12 questions.
        raise InterviewPrepServiceError(
            "AI Interview Prep generated an invalid question set. Please try again."
        ) from e
