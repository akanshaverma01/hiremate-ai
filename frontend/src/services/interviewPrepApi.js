import api from "../api/axios";

export function generateInterviewPrep(analysisId, difficulty, role) {
  return api.post("/api/interview-prep/generate", { analysis_id: analysisId, difficulty, role: role || undefined });
}

export function getInterviewPrepHistory(analysisId) {
  const params = analysisId ? { analysis_id: analysisId } : {};
  return api.get("/api/interview-prep/history", { params });
}

export function getInterviewPrepSession(sessionId) {
  return api.get(`/api/interview-prep/session/${sessionId}`);
}
