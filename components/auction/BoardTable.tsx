import Link from "next/link";
import type { BoardRow } from "@/lib/board";
import { PHASE_LABEL, num, sgn } from "@/lib/format";
import { ProbPill } from "@/components/KpiTile";

const STATUS: Record<string, string> = {
  RETAINED: "Retained",
  RELEASED: "Released",
  AUCTION_POOL: "In the auction pool",
  TRADED: "Traded",
  NOT_IN_IPL: "Not in the IPL",
  UNVERIFIED: "Not yet public",
};

/** One tier of the target board. Server-safe. */
export function BoardTable({ rows, empty }: { rows: BoardRow[]; empty: string }) {
  if (!rows.length) return <p className="text-sm text-rr-muted">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="bg-rr-panel text-left text-xs text-rr-muted">
            <th className="px-2 py-2 font-semibold">Player</th>
            <th className="px-2 py-2 font-semibold">Role</th>
            <th className="px-2 py-2 text-right font-semibold">Rank</th>
            <th className="px-2 py-2 text-right font-semibold">Floor</th>
            <th className="px-2 py-2 text-center font-semibold">Top 10</th>
            <th className="px-2 py-2 font-semibold">Fits the gap in</th>
            <th className="px-2 py-2 font-semibold">2027 status</th>
            <th className="px-2 py-2 font-semibold">Last public price</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.role}-${r.player.id}`} className={i % 2 ? "bg-rr-panel/60" : ""}>
              <td className="px-2 py-1.5">
                <Link href={`/players/${r.role}/${r.player.id}/`} className="font-semibold text-rr-navy hover:underline">
                  {r.player.name}
                </Link>
                <span className="block text-xs text-rr-muted">{r.availability?.team_2027 ?? r.availability?.team_2026 ?? r.player.ipl_team ?? "No IPL side listed"}</span>
              </td>
              <td className="px-2 py-1.5">{r.role === "bat" ? "Batter" : "Bowler"}</td>
              <td className="tnum px-2 py-1.5 text-right font-bold text-rr-pink-deep">{num(r.player.rank)}</td>
              <td className="tnum px-2 py-1.5 text-right font-semibold">{sgn(r.player.floor, 3)}</td>
              <td className="px-2 py-1.5 text-center">
                <ProbPill p={r.player.p_top10} />
              </td>
              <td className="px-2 py-1.5">{r.fitPhases.length ? r.fitPhases.map((p) => PHASE_LABEL[p]).join(", ") : <span className="text-rr-muted">no gap cell</span>}</td>
              <td className="px-2 py-1.5">
                {STATUS[r.status]}
                {r.statusDate && (
                  <span className="block text-xs text-rr-muted">
                    {r.statusDate}
                    {r.sourceId ? `, ${r.sourceId}` : ""}
                  </span>
                )}
              </td>
              <td className="px-2 py-1.5">{r.price ?? <span className="text-rr-muted">n/a</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
