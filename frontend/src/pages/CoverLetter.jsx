import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import api from "../api/axios";
import LoadingSpinner from "../components/LoadingSpinner";
import { EmptyStateIllustration } from "../components/illustrations/Illustrations.jsx";
import { FileText, Sparkles, RefreshCw, AlertCircle, CheckCircle2, Send } from "lucide-react";

export default function CoverLetter() {
  // The route is /analysis/:id/cover-letter - :id IS the analysis_id.
  // The backend already knows the resume + job description linked to this
  // analysis, so this page never asks the user to pick them again.
  const { id } = useParams();
  const analysisId = Number(id);
  const location = useLocation();
  // Only auto-load a previously generated letter when arriving here via the
  // "View" link on the History page (passes this flag explicitly). Arriving
  // via the sidebar's "Cover Letter Generator" link - even for an analysis
  // that already has a saved letter - always starts fresh at the Generate
  // screen instead of silently resurfacing last session's content.
  const viewExisting = Boolean(location.state?.viewExisting);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(viewExisting);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setResult(null);
    setError("");

    if (!viewExisting) {
      setChecking(false);
      return;
    }

    let active = true;
    setChecking(true);
    api
      .get(`/api/cover-letter/${analysisId}`)
      .then((res) => { if (active) setResult(res.data); })
      .catch(() => {}) // 404 just means "not generated yet" - not an error
      .finally(() => { if (active) setChecking(false); });

    return () => { active = false; };
  }, [analysisId, viewExisting]);

  const generate = async (endpoint) => {
    setError("");
    setLoading(true);
    try {
      const res = await api.post(endpoint, { analysis_id: analysisId });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to generate cover letter.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result?.cover_letter) return;
    navigator.clipboard.writeText(result.cover_letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-violet-100 text-violet-700">
              <FileText className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              AI Cover Letter Generator
            </h1>
          </div>
          <p className="text-slate-500 text-sm">
            Generated from the resume and job description you already analyzed.
          </p>
        </div>

        {result && (
          <button
            onClick={() => generate("/api/cover-letter/regenerate")}
            disabled={loading}
            className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Regenerate</span>
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
          <LoadingSpinner label="Checking for an existing cover letter..." />
        </div>
      ) : !result ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6 text-center">
          <EmptyStateIllustration className="w-20 h-20 mx-auto text-violet-400" />
          <p className="text-sm text-slate-600">
            No cover letter yet for this analysis. Generate one now.
          </p>
          <button
            onClick={() => generate("/api/cover-letter/generate")}
            disabled={loading}
            className="w-full sm:w-auto mx-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold text-sm shadow-lg shadow-violet-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <LoadingSpinner label="Generating Cover Letter..." />
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Generate Cover Letter</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-600" />
              {result.role_name ? `Cover Letter - ${result.role_name}` : "Generated Cover Letter"}
            </h3>
            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Send className="w-4 h-4" />}
              <span>{copied ? "Copied!" : "Copy Text"}</span>
            </button>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 font-sans text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
            {result.cover_letter}
          </div>
        </div>
      )}
    </div>
  );
}
