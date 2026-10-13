"""
A curated skills taxonomy used for keyword-based skill matching.

IMPORTANT (be honest about this in your report): this is a rule-based lookup,
not a trained ML model. The TF-IDF + cosine similarity step is the actual ML
component; skill matching is plain string/keyword matching against this list.
Extend this list as needed for the job domains you're demoing.
"""

TECH_SKILLS = [
    "python", "java", "javascript", "typescript", "c++", "c", "c#", "go", "rust",
    "sql", "nosql", "postgresql", "mysql", "mongodb", "redis", "sqlite",
    "react", "react.js", "angular", "vue", "next.js", "node.js", "express",
    "django", "flask", "fastapi", "spring", "spring boot", ".net",
    "html", "css", "sass", "tailwind", "bootstrap",
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "jenkins",
    "ci/cd", "git", "github", "gitlab", "linux", "bash",
    "machine learning", "deep learning", "nlp", "computer vision",
    "tensorflow", "pytorch", "scikit-learn", "keras", "pandas", "numpy",
    "data analysis", "data science", "data engineering", "etl",
    "rest api", "graphql", "microservices", "system design",
    "agile", "scrum", "jira", "postman",
    "html5", "css3", "redux", "webpack", "vite",
    "unit testing", "pytest", "junit", "selenium",
    "kafka", "rabbitmq", "elasticsearch", "spark", "hadoop",
    "power bi", "tableau", "excel",
    "android", "kotlin", "swift", "flutter", "react native",
    "cybersecurity", "networking", "devops", "sre",
]


import re


def find_skills_in_text(text: str) -> set:
    """
    Case-insensitive word-boundary match of taxonomy skills against raw text.

    Plain substring matching breaks on short tokens like "c", "go", or "r"
    (e.g. "c" matching inside "react" or "postgresql"), so each skill is
    matched as a whole word/phrase using \\b boundaries. Skills containing
    symbols like "c++" or "c#" fall back to substring matching since \\b
    doesn't work cleanly around non-word characters.
    """
    text_lower = text.lower()
    found = set()
    for skill in TECH_SKILLS:
        if re.search(r"[^a-z0-9]", skill):
            if skill in text_lower:
                found.add(skill)
        else:
            pattern = r"\b" + re.escape(skill) + r"\b"
            if re.search(pattern, text_lower):
                found.add(skill)
    return found
