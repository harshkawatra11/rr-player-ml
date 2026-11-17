import type { Grid } from "./types";

/** Percentile (0 to 1) of v among 201 ascending quantiles, by linear interpolation. */
export function pctl(q: number[], v: number): number {
  let lo = 0;
  let hi = q.length - 1;
  if (v <= q[0]) return 0;
  if (v >= q[hi]) return 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (q[m] <= v) lo = m;
    else hi = m;
  }
  return (lo + (v - q[lo]) / Math.max(q[hi] - q[lo], 1e-12)) / (q.length - 1);
}

export type PressureBand = "Routine" | "Elevated" | "High" | "Extreme" | "Decided";

export interface Situation {
  wp: number;
  swing: number;
  S: number;
  B: number;
  T: number;
  W: number;
  pi: number | null;
  band: PressureBand;
  phase: "MID" | "DEATH";
}

/** Pressure Index of a chase state in the latest IPL scoring environment. Mirrors model/pressure_model.py. */
export function situation(g: Grid, need: number, balls: number, wih: number, knockout: boolean): Situation {
  const n = Math.min(Math.max(Math.round(need), 1), g.rn[1]);
  const b = Math.min(Math.max(Math.round(balls), 1), g.bl[1]);
  const w = Math.min(Math.max(Math.round(wih), 1), 10);
  const wp = g.wp[String(w)][n - 1][b - 1] / 1000;
  const swing = g.swing[String(w)][n - 1][b - 1] / 10000;
  const over = Math.min(20, Math.floor((120 - b) / 6) + 1);
  const expWk = g.exp_wk[`2|${over}`] ?? 0;
  const S = pctl(g.swing_q, swing);
  const B = 1 - Math.abs(2 * wp - 1);
  const T = ((120 - b) / 120) ** 2;
  const W = Math.min(1, Math.max(0, (10 - w - expWk) / 3));
  const k = g.weights;
  const raw = (k.swing * S + k.balance * B + k.clock * T + k.wstress * W) * (1 + (knockout ? k.ko : 0));
  const dead = wp < 0.03 || wp > 0.97;
  const pi = dead ? null : 100 * pctl(g.raw_q, raw);
  const band: PressureBand = pi === null ? "Decided" : pi >= 90 ? "Extreme" : pi >= 75 ? "High" : pi >= 50 ? "Elevated" : "Routine";
  return { wp, swing, S, B, T, W, pi, band, phase: b <= 30 ? "DEATH" : "MID" };
}
