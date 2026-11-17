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

      <section className="rounded-xl bg-rr-navy p-5 text-white sm:p-6">
        <p className="font-display text-xs font-bold uppercase tracking-[0.14em] text-rr-pink">The verdict, in our model</p>
        <p className="mt-2 font-display text-xl font-bold leading-snug sm:text-2xl">
          {three(d.top_bat)} lead the batters; {three(d.top_bowl)} lead the bowlers.
        </p>
        <p className="mt-3 max-w-3xl text-sm text-white/75">
          A player&apos;s extra under pressure does not repeat from one half of his matches to the other ({d.sh.bat.r_lift} for batters, {d.sh.bowl.r_lift} for bowlers), so each rank blends the pressure record with the everyday record behind it and
          sorts on the level we are 80% sure the player exceeds.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <Link href="/method/" className="rounded-full bg-rr-pink px-4 py-1.5 font-semibold text-white">
            How it works
          </Link>
          <Link href="/auction/" className="rounded-full border border-white/40 px-4 py-1.5 font-semibold text-white">
            Royals board
          </Link>
          <a href={COPY.researchPath} className="rounded-full border border-white/40 px-4 py-1.5 font-semibold text-white">
            Research PDF
          </a>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTile label="Balls in the file" value={d.n_balls} note={`${d.n_matches} matches, IPL 2022 to 2026 and T20I`} />
        <KpiTile label="Pressure balls" value={d.n_pressure} tone="pink" note={`One live ball in four, of ${d.n_live}`} />
        <KpiTile label="Chase AUC, out of fold" value={d.auc2} tone="blue" note={`Log loss ${d.ll2}; boosted benchmark AUC ${d.auc2_gbm}`} />
        <KpiTile label="Lift repeatability" value={`${d.sh.bat.r_lift} | ${d.sh.bowl.r_lift}`} tone="pink" note="Batters | bowlers, odd against even matches" />
      </div>

      <Panel title={COPY.home.findingsTitle}>
        <ol className="grid gap-4 md:grid-cols-3">
          <li className="rounded-lg bg-rr-panel p-4">
            <p className="font-display text-3xl font-extrabold text-rr-pink">{d.swing_ratio}x</p>
            <p className="mt-1 text-sm text-rr-navy">
              An Extreme-band ball moves win probability {band[3] ? (band[3].swing * 100).toFixed(2) : ""} points on average against {band[0] ? (band[0].swing * 100).toFixed(2) : ""} for a routine ball, and wickets fall on {d.band_wkt[3]} of
              its balls against {d.band_wkt[0]}.
            </p>
          </li>
          <li className="rounded-lg bg-rr-panel p-4">
            <p className="font-display text-3xl font-extrabold text-rr-navy">{d.share["2|DEATH"]}</p>
            <p className="mt-1 text-sm text-rr-navy">
              of chase death-over balls are pressure balls, against {d.share["1|MID"]} of first-innings middle-over balls and {d.share_ko} of knockout balls against {d.share_league} in league matches.
            </p>
          </li>
          <li className="rounded-lg bg-rr-panel p-4">
            <p className="font-display text-3xl font-extrabold text-rr-series">{d.firm.bat} and {d.firm.bowl}</p>
            <p className="mt-1 text-sm text-rr-navy">
              batters and bowlers are firm names. {COPY.home.firmNote} Ranks 6 to 10 are softer in both lists.
            </p>
          </li>
        </ol>
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
