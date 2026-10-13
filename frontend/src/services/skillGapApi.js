import api from "../api/axios";

export function generateSkillGap(analysisId) {
  return api.post("/api/skill-gap/generate", { analysis_id: analysisId });
}

export function getSkillGap(analysisId) {
  return api.get(`/api/skill-gap/${analysisId}`);
}

export function regenerateSkillGap(analysisId) {
  return api.post("/api/skill-gap/regenerate", { analysis_id: analysisId });
}