export default function ProgressRing({ value, size = 64, strokeWidth = 6, label }) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            <linearGradient id="hm-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#C084FC" />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            stroke="currentColor" strokeWidth={strokeWidth} fill="none"
            className="text-slate-100 dark:text-slate-800"
          />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            stroke="url(#hm-ring-gradient)" strokeWidth={strokeWidth} fill="none"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-bold text-slate-800 dark:text-slate-100" style={{ fontSize: size * 0.24 }}>
            {clamped}%
          </span>
        </div>
      </div>
      {label && <span className="text-xs text-slate-500 dark:text-slate-400 text-center">{label}</span>}
    </div>
  );
}
