/**
 * Every illustration here is a small inline SVG - no external image files,
 * no network requests. They use currentColor / rgba(255,255,255,..) so they
 * read correctly on the purple gradient hero as well as plain cards, and
 * they're intentionally simple (a handful of shapes) rather than detailed
 * scenes, per the "purposeful, minimal - not decorative everywhere" brief.
 */

/** Dashboard hero - abstract resume + AI spark, sits on the gradient banner. */
export function ResumeAIIllustration({ className = "" }) {
  return (
    <svg
      viewBox="0 0 220 200"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="140" cy="100" r="78" fill="white" fillOpacity="0.06" />
      <circle cx="140" cy="100" r="54" fill="white" fillOpacity="0.05" />

      {/* Resume sheet */}
      <g className="animate-float-slow" style={{ transformOrigin: "70px 100px" }}>
        <rect x="34" y="34" width="96" height="132" rx="10" fill="white" fillOpacity="0.14" stroke="white" strokeOpacity="0.35" />
        <rect x="50" y="54" width="44" height="6" rx="3" fill="white" fillOpacity="0.55" />
        <rect x="50" y="68" width="64" height="4" rx="2" fill="white" fillOpacity="0.3" />
        <rect x="50" y="78" width="56" height="4" rx="2" fill="white" fillOpacity="0.3" />
        <rect x="50" y="96" width="30" height="5" rx="2.5" fill="white" fillOpacity="0.45" />
        <rect x="50" y="108" width="64" height="4" rx="2" fill="white" fillOpacity="0.28" />
        <rect x="50" y="117" width="64" height="4" rx="2" fill="white" fillOpacity="0.28" />
        <rect x="50" y="126" width="48" height="4" rx="2" fill="white" fillOpacity="0.28" />
        <rect x="50" y="142" width="30" height="5" rx="2.5" fill="white" fillOpacity="0.45" />
        <rect x="50" y="154" width="40" height="4" rx="2" fill="white" fillOpacity="0.28" />
      </g>

      {/* Floating AI sparkle badge */}
      <g transform="translate(134,40)">
        <circle cx="26" cy="26" r="26" fill="white" fillOpacity="0.9" />
        <path
          d="M26 12l3.2 9.8L39 25l-9.8 3.2L26 38l-3.2-9.8L13 25l9.8-3.2L26 12z"
          fill="#7C3AED"
        />
      </g>

      {/* Small match-score ring */}
      <g transform="translate(150,120)">
        <circle cx="24" cy="24" r="22" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.4" strokeWidth="2" />
        <path
          d="M24 3a21 21 0 1 1 -14.8 6.1"
          stroke="white"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        <text x="24" y="29" textAnchor="middle" fontSize="13" fontWeight="700" fill="white">
          87%
        </text>
      </g>
    </svg>
  );
}

/** Resume Analyzer empty dropzone - a document sliding into an upload tray. */
export function UploadIllustration({ className = "" }) {
  return (
    <svg viewBox="0 0 140 120" fill="none" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="70" cy="102" rx="48" ry="8" fill="currentColor" opacity="0.06" />
      <g className="animate-float-slow" style={{ transformOrigin: "70px 60px" }}>
        <rect x="38" y="14" width="52" height="68" rx="8" fill="currentColor" opacity="0.08" />
        <rect x="38" y="14" width="52" height="68" rx="8" stroke="currentColor" strokeOpacity="0.25" />
        <rect x="48" y="30" width="26" height="4" rx="2" fill="currentColor" opacity="0.35" />
        <rect x="48" y="40" width="32" height="3" rx="1.5" fill="currentColor" opacity="0.22" />
        <rect x="48" y="48" width="32" height="3" rx="1.5" fill="currentColor" opacity="0.22" />
        <rect x="48" y="56" width="20" height="3" rx="1.5" fill="currentColor" opacity="0.22" />
      </g>
      <g transform="translate(74,58)">
        <circle cx="20" cy="20" r="20" fill="#7C3AED" />
        <path d="M20 12v16M13 19l7-7 7 7" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
      <rect x="22" y="94" width="96" height="4" rx="2" fill="currentColor" opacity="0.08" />
    </svg>
  );
}

