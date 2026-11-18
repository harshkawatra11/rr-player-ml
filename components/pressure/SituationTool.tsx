"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Grid } from "@/lib/types";
import { situation } from "@/lib/pressure";
import { COLORS } from "@/lib/scale";
import { sgn } from "@/lib/format";
import { COPY } from "@/lib/copy";

export interface PhaseRecord {
  id: number;
  role: "bat" | "bowl";
  name: string;
  rank: number | null;
  mid: [number, number | null] | null;
  death: [number, number | null] | null;
}

const BAND_COLOR: Record<string, string> = { Routine: COLORS.series, Elevated: COLORS.grey, High: COLORS.pink, Extreme: COLORS.pinkDeep, Decided: COLORS.line };

function Slider({ label, min, max, value, set, suffix = "" }: { label: string; min: number; max: number; value: number; set: (n: number) => void; suffix?: string }) {
  return (
    <label className="block">
      <span className="flex justify-between text-sm font-semibold text-rr-navy">
        {label}
        <span className="tnum">
          {value}
          {suffix}
        </span>
      </span>
      <input type="range" min={min} max={max} value={value} onChange={(e) => set(Number(e.target.value))} className="mt-1 w-full accent-rr-pink" aria-label={label} />
    </label>
  );
}

function Bar({ label, v, tone }: { label: string; v: number; tone: string }) {
  return (
    <div className="grid grid-cols-[110px_1fr_44px] items-center gap-2 text-sm">
      <span className="text-rr-navy">{label}</span>
      <span className="h-2.5  bg-rr-panel">
        <span className="block h-2.5 " style={{ width: `${Math.round(v * 100)}%`, background: tone }} />
      </span>
      <span className="tnum text-right font-semibold text-rr-navy">{Math.round(v * 100)}</span>
    </div>
  );
}

/** Score one chase moment and list the best pressure records for that stage of the innings. */
export function SituationTool({ grid, records }: { grid: Grid; records: PhaseRecord[] }) {
  const [need, setNeed] = useState(24);
  const [balls, setBalls] = useState(12);
  const [wih, setWih] = useState(5);
  const [ko, setKo] = useState(false);
  const s = useMemo(() => situation(grid, need, balls, wih, ko), [grid, need, balls, wih, ko]);
  const key = s.phase === "DEATH" ? "death" : "mid";
  const best = (role: "bat" | "bowl") =>
    records
      .filter((r) => r.role === role && r[key] && (r[key] as [number, number | null])[0] >= 30 && (r[key] as [number, number | null])[1] !== null)
      .sort((a, b) => ((b[key] as [number, number])[1] as number) - ((a[key] as [number, number])[1] as number))
      .slice(0, 8);
  const rr = (6 * need) / balls;
  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <div className="space-y-4  border border-rr-line bg-white p-5">
        <h2 className="text-[15px] font-bold text-rr-navy">The chase</h2>
        <Slider label="Runs needed" min={1} max={100} value={need} set={setNeed} />
        <Slider label="Balls left" min={1} max={60} value={balls} set={setBalls} />
        <Slider label="Wickets in hand" min={1} max={10} value={wih} set={setWih} />
        <label className="flex items-center gap-2 text-sm font-semibold text-rr-navy">
          <input type="checkbox" checked={ko} onChange={(e) => setKo(e.target.checked)} className="accent-rr-pink" />
          Knockout match
        </label>
        <p className="tnum  bg-rr-panel p-3 text-sm text-rr-navy">
          Need {need} off {balls} balls with {wih} wickets in hand. Required rate {rr.toFixed(1)} an over.
        </p>
      </div>

      <div className="space-y-6">
        <div className="border border-rr-line bg-white p-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-rr-muted">Pressure Index</p>
              <p className="tnum text-5xl font-extrabold" style={{ color: BAND_COLOR[s.band] === COLORS.line ? COLORS.grey : BAND_COLOR[s.band] }}>
                {s.pi === null ? "n/a" : Math.round(s.pi)}
              </p>
            </div>
            <span className="px-3 py-1 text-sm font-bold text-white" style={{ background: s.band === "Decided" ? COLORS.grey : BAND_COLOR[s.band] }}>
              {s.band}
            </span>
            <div className="tnum text-sm text-rr-navy">
              <p>Chasing side win probability: <b>{Math.round(s.wp * 100)}%</b></p>
              <p>One ball moves it by <b>{(s.swing * 100).toFixed(1)}</b> points on average</p>
            </div>
          </div>
          {s.pi === null && <p className="mt-3 text-sm text-rr-muted">{COPY.situation.decided}</p>}
          <div className="mt-4 space-y-2">
            <Bar label="Swing" v={s.S} tone={COLORS.pink} />
            <Bar label="Balance" v={s.B} tone={COLORS.series} />
            <Bar label="Clock" v={s.T} tone={COLORS.navy} />
            <Bar label="Wicket stress" v={s.W} tone={COLORS.grey} />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {(["bat", "bowl"] as const).map((role) => (
            <div key={role} className="border border-rr-line bg-white p-5">
              <h3 className="text-[15px] font-bold text-rr-navy">
                {role === "bat" ? "Batters" : "Bowlers"}: {s.phase === "DEATH" ? "death overs" : "middle overs"}
              </h3>
              <p className="mb-2 text-xs text-rr-muted">{COPY.situation.bestRecords}. {COPY.situation.minBalls}.</p>
              <ol className="space-y-1.5">
                {best(role).map((r, i) => (
                  <li key={r.id} className="flex items-center justify-between text-sm">
                    <span>
                      <span className="tnum mr-2 font-bold text-rr-pink-deep">{i + 1}</span>
                      <Link href={`/players/${role}/${r.id}/`} className="font-semibold text-rr-navy hover:underline">
                        {r.name}
                      </Link>
                    </span>
                    <span className="tnum text-rr-muted">
                      {sgn((r[key] as [number, number])[1], 2)} on {(r[key] as [number, number | null])[0]} balls
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
