import type { Job, OutreachDraft, ResumeProfile } from "./api";

export const INPUTS_KEY = "resumeradar:inputs";
export const JOBS_KEY = "resumeradar:jobs";
const DRAFT_PREFIX = "resumeradar:draft:";

export interface StoredInputs {
  profile: ResumeProfile;
  locations: string[];
  job_type: string;
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
