import { useState } from "react";
import { Sparkles, RefreshCw, Copy, Check, AlertCircle, CheckCircle2 } from "lucide-react";

export default function CopilotCard({ title, icon, buttonLabel, onGenerate, renderResult, copyText }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    setError("");
    setLoading(true);
    setCopied(false);
    try {
      const data = await onGenerate();
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const text = copyText ? copyText(result) : "";
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm hover:shadow-md transition-shadow space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-violet-50 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <h3 className="font-bold text-slate-800 text-base sm:text-lg">{title}</h3>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!result && !loading && (
        <button
          onClick={handleClick}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold text-xs shadow-sm hover:shadow-glow-sm transition-all flex items-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{buttonLabel}</span>
        </button>
      )}

      {loading && (
        <div className="flex items-center gap-3 py-2">
          <div className="relative w-8 h-8 flex-shrink-0">
            <div className="absolute inset-0 rounded-full border-2 border-violet-100" />
            <div className="absolute inset-0 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
          </div>
          {/* Shimmering placeholder lines - a lighter-weight "AI is thinking" cue than plain text */}
          <div className="flex-1 space-y-2">
            <div className="h-2.5 w-2/3 rounded-full bg-gradient-to-r from-violet-100 via-violet-200 to-violet-100 bg-[length:200%_100%] animate-shimmer" />
            <div className="h-2.5 w-1/3 rounded-full bg-gradient-to-r from-violet-100 via-violet-200 to-violet-100 bg-[length:200%_100%] animate-shimmer" />
          </div>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-4 animate-fade-in">
          {result.__success && (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 animate-pop">
              <CheckCircle2 className="w-4 h-4" />
              <span>Generated successfully</span>
            </div>
          )}
          {renderResult(result)}
          <div className="flex items-center gap-2 pt-1">
            {copyText && (
              <button
                onClick={handleCopy}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy Improved Text"}</span>
              </button>
            )}
            <button
              onClick={handleClick}
              className="px-3.5 py-2 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 font-semibold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Regenerate</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
