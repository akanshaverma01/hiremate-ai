from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.services.gemini_service import get_recruiter_feedback, GeminiServiceError

router = APIRouter(prefix="/api/ai", tags=["AI Recruiter Feedback"])


@router.post("/recruiter-feedback", response_model=schemas.RecruiterFeedbackOut, status_code=201)
def recruiter_feedback(
    payload: schemas.RecruiterFeedbackRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    analysis = (
        db.query(models.AnalysisResult)
        .filter(
            models.AnalysisResult.id == payload.analysis_id,
            models.AnalysisResult.user_id == current_user.id,
        )
        .first()
    )
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis result not found")

    resume = analysis.resume
    jd = analysis.job_description
    if not resume or not jd:
        raise HTTPException(status_code=404, detail="Linked resume or job description not found")

    try:
        feedback = get_recruiter_feedback(
            resume_text=resume.raw_text or "",
            job_description=jd.description_text,
            ats_score=analysis.ats_score,
        )
    except GeminiServiceError as e:
        # 502: the failure is in the upstream Gemini call/response, not this API's own logic
        raise HTTPException(status_code=502, detail=str(e))

    record = models.RecruiterFeedback(
        user_id=current_user.id,
        resume_id=resume.id,
        analysis_id=analysis.id,
        ats_score=analysis.ats_score,
        recruiter_status=feedback.overall_recruiter_decision.status,
        interview_probability=feedback.interview_probability.percentage,
        strengths=feedback.strengths,
        weaknesses=feedback.weaknesses,
        suggestions=feedback.suggestions,
        missing_keywords=feedback.missing_keywords,
        section_scores=feedback.section_scores.model_dump(),
        overall_reason=feedback.overall_recruiter_decision.reason,
        interview_probability_reason=feedback.interview_probability.reason,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/recruiter-feedback/{analysis_id}", response_model=schemas.RecruiterFeedbackOut)
def get_saved_recruiter_feedback(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    record = (
        db.query(models.RecruiterFeedback)
        .filter(
            models.RecruiterFeedback.analysis_id == analysis_id,
            models.RecruiterFeedback.user_id == current_user.id,
        )
        .order_by(models.RecruiterFeedback.created_at.desc())
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="No recruiter feedback found for this analysis yet")
    return record
