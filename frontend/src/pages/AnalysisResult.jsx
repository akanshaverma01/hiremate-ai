import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import ScoreCard from "../components/ScoreCard.jsx";
import SkillsPanel from "../components/SkillsPanel.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { ResumeAIIllustration } from "../components/illustrations/Illustrations.jsx";
import {
  Download,
  FileCode,
  Mic,
  BarChart2,
  RefreshCw,
  Sparkles,
  Lightbulb,
  FileCheck2,
  Calendar,
  FileText,
  UserCheck,
  MessageSquare,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ListChecks,
  Layers,
  CheckCircle2,
  Info
} from "lucide-react";

const SCORE_TIER = (score) =>
  score >= 70
    ? { label: "Good Match", icon: ShieldCheck, tone: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25" }
    : score >= 40
    ? { label: "Needs Improvement", icon: TrendingUp, tone: "text-amber-400 bg-amber-500/10 border-amber-500/25" }
    : { label: "Weak Match", icon: AlertTriangle, tone: "text-rose-400 bg-rose-500/10 border-rose-500/25" };

function toList(str) {
  if (!str) return [];
  return str.split(",").map((s) => s.trim()).filter(Boolean);
}

// The backend returns `suggestions` as one or two sentences joined by a
// space (see ats_scorer.generate_suggestions) rather than a numbered/
// newline-delimited list, so this is a presentation-only split - it turns
// those sentences into separate bullets without inventing structure the
// data doesn't actually have.
function splitSuggestions(text) {
  if (!text) return [];
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function AnalysisResult() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  // Score delta vs. the most recent earlier analysis, read from the
  // already-existing history endpoint - not a new backend field, and stays
  // null (hidden) rather than showing a made-up number when there's no
  // earlier analysis to compare against.
  const [scoreDelta, setScoreDelta] = useState(null);

  useEffect(() => {
    setResult(null);
    setError("");
    setScoreDelta(null);
    api
      .get(`/api/analysis/${id}`)
      .then((res) => setResult(res.data))
      .catch(() => setError("Could not load this analysis result."));
  }, [id]);

  // Separate effect: once `result` is loaded, compute the trend against the
  // closest earlier analysis in history (if any).
  useEffect(() => {
    if (!result) return;
    let active = true;
    api
      .get("/api/analysis/history")
      .then((res) => {
        if (!active) return;
        const prior = (res.data || [])
          .filter((h) => h.id !== result.id && new Date(h.created_at) < new Date(result.created_at))
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
        setScoreDelta(prior ? Math.round(result.ats_score - prior.ats_score) : null);
      })
      .catch(() => setScoreDelta(null));
    return () => { active = false; };
  }, [result]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await api.get(`/api/report/${id}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `analysis_${id}_report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      setError("Failed to download report.");
    } finally {
      setDownloading(false);
    }
  };

  if (error)
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl font-medium">
          {error}
        </div>
      </div>
    );

  if (!result) return <LoadingSpinner label="Loading analysis result..." />;

  const tier = SCORE_TIER(result.ats_score);
  const TierIcon = tier.icon;
  const matchedCount = toList(result.matched_skills).length;
  const missingCount = toList(result.missing_skills).length;
  const totalCount = matchedCount + missingCount;
  const suggestionPoints = splitSuggestions(result.suggestions);

  // Missing skills the AI separately flagged as "recommended to add first"
  // are shown as higher priority - both fields already exist on the
  // analysis response, this just cross-references them.
  const recommendedLower = toList(result.recommended_skills).map((s) => s.toLowerCase());
  const missingWithPriority = toList(result.missing_skills).map((skill) => ({
    skill,
    important: recommendedLower.includes(skill.toLowerCase()),
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header - gradient banner with a resume+score illustration, consistent with the Dashboard hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-purple via-brand-indigo to-brand-blue text-white p-6 md:p-8 shadow-glow animate-slide-up">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "22px 22px" }}
        />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 backdrop-blur-sm text-white text-xs font-semibold">
                <FileCheck2 className="w-3.5 h-3.5" /> Resume Analysis Report
              </div>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="lg:hidden px-4 py-2 rounded-xl bg-white text-brand-purple font-bold text-xs transition-all shadow-lg hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{downloading ? "Preparing..." : "Download"}</span>
              </button>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight capitalize">{result.job_title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-white/75">
              <span className="flex items-center gap-1.5 font-medium text-white/90">
                <FileText className="w-3.5 h-3.5" /> {result.resume_filename}
              </span>
              <span className="text-white/40">•</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(result.created_at).toLocaleString()}
              </span>
            </div>

            <div className="inline-flex items-start gap-2 px-3.5 py-2.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm text-xs text-white/90 leading-relaxed max-w-xl">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 flex-shrink-0 mt-0.5" />
              <span>Your resume has been analyzed. Explore your ATS score, matched skills and improvement areas below.</span>
            </div>

            <button
              onClick={handleDownload}
              disabled={downloading}
              className="hidden lg:flex mt-1 px-5 py-3 rounded-2xl bg-white text-brand-purple font-bold text-sm transition-all shadow-lg hover:-translate-y-0.5 hover:shadow-xl active:scale-95 items-center justify-center gap-2 cursor-pointer disabled:opacity-50 w-fit"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? "Preparing PDF..." : "Download Report"}</span>
            </button>
          </div>

          <div className="hidden md:block flex-shrink-0 w-56 lg:w-64">
            <ResumeAIIllustration className="w-full h-auto" score={result.ats_score} />
          </div>
        </div>
      </div>

      {/* Grid: Score & Skills Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: "80ms" }}>
        {/* ATS Score Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col items-center text-center gap-1">
          <div className="w-full flex items-center justify-between mb-1">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              ATS Score
              <span
                tabIndex={0}
                title="This ATS Match Score is an indicative resume-to-job-description matching score based on HireMate AI's own matching logic. It's meant as a directional guide and may differ from the score other ATS platforms report."
                className="text-slate-400 hover:text-violet-400 focus:text-violet-400 transition-colors cursor-help outline-none"
              >
                <Info className="w-3.5 h-3.5" />
              </span>
            </h3>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold ${tier.tone}`}>
              <TierIcon className="w-3 h-3" />
              {tier.label}
            </div>
          </div>

          <ScoreCard score={result.ats_score} suffix="%" subtitle="ATS Match" />

          {scoreDelta !== null && (
            <div
              className={`flex items-center gap-1 text-xs font-bold ${
                scoreDelta >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {scoreDelta >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {scoreDelta >= 0 ? "+" : ""}
              {scoreDelta}% vs previous analysis
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 pt-4 mt-3 border-t border-slate-100 w-full">
            <div className="rounded-xl bg-emerald-500/8 border border-emerald-500/15 py-2.5 px-1 space-y-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
              <p className="text-sm font-extrabold text-slate-800 whitespace-nowrap">
                {matchedCount}/{totalCount}
                {totalCount > 0 && (
                  <span className="text-[10px] font-bold text-emerald-400"> ({Math.round((matchedCount / totalCount) * 100)}%)</span>
                )}
              </p>
              <p className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wide leading-tight">Matched Skills</p>
            </div>
            <div className="rounded-xl bg-rose-500/8 border border-rose-500/15 py-2.5 px-1 space-y-0.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 mx-auto" />
              <p className="text-base font-extrabold text-slate-800">{missingCount}</p>
              <p className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wide leading-tight">Missing</p>
            </div>
            <div className="rounded-xl bg-violet-500/8 border border-violet-500/15 py-2.5 px-1 space-y-0.5">
              <Layers className="w-3.5 h-3.5 text-violet-400 mx-auto" />
              <p className="text-base font-extrabold text-slate-800">{totalCount}</p>
              <p className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wide leading-tight">Total</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 pt-2">
            Skill match % is separate from your overall ATS score above.
          </p>
        </div>

        {/* Skills Analysis Panel - tabbed */}
        <div className="lg:col-span-2">
          <SkillsPanel matchedSkills={result.matched_skills} missingSkills={result.missing_skills} />
        </div>
      </div>

      {/* Missing / Needs Improvement + Next Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: "140ms" }}>
        {/* Missing / Needs Improvement */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Missing / Needs Improvement</h3>
          </div>
          {missingWithPriority.length > 0 ? (
            <div className="space-y-2.5">
              {missingWithPriority.map(({ skill, important }) => (
                <div
                  key={skill}
                  className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50/60 border border-slate-100 hover:border-rose-200 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-700 text-sm capitalize">{skill}</span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md flex-shrink-0 ${
                          important ? "bg-rose-500/15 text-rose-300" : "bg-slate-200/60 text-slate-500"
                        }`}
                      >
                        {important ? "Important" : "Nice to have"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      Consider gaining hands-on experience with {skill} through a project or certification.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic py-4 text-center">No missing skills - great coverage!</p>
          )}
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Next Steps</h3>
          </div>
          {suggestionPoints.length > 0 ? (
            <ul className="space-y-2.5">
              {suggestionPoints.map((point, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-sm text-slate-600 leading-relaxed bg-slate-50/60 p-3.5 rounded-2xl border border-slate-100"
                >
                  <ListChecks className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500 italic py-4 text-center">No suggestions available for this analysis.</p>
          )}
        </div>
      </div>

      {/* Quick Action Hub */}
      <div className="space-y-4 animate-slide-up" style={{ animationDelay: "200ms" }}>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
          Recommended Next Steps
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to={`/analysis/${id}/recruiter-feedback`}
            className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-violet-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 text-sm group-hover:text-violet-600 transition-colors">
                AI Recruiter Feedback
              </h4>
              <p className="text-xs text-slate-400 mt-1">Get initial recruiter thoughts</p>
            </div>
          </Link>

          <Link
            to={`/copilot/${id}`}
            className="p-5 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/10 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">
                AI Resume Copilot
              </h4>
              <p className="text-xs text-violet-100/80 mt-1">Refine and rewrite sections</p>
            </div>
          </Link>

          <Link
            to={`/analysis/${id}/cover-letter`}
            className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-violet-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 text-sm group-hover:text-violet-600 transition-colors">
                Generate Cover Letter
              </h4>
              <p className="text-xs text-slate-400 mt-1">Tailored for this role</p>
            </div>
          </Link>

          <Link
            to={`/analysis/${id}/interview-prep`}
            className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-violet-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 text-sm group-hover:text-violet-600 transition-colors">
                AI Interview Prep
              </h4>
              <p className="text-xs text-slate-400 mt-1">Practice interview questions</p>
            </div>
          </Link>

          <Link
            to={`/interview/mock?analysis_id=${id}`}
            className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-violet-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 text-sm group-hover:text-violet-600 transition-colors">
                Practice with Voice
              </h4>
              <p className="text-xs text-slate-400 mt-1">Interactive mock interview</p>
            </div>
          </Link>

          <Link
            to={`/analysis/${id}/skill-gap`}
            className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-violet-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 text-sm group-hover:text-violet-600 transition-colors">
                Skill Gap & Roadmap
              </h4>
              <p className="text-xs text-slate-400 mt-1">Custom learning path</p>
            </div>
          </Link>
        </div>

        <div className="pt-4 flex justify-center">
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Run Another Analysis</span>
          </Link>
        </div>
      </div>
    </div>
  );
}