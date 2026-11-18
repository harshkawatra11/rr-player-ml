/** One cell of a key-figures band. Put several inside KeyFigures; the band draws the hairlines. */
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
  const color = tone === "pink" ? "text-rr-pink-deep" : tone === "blue" ? "text-rr-blue" : "text-rr-navy";
  return (
    <div className="bg-white px-4 py-3.5">
      <p className="text-[13px] font-medium leading-tight text-rr-muted">{label}</p>
      <p className={`tnum mt-1 text-[26px] font-bold leading-none ${color}`}>{value}</p>
      {note && <p className="mt-1.5 text-[13px] leading-snug text-rr-muted">{note}</p>}
    </div>
  );
}

export function LiftChip({ cls }: { cls: "Rises" | "Steady" | "Dips" }) {
  const style =
    cls === "Rises"
      ? "border-rr-pink bg-rr-pink-tint text-rr-pink-deep"
      : cls === "Dips"
        ? "border-rr-series bg-rr-blue-tint text-rr-blue"
        : "border-rr-line bg-white text-rr-muted";
  return <span className={`inline-block border px-1.5 py-px text-xs font-semibold ${style}`}>{cls}</span>;
}

export function ProbPill({ p }: { p: number | null }) {
  if (p === null) return <span className="text-rr-muted">n/a</span>;
  const firm = p >= 0.65;
  return (
    <span
      className={`tnum inline-block min-w-[3.2rem] border px-1.5 py-px text-center text-xs font-bold ${firm ? "border-rr-pink bg-rr-pink text-white" : "border-rr-line bg-white text-rr-navy"}`}
      title={firm ? "Firm: top 10 in at least 65% of resamples" : "Softer: top 10 in fewer than 65% of resamples"}
    >
      {Math.round(p * 100)}%
    </span>
  );
}
