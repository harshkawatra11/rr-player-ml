import { COLORS } from "@/lib/scale";

export interface DumbbellRow {
  label: string;
  pressure: number | null;
  ordinary: number | null;
  /** axis domain for this row only, since rows have different units */
  domain: [number, number];
  format: (v: number) => string;
}

/** One row per measure: pink dot for pressure balls, blue dot for ordinary balls, joined by a line. Each row has its own axis. */
export function Dumbbell({ rows }: { rows: DumbbellRow[] }) {
  return (
    <div className="space-y-3" role="list">
      <div className="flex gap-4 text-xs font-semibold text-rr-muted">
        <span className="flex items-center gap-1">
          <svg width="10" height="10"><circle cx="5" cy="5" r="5" fill={COLORS.pink} /></svg> Pressure balls
        </span>
        <span className="flex items-center gap-1">
          <svg width="10" height="10"><circle cx="5" cy="5" r="5" fill={COLORS.series} /></svg> Ordinary balls
        </span>
      </div>
      {rows.map((r) => {
        const w = 320;
        const pad = 10;
        const x = (v: number) => pad + ((v - r.domain[0]) / (r.domain[1] - r.domain[0] || 1)) * (w - 2 * pad);
        const zero = r.domain[0] < 0 && r.domain[1] > 0 ? x(0) : null;
        return (
          <div key={r.label} role="listitem" className="grid grid-cols-[140px_1fr] items-center gap-3 sm:grid-cols-[160px_1fr]">
            <p className="text-sm font-semibold text-rr-navy">{r.label}</p>
            <div>
              <svg viewBox={`0 0 ${w} 26`} className="h-7 w-full" role="img" aria-label={`${r.label}: pressure ${r.pressure === null ? "n/a" : r.format(r.pressure)}, ordinary ${r.ordinary === null ? "n/a" : r.format(r.ordinary)}`}>
                {zero !== null && <line x1={zero} x2={zero} y1={2} y2={24} stroke={COLORS.line} />}
                <line x1={pad} x2={w - pad} y1={13} y2={13} stroke={COLORS.line} />
                {r.pressure !== null && r.ordinary !== null && <line x1={x(r.ordinary)} x2={x(r.pressure)} y1={13} y2={13} stroke={COLORS.grey} strokeWidth={3} />}
                {r.ordinary !== null && <circle cx={x(r.ordinary)} cy={13} r={6} fill={COLORS.series} stroke="#FFFFFF" strokeWidth={2} />}
                {r.pressure !== null && <circle cx={x(r.pressure)} cy={13} r={6} fill={COLORS.pink} stroke="#FFFFFF" strokeWidth={2} />}
              </svg>
              <p className="tnum -mt-0.5 flex justify-between text-xs text-rr-muted">
                <span className="text-rr-pink-deep">{r.pressure === null ? "n/a" : r.format(r.pressure)}</span>
                <span className="text-rr-series">{r.ordinary === null ? "n/a" : r.format(r.ordinary)}</span>
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
