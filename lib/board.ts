import type { AvailabilityRow, Meta, Phase, Player, Role, TeamRow } from "./types";

export interface GapCell {
  role: Role;
  phase: Phase;
  rank: number;
  season: string;
}

export interface BoardRow {
  player: Player;
  role: Role;
  tier: "tier1" | "tier2" | "tradeWatch" | "unverified" | "registerInterest";
  status: AvailabilityRow["status"];
  statusDate: string | null;
  sourceId: string | null;
  price: string | null;
  fitPhases: Phase[];
  availability: AvailabilityRow | null;
}

export interface Board {
  tier1: BoardRow[];
  tier2: BoardRow[];
  tradeWatch: BoardRow[];
  unverified: BoardRow[];
  registerInterest: BoardRow[];
  gapCells: GapCell[];
  latestSeason: string;
}

const PHASES: Phase[] = ["PP", "MID", "DEATH"];
const OPEN = new Set(["RELEASED", "AUCTION_POOL"]);

/** Royals gap cells: role and phase where the Royals rank 6th or lower of 10 in the latest IPL season, pressure balls only. */
export function gapCells(team: TeamRow[]): { cells: GapCell[]; season: string } {
  const rr = team.filter((t) => t.team === "Rajasthan Royals" && t.phase !== "ALL");
  if (!rr.length) return { cells: [], season: "" };
  const season = rr.map((t) => String(t.season)).sort().at(-1) as string;
  const cells = rr
    .filter((t) => String(t.season) === season && t.rank >= 6)
    .map((t) => ({ role: t.role, phase: t.phase as Phase, rank: t.rank, season }));
  return { cells, season };
}

/** Phases of the gap that a player fits: pressure value above zero on 30 or more balls in that phase. */
export function fitPhases(p: Player, cells: GapCell[]): Phase[] {
  const mine = cells.filter((c) => c.role === p.role).map((c) => c.phase);
  return PHASES.filter((ph) => {
    if (!mine.includes(ph)) return false;
    const row = p.splits.phase_hp.find((r) => r[0] === `${ph}|P`);
    return !!row && row[1] >= 30 && (row[2] ?? 0) > 0;
  });
}

function priceText(a: AvailabilityRow | null): string | null {
  if (!a || a.last_price_cr === null || a.last_price_cr === undefined || Number.isNaN(Number(a.last_price_cr))) return null;
  return `Rs ${Number(a.last_price_cr)} crore`;
}

/** Target board, rules of research section 27. Pure function: same inputs, same board. */
export function board(meta: Pick<Meta, "rr" | "availability">, batters: Player[], bowlers: Player[]): Board {
  const { cells, season } = gapCells(meta.rr.team);
  const avail = new Map<string, AvailabilityRow>();
  for (const a of meta.availability ?? []) avail.set(`${a.role}-${a.player_id}`, a);
  const out: Board = { tier1: [], tier2: [], tradeWatch: [], unverified: [], registerInterest: [], gapCells: cells, latestSeason: season };
  const candidates = [...batters, ...bowlers].filter((p) => p.eligible && p.rank !== null && p.rank <= 40);
  for (const p of candidates) {
    const a = avail.get(`${p.role}-${p.id}`) ?? null;
    const status = a?.status ?? "UNVERIFIED";
    const fits = fitPhases(p, cells);
    const rank = p.rank as number;
    const base = { player: p, role: p.role, status, statusDate: a?.status_date ?? null, sourceId: a?.source_id ?? null, price: priceText(a), fitPhases: fits, availability: a };
    if (status === "UNVERIFIED") out.unverified.push({ ...base, tier: "unverified" });
    else if (OPEN.has(status)) {
      const tier = rank <= 20 && fits.length > 0 ? "tier1" : "tier2";
      out[tier].push({ ...base, tier });
    } else if ((status === "RETAINED" || status === "TRADED") && rank <= 20) out.tradeWatch.push({ ...base, tier: "tradeWatch" });
    else if (status === "NOT_IN_IPL" && rank <= 10) out.registerInterest.push({ ...base, tier: "registerInterest" });
  }
  const byFloor = (a: BoardRow, b: BoardRow) => b.player.floor - a.player.floor;
  const byRank = (a: BoardRow, b: BoardRow) => (a.player.rank as number) - (b.player.rank as number);
  out.tier1.sort(byFloor);
  out.tier2.sort(byFloor);
  out.tradeWatch.sort(byFloor);
  out.registerInterest.sort(byFloor);
  out.unverified.sort(byRank);
  return out;
}
