import type { Job, OutreachDraft, ResumeProfile } from "./api";

export const INPUTS_KEY = "resumeradar:inputs";
export const JOBS_KEY = "resumeradar:jobs";
export const KEYS_KEY = "resumeradar:keys";
const DRAFT_PREFIX = "resumeradar:draft:";

/** A visitor's own provider keys. Both are required for the backend to use them. */
export interface ApiKeys {
  groq: string;
  tavily: string;
}

/**
 * Keys live in sessionStorage, not localStorage: they are secrets, so they
 * should not outlive the tab. The backend uses them per request and never
 * stores them.
 */
export function readKeys(): ApiKeys | null {
  try {
    const raw = sessionStorage.getItem(KEYS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ApiKeys>;
    const groq = (parsed.groq ?? "").trim();
    const tavily = (parsed.tavily ?? "").trim();
    return groq && tavily ? { groq, tavily } : null;
  } catch {
    return null;
  }
}

export function writeKeys(keys: ApiKeys): void {
  try {
    sessionStorage.setItem(
      KEYS_KEY,
      JSON.stringify({ groq: keys.groq.trim(), tavily: keys.tavily.trim() }),
    );
  } catch {
    /* storage unavailable — non-fatal */
  }
}

export function clearKeys(): void {
  try {
    sessionStorage.removeItem(KEYS_KEY);
  } catch {
    /* storage unavailable — non-fatal */
  }
}

export interface StoredInputs {
  profile: ResumeProfile;
  locations: string[];
  job_type: string;
  /** Discipline id from backend/profiles.py; "Auto" infers from the résumé. */
  job_profile?: string;
}

export function readInputs(): StoredInputs | null {
  try {
    const raw = sessionStorage.getItem(INPUTS_KEY);
    return raw ? (JSON.parse(raw) as StoredInputs) : null;
  } catch {
    return null;
  }
}

export function readJobs(): Job[] | null {
  try {
    const raw = sessionStorage.getItem(JOBS_KEY);
    return raw ? (JSON.parse(raw) as Job[]) : null;
  } catch {
    return null;
  }
}

export function writeJobs(jobs: Job[]): void {
  try {
    sessionStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
  } catch {
    /* storage unavailable — non-fatal */
  }
}

/** Cache a drafted outreach per job so re-opening a card costs no LLM call. */
export function readDraft(jobKey: string): OutreachDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_PREFIX + jobKey);
    return raw ? (JSON.parse(raw) as OutreachDraft) : null;
  } catch {
    return null;
  }
}

export function writeDraft(jobKey: string, draft: OutreachDraft): void {
  try {
    sessionStorage.setItem(DRAFT_PREFIX + jobKey, JSON.stringify(draft));
  } catch {
    /* storage unavailable — non-fatal */
  }
}
