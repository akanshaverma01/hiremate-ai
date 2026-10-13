from pydantic import BaseModel, EmailStr, ConfigDict, field_validator
from datetime import datetime
from typing import Optional, List, Literal


# ---------- Auth ----------
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    full_name: str
    email: EmailStr
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Resume ----------
class ResumeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    filename: str
    uploaded_at: datetime


# ---------- Job Description ----------
class JobDescriptionCreate(BaseModel):
    title: str
    description_text: str


class JobDescriptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description_text: str
    created_at: datetime


# ---------- Analysis ----------
class AnalyzeRequest(BaseModel):
    resume_id: int
    job_description_id: int


class AnalysisResultOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    resume_id: int
    job_description_id: int
    ats_score: float
    matched_skills: Optional[str] = None
    missing_skills: Optional[str] = None
    recommended_skills: Optional[str] = None
    suggestions: Optional[str] = None
    created_at: datetime


class AnalysisHistoryOut(AnalysisResultOut):
    resume_filename: Optional[str] = None
    job_title: Optional[str] = None


# ---------- Recruiter Feedback (Gemini) ----------
class RecruiterFeedbackRequest(BaseModel):
    analysis_id: int


class OverallDecision(BaseModel):
    status: str
    reason: str


class InterviewProbability(BaseModel):
    percentage: int
    reason: str


class SectionScores(BaseModel):
    summary: int = 0
    skills: int = 0
    experience: int = 0
    projects: int = 0
    education: int = 0
    formatting: int = 0


class GeminiFeedbackPayload(BaseModel):
    """
    Strict schema the raw Gemini JSON output is validated against before
    anything touches the database. If Gemini's response doesn't match this
    shape, validation fails loudly instead of saving garbage.
    """
    overall_recruiter_decision: OverallDecision
    strengths: List[str]
    weaknesses: List[str]
    missing_keywords: List[str]
    suggestions: List[str]
    section_scores: SectionScores
    interview_probability: InterviewProbability


class RecruiterFeedbackOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    analysis_id: int
    resume_id: int
    ats_score: float
    recruiter_status: Optional[str] = None
    interview_probability: Optional[int] = None
    strengths: Optional[List[str]] = None
    weaknesses: Optional[List[str]] = None
    suggestions: Optional[List[str]] = None
    missing_keywords: Optional[List[str]] = None
    section_scores: Optional[dict] = None
    overall_reason: Optional[str] = None
    interview_probability_reason: Optional[str] = None
    created_at: datetime


# ---------- AI Resume Copilot ----------
CopilotSection = Literal["summary", "experience", "projects", "skills", "grammar"]


class CopilotImproveRequest(BaseModel):
    analysis_id: int
    section: CopilotSection


class CopilotTextSectionPayload(BaseModel):
    """Schema for summary / experience / projects sections."""
    before: str
    after: str
    tips: List[str]


class CopilotSkillsPayload(BaseModel):
    """Schema for the skills section."""
    matched_skills: List[str]
    missing_skills: List[str]
    recommended_skills: List[str]
    tips: List[str]


class CopilotGrammarPayload(BaseModel):
    """Schema for the grammar/ATS-language section."""
    grammar_issues: List[str]
    repeated_keywords: List[str]
    weak_action_verbs: List[str]
    formatting_suggestions: List[str]


class CopilotImproveOut(BaseModel):
    """
    Generic response shape covering all section types - only the fields
    relevant to the requested `section` will be populated, the rest are null.
    Keeping one shape (rather than a discriminated union) makes the frontend
    simpler: it just checks `section` and reads the matching fields.
    """
    section: CopilotSection
    before: Optional[str] = None
    after: Optional[str] = None
    tips: Optional[List[str]] = None
    matched_skills: Optional[List[str]] = None
    missing_skills: Optional[List[str]] = None
    recommended_skills: Optional[List[str]] = None
    grammar_issues: Optional[List[str]] = None
    repeated_keywords: Optional[List[str]] = None
    weak_action_verbs: Optional[List[str]] = None
    formatting_suggestions: Optional[List[str]] = None
    created_at: Optional[datetime] = None


class CopilotHistoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    section: str
    original_text: Optional[str] = None
    improved_text: Optional[str] = None
    tips: Optional[List[str]] = None
    created_at: datetime


