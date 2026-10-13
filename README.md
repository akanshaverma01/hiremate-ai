# HireMate AI

**An AI-powered career platform** — upload a resume, match it against a job description, and get an ATS match score, recruiter-style feedback, a tailored cover letter, interview prep, a voice mock interview and a skill-gap roadmap, all in one place.

> Full-stack project: **FastAPI + PostgreSQL** backend, **React + Vite + Tailwind** frontend, **Google Gemini** for the AI features.

<!-- Add 3-4 screenshots here once the repo is live, e.g.
![Dashboard](docs/screenshots/dashboard.png)
![Analysis report](docs/screenshots/analysis.png)
-->

---

## Features

| Feature | What it does |
|---|---|
| **ATS Resume Analysis** | Upload a PDF/DOCX resume and pair it with a job description. Get an ATS match score, matched / missing / recommended skills, improvement suggestions and a downloadable **PDF report**. Shows the score change versus your previous analysis. |
| **AI Recruiter Feedback** | Recruiter-style verdict: strengths, weaknesses, section scores, missing keywords, interview-probability estimate. |
| **AI Resume Copilot** | Improves individual resume sections (summary, experience, skills…) with before/after comparison and tips. |
| **Cover Letter Generator** | Generates a cover letter tailored to the analysed resume and job description, with copy and regenerate. |
| **Interview Prep** | Generates a question set (by category and difficulty) from your resume + job description, with interviewer notes. |
| **AI Mock Interview** | Answer by voice (browser microphone → transcription), get per-answer evaluation, and a final performance report. You can end a session early and still get a report. |
| **Skill Gap & Roadmap** | Match score, matched / partially matched / missing skills with priority, plus a phased learning roadmap. |
| **History & Search** | Past analyses, Copilot generations, cover letters, skill-gap reports and mock interviews, with a search box. |
| **Accounts** | Sign up / log in (JWT), password reset by email link. |
| **UI** | Dark premium theme (light mode available), responsive layout. |

## How the ATS score works

The **ATS Match score** is a TF-IDF **cosine similarity** between the full resume text and the full job-description text (scikit-learn). It measures overall wording overlap, so it is an **indicative** score and can differ from what commercial ATS tools report.

**Matched / missing skills** are computed separately by comparing both texts against a skills dictionary. It is normal for a resume to match most listed skills and still get a modest overall score if the rest of the wording differs — the UI shows the two numbers separately for that reason.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, React Router 6, Tailwind CSS 3, Axios, Lucide icons |
| Backend | FastAPI, SQLAlchemy 2, Pydantic 2, Uvicorn |
| Database | PostgreSQL (psycopg 3) |
| Auth | JWT (python-jose), bcrypt password hashing |
| NLP / scoring | scikit-learn (TF-IDF), NLTK, pandas, NumPy |
| File parsing / reports | pdfplumber, python-docx, ReportLab (PDF reports) |
| AI | Google Gemini API |

## Project structure

```
HireMate-AI/
├── README.md
├── .gitignore
├── backend/
│   ├── .env.example
│   ├── requirements.txt
│   └── app/
│       ├── main.py             # FastAPI app, CORS, router registration
│       ├── config.py           # settings loaded from environment variables
│       ├── database.py         # SQLAlchemy engine / session
│       ├── models.py           # database tables
│       ├── schemas.py          # Pydantic request/response models
│       ├── auth.py             # JWT + current-user dependency
│       ├── routers/            # one router per feature (auth, analysis, cover-letter, ...)
│       ├── services/           # Gemini calls and feature logic
│       │   └── interview/      # mock interview: questions, transcription, evaluation, report
│       ├── ml/                 # ATS scorer, text processing, skills dictionary
│       └── utils/              # resume text extraction
└── frontend/
    ├── .env.example
    ├── package.json
    ├── tailwind.config.js
    └── src/
        ├── App.jsx             # routes
        ├── pages/              # Dashboard, UploadResume, AnalysisResult, History, ...
        ├── components/         # shared UI (SkillsPanel, ScoreCard, EmptyState, ...)
        ├── layouts/            # AppShell, Sidebar, Topbar, Footer
        ├── context/            # Auth and Theme providers
        ├── hooks/              # useInterview, useFormPersist
        ├── services/           # API wrappers
        ├── api/axios.js        # Axios instance (base URL + auth header)
        └── styles/             # global.css, theme.css, tailwind.css
```

## Getting started (local)

