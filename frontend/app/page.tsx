"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Check, Coffee, Monitor, Phone, X } from "lucide-react";
import { UploadZone } from "@/components/UploadZone";
import { ProfileSummaryCard } from "@/components/ProfileSummaryCard";
import { OfficeScene } from "@/components/OfficeScene";
import { TalkingHead } from "@/components/TalkingHead";
import { Button } from "@/components/Button";
import { getErrorMessage, parseResume, type ResumeProfile } from "@/lib/api";
import { INPUTS_KEY, JOBS_KEY } from "@/lib/storage";

type Step = "upload" | "confirm" | "preferences";

const QUICK_CITIES = ["Remote", "Bangalore", "Mumbai", "Delhi NCR", "Hyderabad", "Pune", "London", "New York"];
const JOB_TYPES = ["Internship", "Full-time", "Both"] as const;

export default function LandingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");

  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [profile, setProfile] = useState<ResumeProfile | null>(null);

  const [locations, setLocations] = useState<string[]>(["Remote"]);
  const [cityInput, setCityInput] = useState("");
  const [jobType, setJobType] = useState<(typeof JOB_TYPES)[number]>("Both");
  const [submitting, setSubmitting] = useState(false);

  async function analyze() {
    if (!file) return;
    setParsing(true);
    setUploadError("");
    try {
      const parsed = await parseResume(file);
      setProfile(parsed);
      setStep("confirm");
    } catch (e) {
      setUploadError(getErrorMessage(e, "We couldn't read that resume. Please try another PDF."));
    } finally {
      setParsing(false);
    }
  }

  function addCity(value: string) {
    const city = value.trim();
    if (city && !locations.some((l) => l.toLowerCase() === city.toLowerCase())) {
      setLocations([...locations, city]);
    }
    setCityInput("");
  }

  function findJobs() {
    if (!profile || locations.length === 0) return;
    setSubmitting(true);
    sessionStorage.setItem(INPUTS_KEY, JSON.stringify({ profile, locations, job_type: jobType }));
    sessionStorage.removeItem(JOBS_KEY);
    router.push("/analyze");
  }

  return (
    <main className="mx-auto max-w-2xl px-4 pb-24 pt-10 sm:px-6">
      {step === "upload" && (
        <header className="mb-8 text-center">
          <p className="mb-3 inline-block -rotate-2 rounded-sm border-2 border-dashed border-stamp/70 px-3 py-1 font-typewriter text-[11px] uppercase tracking-[0.25em] text-stamp">
            Inter-Office Memo · From: Radar · Re: Your Career
          </p>
          <h1 className="font-typewriter text-3xl leading-tight text-ink sm:text-4xl">
            Upload your résumé.<br />
            <span className="bg-highlight/70 px-1 box-decoration-clone">
              Radar finds the rest.
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-faded">
            Hand one PDF to the front desk and walk away with ten matched roles, a hiring
            contact for each, and an outreach email ready to send.
          </p>

          <div className="mx-auto mt-6 max-w-md text-corp">
            <OfficeScene />
          </div>
        </header>
      )}

      <Stepper step={step} />

      {step === "upload" && (
        <div className="mt-6 space-y-4">
          <UploadZone file={file} onFile={setFile} onError={setUploadError} disabled={parsing} />
          {uploadError && <ErrorNote message={uploadError} />}
          <Button size="lg" className="w-full" onClick={analyze} disabled={!file} loading={parsing}>
            {parsing ? "Analyzing résumé…" : "Analyze résumé"}
            {!parsing && <ArrowRight className="h-4 w-4" aria-hidden />}
          </Button>

          <ul className="mt-10 grid gap-4 sm:grid-cols-3">
            <HowItWorks icon={<Monitor className="h-5 w-5" aria-hidden />} title="Reception" n={1}>
              The front desk opens your PDF and files your skills, experience, and education.
            </HowItWorks>
            <HowItWorks icon={<Phone className="h-5 w-5" aria-hidden />} title="Sales" n={2}>
              Someone works the phones — live search finds real openings and scores each.
            </HowItWorks>
            <HowItWorks icon={<Coffee className="h-5 w-5" aria-hidden />} title="The Corner Office" n={3}>
              A tailored outreach email gets drafted, plus a hiring contact for the role.
            </HowItWorks>
          </ul>

          <div className="mt-10">
            <p className="mb-2 text-center font-typewriter text-[11px] uppercase tracking-[0.25em] text-faded">
              — Confessional —
            </p>
            <TalkingHead />
          </div>
        </div>
      )}

      {step === "confirm" && profile && (
        <div className="mt-6 space-y-4">
          <p className="font-typewriter text-sm text-faded">
            Reception filed this from your résumé. Everything check out?
          </p>
          <ProfileSummaryCard profile={profile} />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="secondary"
              className="sm:flex-1"
              onClick={() => {
                setStep("upload");
                setProfile(null);
                setFile(null);
              }}
            >
              <X className="h-4 w-4" aria-hidden />
              Re-file
            </Button>
            <Button className="sm:flex-1" onClick={() => setStep("preferences")}>
              <Check className="h-4 w-4" aria-hidden />
              Looks good, continue
            </Button>
          </div>
        </div>
      )}

      {step === "preferences" && (
        <div className="mt-6 space-y-6">
          <div>
            <h2 className="font-typewriter text-sm uppercase tracking-widest text-ink">
              Where do you want to work?
            </h2>
            <p className="text-xs italic text-faded">Add one or more cities, or keep Remote.</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {locations.map((loc) => (
                <button
                  key={loc}
                  onClick={() => setLocations(locations.filter((l) => l !== loc))}
                  className="inline-flex items-center gap-1 rounded-sm border border-ink bg-corp px-3 py-1 font-typewriter text-xs uppercase text-cream hover:bg-corp-light"
                >
                  {loc}
                  <X className="h-3 w-3" aria-hidden />
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addCity(cityInput);
              }}
              className="mt-2"
            >
              <input
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                placeholder="Type a city and press Enter"
                className="w-full rounded-sm border border-ink/50 bg-cream px-3 py-2 font-serif text-sm text-ink placeholder:italic placeholder:text-faded/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-corp"
              />
            </form>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {QUICK_CITIES.filter((c) => !locations.includes(c)).map((c) => (
                <button
                  key={c}
                  onClick={() => addCity(c)}
                  className="rounded-sm border border-dashed border-ink/40 bg-parchment px-3 py-1 font-typewriter text-xs uppercase text-faded hover:border-corp hover:text-ink"
                >
                  + {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-typewriter text-sm uppercase tracking-widest text-ink">Job type</h2>
            <div className="mt-3 inline-flex rounded-sm border border-ink/50 bg-cream">
              {JOB_TYPES.map((t, i) => (
                <button
                  key={t}
                  onClick={() => setJobType(t)}
                  aria-pressed={jobType === t}
                  className={`px-4 py-1.5 font-typewriter text-sm uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-corp ${
                    i > 0 ? "border-l border-ink/30" : ""
                  } ${jobType === t ? "bg-corp text-cream" : "text-ink hover:bg-parchment"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="secondary" className="sm:w-auto" onClick={() => setStep("confirm")}>
              Back
            </Button>
            <Button
              size="lg"
              className="sm:flex-1"
              onClick={findJobs}
              disabled={locations.length === 0}
              loading={submitting}
            >
              Find matching jobs
              {!submitting && <ArrowRight className="h-4 w-4" aria-hidden />}
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}

function Stepper({ step }: { step: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "upload", label: "Upload" },
    { key: "confirm", label: "Confirm" },
    { key: "preferences", label: "Preferences" },
  ];
  const activeIndex = steps.findIndex((s) => s.key === step);
  return (
    <ol className="flex items-center justify-center gap-2 font-typewriter text-xs uppercase">
      {steps.map((s, i) => (
        <li key={s.key} className="flex items-center gap-2">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-sm border border-ink/50 ${
              i < activeIndex
                ? "bg-sage/20 text-sage"
                : i === activeIndex
                  ? "bg-corp text-cream"
                  : "bg-cream text-faded"
            }`}
          >
            {i < activeIndex ? <Check className="h-3.5 w-3.5" aria-hidden /> : i + 1}
          </span>
          <span className={i === activeIndex ? "text-ink" : "text-faded"}>{s.label}</span>
          {i < steps.length - 1 && <span className="mx-1 h-px w-6 bg-ink/30" />}
        </li>
      ))}
    </ol>
  );
}

function HowItWorks({
  icon,
  title,
  n,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  n: number;
  children: React.ReactNode;
}) {
  return (
    <li className="relative rounded-sm border border-ink/40 bg-cream p-4 shadow-paper">
      <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-ink bg-highlight font-typewriter text-xs text-ink">
        {n}
      </span>
      <span className="flex h-9 w-9 items-center justify-center rounded-sm border border-ink/30 bg-parchment text-corp">
        {icon}
      </span>
      <p className="mt-2.5 font-typewriter text-sm uppercase tracking-wide text-ink">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-faded">{children}</p>
    </li>
  );
}

function ErrorNote({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-sm border border-stamp/50 bg-stamp/10 p-3 text-sm text-ink">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-stamp" aria-hidden />
      <p>{message}</p>
    </div>
  );
}
