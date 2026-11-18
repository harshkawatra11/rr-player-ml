import Link from "next/link";
import type { Player, SlimPlayer } from "@/lib/types";
import { grp, sgn } from "@/lib/format";
import { IntervalBar } from "./IntervalBar";
import { LiftChip, ProbPill } from "./KpiTile";

/** Ranked list with the floor shown as a diamond inside its 80% interval. Server-safe. */
export function LeaderTable({ players, role, title }: { players: (Player | SlimPlayer)[]; role: "bat" | "bowl"; title: string }) {
  const lo = Math.min(...players.map((p) => p.epp - 1.28 * p.sd), 0);
  const hi = Math.max(...players.map((p) => p.epp + 1.28 * p.sd));
  const domain: [number, number] = [lo - 0.01, hi + 0.01];
  return (
    <section className="overflow-hidden  border border-rr-line bg-white">
      <div className="flex items-center justify-between border-b border-rr-line bg-rr-navy px-4 py-3">
        <h2 className="text-[15px] font-bold text-white">{title}</h2>
        <span className="text-xs text-white/70">Diamond: floor. Dot: expected value. Line: 80% range.</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="bg-rr-panel text-left text-xs text-rr-muted">
              <th className="px-3 py-2 font-semibold">#</th>
              <th className="px-3 py-2 font-semibold">Player</th>
              <th className="px-3 py-2 text-right font-semibold">Pressure balls</th>
              <th className="px-3 py-2 font-semibold">Floor and range</th>
              <th className="px-3 py-2 text-right font-semibold">Floor</th>
              <th className="px-3 py-2 text-center font-semibold">Top 10</th>
              <th className="px-3 py-2 font-semibold">Lift</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p, i) => (
              <tr key={p.id} className={i % 2 ? "bg-rr-panel/60" : ""}>
                <td className="tnum px-3 py-2 font-extrabold text-rr-pink-deep">{p.rank}</td>
                <td className="px-3 py-2">
                  <Link href={`/players/${role}/${p.id}/`} className="font-semibold text-rr-navy hover:text-rr-pink-deep hover:underline">
                    {p.name}
                  </Link>
                  <span className="block text-xs text-rr-muted">{p.ipl_team ?? "No IPL side listed"}</span>
                </td>
                <td className="tnum px-3 py-2 text-right">{grp(p.nP)}</td>
                <td className="px-3 py-2">
                  <IntervalBar epp={p.epp} sd={p.sd} floor={p.floor} domain={domain} highlight={role === "bat" || true} />
                </td>
                <td className="tnum px-3 py-2 text-right font-semibold">{sgn(p.floor, 3)}</td>
                <td className="px-3 py-2 text-center">
                  <ProbPill p={p.p_top10} />
                </td>
                <td className="px-3 py-2">
                  <LiftChip cls={p.lift_class} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
