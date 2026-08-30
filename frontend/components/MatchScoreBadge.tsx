interface Props {
  score: number;
  size?: "sm" | "md";
}

function tier(score: number) {
  if (score >= 80) return { label: "Strong match", cls: "border-sage text-sage" };
  if (score >= 60) return { label: "Good match", cls: "border-corp text-corp" };
  return { label: "Partial match", cls: "border-faded text-faded" };
}

export function MatchScoreBadge({ score, size = "md" }: Props) {
  const t = tier(score);
  const pad = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  return (
    <span
      className={`inline-flex -rotate-2 items-center gap-1 rounded-sm border-2 border-dashed bg-cream/70 font-typewriter uppercase tracking-wider ${t.cls} ${pad}`}
      title={t.label}
    >
      <span className="tabular-nums">{score}</span>
      <span className="opacity-60">/100</span>
    </span>
  );
}
