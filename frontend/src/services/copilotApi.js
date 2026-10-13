import api from "../api/axios";

export function improveSection(analysisId, section) {
  return api.post("/api/copilot/improve", { analysis_id: analysisId, section });
}

export function getCopilotHistory() {
  return api.get("/api/copilot/history");
}
