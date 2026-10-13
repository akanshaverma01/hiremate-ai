import { Target, MessageCircle, FileCheck, Mic, Sparkles, User } from "lucide-react";

/**
 * Purely decorative - the numbers on the chips ("92%", "70%", "12 Questions")
 * are illustrative copy for the marketing panel, not live data from any API.
 */
export default function AuthHeroIllustration({ className = "" }) {
  return (
    <div className={`relative w-full max-w-[440px] aspect-[11/9] mx-auto ${className}`}>
      {/* Glow backdrop */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-[85%] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.28) 0%, rgba(139,92,246,0.10) 45%, transparent 70%)" }}
      />

      {/* Scattered sparkles */}
      <Sparkles className="absolute left-[6%] top-[14%] w-4 h-4 text-violet-300/70" />
      <Sparkles className="absolute right-[20%] top-[4%] w-3 h-3 text-fuchsia-300/60" />
      <Sparkles className="absolute left-[2%] bottom-[22%] w-3 h-3 text-violet-300/50" />

      {/* Resume card, propped like a laptop screen */}
      <div className="absolute left-1/2 top-[8%] -translate-x-1/2 w-[58%] rounded-2xl bg-white/95 border border-white/60 shadow-2xl p-4 space-y-2.5">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
          <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="h-2 w-2/3 rounded-full bg-slate-300" />
            <div className="h-1.5 w-1/2 rounded-full bg-slate-200" />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="h-1.5 w-full rounded-full bg-slate-100" />
          <div className="h-1.5 w-11/12 rounded-full bg-slate-100" />
          <div className="h-1.5 w-full rounded-full bg-slate-100" />
          <div className="h-1.5 w-4/5 rounded-full bg-slate-100" />
          <div className="h-1.5 w-full rounded-full bg-slate-100" />
          <div className="h-1.5 w-3/5 rounded-full bg-slate-100" />
        </div>
      </div>
      {/* Laptop base under the resume card */}
      <div className="absolute left-1/2 top-[64%] -translate-x-1/2 w-[70%] h-4 rounded-b-2xl bg-gradient-to-b from-slate-700 to-slate-800 shadow-lg" />

      {/* ATS Score chip */}
      <div className="absolute left-[2%] top-[18%] flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-slate-900 border border-white/10 shadow-xl animate-float-slow will-change-transform">
        <div className="w-8 h-8 rounded-full bg-violet-500/20 text-violet-300 flex items-center justify-center flex-shrink-0">
          <Target className="w-4 h-4" />
        </div>
        <div className="leading-tight">
          <p className="text-[10px] text-slate-300 font-medium">ATS Score</p>
          <p className="text-sm text-white font-extrabold">92%</p>
        </div>
      </div>

      {/* AI Feedback chip */}
      <div
        className="absolute right-[0%] top-[28%] flex items-start gap-2.5 px-3.5 py-2.5 rounded-2xl bg-slate-900 border border-white/10 shadow-xl animate-float-slow will-change-transform max-w-[58%]"
        style={{ animationDelay: "0.6s" }}
      >
        <div className="w-8 h-8 rounded-full bg-fuchsia-500/20 text-fuchsia-300 flex items-center justify-center flex-shrink-0">
          <MessageCircle className="w-4 h-4" />
        </div>
        <div className="leading-tight">
          <p className="text-[10px] text-slate-300 font-medium">AI Feedback</p>
          <p className="text-xs text-white font-semibold">Your skills match 70% of the JD</p>
        </div>
      </div>

      {/* Cover Letter chip */}
      <div
        className="absolute right-[4%] top-[56%] flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-slate-900 border border-white/10 shadow-xl animate-float-slow will-change-transform"
        style={{ animationDelay: "0.3s" }}
      >
        <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center flex-shrink-0">
          <FileCheck className="w-4 h-4" />
        </div>
        <div className="leading-tight">
          <p className="text-[10px] text-slate-300 font-medium">Cover Letter</p>
          <p className="text-xs text-white font-semibold">Generated ✓</p>
        </div>
      </div>

      {/* Interview Prep chip */}
      <div
        className="absolute left-[14%] bottom-[2%] flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-slate-900 border border-white/10 shadow-xl animate-float-slow will-change-transform"
        style={{ animationDelay: "0.9s" }}
      >
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center flex-shrink-0">
          <Mic className="w-4 h-4" />
        </div>
        <div className="leading-tight">
          <p className="text-[10px] text-slate-300 font-medium">Interview Prep</p>
          <p className="text-xs text-white font-semibold">12 Questions</p>
        </div>
      </div>
    </div>
  );
}
