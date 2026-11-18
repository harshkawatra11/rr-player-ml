import { getSlimPlayers } from "@/lib/data";
import { COPY } from "@/lib/copy";
import { PageHeader } from "@/components/Panel";
import { Explorer } from "@/components/players/Explorer";

export const metadata = { title: "Explorer | Reliable Under Pressure" };

export default function PlayersPage() {
  const players = [...getSlimPlayers("bat"), ...getSlimPlayers("bowl")];
  return (
    <div className="space-y-6">
      <PageHeader kicker="Explorer" title="Every rated player" lede={COPY.explorer.lede} />
      <Explorer players={players} />
    </div>
  );
}
