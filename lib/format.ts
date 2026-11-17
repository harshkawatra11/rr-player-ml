const MINUS = "−";

/** Signed number with a true minus sign. Zero prints unsigned. */
export function sgn(x: number | null | undefined, dp = 2): string {
  if (x === null || x === undefined || Number.isNaN(x)) return "n/a";
  const v = Number(x.toFixed(dp));
  return `${v > 0 ? "+" : v < 0 ? MINUS : ""}${Math.abs(v).toFixed(dp)}`;
}

/** Plain number with a true minus sign. */
export function num(x: number | null | undefined, dp = 0): string {
  if (x === null || x === undefined || Number.isNaN(x)) return "n/a";
  const v = Number(x.toFixed(dp));
  return `${v < 0 ? MINUS : ""}${Math.abs(v).toFixed(dp)}`;
}

/** Share between 0 and 1 as a percentage. */
export function pct(x: number | null | undefined, dp = 0): string {
  if (x === null || x === undefined || Number.isNaN(x)) return "n/a";
  return `${(x * 100).toFixed(dp)}%`;
}

/** Indian digit grouping, for example 2,00,999. */
export function grp(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "n/a";
  const neg = n < 0;
  const s = String(Math.round(Math.abs(n)));
  let out = s;
  if (s.length > 3) {
    const head = s.slice(0, -3);
    const tail = s.slice(-3);
    out = head.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + tail;
  }
  return (neg ? MINUS : "") + out;
}

export function ordinal(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10 > 3 ? 0 : n % 10] ?? "th"}`;
}

/** Last word of a name, for compact labels. */
export function surname(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1];
}

export const PHASE_LABEL: Record<string, string> = { PP: "Powerplay", MID: "Middle", DEATH: "Death", ALL: "All" };
export const ROLE_LABEL: Record<string, string> = { bat: "Batters", bowl: "Bowlers" };
export const rateLabel = (role: "bat" | "bowl") => (role === "bat" ? "Strike rate" : "Economy");
