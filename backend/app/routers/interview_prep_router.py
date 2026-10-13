from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.services.interview_prep_service import generate_interview_questions, InterviewPrepServiceError

router = APIRouter(prefix="/api/interview-prep", tags=["AI Interview Preparation"])


@router.post("/generate", response_model=schemas.InterviewPrepOut, status_code=201)
def generate(
    payload: schemas.InterviewPrepRequest,
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
    if not analysis.resume:
        raise HTTPException(status_code=404, detail="Resume not found for this analysis")
    if not analysis.job_description:
        raise HTTPException(status_code=404, detail="Job description not found for this analysis")

    role = payload.role or analysis.job_description.title

    try:
        result = generate_interview_questions(
            resume_text=analysis.resume.raw_text or "",
            job_description=analysis.job_description.description_text,
            role=role,
            difficulty=payload.difficulty,
        )
    except InterviewPrepServiceError as e:
        raise HTTPException(status_code=503, detail=str(e))

    session = models.InterviewPrepSession(
        user_id=current_user.id,
        analysis_id=analysis.id,
        role=role,
        difficulty=payload.difficulty,
        candidate_summary=result.candidate_summary.model_dump(),
        questions=[q.model_dump() for q in result.questions],
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/history", response_model=list[schemas.InterviewPrepHistoryItem])
def get_history(
    analysis_id: Optional[int] = Query(default=None, description="Filter to sessions for one analysis"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(models.InterviewPrepSession).filter(models.InterviewPrepSession.user_id == current_user.id)
    if analysis_id is not None:
        q = q.filter(models.InterviewPrepSession.analysis_id == analysis_id)
    sessions = q.order_by(models.InterviewPrepSession.created_at.desc()).all()

    out = []
    for s in sessions:
        item = schemas.InterviewPrepHistoryItem.model_validate(s)
        item.resume_filename = s.analysis.resume.filename if s.analysis and s.analysis.resume else None
        item.job_title = s.analysis.job_description.title if s.analysis and s.analysis.job_description else None
        out.append(item)
    return out


@router.get("/session/{session_id}", response_model=schemas.InterviewPrepOut)
def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    session = (
        db.query(models.InterviewPrepSession)
        .filter(models.InterviewPrepSession.id == session_id, models.InterviewPrepSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Interview prep session not found")
    return session