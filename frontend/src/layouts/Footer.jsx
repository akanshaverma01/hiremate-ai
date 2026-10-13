import { Sparkles, Linkedin, Github, Twitter, Youtube } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-white/5 px-4 md:px-6 lg:px-8 py-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
          <span className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-600 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-3 h-3 text-white" />
          </span>
          <span className="font-semibold text-slate-500 dark:text-slate-300">HireMate AI</span>
          <span className="hidden sm:inline">· Empowering your career with AI</span>
        </div>

        <div className="flex items-center gap-4 text-slate-400 dark:text-slate-500">
          <a href="#" className="hover:text-violet-500 dark:hover:text-violet-300 transition-colors">Privacy</a>
          <a href="#" className="hover:text-violet-500 dark:hover:text-violet-300 transition-colors">Terms</a>
          <a href="#" className="hover:text-violet-500 dark:hover:text-violet-300 transition-colors">Help</a>
          <span className="w-px h-3.5 bg-slate-200 dark:bg-white/10" />
          <div className="flex items-center gap-3">
            <Linkedin className="w-3.5 h-3.5 hover:text-violet-500 dark:hover:text-violet-300 transition-colors cursor-pointer" />
            <Github className="w-3.5 h-3.5 hover:text-violet-500 dark:hover:text-violet-300 transition-colors cursor-pointer" />
            <Twitter className="w-3.5 h-3.5 hover:text-violet-500 dark:hover:text-violet-300 transition-colors cursor-pointer" />
            <Youtube className="w-3.5 h-3.5 hover:text-violet-500 dark:hover:text-violet-300 transition-colors cursor-pointer" />
          </div>
        </div>
      </div>
    </footer>
  );
}