/** Small circular AI-recruiter avatar used next to the Recruiter Feedback header. */
export function RecruiterAvatarIllustration({ className = "" }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="32" cy="32" r="32" fill="url(#recruiter-grad)" />
      <circle cx="32" cy="26" r="10" fill="white" fillOpacity="0.9" />
      <path d="M14 54c2-10 10-16 18-16s16 6 18 16" stroke="white" strokeOpacity="0.9" strokeWidth="4" strokeLinecap="round" fill="none" />
      <circle cx="47" cy="19" r="6" fill="white" />
      <path d="M44.5 19l1.7 1.7L49.5 17" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <defs>
        <linearGradient id="recruiter-grad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7C3AED" />
          <stop offset="1" stopColor="#A855F7" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Small circular AI-interviewer avatar used on the Mock Interview screens. */
export function InterviewerAvatarIllustration({ className = "", speaking = false }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="32" cy="32" r="32" fill="url(#interviewer-grad)" />
      <rect x="18" y="20" width="28" height="20" rx="8" fill="white" fillOpacity="0.92" />
      <circle cx="27" cy="30" r="2.6" fill="#7C3AED" />
      <circle cx="37" cy="30" r="2.6" fill="#7C3AED" />
      <rect x="30" y="10" width="4" height="8" rx="2" fill="white" fillOpacity="0.7" />
      <circle cx="32" cy="9" r="3" fill="white" fillOpacity="0.9" />
      {speaking && (
        <>
          <rect x="15" y="47" width="3" height="8" rx="1.5" fill="white" className="animate-wave" style={{ animationDelay: "0ms" }} />
          <rect x="21" y="45" width="3" height="12" rx="1.5" fill="white" className="animate-wave" style={{ animationDelay: "120ms" }} />
          <rect x="27" y="43" width="3" height="16" rx="1.5" fill="white" className="animate-wave" style={{ animationDelay: "240ms" }} />
          <rect x="33" y="45" width="3" height="12" rx="1.5" fill="white" className="animate-wave" style={{ animationDelay: "160ms" }} />
          <rect x="39" y="47" width="3" height="8" rx="1.5" fill="white" className="animate-wave" style={{ animationDelay: "60ms" }} />
        </>
      )}
      <defs>
        <linearGradient id="interviewer-grad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4C1D95" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Official-style multi-colour Google "G" mark, for the disabled "Continue with Google" button on the auth pages (the lucide Chrome icon isn't the Google logo). */
export function GoogleIcon({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 48 48" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.5 0 10.4-2.1 14.1-5.5l-6.5-5.5C29.6 34.9 26.9 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.6 5.1C9.6 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.5 5.5C40.5 36.9 44 31.9 44 24c0-1.3-.1-2.7-.4-3.5z" />
    </svg>
  );
}

/** Generic "nothing here yet" illustration for empty states across the app. */
export function EmptyStateIllustration({ className = "" }) {
  return (
    <svg viewBox="0 0 120 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="60" cy="86" rx="38" ry="7" fill="currentColor" opacity="0.06" />
      <rect x="30" y="24" width="60" height="48" rx="10" fill="currentColor" opacity="0.06" />
      <rect x="30" y="24" width="60" height="48" rx="10" stroke="currentColor" strokeOpacity="0.2" />
      <rect x="42" y="40" width="36" height="4" rx="2" fill="currentColor" opacity="0.25" />
      <rect x="42" y="50" width="26" height="4" rx="2" fill="currentColor" opacity="0.18" />
      <circle cx="60" cy="18" r="9" fill="#7C3AED" fillOpacity="0.85" />
      <path d="M60 13v10M55 18h10" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
