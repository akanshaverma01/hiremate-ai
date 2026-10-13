import { FileText } from "lucide-react";

function scoreBadge(score) {
  if (score >= 70) return { label: "Strong", cls: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" };
  if (score >= 40) return { label: "Moderate", cls: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400" };
  return { label: "Needs Work", cls: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400" };
}

export function RecentActivityItem({ resumeName, jobTitle, date, score, onView }) {
  const badge = scoreBadge(score);
  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-purple/10 to-brand-blue/10 dark:from-brand-purple/20 dark:to-brand-blue/20 flex items-center justify-center text-brand-indigo shrink-0">
        <FileText size={17} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{resumeName}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{jobTitle} • {date}</p>
      </div>
      <span className="text-sm font-bold text-slate-700 dark:text-slate-200 shrink-0">{score}</span>
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${badge.cls}`}>{badge.label}</span>
      <button
        onClick={onView}
        className="text-xs font-semibold text-brand-indigo hover:underline shrink-0"
      >
        View
      </button>
    </div>
  );
}

export function RecentActivityEmpty({ onUpload }) {
  return (
    <div className="text-center py-10">
      <p className="text-sm text-slate-500 dark:text-slate-400">No resume analyses yet.</p>
      <button
        onClick={onUpload}
        className="mt-3 text-sm font-semibold text-brand-indigo hover:underline"
      >
        Upload your first resume →
      </button>
    </div>
  );
}