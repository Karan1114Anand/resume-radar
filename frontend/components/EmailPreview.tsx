"use client";

import { useState } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";
import { Button } from "./Button";
import type { GeneratedEmail } from "@/lib/api";

interface Props {
  email: GeneratedEmail | null;
  loading: boolean;
  regenerating?: boolean;
  error?: string;
  recipientEmail?: string;
  onRegenerate: () => void;
}

export function EmailPreview({
  email,
  loading,
  regenerating,
  error,
  recipientEmail,
  onRegenerate,
}: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!email) return;
    await navigator.clipboard.writeText(`Subject: ${email.subject}\n\n${email.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-sm border border-ink/40 bg-parchment px-4 py-4 font-typewriter text-sm text-faded">
        <span className="animate-type-blink">|</span>
        Typing up a draft…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-sm border border-stamp/50 bg-stamp/10 p-4 text-sm text-ink">
        {error}{" "}
        <button onClick={onRegenerate} className="font-typewriter uppercase text-stamp underline underline-offset-4">
          Try again
        </button>
      </div>
    );
  }

  if (!email) return null;

  return (
    <div className="rounded-sm border border-ink/50 bg-cream shadow-paper">
      <div className="space-y-1 border-b border-ink/30 bg-parchment px-4 py-2.5 text-xs text-ink">
        <p className="font-typewriter uppercase tracking-[0.2em] text-faded">Memorandum</p>
        {recipientEmail && (
          <p>
            <span className="font-typewriter uppercase">To:</span> {recipientEmail}
          </p>
        )}
        <p>
          <span className="font-typewriter uppercase">Re:</span>{" "}
          <span className="font-typewriter text-ink">{email.subject}</span>
        </p>
      </div>
      <p className="whitespace-pre-wrap px-4 py-4 text-sm leading-relaxed text-ink">{email.body}</p>
      <div className="flex flex-wrap gap-2 border-t border-ink/30 bg-parchment px-4 py-3">
        <Button size="sm" onClick={copy}>
          {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
          {copied ? "Copied" : "Copy email"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onRegenerate} loading={regenerating}>
          {!regenerating && <RefreshCw className="h-4 w-4" aria-hidden />}
          Retype
        </Button>
      </div>
    </div>
  );
}
