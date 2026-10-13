// Merges analysis/cover-letter/mock-interview/skill-gap history into one
// chronologically sorted activity feed for the Dashboard's Recent Activity
// section. Pure function (no React, no fetch) so it can be unit-tested in
// isolation from rendering.
//
// Status values are only ever what the data can actually support:
// - "Completed" for anything that exists as a row (this app's synchronous
//   endpoints don't have a partial/processing state once a row is created).
// - "In Progress" for mock interview sessions with no completed_at - the
//   one genuinely real non-complete state in this data model.
// There is no "Failed" status: this backend surfaces failures as immediate
// HTTP errors, not persisted failed rows, so faking that badge would be
// showing a state that can't actually occur.
export function buildActivityFeed({ analysisHistory = [], coverLetterHistory = [], interviewHistory = [], skillGapHistory = [] }) {
  const analysisById = new Map(analysisHistory.map((a) => [a.id, a]));

  const items = [];

  for (const a of analysisHistory) {
    items.push({
      id: `analysis-${a.id}`,
      type: "resume_analysis",
      title: "ATS Score Generated",
      subtitle: `${a.resume_filename} vs ${a.job_title}`,
      timestamp: a.created_at,
      status: "Completed",
      scoreBadge: Math.round(a.ats_score),
      viewLink: `/analysis/${a.id}`,
    });
  }

  for (const cl of coverLetterHistory) {
    const context = analysisById.get(cl.analysis_id);
    items.push({
      id: `coverletter-${cl.id}`,
      type: "cover_letter",
      title: "Cover Letter Created",
      subtitle: cl.company_name || cl.role_name || context?.job_title || "Untitled role",
      timestamp: cl.created_at,
      status: "Completed",
      scoreBadge: null,
      viewLink: `/analysis/${cl.analysis_id}/cover-letter`,
    });
  }

  for (const iv of interviewHistory) {
    const isComplete = Boolean(iv.completed_at);
    items.push({
      id: `interview-${iv.id}`,
      type: "mock_interview",
      title: "Mock Interview",
      subtitle: `${iv.role} • ${iv.level}`,
      timestamp: iv.started_at,
      status: isComplete ? "Completed" : "In Progress",
      scoreBadge: isComplete ? Math.round(iv.overall_score) : null,
      viewLink: isComplete ? `/interview/report/${iv.id}` : `/interview/mock`,
    });
  }

  for (const sg of skillGapHistory) {
    const context = analysisById.get(sg.analysis_id);
    items.push({
      id: `skillgap-${sg.id}`,
      type: "skill_roadmap",
      title: "Skill Roadmap Generated",
      subtitle: context ? `${context.resume_filename} vs ${context.job_title}` : "Skill gap report",
      timestamp: sg.created_at,
      status: "Completed",
      scoreBadge: sg.skill_gap_analysis?.overall_match_score ?? null,
      viewLink: `/analysis/${sg.analysis_id}/skill-gap`,
    });
  }

  items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return items;
}

export function formatRelativeDay(isoTimestamp) {
  const date = new Date(isoTimestamp);
  const now = new Date();
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / (1000 * 60 * 60 * 24));

  const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (diffDays === 0) return `Today, ${time}`;
  if (diffDays === 1) return `Yesterday, ${time}`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}