### Prerequisites
- **Python 3.10+** (`requirements.txt` was verified with a clean install on Python 3.12)
- **Node.js 18+**
- **PostgreSQL** running locally
- A **Gemini API key** from [Google AI Studio](https://aistudio.google.com/app/apikey) (needed for all AI features; the ATS analysis itself works without it)

### 1. Database
```sql
CREATE USER ats_user WITH PASSWORD 'ats_password';
CREATE DATABASE ats_resume_db OWNER ats_user;
```
Tables are created automatically on first backend start (`Base.metadata.create_all`).

### 2. Backend
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt

# create your own .env from the template, then fill in the values
cp .env.example .env        # Windows: copy .env.example .env

uvicorn app.main:app --reload --port 8000
```
- API: http://localhost:8000  ·  Interactive docs (Swagger): http://localhost:8000/docs
- On the first run NLTK downloads a few small language packages, so an internet connection is needed once.

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env        # Windows: copy .env.example .env
npm run dev
```
App: http://localhost:5173

## Environment variables

### Backend — `backend/.env`
| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | `postgresql+psycopg://user:password@host:5432/dbname`. A plain `postgresql://` or `postgres://` URL (what most hosts hand out) is converted to the psycopg 3 driver automatically in `config.py`. |
| `SECRET_KEY` | yes | Long random string used to sign JWTs. Generate: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `ALGORITHM` | no | JWT algorithm (default `HS256`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | no | Token lifetime (default `60`) |
| `UPLOAD_DIR` | no | Where uploaded resumes are stored (default `uploads`) |
| `FRONTEND_ORIGIN` | yes | Exact URL of the frontend, used for CORS (default `http://localhost:5173`) |
| `GEMINI_API_KEY` | for AI features | Google Gemini API key |
| `GEMINI_MODEL` | recommended | Gemini model id, e.g. `gemini-3.6-flash`. Set it explicitly so a retired default never matters. |
| `RESET_TOKEN_EXPIRE_MINUTES` | no | Password-reset link lifetime (default `30`) |
| `SMTP_HOST` `SMTP_PORT` `SMTP_USER` `SMTP_PASSWORD` `SMTP_FROM_EMAIL` | no | Email sending for password reset. If left blank, the reset link is printed in the backend console instead of being emailed. |

### Frontend — `frontend/.env`
| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend base URL (default `http://localhost:8000`) |

> `.env` files hold secrets and are **never committed** — only the `.env.example` templates are.

## API overview

Every route is under `/api` and (except auth) requires a `Bearer` token. Full request/response schemas are in Swagger at `/docs`.

| Prefix | Purpose |
|---|---|
| `/api/auth` | signup, login, password reset |
| `/api/resumes` | upload / list / delete resumes |
| `/api/job-descriptions` | saved job descriptions |
| `/api/analysis` | run and fetch ATS analyses, history |
| `/api/report` | PDF report download |
| `/api/ai` | recruiter feedback |
| `/api/copilot` | resume section improvement |
| `/api/cover-letter` | generate / regenerate / history |
| `/api/interview-prep` | interview question sets |
| `/api/interview` | mock interview (start, transcribe, evaluate, finish, history) |
| `/api/skill-gap` | skill-gap report and roadmap |

All data is scoped to the logged-in user on the server side.

## Known limitations

- **Gemini free-tier quota.** The free tier has a small daily request limit. When it is exhausted the AI features return a "temporarily busy" error (HTTP 503) until the quota resets or billing is enabled.
- **Resume parsing.** Text-based PDFs and `.docx` work best. Scanned/image-only PDFs can't be read, and legacy binary `.doc` files are not reliably supported.
- **Google sign-in** is a UI placeholder (button disabled) — not connected to a backend.
- **Notifications** (bell icon) is a UI placeholder.
- **Database migrations.** Tables are created with `create_all` on startup; there is no migration tool yet, so schema changes to an existing database need to be applied manually.
- **File storage.** Uploaded resumes are stored on the local disk (`UPLOAD_DIR`). On hosts with an ephemeral filesystem they disappear on redeploy.
- **CORS** allows a single frontend origin (`FRONTEND_ORIGIN`).

## Deployment

Deployment guide — coming soon.

## Ideas / roadmap

- Alembic migrations
- Cloud object storage for uploaded resumes
- Google OAuth sign-in
- Automated tests (backend + frontend)
- Recruiter-feedback history list endpoint

## License

Add a license of your choice (e.g. MIT) before making the repository public.
