import { useState } from "react";
import { CheckCircle2, AlertTriangle, ChevronRight } from "lucide-react";

function toList(str) {
  if (!str) return [];
  return str.split(",").map((s) => s.trim()).filter(Boolean);
}

// Deterministic colour per skill name (not random per render), so a skill's
// badge colour stays the same every time it's shown - purely decorative,
// doesn't encode any real category data since skill names are free-text
// from the AI, not a fixed taxonomy.
const BADGE_PALETTE = [
  "bg-sky-500/15 text-sky-300",
  "bg-amber-500/15 text-amber-300",
  "bg-emerald-500/15 text-emerald-300",
  "bg-fuchsia-500/15 text-fuchsia-300",
  "bg-indigo-500/15 text-indigo-300",
  "bg-rose-500/15 text-rose-300",
  "bg-cyan-500/15 text-cyan-300",
];
function badgeColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return BADGE_PALETTE[hash % BADGE_PALETTE.length];
}
function initials(name) {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
}

const VISIBLE_COUNT = 8;

export default function SkillsPanel({ matchedSkills, missingSkills }) {
  const [tab, setTab] = useState("matched");
  const [showAllMatched, setShowAllMatched] = useState(false);
  const [showAllMissing, setShowAllMissing] = useState(false);

  const matched = toList(matchedSkills);
  const missing = toList(missingSkills);

  const activeList = tab === "matched" ? matched : missing;
  const showAll = tab === "matched" ? showAllMatched : showAllMissing;
  const setShowAll = tab === "matched" ? setShowAllMatched : setShowAllMissing;
  const visibleList = showAll ? activeList : activeList.slice(0, VISIBLE_COUNT);

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        {/* Segmented tab control */}
        <div className="inline-flex p-1 rounded-xl bg-slate-100/80 gap-1">
          <button
            onClick={() => setTab("matched")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tab === "matched"
                ? "bg-violet-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Matched Skills ({matched.length})
          </button>
          <button
            onClick={() => setTab("missing")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tab === "missing"
                ? "bg-rose-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Missing Skills ({missing.length})
          </button>
        </div>

        {activeList.length > VISIBLE_COUNT && (
          <button
            onClick={() => setShowAll((s) => !s)}
            className="flex items-center gap-1 text-xs font-bold text-violet-500 hover:text-violet-400 transition-colors cursor-pointer"
          >
            {showAll ? "Show Less" : "View All"} <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {activeList.length === 0 ? (
        <p className="text-sm text-slate-500 italic py-6 text-center">
          {tab === "matched" ? "No matched skills found." : "No missing skills - great coverage!"}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {visibleList.map((skill) => (
            <div
              key={skill}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-50/60 border border-slate-100 hover:border-violet-200 hover:bg-slate-50 transition-all group"
            >
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-extrabold flex-shrink-0 ${badgeColor(skill)}`}>
                {initials(skill)}
              </span>
              <span className="flex-1 text-sm font-medium text-slate-700 capitalize truncate">{skill}</span>
              {tab === "matched" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
