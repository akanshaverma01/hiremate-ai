import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import api from "../api/axios";
import LoadingSpinner from "../components/LoadingSpinner";
import { MessageSquare, Sparkles, RefreshCw, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { RecruiterAvatarIllustration, EmptyStateIllustration } from "../components/illustrations/Illustrations.jsx";

// Matches the recruiter_status values written by gemini_service.py's prompt
const STATUS_STYLES = {
  "High Match": "bg-emerald-50 text-emerald-800 border-emerald-200",
  "Medium Match": "bg-amber-50 text-amber-800 border-amber-200",
  "Low Match": "bg-rose-50 text-rose-700 border-rose-200",
};

// Matches schemas.SectionScores field names exactly
const SECTION_LABELS = {
  summary: "Summary",
  skills: "Skills",
  experience: "Experience",
  projects: "Projects",
  education: "Education",
  formatting: "Formatting",
};

export default function RecruiterFeedback() {
  // The route is /analysis/:id/recruiter-feedback - :id IS the analysis_id,
  // which already has the resume and job description linked on the backend.
  const { id } = useParams();
  const analysisId = Number(id);
  const location = useLocation();
  // Only auto-load existing feedback when arriving via a "View" link that
  // explicitly asks for it (there's currently no History browse-back entry
  // point for Recruiter Feedback specifically - see the History page notes -
  // so in practice this page always starts fresh for now; the flag is
  // handled the same way as Cover Letter / Skill Gap for consistency and so
  // a future History entry can opt in without another code change here).
  const viewExisting = Boolean(location.state?.viewExisting);

  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(viewExisting);
  const [error, setError] = useState("");

  useEffect(() => {
    setFeedback(null);
    setError("");

    if (!viewExisting) {
      setChecking(false);
      return;
    }

    let active = true;
    setChecking(true);
    api
      .get(`/api/ai/recruiter-feedback/${analysisId}`)
      .then((res) => { if (active) setFeedback(res.data); })
      .catch(() => {}) // 404 just means "not generated yet"
      .finally(() => { if (active) setChecking(false); });

    return () => { active = false; };
  }, [analysisId, viewExisting]);

  const handleGetFeedback = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/api/ai/recruiter-feedback", { analysis_id: analysisId });
      setFeedback(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to generate recruiter feedback.");
    } finally {
      setLoading(false);
    }
  };

  const sectionScores = feedback?.section_scores || {};

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <RecruiterAvatarIllustration className="w-11 h-11 flex-shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Recruiter Feedback
            </h1>
          </div>
          <p className="text-slate-500 text-sm">
            Get instant HR-level feedback and recommendations on your uploaded resume.
          </p>
        </div>

        {feedback && (
          <button
            onClick={handleGetFeedback}
            disabled={loading}
            className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            <span>New Feedback</span>
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {checking ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
          <LoadingSpinner label="Checking for existing feedback..." />
        </div>
      ) : !feedback ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6 text-center">
          <EmptyStateIllustration className="w-20 h-20 mx-auto text-violet-400" />
          <p className="text-sm text-slate-600">
            No recruiter feedback yet for this analysis. Generate it now.
          </p>
          <button
            onClick={handleGetFeedback}
            disabled={loading}
            className="w-full sm:w-auto mx-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold text-sm shadow-lg shadow-violet-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <LoadingSpinner label="Generating AI Recruiter Feedback..." />
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Get Recruiter Feedback</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Verdict */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-violet-600" />
                Recruiter Verdict
              </h3>
              <span
                className={`px-4 py-1.5 rounded-xl border font-bold text-sm ${
                  STATUS_STYLES[feedback.recruiter_status] || STATUS_STYLES["Medium Match"]
                }`}
              >
                {feedback.recruiter_status}
              </span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{feedback.overall_reason}</p>
            <div className="p-4 rounded-2xl bg-violet-50/60 border border-violet-100">
              <p className="text-xs font-bold text-violet-900 mb-1">
                Interview probability: {feedback.interview_probability}%
              </p>
              <p className="text-xs text-violet-800/90 leading-relaxed">
                {feedback.interview_probability_reason}
              </p>
            </div>
          </div>

          {/* Strengths & weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-3">
              <h4 className="font-bold text-emerald-800 text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Strengths
              </h4>
              <ul className="space-y-2">
                {feedback.strengths?.map((s, i) => (
                  <li key={i} className="text-xs text-slate-600 leading-relaxed flex gap-2">
                    <span className="text-emerald-500">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-3">
              <h4 className="font-bold text-rose-700 text-sm flex items-center gap-1.5">
                <XCircle className="w-4 h-4" /> Weaknesses
              </h4>
              <ul className="space-y-2">
                {feedback.weaknesses?.map((s, i) => (
                  <li key={i} className="text-xs text-slate-600 leading-relaxed flex gap-2">
                    <span className="text-rose-500">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Section scores */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-800 text-sm">Section Scores</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Object.entries(SECTION_LABELS).map(([key, label]) => (
                <div key={key} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <p className="text-lg font-extrabold text-violet-700">{sectionScores[key] ?? 0}</p>
                  <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Suggestions & keywords */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-3">
              <h4 className="font-bold text-slate-800 text-sm">Suggestions</h4>
              <ul className="space-y-2">
                {feedback.suggestions?.map((s, i) => (
                  <li key={i} className="text-xs text-slate-600 leading-relaxed flex gap-2">
                    <span className="text-violet-500">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-3">
              <h4 className="font-bold text-slate-800 text-sm">Missing Keywords</h4>
              <div className="flex flex-wrap gap-2">
                {feedback.missing_keywords?.map((k, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/60 text-[11px] font-semibold"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
