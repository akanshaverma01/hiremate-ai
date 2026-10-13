function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function RecordingIndicator({ isRecording, seconds, maxSeconds, transcribing }) {
  if (transcribing) {
    return (
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-violet-50 text-violet-700 text-xs font-semibold animate-fade-in">
        <div className="w-3.5 h-3.5 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
        <span>Transcribing your answer...</span>
      </div>
    );
  }

  if (!isRecording) return null;

  const nearLimit = seconds >= maxSeconds - 10;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold animate-fade-in ${
        nearLimit ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"
      }`}
    >
      {/* Tiny waveform, standing in for live audio level - purely decorative */}
      <div className="flex items-end gap-0.5 h-3.5">
        {[0, 120, 60, 180, 30].map((delay, i) => (
          <span
            key={i}
            className={`w-0.5 rounded-full animate-wave ${nearLimit ? "bg-amber-500" : "bg-rose-500"}`}
            style={{ height: "100%", animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
      <span>
        Recording... {formatTime(seconds)} / {formatTime(maxSeconds)}
      </span>
    </div>
  );
}
