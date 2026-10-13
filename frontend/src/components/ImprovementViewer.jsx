import { ArrowRight } from "lucide-react";

export default function ImprovementViewer({ before, after, tips }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
          <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Original</h5>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{before || "—"}</p>
        </div>
        <div className="p-4 rounded-2xl bg-violet-50/60 border border-violet-100 space-y-1.5 relative">
          <ArrowRight className="hidden md:block absolute -left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400" />
          <h5 className="text-[11px] font-bold text-violet-600 uppercase tracking-wider">AI Improved</h5>
          <p className="text-sm text-slate-800 font-medium leading-relaxed whitespace-pre-line">{after || "—"}</p>
        </div>
      </div>
      {tips && tips.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 space-y-2">
          <h5 className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Tips</h5>
          <ul className="space-y-1.5">
            {tips.map((t, i) => (
              <li key={i} className="text-xs text-amber-800 flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
