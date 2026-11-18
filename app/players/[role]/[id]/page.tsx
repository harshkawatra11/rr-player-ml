import Link from "next/link";
import { notFound } from "next/navigation";
import { getMeta, getPlayer, getPlayers, getRanked } from "@/lib/data";
import type { Player, Role, SplitRow } from "@/lib/types";
import { grp, num, ordinal, pct, sgn, rateLabel } from "@/lib/format";
import { PageHeader, Panel } from "@/components/Panel";
import { KpiTile, LiftChip } from "@/components/KpiTile";
import { Dumbbell, type DumbbellRow } from "@/components/Dumbbell";
import { HeatGrid } from "@/components/HeatGrid";
import { SeasonLine } from "@/components/players/SeasonLine";
import { BarList } from "@/components/BandBars";
import { COLORS } from "@/lib/scale";

export const dynamicParams = false;

export function generateStaticParams() {
  return (["bat", "bowl"] as const).flatMap((role) => getPlayers(role).map((p) => ({ role, id: String(p.id) })));
}

export async function generateMetadata({ params }: { params: Promise<{ role: string; id: string }> }) {
  const { role, id } = await params;
  const p = getPlayer(role as Role, Number(id));
  return { title: `${p?.name ?? "Player"} | Reliable Under Pressure` };
}

const val = (rows: SplitRow[], key: string) => rows.find((r) => r[0] === key);
const dom = (a: number | null, b: number | null, pad: number): [number, number] => {
  const xs = [a, b].filter((v): v is number => v !== null);
  if (!xs.length) return [0, 1];
  return [Math.min(...xs) - pad, Math.max(...xs) + pad];
};

