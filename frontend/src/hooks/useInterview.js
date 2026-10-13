import { useState, useRef, useCallback, useEffect } from "react";
import {
  startInterview,
  transcribeAudio,
  evaluateAnswer,
  finishInterview,
  getInterviewSession,
} from "../services/interviewService";

const STORAGE_KEY = "ara_mock_interview_session_id";
const MAX_RECORDING_SECONDS = 90;

export function useInterview() {
  const [session, setSession] = useState(null); // {session_id, role, level, total_questions, questions}
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answeredResults, setAnsweredResults] = useState({}); // questionId -> evaluation result

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [transcribing, setTranscribing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [micDenied, setMicDenied] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const lastDurationRef = useRef(0);

  // ---- Resume on refresh: if a session id is saved, reload its state from the backend ----
  useEffect(() => {
    const savedId = localStorage.getItem(STORAGE_KEY);
    if (!savedId) return;

    getInterviewSession(savedId)
      .then((res) => {
        const detail = res.data;
        if (detail.report) {
          // Already finished - nothing to resume into, clear it.
          localStorage.removeItem(STORAGE_KEY);
          return;
        }
        const questions = detail.questions.map((q) => ({
          id: q.id,
          question_number: q.question_number,
          question_text: q.question_text,
          category: q.category,
          difficulty: q.difficulty,
        }));
        const firstUnanswered = detail.questions.findIndex((q) => !q.answer);
        setSession({
          session_id: detail.session.id,
          role: detail.session.role,
          level: detail.session.level,
          total_questions: detail.session.total_questions,
          questions,
        });
        setCurrentIndex(firstUnanswered === -1 ? questions.length : firstUnanswered);
      })
      .catch(() => {
        localStorage.removeItem(STORAGE_KEY);
      });
  }, []);

  const start = useCallback(async ({ role, level, totalQuestions, analysisId }) => {
    setError("");
    const res = await startInterview({ role, level, totalQuestions, analysisId });
    setSession(res.data);
    setCurrentIndex(0);
    setAnsweredResults({});
    localStorage.setItem(STORAGE_KEY, res.data.session_id);
    return res.data;
  }, []);

  const startRecording = useCallback(async () => {
    setError("");
    setTranscript("");
    setMicDenied(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          const next = prev + 1;
          if (next >= MAX_RECORDING_SECONDS) {
            stopRecording();
          }
          return next;
        });
      }, 1000);
    } catch (err) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setMicDenied(true);
        setError("Microphone permission denied. Please allow microphone access to record your answer.");
      } else {
        setError("Could not start recording. Please check your microphone.");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopRecording = useCallback(() => {
    clearInterval(timerRef.current);
    setIsRecording(false);

    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    lastDurationRef.current = recordingSeconds;

    recorder.onstop = async () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });

      if (blob.size === 0) {
        setError("Empty recording - no audio was captured. Please try again.");
        return;
      }

      setTranscribing(true);
      try {
        const res = await transcribeAudio(blob, lastDurationRef.current);
        if (!res.data.transcript) {
          setError("No speech detected in that recording. You can type your answer manually or retake.");
        }
        setTranscript(res.data.transcript || "");
      } catch (err) {
        setError(err.response?.data?.detail || "Transcription failed. You can type your answer manually.");
      } finally {
        setTranscribing(false);
      }
    };
    recorder.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordingSeconds]);

  const retake = useCallback(() => {
    setTranscript("");
    setError("");
    chunksRef.current = [];
    setRecordingSeconds(0);
  }, []);

  const submitAnswer = useCallback(async () => {
    if (!session) return null;
    const question = session.questions[currentIndex];
    setError("");
    setSubmitting(true);
    try {
      const res = await evaluateAnswer(question.id, transcript, lastDurationRef.current);
      setAnsweredResults((prev) => ({ ...prev, [question.id]: res.data }));
      setCurrentIndex((prev) => prev + 1);
      setTranscript("");
      setRecordingSeconds(0);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to evaluate answer. Please try again.");
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [session, currentIndex, transcript]);

  const finish = useCallback(async () => {
    if (!session) return null;
    setError("");
    try {
      const res = await finishInterview(session.session_id);
      localStorage.removeItem(STORAGE_KEY);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to generate final report. Please try again.");
      return null;
    }
  }, [session]);

  const isComplete = session && currentIndex >= session.questions.length;

  return {
    session,
    currentIndex,
    currentQuestion: session?.questions[currentIndex] || null,
    isComplete,
    answeredResults,
    isRecording,
    recordingSeconds,
    maxRecordingSeconds: MAX_RECORDING_SECONDS,
    transcript,
    setTranscript,
    transcribing,
    submitting,
    error,
    micDenied,
    start,
    startRecording,
    stopRecording,
    retake,
    submitAnswer,
    finish,
  };
}
