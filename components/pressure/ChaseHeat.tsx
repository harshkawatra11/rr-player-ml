"use client";

import { useMemo, useState } from "react";
import type { Grid } from "@/lib/types";
import { COLORS, div, seq } from "@/lib/scale";

type Mode = "wp" | "swing";

/** Chase heat map: runs needed across, balls left up, for one wickets-in-hand row. Hover reads the cell. */
export function ChaseHeat({ grid }: { grid: Grid }) {
  const [wih, setWih] = useState(6);
  const [mode, setMode] = useState<Mode>("wp");
  const [hover, setHover] = useState<{ n: number; b: number } | null>(null);
  const maxN = 80;
  const maxB = 60;
  const cw = 8;
  const ch = 7;
  const W = maxN * cw;
  const H = maxB * ch;
  const data = mode === "wp" ? grid.wp[String(wih)] : grid.swing[String(wih)];
  const peak = useMemo(() => Math.max(...data.slice(0, maxN).flat()), [data]);
  const cell = (n: number, b: number) => data[n - 1][b - 1];
  const hv = hover ? cell(hover.n, hover.b) : null;
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-4">
        <div className="flex overflow-hidden  border border-rr-line text-sm font-semibold" role="group" aria-label="Measure">
          {(["wp", "swing"] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)} aria-pressed={mode === m} className={`px-3 py-1.5 ${mode === m ? "bg-rr-navy text-white" : "bg-white text-rr-navy"}`}>
              {m === "wp" ? "Win probability" : "Swing"}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold text-rr-navy">
          Wickets in hand
          <input type="range" min={1} max={10} value={wih} onChange={(e) => setWih(Number(e.target.value))} className="accent-rr-pink" aria-label="Wickets in hand" />
          <span className="tnum w-5 text-right">{wih}</span>
        </label>
        <p className="tnum min-h-5 text-sm text-rr-muted" aria-live="polite">
          {hover && hv !== null
            ? mode === "wp"
              ? `Need ${hover.n} off ${hover.b} balls: chasing side wins ${(hv / 10).toFixed(0)}%`
              : `Need ${hover.n} off ${hover.b} balls: one ball moves win probability ${(hv / 100).toFixed(1)} points on average`
            : "Hover a cell to read it"}
        </p>
      </div>
      <svg viewBox={`-56 0 ${W + 60} ${H + 28}`} className="h-auto w-full max-w-[760px]" role="img" aria-label="Chase heat map by runs needed and balls left">
        {Array.from({ length: maxN }, (_, i) => i + 1).map((n) =>
          Array.from({ length: maxB }, (_, j) => j + 1).map((b) => {
            const v = cell(n, b);
            const f = mode === "wp" ? div((v / 1000 - 0.5) * 2) : seq(v / peak);
            return <rect key={`${n}-${b}`} x={(n - 1) * cw} y={H - b * ch} width={cw} height={ch} fill={f} onMouseEnter={() => setHover({ n, b })} onMouseLeave={() => setHover(null)} />;
          }),
        )}
        {[10, 20, 30, 40, 50, 60, 70, 80].map((n) => (
          <text key={n} x={n * cw - cw / 2} y={H + 16} textAnchor="middle" fontSize="11" fill={COLORS.navy}>
            {n}
          </text>
        ))}
        {[10, 20, 30, 40, 50, 60].map((b) => (
          <text key={b} x={-6} y={H - b * ch + ch} textAnchor="end" fontSize="11" fill={COLORS.navy}>
            {b}
          </text>
        ))}
        <text x={W / 2} y={H + 27} textAnchor="middle" fontSize="11" fontWeight="600" fill={COLORS.navy}>
          Runs needed
        </text>
        <text x={-44} y={H / 2} fontSize="11" fontWeight="600" fill={COLORS.navy} textAnchor="middle" transform={`rotate(-90 -44 ${H / 2})`}>
          Balls left
        </text>
        {hover && <rect x={(hover.n - 1) * cw} y={H - hover.b * ch} width={cw} height={ch} fill="none" stroke={COLORS.navy} strokeWidth={2} />}
      </svg>
      <p className="mt-2 text-xs text-rr-muted">
        {mode === "wp" ? "Blue favours the bowling side, pink the chasing side; white is 50%." : "Darker pink means one ball can move the result more."} Latest IPL scoring environment; the last ten overs of a chase.
      </p>
    </div>
  );
}
