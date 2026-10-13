from sqlalchemy import (
    Column, Integer, String, Text, ForeignKey, TIMESTAMP, Float, JSON, Boolean
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    resumes = relationship("Resume", back_populates="owner", cascade="all, delete-orphan")
    job_descriptions = relationship("JobDescription", back_populates="owner", cascade="all, delete-orphan")
    analyses = relationship("AnalysisResult", back_populates="owner", cascade="all, delete-orphan")


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    raw_text = Column(Text, nullable=True)
    uploaded_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="resumes")
    analyses = relationship("AnalysisResult", back_populates="resume", cascade="all, delete-orphan")


class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description_text = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="job_descriptions")
    analyses = relationship("AnalysisResult", back_populates="job_description", cascade="all, delete-orphan")


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    job_description_id = Column(Integer, ForeignKey("job_descriptions.id", ondelete="CASCADE"), nullable=False)

    ats_score = Column(Float, nullable=False)
    matched_skills = Column(Text, nullable=True)     # comma-separated
    missing_skills = Column(Text, nullable=True)     # comma-separated
    recommended_skills = Column(Text, nullable=True) # comma-separated
    suggestions = Column(Text, nullable=True)

    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="analyses")
    resume = relationship("Resume", back_populates="analyses")
    job_description = relationship("JobDescription", back_populates="analyses")
    recruiter_feedback = relationship(
        "RecruiterFeedback", back_populates="analysis", cascade="all, delete-orphan"
    )


class RecruiterFeedback(Base):
    """
    AI-generated recruiter-style feedback for a given resume/JD/ATS-score
    combination, produced by calling the Gemini API (see
    app/services/gemini_service.py). This is NOT the project's own trained
    model - it's an external LLM call, kept separate from analysis_results
    (which holds the TF-IDF/cosine-similarity score computed in-house).
    """
    __tablename__ = "recruiter_feedback"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    analysis_id = Column(Integer, ForeignKey("analysis_results.id", ondelete="CASCADE"), nullable=False)

    ats_score = Column(Float, nullable=False)
    recruiter_status = Column(String(50), nullable=True)     # High Match | Medium Match | Low Match
    interview_probability = Column(Integer, nullable=True)   # 0-100

    strengths = Column(JSON, nullable=True)
    weaknesses = Column(JSON, nullable=True)
    suggestions = Column(JSON, nullable=True)
    missing_keywords = Column(JSON, nullable=True)
    section_scores = Column(JSON, nullable=True)
    overall_reason = Column(Text, nullable=True)
    interview_probability_reason = Column(Text, nullable=True)

    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    owner = relationship("User")
    resume = relationship("Resume")
    analysis = relationship("AnalysisResult", back_populates="recruiter_feedback")


class CopilotHistory(Base):
    """
    Stores every successful AI Resume Copilot generation.

    For text sections (summary/experience/projects), original_text/improved_text
    hold plain text (the extracted "before" and the AI "after").
    For skills/grammar sections, original_text is null and improved_text holds
    a JSON-encoded string of the structured result (matched/missing skills,
    grammar issues, etc.) since those sections don't have a single before/after
    string - the frontend parses `section` to know how to render improved_text.
    """
    __tablename__ = "copilot_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    section = Column(String(30), nullable=False)
    original_text = Column(Text, nullable=True)
    improved_text = Column(Text, nullable=True)
    tips = Column(JSON, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    owner = relationship("User")


class CoverLetter(Base):
    """
    One generated cover letter per analysis (resume + job description pair).
    company_name is best-effort, extracted with a local regex heuristic on the
    JD text (not by Gemini - the generation prompt requires plain-text-only
    output, so it can't also return structured fields in the same call).
    Expect this to be null often; most pasted job descriptions don't contain
    an easily-parseable company name.
    """
    __tablename__ = "cover_letters"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    analysis_id = Column(
        Integer, ForeignKey("analysis_results.id", ondelete="CASCADE"), nullable=False, unique=True
    )

    company_name = Column(String(255), nullable=True)
    role_name = Column(String(255), nullable=True)
    cover_letter_text = Column(Text, nullable=False)

    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    owner = relationship("User")
    analysis = relationship("AnalysisResult")


class InterviewPrepSession(Base):
    """
    Unlike CoverLetter (one per analysis), multiple interview-prep sessions
    are allowed per analysis - a user may want different difficulty levels
    or a different target role wording for the same resume/JD pair, so
    analysis_id is NOT unique here.
    """
    __tablename__ = "interview_prep_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    analysis_id = Column(Integer, ForeignKey("analysis_results.id", ondelete="CASCADE"), nullable=False)

    role = Column(String(255), nullable=True)
    difficulty = Column(String(20), nullable=False)
    candidate_summary = Column(JSON, nullable=False)
    questions = Column(JSON, nullable=False)

    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    owner = relationship("User")
    analysis = relationship("AnalysisResult")


class InterviewSession(Base):
    """
    analysis_id is nullable - the spec's Mock Interview UI never asks the
    user to pick a resume/JD, only role + level + question count. When it IS
    provided (linked from an Analysis Result page), question generation is
    personalized the same way Interview Prep does it.

    technical_average..completeness_average and report_json are additions
    beyond the spec's literal column list: the spec requires storing a
    "detailed interview report" that can be reopened later (History -> click
    card), but never defines where that report's content lives. Without
    these columns, the report would only exist for one HTTP response and
    then be gone forever.
    """
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    analysis_id = Column(Integer, ForeignKey("analysis_results.id", ondelete="SET NULL"), nullable=True)

    role = Column(String(255), nullable=False)
    level = Column(String(50), nullable=False)
    total_questions = Column(Integer, nullable=False)

    started_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    completed_at = Column(TIMESTAMP(timezone=True), nullable=True)

    overall_score = Column(Float, nullable=True)
    technical_average = Column(Float, nullable=True)
    communication_average = Column(Float, nullable=True)
    clarity_average = Column(Float, nullable=True)
    confidence_average = Column(Float, nullable=True)
    completeness_average = Column(Float, nullable=True)

    # Qualitative synthesis from Gemini (summary, top_strengths, top_weaknesses,
    # topics_to_revise, next_interview_focus, motivational_feedback) as one JSON blob.
    report_json = Column(JSON, nullable=True)

    owner = relationship("User")
    analysis = relationship("AnalysisResult")
    questions = relationship(
        "InterviewQuestion", back_populates="session", cascade="all, delete-orphan",
        order_by="InterviewQuestion.question_number",
    )


class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False)
    question_number = Column(Integer, nullable=False)
    question_text = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)
    difficulty = Column(String(20), nullable=False)

    session = relationship("InterviewSession", back_populates="questions")
    answer = relationship(
        "InterviewAnswer", back_populates="question", uselist=False, cascade="all, delete-orphan"
    )


