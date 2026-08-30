import { Armchair, Coffee, Lamp, Monitor, Paperclip, Printer } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-16 border-t-4 border-corp bg-corp px-4 py-7 text-cream sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-4 text-cream/70" aria-hidden>
          <Armchair className="h-5 w-5" />
          <Monitor className="h-5 w-5" />
          <Lamp className="h-5 w-5" />
          <Coffee className="h-5 w-5" />
          <Printer className="h-5 w-5" />
          <Paperclip className="h-5 w-5" />
        </div>
        <p className="font-serif text-sm font-bold tracking-tight">ResumeRadar</p>
        <p className="font-typewriter text-[11px] uppercase tracking-[0.18em] text-cream/70">
          Desk. Chair. Coffee. Offer letter.
        </p>
        <p className="mt-1 text-[11px] text-cream/50">
          Your résumé is shredded after the session — nobody keeps a copy.
        </p>
      </div>
    </footer>
  );
}
