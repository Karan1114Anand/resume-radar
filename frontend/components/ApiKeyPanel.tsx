"use client";

import { useEffect, useState } from "react";
import { Check, KeyRound, Trash2 } from "lucide-react";

import { Button } from "./Button";
import { clearKeys, readKeys, writeKeys } from "../lib/storage";

/**
 * Optional "use your own API keys" panel.
 *
 * With no keys the app runs on the shared demo quota, which is rate limited per
 * IP. Supplying both a Groq and a Tavily key lifts that limit for the session.
 * Keys are held in sessionStorage and sent per request; the backend never
 * stores them.
 */
export function ApiKeyPanel() {
  const [open, setOpen] = useState(false);
  const [groq, setGroq] = useState("");
  const [tavily, setTavily] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const existing = readKeys();
    if (existing) {
      setGroq(existing.groq);
      setTavily(existing.tavily);
      setSaved(true);
    }
  }, []);

  function save() {
    const g = groq.trim();
    const t = tavily.trim();
    if (!g || !t) {
      setError("Both keys are required — the app needs Groq for text and Tavily for search.");
      return;
    }
    writeKeys({ groq: g, tavily: t });
    setError("");
    setSaved(true);
  }

  function remove() {
    clearKeys();
    setGroq("");
    setTavily("");
    setSaved(false);
    setError("");
  }

  const field =
    "w-full rounded-sm border border-ink/40 bg-cream px-3 py-2 font-typewriter text-xs text-ink " +
    "placeholder:text-ink/40 focus:border-corp focus:outline-none focus:ring-1 focus:ring-corp";

  return (
    <section className="mx-auto w-full max-w-2xl">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 rounded-sm border border-ink/30 bg-parchment px-4 py-3 text-left transition-colors hover:border-ink/60"
      >
        <span className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-corp" aria-hidden />
          <span className="font-typewriter text-[11px] uppercase tracking-[0.16em] text-ink">
            Use your own API keys
          </span>
        </span>
        <span className="font-typewriter text-[10px] uppercase tracking-widest text-ink/60">
          {saved ? "Active" : "Optional"}
        </span>
      </button>

      {open && (
        <div className="mt-2 space-y-4 rounded-sm border border-ink/30 bg-cream px-4 py-4">
          <p className="text-[12px] leading-relaxed text-ink/70">
            Without keys, the app uses a shared demo quota that is rate limited. Add your own
            free keys to remove that limit. They are kept in this browser tab only, sent with
            each request, and never stored on the server.
          </p>

          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block font-typewriter text-[10px] uppercase tracking-[0.16em] text-ink/70">
                Groq API key
              </span>
              <input
                type="password"
                value={groq}
                onChange={(e) => setGroq(e.target.value)}
                placeholder="gsk_..."
                autoComplete="off"
                spellCheck={false}
                className={field}
              />
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-[11px] text-corp underline"
              >
                Get a free Groq key
              </a>
            </label>

            <label className="block">
              <span className="mb-1 block font-typewriter text-[10px] uppercase tracking-[0.16em] text-ink/70">
                Tavily API key
              </span>
              <input
                type="password"
                value={tavily}
                onChange={(e) => setTavily(e.target.value)}
                placeholder="tvly-..."
                autoComplete="off"
                spellCheck={false}
                className={field}
              />
              <a
                href="https://app.tavily.com/home"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-[11px] text-corp underline"
              >
                Get a free Tavily key
              </a>
            </label>
          </div>

          {error && <p className="text-[12px] text-stamp">{error}</p>}

          <div className="flex items-center gap-3">
            <Button size="sm" onClick={save}>
              {saved ? "Update keys" : "Save keys"}
            </Button>
            {saved && (
              <>
                <Button size="sm" variant="secondary" onClick={remove}>
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  Remove
                </Button>
                <span className="flex items-center gap-1 font-typewriter text-[10px] uppercase tracking-widest text-corp">
                  <Check className="h-3.5 w-3.5" aria-hidden />
                  In use
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
