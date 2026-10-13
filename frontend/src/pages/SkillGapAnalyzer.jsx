import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import api from "../api/axios";
import LoadingSpinner from "../components/LoadingSpinner";
import { EmptyStateIllustration } from "../components/illustrations/Illustrations.jsx";
import { Compass, Sparkles, AlertCircle, RefreshCw, CheckCircle2, TrendingUp } from "lucide-react";

// Matches schemas.SkillPriority = Literal["High", "Medium", "Low"]
const PRIORITY_STYLES = {
  High: "bg-rose-50 text-rose-700 border-rose-200/60",
  Medium: "bg-amber-50 text-amber-800 border-amber-200/60",
  Low: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function SkillGapAnalyzer() {
  // The route is /analysis/:id/skill-gap - :id IS the analysis_id, which
  // already has the resume and job description linked on the backend.
  const { id } = useParams();
  const analysisId = Number(id);
  const location = useLocation();
  // Only auto-load an existing report when arriving via the "View" link on
  // the History page. The sidebar's "Skill Gap & Roadmap" link always starts
  // fresh at the Analyze screen, even for an analysis that already has a
  // saved report.
  const viewExisting = Boolean(location.state?.viewExisting);

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(viewExisting);
  const [error, setError] = useState("");

  useEffect(() => {
    setReport(null);
    setError("");

    if (!viewExisting) {
      setChecking(false);
      return;
    }

    let active = true;
    setChecking(true);
    api
      .get(`/api/skill-gap/${analysisId}`)
      .then((res) => { if (active) setReport(res.data); })
      .catch(() => {}) // 404 just means "not generated yet"
      .finally(() => { if (active) setChecking(false); });

    return () => { active = false; };
  }, [analysisId, viewExisting]);

  const runAnalysis = async (endpoint) => {
    setError("");
    setLoading(true);
    try {
      const res = await api.post(endpoint, { analysis_id: analysisId });
      setReport(res.data);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : detail?.message || "Failed to analyze skill gap.");
    } finally {
      setLoading(false);
    }
  };

  const skillGap = report?.skill_gap_analysis;
  const roadmap = report?.learning_roadmap;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-violet-100 text-violet-700">
              <Compass className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Skill Gap &amp; Career Roadmap
            </h1>
          </div>
          <p className="text-slate-500 text-sm">
            Discover missing skills and get an AI-generated step-by-step career roadmap.
          </p>
        </div>

        {report && (
          <button
            onClick={() => runAnalysis("/api/skill-gap/regenerate")}
            disabled={loading}
            className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Re-analyze</span>
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
          <LoadingSpinner label="Checking for an existing report..." />
        </div>
      ) : !report ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6 text-center">
          <EmptyStateIllustration className="w-20 h-20 mx-auto text-violet-400" />
          <p className="text-sm text-slate-600">
            No skill gap report yet for this analysis. Generate one now.
          </p>
          <button
            onClick={() => runAnalysis("/api/skill-gap/generate")}
            disabled={loading}
            className="w-full sm:w-auto mx-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold text-sm shadow-lg shadow-violet-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <LoadingSpinner label="Analyzing Skill Gaps..." />
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Analyze Skill Gap</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Overall match */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-violet-600" />
                {skillGap?.job_title || "Match Overview"}
                {skillGap?.company_name ? ` · ${skillGap.company_name}` : ""}
              </h3>
              <span className="px-4 py-1.5 rounded-xl bg-violet-600 text-white font-bold text-sm">
                {skillGap?.overall_match_score ?? 0}% · {skillGap?.match_level}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-600 to-purple-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(0, skillGap?.overall_match_score ?? 0))}%` }}
              />
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{skillGap?.match_summary}</p>
          </div>

          {/* Matched skills */}
          {skillGap?.matched_skills?.length > 0 && (
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Matched Skills
              </h3>
              <div className="space-y-2.5">
                {skillGap.matched_skills.map((s, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">{s.skill}</span>
                      <span className="text-slate-400">{s.category}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full w-full bg-emerald-500 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Partially matched skills */}
          {skillGap?.partially_matched_skills?.length > 0 && (
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-500" />
                Partially Matched Skills
              </h3>
              <div className="space-y-3">
                {skillGap.partially_matched_skills.map((s, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <span className="font-semibold text-slate-700 text-xs">{s.skill}</span>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full w-1/2 bg-amber-500 rounded-full" />
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{s.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Missing skills */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              Missing Skills
            </h3>
            <div className="space-y-3">
              {skillGap?.missing_skills?.length ? (
                skillGap.missing_skills.map((s, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border ${PRIORITY_STYLES[s.priority] || PRIORITY_STYLES.Low} space-y-1`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm">{s.skill}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                        {s.priority} priority
                      </span>
                    </div>
                    {s.why_it_matters && (
                      <p className="text-xs opacity-90 leading-relaxed">{s.why_it_matters}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No major gaps found - matches the target role well.</p>
              )}
            </div>
          </div>

          {/* Roadmap */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
            <div>
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Compass className="w-5 h-5 text-violet-600" />
                {roadmap?.title || "Learning Roadmap"}
              </h3>
              {roadmap?.estimated_duration && (
                <p className="text-xs text-slate-500 mt-1">Estimated duration: {roadmap.estimated_duration}</p>
              )}
            </div>

            <div className="relative space-y-4">
              {/* Connecting timeline line behind the numbered steps */}
              {roadmap?.phases?.length > 1 && (
                <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gradient-to-b from-violet-300 via-violet-200 to-transparent" />
              )}
              {roadmap?.phases?.map((phase) => (
                <div
                  key={phase.phase_number}
                  className="relative p-5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4"
                >
                  <div className="w-8 h-8 rounded-xl bg-violet-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 z-10 ring-4 ring-white">
                    {phase.phase_number}
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className="font-bold text-slate-800 text-sm">{phase.phase_name}</h4>
                      {phase.duration && (
                        <span className="text-[11px] font-semibold text-violet-600">{phase.duration}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{phase.goal}</p>
                    {phase.topics?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {phase.topics.map((t, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-600"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    {phase.mini_project && (
                      <p className="text-xs text-slate-500 italic pt-1">Project: {phase.mini_project}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {roadmap?.final_outcome && (
              <div className="p-5 rounded-2xl bg-violet-50/60 border border-violet-100">
                <p className="text-xs text-violet-900 font-medium leading-relaxed">{roadmap.final_outcome}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