# ---------- AI Cover Letter Generator ----------
class CoverLetterRequest(BaseModel):
    analysis_id: int


class CoverLetterOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    analysis_id: int
    company_name: Optional[str] = None
    role_name: Optional[str] = None
    cover_letter: str
    created_at: datetime
    updated_at: Optional[datetime] = None


# ---------- AI Interview Preparation ----------
InterviewDifficulty = Literal["Easy", "Medium", "Hard"]


class InterviewPrepRequest(BaseModel):
    analysis_id: int
    difficulty: InterviewDifficulty = "Medium"
    role: Optional[str] = None  # if omitted, backend falls back to the JD's saved title


class CandidateSummary(BaseModel):
    matched_skills: List[str]
    missing_skills: List[str]
    experience_level: str
    focus_areas: List[str]


class InterviewQuestion(BaseModel):
    id: int
    # category/difficulty are left as free strings rather than a strict enum -
    # see interview_prep_service.py docstring for why exact label text isn't
    # hard-validated.
    category: str
    difficulty: str
    skill: str
    question: str
    why_this_question: str
    expected_topics: List[str]
    estimated_time_minutes: int


class InterviewPrepPayload(BaseModel):
    """
    Strict schema the raw Gemini JSON output is validated against.
    Question COUNT (exactly 12) is strictly enforced - that's a clean,
    reliable check. The 5/3/2/2 category distribution is requested in the
    prompt but not hard-validated here, since LLMs are inconsistent about
    exact category label phrasing and over-strict validation would cause
    frequent spurious failures over wording, not real quality problems.
    """
    candidate_summary: CandidateSummary
    questions: List[InterviewQuestion]

    @field_validator("questions")
    @classmethod
    def exactly_twelve_questions(cls, v):
        if len(v) != 12:
            raise ValueError(f"Expected exactly 12 questions, got {len(v)}")
        return v


class InterviewPrepOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    analysis_id: int
    role: Optional[str] = None
    difficulty: str
    candidate_summary: dict
    questions: List[dict]
    created_at: datetime


class InterviewPrepHistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    analysis_id: int
    role: Optional[str] = None
    difficulty: str
    created_at: datetime
    resume_filename: Optional[str] = None
    job_title: Optional[str] = None


# ---------- AI Mock Interview ----------
class MockInterviewStartRequest(BaseModel):
    role: str
    level: str
    total_questions: Literal[5, 10, 12] = 10
    analysis_id: Optional[int] = None  # optional resume/JD personalization


class MockInterviewQuestionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    question_number: int
    question_text: str
    category: str
    difficulty: str


class MockInterviewStartOut(BaseModel):
    session_id: int
    role: str
    level: str
    total_questions: int
    questions: List[MockInterviewQuestionOut]


class TranscribeOut(BaseModel):
    transcript: str
    language: Optional[str] = None
    duration_seconds: Optional[int] = None


class EvaluateAnswerRequest(BaseModel):
    question_id: int
    transcript: str
    duration_seconds: Optional[int] = None


class EvaluationPayload(BaseModel):
    """Strict schema Gemini's per-answer evaluation JSON is validated against."""
    technical_accuracy: int
    communication: int
    clarity: int
    confidence: int
    completeness: int
    strengths: List[str]
    improvements: List[str]
    missing_points: List[str]
    ideal_answer: str
    follow_up_question: str
    follow_up_reason: str

    @field_validator("technical_accuracy", "communication", "clarity", "confidence", "completeness")
    @classmethod
    def score_in_range(cls, v):
        if not (1 <= v <= 10):
            raise ValueError(f"Score must be between 1 and 10, got {v}")
        return v

    @field_validator("strengths", "improvements", "missing_points")
    @classmethod
    def exactly_three(cls, v):
        if len(v) != 3:
            raise ValueError(f"Expected exactly 3 items, got {len(v)}")
        return v


class EvaluateAnswerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    question_id: int
    transcript: str
    technical_score: int
    communication_score: int
    clarity_score: int
    confidence_score: int
    completeness_score: int
    strengths: List[str]
    improvements: List[str]
    missing_points: List[str]
    ideal_answer: str
    follow_up_question: str
    follow_up_reason: str
    created_at: datetime


