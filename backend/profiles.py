"""Job profiles: the field a user wants to work in.

Distinct from ``job_type`` (internship / full-time), which is the *employment*
shape. A profile narrows the search to a discipline so someone whose resume is
full of Python does not get matched to generic "software engineer" postings when
they specifically want GenAI work.

Each profile carries several ``titles`` — the phrases that actually appear in
real postings. They are issued as SEPARATE search queries rather than combined
with OR: probing Tavily showed a single clean phrase returns far more real job
board hits than a synonym-stuffed boolean query (semantic search dilutes when
given alternatives), e.g. "generative AI engineer internship Bangalore" returned
5/7 results on job boards versus 1/10 for the OR-expanded form.

``keywords`` are resume-side skill hints, used to score how well a candidate
suits the profile they picked — not sent to search.
"""

from __future__ import annotations

from dataclasses import dataclass, field

AUTO = "Auto"


@dataclass(frozen=True)
class JobProfile:
    id: str
    label: str
    titles: list[str] = field(default_factory=list)
    keywords: list[str] = field(default_factory=list)


# Ordered as shown in the UI. Titles verified against live search results.
PROFILES: tuple[JobProfile, ...] = (
    JobProfile(
        id="genai",
        label="GenAI / LLM",
        titles=["generative AI engineer", "LLM engineer", "AI engineer"],
        keywords=["llm", "rag", "langchain", "langgraph", "prompt", "openai", "hugging face",
                  "transformers", "vector", "embedding", "chromadb", "pinecone", "ollama",
                  "generative", "genai", "fine-tuning", "agentic"],
    ),
    JobProfile(
        id="ml",
        label="Machine Learning",
        titles=["machine learning engineer", "ML engineer", "applied scientist"],
        keywords=["machine learning", "scikit-learn", "sklearn", "pytorch", "tensorflow",
                  "xgboost", "model training", "feature engineering", "regression",
                  "classification", "reinforcement learning", "deep learning", "keras"],
    ),
    JobProfile(
        id="data-science",
        label="Data Science",
        titles=["data scientist", "data science analyst"],
        keywords=["data science", "pandas", "numpy", "statistics", "sql", "jupyter",
                  "a/b testing", "visualization", "matplotlib", "analytics", "r"],
    ),
    JobProfile(
        id="data-engineering",
        label="Data Engineering",
        titles=["data engineer", "analytics engineer"],
        keywords=["etl", "elt", "spark", "airflow", "dbt", "kafka", "snowflake",
                  "bigquery", "warehouse", "pipeline", "databricks", "sql"],
    ),
    JobProfile(
        id="mlops",
        label="MLOps / Platform",
        titles=["MLOps engineer", "ML platform engineer"],
        keywords=["mlops", "docker", "kubernetes", "ci/cd", "terraform", "aws", "gcp",
                  "azure", "mlflow", "monitoring", "deployment", "kubeflow", "sagemaker"],
    ),
    JobProfile(
        id="cv",
        label="Computer Vision",
        titles=["computer vision engineer", "perception engineer"],
        keywords=["computer vision", "opencv", "yolo", "image", "detection",
                  "segmentation", "cnn", "opencv", "video", "ocr"],
    ),
    JobProfile(
        id="nlp",
        label="NLP",
        titles=["NLP engineer", "natural language processing engineer"],
        keywords=["nlp", "natural language", "spacy", "nltk", "tokenization",
                  "sentiment", "named entity", "text classification", "bert"],
    ),
    JobProfile(
        id="backend",
        label="Backend / API",
        titles=["backend engineer", "software engineer backend"],
        keywords=["fastapi", "django", "flask", "node", "express", "rest", "api",
                  "postgres", "redis", "microservices", "java", "spring", "go"],
    ),
    JobProfile(
        id="fullstack",
        label="Full-Stack",
        titles=["full stack developer", "full stack engineer"],
        keywords=["react", "next.js", "typescript", "javascript", "tailwind", "vue",
                  "frontend", "full stack", "html", "css", "node"],
    ),
    JobProfile(
        id="research",
        label="AI Research",
        titles=["research engineer machine learning", "AI research scientist"],
        keywords=["research", "paper", "publication", "arxiv", "novel", "thesis",
                  "state-of-the-art", "benchmark", "ablation"],
    ),
)

_BY_ID = {p.id: p for p in PROFILES}
# Accept the UI label too, so a client sending "GenAI / LLM" still resolves.
_BY_LABEL = {p.label.lower(): p for p in PROFILES}


def get(profile_id: str | None) -> JobProfile | None:
    """Resolve a profile by id or label. ``None``/``Auto``/unknown -> ``None``."""
    if not profile_id:
        return None
    key = profile_id.strip()
    if not key or key.lower() == AUTO.lower():
        return None
    return _BY_ID.get(key.lower()) or _BY_LABEL.get(key.lower())


def valid_ids() -> list[str]:
    return [AUTO] + [p.id for p in PROFILES]


def infer(skills: list[str], roles: list[str]) -> JobProfile | None:
    """Best-guess profile from a resume, for when the user picks ``Auto``.

    Scores each profile by how many of its keywords appear in the candidate's
    skills and past role titles. Returns ``None`` when nothing matches, so the
    caller falls back to its original skill-derived query.
    """
    haystack = " ".join(skills + roles).lower()
    if not haystack.strip():
        return None

    best: JobProfile | None = None
    best_score = 0
    for profile in PROFILES:
        score = sum(1 for kw in profile.keywords if kw in haystack)
        if score > best_score:
            best, best_score = profile, score
    # One incidental keyword ("sql", "api") is too weak to commit to a discipline.
    return best if best_score >= 2 else None
