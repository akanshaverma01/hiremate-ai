import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useInterview } from "../../hooks/useInterview";
import { useFormPersist } from "../../hooks/useFormPersist";
import QuestionCard from "../../components/interview/QuestionCard.jsx";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import ConfirmModal from "../../components/ConfirmModal.jsx";
import { InterviewerAvatarIllustration } from "../../components/illustrations/Illustrations.jsx";
import {
  Mic,
  Sparkles,
  Award,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  BarChart2,
  StopCircle
} from "lucide-react";

function QuickFeedback({ result, onContinue, isLastQuestion }) {
  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl space-y-6 animate-fade-in">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Answer Evaluated</h3>
            <p className="text-xs text-slate-400">Instant AI response performance metrics</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center space-y-1">
          <span className="text-xs text-slate-400 font-semibold uppercase block">Technical</span>
          <strong className="text-xl font-extrabold text-violet-700">{result.technical_score}/10</strong>
        </div>
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center space-y-1">
          <span className="text-xs text-slate-400 font-semibold uppercase block">Comm.</span>
          <strong className="text-xl font-extrabold text-indigo-700">{result.communication_score}/10</strong>
        </div>
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center space-y-1">
          <span className="text-xs text-slate-400 font-semibold uppercase block">Clarity</span>
          <strong className="text-xl font-extrabold text-purple-700">{result.clarity_score}/10</strong>
        </div>
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center space-y-1">
          <span className="text-xs text-slate-400 font-semibold uppercase block">Confidence</span>
          <strong className="text-xl font-extrabold text-emerald-700">{result.confidence_score}/10</strong>
        </div>
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center space-y-1">
          <span className="text-xs text-slate-400 font-semibold uppercase block">Complete</span>
          <strong className="text-xl font-extrabold text-amber-700">{result.completeness_score}/10</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 space-y-2">
          <h4 className="font-bold text-emerald-800 flex items-center gap-1.5 text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Key Strengths
          </h4>
          <ul className="space-y-1.5 list-disc list-inside text-slate-700">
            {result.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>

        <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-100 space-y-2">
          <h4 className="font-bold text-amber-800 flex items-center gap-1.5 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600" /> Could Improve
          </h4>
          <ul className="space-y-1.5 list-disc list-inside text-slate-700">
            {result.improvements.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      </div>

      {result.follow_up_question && (
        <div className="p-4 rounded-2xl bg-violet-50 border border-violet-100 text-xs space-y-1">
          <span className="font-bold text-violet-800 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-violet-600" /> Potential Follow-up Question
          </span>
          <p className="text-slate-700 italic">{result.follow_up_question}</p>
        </div>
      )}

      <button
        onClick={onContinue}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-violet-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        <span>{isLastQuestion ? "See Final Report" : "Continue to Next Question"}</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function MockInterview() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const analysisId = searchParams.get("analysis_id") || null;

  // Auto-Save Form State Hook Integration
  const {
    formData,
    handleChange,
    resetForm
  } = useFormPersist("mock_interview_form", {
    role: "",
    level: "Junior",
    totalQuestions: 5
  });

  const interview = useInterview();
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");
  const [reviewingResult, setReviewingResult] = useState(null);
  const [finishing, setFinishing] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const handleStart = async () => {
    if (!formData.role.trim()) {
      setStartError("Please enter a target role.");
      return;
    }
    setStartError("");
    setStarting(true);
    try {
      await interview.start({
        role: formData.role,
        level: formData.level,
        totalQuestions: Number(formData.totalQuestions),
        analysisId
      });
      // Session successfully start hone par form state clear kar do
      resetForm();
    } catch (err) {
      setStartError(err.response?.data?.detail || "Failed to start interview. Please try again.");
    } finally {
      setStarting(false);
    }
  };

  const handleSubmit = async () => {
    const result = await interview.submitAnswer();
    if (result) setReviewingResult(result);
  };

  const handleContinue = () => setReviewingResult(null);

  const handleFinish = async () => {
    setFinishing(true);
    const report = await interview.finish();
    setFinishing(false);
    if (report) navigate(`/interview/report/${report.session_id}`);
  };

  // Lets the user stop before answering every question - the backend
  // already supports generating a report from whatever's been answered so
  // far (it only rejects finishing with zero answered questions), this just
  // exposes that as a button instead of forcing all questions to be done.
  const handleEndEarly = () => setShowEndConfirm(true);

  const confirmEndEarly = async () => {
    setShowEndConfirm(false);
    await handleFinish();
  };

  const answeredCount = interview.currentIndex;
  const totalCount = interview.session?.total_questions ?? 0;
  const endModal = (
    <ConfirmModal
      open={showEndConfirm}
      title="End this interview now?"
      message={`You've answered ${answeredCount} of ${totalCount} question${totalCount === 1 ? "" : "s"}. Your report will be based only on what you've completed so far.`}
      confirmLabel="End & Get Report"
      cancelLabel="Keep Going"
      onConfirm={confirmEndEarly}
      onCancel={() => setShowEndConfirm(false)}
    />
  );

  if (!interview.session) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 p-8 text-white shadow-xl">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5">
            <InterviewerAvatarIllustration className="w-16 h-16 flex-shrink-0" />
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-violet-100 text-xs font-semibold uppercase tracking-wider">
                <Mic className="w-3.5 h-3.5" /> Interactive Voice Session
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                AI Mock Interview
              </h1>
              <p className="text-violet-100 text-sm opacity-90">
                Practice a real voice-based interview with instant AI feedback on every answer.
              </p>
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/8 rounded-full blur-3xl pointer-events-none" />
        </div>

        {startError && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium shadow-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
            <span>{startError}</span>
          </div>
        )}

        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Target Role
              </label>
              <input
                type="text"
                name="role"
                value={formData.role}
                onChange={handleChange}
                placeholder="e.g. Senior Frontend Developer"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Experience Level
                </label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="Fresher">Fresher</option>
                  <option value="Junior">Junior</option>
                  <option value="Mid">Mid-level</option>
                  <option value="Senior">Senior</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Number of Questions
                </label>
                <select
                  name="totalQuestions"
                  value={formData.totalQuestions}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all cursor-pointer"
                >
                  <option value={5}>5 questions (~15 min)</option>
                  <option value={10}>10 questions (~30 min)</option>
                  <option value={12}>12 questions (~35 min)</option>
                </select>
              </div>
            </div>

            {analysisId && (
              <div className="p-3 rounded-2xl bg-violet-50 border border-violet-100 text-xs text-violet-700 font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-600" />
                <span>Personalized using your selected resume analysis.</span>
              </div>
            )}
          </div>

          <button
            onClick={handleStart}
            disabled={starting}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-violet-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Mic className="w-5 h-5" />
            <span>{starting ? "Generating questions..." : "Start Interview Session"}</span>
          </button>
        </div>
      </div>
    );
  }

  if (interview.isComplete && !reviewingResult) {
    if (finishing) return <LoadingSpinner label="Generating your final interview report..." />;
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
        <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto animate-pop">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800">Interview Complete!</h3>
          <p className="text-slate-500 text-sm">
            You've successfully answered all {interview.session.total_questions} questions.
          </p>
          <button
            onClick={handleFinish}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-indigo-700 transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <BarChart2 className="w-4 h-4" />
            <span>Generate Final Performance Report</span>
          </button>
        </div>
      </div>
    );
  }

  // Ending early from the feedback screen: show the report-generating
  // spinner here too (the check further down is only reached from the
  // question screen).
  if (reviewingResult && finishing) {
    return <LoadingSpinner label="Generating your final interview report..." />;
  }

  if (reviewingResult) {
    const isLast = interview.currentIndex >= interview.session.questions.length;
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-violet-700 font-bold text-lg">
            <Mic className="w-5 h-5" />
            <h2>AI Mock Interview Session</h2>
          </div>
          {/* The answer just submitted is already counted (currentIndex has
              advanced), so ending here reports on everything answered so far.
              Hidden on the last question - Continue leads straight to the
              normal finish screen there. */}
          {!isLast && (
            <button
              onClick={handleEndEarly}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-xs font-semibold transition-colors cursor-pointer"
            >
              <StopCircle className="w-3.5 h-3.5" />
              End Interview
            </button>
          )}
        </div>
        <QuickFeedback result={reviewingResult} onContinue={handleContinue} isLastQuestion={isLast} />
        {endModal}
      </div>
    );
  }

  if (finishing) return <LoadingSpinner label="Generating your final interview report..." />;

  const progress = Math.round((interview.currentIndex / interview.session.total_questions) * 100);
  const hasAnsweredAtLeastOne = interview.currentIndex >= 1;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-bold text-slate-500">
          <span className="flex items-center gap-1.5 text-slate-800">
            <Mic className="w-4 h-4 text-violet-600" /> Active Question ({interview.currentIndex + 1} of {interview.session.total_questions})
          </span>
          <span className="text-violet-600 font-bold">{progress}% Progress</span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
          <div
            className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {hasAnsweredAtLeastOne && (
          <div className="flex justify-end">
            <button
              onClick={handleEndEarly}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
            >
              <StopCircle className="w-3.5 h-3.5" />
              End Interview Early
            </button>
          </div>
        )}
      </div>

      <QuestionCard
        question={interview.currentQuestion}
        questionNumber={interview.currentIndex + 1}
        totalQuestions={interview.session.total_questions}
        isRecording={interview.isRecording}
        recordingSeconds={interview.recordingSeconds}
        maxRecordingSeconds={interview.maxRecordingSeconds}
        transcribing={interview.transcribing}
        transcript={interview.transcript}
        setTranscript={interview.setTranscript}
        submitting={interview.submitting}
        error={interview.error}
        micDenied={interview.micDenied}
        onStartRecording={interview.startRecording}
        onStopRecording={interview.stopRecording}
        onRetake={interview.retake}
        onSubmit={handleSubmit}
      />
      {endModal}
    </div>
  );
}