class FinishInterviewRequest(BaseModel):
    session_id: int


class ReportQualitativePayload(BaseModel):
    """Strict schema for Gemini's qualitative synthesis in the final report.
    Numeric averages/overall_score are NOT part of this - they're computed
    deterministically in Python from stored per-answer scores (see
    report_service.py) rather than trusted to Gemini's arithmetic."""
    summary: str
    top_strengths: List[str]
    top_weaknesses: List[str]
    topics_to_revise: List[str]
    next_interview_focus: str
    motivational_feedback: str

    @field_validator("top_strengths", "top_weaknesses")
    @classmethod
    def exactly_three(cls, v):
        if len(v) != 3:
            raise ValueError(f"Expected exactly 3 items, got {len(v)}")
        return v

    @field_validator("topics_to_revise")
    @classmethod
    def exactly_five(cls, v):
        if len(v) != 5:
            raise ValueError(f"Expected exactly 5 items, got {len(v)}")
        return v


class InterviewReportOut(BaseModel):
    session_id: int
    role: str
    level: str
    total_questions: int
    overall_score: float
    technical_average: float
    communication_average: float
    clarity_average: float
    confidence_average: float
    completeness_average: float
    summary: str
    top_strengths: List[str]
    top_weaknesses: List[str]
    topics_to_revise: List[str]
    next_interview_focus: str
    motivational_feedback: str
    started_at: datetime
    completed_at: Optional[datetime] = None


class MockInterviewHistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    role: str
    level: str
    total_questions: int
    overall_score: Optional[float] = None
    started_at: datetime
    completed_at: Optional[datetime] = None


class MockInterviewSessionDetail(BaseModel):
    session: MockInterviewHistoryItem
    questions: List[dict]  # each: question fields + nested "answer" (or null)
    report: Optional[InterviewReportOut] = None


# ---------- AI Skill Gap Analyzer + Learning Roadmap ----------
class SkillGapRequest(BaseModel):
    analysis_id: int


SkillPriority = Literal["High", "Medium", "Low"]


class MatchedSkillItem(BaseModel):
    skill: str
    category: str


class PartiallyMatchedSkillItem(BaseModel):
    skill: str
    reason: str


class MissingSkillItem(BaseModel):
    skill: str
    category: str
    priority: SkillPriority
    why_it_matters: str


class RoadmapPhase(BaseModel):
    phase_number: int
    phase_name: str
    duration: str
    goal: str
    topics: List[str]
    practice_tasks: List[str]
    mini_project: str
    expected_outcome: str


class SkillGapAnalysisSection(BaseModel):
    job_title: str
    company_name: str
    overall_match_score: int
    match_level: str  # overridden deterministically after validation - see skill_gap_service.py
    match_summary: str
    strengths: List[str]
    matched_skills: List[MatchedSkillItem]
    partially_matched_skills: List[PartiallyMatchedSkillItem]
    missing_skills: List[MissingSkillItem]
    bonus_skills: List[str]
    improvement_summary: str

    @field_validator("overall_match_score")
    @classmethod
    def score_in_range(cls, v):
        if not (0 <= v <= 100):
            raise ValueError(f"overall_match_score must be between 0 and 100, got {v}")
        return v


class LearningRoadmapSection(BaseModel):
    title: str
    estimated_duration: str
    goal: str
    phases: List[RoadmapPhase]
    final_outcome: str

    @field_validator("phases")
    @classmethod
    def exactly_four_phases(cls, v):
        if len(v) != 4:
            raise ValueError(f"Expected exactly 4 roadmap phases, got {len(v)}")
        return v


class SkillGapFullPayload(BaseModel):
    """Strict schema the raw Gemini JSON output is validated against."""
    skill_gap_analysis: SkillGapAnalysisSection
    learning_roadmap: LearningRoadmapSection


class SkillGapReportOut(BaseModel):
    id: int
    analysis_id: int
    skill_gap_analysis: dict
    learning_roadmap: dict
    created_at: datetime
    updated_at: Optional[datetime] = None


# ---------- Password Reset ----------
class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    message: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_min_length(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class ResetPasswordResponse(BaseModel):
    message: str