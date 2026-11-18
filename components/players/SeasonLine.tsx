import type { SplitRow } from "@/lib/types";
import { COLORS } from "@/lib/scale";

/** Mean value by calendar year: pink line for pressure balls, blue line for ordinary balls. Years with under 15 balls are skipped. */
export function SeasonLine({ rows }: { rows: SplitRow[] }) {
  const years = Array.from(new Set(rows.map((r) => r[0].split("|")[0]))).sort();
  const pick = (y: string, s: "P" | "O") => {
    const r = rows.find((x) => x[0] === `${y}|${s}`);
    return r && r[1] >= 15 && r[2] !== null ? { n: r[1], v: r[2] as number } : null;
  };
  const vals = years.flatMap((y) => (["P", "O"] as const).map((s) => pick(y, s)?.v)).filter((v): v is number => v !== undefined);
  if (years.length < 2 || vals.length < 2) return <p className="text-sm text-rr-muted">Not enough seasons with 15 or more balls to draw a line.</p>;
  const W = 420;
  const H = 190;
  const L = 36;
  const B = 28;
  const lo = Math.min(...vals, 0);
  const hi = Math.max(...vals, 0.1);
  const x = (i: number) => L + (i * (W - L - 14)) / (years.length - 1);
  const y = (v: number) => H - B - ((v - lo) / (hi - lo || 1)) * (H - B - 12);
  const line = (s: "P" | "O") => years.map((yr, i) => ({ i, p: pick(yr, s) })).filter((d) => d.p);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Mean value by year, pressure and ordinary balls">
      <line x1={L} x2={W - 8} y1={y(0)} y2={y(0)} stroke={COLORS.line} />
      {[lo, 0, hi].map((t, k) => (
        <text key={k} x={L - 5} y={y(t) + 4} textAnchor="end" fontSize="10" fill={COLORS.navy}>
          {t.toFixed(1)}
        </text>
      ))}
      {years.map((yr, i) => (
        <text key={yr} x={x(i)} y={H - 10} textAnchor="middle" fontSize="11" fill={COLORS.navy}>
          {yr}
        </text>
      ))}
      {(["O", "P"] as const).map((s) => {
        const pts = line(s);
        const color = s === "P" ? COLORS.pink : COLORS.series;
        return (
          <g key={s}>
            <polyline fill="none" stroke={color} strokeWidth="2.5" points={pts.map((d) => `${x(d.i)},${y((d.p as { v: number }).v)}`).join(" ")} />
            {pts.map((d) => (
              <circle key={d.i} cx={x(d.i)} cy={y((d.p as { v: number }).v)} r="4" fill={color} stroke="#fff" strokeWidth="1.5">
                <title>{`${years[d.i]} ${s === "P" ? "pressure" : "ordinary"}: ${(d.p as { v: number }).v.toFixed(2)} on ${(d.p as { n: number }).n} balls`}</title>
              </circle>
            ))}
          </g>
        );
      })}
    </svg>
  );
}
