from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.ml.ats_scorer import compute_ats_score, analyze_skills, generate_suggestions

router = APIRouter(prefix="/api/analysis", tags=["Analysis"])


@router.post("/", response_model=schemas.AnalysisResultOut, status_code=201)
def analyze_resume(
    payload: schemas.AnalyzeRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    resume = (
        db.query(models.Resume)
        .filter(models.Resume.id == payload.resume_id, models.Resume.user_id == current_user.id)
        .first()
    )
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    jd = (
        db.query(models.JobDescription)
        .filter(
            models.JobDescription.id == payload.job_description_id,
            models.JobDescription.user_id == current_user.id,
        )
        .first()
    )
    if not jd:
        raise HTTPException(status_code=404, detail="Job description not found")

    score = compute_ats_score(resume.raw_text or "", jd.description_text)
    matched, missing, recommended = analyze_skills(resume.raw_text or "", jd.description_text)
    suggestions = generate_suggestions(score, missing)

    result = models.AnalysisResult(
        user_id=current_user.id,
        resume_id=resume.id,
        job_description_id=jd.id,
        ats_score=score,
        matched_skills=", ".join(matched),
        missing_skills=", ".join(missing),
        recommended_skills=", ".join(recommended),
        suggestions=suggestions,
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    return result


@router.get("/history", response_model=list[schemas.AnalysisHistoryOut])
def get_history(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    results = (
        db.query(models.AnalysisResult)
        .filter(models.AnalysisResult.user_id == current_user.id)
        .order_by(models.AnalysisResult.created_at.desc())
        .all()
    )
    out = []
    for r in results:
        item = schemas.AnalysisHistoryOut.model_validate(r)
        item.resume_filename = r.resume.filename if r.resume else None
        item.job_title = r.job_description.title if r.job_description else None
        out.append(item)
    return out


@router.get("/{analysis_id}", response_model=schemas.AnalysisHistoryOut)
def get_single_result(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    result = (
        db.query(models.AnalysisResult)
        .filter(models.AnalysisResult.id == analysis_id, models.AnalysisResult.user_id == current_user.id)
        .first()
    )
    if not result:
        raise HTTPException(status_code=404, detail="Analysis result not found")

    item = schemas.AnalysisHistoryOut.model_validate(result)
    item.resume_filename = result.resume.filename if result.resume else None
    item.job_title = result.job_description.title if result.job_description else None
    return item
