import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const client = axios.create({ baseURL: API_URL, timeout: 120000 });

export function statusOf(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (error.code === "ECONNABORTED") return "The request timed out. Please try again.";
    if (!error.response) return "Cannot reach the server. Check your connection and try again.";
  }
  return fallback;
}

export interface ResumeProfile {
  full_name: string;
  email: string;
  phone: string;
  skills: string[];
  experience: { company: string; role: string; duration: string; description: string }[];
  education: { institution: string; degree: string; year: string }[];
  projects: string[];
}

export interface Job {
  title: string;
  company: string;
  location: string;
  work_mode: string;
  match_score: number;
  match_reason: string;
  posted_date: string;
  url: string;
}

export interface Contact {
  found: boolean;
  name?: string;
  title?: string;
  linkedin_url?: string;
  email?: string;
  confidence?: string;
}

export interface GeneratedEmail {
  subject: string;
  body: string;
}

export interface OutreachDraft {
  contact: Contact;
  email: GeneratedEmail;
}

export async function checkHealth(): Promise<{ status: string }> {
  const { data } = await client.get("/health");
  return data;
}

export async function parseResume(file: File): Promise<ResumeProfile> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await client.post("/parse-resume", form);
  return data;
}

export async function matchJobs(
  profile: ResumeProfile,
  locations: string[],
  jobType: string,
): Promise<Job[]> {
  const { data } = await client.post("/match-jobs", {
    profile,
    locations,
    job_type: jobType,
  });
  return data;
}

/**
 * One backend call: finds a hiring contact and drafts a first-person outreach
 * email for the role. Replaces separate findContact + generateEmail calls so the
 * user spends one LLM call per role they act on.
 */
export async function draftOutreach(profile: ResumeProfile, job: Job): Promise<OutreachDraft> {
  const { data } = await client.post("/draft-outreach", { profile, job });
  return data;
}

/** Email-only redraft, reusing an already-known contact (the "Regenerate" button). */
export async function generateEmail(
  profile: ResumeProfile,
  job: Job,
  contact: Contact,
): Promise<GeneratedEmail> {
  const { data } = await client.post("/generate-email", { profile, job, contact });
  return data;
}
