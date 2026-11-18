import { getMeta } from "@/lib/data";
import { COPY } from "@/lib/copy";
import { grp, pct } from "@/lib/format";
import { COLORS } from "@/lib/scale";
import { PageHeader, Panel } from "@/components/Panel";
import { BarList } from "@/components/BandBars";
import { HeatGrid } from "@/components/HeatGrid";
import { CalibrationLine, Funnel, MiniScatter } from "@/components/MethodCharts";

export const metadata = { title: "Method | Reliable Under Pressure" };

const STEPS: [string, string][] = [
  ["Rebuild the state before every ball", "Runs, wickets, legal balls, balls left and the target, rebuilt from the delivery rows. Innings totals match the stated run margin in 98.8% of unrevised run-margin results."],
  ["Fit resources and win probability", "A smooth curve in the Duckworth-Lewis form, fitted to this data, gives expected further runs from balls and wickets left. Two logistic models turn that into win probability for a first innings and for a chase, with an IPL term for the higher scoring."],
  ["Score the swing of each ball", "Swing is the expected absolute movement in win probability from one delivery, summed over seven outcomes at their league frequencies."],
  ["Build the Pressure Index", "0.50 swing percentile, 0.20 balance, 0.15 innings clock, 0.15 wicket stress, times 1.15 in knockouts. Balls with win probability under 3% or over 97% are dead and dropped."],
  ["Value each ball", "Change in win probability from the batter's own runs and wicket, or the bowler's runs and wicket, divided by the ball's swing."],
  ["Compare with the league in the same situation", "Subtract the league mean for the same innings, phase, pressure band and bowling kind, so zero means an average result for that kind of ball."],
  ["Adjust for the opposition", "A ridge regression removes each opponent's effect from every ball."],
  ["Rate with two-level shrinkage", "True pressure and ordinary levels are treated as correlated. Each player's expected pressure value is his posterior mean given both records. Recent balls count more: weights halve every year for batters and every three years for bowlers. Ranks sort on the floor, the level we are 80% sure he exceeds."],
  ["Check consistency", "Four hundred resamples of whole matches, an odd against even match split, an out-of-time test on later seasons, and nine stability variants."],
  ["Publish with a hash", "Both lists, every table and every chart come from one script and carry the same model hash."],
];

