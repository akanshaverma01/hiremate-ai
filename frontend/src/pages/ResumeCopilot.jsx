import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { improveSection } from "../services/copilotApi";
import CopilotCard from "../components/CopilotCard.jsx";
import ImprovementViewer from "../components/ImprovementViewer.jsx";
import SkillsComparison from "../components/SkillsComparison.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import EmptyState from "../components/EmptyState.jsx";
import {
  Sparkles,
  FileText,
  Briefcase,
  Rocket,
  Wrench,
  CheckCheck,
  AlertCircle,
  ArrowRight,
  Award,
  Layers
} from "lucide-react";

export default function ResumeCopilot() {
  const { analysisId } = useParams();
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // No analysis chosen yet -> load the list so the user can pick one
  useEffect(() => {
    if (analysisId) return;
    setLoading(true);
    api
      .get("/api/analysis/history")
      .then((res) => setHistory(res.data))
      .catch(() => setError("Could not load your past analyses."))
      .finally(() => setLoading(false));
  }, [analysisId]);

  // Analysis chosen -> load its details for the header (resume name, score, job title)
  useEffect(() => {
    if (!analysisId) return;
    setLoading(true);
    setError("");
    api
      .get(`/api/analysis/${analysisId}`)
      .then((res) => setAnalysis(res.data))
      .catch(() => setError("Could not load this analysis."))
      .finally(() => setLoading(false));
  }, [analysisId]);

  const handleOpen = () => {
    if (selectedId) navigate(`/copilot/${selectedId}`);
  };

  if (loading) return <LoadingSpinner label="Loading AI Resume Copilot..." />;

  // Picker view: no analysis selected yet
  if (!analysisId) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        {/* Hero Header Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 p-8 text-white shadow-xl">
          <div className="relative z-10 space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-violet-100 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> AI Section Refiner
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              AI Resume Copilot
            </h1>
            <p className="text-violet-100 text-sm opacity-90">
              Improve your resume section-by-section using AI and ATS best practices.
            </p>
          </div>
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium shadow-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {history.length === 0 ? (
          <EmptyState
            title="No Prior Analyses Found"
            description="Run an ATS analysis first, then come back here to improve that resume."
            ctaLabel="Run Your First Analysis"
            ctaTo="/upload"
          />
        ) : (
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-800">Choose an Analysis to Work On</h3>
              <p className="text-xs text-slate-400">Select a previously analyzed resume to launch Copilot tools.</p>
            </div>

            <div className="space-y-4">
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all cursor-pointer"
              >
                <option value="">-- Select a past analysis --</option>
                {history.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.resume_filename} vs {h.job_title} (ATS Score: {h.ats_score}%)
                  </option>
                ))}
              </select>

              <button
                onClick={handleOpen}
                disabled={!selectedId}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-violet-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
              >
                <span>Open Copilot Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const numericId = Number(analysisId);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Hero Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 p-8 text-white shadow-xl">
        <div className="relative z-10 space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-violet-100 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Interactive AI Workspace
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            AI Resume Copilot
          </h1>
          <p className="text-violet-100 text-sm opacity-90">
            Improve your resume section-by-section using AI and ATS best practices.
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Context Details Banner */}
      {analysis && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Resume</span>
              <strong className="text-slate-800 font-semibold truncate block">{analysis.resume_filename}</strong>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Award className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">ATS Score</span>
              <strong className="text-emerald-700 font-extrabold text-sm truncate block">
                {analysis.ats_score}% Match
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Briefcase className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Target Role</span>
              <strong className="text-slate-800 font-semibold truncate block">{analysis.job_title}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Copilot Section Cards */}
      <div className="space-y-6">
        <CopilotCard
          title="Summary Optimizer"
          icon={<FileText className="w-5 h-5 text-violet-600" />}
          buttonLabel="Improve Summary"
          onGenerate={() => improveSection(numericId, "summary").then((r) => r.data)}
          copyText={(r) => r.after}
          renderResult={(r) => <ImprovementViewer before={r.before} after={r.after} tips={r.tips} />}
        />

        <CopilotCard
          title="Experience Optimizer"
          icon={<Briefcase className="w-5 h-5 text-indigo-600" />}
          buttonLabel="Improve Experience"
          onGenerate={() => improveSection(numericId, "experience").then((r) => r.data)}
          copyText={(r) => r.after}
          renderResult={(r) => <ImprovementViewer before={r.before} after={r.after} tips={r.tips} />}
        />

        <CopilotCard
          title="Projects Optimizer"
          icon={<Rocket className="w-5 h-5 text-purple-600" />}
          buttonLabel="Optimize Projects"
          onGenerate={() => improveSection(numericId, "projects").then((r) => r.data)}
          copyText={(r) => r.after}
          renderResult={(r) => <ImprovementViewer before={r.before} after={r.after} tips={r.tips} />}
        />

        <CopilotCard
          title="Skills Optimizer"
          icon={<Wrench className="w-5 h-5 text-amber-600" />}
          buttonLabel="Find Missing Skills"
          onGenerate={() => improveSection(numericId, "skills").then((r) => r.data)}
          renderResult={(r) => (
            <SkillsComparison
              matched={r.matched_skills}
              missing={r.missing_skills}
              recommended={r.recommended_skills}
              tips={r.tips}
            />
          )}
        />

        <CopilotCard
          title="Grammar & ATS Suggestions"
          icon={<CheckCheck className="w-5 h-5 text-emerald-600" />}
          buttonLabel="Check Resume Language"
          onGenerate={() => improveSection(numericId, "grammar").then((r) => r.data)}
          renderResult={(r) => (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-rose-600">
                  Grammar Issues
                </h5>
                <ul className="space-y-1.5 list-disc list-inside text-slate-600">
                  {r.grammar_issues?.map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-amber-600">
                  Repeated Keywords
                </h5>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {r.repeated_keywords?.map((k) => (
                    <span key={k} className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold">
                      {k}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-indigo-600">
                  Weak Action Verbs
                </h5>
                <ul className="space-y-1.5 list-disc list-inside text-slate-600">
                  {r.weak_action_verbs?.map((v, i) => (
                    <li key={i}>{v}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-violet-600">
                  ATS Formatting Suggestions
                </h5>
                <ul className="space-y-1.5 list-disc list-inside text-slate-600">
                  {r.formatting_suggestions?.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
}