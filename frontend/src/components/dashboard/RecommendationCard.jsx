import { Sparkles, ArrowRight } from "lucide-react";

export default function RecommendationCard({ title, description, actionLabel, onAction }) {
  return (
    <div className="bg-gradient-to-br from-brand-purple/5 via-brand-indigo/5 to-brand-blue/5 dark:from-brand-purple/10 dark:via-brand-indigo/10 dark:to-brand-blue/10 rounded-xl2 border border-brand-violet/20 p-5 flex items-start gap-4 animate-slide-up">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-purple to-brand-blue flex items-center justify-center text-white shrink-0 shadow-glow">
        <Sparkles size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">{title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{description}</p>
        {actionLabel && (
          <button
            onClick={onAction}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-indigo hover:gap-2.5 transition-all"
          >
            {actionLabel} <ArrowRight size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
