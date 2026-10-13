import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileUp, FileText, UserCheck, Sparkles, Mic, Compass,
  FileCheck2, TrendingUp as TrendIcon, Mic2, ArrowRight,
} from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext.jsx";
import { getInterviewHistory } from "../services/interviewService";
import { goToLatestAnalysis } from "../utils/analysisNav.js";
import { buildActivityFeed } from "../utils/activityFeed.js";
import StatCard from "../components/dashboard/StatCard.jsx";
import QuickActionCard from "../components/dashboard/QuickActionCard.jsx";
import ActivityTimeline from "../components/dashboard/ActivityTimeline.jsx";
import ProgressRing from "../components/dashboard/ProgressRing.jsx";
import AnimatedCounter from "../components/dashboard/AnimatedCounter.jsx";
import FooterCTA from "../components/dashboard/FooterCTA.jsx";
import { ResumeAIIllustration } from "../components/illustrations/Illustrations.jsx";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const quickActionsRef = useRef(null);

  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [interviewHistory, setInterviewHistory] = useState([]);
  const [coverLetterHistory, setCoverLetterHistory] = useState([]);
  const [skillGapHistory, setSkillGapHistory] = useState([]);
  const [copilotHistory, setCopilotHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/api/analysis/history").catch(() => ({ data: [] })),
      getInterviewHistory().catch(() => ({ data: [] })),
      api.get("/api/cover-letter/history").catch(() => ({ data: [] })),
      api.get("/api/skill-gap/history").catch(() => ({ data: [] })),
      api.get("/api/copilot/history").catch(() => ({ data: [] })),
    ]).then(([analysisRes, interviewRes, coverLetterRes, skillGapRes, copilotRes]) => {
      setAnalysisHistory(analysisRes.data);
      setInterviewHistory(interviewRes.data);
      setCoverLetterHistory(coverLetterRes.data);
      setSkillGapHistory(skillGapRes.data);
      setCopilotHistory(copilotRes.data);
      setLoading(false);
    });
  }, []);

  // ---- Real derived stats - nothing here is fabricated ----
  const totalResumes = analysisHistory.length;
  const avgAts = totalResumes ? Math.round(analysisHistory.reduce((s, h) => s + h.ats_score, 0) / totalResumes) : 0;
  const completedInterviews = interviewHistory.filter((i) => i.completed_at);

  let atsTrend = null;
  if (analysisHistory.length >= 2) {
    const sorted = [...analysisHistory].reverse();
    const mid = Math.floor(sorted.length / 2);
    const olderAvg = sorted.slice(0, mid).reduce((s, h) => s + h.ats_score, 0) / mid;
    const recentAvg = sorted.slice(mid).reduce((s, h) => s + h.ats_score, 0) / (sorted.length - mid);
    atsTrend = Math.round(recentAvg - olderAvg);
  }

  const latest = analysisHistory[0];
  const firstScore = analysisHistory.length ? Math.round(analysisHistory[analysisHistory.length - 1].ats_score) : 0;
  const latestScore = latest ? Math.round(latest.ats_score) : 0;
  const atsDelta = analysisHistory.length >= 2 ? latestScore - firstScore : null;

  const latestMatched = latest?.matched_skills ? latest.matched_skills.split(",").filter(Boolean).length : 0;
  const latestMissing = latest?.missing_skills ? latest.missing_skills.split(",").filter(Boolean).length : 0;
  const skillCompletion = latestMatched + latestMissing > 0 ? Math.round((latestMatched / (latestMatched + latestMissing)) * 100) : 0;

  const interviewReadiness = completedInterviews.length
    ? Math.round(completedInterviews.reduce((s, i) => s + (i.overall_score || 0), 0) / completedInterviews.length)
    : 0;

  const hasRoadmap = skillGapHistory.length > 0;

  // "Profile completion" isn't an existing concept in this app - defined
  // here as how many of the 5 features with a history endpoint you've used
  // at least once. Recruiter Feedback isn't counted: it has no "list all"
  // endpoint yet, so there's no honest way to check "have you used it."
  const usedFeatures = [
    totalResumes > 0,
    coverLetterHistory.length > 0,
    completedInterviews.length > 0,
    skillGapHistory.length > 0,
    copilotHistory.length > 0,
  ].filter(Boolean).length;
  const profileCompletion = Math.round((usedFeatures / 5) * 100);

  const activityFeed = buildActivityFeed({ analysisHistory, coverLetterHistory, interviewHistory, skillGapHistory }).slice(0, 8);

  const quickActions = [
    { icon: FileUp, title: "Resume Analyzer", description: "Upload a resume and get instant ATS scoring.", onClick: () => navigate("/upload") },
    { icon: UserCheck, title: "AI Recruiter Feedback", description: "Get an AI recruiter's honest read on your resume.", onClick: () => goToLatestAnalysis(navigate, "recruiter-feedback") },
    { icon: FileText, title: "Cover Letter Generator", description: "Create a tailored cover letter from your latest resume.", onClick: () => goToLatestAnalysis(navigate, "cover-letter") },
    { icon: Sparkles, title: "AI Copilot", description: "Improve your summary, experience, and skills section by section.", onClick: () => navigate("/copilot") },
    { icon: Mic, title: "Mock Interview", description: "Practice with voice and get scored feedback per answer.", onClick: () => navigate("/interview/mock") },
    { icon: Compass, title: "Skill Gap & Roadmap", description: "See what's missing and get a 4-phase learning plan.", onClick: () => goToLatestAnalysis(navigate, "skill-gap") },
  ];

  const handleViewActivity = (item) => navigate(item.viewLink);
  const scrollToQuickActions = () => quickActionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Hero - single greeting, no duplicate anywhere else in the shell */}
      <div className="relative overflow-hidden rounded-xl3 bg-gradient-to-br from-brand-purple via-brand-indigo to-brand-blue text-white p-7 md:p-10 shadow-glow">
        {/* Subtle background dot grid - controlled, not a bloom */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "22px 22px" }}
        />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-white/8 blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Welcome back, {user?.full_name?.split(" ")[0]} 👋
            </h1>
            <p className="mt-3 text-white/85 max-w-xl text-sm md:text-base">
              Your AI Career Companion for Resume, ATS, Interview &amp; Skill Growth.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/upload")}
                className="px-5 py-2.5 rounded-xl bg-white text-brand-purple font-semibold text-sm hover:-translate-y-0.5 hover:shadow-xl active:scale-95 transition-all duration-200 shadow-lg"
              >
                Upload Resume
              </button>
              <button
                onClick={() => navigate("/interview/mock")}
                className="px-5 py-2.5 rounded-xl bg-white/15 border border-white/30 backdrop-blur-sm text-white font-semibold text-sm hover:bg-white/25 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
              >
                Start Mock Interview
              </button>
            </div>
          </div>
          {/* Minimal AI/resume illustration - decorative only, hidden on small screens where it would just eat space */}
          <div className="hidden md:block flex-shrink-0 w-48 lg:w-56">
            <ResumeAIIllustration className="w-full h-auto" />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileCheck2} label="Total Resumes Analyzed" value={totalResumes} isEmpty={totalResumes === 0} />
        <StatCard icon={TrendIcon} label="Average ATS Score" value={avgAts} trend={atsTrend} isEmpty={totalResumes === 0} />
        <StatCard icon={FileText} label="Cover Letters Generated" value={coverLetterHistory.length} isEmpty={coverLetterHistory.length === 0} />
        <StatCard icon={Mic2} label="Mock Interviews Completed" value={completedInterviews.length} isEmpty={completedInterviews.length === 0} />
      </div>

      {/* Quick Actions */}
      <div ref={quickActionsRef}>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {quickActions.map((a) => <QuickActionCard key={a.title} {...a} />)}
        </div>
      </div>

      {/* Recent Activity (70%) + Quick Insights (30%, sticky) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        <div className="lg:col-span-7 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-xl2 border border-slate-200 dark:border-slate-800 p-5 shadow-glass">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">Recent Activity</h2>
          {loading ? (
            <p className="text-sm text-slate-400 py-6">Loading...</p>
          ) : (
            <ActivityTimeline items={activityFeed} onView={handleViewActivity} onUpload={() => navigate("/upload")} />
          )}
        </div>

        <div className="lg:col-span-3">
          <div className="lg:sticky lg:top-20 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-xl2 border border-slate-200 dark:border-slate-800 p-5 shadow-glass space-y-5">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Quick Insights</h3>

            <div className="flex justify-center">
              <ProgressRing value={profileCompletion} size={88} strokeWidth={7} label="Profile Completion" />
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100"><AnimatedCounter value={totalResumes} /></p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Resumes</p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100"><AnimatedCounter value={avgAts} /></p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Avg ATS Score</p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100"><AnimatedCounter value={coverLetterHistory.length} /></p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Cover Letters</p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100"><AnimatedCounter value={completedInterviews.length} /></p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Interviews</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">Skill Roadmap</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${hasRoadmap ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>
                {hasRoadmap ? "Generated" : "Not Started"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Skill Progress Section - all 4 metrics honestly derived from real data */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-3">Skill Progress</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-xl2 border border-slate-200 dark:border-slate-800 p-5 shadow-glass flex flex-col items-center">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">ATS Improvement</p>
            {atsDelta === null ? (
              <p className="text-sm text-slate-400 py-3">Need 2+ analyses</p>
            ) : (
              <div className="flex items-center gap-2 py-3">
                <span className="text-sm text-slate-400">{firstScore}</span>
                <ArrowRight size={14} className="text-slate-300" />
                <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{latestScore}</span>
                <span className={`text-xs font-bold ${atsDelta >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  ({atsDelta >= 0 ? "+" : ""}{atsDelta})
                </span>
              </div>
            )}
          </div>
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-xl2 border border-slate-200 dark:border-slate-800 p-5 shadow-glass flex flex-col items-center">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Resume Strength</p>
            <ProgressRing value={latestScore} size={72} strokeWidth={6} />
          </div>
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-xl2 border border-slate-200 dark:border-slate-800 p-5 shadow-glass flex flex-col items-center">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Interview Readiness</p>
            <ProgressRing value={interviewReadiness} size={72} strokeWidth={6} />
          </div>
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-xl2 border border-slate-200 dark:border-slate-800 p-5 shadow-glass flex flex-col items-center">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Skill Completion</p>
            <ProgressRing value={skillCompletion} size={72} strokeWidth={6} />
          </div>
        </div>
      </div>

      <FooterCTA onUpload={() => navigate("/upload")} onExplore={scrollToQuickActions} />
    </div>
  );
}

