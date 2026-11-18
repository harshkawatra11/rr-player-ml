"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PlayerSearch, type SearchPlayer } from "@/components/PlayerSearch";
import { Panel } from "@/components/Panel";
import { HeatGrid } from "@/components/HeatGrid";
import { LiftChip, ProbPill } from "@/components/KpiTile";
import { COLORS } from "@/lib/scale";
import { grp, num, sgn } from "@/lib/format";

export interface CompareRow extends SearchPlayer {
  nation: string | null;
  floor: number;
  epp: number;
  sd: number;
  xP: number | null;
  xO: number | null;
  nP: number;
  nO: number;
  p_top10: number | null;
  rank_lo: number | null;
  rank_hi: number | null;
  lift_class: "Rises" | "Steady" | "Dips";
  barred: string;
  phase: (number | null)[];
}

const key = (p: { role: string; id: number }) => `${p.role}-${p.id}`;
const PALETTE = [COLORS.pink, COLORS.series, COLORS.navy, COLORS.pinkDeep];

/** Two to four players side by side. The selection lives in the address (?ids=bat-123,bowl-456). */
export function CompareTool({ rows, initial }: { rows: CompareRow[]; initial: string[] }) {
  const [ids, setIds] = useState<string[]>(initial);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("ids");
    if (q) setIds(q.split(",").filter((x) => rows.some((r) => key(r) === x)).slice(0, 4));
  }, [rows]);
  useEffect(() => {
    const u = new URL(window.location.href);
    if (ids.length) u.searchParams.set("ids", ids.join(","));
    else u.searchParams.delete("ids");
    window.history.replaceState(null, "", u.toString());
  }, [ids]);
  const chosen = ids.map((i) => rows.find((r) => key(r) === i)).filter((r): r is CompareRow => !!r);
  const search = useMemo(() => rows.map(({ id, role, name, ipl_team, rank }) => ({ id, role, name, ipl_team, rank })), [rows]);
  const maxV = Math.max(0.1, ...chosen.flatMap((c) => [Math.abs(c.xP ?? 0), Math.abs(c.xO ?? 0)]));
  return (
    <div className="space-y-6">
      <Panel title="Choose two to four players" caption="Mix batters and bowlers if you like; the measures are in the same win-probability units.">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          {chosen.length < 4 ? <PlayerSearch players={search} exclude={ids} onPick={(p) => setIds((c) => [...c, key(p)].slice(0, 4))} placeholder="Search a player to add" /> : <p className="text-sm text-rr-muted">Four players is the limit. Remove one to add another.</p>}
          <ul className="flex flex-wrap gap-2">
            {chosen.map((c, i) => (
              <li key={key(c)} className="flex items-center gap-2  border px-3 py-1 text-sm font-semibold text-rr-navy" style={{ borderColor: PALETTE[i] }}>
                <span className="inline-block h-2.5 w-2.5 " style={{ background: PALETTE[i] }} />
                {c.name}
                <button type="button" aria-label={`Remove ${c.name}`} onClick={() => setIds((x) => x.filter((k) => k !== key(c)))} className="text-rr-muted hover:text-rr-navy">
                  x
                </button>
              </li>
            ))}
          </ul>
        </div>
      </Panel>

      {chosen.length < 2 ? (
        <p className="border border-dashed border-rr-line bg-rr-panel p-6 text-center text-sm text-rr-muted">Add at least two players to compare them.</p>
      ) : (
        <>
          <Panel title="Headline measures">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="text-left text-xs text-rr-muted">
                    <th className="py-2 font-semibold">Measure</th>
                    {chosen.map((c, i) => (
                      <th key={key(c)} className="py-2 font-semibold" style={{ color: PALETTE[i] === COLORS.navy ? COLORS.navy : undefined }}>
                        <Link href={`/players/${c.role}/${c.id}/`} className="hover:underline">
                          {c.name}
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="tnum">
                  {[
                    ["Role", (c: CompareRow) => (c.role === "bat" ? "Batter" : "Bowler")],
                    ["Rank", (c: CompareRow) => (c.rank ? String(c.rank) : c.barred ? `Barred: ${c.barred}` : "Unranked")],
                    ["Latest IPL side", (c: CompareRow) => c.ipl_team ?? "n/a"],
                    ["Pressure balls", (c: CompareRow) => grp(c.nP)],
                    ["Pressure value", (c: CompareRow) => sgn(c.xP)],
                    ["Ordinary value", (c: CompareRow) => sgn(c.xO)],
                    ["Expected value", (c: CompareRow) => sgn(c.epp, 3)],
                    ["Floor", (c: CompareRow) => sgn(c.floor, 3)],
                    ["Rank range", (c: CompareRow) => (c.rank_lo === null ? "n/a" : `${num(c.rank_lo)} to ${num(c.rank_hi)}`)],
                  ].map(([label, f]) => (
                    <tr key={label as string} className="border-t border-rr-line">
                      <td className="py-1.5 font-semibold text-rr-navy">{label as string}</td>
                      {chosen.map((c) => (
                        <td key={key(c)} className="py-1.5">{(f as (c: CompareRow) => string)(c)}</td>
                      ))}
                    </tr>
                  ))}
                  <tr className="border-t border-rr-line">
                    <td className="py-1.5 font-semibold text-rr-navy">Top 10 probability</td>
                    {chosen.map((c) => (
                      <td key={key(c)} className="py-1.5">{c.rank ? <ProbPill p={c.p_top10} /> : "n/a"}</td>
                    ))}
                  </tr>
                  <tr className="border-t border-rr-line">
                    <td className="py-1.5 font-semibold text-rr-navy">Lift</td>
                    {chosen.map((c) => (
                      <td key={key(c)} className="py-1.5"><LiftChip cls={c.lift_class} /></td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </Panel>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Pressure against ordinary value" caption="Pink bar: pressure balls. Blue bar: ordinary balls. Same scale for every player.">
              <ul className="space-y-4">
                {chosen.map((c, i) => (
                  <li key={key(c)}>
                    <p className="mb-1 text-sm font-semibold text-rr-navy">
                      <span className="mr-2 inline-block h-2.5 w-2.5 " style={{ background: PALETTE[i] }} />
                      {c.name}
                    </p>
                    {([["Pressure", c.xP, COLORS.pink], ["Ordinary", c.xO, COLORS.series]] as const).map(([l, v, col]) => (
                      <div key={l} className="grid grid-cols-[70px_1fr_52px] items-center gap-2 text-xs">
                        <span className="text-rr-muted">{l}</span>
                        <span className="h-2.5  bg-rr-panel">
                          <span className="block h-2.5 " style={{ width: `${Math.max(1, (Math.abs(v ?? 0) / maxV) * 100)}%`, background: col, opacity: (v ?? 0) < 0 ? 0.45 : 1 }} />
                        </span>
                        <span className="tnum text-right font-semibold text-rr-navy">{sgn(v)}</span>
                      </div>
                    ))}
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title="Pressure value by phase" caption="Powerplay, middle, death. Blank under 30 pressure balls in the phase.">
              <HeatGrid rows={chosen.map((c) => c.name)} cols={["Powerplay", "Middle", "Death"]} values={chosen.map((c) => c.phase)} scale={{ kind: "div", min: -0.5, max: 0.5 }} format={(v) => sgn(v, 2)} labelWidth={150} cellWidth={84} cellHeight={36} fontSize={13} ariaLabel="Pressure value by phase for the chosen players" />
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
