import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getInterviewSession } from "../../services/interviewService";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import {
  Award,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  Sparkles,
  AlertCircle
} from "lucide-react";

export default function InterviewReport() {
  const { sessionId } = useParams();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedQ, setExpandedQ] = useState(null);

  useEffect(() => {
    getInterviewSession(sessionId)
      .then((res) => setDetail(res.data))
      .catch(() => setError("Could not load this interview report."))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) return <LoadingSpinner label="Loading interview report..." />;
  if (error)
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl font-medium">
          {error}
        </div>
      </div>
    );

  if (!detail.report) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <EmptyState
          title="This interview session hasn't been finished yet"
          description="Complete all the questions to unlock your full AI performance report."
          ctaLabel="Start a New Interview"
          ctaTo="/interview/mock"
        />
      </div>
    );
  }

  const { report, questions } = detail;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-semibold">
            <Award className="w-3.5 h-3.5" /> Interview Performance Evaluation
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            {report.role}
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            {report.level} Level · {report.total_questions} Questions Completed
          </p>
        </div>

        <Link
          to="/interview/mock"
          className="px-5 py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs transition-all shadow-md shadow-violet-500/20 inline-flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Start New Interview</span>
        </Link>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-2">
        <h3 className="font-bold text-slate-800 text-base">Executive Summary</h3>
        <p className="text-slate-600 text-sm leading-relaxed bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
          {report.summary}
        </p>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-base">
            <CheckCircle2 className="w-5 h-5" />
            <h3>Top Strengths</h3>
          </div>
          <ul className="space-y-2">
            {report.top_strengths.map((s, i) => (
              <li key={i} className="text-xs text-slate-700 bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100/60 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-amber-700 font-bold text-base">
            <AlertTriangle className="w-5 h-5" />
            <h3>Top Areas to Improve</h3>
          </div>
          <ul className="space-y-2">
            {report.top_weaknesses.map((s, i) => (
              <li key={i} className="text-xs text-slate-700 bg-amber-50/50 p-3 rounded-2xl border border-amber-100/60 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Topics to Revise */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-3">
        <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
          <BookOpen className="w-4 h-4 text-violet-600" />
          <h3>Topics to Revise First</h3>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {report.topics_to_revise.map((t) => (
            <span key={t} className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Next Focus & Encouragement */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="space-y-1">
          <h3 className="font-bold text-slate-800 text-base">Next Interview Focus</h3>
          <p className="text-slate-600 text-sm leading-relaxed">{report.next_interview_focus}</p>
        </div>
        <hr className="border-slate-100" />
        <div className="space-y-1">
          <h3 className="font-bold text-violet-700 text-base flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" /> A Note of Encouragement
          </h3>
          <p className="text-slate-600 text-sm leading-relaxed italic bg-violet-50/50 p-4 rounded-2xl border border-violet-100">
            "{report.motivational_feedback}"
          </p>
        </div>
      </div>

      {/* Detailed Question Breakdown */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
        <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-3">
          Question-by-Question Detailed Breakdown
        </h3>

        <div className="space-y-4">
          {questions.map((q) => (
            <div key={q.id} className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-xl bg-violet-50 text-violet-700 border border-violet-200 text-xs font-bold">
                  {q.category}
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                  {q.difficulty}
                </span>
              </div>

              <p className="text-slate-800 text-sm font-semibold">{q.question_text}</p>

              {q.answer ? (
                <div className="space-y-3 pt-1">
                  <p className="text-xs text-slate-600 italic bg-white p-3 rounded-xl border border-slate-200">
                    <strong className="text-slate-800 not-italic">Your Answer: </strong>
                    {q.answer.transcript || "(no answer given)"}
                  </p>

                  <button
                    onClick={() => setExpandedQ(expandedQ === q.id ? null : q.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{expandedQ === q.id ? "Hide Details" : "Show Full Evaluation"}</span>
                    {expandedQ === q.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {expandedQ === q.id && (
                    <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs space-y-3 animate-fade-in">
                      <p className="text-slate-700">
                        <strong className="text-violet-700">Ideal Answer:</strong> {q.answer.ideal_answer}
                      </p>
                      {q.answer.follow_up_question && (
                        <p className="text-slate-700">
                          <strong className="text-indigo-700">Expected Follow-up:</strong> {q.answer.follow_up_question}
                        </p>
                      )}
                      {q.answer.missing_points?.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-rose-600 font-bold block text-[11px]">Missing Key Points</span>
                          <div className="flex flex-wrap gap-1.5">
                            {q.answer.missing_points.map((m) => (
                              <span key={m} className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-100 text-[11px]">
                                {m}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Not answered.</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}