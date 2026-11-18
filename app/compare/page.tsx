import { getPlayers } from "@/lib/data";
import { PageHeader } from "@/components/Panel";
import { CompareTool, type CompareRow } from "@/components/players/CompareTool";

export const metadata = { title: "Compare | Reliable Under Pressure" };

export default function ComparePage() {
  const rows: CompareRow[] = (["bat", "bowl"] as const).flatMap((role) =>
    getPlayers(role)
      .filter((p) => p.qualified || p.rank !== null)
      .map((p) => ({
        id: p.id,
        role,
        name: p.name,
        ipl_team: p.ipl_team,
        rank: p.rank,
        nation: p.nation,
        floor: p.floor,
        epp: p.epp,
        sd: p.sd,
        xP: p.xP,
        xO: p.xO,
        nP: p.nP,
        nO: p.nO,
        p_top10: p.p_top10,
        rank_lo: p.rank_lo,
        rank_hi: p.rank_hi,
        lift_class: p.lift_class,
        barred: p.barred,
        phase: (["PP", "MID", "DEATH"] as const).map((ph) => {
          const r = p.splits.phase_hp.find((x) => x[0] === `${ph}|P`);
          return r && r[1] >= 30 ? r[2] : null;
        }),
      })),
  );
  const top = (role: "bat" | "bowl") => rows.filter((r) => r.role === role && r.rank !== null).sort((a, b) => (a.rank as number) - (b.rank as number))[0];
  const initial = [top("bat"), top("bowl")].filter(Boolean).map((r) => `${r.role}-${r.id}`);
  return (
    <div className="space-y-6">
      <PageHeader kicker="Compare" title="Two to four players side by side" lede="Pick players to see their headline measures, pressure against ordinary value, and pressure value by phase on one screen." />
      <CompareTool rows={rows} initial={initial} />
    </div>
  );
}
