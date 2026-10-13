"""
AI Skill Gap Analyzer + Personalized Learning Roadmap.

Reuses the Gemini retry logic and JSON extraction helper already built for
Mock Interview (app/services/interview/gemini_utils.py) rather than writing
a 6th copy of the same retry loop - that module happens to live under the
"interview" package purely because of when it was built, not because this
feature conceptually depends on interviews. It is NOT modified; only its
generic call_gemini()/extract_json() functions are imported, same pattern
used to reuse _extract_json() from gemini_service.py in every other feature.

Per the spec's explicit error-handling requirements, this service raises a
custom SkillGapServiceError carrying a machine-readable `error_code`
("empty_resume", "empty_job_description", "invalid_ai_response",
"gemini_unavailable") so the router can map each to the right HTTP status
rather than returning a blanket 503 for everything.
"""
from pydantic import ValidationError

from app.services.interview.gemini_utils import call_gemini, extract_json, InterviewGeminiError
from app.schemas import SkillGapFullPayload


class SkillGapServiceError(Exception):
    def __init__(self, error_code: str, message: str):
        self.error_code = error_code
        super().__init__(message)


def compute_match_level(score: int) -> str:
    """
    Deterministically derived from overall_match_score using the spec's own
    bucket ranges, rather than trusted as an independent field from Gemini.
    This guarantees the score and its label can never contradict each other
    (e.g. a 45 score labeled "Strong Match") the way two independently
    generated fields sometimes do.
    """
    if score >= 90:
        return "Excellent Match"
    if score >= 75:
        return "Strong Match"
    if score >= 60:
        return "Moderate Match"
    if score >= 40:
        return "Needs Improvement"
    return "Major Skill Gaps"


PROMPT_TEMPLATE = """You are an expert Technical Recruiter, ATS Resume Analyzer, Software Engineering Career Mentor, and AI Learning Coach.

Compare the candidate's resume with the target job description below. Generate TWO CONNECTED OUTPUTS IN ORDER: (1) a Skill Gap Analysis, then (2) a Personalized Learning Roadmap built ONLY from the missing skills found in step 1. Never generate the roadmap independently of the skill gap analysis.

### Resume Text
{resume_text}

### Job Description
{job_description}

## Strict Rules
- Never hallucinate skills, projects, certifications, or experience. Use ONLY evidence present in the resume text.
- Ignore resume formatting issues.
- Recognize common skill synonyms as the same skill (examples: REST API = RESTful API, PostgreSQL = Postgres, JavaScript ES6 = JavaScript, Machine Learning = ML, Scikit Learn = sklearn, NumPy = numpy, Pandas = pandas).

## Step 1 - Extract Resume Skills
Extract technical skills into categories: Programming Languages, Frameworks, Databases, Libraries, Developer Tools, Version Control, Cloud/Deployment, AI/ML, Soft Skills. Only include explicit skills.

## Step 2 - Extract Job Description Skills
Extract ONLY meaningful technical job requirements. Ignore generic HR qualities, communication-related words, leadership buzzwords, and motivation-related words (e.g. "hard working", "good communication", "team player", "quick learner", "positive attitude").

## Step 3 - Compare
Create four buckets: Matched Skills (clearly present), Partially Matched Skills (related but incomplete - explain why), Missing Skills (required but absent), Bonus Skills (resume has extra relevant skills beyond the JD).

## Step 4 - Match Score
Generate an overall_match_score (0-100) reflecting technical alignment ONLY - do not factor in formatting or years of experience. (The match level label will be derived separately - just return an accurate integer score.)

## Step 5 - Priority Missing Skills
Every missing skill needs: skill, category, priority (High = core technology repeatedly required, Medium = helpful technology, Low = nice-to-have), and why_it_matters.

## Step 6 - Improvement Summary
One concise recruiter-style paragraph (max 120 words): start with strengths, mention the biggest missing skills, mention overall readiness for the role.

## Step 7 - Learning Roadmap
Generate the roadmap ONLY from missing skills identified above. Never teach already-matched skills or recommend irrelevant technologies. Generate EXACTLY FOUR phases, each building on the previous one, with realistic durations. Each mini project should use technologies from the JD and be portfolio-friendly. Recommend concepts and practice tasks only - do not recommend paid courses, YouTube links, or external websites.

## Output Format
Return ONLY this JSON shape (no markdown, no commentary outside the JSON, no code fences):
{{
  "skill_gap_analysis": {{
    "job_title": "",
    "company_name": "",
    "overall_match_score": 0,
    "match_level": "",
    "match_summary": "",
    "strengths": [""],
    "matched_skills": [{{"skill": "", "category": ""}}],
    "partially_matched_skills": [{{"skill": "", "reason": ""}}],
    "missing_skills": [{{"skill": "", "category": "", "priority": "High", "why_it_matters": ""}}],
    "bonus_skills": [""],
    "improvement_summary": ""
  }},
  "learning_roadmap": {{
    "title": "",
    "estimated_duration": "",
    "goal": "",
    "phases": [
      {{"phase_number": 1, "phase_name": "", "duration": "", "goal": "", "topics": [""], "practice_tasks": [""], "mini_project": "", "expected_outcome": ""}},
      {{"phase_number": 2, "phase_name": "", "duration": "", "goal": "", "topics": [""], "practice_tasks": [""], "mini_project": "", "expected_outcome": ""}},
      {{"phase_number": 3, "phase_name": "", "duration": "", "goal": "", "topics": [""], "practice_tasks": [""], "mini_project": "", "expected_outcome": ""}},
      {{"phase_number": 4, "phase_name": "", "duration": "", "goal": "", "topics": [""], "practice_tasks": [""], "mini_project": "", "expected_outcome": ""}}
    ],
    "final_outcome": ""
  }}
}}

priority must be exactly one of: High, Medium, Low. phases must contain exactly 4 entries.
"""

REPAIR_PROMPT_SUFFIX = """

Your previous response failed validation for this reason: {error}
Return the corrected JSON now, strictly matching the schema above. Output JSON only.
"""


def _try_generate(prompt: str) -> SkillGapFullPayload:
    raw_response = call_gemini([{"text": prompt}], response_json=True, temperature=0.3, timeout=60)
    parsed = extract_json(raw_response)
    return SkillGapFullPayload.model_validate(parsed)


def generate_skill_gap_report(resume_text: str, job_description: str) -> dict:
    if not resume_text or not resume_text.strip():
        raise SkillGapServiceError("empty_resume", "Resume text is empty for this analysis.")
    if not job_description or not job_description.strip():
        raise SkillGapServiceError("empty_job_description", "Job description is empty for this analysis.")

    prompt = PROMPT_TEMPLATE.format(resume_text=resume_text[:12000], job_description=job_description[:6000])

    try:
        payload = _try_generate(prompt)
    except ValidationError as e:
        repair_prompt = prompt + REPAIR_PROMPT_SUFFIX.format(error=str(e)[:400])
        try:
            payload = _try_generate(repair_prompt)
        except ValidationError:
            raise SkillGapServiceError(
                "invalid_ai_response", "AI generated a response that didn't match the required format."
            )
    except InterviewGeminiError as e:
        # call_gemini() already exhausted its own retries with backoff before
        # raising this - it means Gemini stayed unavailable/rate-limited.
        raise SkillGapServiceError("gemini_unavailable", str(e))

    # Deterministic override: match_level always derived from the score,
    # never trusted as an independently-generated field.
    result = payload.model_dump()
    result["skill_gap_analysis"]["match_level"] = compute_match_level(
        result["skill_gap_analysis"]["overall_match_score"]
    )
    return result