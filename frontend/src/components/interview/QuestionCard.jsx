import { Mic, Square, RotateCcw, Send, AlertCircle } from "lucide-react";
import RecordingIndicator from "./RecordingIndicator.jsx";
import { InterviewerAvatarIllustration } from "../illustrations/Illustrations.jsx";

export default function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  isRecording,
  recordingSeconds,
  maxRecordingSeconds,
  transcribing,
  transcript,
  setTranscript,
  submitting,
  error,
  micDenied,
  onStartRecording,
  onStopRecording,
  onRetake,
  onSubmit,
}) {
  const hasRecordedSomething = transcript.length > 0 || recordingSeconds > 0;
  const canSubmit = transcript.trim().length > 0 && !isRecording && !transcribing && !submitting;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6 animate-fade-in">
      <div className="flex items-start gap-4">
        <InterviewerAvatarIllustration
          className="w-14 h-14 flex-shrink-0"
          speaking={isRecording}
        />
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
            <span className="text-slate-400">Question {questionNumber} of {totalQuestions}</span>
            <span className="px-2.5 py-0.5 rounded-lg bg-violet-50 text-violet-700 border border-violet-100">
              {question.category}
            </span>
            <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
              {question.difficulty}
            </span>
            <span className="text-slate-400">· Suggested time: ~60s</span>
          </div>
          <p className="text-slate-800 font-semibold text-base leading-relaxed">{question.question_text}</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {micDenied && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Microphone access is blocked. Check your browser's site settings, or type your answer directly below.</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {!isRecording && !transcribing && (
          <button
            onClick={onStartRecording}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold text-xs shadow-sm hover:shadow-glow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <Mic className="w-4 h-4" />
            <span>{hasRecordedSomething ? "Record Again" : "Start Recording"}</span>
          </button>
        )}
        {isRecording && (
          <button
            onClick={onStopRecording}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Stop Recording</span>
          </button>
        )}
        <RecordingIndicator
          isRecording={isRecording}
          seconds={recordingSeconds}
          maxSeconds={maxRecordingSeconds}
          transcribing={transcribing}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Transcript (editable)</label>
        <textarea
          rows={5}
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Your transcribed answer will appear here - you can edit it, or type your answer directly if you prefer not to use voice."
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all resize-none"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onRetake}
          disabled={isRecording || transcribing}
          className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Retake</span>
        </button>
        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-xs shadow-sm hover:shadow-glow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{submitting ? "Evaluating..." : "Submit Answer"}</span>
        </button>
      </div>
    </div>
  );
}
