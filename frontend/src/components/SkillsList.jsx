import { CheckCircle2, XCircle, Lightbulb, ExternalLink } from "lucide-react";

const VARIANT_CONFIG = {
  good: {
    icon: CheckCircle2,
    chip: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25 hover:border-emerald-400/50",
    iconColor: "text-emerald-400",
    label: "text-emerald-300",
  },
  bad: {
    icon: XCircle,
    chip: "bg-rose-500/10 text-rose-300 border-rose-500/25 hover:border-rose-400/50",
    iconColor: "text-rose-400",
    label: "text-rose-300",
  },
  warn: {
    icon: Lightbulb,
    chip: "bg-amber-500/10 text-amber-300 border-amber-500/25 hover:border-amber-400/50",
    iconColor: "text-amber-400",
    label: "text-amber-300",
  },
};

function toList(str) {
  if (!str) return [];
  return str.split(",").map((s) => s.trim()).filter(Boolean);
}

/**
 * showCourseLink: only makes sense for "bad" (missing) and "warn"
 * (recommended) skills - nobody needs a course for something they already
 * have. Points at a plain Google search for the top skills, since there's no
 * curated-course backend endpoint to link to.
 */
export default function SkillsList({ title, skills, variant = "good", showCourseLink = false }) {
  const items = toList(skills);
  const cfg = VARIANT_CONFIG[variant];
  const Icon = cfg.icon;

  const courseUrl =
    items.length > 0
      ? `https://www.google.com/search?q=${encodeURIComponent(
          "best online course to learn " + items.slice(0, 3).join(", ")
        )}`
      : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h4 className={`flex items-center gap-2 text-sm font-bold ${cfg.label}`}>
          <Icon className={`w-4 h-4 ${cfg.iconColor}`} />
          <span>{title}</span>
          {items.length > 0 && (
            <span className="text-[11px] font-semibold text-slate-400 bg-white/5 px-1.5 py-0.5 rounded-md">
              {items.length}
            </span>
          )}
        </h4>
        {showCourseLink && courseUrl && (
          <a
            href={courseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] font-semibold text-violet-300 hover:text-violet-200 transition-colors"
          >
            Find Courses <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-slate-500 italic">None</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((skill) => (
            <span
              key={skill}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold capitalize transition-colors ${cfg.chip}`}
            >
              {skill}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
