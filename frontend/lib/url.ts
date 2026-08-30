/**
 * Job and contact URLs originate from LLM output. A crafted résumé could try to
 * prompt-inject a `javascript:` / `data:` URL that would then render as a
 * clickable link in the ResumeRadar origin. Only allow plain http(s).
 */
export function externalHref(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const url = raw.trim();
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return parsed.toString();
  } catch {
    /* not an absolute URL */
  }
  return undefined;
}

/** Same idea for the mailto: link on a contact's email. */
export function mailtoHref(email?: string | null): string | undefined {
  if (!email) return undefined;
  const trimmed = email.trim();
  // conservative address shape; no header-injection characters
  if (/^[^\s@,;:<>"()]+@[^\s@,;:<>"()]+\.[^\s@,;:<>"()]+$/.test(trimmed)) {
    return `mailto:${trimmed}`;
  }
  return undefined;
}
