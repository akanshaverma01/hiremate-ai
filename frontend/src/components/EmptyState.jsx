import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { EmptyStateIllustration } from "./illustrations/Illustrations.jsx";

/**
 * ctaTo: internal route (renders a <Link>). ctaOnClick: click handler instead
 * (renders a <button>). Pass at most one; both are optional (a bare message
 * with no CTA is fine too).
 */
export default function EmptyState({ title, description, ctaLabel, ctaTo, ctaOnClick, className = "" }) {
  const Cta = ctaTo ? (
    <Link
      to={ctaTo}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold text-xs shadow-sm hover:shadow-glow-sm transition-all"
    >
      {ctaLabel} <ArrowRight className="w-3.5 h-3.5" />
    </Link>
  ) : ctaOnClick ? (
    <button
      type="button"
      onClick={ctaOnClick}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold text-xs shadow-sm hover:shadow-glow-sm transition-all cursor-pointer"
    >
      {ctaLabel} <ArrowRight className="w-3.5 h-3.5" />
    </button>
  ) : null;

  return (
    <div className={`bg-white rounded-3xl p-10 border border-slate-100 text-center shadow-sm animate-fade-in ${className}`}>
      <EmptyStateIllustration className="w-24 h-24 mx-auto text-violet-400 mb-3" />
      <h3 className="text-base font-bold text-slate-800">{title}</h3>
      {description && <p className="text-slate-500 text-sm mt-1.5 max-w-sm mx-auto">{description}</p>}
      {Cta && <div className="mt-5">{Cta}</div>}
    </div>
  );
}
