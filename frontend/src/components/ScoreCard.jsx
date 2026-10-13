import { useEffect, useState } from "react";

/**
 * suffix: appended after the number inside the ring (e.g. "%" for ATS Match).
 * subtitle: the small line under the number (default keeps the exact old
 * "/ 100 ATS Score" text, so Interview Report - the other place this
 * component is used - is completely unaffected unless it opts in).
 */
export default function ScoreCard({ score, suffix = "", subtitle = "/ 100 ATS Score" }) {
  const clamped = Math.max(0, Math.min(100, score));
  const color = clamped >= 70 ? "#22c55e" : clamped >= 40 ? "#f59e0b" : "#ef4444";
  const label = clamped >= 70 ? "Strong Match" : clamped >= 40 ? "Moderate Match" : "Weak Match";

  const radius = 70;
  const circumference = 2 * Math.PI * radius;

  // Animate the ring filling and the number counting up on mount, instead of
  // rendering the final score instantly - a small but noticeable "this was
  // just computed for you" moment on the page's headline metric.
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let raf;
    const duration = 900;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setAnimatedScore(Math.round(eased * clamped));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [clamped]);

  const offset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="score-card">
      <svg width="170" height="170" viewBox="0 0 170 170">
        <circle cx="85" cy="85" r={radius} stroke="var(--border-color)" strokeWidth="14" fill="none" />
        <circle
          cx="85"
          cy="85"
          r={radius}
          stroke={color}
          strokeWidth="14"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 85 85)"
          style={{ transition: "stroke-dashoffset 0.1s linear", filter: `drop-shadow(0 0 6px ${color}66)` }}
        />
        <text x="85" y="80" textAnchor="middle" fontSize="30" fontWeight="700" fill="var(--text-color)">
          {animatedScore}{suffix}
        </text>
        <text x="85" y="105" textAnchor="middle" fontSize="13" fill="var(--text-muted)">
          {subtitle}
        </text>
      </svg>
      <p className="score-label animate-fade-in" style={{ color }}>{label}</p>
    </div>
  );
}
