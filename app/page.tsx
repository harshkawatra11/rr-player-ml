import Link from "next/link";
import { getMeta, getTop10 } from "@/lib/data";
import { COPY } from "@/lib/copy";
import { Panel, PageHeader } from "@/components/Panel";
import { KpiTile } from "@/components/KpiTile";
import { LeaderTable } from "@/components/LeaderTable";

export default function WarRoom() {
  const m = getMeta();
  const d = m.deck;
  const bat = getTop10("bat");
  const bowl = getTop10("bowl");
  const three = (rows: string[][]) => `${rows[0][1]}, ${rows[1][1]} and ${rows[2][1]}`;
  const band = m.validation.bands;
  return (
    <div className="space-y-6">
      <PageHeader kicker={COPY.home.kicker} title={COPY.home.title} lede={COPY.home.lede} />

      <section className="bg-rr-navy p-5 text-white sm:p-6">
        <p className="text-sm font-bold text-rr-pink">The verdict, in our model</p>
        <p className="mt-2 text-xl font-bold leading-snug sm:text-2xl">
          {three(d.top_bat)} lead the batters; {three(d.top_bowl)} lead the bowlers.
        </p>
        <p className="mt-3 max-w-3xl text-sm text-white/75">
          A player&apos;s extra under pressure barely repeats from one half of his matches to the other ({d.sh.bat.r_lift} for batters, {d.sh.bowl.r_lift} for bowlers), and for bowlers the rating beats raw pressure numbers on later seasons ({d.oot.bowl.top_floor} against {d.oot.bowl.top_raw}).
          Each rank blends the pressure record with the everyday record behind it, weights recent seasons more, and sorts on the level we are 80% sure the player exceeds.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <Link href="/method/" className="bg-rr-pink px-4 py-1.5 font-semibold text-white">
            How it works
          </Link>
          <Link href="/auction/" className="border border-white/40 px-4 py-1.5 font-semibold text-white">
            Royals board
          </Link>
          <a href={COPY.researchPath} className="border border-white/40 px-4 py-1.5 font-semibold text-white">
            Research PDF
          </a>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-px border border-rr-line bg-rr-line lg:grid-cols-4">
        <KpiTile label="Balls in the file" value={d.n_balls} note={`${d.n_matches} matches, IPL 2022 to 2026 and T20I`} />
        <KpiTile label="Pressure balls" value={d.n_pressure} tone="pink" note={`One live ball in four, of ${d.n_live}`} />
        <KpiTile label="Chase AUC, out of fold" value={d.auc2} tone="blue" note={`Log loss ${d.ll2}; boosted benchmark AUC ${d.auc2_gbm}`} />
        <KpiTile label="Bowlers, later seasons" value={d.oot.bowl.top_floor} tone="pink" note={`Top 10 by our floor, 2025 to 2026; raw numbers ${d.oot.bowl.top_raw}, pool ${d.oot.bowl.pool}`} />
      </div>

      <Panel title={COPY.home.findingsTitle} source={`Model hash ${d.hash}; ${d.n_balls} deliveries, IPL and T20I, 2022 to 2026`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-rr-muted">
              <th className="w-28 py-2 pr-4 font-semibold">Figure</th>
              <th className="py-2 pr-4 font-semibold">Finding</th>
              <th className="hidden py-2 font-semibold md:table-cell">Where to see it</th>
            </tr>
          </thead>
          <tbody className="align-top">
            <tr className="border-t border-rr-line">
              <td className="tnum py-3 pr-4 text-2xl font-bold text-rr-pink-deep">{d.swing_ratio}x</td>
              <td className="py-3 pr-4 text-rr-navy">An Extreme-band ball moves win probability {band[3] ? (band[3].swing * 100).toFixed(2) : ""} points on average against {band[0] ? (band[0].swing * 100).toFixed(2) : ""} for a routine ball, and wickets fall on {d.band_wkt[3]} of its balls against {d.band_wkt[0]}.</td>
              <td className="hidden py-3 text-rr-muted md:table-cell"><Link href="/pressure/" className="underline">Pressure Lab</Link></td>
            </tr>
            <tr className="border-t border-rr-line">
              <td className="tnum py-3 pr-4 text-2xl font-bold text-rr-navy">{d.share["2|DEATH"]}</td>
              <td className="py-3 pr-4 text-rr-navy">of chase death-over balls are pressure balls, against {d.share["1|MID"]} of first-innings middle-over balls, and {d.share_ko} of knockout balls against {d.share_league} in league matches.</td>
              <td className="hidden py-3 text-rr-muted md:table-cell"><Link href="/pressure/" className="underline">Pressure Lab</Link></td>
            </tr>
            <tr className="border-t border-rr-line">
              <td className="tnum py-3 pr-4 text-2xl font-bold text-rr-blue">{d.firm.bat} and {d.firm.bowl}</td>
              <td className="py-3 pr-4 text-rr-navy">batters and bowlers are firm names. {COPY.home.firmNote} Lower ranks are softer in both lists.</td>
              <td className="hidden py-3 text-rr-muted md:table-cell"><Link href="/method/" className="underline">Method</Link></td>
            </tr>
          </tbody>
        </table>
      </Panel>

      <LeaderTable players={bat} role="bat" title="Top 10 batters under pressure" />
      <LeaderTable players={bowl} role="bowl" title="Top 10 bowlers under pressure" />

      <p className="text-sm text-rr-muted">
        Floor is in standardised swing units. One unit of floor is about {d.swp} win-probability points a pressure ball; a floor of 0.10 is roughly {(0.1 * Number(d.swp) * 100).toFixed(0)} points per 100 pressure balls. Player pages show the same value in
        both units.
      </p>
    </div>
  );
}
