"use client";

import { useRouter } from "next/navigation";
import { CartesianGrid, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { COLORS } from "@/lib/scale";

export interface Pt {
  x: number;
  y: number;
  label: string;
  href?: string;
  group: "top" | "rest" | "pick";
  detail?: string;
}

const COLOR = { top: COLORS.pink, rest: COLORS.grey, pick: COLORS.navy } as const;

/** Scatter of two measures per player. Top players in pink, others grey; click a point to open the profile. */
export function ScatterXY({
  points,
  xLabel,
  yLabel,
  height = 360,
  refX = 0,
  refY = 0,
  fmt = (v: number) => v.toFixed(2),
}: {
  points: Pt[];
  xLabel: string;
  yLabel: string;
  height?: number;
  refX?: number | null;
  refY?: number | null;
  fmt?: (v: number) => string;
}) {
  const router = useRouter();
  const groups = (["rest", "top", "pick"] as const).map((g) => ({ g, data: points.filter((p) => p.group === g) }));
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 8, right: 16, bottom: 28, left: 8 }}>
          <CartesianGrid stroke={COLORS.line} strokeDasharray="3 3" />
          <XAxis type="number" dataKey="x" name={xLabel} tick={{ fontSize: 12, fill: COLORS.navy }} tickFormatter={fmt} label={{ value: xLabel, position: "bottom", offset: 10, fontSize: 12, fill: COLORS.navy }} />
          <YAxis type="number" dataKey="y" name={yLabel} tick={{ fontSize: 12, fill: COLORS.navy }} tickFormatter={fmt} label={{ value: yLabel, angle: -90, position: "insideLeft", fontSize: 12, fill: COLORS.navy }} />
          <ZAxis range={[46, 46]} />
          {refX !== null && <ReferenceLine x={refX} stroke={COLORS.navy} strokeWidth={1} />}
          {refY !== null && <ReferenceLine y={refY} stroke={COLORS.navy} strokeWidth={1} />}
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              const d = active && payload?.[0]?.payload ? (payload[0].payload as Pt) : null;
              if (!d) return null;
              return (
                <div className="border border-rr-line bg-white px-3 py-2 text-xs shadow">
                  <p className="font-semibold text-rr-navy">{d.label}</p>
                  <p className="tnum text-rr-muted">
                    {xLabel}: {fmt(d.x)}
                  </p>
                  <p className="tnum text-rr-muted">
                    {yLabel}: {fmt(d.y)}
                  </p>
                  {d.detail && <p className="text-rr-muted">{d.detail}</p>}
                </div>
              );
            }}
          />
          {groups.map(({ g, data }) => (
            <Scatter
              key={g}
              data={data}
              fill={COLOR[g]}
              fillOpacity={g === "rest" ? 0.55 : 0.95}
              onClick={(d: unknown) => {
                const p = d as Pt;
                if (p?.href) router.push(p.href);
              }}
              cursor="pointer"
              isAnimationActive={false}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
