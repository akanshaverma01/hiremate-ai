export default function QuickActionCard({ icon: Icon, title, description, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group text-left w-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-xl2 border border-slate-200 dark:border-slate-800 p-5 shadow-glass transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-brand-violet/40 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet animate-slide-up"
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-purple/10 to-brand-blue/10 dark:from-brand-purple/20 dark:to-brand-blue/20 flex items-center justify-center text-brand-indigo transition-colors duration-200 group-hover:bg-gradient-to-br group-hover:from-brand-purple group-hover:to-brand-blue group-hover:text-white">
        <Icon size={19} />
      </div>
      <p className="mt-3 font-semibold text-sm text-slate-800 dark:text-slate-100">{title}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
    </button>
  );
}