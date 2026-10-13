import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function StatCard({ icon: Icon, label, value, trend, isEmpty }) {
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? "text-emerald-500" : trend < 0 ? "text-red-500" : "text-slate-400";

  return (
    <div className="group bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-xl2 border border-slate-200 dark:border-slate-800 p-5 shadow-glass transition-all duration-200 hover:-translate-y-1 hover:shadow-lg animate-slide-up">
      <div className="flex items-start justify-between">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center text-white transition-transform duration-200 group-hover:scale-110 ${
            isEmpty ? "bg-slate-300 dark:bg-slate-700" : "bg-gradient-to-br from-brand-purple to-brand-blue shadow-glow"
          }`}
        >
          <Icon size={20} />
        </div>
        {trend !== undefined && trend !== null && !isEmpty && (
          <span className={`flex items-center gap-1 text-xs font-semibold ${trendColor}`}>
            <TrendIcon size={13} />
            {trend > 0 ? `+${trend}` : trend}%
          </span>
        )}
      </div>
      <p className={`mt-4 text-2xl font-extrabold ${isEmpty ? "text-slate-300 dark:text-slate-600" : "text-slate-800 dark:text-slate-50"}`}>
        {isEmpty ? "--" : value}
      </p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

