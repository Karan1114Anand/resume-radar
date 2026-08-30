"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, RotateCw, SearchX } from "lucide-react";
import { matchJobs, getErrorMessage, statusOf, type Job } from "@/lib/api";
import { readInputs, readJobs, writeJobs, type StoredInputs } from "@/lib/storage";
import { LoadingScreen } from "@/components/LoadingScreen";
import { JobCard } from "@/components/JobCard";
import { FilterBar, type Filters } from "@/components/FilterBar";
import { Button } from "@/components/Button";

export default function AnalyzePage() {
  const [inputs, setInputs] = useState<StoredInputs | null | undefined>(undefined);
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  const [filters, setFilters] = useState<Filters>({ minScore: 0, workMode: "all", location: "all" });

  const run = useCallback(async (data: StoredInputs) => {
    setLoading(true);
    setError("");
    setNotFound(false);
    try {
      const result = await matchJobs(data.profile, data.locations, data.job_type);
      setJobs(result);
      writeJobs(result);
    } catch (e) {
      if (statusOf(e) === 404) {
        setNotFound(true);
      } else {
        setError(getErrorMessage(e, "Job matching failed. Please try again."));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const data = readInputs();
    setInputs(data ?? null);
    if (!data) return;
    const cached = readJobs();
    if (cached && cached.length > 0) {
      setJobs(cached);
    } else {
      void run(data);
    }
  }, [run]);

  const filtered = useMemo(() => {
    if (!jobs) return [];
    return jobs.filter((j) => {
      if (j.match_score < filters.minScore) return false;
      if (filters.workMode !== "all" && j.work_mode?.toLowerCase() !== filters.workMode) return false;
      if (
        filters.location !== "all" &&
        !j.location?.toLowerCase().includes(filters.location.toLowerCase())
      )
        return false;
      return true;
    });
  }, [jobs, filters]);

  if (inputs === undefined) {
    return <div className="py-20" aria-hidden />;
  }

  if (inputs === null) {
    return (
      <EmptyState
        icon={<AlertCircle className="h-6 w-6" aria-hidden />}
        title="Nothing in your inbox yet"
        body="Upload a résumé and pick your preferences. Then Radar works the phones."
        cta="Start from your résumé"
      />
    );
  }

  if (loading) return <LoadingScreen />;

  if (notFound) {
    return (
      <EmptyState
        icon={<SearchX className="h-6 w-6" aria-hidden />}
        title="Slow news day at the branch"
        body="Nothing came back. Try more locations or switch the job type to “Both”, then send it again."
        cta="Adjust your search"
      />
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-stamp/50 bg-stamp/10 text-stamp">
          <AlertCircle className="h-6 w-6" aria-hidden />
        </span>
        <h2 className="mt-4 font-typewriter text-lg text-ink">Job matching failed</h2>
        <p className="mt-1 text-sm text-faded">{error}</p>
        <div className="mt-5 flex justify-center gap-2">
          <Button variant="secondary" onClick={() => inputs && run(inputs)}>
            <RotateCw className="h-4 w-4" aria-hidden />
            Retry
          </Button>
          <Link href="/">
            <Button variant="ghost">Start over</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 pb-24 pt-8 sm:px-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="font-typewriter text-[11px] uppercase tracking-[0.25em] text-faded">
            Conference Room · 10 A.M. Sharp
          </p>
          <h1 className="font-typewriter text-xl text-ink">Your matches</h1>
          <p className="text-sm text-faded">
            {jobs?.length ?? 0} roles for {inputs.job_type.toLowerCase()} ·{" "}
            {inputs.locations.join(", ")}
          </p>
        </div>
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            New search
          </Button>
        </Link>
      </div>

      <FilterBar
        filters={filters}
        locations={inputs.locations}
        onChange={setFilters}
        resultCount={filtered.length}
        totalCount={jobs?.length ?? 0}
      />

      <div className="mt-5 space-y-3">
        {filtered.length === 0 ? (
          <p className="rounded-sm border border-dashed border-ink/40 bg-cream px-6 py-12 text-center text-sm italic text-faded">
            Nothing in the stack matches these filters. Loosen the score or work mode.
          </p>
        ) : (
          filtered.map((job, i) => (
            <JobCard key={`${job.company}-${job.title}-${i}`} job={job} profile={inputs.profile} />
          ))
        )}
      </div>
    </main>
  );
}

function EmptyState({
  icon,
  title,
  body,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  cta: string;
}) {
  return (
    <div className="mx-auto max-w-md px-6 py-20 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-ink/40 bg-parchment text-faded">
        {icon}
      </span>
      <h2 className="mt-4 font-typewriter text-lg text-ink">{title}</h2>
      <p className="mt-1 text-sm text-faded">{body}</p>
      <Link href="/" className="mt-5 inline-block">
        <Button>{cta}</Button>
      </Link>
    </div>
  );
}
