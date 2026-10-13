"""
Generates N interview questions for a Mock Interview session.

Not a literal call into interview_prep_service.py (that service is hard-tied
to an existing resume analysis; Mock Interview's spec'd UI never asks the
user to pick one). This reuses the same category-distribution *pattern*
instead: the original 5 Technical / 3 Project-Based / 2 HR/Behavioral /
2 Scenario ratio (out of 12) is scaled proportionally to whatever total the
user picked (5, 10, or 12), with any rounding remainder assigned to the
Scenario bucket so the total always sums exactly.
"""
from app.services.interview.gemini_utils import call_gemini, extract_json, InterviewGeminiError


def compute_category_counts(total_questions: int) -> dict:
    technical = round(total_questions * 5 / 12)
    project = round(total_questions * 3 / 12)
    hr = round(total_questions * 2 / 12)
    scenario = total_questions - technical - project - hr  # remainder guarantees exact total
    return {
        "Technical": technical,
        "Project-Based": project,
        "HR/Behavioral": hr,
        "Scenario/Problem-Solving": scenario,
    }


PROMPT_WITH_RESUME = """You are an experienced Senior Technical Interviewer conducting a first-round interview.

Generate interview questions by analyzing BOTH the candidate's resume and the job description below. Personalize every question to the candidate's actual experience - reference project names, internship responsibilities, and specific technologies where relevant. Never ask about technologies not present in the resume unless they also appear in the job description; if a required skill is missing from the resume, ask a conceptual/learning-oriented question instead of assuming experience.

### Resume
{resume_text}

### Job Description
{job_description}

### Target Role
{role}

### Experience Level
{level}

Generate EXACTLY {total} questions with this category breakdown: {breakdown}.
Every question must test a different skill - no repeated concepts.

Return ONLY this JSON shape:
{{"questions": [{{"question_number": 1, "category": "Technical", "difficulty": "Medium", "question_text": "..."}}]}}

No markdown, no commentary, no code fences.
"""

PROMPT_WITHOUT_RESUME = """You are an experienced Senior Technical Interviewer conducting a first-round interview for a {role} position at the {level} experience level.

No resume is available for this candidate - generate realistic, role-appropriate interview questions based on standard expectations for a {role} at {level} level.

Generate EXACTLY {total} questions with this category breakdown: {breakdown}.
Every question must test a different skill - no repeated concepts.

Return ONLY this JSON shape:
{{"questions": [{{"question_number": 1, "category": "Technical", "difficulty": "Medium", "question_text": "..."}}]}}

No markdown, no commentary, no code fences.
"""


def generate_mock_interview_questions(
    role: str, level: str, total_questions: int, resume_text: str = None, job_description: str = None
) -> list:
    counts = compute_category_counts(total_questions)
    breakdown = ", ".join(f"{v} {k}" for k, v in counts.items())

    if resume_text and job_description:
        prompt = PROMPT_WITH_RESUME.format(
            resume_text=resume_text[:12000],
            job_description=job_description[:6000],
            role=role,
            level=level,
            total=total_questions,
            breakdown=breakdown,
        )
    else:
        prompt = PROMPT_WITHOUT_RESUME.format(
            role=role, level=level, total=total_questions, breakdown=breakdown
        )

    raw_response = call_gemini([{"text": prompt}], response_json=True, temperature=0.5)
    parsed = extract_json(raw_response)

    questions = parsed.get("questions")
    if not isinstance(questions, list) or len(questions) != total_questions:
        raise InterviewGeminiError(
            f"AI generated an invalid question set (expected {total_questions} questions). Please try again."
        )

    required_keys = {"question_number", "category", "difficulty", "question_text"}
    for q in questions:
        if not required_keys.issubset(q.keys()):
            raise InterviewGeminiError("AI generated malformed question data. Please try again.")

    return questions