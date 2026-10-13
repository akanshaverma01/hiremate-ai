export default function FooterCTA({ onUpload, onExplore }) {
  return (
    <div className="relative overflow-hidden rounded-xl3 bg-brand-gradient text-white p-8 md:p-12 text-center shadow-glow">
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-16 -left-16 w-52 h-52 rounded-full bg-white/10 blur-3xl" />
      <div className="relative max-w-2xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-extrabold">Ready to land your next job?</h2>
        <p className="mt-3 text-white/85 text-sm md:text-base">
          Upload your resume and receive an ATS score, recruiter feedback, AI copilot suggestions,
          interview practice, and a personalized roadmap.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={onUpload}
            className="px-6 py-2.5 rounded-xl bg-white text-brand-purple font-semibold text-sm hover:-translate-y-0.5 active:scale-95 transition-all duration-200 shadow-lg"
          >
            Upload Resume
          </button>
          <button
            onClick={onExplore}
            className="px-6 py-2.5 rounded-xl bg-white/15 border border-white/30 backdrop-blur-sm text-white font-semibold text-sm hover:bg-white/25 active:scale-95 transition-all duration-200"
          >
            Explore Features
          </button>
        </div>
      </div>
    </div>
  );
}
