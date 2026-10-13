from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.services.skill_gap_service import generate_skill_gap_report, SkillGapServiceError

router = APIRouter(prefix="/api/skill-gap", tags=["AI Skill Gap Analyzer"])

# Per spec: distinct error codes map to distinct, semantically correct HTTP
# statuses rather than a blanket 503 for everything.
ERROR_CODE_STATUS = {
    "empty_resume": 400,
    "empty_job_description": 400,
    "invalid_ai_response": 502,
    "gemini_unavailable": 503,
}


def _raise_for(e: SkillGapServiceError):
    status = ERROR_CODE_STATUS.get(e.error_code, 500)
    raise HTTPException(status_code=status, detail={"error_code": e.error_code, "message": str(e)})


def _get_owned_analysis(db: Session, analysis_id: int, user_id: int) -> models.AnalysisResult:
    analysis = (
        db.query(models.AnalysisResult)
        .filter(models.AnalysisResult.id == analysis_id, models.AnalysisResult.user_id == user_id)
        .first()
    )
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis result not found")
    return analysis


def _to_out(row: models.SkillGapReport) -> schemas.SkillGapReportOut:
    return schemas.SkillGapReportOut(
        id=row.id,
        analysis_id=row.analysis_id,
        skill_gap_analysis=row.result_json.get("skill_gap_analysis", {}),
        learning_roadmap=row.result_json.get("learning_roadmap", {}),
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


@router.post("/generate", response_model=schemas.SkillGapReportOut, status_code=201)
def generate(
    payload: schemas.SkillGapRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    analysis = _get_owned_analysis(db, payload.analysis_id, current_user.id)

    existing = (
        db.query(models.SkillGapReport)
        .filter(models.SkillGapReport.analysis_id == analysis.id, models.SkillGapReport.user_id == current_user.id)
        .first()
    )
    if existing:
        return _to_out(existing)

    resume_text = analysis.resume.raw_text if analysis.resume else ""
    job_description = analysis.job_description.description_text if analysis.job_description else ""

    try:
        result = generate_skill_gap_report(resume_text, job_description)
    except SkillGapServiceError as e:
        _raise_for(e)

    row = models.SkillGapReport(user_id=current_user.id, analysis_id=analysis.id, result_json=result)
    db.add(row)
    db.commit()
    db.refresh(row)
    return _to_out(row)


@router.get("/history", response_model=list[schemas.SkillGapReportOut])
def get_history(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    rows = (
        db.query(models.SkillGapReport)
        .filter(models.SkillGapReport.user_id == current_user.id)
        .order_by(models.SkillGapReport.created_at.desc())
        .all()
    )
    return [_to_out(r) for r in rows]


@router.get("/{analysis_id}", response_model=schemas.SkillGapReportOut)
def get_report(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    row = (
        db.query(models.SkillGapReport)
        .filter(models.SkillGapReport.analysis_id == analysis_id, models.SkillGapReport.user_id == current_user.id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="No skill gap report generated yet for this analysis")
    return _to_out(row)


@router.post("/regenerate", response_model=schemas.SkillGapReportOut)
def regenerate(
    payload: schemas.SkillGapRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    analysis = _get_owned_analysis(db, payload.analysis_id, current_user.id)

    row = (
        db.query(models.SkillGapReport)
        .filter(models.SkillGapReport.analysis_id == analysis.id, models.SkillGapReport.user_id == current_user.id)
        .first()
    )
    if not row:
        raise HTTPException(
            status_code=404,
            detail="No existing skill gap report to regenerate. Call /api/skill-gap/generate first.",
        )

    resume_text = analysis.resume.raw_text if analysis.resume else ""
    job_description = analysis.job_description.description_text if analysis.job_description else ""

    try:
        result = generate_skill_gap_report(resume_text, job_description)
    except SkillGapServiceError as e:
        _raise_for(e)

    row.result_json = result
    db.commit()
    db.refresh(row)
    return _to_out(row)