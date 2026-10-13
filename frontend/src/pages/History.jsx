import { useEffect, useState, useMemo, Fragment } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { getInterviewHistory } from "../services/interviewService";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import EmptyState from "../components/EmptyState.jsx";
import {
  History as HistoryIcon,
  Sparkles,
  Mic,
  FileText,
  Copy,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  UserCheck,
  FileCode,
  BarChart2,
  AlertCircle,
  Clock,
  Award,
  Calendar,
  Check,
  Search,
  X
} from "lucide-react";

function formatDuration(startedAt, completedAt) {
  if (!completedAt) return "—";
  const ms = new Date(completedAt) - new Date(startedAt);
  const minutes = Math.round(ms / 60000);
  return `${minutes} min`;
}

function truncate(text, len = 60) {
  if (!text) return "—";
  return text.length > len ? text.slice(0, len) + "..." : text;
}

function copilotPreview(row) {
  if (row.section === "skills" || row.section === "grammar") {
    try {
      const parsed = JSON.parse(row.improved_text);
      return Object.entries(parsed)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
        .join(" | ");
    } catch {
      return row.improved_text || "—";
    }
  }
  return row.improved_text;
}

export default function History() {
  const [history, setHistory] = useState([]);
  const [copilotHistory, setCopilotHistory] = useState([]);
  const [interviewHistory, setInterviewHistory] = useState([]);
  // These two already existed as backend endpoints (/api/cover-letter/history,
  // /api/skill-gap/history) but this page never called them, so there was no
  // way to look back at a past cover letter or skill gap report once you'd
  // navigated away - see the "View" links in the new sections below.
  const [coverLetterHistory, setCoverLetterHistory] = useState([]);
  const [skillGapHistory, setSkillGapHistory] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  // Driven by the Topbar search box (?q=... in the URL) - filters the lists
  // already loaded on this page client-side. There's no dedicated search
  // API, so this reuses the same /history endpoints every other section on
  // this page already calls rather than adding a new backend endpoint.
  const [searchParams, setSearchParams] = useSearchParams();
  const query = (searchParams.get("q") || "").trim().toLowerCase();

  const filteredHistory = useMemo(() => {
    if (!query) return history;
    return history.filter(
      (h) =>
        (h.resume_filename || "").toLowerCase().includes(query) ||
        (h.job_title || "").toLowerCase().includes(query)
    );
  }, [history, query]);

  const filteredCopilotHistory = useMemo(() => {
    if (!query) return copilotHistory;
    return copilotHistory.filter(
      (row) =>
        (row.section || "").toLowerCase().includes(query) ||
        (row.original_text || "").toLowerCase().includes(query) ||
        (row.improved_text || "").toLowerCase().includes(query)
    );
  }, [copilotHistory, query]);

  const filteredInterviewHistory = useMemo(() => {
    if (!query) return interviewHistory;
    return interviewHistory.filter(
      (session) =>
        (session.role || "").toLowerCase().includes(query) ||
        (session.level || "").toLowerCase().includes(query)
    );
  }, [interviewHistory, query]);

  const filteredCoverLetterHistory = useMemo(() => {
    if (!query) return coverLetterHistory;
    return coverLetterHistory.filter(
      (cl) =>
        (cl.role_name || "").toLowerCase().includes(query) ||
        (cl.company_name || "").toLowerCase().includes(query)
    );
  }, [coverLetterHistory, query]);

  const filteredSkillGapHistory = useMemo(() => {
    if (!query) return skillGapHistory;
    return skillGapHistory.filter((sg) =>
      (sg.skill_gap_analysis?.job_title || "").toLowerCase().includes(query)
    );
  }, [skillGapHistory, query]);

  const totalMatches =
    filteredHistory.length +
    filteredCopilotHistory.length +
    filteredInterviewHistory.length +
    filteredCoverLetterHistory.length +
    filteredSkillGapHistory.length;

  useEffect(() => {
    Promise.all([
      api.get("/api/analysis/history"),
      api.get("/api/copilot/history").catch(() => ({ data: [] })),
      getInterviewHistory().catch(() => ({ data: [] })),
      api.get("/api/cover-letter/history").catch(() => ({ data: [] })),
      api.get("/api/skill-gap/history").catch(() => ({ data: [] })),
    ])
      .then(([analysisRes, copilotRes, interviewRes, coverLetterRes, skillGapRes]) => {
        setHistory(analysisRes.data);
        setCopilotHistory(copilotRes.data);
        setInterviewHistory(interviewRes.data);
        setCoverLetterHistory(coverLetterRes.data);
        setSkillGapHistory(skillGapRes.data);
      })
      .catch(() => setError("Could not load analysis history."))
      .finally(() => setLoading(false));
  }, []);

  const handleCopyAgain = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) return <LoadingSpinner label="Loading history..." />;

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-12">
      {/* Hero Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 p-8 text-white shadow-xl">
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-violet-100 text-xs font-semibold uppercase tracking-wider">
            <HistoryIcon className="w-3.5 h-3.5" /> Saved Records
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Activity & History Log
          </h1>
          <p className="text-violet-100 text-sm sm:text-base opacity-90">
            Access your past resume analyses, Copilot generations, and mock interview performances.
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Search results banner - only shown when arriving via the Topbar search */}
      {query && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-violet-50 border border-violet-100 text-sm animate-fade-in">
          <span className="flex items-center gap-2 text-violet-700 font-medium">
            <Search className="w-4 h-4 flex-shrink-0" />
            Showing {totalMatches} result{totalMatches === 1 ? "" : "s"} for "<strong>{searchParams.get("q")}</strong>"
          </span>
          <button
            onClick={() => setSearchParams({})}
            className="flex items-center gap-1 text-violet-500 hover:text-violet-700 font-semibold text-xs flex-shrink-0 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* SECTION 1: Resume Analysis History */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Resume Analyses</h2>
          </div>
          <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
            {filteredHistory.length} Saved
          </span>
        </div>

        {filteredHistory.length === 0 ? (
          query ? (
            <p className="text-sm text-slate-400 italic py-6 text-center">No resume analyses match "{query}".</p>
          ) :
          <EmptyState
            title="No resume analyses yet"
            description="Upload a resume and pair it with a job description to get your first ATS match score."
            ctaLabel="Run Your First Analysis"
            ctaTo="/upload"
          />
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-6">Resume</th>
                    <th className="py-4 px-6">Target Role</th>
                    <th className="py-4 px-6">ATS Score</th>
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6 text-right">Quick Links</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {filteredHistory.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-medium text-slate-900 max-w-[180px] truncate">
                        {h.resume_filename}
                      </td>
                      <td className="py-4 px-6 font-semibold text-violet-700 max-w-[180px] truncate">
                        {h.job_title}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            h.ats_score >= 70
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : h.ats_score >= 40
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {h.ats_score}%
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-400">
                        {new Date(h.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Link
                            to={`/analysis/${h.id}`}
                            className="p-2 rounded-xl hover:bg-violet-50 text-violet-600 transition-colors"
                            title="View Analysis"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/analysis/${h.id}/recruiter-feedback`}
                            className="p-2 rounded-xl hover:bg-violet-50 text-violet-600 transition-colors"
                            title="AI Recruiter Feedback"
                          >
                            <UserCheck className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/analysis/${h.id}/cover-letter`}
                            className="p-2 rounded-xl hover:bg-violet-50 text-violet-600 transition-colors"
                            title="Cover Letter"
                          >
                            <FileCode className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/analysis/${h.id}/skill-gap`}
                            className="p-2 rounded-xl hover:bg-violet-50 text-violet-600 transition-colors"
                            title="Skill Gap Roadmap"
                          >
                            <BarChart2 className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 2: AI Copilot History */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Copilot Generations</h2>
          </div>
          <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
            {filteredCopilotHistory.length} Saved
          </span>
        </div>

        {filteredCopilotHistory.length === 0 ? (
          query ? (
            <p className="text-sm text-slate-400 italic py-6 text-center">No Copilot generations match "{query}".</p>
          ) :
          <EmptyState
            title="No Copilot generations yet"
            description="Improve your summary, experience, and skills section-by-section with AI."
            ctaLabel="Try AI Resume Copilot"
            ctaTo="/copilot"
          />
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6">Section</th>
                    <th className="py-4 px-6">Original</th>
                    <th className="py-4 px-6">Improved AI Output</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {filteredCopilotHistory.map((row) => (
                    <Fragment key={row.id}>
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 text-xs text-slate-400 whitespace-nowrap">
                          {new Date(row.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6 font-semibold capitalize text-indigo-600">
                          {row.section}
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-500 max-w-[150px] truncate">
                          {truncate(row.original_text)}
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-800 font-medium max-w-[220px] truncate">
                          {truncate(copilotPreview(row))}
                        </td>
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors flex items-center gap-1"
                            >
                              {expandedId === row.id ? (
                                <><span>Hide</span><ChevronUp className="w-3.5 h-3.5" /></>
                              ) : (
                                <><span>View</span><ChevronDown className="w-3.5 h-3.5" /></>
                              )}
                            </button>
                            <button
                              onClick={() => handleCopyAgain(row.improved_text, row.id)}
                              className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium text-xs transition-colors flex items-center gap-1"
                            >
                              {copiedId === row.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-600">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedId === row.id && (
                        <tr>
                          <td colSpan={5} className="p-4 bg-slate-50/80 border-t border-slate-100">
                            <pre className="text-xs text-slate-800 font-mono bg-white p-4 rounded-2xl border border-slate-200 whitespace-pre-wrap leading-relaxed shadow-inner">
                              {copilotPreview(row)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* SECTION: Cover Letter History - re-opens the Cover Letter page for
          that specific analysis with viewExisting so the saved letter shows
          immediately; the sidebar's own "Cover Letter Generator" link never
          passes that flag, so it always starts fresh. */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Cover Letters</h2>
          </div>
          <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
            {filteredCoverLetterHistory.length} Saved
          </span>
        </div>

        {filteredCoverLetterHistory.length === 0 ? (
          query ? (
            <p className="text-sm text-slate-400 italic py-6 text-center">No cover letters match "{query}".</p>
          ) : (
            <p className="text-sm text-slate-400 italic py-6 text-center">No cover letters generated yet.</p>
          )
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-6">Role</th>
                    <th className="py-4 px-6">Company</th>
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6 text-right">Quick Links</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {filteredCoverLetterHistory.map((cl) => (
                    <tr key={cl.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-semibold text-violet-700 max-w-[200px] truncate">
                        {cl.role_name || "—"}
                      </td>
                      <td className="py-4 px-6 text-slate-600 max-w-[200px] truncate">
                        {cl.company_name || "—"}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-400">
                        {new Date(cl.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link
                          to={`/analysis/${cl.analysis_id}/cover-letter`}
                          state={{ viewExisting: true }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-violet-50 text-violet-600 font-medium text-xs transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* SECTION: Skill Gap History - same viewExisting pattern as Cover Letters above. */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
              <BarChart2 className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Skill Gap Reports</h2>
          </div>
          <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
            {filteredSkillGapHistory.length} Saved
          </span>
        </div>

        {filteredSkillGapHistory.length === 0 ? (
          query ? (
            <p className="text-sm text-slate-400 italic py-6 text-center">No skill gap reports match "{query}".</p>
          ) : (
            <p className="text-sm text-slate-400 italic py-6 text-center">No skill gap reports generated yet.</p>
          )
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-6">Target Role</th>
                    <th className="py-4 px-6">Match Score</th>
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6 text-right">Quick Links</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {filteredSkillGapHistory.map((sg) => (
                    <tr key={sg.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-semibold text-violet-700 max-w-[200px] truncate">
                        {sg.skill_gap_analysis?.job_title || "—"}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200">
                          {sg.skill_gap_analysis?.overall_match_score ?? "—"}%
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-400">
                        {new Date(sg.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link
                          to={`/analysis/${sg.analysis_id}/skill-gap`}
                          state={{ viewExisting: true }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-violet-50 text-violet-600 font-medium text-xs transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 3: Interview History */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Mic className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Mock Interviews</h2>
          </div>
          <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
            {filteredInterviewHistory.length} Sessions
          </span>
        </div>

        {filteredInterviewHistory.length === 0 ? (
          query ? (
            <p className="text-sm text-slate-400 italic py-6 text-center col-span-full">No mock interviews match "{query}".</p>
          ) :
          <EmptyState
            title="No mock interviews yet"
            description="Practice with voice and get AI-scored feedback on every answer."
            ctaLabel="Start Your First Mock Interview"
            ctaTo="/interview/mock"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredInterviewHistory.map((session) => (
              <Link
                key={session.id}
                to={session.completed_at ? `/interview/report/${session.id}` : "/interview/mock"}
                className="p-5 rounded-3xl bg-white border border-slate-100 shadow-sm hover:border-violet-300 hover:shadow-md transition-all group flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-base group-hover:text-violet-600 transition-colors truncate">
                      {session.role}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 text-xs font-semibold capitalize">
                      {session.level}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(session.started_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">Score</span>
                    <strong className="text-slate-800 text-sm font-bold">
                      {session.overall_score !== null ? `${Math.round(session.overall_score)}%` : "N/A"}
                    </strong>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">Questions</span>
                    <strong className="text-slate-800 text-sm font-bold">
                      {session.total_questions}
                    </strong>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">Duration</span>
                    <strong className="text-slate-800 text-sm font-bold">
                      {formatDuration(session.started_at, session.completed_at)}
                    </strong>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}