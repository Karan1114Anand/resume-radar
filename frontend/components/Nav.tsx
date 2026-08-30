import Link from "next/link";
import { Armchair, Coffee, Monitor, Radar } from "lucide-react";

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b-4 border-corp bg-corp text-cream shadow-card">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-3 focus-visible:outline-none">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-cream/70 bg-cream/10 text-cream transition-transform group-hover:rotate-12">
            <Radar className="h-5 w-5" aria-hidden />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-serif text-lg font-bold tracking-tight">
              Resume<span className="text-highlight">Radar</span>
            </span>
            <span className="mt-0.5 font-typewriter text-[10px] uppercase tracking-[0.18em] text-cream/70">
              The office that runs your job hunt
            </span>
          </span>
        </Link>
        <span className="hidden items-center gap-3 text-cream/60 sm:flex" aria-hidden>
          <Armchair className="h-4 w-4" />
          <Monitor className="h-4 w-4" />
          <Coffee className="h-4 w-4" />
        </span>
      </div>
    </header>
  );
}