export default async function ProfilePage({ params }: { params: Promise<{ role: string; id: string }> }) {
  const { role: r, id } = await params;
  if (r !== "bat" && r !== "bowl") notFound();
  const role = r as Role;
  const p = getPlayer(role, Number(id));
  if (!p) notFound();
  const m = getMeta();
  const ranked = getRanked(role);
  const near = p.rank ? ranked.filter((q) => Math.abs((q.rank as number) - p.rank!) <= 2 && q.id !== p.id) : [];
  const phases = ["PP", "MID", "DEATH"] as const;
  const mean = (rows: SplitRow[], k: string) => val(rows, k)?.[2] ?? null;
  const cnt = (rows: SplitRow[], k: string) => val(rows, k)?.[1] ?? 0;
  const out = (a: number | null, b: number | null) => (a !== null && b ? a / b : null);
  const outLabel = role === "bat" ? "Dismissal rate" : "Wicket rate";
  const rows: DumbbellRow[] = [
    { label: "Value a ball", pressure: p.xP, ordinary: p.xO, domain: dom(p.xP, p.xO, 0.15), format: (v) => sgn(v) },
    { label: rateLabel(role), pressure: p.rateP, ordinary: p.rateO, domain: dom(p.rateP, p.rateO, role === "bat" ? 20 : 1), format: (v) => v.toFixed(role === "bat" ? 0 : 1) },
    { label: outLabel, pressure: out(p.outsP, p.ballsP), ordinary: out(p.outsO, p.ballsO), domain: dom(out(p.outsP, p.ballsP), out(p.outsO, p.ballsO), 0.01), format: (v) => pct(v, 1) },
    { label: "Dot ball share", pressure: p.dotP, ordinary: p.dotO, domain: dom(p.dotP, p.dotO, 0.05), format: (v) => pct(v) },
    { label: "Boundary share", pressure: p.bndP, ordinary: p.bndO, domain: dom(p.bndP, p.bndO, 0.03), format: (v) => pct(v) },
  ];
  const phaseVals = phases.map((ph) => [mean(p.splits.phase_hp, `${ph}|P`), mean(p.splits.phase_hp, `${ph}|O`)]);
  const phaseCnt = phases.map((ph) => [cnt(p.splits.phase_hp, `${ph}|P`), cnt(p.splits.phase_hp, `${ph}|O`)]);
  const innVals = [1, 2].map((i) => [mean(p.splits.inn_hp, `${i}|P`), mean(p.splits.inn_hp, `${i}|O`)]);
  const kind = ["Pace", "Spin"].map((k) => [mean(p.splits.pace_or_spin_hp, `${k}|P`), mean(p.splits.pace_or_spin_hp, `${k}|O`)]);
  const mask = (vals: (number | null)[][], counts: number[][]) => vals.map((row, i) => row.map((v, j) => (counts[i][j] >= 30 ? v : null)));
  const innCnt = [1, 2].map((i) => [cnt(p.splits.inn_hp, `${i}|P`), cnt(p.splits.inn_hp, `${i}|O`)]);
  const kindCnt = ["Pace", "Spin"].map((k) => [cnt(p.splits.pace_or_spin_hp, `${k}|P`), cnt(p.splits.pace_or_spin_hp, `${k}|O`)]);
  const bands = ["b1", "b2", "b3", "b4"].map((b, i) => ({ b, name: ["Routine", "Elevated", "High", "Extreme"][i], row: val(p.splits.band, b) }));
  const grid = { cols: ["Pressure", "Ordinary"], scale: { kind: "div" as const, min: -0.5, max: 0.5 }, format: (v: number) => sgn(v, 2), labelWidth: 96, cellWidth: 92, cellHeight: 36, fontSize: 13 };
  const kindLabel = role === "bat" ? [p.hand, p.pos ? `bats around ${num(p.pos)}` : null].filter(Boolean).join(", ") : [p.bowl_type, p.bowl_kind].filter(Boolean).join(", ");
  return (
    <div className="space-y-6">
      <PageHeader
        kicker={`${role === "bat" ? "Batter" : "Bowler"}${p.nation ? `, ${p.nation}` : ""}`}
        title={p.name}
        lede={[p.ipl_team ? `Latest IPL side in the data: ${p.ipl_team}` : null, kindLabel || null, p.last ? `Last ball in the data: ${p.last}` : null].filter(Boolean).join(". ")}
        right={<Link href="/players/" className="border border-rr-line bg-white px-4 py-1.5 text-sm font-semibold text-rr-navy">All players</Link>}
      />

      {p.barred && (
        <div className="border border-rr-pink bg-rr-pink-tint p-4 text-sm text-rr-navy" role="note">
          <b>Barred from the top 10: {p.barred}.</b> {p.rank_pre ? `Without the bar the rating would place this player ${ordinal(p.rank_pre)}.` : ""} The record below is unchanged.
        </div>
      )}
      {!p.qualified && (
        <div className="border border-dashed border-rr-line bg-rr-panel p-4 text-sm text-rr-navy" role="note">
          Below the sample gate: {grp(p.nP)} pressure balls and {grp(p.nO)} ordinary balls against the {m.deck.gate} needed for each. Shown for context, not ranked.
        </div>
      )}

      <div className="grid grid-cols-2 gap-px border border-rr-line bg-rr-line lg:grid-cols-4">
        <KpiTile label="Rank" value={p.rank ? `${p.rank}` : "n/a"} tone="pink" note={p.rank && p.rank_lo !== null ? `Rank range ${num(p.rank_lo)} to ${num(p.rank_hi)} in 400 resamples` : "Not in the ranked pool"} />
        <KpiTile label="Floor" value={sgn(p.floor, 3)} note={`${sgn(p.floor_pp100, 0)} win-probability points per 100 pressure balls`} />
        <KpiTile label="Top 10 probability" value={p.p_top10 === null || !p.rank ? "n/a" : pct(p.p_top10)} tone="blue" note={p.p_top10 !== null && p.p_top10 >= 0.65 ? "A firm name" : "Softer: under 65%"} />
        <div className="bg-white px-4 py-3.5">
          <p className="text-[13px] font-medium text-rr-muted">Lift</p>
          <div className="mt-2">
            <LiftChip cls={p.lift_class} />
          </div>
          <p className="tnum mt-2 text-sm text-rr-muted">z {p.lift_z === null ? "n/a" : sgn(p.lift_z)}: pressure value minus ordinary value, in standard errors</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Under pressure against ordinary" caption={`${grp(p.nP)} pressure balls and ${grp(p.nO)} ordinary balls. Each row has its own scale.`}>
          <Dumbbell rows={rows} />
        </Panel>
        <Panel title="By season" caption="Mean value a ball, by calendar year. Years with under 15 balls are left out.">
          <SeasonLine rows={p.splits.year_hp} />
          <p className="mt-2 text-xs text-rr-muted">Recent seasons carry more weight in the rating: batters halve every year, bowlers every three.</p>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="By phase" caption="Mean value; blank under 30 balls.">
          <HeatGrid rows={["Powerplay", "Middle", "Death"]} values={mask(phaseVals, phaseCnt)} {...grid} ariaLabel="Value by phase and pressure state" />
        </Panel>
        <Panel title="By innings" caption="Batting first and chasing.">
          <HeatGrid rows={["First innings", "Chase"]} values={mask(innVals, innCnt)} {...grid} ariaLabel="Value by innings and pressure state" />
        </Panel>
        <Panel title={role === "bat" ? "Against pace and spin" : "Pace or spin"} caption="Mean value by bowling kind.">
          <HeatGrid rows={["Pace", "Spin"]} values={mask(kind, kindCnt)} {...grid} ariaLabel="Value by bowling kind and pressure state" />
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="By pressure band" caption="Mean value in each band; balls in brackets.">
          <BarList
            ariaLabel="Value by pressure band"
            max={Math.max(0.2, ...bands.map((b) => Math.abs(b.row?.[2] ?? 0)))}
            items={bands.map((b) => ({ label: `${b.name} (${b.row ? grp(b.row[1]) : 0})`, value: Math.abs(b.row?.[2] ?? 0), display: b.row?.[2] == null ? "n/a" : sgn(b.row[2]), color: (b.row?.[2] ?? 0) < 0 ? COLORS.series : COLORS.pink }))}
          />
        </Panel>
        <Panel title="Five biggest pressure matches" caption="Win-probability points the player's own pressure balls added in the match (100 points is a full match).">
          {p.matches.length ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-rr-muted">
                  <th className="py-1 font-semibold">Date</th>
                  <th className="py-1 font-semibold">Against</th>
                  <th className="py-1 text-right font-semibold">Pressure balls</th>
                  <th className="py-1 text-right font-semibold">Points</th>
                  <th className="py-1 text-right font-semibold">{role === "bat" ? "Runs off balls" : "Runs, balls"}</th>
                </tr>
              </thead>
              <tbody className="tnum">
                {p.matches.map((x) => (
                  <tr key={x[0] + x[2]} className="border-t border-rr-line">
                    <td className="py-1.5">{x[0]}</td>
                    <td className="py-1.5">{x[2]}</td>
                    <td className="py-1.5 text-right">{x[3]}</td>
                    <td className="py-1.5 text-right font-semibold text-rr-pink-deep">{sgn(x[4], 1)}</td>
                    <td className="py-1.5 text-right">{role === "bat" ? `${x[5]} off ${x[6]}` : `${x[5]} in ${x[6]}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-rr-muted">No pressure matches recorded.</p>
          )}
        </Panel>
      </div>

      {p.pm > 0 && (
        <Panel title="Consistency across matches" caption="Pressure matches with at least 4 pressure balls. Decisive: the player's own balls added 15 or more points. Costly: they cost 15 or more.">
          <div className="grid grid-cols-2 gap-px border border-rr-line bg-rr-line sm:grid-cols-5">
            <KpiTile label="Pressure matches" value={`${p.pm}`} />
            <KpiTile label="Share helping" value={p.pos_share === null ? "n/a" : pct(p.pos_share)} tone="pink" />
            <KpiTile label="Decisive" value={`${p.decisive}`} tone="pink" />
            <KpiTile label="Costly" value={`${p.costly}`} tone="blue" />
            <KpiTile label="Best and worst" value={`${sgn(p.best, 0)} | ${sgn(p.worst, 0)}`} />
          </div>
        </Panel>
      )}

      {near.length > 0 && (
        <Panel title="Neighbours in the ranking" caption="Two above and two below.">
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {near.map((q: Player) => (
              <li key={q.id} className="bg-rr-panel p-3 text-sm">
                <Link href={`/players/${role}/${q.id}/`} className="font-semibold text-rr-navy hover:underline">
                  {q.rank}. {q.name}
                </Link>
                <span className="tnum block text-rr-muted">Floor {sgn(q.floor, 3)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
