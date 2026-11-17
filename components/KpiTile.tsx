export function KpiTile({
  label,
  value,
  note,
  tone = "navy",
}: {
  label: string;
  value: string;
  note?: string;
  tone?: "navy" | "pink" | "blue";
}) {
  const color = tone === "pink" ? "text-rr-pink" : tone === "blue" ? "text-rr-series" : "text-rr-navy";
  return (
    <div className="rounded-xl border border-rr-line bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-rr-muted">{label}</p>
      <p className={`tnum mt-1 font-display text-3xl font-extrabold leading-none ${color}`}>{value}</p>
      {note && <p className="mt-2 text-sm text-rr-muted">{note}</p>}
    </div>
  );
}

export function LiftChip({ cls }: { cls: "Rises" | "Steady" | "Dips" }) {
  const style =
    cls === "Rises"
      ? "bg-rr-pink-tint text-rr-pink-deep border-rr-pink"
      : cls === "Dips"
        ? "bg-rr-blue-tint text-rr-blue border-rr-series"
        : "bg-rr-panel text-rr-muted border-rr-line";
  return <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${style}`}>{cls}</span>;
}

export function ProbPill({ p }: { p: number | null }) {
  if (p === null) return <span className="text-rr-muted">n/a</span>;
  const firm = p >= 0.65;
  return (
    <span
      className={`tnum inline-block min-w-[3.2rem] rounded-full px-2 py-0.5 text-center text-xs font-bold ${
        firm ? "bg-rr-pink text-white" : "bg-rr-panel text-rr-navy"
      }`}
      title={firm ? "Firm: top 10 in at least 65% of resamples" : "Softer: top 10 in fewer than 65% of resamples"}
    >
      {Math.round(p * 100)}%
    </span>
  );
}
