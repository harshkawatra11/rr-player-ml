"use client";

import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ShowcaseMatch } from "@/lib/types";
import { COLORS } from "@/lib/scale";

/** Chasing side's win probability at the start of each over (line) with the mean Pressure Index of the over (bars). */
export function MatchWorm({ match, height = 320 }: { match: ShowcaseMatch; height?: number }) {
  const data = match.overs
    .filter((o) => o[0] === 2)
    .map((o) => ({ over: o[1], wp: o[2] === null ? null : Math.round(o[2] * 1000) / 10, pi: o[3] === null ? null : Math.round(o[3]), runs: o[4], wk: o[5] }));
  const chaser = match.overs.find((o) => o[0] === 2)?.[6] ?? "Chasing side";
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 24, left: 0 }}>
          <CartesianGrid stroke={COLORS.line} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="over" tick={{ fontSize: 12, fill: COLORS.navy }} label={{ value: "Over of the chase", position: "bottom", offset: 8, fontSize: 12, fill: COLORS.navy }} />
          <YAxis yAxisId="wp" domain={[0, 100]} tick={{ fontSize: 12, fill: COLORS.navy }} width={36} label={{ value: `${chaser} win probability, %`, angle: -90, position: "insideLeft", fontSize: 12, fill: COLORS.navy, dx: 4 }} />
          <YAxis yAxisId="pi" orientation="right" domain={[0, 100]} tick={{ fontSize: 12, fill: COLORS.pinkDeep }} width={36} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as { wp: number | null; pi: number | null; runs: number; wk: number };
              return (
                <div className="rounded-md border border-rr-line bg-white px-3 py-2 text-xs shadow">
                  <p className="font-semibold text-rr-navy">Over {label}</p>
                  <p className="tnum text-rr-muted">Win probability at the start: {d.wp ?? "n/a"}%</p>
                  <p className="tnum text-rr-muted">Mean Pressure Index: {d.pi ?? "n/a"}</p>
                  <p className="tnum text-rr-muted">Runs {d.runs}, wickets {d.wk}</p>
                </div>
              );
            }}
          />
          <Bar yAxisId="pi" dataKey="pi" fill={COLORS.pink} fillOpacity={0.3} radius={[3, 3, 0, 0]} isAnimationActive={false} />
          <Line yAxisId="wp" type="monotone" dataKey="wp" stroke={COLORS.navy} strokeWidth={2.5} dot={{ r: 3, fill: COLORS.navy }} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
