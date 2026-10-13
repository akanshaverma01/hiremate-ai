import api from "../api/axios";

export function startInterview({ role, level, totalQuestions, analysisId }) {
  return api.post("/api/interview/start", {
    role,
    level,
    total_questions: totalQuestions,
    analysis_id: analysisId || undefined,
  });
}

export function transcribeAudio(audioBlob, durationSeconds) {
  const formData = new FormData();
  formData.append("file", audioBlob, "answer.webm");
  formData.append("duration_seconds", durationSeconds ?? "");
  return api.post("/api/interview/transcribe", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export function evaluateAnswer(questionId, transcript, durationSeconds) {
  return api.post("/api/interview/evaluate-answer", {
    question_id: questionId,
    transcript,
    duration_seconds: durationSeconds,
  });
}

export function finishInterview(sessionId) {
  return api.post("/api/interview/finish", { session_id: sessionId });
}

export function getInterviewHistory() {
  return api.get("/api/interview/history");
}

export function getInterviewSession(sessionId) {
  return api.get(`/api/interview/session/${sessionId}`);
}