import api from "../api/axios";

export function generateCoverLetter(analysisId) {
  return api.post("/api/cover-letter/generate", { analysis_id: analysisId });
}

export function getCoverLetter(analysisId) {
  return api.get(`/api/cover-letter/${analysisId}`);
}

export function regenerateCoverLetter(analysisId) {
  return api.post("/api/cover-letter/regenerate", { analysis_id: analysisId });
}
