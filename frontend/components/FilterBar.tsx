"use client";

import { SlidersHorizontal } from "lucide-react";

export interface Filters {
  minScore: 0 | 60 | 80;
  workMode: "all" | "remote" | "hybrid" | "on-site";
  location: string;
}

interface Props {
  filters: Filters;
  locations: string[];
  onChange: (filters: Filters) => void;
  resultCount: number;
  totalCount: number;
}

export function FilterBar({ filters, locations, onChange, resultCount, totalCount }: Props) {
  return (
    <div className="sticky top-16 z-30 -mx-4 border-y border-ink/40 bg-parchment px-4 py-3 shadow-card sm:mx-0 sm:rounded-sm sm:border">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="flex items-center gap-1.5 font-typewriter text-xs uppercase tracking-widest text-faded">
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          Sort the stack
        </span>

        <Segment
          label="Score"
          value={String(filters.minScore)}
          options={[
            { value: "0", label: "All" },
            { value: "60", label: "60+" },
            { value: "80", label: "80+" },
          ]}
          onChange={(v) => onChange({ ...filters, minScore: Number(v) as Filters["minScore"] })}
        />

        <Select
          label="Mode"
          value={filters.workMode}
          options={[
            { value: "all", label: "Any mode" },
            { value: "remote", label: "Remote" },
            { value: "hybrid", label: "Hybrid" },
            { value: "on-site", label: "On-site" },
          ]}
          onChange={(v) => onChange({ ...filters, workMode: v as Filters["workMode"] })}
        />

        {locations.length > 0 && (
          <Select
            label="Where"
            value={filters.location}
            options={[
              { value: "all", label: "All locations" },
              ...locations.map((l) => ({ value: l, label: l })),
            ]}
            onChange={(v) => onChange({ ...filters, location: v })}
          />
        )}

        <span className="ml-auto font-typewriter text-xs text-faded">
          <span className="text-ink">{resultCount}</span> of {totalCount} in the tray
        </span>
      </div>
    </div>
  );
}

function Segment({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-typewriter text-xs uppercase text-faded">{label}</span>
      <div className="inline-flex rounded-sm border border-ink/40 bg-cream">
        {options.map((o, i) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            aria-pressed={value === o.value}
            className={`px-2.5 py-1 font-typewriter text-xs uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-corp ${
              i > 0 ? "border-l border-ink/30" : ""
            } ${value === o.value ? "bg-corp text-cream" : "text-ink hover:bg-parchment"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-2 font-typewriter text-xs uppercase text-faded">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-sm border border-ink/40 bg-cream px-2 py-1 font-typewriter text-xs uppercase text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-corp"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
