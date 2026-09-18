/**
 * Selectable job disciplines. Mirrors `backend/profiles.py` — keep the ids in
 * step with it; the backend also accepts the label as a fallback.
 *
 * "Auto" means the backend infers the discipline from the résumé.
 */
export const JOB_PROFILES = [
  { id: "Auto", label: "Auto-detect" },
  { id: "genai", label: "GenAI / LLM" },
  { id: "ml", label: "Machine Learning" },
  { id: "data-science", label: "Data Science" },
  { id: "data-engineering", label: "Data Engineering" },
  { id: "mlops", label: "MLOps / Platform" },
  { id: "cv", label: "Computer Vision" },
  { id: "nlp", label: "NLP" },
  { id: "backend", label: "Backend / API" },
  { id: "fullstack", label: "Full-Stack" },
  { id: "research", label: "AI Research" },
] as const;

export const PROFILE_LABELS: Record<string, string> = Object.fromEntries(
  JOB_PROFILES.map((p) => [p.id, p.label]),
);
