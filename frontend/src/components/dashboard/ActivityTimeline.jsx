import { FileCheck2, FileText, Mic2, Compass } from "lucide-react";
import { formatRelativeDay } from "../../utils/activityFeed.js";

const TYPE_META = {
  resume_analysis: { icon: FileCheck2, cls: "from-brand-purple to-brand-indigo" },
  cover_letter: { icon: FileText, cls: "from-indigo-500 to-blue-500" },
  mock_interview: { icon: Mic2, cls: "from-violet-500 to-purple-600" },
  skill_roadmap: { icon: Compass, cls: "from-blue-500 to-cyan-500" },
};

function StatusBadge({ status }) {
  const cls =
    status === "Completed"
      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
      : "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400";
  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>{status}</span>;
}

function ActivityRow({ item, onView }) {
  const meta = TYPE_META[item.type];
  const Icon = meta.icon;
  return (
    <div className="flex items-center gap-3.5 py-3.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.cls} flex items-center justify-center text-white shrink-0`}>
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{item.title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.subtitle}</p>
      </div>
      <span className="text-[11px] text-slate-400 shrink-0 hidden sm:block">{formatRelativeDay(item.timestamp)}</span>
      {item.scoreBadge !== null && item.scoreBadge !== undefined && (
        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 shrink-0">{item.scoreBadge}</span>
      )}
      <StatusBadge status={item.status} />
      <button onClick={() => onView(item)} className="text-xs font-semibold text-brand-indigo hover:underline shrink-0">
        View
      </button>
    </div>
  );
}

export function ActivityEmptyState({ onUpload }) {
  return (
    <div className="flex flex-col items-center text-center py-10 px-4">
      <svg width="120" height="96" viewBox="0 0 120 96" fill="none" className="mb-4">
        <rect x="28" y="10" width="64" height="76" rx="8" fill="url(#hm-empty-grad)" opacity="0.12" />
        <rect x="28" y="10" width="64" height="76" rx="8" stroke="url(#hm-empty-grad)" strokeWidth="2" />
        <line x1="40" y1="30" x2="80" y2="30" stroke="url(#hm-empty-grad)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="40" y1="42" x2="80" y2="42" stroke="url(#hm-empty-grad)" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
        <line x1="40" y1="54" x2="64" y2="54" stroke="url(#hm-empty-grad)" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
        <circle cx="90" cy="70" r="16" fill="white" stroke="url(#hm-empty-grad)" strokeWidth="2.5" />
        <path d="M83 70l5 5 9-10" stroke="url(#hm-empty-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <defs>
          <linearGradient id="hm-empty-grad" x1="0" y1="0" x2="120" y2="96" gradientUnits="userSpaceOnUse">
            <stop stopColor="#7C3AED" />
            <stop offset="1" stopColor="#C084FC" />
          </linearGradient>
        </defs>
      </svg>
      <p className="font-semibold text-slate-700 dark:text-slate-200">Start your AI career journey</p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
        Upload a resume to get your first ATS score, then unlock feedback, cover letters, and interview practice.
      </p>
      <button
        onClick={onUpload}
        className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue text-white text-sm font-semibold hover:-translate-y-0.5 active:scale-95 transition-all duration-200 shadow-glow"
      >
        Analyze Your First Resume
      </button>
    </div>
  );
}

export default function ActivityTimeline({ items, onView, onUpload }) {
  if (items.length === 0) return <ActivityEmptyState onUpload={onUpload} />;
  return (
    <div>
      {items.map((item) => (
        <ActivityRow key={item.id} item={item} onView={onView} />
      ))}
    </div>
  );
}
