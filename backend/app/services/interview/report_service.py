"""
Generates the final interview report.

Deliberate deviation from the literal spec: technical_average,
communication_average, clarity_average, confidence_average,
completeness_average, and overall_score are computed deterministically in
Python from the stored per-answer scores - NOT asked of Gemini. LLMs are
unreliable at exact arithmetic (averaging a list of integers), and there's
no reason to trust probabilistic text generation for something a mean()
call does perfectly every time. Gemini is used only for what it's actually
good at: synthesizing qualitative feedback across all the answers.
"""
from pydantic import ValidationError

from app.services.interview.gemini_utils import call_gemini, extract_json, InterviewGeminiError
from app.schemas import ReportQualitativePayload

QUALITATIVE_PROMPT = """You are an experienced technical interviewer writing a final performance summary after a complete mock interview.

### Candidate
Target Role: {role}
Experience Level: {level}

### Computed Score Averages (already calculated - do not recompute, just use them for context)
Technical Accuracy: {technical_average}/10
Communication: {communication_average}/10
Clarity: {clarity_average}/10
Confidence: {confidence_average}/10
Completeness: {completeness_average}/10

### All Questions and Answers
{qa_summary}

Write a final interview performance summary.

Return ONLY this JSON shape:
{{
  "summary": "2-4 sentence overall performance summary",
  "top_strengths": ["strength 1", "strength 2", "strength 3"],
  "top_weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "topics_to_revise": ["topic 1", "topic 2", "topic 3", "topic 4", "topic 5"],
  "next_interview_focus": "one sentence on what to focus on next time",
  "motivational_feedback": "2-3 encouraging but honest sentences"
}}

Rules:
- top_strengths and top_weaknesses must each have EXACTLY 3 items.
- topics_to_revise must have EXACTLY 5 items.
- Base everything on the actual answers given, not generic advice.
- No markdown, no commentary outside the JSON, no code fences.
"""

REPAIR_PROMPT_SUFFIX = """

Your previous response failed validation for this reason: {error}
Return the corrected JSON now, strictly matching the schema above. Output JSON only.
"""


def compute_score_averages(answers: list) -> dict:
    """
    Pure deterministic arithmetic - no Gemini involved. `answers` is a list
    of objects/dicts with technical_score, communication_score, clarity_score,
    confidence_score, completeness_score attributes.
    """
    if not answers:
        return {
            "technical_average": 0.0, "communication_average": 0.0, "clarity_average": 0.0,
            "confidence_average": 0.0, "completeness_average": 0.0, "overall_score": 0.0,
        }

    def avg(field):
        return round(sum(getattr(a, field) for a in answers) / len(answers), 2)

    technical_average = avg("technical_score")
    communication_average = avg("communication_score")
    clarity_average = avg("clarity_score")
    confidence_average = avg("confidence_score")
    completeness_average = avg("completeness_score")

    # overall_score on a 0-100 scale: mean of all five 1-10 averages, scaled x10.
    overall_score = round(
        (technical_average + communication_average + clarity_average + confidence_average + completeness_average)
        / 5 * 10,
        1,
    )

    return {
        "technical_average": technical_average,
        "communication_average": communication_average,
        "clarity_average": clarity_average,
        "confidence_average": confidence_average,
        "completeness_average": completeness_average,
        "overall_score": overall_score,
    }


def _try_generate_qualitative(prompt: str) -> ReportQualitativePayload:
    raw_response = call_gemini([{"text": prompt}], response_json=True, temperature=0.4)
    parsed = extract_json(raw_response)
    return ReportQualitativePayload.model_validate(parsed)


def generate_qualitative_report(role: str, level: str, averages: dict, qa_pairs: list) -> ReportQualitativePayload:
    qa_summary = "\n\n".join(
        f"Q{i+1} ({qa['category']}, {qa['difficulty']}): {qa['question']}\n"
        f"Answer: {qa['transcript'] or '(no answer given)'}\n"
        f"Scores: technical={qa['technical_score']}, communication={qa['communication_score']}, "
        f"clarity={qa['clarity_score']}, confidence={qa['confidence_score']}, completeness={qa['completeness_score']}"
        for i, qa in enumerate(qa_pairs)
    )

    prompt = QUALITATIVE_PROMPT.format(
        role=role,
        level=level,
        technical_average=averages["technical_average"],
        communication_average=averages["communication_average"],
        clarity_average=averages["clarity_average"],
        confidence_average=averages["confidence_average"],
        completeness_average=averages["completeness_average"],
        qa_summary=qa_summary[:14000],
    )

    try:
        return _try_generate_qualitative(prompt)
    except ValidationError as e:
        repair_prompt = prompt + REPAIR_PROMPT_SUFFIX.format(error=str(e)[:400])
        try:
            return _try_generate_qualitative(repair_prompt)
        except ValidationError:
            raise InterviewGeminiError("Could not generate the final report right now. Please try again.")