import { describe, expect, it } from "vitest";
import { board, gapCells } from "./board";
import type { AvailabilityRow, Player, TeamRow } from "./types";

function player(over: Partial<Player> & { id: number; role: "bat" | "bowl"; rank: number }): Player {
  return {
    name: `P${over.id}`, nation: "India", ipl_team: "X", last: "2026-05-01", qualified: true, active: true, eligible: true, hand: null, pos: null,
    bowl_type: null, bowl_kind: null, nP: 200, nO: 400, iplP: 100, xP: 0.2, xO: 0.1, epp: 0.15, sd: 0.04, floor: 0.12 - over.rank * 0.001, floor_pp100: 30, epp_pp100: 40,
    lift: 0.05, lift_z: 0.3, lift_class: "Steady", p_top10: 0.5, p_top20: 0.8, rank_lo: 1, rank_hi: 10, wpaP: 10, wpaAll: 20, rateP: null, rateO: null, runsP: null, runsO: null,
    ballsP: null, ballsO: null, outsP: null, outsO: null, dotP: null, dotO: null, bndP: null, bndO: null,
    splits: { phase_hp: [["DEATH|P", 60, 0.3, 9, 3], ["MID|P", 60, 0.1, 7, 3], ["PP|P", 60, -0.2, 7, 3]], inn_hp: [], pace_or_spin_hp: [], year_hp: [], band: [] },
    matches: [], ...over,
  } as Player;
}

const team = (phase: "PP" | "MID" | "DEATH", role: "bat" | "bowl", rank: number): TeamRow => ({ season: "2026", team: "Rajasthan Royals", role, phase, mean: 0, size: 100, rank });
const rr = { team: [team("DEATH", "bowl", 8), team("MID", "bowl", 3), team("PP", "bowl", 4), team("DEATH", "bat", 2)], squad: [] };
const av = (id: number, role: "bat" | "bowl", status: AvailabilityRow["status"]): AvailabilityRow => ({ player_id: id, name: `P${id}`, role, status, team_2026: null, team_2027: null, last_price_cr: 4, overseas: false, age: 30, status_date: "2026-11-18", source_id: "S01", note: null });

describe("gapCells", () => {
  it("finds role and phase cells ranked 6th or lower in the latest season", () => {
    const { cells, season } = gapCells(rr.team);
    expect(season).toBe("2026");
    expect(cells).toEqual([{ role: "bowl", phase: "DEATH", rank: 8, season: "2026" }]);
  });
});

describe("board", () => {
  const bowlers = [player({ id: 5, role: "bowl", rank: 5 }), player({ id: 3, role: "bowl", rank: 3 }), player({ id: 30, role: "bowl", rank: 30 })];
  const batters = [player({ id: 1, role: "bat", rank: 1 })];

  it("puts every candidate in 'not yet public' when availability is empty", () => {
    const b = board({ rr, availability: [] }, batters, bowlers);
    expect(b.unverified).toHaveLength(4);
    expect(b.tier1).toHaveLength(0);
    expect(b.unverified.map((r) => r.player.rank)).toEqual([1, 3, 5, 30]);
  });
  it("puts a released bowler ranked 5 with a positive death value in tier 1", () => {
    const b = board({ rr, availability: [av(5, "bowl", "RELEASED")] }, batters, bowlers);
    expect(b.tier1.map((r) => r.player.id)).toEqual([5]);
    expect(b.tier1[0].fitPhases).toEqual(["DEATH"]);
  });
  it("puts a retained player ranked 3 on the trade watch", () => {
    const b = board({ rr, availability: [av(3, "bowl", "RETAINED")] }, batters, bowlers);
    expect(b.tradeWatch.map((r) => r.player.id)).toEqual([3]);
  });
  it("puts a released player ranked 30 in tier 2", () => {
    const b = board({ rr, availability: [av(30, "bowl", "AUCTION_POOL")] }, batters, bowlers);
    expect(b.tier2.map((r) => r.player.id)).toEqual([30]);
  });
  it("puts a released batter with no batting gap in tier 2", () => {
    const b = board({ rr, availability: [av(1, "bat", "RELEASED")] }, batters, bowlers);
    expect(b.tier2.map((r) => r.player.id)).toEqual([1]);
  });
  it("lists a top-10 player outside the IPL as register interest", () => {
    const b = board({ rr, availability: [av(3, "bowl", "NOT_IN_IPL")] }, batters, bowlers);
    expect(b.registerInterest.map((r) => r.player.id)).toEqual([3]);
  });
});
