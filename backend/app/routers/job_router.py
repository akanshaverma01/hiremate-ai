from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter(prefix="/api/job-descriptions", tags=["Job Descriptions"])


@router.post("/", response_model=schemas.JobDescriptionOut, status_code=201)
def create_job_description(
    payload: schemas.JobDescriptionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not payload.description_text.strip():
        raise HTTPException(status_code=400, detail="Job description text cannot be empty")

    jd = models.JobDescription(
        user_id=current_user.id,
        title=payload.title,
        description_text=payload.description_text,
    )
    db.add(jd)
    db.commit()
    db.refresh(jd)
    return jd


@router.get("/", response_model=list[schemas.JobDescriptionOut])
def list_job_descriptions(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return (
        db.query(models.JobDescription)
        .filter(models.JobDescription.user_id == current_user.id)
        .order_by(models.JobDescription.created_at.desc())
        .all()
    )
