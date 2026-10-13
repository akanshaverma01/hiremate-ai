from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.config import settings
from app.routers import auth_router, resume_router, job_router, analysis_router, report_router, ai_router, copilot_router, cover_letter_router, interview_prep_router, interview_router, skill_gap_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="HireMate AI API",
    description="FastAPI backend for HireMate AI - resume-to-job-description ATS matching, AI recruiter feedback, resume copilot, cover letters, interview prep, mock interviews, and skill-gap roadmaps.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(resume_router.router)
app.include_router(job_router.router)
app.include_router(analysis_router.router)
app.include_router(report_router.router)
app.include_router(ai_router.router)
app.include_router(copilot_router.router)
app.include_router(cover_letter_router.router)
app.include_router(interview_prep_router.router)
app.include_router(interview_router.router)
app.include_router(skill_gap_router.router)


@app.get("/")
def root():
    return {"status": "ok", "service": "HireMate AI API"}


@app.get("/health")
def health():
    return {"status": "healthy"}
