from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.ml.text_processing import clean_text
from app.ml.skills_dictionary import find_skills_in_text


def compute_ats_score(resume_text: str, jd_text: str) -> float:
    """
    Vectorizes cleaned resume + JD text with TF-IDF and returns the cosine
    similarity between them, scaled to 0-100.

    Note: this measures lexical/keyword overlap, not resume "quality" or
    genuine ATS parsing behavior. Two well-matched documents that use
    different vocabulary for the same skills can still score low.
    """
    resume_clean = clean_text(resume_text)
    jd_clean = clean_text(jd_text)

    if not resume_clean.strip() or not jd_clean.strip():
        return 0.0

    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform([resume_clean, jd_clean])
    similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]

    score = round(float(similarity) * 100, 2)
    return min(max(score, 0.0), 100.0)


def analyze_skills(resume_text: str, jd_text: str):
    """
    matched     = skills present in both resume and JD
    missing     = skills the JD asks for that the resume doesn't mention
    recommended = the highest-priority subset of `missing` to add first

    Note: "recommended" is not a separate ML signal - there's no trained
    model or co-occurrence data behind it. It's simply the top N missing
    skills. Presenting it as a distinct feature in a demo is fine, but don't
    describe it as a different algorithm than missing-skill detection.
    """
    resume_skills = find_skills_in_text(resume_text)
    jd_skills = find_skills_in_text(jd_text)

    matched = sorted(resume_skills & jd_skills)
    missing = sorted(jd_skills - resume_skills)
    recommended = missing[:5]

    return matched, missing, recommended


def generate_suggestions(score: float, missing_skills: list) -> str:
    suggestions = []
    if score < 40:
        suggestions.append(
            "Your resume's keyword overlap with this job description is low. "
            "Consider rewriting your summary and experience bullets to explicitly "
            "mention the technologies and responsibilities listed in the job description."
        )
    elif score < 70:
        suggestions.append(
            "Moderate match. Tailor a few bullet points to mirror the exact "
            "terminology used in the job description (e.g., tool names, methodologies)."
        )
    else:
        suggestions.append("Strong keyword match with this job description.")

    if missing_skills:
        top_missing = ", ".join(missing_skills[:8])
        suggestions.append(f"Consider adding or highlighting these skills if you have them: {top_missing}.")

    return " ".join(suggestions)
