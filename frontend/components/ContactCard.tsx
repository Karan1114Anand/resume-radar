import { BadgeCheck, Linkedin, Mail, UserRound, UserX } from "lucide-react";
import type { Contact } from "@/lib/api";
import { externalHref, mailtoHref } from "@/lib/url";

interface Props {
  contact: Contact | null;
  loading: boolean;
  error?: string;
}

const confidenceStyle: Record<string, string> = {
  Verified: "border-sage text-sage",
  Likely: "border-corp text-corp",
  Estimated: "border-coffee text-coffee",
};

export function ContactCard({ contact, loading, error }: Props) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 font-typewriter text-sm text-faded">
        <span className="animate-type-blink">|</span>
        Checking the Rolodex…
      </div>
    );
  }

  if (error) {
    return <p className="text-sm italic text-stamp">{error}</p>;
  }

  if (!contact || !contact.found) {
    return (
      <div className="flex items-center gap-2 text-sm italic text-faded">
        <UserX className="h-4 w-4" aria-hidden />
        No contact on file — try the company&apos;s careers page or LinkedIn directly.
      </div>
    );
  }

  const linkedin = externalHref(contact.linkedin_url);
  const mailto = mailtoHref(contact.email);

  return (
    <div className="flex flex-wrap items-start justify-between gap-3 rounded-sm border border-ink/40 bg-parchment p-3">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-sm border border-ink/40 bg-cream text-corp">
          <UserRound className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="font-typewriter text-sm text-ink">{contact.name}</p>
          {contact.title && <p className="text-xs italic text-faded">{contact.title}</p>}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            {linkedin && (
              <a
                href={linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-typewriter uppercase tracking-wide text-corp underline decoration-dotted underline-offset-4 hover:text-stamp"
              >
                <Linkedin className="h-3.5 w-3.5" aria-hidden />
                LinkedIn
              </a>
            )}
            {mailto && (
              <a
                href={mailto}
                className="inline-flex items-center gap-1 font-typewriter text-corp underline decoration-dotted underline-offset-4 hover:text-stamp"
              >
                <Mail className="h-3.5 w-3.5" aria-hidden />
                {contact.email}
              </a>
            )}
          </div>
        </div>
      </div>
      {contact.confidence && (
        <span
          className={`inline-flex -rotate-3 items-center gap-1 rounded-sm border-2 border-dashed bg-cream/70 px-2 py-0.5 font-typewriter text-[11px] uppercase tracking-wider ${
            confidenceStyle[contact.confidence] ?? confidenceStyle.Estimated
          }`}
        >
          <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
          {contact.confidence}
        </span>
      )}
    </div>
  );
}
