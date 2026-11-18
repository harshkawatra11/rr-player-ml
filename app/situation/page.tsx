import { getGrid, getPlayers } from "@/lib/data";
import { COPY } from "@/lib/copy";
import { PageHeader } from "@/components/Panel";
import { SituationTool, type PhaseRecord } from "@/components/pressure/SituationTool";

export const metadata = { title: "Situation Room | Reliable Under Pressure" };

export default function SituationRoom() {
  const grid = getGrid();
  const records: PhaseRecord[] = (["bat", "bowl"] as const).flatMap((role) =>
    getPlayers(role)
      .filter((p) => p.eligible && p.rank !== null)
      .map((p) => {
        const pick = (k: string): [number, number | null] | null => {
          const row = p.splits.phase_hp.find((r) => r[0] === k);
          return row ? [row[1], row[2]] : null;
        };
        return { id: p.id, role, name: p.name, rank: p.rank, mid: pick("MID|P"), death: pick("DEATH|P") };
      }),
  );
  return (
    <div className="space-y-6">
      <PageHeader kicker="Situation Room" title={COPY.situation.title} lede={COPY.situation.lede} />
      <SituationTool grid={grid} records={records} />
    </div>
  );
}
