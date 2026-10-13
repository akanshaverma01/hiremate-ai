import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Search, Bell, Sun, Moon, User, LogOut, ChevronDown, X } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

const TODAY = new Date().toLocaleDateString(undefined, {
  weekday: "short", month: "short", day: "numeric", year: "numeric",
});

export default function Topbar({ onOpenMobileSidebar }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const [searchValue, setSearchValue] = useState("");

  const initials = (user?.full_name || "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Close the profile dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // There's no dedicated search API, so this searches the Resume History
  // page's already-loaded data (resume analyses, Copilot generations, mock
  // interviews) client-side via a ?q= param, rather than adding a new
  // backend endpoint.
  const runSearch = () => {
    const term = searchValue.trim();
    if (!term) return;
    navigate(`/history?q=${encodeURIComponent(term)}`);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") runSearch();
    if (e.key === "Escape") setSearchValue("");
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-4 h-16 px-4 md:px-6">
        <button
          onClick={onOpenMobileSidebar}
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        {/* Search - filters Resume History (resumes, Copilot generations, mock interviews) on Enter */}
        <div className="hidden md:flex items-center flex-1 max-w-sm">
          <div className="relative w-full">
            <button
              onClick={runSearch}
              aria-label="Search"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-500 transition-colors cursor-pointer"
            >
              <Search size={16} />
            </button>
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search resumes, letters..."
              title="Press Enter to search your resume history, cover letters and interviews"
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-violet/40 focus:border-brand-violet transition-all"
            />
            {searchValue && (
              <button
                onClick={() => setSearchValue("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Today's date */}
          <span className="hidden lg:block text-xs font-medium text-slate-400 dark:text-slate-500 mr-1">
            {TODAY}
          </span>

          {/* Notifications - UI only, no backend notification system exists yet */}
          <div className="relative">
            <button
              onClick={() => { setNotifOpen((o) => !o); setProfileOpen(false); }}
              className="relative flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Notifications"
              aria-expanded={notifOpen}
            >
              <Bell size={18} />
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-glass p-4 text-sm text-slate-500 dark:text-slate-400 animate-fade-in">
                No new notifications.
              </div>
            )}
          </div>

          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* Profile avatar dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => { setProfileOpen((o) => !o); setNotifOpen(false); }}
              className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-expanded={profileOpen}
              aria-label="Profile menu"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-brand-purple to-brand-blue text-white text-xs font-bold">
                {initials}
              </div>
              <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-glass py-1.5 animate-fade-in">
                <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{user?.full_name}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => { setProfileOpen(false); navigate("/profile"); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <User size={15} /> Profile & Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <LogOut size={15} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
