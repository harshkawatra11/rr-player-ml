import { COLORS } from "@/lib/scale";

/** Predicted against actual win probability by decile bin. */
export function CalibrationLine({ cal, label }: { cal: [number, number, number, number][]; label: string }) {
  const W = 260;
  const H = 220;
  const L = 36;
  const B = 30;
  const x = (v: number) => L + v * (W - L - 10);
  const y = (v: number) => H - B - v * (H - B - 10);
  const pts = cal.filter((c) => c[1] >= 200);
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`${label}: predicted against actual win probability`}>
        <line x1={x(0)} y1={y(0)} x2={x(1)} y2={y(1)} stroke={COLORS.grey} strokeDasharray="4 3" />
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <text x={L - 6} y={y(t) + 4} textAnchor="end" fontSize="10" fill={COLORS.navy}>{Math.round(t * 100)}</text>
            <text x={x(t)} y={H - B + 14} textAnchor="middle" fontSize="10" fill={COLORS.navy}>{Math.round(t * 100)}</text>
          </g>
        ))}
        <polyline fill="none" stroke={COLORS.pink} strokeWidth="2.5" points={pts.map((c) => `${x(c[2])},${y(c[3])}`).join(" ")} />
        {pts.map((c) => (
          <circle key={c[0]} cx={x(c[2])} cy={y(c[3])} r="3.5" fill={COLORS.pink} stroke="#fff" strokeWidth="1.5" />
        ))}
        <text x={x(0.5)} y={H - 4} textAnchor="middle" fontSize="10" fill={COLORS.navy}>Predicted, %</text>
        <text x={10} y={y(0.5)} fontSize="10" fill={COLORS.navy} transform={`rotate(-90 10 ${y(0.5)})`} textAnchor="middle">Actual, %</text>
      </svg>
      <figcaption className="text-center text-xs text-rr-muted">{label}</figcaption>
    </figure>
  );
}

/** Small scatter of one half of the matches against the other, with the correlation printed. */
export function MiniScatter({ pts, color, label }: { pts: [number, number][]; color: string; label: string }) {
  const W = 220;
  const H = 200;
  const pad = 22;
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const lo = Math.min(...xs, ...ys);
  const hi = Math.max(...xs, ...ys);
  const s = (v: number) => pad + ((v - lo) / (hi - lo || 1)) * (W - 2 * pad);
  const t = (v: number) => H - pad - ((v - lo) / (hi - lo || 1)) * (H - 2 * pad);
  const n = pts.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  const cov = pts.reduce((a, p) => a + (p[0] - mx) * (p[1] - my), 0);
  const vx = xs.reduce((a, b) => a + (b - mx) ** 2, 0);
  const vy = ys.reduce((a, b) => a + (b - my) ** 2, 0);
  const r = cov / Math.sqrt(vx * vy || 1);
  const zero = lo < 0 && hi > 0 ? s(0) : null;
  const zeroY = lo < 0 && hi > 0 ? t(0) : null;
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`${label}: correlation ${r.toFixed(2)}`}>
        <rect x={pad} y={pad / 2} width={W - 2 * pad} height={H - 1.5 * pad} fill="#fff" stroke={COLORS.line} />
        {zero !== null && <line x1={zero} x2={zero} y1={pad / 2} y2={H - pad} stroke={COLORS.line} />}
        {zeroY !== null && <line x1={pad} x2={W - pad} y1={zeroY} y2={zeroY} stroke={COLORS.line} />}
        {pts.map((p, i) => (
          <circle key={i} cx={s(p[0])} cy={t(p[1])} r="2.6" fill={color} fillOpacity="0.7" />
        ))}
        <text x={pad + 6} y={pad + 8} fontSize="11" fontWeight="700" fill={COLORS.navy}>r = {r < 0 ? "−" : ""}{Math.abs(r).toFixed(2)}</text>
      </svg>
      <figcaption className="text-center text-xs text-rr-muted">{label}</figcaption>
    </figure>
  );
}

/** Eligibility funnel as stepped bars. */
export function Funnel({ steps, values, color }: { steps: string[]; values: number[]; color: string }) {
  const top = Math.max(...values);
  return (
    <ul className="space-y-1.5">
      {steps.map((s, i) => (
        <li key={s} className="grid grid-cols-[170px_1fr_44px] items-center gap-2 text-sm">
          <span className="text-rr-navy">{s}</span>
          <span className="h-4 rounded bg-rr-panel">
            <span className="block h-4 rounded" style={{ width: `${(100 * values[i]) / top}%`, background: color }} />
          </span>
          <span className="tnum text-right font-bold text-rr-navy">{values[i]}</span>
        </li>
      ))}
    </ul>
  );
}
