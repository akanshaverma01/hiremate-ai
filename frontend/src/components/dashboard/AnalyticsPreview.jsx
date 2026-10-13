export function ScoreTrendPreview({ scores }) {
  if (!scores || scores.length === 0) {
    return <p className="text-sm text-slate-400">Not enough data yet.</p>;
  }
  const max = Math.max(...scores, 100);
  return (
    <div className="flex items-end gap-2 h-24">
      {scores.map((s, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-md bg-gradient-to-t from-brand-purple to-brand-blue transition-all duration-500"
            style={{ height: `${Math.max((s / max) * 100, 4)}%` }}
            title={`${s}`}
          />
          <span className="text-[10px] text-slate-400">{s}</span>
        </div>
      ))}
    </div>
  );
}

export function SkillsMatchPreview({ matchedCount, missingCount }) {
  const total = matchedCount + missingCount || 1;
  const matchedPct = Math.round((matchedCount / total) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
        <span>Matched ({matchedCount})</span>
        <span>Missing ({missingCount})</span>
      </div>
      <div className="w-full h-3 rounded-full bg-red-100 dark:bg-red-950/40 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
          style={{ width: `${matchedPct}%` }}
        />
      </div>
    </div>
  );
}

export function ImprovementProgress({ firstScore, latestScore }) {
  const delta = latestScore - firstScore;
  const pct = Math.min(Math.max(latestScore, 0), 100);
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-xs text-slate-500 dark:text-slate-400">Latest ATS Score</span>
        <span className={`text-xs font-semibold ${delta >= 0 ? "text-emerald-500" : "text-red-500"}`}>
          {delta >= 0 ? "+" : ""}{delta} since your first analysis
        </span>
      </div>
      <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-purple to-brand-blue transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
