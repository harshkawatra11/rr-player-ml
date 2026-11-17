import { COLORS } from "@/lib/scale";

/** Whisker from expected value minus 1.28 spreads to plus 1.28 spreads, dot at the expected value, diamond at the floor. */
export function IntervalBar({
  epp,
  sd,
  floor,
  domain,
  width = 190,
  height = 22,
  highlight = true,
}: {
  epp: number;
  sd: number;
  floor: number;
  domain: [number, number];
  width?: number;
  height?: number;
  highlight?: boolean;
}) {
  const pad = 6;
  const x = (v: number) => pad + ((v - domain[0]) / (domain[1] - domain[0])) * (width - 2 * pad);
  const cy = height / 2;
  const lo = epp - 1.28 * sd;
  const hi = epp + 1.28 * sd;
  const zero = domain[0] < 0 && domain[1] > 0 ? x(0) : null;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Floor ${floor.toFixed(3)}, expected value ${epp.toFixed(3)}`}>
      {zero !== null && <line x1={zero} x2={zero} y1={2} y2={height - 2} stroke={COLORS.line} />}
      <line x1={x(lo)} x2={x(hi)} y1={cy} y2={cy} stroke={COLORS.grey} strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={x(epp)} cy={cy} r={4} fill={COLORS.navy} />
      <path d={`M ${x(floor)} ${cy - 6} L ${x(floor) + 6} ${cy} L ${x(floor)} ${cy + 6} L ${x(floor) - 6} ${cy} Z`} fill={highlight ? COLORS.pink : COLORS.series} stroke="#FFFFFF" strokeWidth={1.5} />
    </svg>
  );
}
