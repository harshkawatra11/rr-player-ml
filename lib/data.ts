import fs from "node:fs";
import path from "node:path";
import type { Grid, Meta, Player, Role, ShowcaseMatch, SlimPlayer, TeamRow } from "./types";

const DIR = path.join(process.cwd(), "public", "data");
const cache = new Map<string, unknown>();

function read<T>(file: string): T {
  if (!cache.has(file)) cache.set(file, JSON.parse(fs.readFileSync(path.join(DIR, file), "utf8")));
  return cache.get(file) as T;
}

export const getMeta = (): Meta => read<Meta>("meta.json");
export const getPlayers = (role: Role): Player[] => read<Player[]>(role === "bat" ? "batters.json" : "bowlers.json");
export const getPlayer = (role: Role, id: number): Player | undefined => getPlayers(role).find((p) => p.id === id);
export const getTeams = (): TeamRow[] => read<TeamRow[]>("teams.json");
export const getGrid = (): Grid => read<Grid>("grid.json");
export const getShowcase = (): ShowcaseMatch[] => read<ShowcaseMatch[]>("showcase.json");

export function slim(p: Player): SlimPlayer {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { splits, matches, ...rest } = p;
  return rest;
}

export const getSlimPlayers = (role: Role): SlimPlayer[] => getPlayers(role).map(slim);

/** Eligible, ranked players of a role in rank order. */
export function getRanked(role: Role): Player[] {
  return getPlayers(role)
    .filter((p) => p.rank !== null)
    .sort((a, b) => (a.rank as number) - (b.rank as number));
}

export function getTop10(role: Role): Player[] {
  return getRanked(role).slice(0, 10);
}

/** The franchise ledger exists only after the official retention lists are verified. Returns null until then. */
export function getLedger(): import("./types").Ledger | null {
  const f = path.join(DIR, "ledger.json");
  return fs.existsSync(f) ? (JSON.parse(fs.readFileSync(f, "utf8")) as import("./types").Ledger) : null;
}
