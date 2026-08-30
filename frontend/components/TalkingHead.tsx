"use client";

import { useEffect, useState } from "react";
import { Quote, UserRound } from "lucide-react";

interface Segment {
  quote: string;
  title: string;
}

const SEGMENTS: Segment[] = [
  {
    quote:
      "Would I rather be respected or hired? Easy. Both. I want managers to be afraid of how much they want me.",
    title: "The Regional Manager",
  },
  {
    quote:
      "Before I send an application I ask myself: would an idiot send this? And if they would, I do not send that thing.",
    title: "Assistant to the Regional Manager",
  },
  {
    quote:
      "Radar found me a job in about a minute. I've spent longer than that reformatting one résumé bullet.",
    title: "Sales, Desk by the Window",
  },
  {
    quote: "Why waste time apply lot place when few place do trick.",
    title: "Accounting",
  },
  {
    quote: "You miss 100% of the jobs you don't apply to. I read that on a mug.",
    title: "The Regional Manager",
  },
  {
    quote: "I applied to three of these before my coffee got cold. That never happens at this desk.",
    title: "Reception",
  },
];

export function TalkingHead() {
  const [i, setI] = useState(0);

  useEffect(() => {
    setI(Math.floor(Math.random() * SEGMENTS.length));
  }, []);

  const seg = SEGMENTS[i];

  return (
    <figure className="relative overflow-hidden rounded-sm border border-ink/40 bg-interview px-5 py-5 text-cream shadow-paper">
      <Quote className="absolute right-3 top-3 h-8 w-8 text-cream/15" aria-hidden />
      <blockquote className="font-serif text-sm italic leading-relaxed sm:text-base">
        &ldquo;{seg.quote}&rdquo;
      </blockquote>
      <figcaption className="mt-3 flex items-center gap-2.5 border-t border-cream/20 pt-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-cream/10 text-cream/80">
          <UserRound className="h-4 w-4" aria-hidden />
        </span>
        <span className="font-typewriter text-xs uppercase tracking-widest">{seg.title}</span>
      </figcaption>
    </figure>
  );
}
