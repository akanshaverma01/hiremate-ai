import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import { generateInterviewPrep, getInterviewPrepHistory, getInterviewPrepSession } from "../services/interviewPrepApi";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import EmptyState from "../components/EmptyState.jsx";
import {
  MessageSquare,
  ArrowLeft,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Clock,
  AlertCircle,
  History as HistoryIcon,
} from "lucide-react";

const DIFFICULTY_BADGE = {
  Easy: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Medium: "bg-amber-50 text-amber-700 border-amber-100",
  Hard: "bg-rose-50 text-rose-700 border-rose-100",
};

function QuestionCard({ q }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
        <span className="px-2.5 py-0.5 rounded-lg bg-violet-50 text-violet-700 border border-violet-100">{q.skill}</span>
        <span className={`px-2.5 py-0.5 rounded-lg border ${DIFFICULTY_BADGE[q.difficulty] || DIFFICULTY_BADGE.Medium}`}>
          {q.difficulty}
        </span>
        <span className="text-slate-400 flex items-center gap-1">
          <Clock className="w-3 h-3" /> ~{q.estimated_time_minutes} min
        </span>
      </div>
      <p className="text-sm font-semibold text-slate-800 leading-relaxed">{q.question}</p>
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1 cursor-pointer"
      >
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        <span>{expanded ? "Hide interviewer notes" : "Show interviewer notes"}</span>
      </button>
      {expanded && (
        <div className="pt-2 border-t border-slate-200 space-y-2 animate-fade-in">
          <p className="text-xs text-slate-600 leading-relaxed">
            <span className="font-bold text-slate-700">Why this question: </span>
            {q.why_this_question}
          </p>
          {q.expected_topics?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {q.expected_topics.map((t) => (
                <span key={t} className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-600">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SkillTagGroup({ title, items, tone }) {
  const styles = {
    good: "bg-emerald-50 text-emerald-700 border-emerald-100",
    bad: "bg-rose-50 text-rose-700 border-rose-100",
    warn: "bg-amber-50 text-amber-700 border-amber-100",
  };
  return (
    <div className="space-y-2">
      <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</h5>
      <div className="flex flex-wrap gap-1.5">
        {items?.length ? (
          items.map((s) => (
            <span key={s} className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${styles[tone]}`}>
              {s}
            </span>
          ))
        ) : (
          <span className="text-xs text-slate-400">None</span>
        )}
      </div>
    </div>
  );
}

function groupByCategory(questions) {
  const groups = {};
  for (const q of questions) {
    if (!groups[q.category]) groups[q.category] = [];
    groups[q.category].push(q);
  }
  return groups;
}

export default function InterviewPrep() {
  const { id } = useParams(); // analysis_id
  const [analysis, setAnalysis] = useState(null);
  const [pastSessions, setPastSessions] = useState([]);
  const [role, setRole] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const loadContext = () => {
    setLoading(true);
    Promise.all([api.get(`/api/analysis/${id}`), getInterviewPrepHistory(id)])
      .then(([analysisRes, historyRes]) => {
        setAnalysis(analysisRes.data);
        setRole(analysisRes.data.job_title || "");
        setPastSessions(historyRes.data);
      })
      .catch(() => setError("Could not load this analysis."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleGenerate = async () => {
    setError("");
    setGenerating(true);
    try {
      const res = await generateInterviewPrep(Number(id), difficulty, role);
      setSession(res.data);
      const historyRes = await getInterviewPrepHistory(id);
      setPastSessions(historyRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to generate interview questions. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleViewPast = async (sessionId) => {
    setError("");
    try {
      const res = await getInterviewPrepSession(sessionId);
      setSession(res.data);
    } catch {
      setError("Could not load that session.");
    }
  };

  if (loading) return <LoadingSpinner label="Loading Interview Prep..." />;

  const grouped = session ? groupByCategory(session.questions) : {};

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-violet-100 text-violet-700">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              AI Interview Preparation
            </h1>
          </div>
          <p className="text-slate-500 text-sm">
            Personalized interview questions generated from your resume and this job description.
          </p>
        </div>
        <Link
          to={`/analysis/${id}`}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Analysis</span>
        </Link>
      </div>

      {analysis && (
        <div className="bg-white rounded-2xl px-5 py-3.5 border border-slate-100 shadow-sm flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-600">
          <span><span className="font-bold text-slate-800">Resume:</span> {analysis.resume_filename}</span>
          <span><span className="font-bold text-slate-800">Job Title:</span> {analysis.job_title}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium shadow-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Generate form */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-lg">Generate Questions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Target Role</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Backend Developer"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold text-xs shadow-sm hover:shadow-glow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Generate 12 Questions</span>
        </button>
      </div>

      {/* Past sessions */}
      {pastSessions.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <HistoryIcon className="w-4 h-4 text-slate-400" /> Previous Sessions
          </h3>
          <div className="flex flex-wrap gap-2">
            {pastSessions.map((s) => (
              <button
                key={s.id}
                onClick={() => handleViewPast(s.id)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-violet-100 hover:text-violet-700 text-slate-600 font-semibold text-xs transition-all cursor-pointer"
              >
                {s.role} ({s.difficulty}) · {new Date(s.created_at).toLocaleDateString()}
              </button>
            ))}
          </div>
        </div>
      )}

      {generating && (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
          <LoadingSpinner label="Analyzing your resume and generating interview questions..." />
        </div>
      )}

      {!generating && !session && pastSessions.length === 0 && (
        <EmptyState
          title="No interview prep yet"
          description="Generate a tailored set of interview questions above to get started."
        />
      )}

      {!generating && session && (
        <div className="space-y-6 animate-fade-in">
          {/* Candidate summary */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-800 text-lg">Candidate Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <SkillTagGroup title="Matched Skills" items={session.candidate_summary.matched_skills} tone="good" />
              <SkillTagGroup title="Missing Skills" items={session.candidate_summary.missing_skills} tone="bad" />
            </div>
            <p className="text-sm text-slate-600">
              <span className="font-bold text-slate-800">Experience Level:</span> {session.candidate_summary.experience_level}
            </p>
            <SkillTagGroup title="Focus Areas" items={session.candidate_summary.focus_areas} tone="warn" />
          </div>

          {/* Grouped questions */}
          {Object.entries(grouped).map(([category, questions]) => (
            <div key={category} className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-lg">{category}</h3>
              <div className="space-y-3">
                {questions.map((q) => (
                  <QuestionCard key={q.id} q={q} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
