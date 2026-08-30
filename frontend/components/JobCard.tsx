"use client";

import { useEffect, useState } from "react";
import { Building2, ChevronDown, ExternalLink, Mail, MapPin, Monitor } from "lucide-react";
import {
  draftOutreach,
  generateEmail,
  getErrorMessage,
  type Contact,
  type GeneratedEmail,
  type Job,
  type ResumeProfile,
} from "@/lib/api";
import { readDraft, writeDraft } from "@/lib/storage";
import { externalHref } from "@/lib/url";
import { MatchScoreBadge } from "./MatchScoreBadge";
import { ContactCard } from "./ContactCard";
import { EmailPreview } from "./EmailPreview";
import { Button } from "./Button";

interface Props {
  job: Job;
  profile: ResumeProfile;
}

export function JobCard({ job, profile }: Props) {
  const jobKey = job.url || `${job.company}·${job.title}`;
  const listingHref = externalHref(job.url);

  const [open, setOpen] = useState(false);

  const [contact, setContact] = useState<Contact | null>(null);
  const [email, setEmail] = useState<GeneratedEmail | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [regenerating, setRegenerating] = useState(false);

  // Rehydrate a previously drafted outreach — no API call.
  useEffect(() => {
    const cached = readDraft(jobKey);
    if (cached) {
      setContact(cached.contact);
      setEmail(cached.email);
    }
  }, [jobKey]);

  const hasDraft = email !== null;

  async function draft() {
    setDrafting(true);
    setDraftError("");
    try {
      const result = await draftOutreach(profile, job);
      setContact(result.contact);
      setEmail(result.email);
      writeDraft(jobKey, result);
    } catch (e) {
      setDraftError(getErrorMessage(e, "Could not draft your outreach. Please try again."));
    } finally {
      setDrafting(false);
    }
  }

  async function regenerate() {
    setRegenerating(true);
    setEmailError("");
    try {
      const next = await generateEmail(profile, job, contact ?? { found: false });
      setEmail(next);
      writeDraft(jobKey, { contact: contact ?? { found: false }, email: next });
    } catch (e) {
      setEmailError(getErrorMessage(e, "Could not redraft the email."));
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="rounded-sm border border-ink/50 bg-cream shadow-paper transition-shadow hover:shadow-lift">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start gap-4 p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-corp"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-typewriter text-base text-ink">{job.title}</h3>
            <MatchScoreBadge score={job.match_score} size="sm" />
            {hasDraft && (
              <span className="inline-flex items-center gap-1 rounded-sm border border-sage/60 bg-sage/10 px-1.5 py-0.5 text-[10px] font-typewriter uppercase tracking-wide text-sage">
                <Mail className="h-3 w-3" aria-hidden />
                Draft ready
              </span>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-faded">
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" aria-hidden />
              {job.company}
            </span>
            {job.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                {job.location}
              </span>
            )}
            {job.work_mode && (
              <span className="inline-flex items-center gap-1 capitalize">
                <Monitor className="h-3.5 w-3.5" aria-hidden />
                {job.work_mode}
              </span>
            )}
            {job.posted_date && <span className="italic">Filed {job.posted_date}</span>}
          </div>
          <p className="mt-2.5 text-sm leading-relaxed text-ink/80">{job.match_reason}</p>
        </div>
        <ChevronDown
          className={`mt-1 h-5 w-5 shrink-0 text-faded transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <div className="space-y-5 border-t border-dashed border-ink/40 bg-parchment/50 p-5">
          {listingHref && (
            <a
              href={listingHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-typewriter text-sm uppercase tracking-wide text-corp underline decoration-dotted underline-offset-4 hover:text-stamp"
            >
              <ExternalLink className="h-4 w-4" aria-hidden />
              View job listing
            </a>
          )}

          {!hasDraft && !drafting && (
            <div className="rounded-sm border border-ink/30 bg-cream p-4">
              <p className="text-sm text-faded">
                Ready to reach out? Radar will find a hiring contact and draft an email in
                your voice — one step, when you want it.
              </p>
              {draftError && <p className="mt-2 text-sm italic text-stamp">{draftError}</p>}
              <Button className="mt-3" onClick={draft}>
                <Mail className="h-4 w-4" aria-hidden />
                Draft my outreach
              </Button>
            </div>
          )}

          {(drafting || hasDraft) && (
            <>
              <section>
                <h4 className="mb-2 font-typewriter text-xs uppercase tracking-widest text-faded">
                  Hiring contact
                </h4>
                <ContactCard contact={contact} loading={drafting} />
              </section>

              <section>
                <h4 className="mb-2 font-typewriter text-xs uppercase tracking-widest text-faded">
                  Your outreach email
                </h4>
                <EmailPreview
                  email={email}
                  loading={drafting}
                  regenerating={regenerating}
                  error={emailError}
                  recipientEmail={contact?.found ? contact.email || undefined : undefined}
                  onRegenerate={regenerate}
                />
              </section>
            </>
          )}
        </div>
      )}
    </div>
  );
}
