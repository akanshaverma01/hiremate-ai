import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, FileUp, History, FileText, UserCheck,
  Sparkles, Mic, Compass, Settings, LogOut, ChevronLeft, ChevronRight, X, ArrowRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { goToLatestAnalysis } from "../utils/analysisNav.js";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/", match: (p) => p === "/" },
  { label: "Resume Analyzer", icon: FileUp, to: "/upload", match: (p) => p.startsWith("/upload") },
  { label: "Resume History", icon: History, to: "/history", match: (p) => p.startsWith("/history") },
  { label: "Cover Letter Generator", icon: FileText, action: "cover-letter", match: (p) => p.includes("/cover-letter") },
  { label: "AI Recruiter Feedback", icon: UserCheck, action: "recruiter-feedback", match: (p) => p.includes("/recruiter-feedback") },
  { label: "AI Copilot", icon: Sparkles, to: "/copilot", match: (p) => p.startsWith("/copilot") },
  { label: "Mock Interview", icon: Mic, to: "/interview/mock", match: (p) => p.startsWith("/interview") },
  // "Skill Gap Analyzer" and "Learning Roadmap" are the same page in this
  // app (the roadmap is a section of the skill gap report), so this is one
  // combined entry rather than two links to the same place.
  { label: "Skill Gap & Roadmap", icon: Compass, action: "skill-gap", match: (p) => p.includes("/skill-gap") },
  // "Settings" reuses the existing Profile page (account info + resume
  // management already lives there) rather than a near-duplicate new page.
  { label: "Settings", icon: Settings, to: "/profile", match: (p) => p.startsWith("/profile") },
];

/** Bottom-of-sidebar promo card. Purely a navigation shortcut (links to the
 * AI Copilot page, same route already in NAV_ITEMS) - no new functionality. */
function AiPromoCard({ collapsed, onNavigate }) {
  if (collapsed) return null;
  return (
    <button
      onClick={onNavigate}
      className="group relative w-full text-left overflow-hidden rounded-2xl p-3.5 bg-gradient-to-br from-violet-700 via-violet-600 to-fuchsia-600 shadow-lg hover:shadow-glow transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
    >
      {/* Abstract glowing wave backdrop */}
      <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 220 140" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 90 Q 55 60 110 85 T 220 70" stroke="white" strokeOpacity="0.5" strokeWidth="2" fill="none" />
        <path d="M0 115 Q 55 95 110 115 T 220 105" stroke="white" strokeOpacity="0.3" strokeWidth="2" fill="none" />
      </svg>
      <div className="absolute -right-6 -top-8 w-24 h-24 rounded-full bg-white/20 blur-2xl group-hover:bg-white/30 transition-colors" />

      <div className="relative space-y-2">
        <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-snug">Build a better career with AI</p>
          <p className="text-[11px] text-white/75 mt-1 leading-snug">Smarter insights. Better opportunities.</p>
        </div>
        <div className="flex justify-end pt-0.5">
          <span className="w-8 h-8 rounded-full bg-white text-violet-700 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
            <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </button>
  );
}

export default function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const handleClick = (item) => {
    onCloseMobile();
    if (item.to) navigate(item.to);
    else if (item.action) goToLatestAnalysis(navigate, item.action);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed md:sticky top-0 h-screen z-50 md:z-0
          bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
          flex flex-col overflow-hidden transition-all duration-300 ease-in-out
          ${collapsed ? "md:w-20" : "md:w-72"}
          w-72
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between px-4 h-16 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          {!collapsed ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Sparkles className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="min-w-0 leading-tight">
                <p className="font-extrabold text-[15px] text-slate-800 dark:text-white truncate">
                  HireMate <span className="text-violet-500">AI</span>
                </p>
                <p className="text-[10.5px] text-slate-400 dark:text-slate-500 truncate">Your AI Career Companion</p>
              </div>
            </div>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 flex items-center justify-center mx-auto shadow-sm">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <button
            onClick={onCloseMobile}
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* min-h-0 is required here: a flex child with overflow-y-auto won't
            actually scroll inside a flex-column parent without it - without
            this, the nav list grows past the available height and the promo
            card / Logout below it overlap the last nav items instead of
            sitting cleanly underneath. */}
        <nav className="flex-1 min-h-0 overflow-y-auto py-3 px-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.match(location.pathname);
            return (
              <button
                key={item.label}
                onClick={() => handleClick(item)}
                aria-current={isActive ? "page" : undefined}
                title={collapsed ? item.label : undefined}
                className={`
                  group w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium
                  transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet
                  ${collapsed ? "md:justify-center" : ""}
                  ${isActive
                    ? "bg-gradient-to-r from-brand-purple to-brand-indigo text-white shadow-glow"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:translate-x-0.5"}
                `}
              >
                <Icon
                  size={18}
                  className={`shrink-0 transition-transform duration-200 ${!isActive ? "group-hover:scale-110" : ""}`}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-2.5 border-t border-slate-200 dark:border-slate-800 space-y-2.5 flex-shrink-0">
          <AiPromoCard collapsed={collapsed} onNavigate={() => { onCloseMobile(); navigate("/copilot"); }} />
          <button
            onClick={handleLogout}
            title={collapsed ? "Logout" : undefined}
            className={`
              w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium
              text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors
              ${collapsed ? "md:justify-center" : ""}
            `}
          >
            <LogOut size={19} className="shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
