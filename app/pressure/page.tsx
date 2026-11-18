import { getGrid, getMeta, getShowcase } from "@/lib/data";
import { grp, pct } from "@/lib/format";
import { COLORS } from "@/lib/scale";
import { PageHeader, Panel } from "@/components/Panel";
import { KpiTile } from "@/components/KpiTile";
import { HeatGrid } from "@/components/HeatGrid";
import { BarList } from "@/components/BandBars";
import { ChaseHeat } from "@/components/pressure/ChaseHeat";
import { Replay } from "@/components/pressure/Replay";

export const metadata = { title: "Pressure Lab | Reliable Under Pressure" };

export default function PressureLab() {
  const m = getMeta();
  const g = getGrid();
  const d = m.deck;
  const v = m.validation;
  const w = g.weights;
  const bands = v.bands;
  const share = v.hp_share;
  const cells = [1, 2].map((i) => ["PP", "MID", "DEATH"].map((p) => 100 * (share[`${i}|${p}`] ?? 0)));
  const segs = [
    ["Swing", w.swing, COLORS.pink],
    ["Balance", w.balance, COLORS.series],
    ["Clock", w.clock, COLORS.navy],
    ["Wicket stress", w.wstress, COLORS.grey],
  ] as const;
  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Pressure Lab"
        title="What counts as pressure, and does it separate situations"
        lede="One live ball in four is a pressure ball. The index below is built from four signals the brief names, and the charts show that it picks out different kinds of ball."
      />

      <div className="grid grid-cols-2 gap-px border border-rr-line bg-rr-line lg:grid-cols-4">
        <KpiTile label="Live balls" value={d.n_live} note={`${d.dead_share} of balls are decided and dropped`} />
        <KpiTile label="Pressure balls" value={d.n_pressure} tone="pink" note="Pressure Index 75 or more" />
        <KpiTile label="Swing, Extreme against Routine" value={`${d.swing_ratio}x`} tone="pink" note={`${d.band_swing[3]} against ${d.band_swing[0]} points a ball`} />
        <KpiTile label="Wicket rate, Extreme" value={d.band_wkt[3]} tone="blue" note={`Routine balls: ${d.band_wkt[0]}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="The Pressure Index" caption="Percentile of one score, among all live balls; knockouts are lifted by 15%.">
          <p className="bg-rr-panel p-3 font-mono text-sm text-rr-navy">raw = (0.50 x Swing + 0.20 x Balance + 0.15 x Clock + 0.15 x Wicket stress) x (1 + 0.15 x knockout)</p>
          <div className="mt-4 flex h-5 overflow-hidden " role="img" aria-label="Weights of the four signals">
            {segs.map(([n, k, c]) => (
              <span key={n} style={{ width: `${k * 100}%`, background: c }} title={`${n} ${Math.round(k * 100)}%`} />
            ))}
          </div>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-rr-muted">
            {segs.map(([n, k, c]) => (
              <li key={n} className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 " style={{ background: c }} />
                {n} {Math.round(k * 100)}%
              </li>
            ))}
          </ul>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-rr-muted">
                <th className="py-1 font-semibold">Signal</th>
                <th className="py-1 font-semibold">What it measures</th>
                <th className="py-1 font-semibold">The brief&apos;s word</th>
              </tr>
            </thead>
            <tbody className="align-top">
              <tr>
                <td className="py-1.5 font-semibold text-rr-navy">Swing</td>
                <td className="py-1.5">How far one ball can move win probability</td>
                <td className="py-1.5 text-rr-muted">Required rate, balls left, wickets in hand</td>
              </tr>
              <tr>
                <td className="py-1.5 font-semibold text-rr-navy">Balance</td>
                <td className="py-1.5">How close the contest is</td>
                <td className="py-1.5 text-rr-muted">How close the contest is</td>
              </tr>
              <tr>
                <td className="py-1.5 font-semibold text-rr-navy">Clock</td>
                <td className="py-1.5">Share of the innings gone, squared</td>
                <td className="py-1.5 text-rr-muted">Stage of the innings</td>
              </tr>
              <tr>
                <td className="py-1.5 font-semibold text-rr-navy">Wicket stress</td>
                <td className="py-1.5">Wickets down beyond the league norm</td>
                <td className="py-1.5 text-rr-muted">Wickets in hand</td>
              </tr>
            </tbody>
          </table>
        </Panel>
        <Panel title="The four bands" caption="Mean swing rises with the band. Swing is win-probability points a ball.">
          <BarList
            ariaLabel="Mean swing by pressure band"
            items={bands.map((b, i) => ({
              label: b.name.split(" (")[0],
              value: b.swing * 100,
              display: (b.swing * 100).toFixed(2),
              color: i >= 2 ? COLORS.pink : COLORS.series,
              note: `${grp(b.n)} balls, wicket rate ${pct(b.wkt, 1)}, ${pct(b.inn2)} in chases`,
            }))}
          />
        </Panel>
      </div>

      <Panel title="Chase heat map" caption="Pick wickets in hand and a measure; every cell is a chase state in the latest IPL scoring environment.">
        <ChaseHeat grid={g} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Where pressure lives" caption="Share of live balls that are pressure balls, by innings and phase.">
          <HeatGrid
            rows={["First innings", "Chase"]}
            cols={["Powerplay", "Middle", "Death"]}
            values={cells}
            scale={{ kind: "seq", min: 0, max: 80 }}
            format={(x) => `${x.toFixed(0)}%`}
            labelWidth={110}
            cellWidth={90}
            cellHeight={42}
            fontSize={13}
            ariaLabel="Pressure share by innings and phase"
          />
          <div className="mt-4 grid grid-cols-2 gap-px border border-rr-line bg-rr-line">
            <KpiTile label="Knockout matches" value={d.share_ko} tone="pink" />
            <KpiTile label="League matches" value={d.share_league} tone="blue" />
          </div>
        </Panel>
        <Panel title="Replay a high-pressure chase" caption="Twelve IPL chases with the highest average Pressure Index. Line: win probability. Bars: Pressure Index.">
          <Replay matches={getShowcase()} />
        </Panel>
      </div>
    </div>
  );
}
