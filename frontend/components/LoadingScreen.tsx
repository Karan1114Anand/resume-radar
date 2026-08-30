"use client";

import { useEffect, useState } from "react";
import { Check, Radar } from "lucide-react";

const STEPS = [
  "Reception is pulling your file",
  "Sales is working the phones for openings",
  "Someone in the back is scoring every lead",
  "Collating your results by the printer",
];

interface Props {
  /** When true, hold on the final step instead of looping. */
  done?: boolean;
}

export function LoadingScreen({ done = false }: Props) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (done) {
      setActive(STEPS.length - 1);
      return;
    }
    const id = setInterval(() => {
      setActive((n) => Math.min(n + 1, STEPS.length - 2));
    }, 2600);
    return () => clearInterval(id);
  }, [done]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-20 text-center">
      <span className="relative flex h-20 w-20 items-center justify-center rounded-full border border-ink/40 bg-cream text-corp shadow-paper">
        <Radar className="h-9 w-9" aria-hidden />
        <span className="absolute inset-1 rounded-full border-2 border-transparent border-t-stamp animate-sweep" />
      </span>

      <h2 className="mt-6 font-typewriter text-xl text-ink">The office is on it…</h2>
      <p className="mt-1 text-sm italic text-faded">
        Usually 15–30 seconds. About one trip to the coffee machine.
      </p>

      <div className="mt-6 h-3 w-full overflow-hidden rounded-sm border border-ink/40 bg-cream">
        <div className="h-full w-full bg-[repeating-linear-gradient(45deg,#1C3F5F_0,#1C3F5F_10px,#3E6E96_10px,#3E6E96_20px)] bg-[length:28px_28px] animate-paper-shift" />
      </div>

      <ul className="mt-8 w-full space-y-2 text-left">
        {STEPS.map((step, i) => {
          const state = done || i < active ? "done" : i === active ? "active" : "pending";
          return (
            <li
              key={step}
              className={`flex items-center gap-3 rounded-sm border px-3 py-2 ${
                state === "done"
                  ? "border-sage/50 bg-sage/10"
                  : state === "active"
                    ? "border-ink/40 bg-parchment shadow-paper"
                    : "border-ink/20 bg-cream/50"
              }`}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-ink/40 bg-cream font-typewriter text-xs">
                {state === "done" ? (
                  <Check className="h-3.5 w-3.5 text-sage" aria-hidden />
                ) : state === "active" ? (
                  <span className="animate-type-blink">|</span>
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={`font-typewriter text-sm ${
                  state === "pending" ? "text-faded/60" : "text-ink"
                }`}
              >
                {step}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
