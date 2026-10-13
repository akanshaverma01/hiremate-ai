from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.services.cover_letter_service import generate_cover_letter, CoverLetterServiceError

router = APIRouter(prefix="/api/cover-letter", tags=["AI Cover Letter Generator"])


def _get_owned_analysis(db: Session, analysis_id: int, user_id: int) -> models.AnalysisResult:
    analysis = (
        db.query(models.AnalysisResult)
        .filter(models.AnalysisResult.id == analysis_id, models.AnalysisResult.user_id == user_id)
        .first()
    )
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis result not found")
    if not analysis.resume:
        raise HTTPException(status_code=404, detail="Resume not found for this analysis")
    if not analysis.job_description:
        raise HTTPException(status_code=404, detail="Job description not found for this analysis")
    return analysis


def _to_out(row: models.CoverLetter) -> schemas.CoverLetterOut:
    return schemas.CoverLetterOut(
        id=row.id,
        analysis_id=row.analysis_id,
        company_name=row.company_name,
        role_name=row.role_name,
        cover_letter=row.cover_letter_text,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


@router.post("/generate", response_model=schemas.CoverLetterOut, status_code=201)
def generate(
    payload: schemas.CoverLetterRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    analysis = _get_owned_analysis(db, payload.analysis_id, current_user.id)

    # Already generated for this analysis - return it as-is, don't call Gemini
    # again. Use /regenerate explicitly to force a new version.
    existing = (
        db.query(models.CoverLetter)
        .filter(models.CoverLetter.analysis_id == analysis.id, models.CoverLetter.user_id == current_user.id)
        .first()
    )
    if existing:
        return _to_out(existing)

    try:
        result = generate_cover_letter(
            resume_text=analysis.resume.raw_text or "",
            job_description=analysis.job_description.description_text,
        )
    except CoverLetterServiceError as e:
        raise HTTPException(status_code=503, detail=str(e))

    row = models.CoverLetter(
        user_id=current_user.id,
        analysis_id=analysis.id,
        company_name=result["company_name"],
        role_name=analysis.job_description.title,
        cover_letter_text=result["cover_letter"],
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _to_out(row)


@router.get("/history", response_model=list[schemas.CoverLetterOut])
def get_history(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    rows = (
        db.query(models.CoverLetter)
        .filter(models.CoverLetter.user_id == current_user.id)
        .order_by(models.CoverLetter.created_at.desc())
        .all()
    )
    return [_to_out(r) for r in rows]


@router.get("/{analysis_id}", response_model=schemas.CoverLetterOut)
def get_cover_letter(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    row = (
        db.query(models.CoverLetter)
        .filter(models.CoverLetter.analysis_id == analysis_id, models.CoverLetter.user_id == current_user.id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="No cover letter generated yet for this analysis")
    return _to_out(row)


@router.post("/regenerate", response_model=schemas.CoverLetterOut)
def regenerate(
    payload: schemas.CoverLetterRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    analysis = _get_owned_analysis(db, payload.analysis_id, current_user.id)

    row = (
        db.query(models.CoverLetter)
        .filter(models.CoverLetter.analysis_id == analysis.id, models.CoverLetter.user_id == current_user.id)
        .first()
    )
    if not row:
        raise HTTPException(
            status_code=404,
            detail="No existing cover letter to regenerate. Call /api/cover-letter/generate first.",
        )

    try:
        result = generate_cover_letter(
            resume_text=analysis.resume.raw_text or "",
            job_description=analysis.job_description.description_text,
        )
    except CoverLetterServiceError as e:
        raise HTTPException(status_code=503, detail=str(e))

    row.cover_letter_text = result["cover_letter"]
    row.company_name = result["company_name"]
    row.role_name = analysis.job_description.title
    db.commit()
    db.refresh(row)
    return _to_out(row)
