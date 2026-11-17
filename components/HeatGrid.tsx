import { COLORS, div, inkOn, seq } from "@/lib/scale";

export interface HeatGridProps {
  rows: string[];
  cols: string[];
  /** values[row][col]; null prints the empty label on white */
  values: (number | null)[][];
  scale: { kind: "seq" | "div"; min: number; max: number };
  format?: (v: number, r: number, c: number) => string;
  emptyLabel?: string;
  /** [row, col] pairs drawn with a navy outline */
  outline?: [number, number][];
  /** Optional hover text per cell */
  title?: (r: number, c: number, v: number | null) => string;
  labelWidth?: number;
  cellWidth?: number;
  cellHeight?: number;
  fontSize?: number;
  ariaLabel?: string;
}

/** Responsive SVG heat grid. Sequential cells run white to pink; diverging cells run blue to white to pink. */
export function HeatGrid({
  rows,
  cols,
  values,
  scale,
  format = (v) => v.toFixed(2),
  emptyLabel = "n/a",
  outline = [],
  title,
  labelWidth = 130,
  cellWidth = 74,
  cellHeight = 34,
  fontSize = 12,
  ariaLabel,
}: HeatGridProps) {
  const headH = 30;
  const W = labelWidth + cellWidth * cols.length;
  const H = headH + cellHeight * rows.length;
  const fill = (v: number) => {
    if (scale.kind === "seq") return seq((v - scale.min) / (scale.max - scale.min || 1));
    const half = Math.max(Math.abs(scale.min), Math.abs(scale.max)) || 1;
    return div(v / half);
  };
  const out = new Set(outline.map(([r, c]) => `${r}-${c}`));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={ariaLabel ?? "Heat grid"}>
      {cols.map((c, j) => (
        <text key={c} x={labelWidth + cellWidth * j + cellWidth / 2} y={headH - 10} textAnchor="middle" fontSize={fontSize} fontWeight={600} fill={COLORS.navy}>
          {c}
        </text>
      ))}
      {rows.map((r, i) => (
        <g key={r + i}>
          <text x={labelWidth - 8} y={headH + cellHeight * i + cellHeight / 2 + fontSize / 3} textAnchor="end" fontSize={fontSize} fontWeight={600} fill={COLORS.navy}>
            {r}
          </text>
          {cols.map((c, j) => {
            const v = values[i]?.[j] ?? null;
            const f = v === null ? "#FFFFFF" : fill(v);
            const x = labelWidth + cellWidth * j;
            const y = headH + cellHeight * i;
            return (
              <g key={c}>
                <rect x={x + 1} y={y + 1} width={cellWidth - 2} height={cellHeight - 2} fill={f} stroke={v === null ? COLORS.line : "none"}>
                  {title && <title>{title(i, j, v)}</title>}
                </rect>
                <text x={x + cellWidth / 2} y={y + cellHeight / 2 + fontSize / 3} textAnchor="middle" fontSize={fontSize} fontWeight={600} fill={v === null ? COLORS.grey : inkOn(f)}>
                  {v === null ? emptyLabel : format(v, i, j)}
                </text>
                {out.has(`${i}-${j}`) && <rect x={x + 2} y={y + 2} width={cellWidth - 4} height={cellHeight - 4} fill="none" stroke={COLORS.navy} strokeWidth={2.5} />}
              </g>
            );
          })}
        </g>
      ))}
    </svg>
  );
}