class InterviewAnswer(Base):
    """
    strengths/improvements/missing_points/follow_up_reason are additions
    beyond the spec's literal column list - the evaluation JSON schema
    strictly requires Gemini to generate them (exactly 3 strengths, etc.),
    but the spec's own interview_answers column list has nowhere to store
    them. Without these columns, that data would be generated and shown
    once, then permanently lost - making a later "detailed report" review
    of a specific answer impossible.
    """
    __tablename__ = "interview_answers"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(
        Integer, ForeignKey("interview_questions.id", ondelete="CASCADE"), nullable=False, unique=True
    )

    transcript = Column(Text, nullable=False)
    duration_seconds = Column(Integer, nullable=True)

    technical_score = Column(Integer, nullable=False)
    communication_score = Column(Integer, nullable=False)
    clarity_score = Column(Integer, nullable=False)
    confidence_score = Column(Integer, nullable=False)
    completeness_score = Column(Integer, nullable=False)

    strengths = Column(JSON, nullable=True)
    improvements = Column(JSON, nullable=True)
    missing_points = Column(JSON, nullable=True)
    ideal_answer = Column(Text, nullable=True)
    follow_up_question = Column(Text, nullable=True)
    follow_up_reason = Column(Text, nullable=True)

    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    question = relationship("InterviewQuestion", back_populates="answer")


class SkillGapReport(Base):
    """
    One report per analysis (idempotent generate, explicit regenerate) - same
    pattern as CoverLetter. The full nested result (skill gap analysis +
    4-phase learning roadmap) is stored as one JSON blob rather than
    normalized into a dozen relational tables: nothing downstream needs to
    query into individual roadmap phases or missing-skill rows with SQL, so
    the added complexity of full normalization wouldn't pay for itself here
    (unlike interview_answers, which needed real columns for score averaging).
    """
    __tablename__ = "skill_gap_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    analysis_id = Column(
        Integer, ForeignKey("analysis_results.id", ondelete="CASCADE"), nullable=False, unique=True
    )

    result_json = Column(JSON, nullable=False)  # {"skill_gap_analysis": {...}, "learning_roadmap": {...}}

    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    owner = relationship("User")
    analysis = relationship("AnalysisResult")


class PasswordResetToken(Base):
    """
    Only a SHA-256 hash of the reset token is stored, never the raw value -
    same principle as password hashing. The raw token only ever exists in
    memory long enough to email it to the user; if this table were ever
    leaked, the hashes alone can't be used to reset anyone's password.
    """
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_hash = Column(String(64), nullable=False, unique=True, index=True)  # hex sha256 = 64 chars
    expires_at = Column(TIMESTAMP(timezone=True), nullable=False)
    used = Column(Boolean, nullable=False, default=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    owner = relationship("User")