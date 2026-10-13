from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.services.interview.gemini_utils import InterviewGeminiError
from app.services.interview.question_service import generate_mock_interview_questions
from app.services.interview.transcribe_service import transcribe_audio
from app.services.interview.evaluation_service import evaluate_answer
from app.services.interview.report_service import compute_score_averages, generate_qualitative_report

router = APIRouter(prefix="/api/interview", tags=["AI Mock Interview"])

ALLOWED_AUDIO_TYPES = {"audio/webm", "audio/ogg", "audio/wav", "audio/mpeg", "audio/mp4"}
MAX_AUDIO_SIZE_MB = 15


@router.post("/start", response_model=schemas.MockInterviewStartOut, status_code=201)
def start_interview(
    payload: schemas.MockInterviewStartRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    resume_text = None
    job_description = None

    if payload.analysis_id is not None:
        analysis = (
            db.query(models.AnalysisResult)
            .filter(models.AnalysisResult.id == payload.analysis_id, models.AnalysisResult.user_id == current_user.id)
            .first()
        )
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis result not found")
        resume_text = analysis.resume.raw_text if analysis.resume else None
        job_description = analysis.job_description.description_text if analysis.job_description else None

    try:
        questions_data = generate_mock_interview_questions(
            role=payload.role,
            level=payload.level,
            total_questions=payload.total_questions,
            resume_text=resume_text,
            job_description=job_description,
        )
    except InterviewGeminiError as e:
        raise HTTPException(status_code=503, detail=str(e))

    session = models.InterviewSession(
        user_id=current_user.id,
        analysis_id=payload.analysis_id,
        role=payload.role,
        level=payload.level,
        total_questions=payload.total_questions,
    )
    db.add(session)
    db.flush()  # get session.id before creating questions

    question_rows = []
    for q in questions_data:
        row = models.InterviewQuestion(
            session_id=session.id,
            question_number=q["question_number"],
            question_text=q["question_text"],
            category=q["category"],
            difficulty=q["difficulty"],
        )
        db.add(row)
        question_rows.append(row)

    db.commit()
    for row in question_rows:
        db.refresh(row)

    return schemas.MockInterviewStartOut(
        session_id=session.id,
        role=session.role,
        level=session.level,
        total_questions=session.total_questions,
        questions=[schemas.MockInterviewQuestionOut.model_validate(q) for q in question_rows],
    )


@router.post("/transcribe", response_model=schemas.TranscribeOut)
async def transcribe(
    file: UploadFile = File(...),
    duration_seconds: int = Form(default=None),
    current_user: models.User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_AUDIO_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported audio type: {file.content_type}")

    audio_bytes = await file.read()
    if len(audio_bytes) > MAX_AUDIO_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"Audio exceeds {MAX_AUDIO_SIZE_MB}MB limit")

    # Raw audio is never persisted to disk or DB - transcribed in memory and discarded.
    try:
        result = transcribe_audio(audio_bytes, file.content_type, duration_seconds)
    except InterviewGeminiError as e:
        raise HTTPException(status_code=503, detail=str(e))

    return schemas.TranscribeOut(**result)


@router.post("/evaluate-answer", response_model=schemas.EvaluateAnswerOut, status_code=201)
def evaluate(
    payload: schemas.EvaluateAnswerRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    question = (
        db.query(models.InterviewQuestion)
        .join(models.InterviewSession)
        .filter(
            models.InterviewQuestion.id == payload.question_id,
            models.InterviewSession.user_id == current_user.id,
        )
        .first()
    )
    if not question:
        raise HTTPException(status_code=404, detail="Interview question not found")

    # Idempotent: if this question was already answered, return the saved
    # answer instead of re-evaluating (avoids duplicate Gemini calls on a
    # double-submit or page refresh mid-flow).
    if question.answer:
        return question.answer

    try:
        result = evaluate_answer(
            question=question.question_text,
            transcript=payload.transcript,
            role=question.session.role,
            level=question.session.level,
        )
    except InterviewGeminiError as e:
        raise HTTPException(status_code=503, detail=str(e))

    answer = models.InterviewAnswer(
        question_id=question.id,
        transcript=payload.transcript,
        duration_seconds=payload.duration_seconds,
        technical_score=result.technical_accuracy,
        communication_score=result.communication,
        clarity_score=result.clarity,
        confidence_score=result.confidence,
        completeness_score=result.completeness,
        strengths=result.strengths,
        improvements=result.improvements,
        missing_points=result.missing_points,
        ideal_answer=result.ideal_answer,
        follow_up_question=result.follow_up_question,
        follow_up_reason=result.follow_up_reason,
    )
    db.add(answer)
    db.commit()
    db.refresh(answer)
    return answer


@router.post("/finish", response_model=schemas.InterviewReportOut)
def finish(
    payload: schemas.FinishInterviewRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    session = (
        db.query(models.InterviewSession)
        .filter(models.InterviewSession.id == payload.session_id, models.InterviewSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    # Already finished - return the saved report instead of regenerating.
    if session.completed_at and session.report_json:
        return _build_report_out(session)

    answered_questions = [q for q in session.questions if q.answer]
    if not answered_questions:
        raise HTTPException(status_code=400, detail="Cannot finish an interview with no answered questions")

    answers = [q.answer for q in answered_questions]
    averages = compute_score_averages(answers)

    qa_pairs = [
        {
            "category": q.category,
            "difficulty": q.difficulty,
            "question": q.question_text,
            "transcript": q.answer.transcript,
            "technical_score": q.answer.technical_score,
            "communication_score": q.answer.communication_score,
            "clarity_score": q.answer.clarity_score,
            "confidence_score": q.answer.confidence_score,
            "completeness_score": q.answer.completeness_score,
        }
        for q in answered_questions
    ]

    try:
        qualitative = generate_qualitative_report(session.role, session.level, averages, qa_pairs)
    except InterviewGeminiError as e:
        raise HTTPException(status_code=503, detail=str(e))

    session.completed_at = datetime.now(timezone.utc)
    session.overall_score = averages["overall_score"]
    session.technical_average = averages["technical_average"]
    session.communication_average = averages["communication_average"]
    session.clarity_average = averages["clarity_average"]
    session.confidence_average = averages["confidence_average"]
    session.completeness_average = averages["completeness_average"]
    session.report_json = qualitative.model_dump()

    db.commit()
    db.refresh(session)
    return _build_report_out(session)


def _build_report_out(session: models.InterviewSession) -> schemas.InterviewReportOut:
    report = session.report_json or {}
    return schemas.InterviewReportOut(
        session_id=session.id,
        role=session.role,
        level=session.level,
        total_questions=session.total_questions,
        overall_score=session.overall_score or 0.0,
        technical_average=session.technical_average or 0.0,
        communication_average=session.communication_average or 0.0,
        clarity_average=session.clarity_average or 0.0,
        confidence_average=session.confidence_average or 0.0,
        completeness_average=session.completeness_average or 0.0,
        summary=report.get("summary", ""),
        top_strengths=report.get("top_strengths", []),
        top_weaknesses=report.get("top_weaknesses", []),
        topics_to_revise=report.get("topics_to_revise", []),
        next_interview_focus=report.get("next_interview_focus", ""),
        motivational_feedback=report.get("motivational_feedback", ""),
        started_at=session.started_at,
        completed_at=session.completed_at,
    )


@router.get("/history", response_model=list[schemas.MockInterviewHistoryItem])
def get_history(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return (
        db.query(models.InterviewSession)
        .filter(models.InterviewSession.user_id == current_user.id)
        .order_by(models.InterviewSession.started_at.desc())
        .all()
    )


@router.get("/session/{session_id}", response_model=schemas.MockInterviewSessionDetail)
def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    session = (
        db.query(models.InterviewSession)
        .filter(models.InterviewSession.id == session_id, models.InterviewSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    questions_out = []
    for q in session.questions:
        item = {
            "id": q.id,
            "question_number": q.question_number,
            "question_text": q.question_text,
            "category": q.category,
            "difficulty": q.difficulty,
            "answer": None,
        }
        if q.answer:
            item["answer"] = {
                "id": q.answer.id,
                "transcript": q.answer.transcript,
                "technical_score": q.answer.technical_score,
                "communication_score": q.answer.communication_score,
                "clarity_score": q.answer.clarity_score,
                "confidence_score": q.answer.confidence_score,
                "completeness_score": q.answer.completeness_score,
                "strengths": q.answer.strengths,
                "improvements": q.answer.improvements,
                "missing_points": q.answer.missing_points,
                "ideal_answer": q.answer.ideal_answer,
                "follow_up_question": q.answer.follow_up_question,
                "follow_up_reason": q.answer.follow_up_reason,
            }
        questions_out.append(item)

    report_out = _build_report_out(session) if session.completed_at and session.report_json else None

    return schemas.MockInterviewSessionDetail(
        session=schemas.MockInterviewHistoryItem.model_validate(session),
        questions=questions_out,
        report=report_out,
    )
