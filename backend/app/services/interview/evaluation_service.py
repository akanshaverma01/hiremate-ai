"""
Evaluates one interview answer against strict JSON schema. Per the spec:
"If JSON is invalid: repair JSON, retry once." Implemented as: validate the
first response; if it fails Pydantic validation (wrong score range, wrong
list length, etc.), send ONE follow-up "repair" request telling Gemini
exactly what was wrong, then validate again. If that also fails, give up
with a friendly error rather than looping indefinitely.
"""
from pydantic import ValidationError

from app.services.interview.gemini_utils import call_gemini, extract_json, InterviewGeminiError
from app.schemas import EvaluationPayload

EVALUATION_PROMPT = """You are an experienced technical interviewer evaluating a candidate's spoken answer.

### Interview Question
{question}

### Candidate's Answer (transcribed from speech)
{transcript}

### Target Role
{role}

### Experience Level
{level}

Evaluate this answer. Since it's a transcribed spoken answer, judge communication/clarity based on structure and coherence, not grammar perfection (spoken language is naturally less polished than written text).

Return ONLY this JSON shape:
{{
  "technical_accuracy": 7,
  "communication": 7,
  "clarity": 7,
  "confidence": 7,
  "completeness": 7,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "missing_points": ["missing point 1", "missing point 2", "missing point 3"],
  "ideal_answer": "a strong model answer to this question, 3-5 sentences",
  "follow_up_question": "a natural follow-up question an interviewer would ask next",
  "follow_up_reason": "one sentence on why this follow-up probes deeper"
}}

Rules:
- All 5 scores must be integers from 1 to 10.
- strengths, improvements, and missing_points must each have EXACTLY 3 items.
- If the transcript is empty or clearly not an attempt to answer, score honestly low and note that in missing_points rather than inventing content.
- No markdown, no commentary outside the JSON, no code fences.
"""

REPAIR_PROMPT_SUFFIX = """

Your previous response failed validation for this reason: {error}
Return the corrected JSON now, strictly matching the schema above. Output JSON only.
"""


def _try_evaluate(prompt: str) -> EvaluationPayload:
    raw_response = call_gemini([{"text": prompt}], response_json=True, temperature=0.3)
    parsed = extract_json(raw_response)
    return EvaluationPayload.model_validate(parsed)


def evaluate_answer(question: str, transcript: str, role: str, level: str) -> EvaluationPayload:
    base_prompt = EVALUATION_PROMPT.format(question=question, transcript=transcript or "(no answer given)", role=role, level=level)

    try:
        return _try_evaluate(base_prompt)
    except ValidationError as e:
        # One repair attempt, per spec.
        repair_prompt = base_prompt + REPAIR_PROMPT_SUFFIX.format(error=str(e)[:400])
        try:
            return _try_evaluate(repair_prompt)
        except ValidationError:
            raise InterviewGeminiError("Could not evaluate this answer right now. Please try again.")
    except InterviewGeminiError:
        raise  # network/upstream errors already have a safe, friendly message
