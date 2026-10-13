const TAG_STYLES = {
  good: "bg-emerald-50 text-emerald-700 border-emerald-100",
  bad: "bg-rose-50 text-rose-700 border-rose-100",
  warn: "bg-amber-50 text-amber-700 border-amber-100",
};

function TagGroup({ label, items, variant }) {
  return (
    <div className="space-y-2">
      <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</h5>
      {!items || items.length === 0 ? (
        <p className="text-xs text-slate-400">None</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <span key={item} className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${TAG_STYLES[variant]}`}>
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SkillsComparison({ matched, missing, recommended, tips }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <TagGroup label="Matched Skills" items={matched} variant="good" />
        <TagGroup label="Missing Skills" items={missing} variant="bad" />
        <TagGroup label="Recommended to Learn" items={recommended} variant="warn" />
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