export default function MethodPage() {
  const m = getMeta();
  const v = m.validation;
  const d = m.deck;
  const sens = v.sensitivity;
  const sh = v.split_half;
  const pair = (r: "bat" | "bowl", a: 0 | 1) => sh[r].points.map((p) => (a === 0 ? [p[0], p[1]] : [p[2], p[3]]) as [number, number]);
  const liftPts = (r: "bat" | "bowl") => sh[r].points.map((p) => [p[0] - p[2], p[1] - p[3]] as [number, number]);
  const tbl = "w-full text-sm";
  return (
    <div className="space-y-6">
      <PageHeader kicker="Reproduce it" title={COPY.method.title} lede={COPY.method.lede} />

      <Panel title="Ten steps from a ball to a rank">
        <ol className="grid gap-3 md:grid-cols-2">
          {STEPS.map(([h, b], i) => (
            <li key={h} className="flex gap-3  bg-rr-panel p-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center  bg-rr-navy text-sm font-extrabold text-white">{i + 1}</span>
              <span>
                <span className="block text-sm font-bold text-rr-navy">{h}</span>
                <span className="block text-sm text-rr-muted">{b}</span>
              </span>
            </li>
          ))}
        </ol>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Win probability: predicted against actual" caption="Out of fold, grouped by match. Dashed line is perfect calibration.">
          <div className="grid grid-cols-2 gap-4">
            <CalibrationLine cal={v.wp.inn1.cal} label={`First innings, AUC ${v.wp.inn1.auc.toFixed(2)}`} />
            <CalibrationLine cal={v.wp.inn2.cal} label={`Chase, AUC ${v.wp.inn2.auc.toFixed(2)}`} />
          </div>
        </Panel>
        <Panel title="The simple model beats the boosted benchmark" caption="Log loss out of fold; lower is better. Base rate means always predicting the average.">
          <BarList
            ariaLabel="Log loss comparison"
            max={0.72}
            items={[
              { label: "Chase, logistic", value: v.wp.inn2.ll, display: v.wp.inn2.ll.toFixed(3), color: COLORS.pink },
              { label: "Chase, boosted", value: v.wp.inn2.ll_gbm, display: v.wp.inn2.ll_gbm.toFixed(3), color: COLORS.series },
              { label: "Chase, base rate", value: v.wp.inn2.ll_base, display: v.wp.inn2.ll_base.toFixed(3), color: COLORS.grey },
              { label: "First inn., logistic", value: v.wp.inn1.ll, display: v.wp.inn1.ll.toFixed(3), color: COLORS.pink },
              { label: "First inn., boosted", value: v.wp.inn1.ll_gbm, display: v.wp.inn1.ll_gbm.toFixed(3), color: COLORS.series },
              { label: "First inn., base rate", value: v.wp.inn1.ll_base, display: v.wp.inn1.ll_base.toFixed(3), color: COLORS.grey },
            ]}
          />
        </Panel>
      </div>

      <Panel title="What repeats and what does not" caption="Each dot is a player with at least 50 balls in every cell. Odd-numbered matches on the horizontal axis, even-numbered on the vertical.">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-3">
            <p className="text-sm font-bold text-rr-pink-deep">Batters, {sh.bat.n} players</p>
            <MiniScatter pts={pair("bat", 0)} color={COLORS.pink} label="Pressure value" />
            <MiniScatter pts={pair("bat", 1)} color={COLORS.series} label="Ordinary value" />
            <MiniScatter pts={liftPts("bat")} color={COLORS.navy} label="Lift (pressure minus ordinary)" />
          </div>
          <div className="space-y-3">
            <p className="text-sm font-bold text-rr-pink-deep">Bowlers, {sh.bowl.n} players</p>
            <MiniScatter pts={pair("bowl", 0)} color={COLORS.pink} label="Pressure value" />
            <MiniScatter pts={pair("bowl", 1)} color={COLORS.series} label="Ordinary value" />
            <MiniScatter pts={liftPts("bowl")} color={COLORS.navy} label="Lift (pressure minus ordinary)" />
          </div>
          <div className="bg-rr-panel p-4 text-sm text-rr-navy">
            <p className="text-sm font-bold">Reading the correlations</p>
            <table className={`${tbl} mt-2`}>
              <thead>
                <tr className="text-left text-xs text-rr-muted">
                  <th className="py-1 font-semibold">Measure</th>
                  <th className="py-1 text-right font-semibold">Batters</th>
                  <th className="py-1 text-right font-semibold">Bowlers</th>
                </tr>
              </thead>
              <tbody className="tnum">
                <tr><td>Pressure value</td><td className="text-right">{d.sh.bat.r_pressure}</td><td className="text-right">{d.sh.bowl.r_pressure}</td></tr>
                <tr><td>Ordinary value</td><td className="text-right">{d.sh.bat.r_ordinary}</td><td className="text-right">{d.sh.bowl.r_ordinary}</td></tr>
                <tr className="font-bold text-rr-pink-deep"><td>Lift</td><td className="text-right">{d.sh.bat.r_lift}</td><td className="text-right">{d.sh.bowl.r_lift}</td></tr>
                <tr><td>True pressure and ordinary level</td><td className="text-right">{d.rho.bat}</td><td className="text-right">{d.rho.bowl}</td></tr>
              </tbody>
            </table>
            <p className="mt-3">
              Quality repeats; extra under pressure does not. That is why the rating blends both records. Share labelled Rises or Dips: {d.lift_share.bat} of batters and {d.lift_share.bowl} of bowlers, against about {d.lift_chance} that noise alone would give.
            </p>
          </div>
        </div>
      </Panel>

      <Panel title="Out of time: does the rating predict later seasons" caption="Ratings built only from 2022 to 2024, then compared with pressure value in 2025 and 2026. Later value of each group's top 10; higher is better.">
        <div className="grid gap-6 md:grid-cols-2">
          {(["bat", "bowl"] as const).map((r) => (
            <div key={r}>
              <p className={`mb-2 text-xs font-bold ${r === "bat" ? "text-rr-pink-deep" : "text-rr-series"}`}>{r === "bat" ? "Batters" : "Bowlers"}, {d.oot[r].players} players</p>
              <BarList
                ariaLabel={`Out of time test, ${r}`}
                max={0.25}
                items={[
                  { label: "Top 10 by our floor", value: Math.max(0, parseFloat(d.oot[r].top_floor)), display: d.oot[r].top_floor, color: COLORS.pink },
                  { label: "Top 10 by raw numbers", value: Math.max(0, parseFloat(d.oot[r].top_raw)), display: d.oot[r].top_raw, color: COLORS.series },
                  { label: "Pool average", value: Math.max(0, parseFloat(d.oot[r].pool)), display: d.oot[r].pool, color: COLORS.grey },
                ]}
              />
              <p className="mt-2 text-sm text-rr-muted">Correlation of the floor with later pressure value: {d.oot[r].corr_floor}; of raw pressure numbers: {d.oot[r].corr_raw}.</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-rr-navy">
          Reading: for bowlers the rating predicts later pressure performance and clearly beats raw pressure numbers. For batters nothing predicts later pressure value, ours included, so the batting list describes the recent record and is firm only at the top.
        </p>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="The 110-ball gate against other gates" caption="Top 10 batters and bowlers at four gates. The gate moved from 120 to 110 during the audit.">
          <table className={tbl}>
            <thead>
              <tr className="text-left text-xs text-rr-muted"><th className="py-1 font-semibold">Gate</th><th className="py-1 font-semibold">Batters</th><th className="py-1 font-semibold">Bowlers</th></tr>
            </thead>
            <tbody>
              {Object.entries(d.gates).map(([g, v]) => (
                <tr key={g} className={g === d.gate ? "bg-rr-pink-tint" : ""}>
                  <td className="tnum py-1.5 pr-2 align-top font-bold text-rr-navy">{g}</td>
                  <td className="py-1.5 pr-2 align-top text-xs">{v.bat.map((n) => n.split(" ").slice(-1)[0]).join(", ")}</td>
                  <td className="py-1.5 align-top text-xs">{v.bowl.map((n) => n.split(" ").slice(-1)[0]).join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title="Edge cases and how they are treated" caption="Counts come from the delivery file.">
          <ul className="space-y-2 text-sm text-rr-navy">
            <li><span className="tnum font-bold">{d.edge.reduced_inferred.length}</span> shortened matches with no revision recorded: both innings capped at the first innings length.</li>
            <li><span className="tnum font-bold">{d.edge.dls_chases_dropped.length}</span> rain-affected chases with no revised target: dropped from valuation and training.</li>
            <li><span className="tnum font-bold">{d.edge.retired_out_rows}</span> tactical retired-outs: charged to neither batter nor bowler.</li>
            <li><span className="tnum font-bold">{d.edge.wide_stumpings}</span> stumpings off wides: charged to the batter with no runs and no ball used.</li>
            <li><span className="tnum font-bold">{d.edge.matches_not_decided}</span> matches with no result, a tie or a super over: valued ball by ball, never used to train win probability.</li>
          </ul>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Stability of the ranking" caption="Rank correlation with the base ranking, and how many of the base top 10 stay in the top 10.">
          <HeatGrid
            rows={sens.map((s) => s.variant)}
            cols={["Batters rho", "Kept", "Bowlers rho", "Kept"]}
            values={sens.map((s) => [s.bat_rho, s.bat_kept / 10, s.bowl_rho, s.bowl_kept / 10])}
            scale={{ kind: "seq", min: 0.5, max: 1 }}
            format={(x, _r, c) => (c % 2 === 1 ? String(Math.round(x * 10)) : x.toFixed(2))}
            labelWidth={180}
            cellWidth={76}
            cellHeight={30}
            ariaLabel="Stability of the ranking across nine variants"
          />
          <p className="mt-2 text-xs text-rr-muted">
            Lowest rank correlation: {d.min_rho.bat} for batters, {d.min_rho.bowl} for bowlers. Kept columns count names, so they scale 0 to 10.
          </p>
        </Panel>
        <Panel title="Who is eligible" caption="Players left after each gate. Qualified means 110 pressure balls and 110 ordinary balls; the gate moved from 120 during the audit and the 120 result is shown below.">
          <p className="mb-1 text-sm font-bold text-rr-pink-deep">Batters</p>
          <Funnel steps={["Any ball faced", "40 and 40 balls", "Qualified (110 and 110)", "And active since June 2025", "And IPL-eligible", "And not barred"]} values={v.funnel.bat} color={COLORS.pink} />
          <p className="mb-1 mt-4 text-sm font-bold text-rr-series">Bowlers</p>
          <Funnel steps={["Any ball bowled", "40 and 40 balls", "Qualified (110 and 110)", "And active since June 2025", "And IPL-eligible", "And not barred"]} values={v.funnel.bowl} color={COLORS.series} />
        </Panel>
      </div>

      <Panel title="Where the model is less certain">
        <ol className="grid gap-2 md:grid-cols-2">
          {COPY.limits.map((l, i) => (
            <li key={l} className="flex gap-3 text-sm text-rr-navy">
              <span className="tnum font-extrabold text-rr-pink-deep">{i + 1}</span>
              <span>{l}</span>
            </li>
          ))}
        </ol>
      </Panel>

      <Panel title="Data used and how to rerun">
        <div className="grid gap-4 md:grid-cols-2">
          <table className={tbl}>
            <tbody className="tnum">
              <tr><td className="py-1 text-rr-muted">Rows in the delivery file</td><td className="text-right font-semibold">{grp(m.data.raw_rows)}</td></tr>
              <tr><td className="py-1 text-rr-muted">Balls used after filters</td><td className="text-right font-semibold">{grp(m.data.balls_used)}</td></tr>
              <tr><td className="py-1 text-rr-muted">Live balls (win probability 3% to 97%)</td><td className="text-right font-semibold">{grp(m.data.live)}</td></tr>
              <tr><td className="py-1 text-rr-muted">Matches used</td><td className="text-right font-semibold">{grp(m.data.matches)}</td></tr>
              <tr><td className="py-1 text-rr-muted">Run-margin reconciliation</td><td className="text-right font-semibold">{pct(m.data.recon, 1)}</td></tr>
              <tr><td className="py-1 text-rr-muted">Model checks passed</td><td className="text-right font-semibold">{m.meta.checks_passed} of {m.meta.checks_total}</td></tr>
              <tr><td className="py-1 text-rr-muted">Model hash</td><td className="text-right font-mono font-semibold">{m.meta.hash}</td></tr>
            </tbody>
          </table>
          <div className="text-sm text-rr-navy">
            <p className="font-semibold">Six commands</p>
            <pre className="mt-2 overflow-x-auto  bg-rr-navy p-3 text-xs leading-relaxed text-white">{`python -X utf8 -m pip install pandas numpy scipy scikit-learn lightgbm
# place the six CSV files in raw-data/
python -X utf8 model/pressure_model.py
python -X utf8 model/figures.py
npm install
npm run build`}</pre>
            <p className="mt-3 text-rr-muted">
              The script prints CHECKS and the hash, then both top-10 lists. The repository holds code and derived tables only; the delivery file is not published.
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
}
