import api from "../api/axios";

// Several features (Cover Letter, Recruiter Feedback, Skill Gap & Roadmap)
// are scoped to one resume analysis - there's no "generic" version of them.
// From the sidebar/dashboard (no specific analysis in context), the
// sensible default is "act on my most recent resume analysis"; if the user
// has none yet, send them to Upload instead of a dead/empty page.
export async function goToLatestAnalysis(navigate, suffix) {
  try {
    const res = await api.get("/api/analysis/history");
    const history = res.data;
    if (history && history.length > 0) {
      navigate(`/analysis/${history[0].id}/${suffix}`);
    } else {
      navigate("/upload");
    }
  } catch {
    navigate("/upload");
  }
}
