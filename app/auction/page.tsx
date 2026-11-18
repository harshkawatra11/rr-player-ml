import { getLedger, getMeta, getPlayers, getTeams } from "@/lib/data";
import { board } from "@/lib/board";
import { COPY } from "@/lib/copy";
import { ordinal, sgn } from "@/lib/format";
import { COLORS } from "@/lib/scale";
import { PageHeader, Panel, EmptyState } from "@/components/Panel";
import { HeatGrid } from "@/components/HeatGrid";
import { KpiTile } from "@/components/KpiTile";
import { BarList } from "@/components/BandBars";
import { BoardTable } from "@/components/auction/BoardTable";

export const metadata = { title: "Royals Board | Reliable Under Pressure" };

export default function AuctionPage() {
  const m = getMeta();
  const teams = getTeams().filter((t) => t.team === "Rajasthan Royals");
  const bat = getPlayers("bat");
  const bowl = getPlayers("bowl");
  const b = board({ rr: m.rr, availability: m.availability }, bat, bowl);
  const ledger = getLedger();
  const seasons = Array.from(new Set(teams.map((t) => String(t.season)))).sort();
  const cols: [("bat" | "bowl"), ("PP" | "MID" | "DEATH")][] = [["bat", "PP"], ["bat", "MID"], ["bat", "DEATH"], ["bowl", "PP"], ["bowl", "MID"], ["bowl", "DEATH"]];
  const rank = (s: string, r: "bat" | "bowl", p: string) => teams.find((t) => String(t.season) === s && t.role === r && t.phase === p)?.rank ?? null;
  const values = seasons.map((s) => cols.map(([r, p]) => rank(s, r, p)));
  const gapIdx = b.gapCells.map((c) => [seasons.indexOf(c.season), cols.findIndex(([r, p]) => r === c.role && p === c.phase)] as [number, number]).filter(([i, j]) => i >= 0 && j >= 0);
  const latest = b.latestSeason;
  const all = (role: "bat" | "bowl") => teams.find((t) => String(t.season) === latest && t.role === role && t.phase === "ALL");
  const squad = m.rr.squad.filter((s) => (s.bat && s.bat.qualified) || (s.bowl && s.bowl.qualified) || (s.bat && s.bat.rank) || (s.bowl && s.bowl.rank));
  const unbuyable = [...bat, ...bowl]
    .filter((p) => p.barred && p.barred !== "Dips under pressure" && p.rank_pre !== null && p.rank_pre <= 30)
    .sort((x, y) => (x.rank_pre as number) - (y.rank_pre as number));
  const noAvail = m.availability.length === 0;
  const tierLabel: [string, keyof typeof b, string][] = [
    ["Tier 1: back first", "tier1", "Ranked 1 to 20, available, and fits a gap cell."],
    ["Tier 2: back if the price allows", "tier2", "Ranked 21 to 40, or ranked 1 to 20 without a matching gap."],
    ["Trade watch", "tradeWatch", "Ranked 1 to 20 and retained or traded: only a trade moves them."],
    ["Register interest", "registerInterest", "Top 10 and outside the IPL this year."],
  ];
  return (
    <div className="space-y-6">
      <PageHeader kicker="Royals Board" title={COPY.auction.title} lede={COPY.auction.lede} />

      <div className="grid grid-cols-2 gap-px border border-rr-line bg-rr-line lg:grid-cols-4">
        <KpiTile label={`Batting under pressure, ${latest}`} value={all("bat") ? ordinal(all("bat")!.rank) : "n/a"} tone="pink" note={all("bat") ? `of 10 sides; mean value ${sgn(all("bat")!.mean)}` : undefined} />
        <KpiTile label={`Bowling under pressure, ${latest}`} value={all("bowl") ? ordinal(all("bowl")!.rank) : "n/a"} tone="blue" note={all("bowl") ? `of 10 sides; mean value ${sgn(all("bowl")!.mean)}` : undefined} />
        <KpiTile label="Gap cells" value={`${b.gapCells.length}`} note={b.gapCells.map((c) => `${c.role === "bat" ? "bat" : "bowl"} ${c.phase.toLowerCase()} (${ordinal(c.rank)})`).join(", ") || "none"} />
        <KpiTile label="Squad players rated" value={`${squad.length}`} note="Includes injury replacements named in the 2026 squad list" />
      </div>

      <Panel title="Royals under pressure: rank of 10 sides, by season and phase" caption="IPL pressure balls only. 1 is best, 10 is worst, so darker pink is worse. Outlined cells are gap cells: ranked 6th or lower in the latest season.">
        <HeatGrid
          rows={seasons}
          cols={["Bat PP", "Bat Mid", "Bat Death", "Bowl PP", "Bowl Mid", "Bowl Death"]}
          values={values}
          scale={{ kind: "seq", min: 1, max: 10 }}
          format={(v) => String(v)}
          outline={gapIdx}
          labelWidth={70}
          cellWidth={84}
          cellHeight={40}
          fontSize={14}
          ariaLabel="Royals rank by season, role and phase"
        />
      </Panel>

      <Panel title="The 2026 squad in the ratings" caption="All players on the 2026 squad list, including injury replacements. Ranks are among eligible players of the role.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="bg-rr-panel text-left text-xs text-rr-muted">
                <th className="px-2 py-2 font-semibold">Player</th>
                <th className="px-2 py-2 text-right font-semibold">Batting rank</th>
                <th className="px-2 py-2 text-right font-semibold">Batting floor</th>
                <th className="px-2 py-2 text-right font-semibold">Bowling rank</th>
                <th className="px-2 py-2 text-right font-semibold">Bowling floor</th>
              </tr>
            </thead>
            <tbody className="tnum">
              {squad.map((s, i) => (
                <tr key={s.id} className={i % 2 ? "bg-rr-panel/60" : ""}>
                  <td className="px-2 py-1.5 font-semibold text-rr-navy">{s.name}</td>
                  <td className="px-2 py-1.5 text-right">{s.bat?.rank ?? "n/a"}</td>
                  <td className="px-2 py-1.5 text-right">{s.bat?.qualified ? sgn(s.bat.floor, 3) : "n/a"}</td>
                  <td className="px-2 py-1.5 text-right">{s.bowl?.rank ?? "n/a"}</td>
                  <td className="px-2 py-1.5 text-right">{s.bowl?.qualified ? sgn(s.bowl.floor, 3) : "n/a"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Target board" caption={COPY.auction.note}>
        {noAvail && (
          <div className="mb-4">
            <EmptyState>{COPY.auction.emptyAvailability}</EmptyState>
          </div>
        )}
        <div className="space-y-6">
          {tierLabel.map(([title, k, sub]) => (
            <div key={k}>
              <h3 className="text-[15px] font-bold text-rr-navy">{title}</h3>
              <p className="mb-2 text-xs text-rr-muted">{sub}</p>
              <BoardTable rows={b[k] as never} empty={noAvail ? "Waiting for the official retention and release lists." : "No player in this tier yet."} />
            </div>
          ))}
          <div>
            <h3 className="text-[15px] font-bold text-rr-navy">{COPY.auction.unverifiedTitle}</h3>
            <p className="mb-2 text-xs text-rr-muted">Ranked 1 to 40, ordered by rank, with no public status for 2027 yet.</p>
            <BoardTable rows={b.unverified.slice(0, 40)} empty="Every candidate has a public status." />
          </div>
        </div>
      </Panel>

      <Panel title="Rated but not buyable" caption="Players the ratings would place in the top 30 who cannot be bought at the 2027 auction. Reasons are public statements with their dates in the research.">
        {unbuyable.length ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {unbuyable.map((p) => (
              <li key={`${p.role}-${p.id}`} className="bg-rr-panel p-3 text-sm">
                <span className="font-semibold text-rr-navy">{p.name}</span> ({p.role === "bat" ? "batter" : "bowler"}, would rank {ordinal(p.rank_pre as number)}): {p.barred}.
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-rr-muted">None at this date.</p>
        )}
      </Panel>

      <Panel title="Franchise ledger" caption="Purse left, squad slots and overseas slots for each franchise after retentions. Purse left is arithmetic on verified contract amounts.">
        {ledger ? (
          <div className="space-y-4">
            <BarList
              ariaLabel="Purse left by franchise"
              items={[...ledger.rows].sort((a, c) => c.purse_left_cr - a.purse_left_cr).map((r) => ({ label: `${r.franchise}${r.basis !== "verified" ? ` (${r.basis})` : ""}`, value: Math.max(r.purse_left_cr, 0), display: `${r.purse_left_cr.toFixed(1)}`, color: r.franchise === "Rajasthan Royals" ? COLORS.pink : COLORS.series, note: `${r.retained} retained, ${r.slots_left} slots left, ${r.overseas_left} overseas slots left, ${r.needed_to_18} needed to reach 18` }))}
            />
            <p className="text-xs text-rr-muted">Rupees crore. {ledger.note}</p>
          </div>
        ) : (
          <EmptyState>The ledger appears once the official retention and release lists are verified. Until then no purse figure is shown, because published purse figures conflict.</EmptyState>
        )}
      </Panel>
    </div>
  );
}
