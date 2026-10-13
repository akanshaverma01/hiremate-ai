import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.services.gemini_copilot_service import improve_resume_section, CopilotServiceError

router = APIRouter(prefix="/api/copilot", tags=["AI Resume Copilot"])


@router.post("/improve", response_model=schemas.CopilotImproveOut, status_code=201)
def improve_section(
    payload: schemas.CopilotImproveRequest,
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
    if not resume:
        raise HTTPException(status_code=404, detail="Linked resume not found")

    try:
        result = improve_resume_section(
            resume_text=resume.raw_text or "",
            job_description=jd.description_text if jd else "",
            section=payload.section,
        )
    except CopilotServiceError as e:
        # 503: failure is upstream (Gemini busy/unavailable) or the response was
        # unusable - never expose Gemini's raw error text to the client here.
        raise HTTPException(status_code=503, detail=str(e))

    # Persist to copilot_history. Text sections use before/after directly;
    # skills/grammar sections don't have a single before/after string, so the
    # full structured result is JSON-encoded into improved_text instead.
    if payload.section in ("summary", "experience", "projects"):
        original_text = result.get("before")
        improved_text = result.get("after")
        tips = result.get("tips", [])
    else:
        original_text = None
        improved_text = json.dumps(result)
        tips = result.get("tips", []) if payload.section == "skills" else []

    history_row = models.CopilotHistory(
        user_id=current_user.id,
        section=payload.section,
        original_text=original_text,
        improved_text=improved_text,
        tips=tips,
    )
    db.add(history_row)
    db.commit()

    return schemas.CopilotImproveOut(section=payload.section, created_at=history_row.created_at, **result)


@router.get("/history", response_model=list[schemas.CopilotHistoryOut])
def get_copilot_history(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    rows = (
        db.query(models.CopilotHistory)
        .filter(models.CopilotHistory.user_id == current_user.id)
        .order_by(models.CopilotHistory.created_at.desc())
        .all()
    )
    return rows
