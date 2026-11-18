"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState } from "@tanstack/react-table";
import type { LiftClass, SlimPlayer } from "@/lib/types";
import { grp, num, pct, sgn } from "@/lib/format";
import { LiftChip, ProbPill } from "@/components/KpiTile";
import { ScatterXY, type Pt } from "@/components/charts/ScatterXY";
import { Panel } from "@/components/Panel";
import { COPY } from "@/lib/copy";

type Row = SlimPlayer;

function csv(rows: Row[]): string {
  const head = ["role", "rank", "name", "nation", "ipl_side", "pressure_balls", "ordinary_balls", "pressure_value", "ordinary_value", "expected_value", "floor", "floor_points_per_100", "top10_probability", "lift_class", "barred"];
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [head.join(","), ...rows.map((p) => [p.role, p.rank, p.name, p.nation, p.ipl_team, p.nP, p.nO, p.xP, p.xO, p.epp, p.floor, p.floor_pp100, p.p_top10, p.lift_class, p.barred].map(esc).join(","))].join("\n");
}

export function Explorer({ players }: { players: Row[] }) {
  const [role, setRole] = useState<"bat" | "bowl">("bat");
  const [eligibleOnly, setEligibleOnly] = useState(true);
  const [lift, setLift] = useState<"all" | LiftClass>("all");
  const [nation, setNation] = useState("all");
  const [minP, setMinP] = useState(0);
  const [q, setQ] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "floor", desc: true }]);

  const inRole = useMemo(() => players.filter((p) => p.role === role), [players, role]);
  const nations = useMemo(() => Array.from(new Set(inRole.map((p) => p.nation).filter((n): n is string => !!n))).sort(), [inRole]);
  const data = useMemo(
    () =>
      inRole.filter(
        (p) =>
          (!eligibleOnly || p.eligible) &&
          (lift === "all" || p.lift_class === lift) &&
          (nation === "all" || p.nation === nation) &&
          p.nP >= minP &&
          (q.trim().length < 2 || p.name.toLowerCase().includes(q.trim().toLowerCase())),
      ),
    [inRole, eligibleOnly, lift, nation, minP, q],
  );

  const columns = useMemo<ColumnDef<Row>[]>(
    () => [
      { id: "rank", header: "#", accessorFn: (p) => p.rank ?? 999, cell: ({ row }) => (row.original.rank ? <b className="text-rr-pink-deep">{row.original.rank}</b> : <span className="text-rr-muted">{row.original.barred ? "barred" : row.original.qualified ? "n/a" : "gate"}</span>) },
      {
        id: "name",
        header: "Player",
        accessorFn: (p) => p.name,
        cell: ({ row }) => (
          <span>
            <Link href={`/players/${row.original.role}/${row.original.id}/`} className="font-semibold text-rr-navy hover:text-rr-pink-deep hover:underline">
              {row.original.name}
            </Link>
            <span className="block text-xs text-rr-muted">
              {row.original.ipl_team ?? "No IPL side listed"}
              {row.original.barred ? `. Barred: ${row.original.barred}` : ""}
            </span>
          </span>
        ),
      },
      { id: "nation", header: "Nation", accessorFn: (p) => p.nation ?? "", cell: ({ getValue }) => <span className="text-rr-muted">{(getValue() as string) || "n/a"}</span> },
      { id: "nP", header: "Pressure balls", accessorFn: (p) => p.nP, cell: ({ getValue }) => <span className="tnum">{grp(getValue() as number)}</span> },
      { id: "xP", header: "Pressure value", accessorFn: (p) => p.xP ?? -9, cell: ({ row }) => <span className="tnum">{sgn(row.original.xP)}</span> },
      { id: "xO", header: "Ordinary value", accessorFn: (p) => p.xO ?? -9, cell: ({ row }) => <span className="tnum">{sgn(row.original.xO)}</span> },
      { id: "epp", header: "Expected", accessorFn: (p) => p.epp, cell: ({ getValue }) => <span className="tnum">{sgn(getValue() as number, 3)}</span> },
      { id: "floor", header: "Floor", accessorFn: (p) => p.floor, cell: ({ getValue }) => <b className="tnum">{sgn(getValue() as number, 3)}</b> },
      { id: "pp", header: "Points per 100", accessorFn: (p) => p.floor_pp100, cell: ({ getValue }) => <span className="tnum">{num(getValue() as number)}</span> },
      { id: "p", header: "Top 10", accessorFn: (p) => p.p_top10 ?? -1, cell: ({ row }) => (row.original.rank ? <ProbPill p={row.original.p_top10} /> : <span className="text-rr-muted">n/a</span>) },
      { id: "lift", header: "Lift", accessorFn: (p) => p.lift_class, cell: ({ row }) => <LiftChip cls={row.original.lift_class} /> },
    ],
    [],
  );
  const table = useReactTable({ data, columns, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() });

  const pts: Pt[] = useMemo(
    () =>
      inRole
        .filter((p) => p.qualified && p.xP !== null && p.xO !== null)
        .map((p) => ({ x: p.xO as number, y: p.xP as number, label: p.name, href: `/players/${p.role}/${p.id}/`, group: p.rank !== null && p.rank <= 10 ? "top" : "rest", detail: p.rank ? `Rank ${p.rank}, floor ${sgn(p.floor, 3)}` : p.barred ? `Barred: ${p.barred}` : "Unranked" })),
    [inRole],
  );

  const download = () => {
    const blob = new Blob([csv(table.getRowModel().rows.map((r) => r.original))], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `players-${role}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const ctl = " border border-rr-line bg-white px-2 py-1.5 text-sm";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4  border border-rr-line bg-white p-4">
        <div className="flex overflow-hidden  border border-rr-line text-sm font-semibold" role="group" aria-label="Role">
          {(["bat", "bowl"] as const).map((r) => (
            <button key={r} type="button" aria-pressed={role === r} onClick={() => { setRole(r); setNation("all"); }} className={`px-4 py-1.5 ${role === r ? "bg-rr-navy text-white" : "bg-white text-rr-navy"}`}>
              {r === "bat" ? "Batters" : "Bowlers"}
            </button>
          ))}
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a player" aria-label="Search a player" className={`${ctl} w-48`} />
        <select value={nation} onChange={(e) => setNation(e.target.value)} className={ctl} aria-label="Nation">
          <option value="all">All nations</option>
          {nations.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <select value={lift} onChange={(e) => setLift(e.target.value as "all" | LiftClass)} className={ctl} aria-label="Lift class">
          <option value="all">All lift classes</option>
          <option value="Rises">Rises</option>
          <option value="Steady">Steady</option>
          <option value="Dips">Dips</option>
        </select>
        <label className="flex items-center gap-2 text-sm font-semibold text-rr-navy">
          Pressure balls at least
          <input type="range" min={0} max={400} step={10} value={minP} onChange={(e) => setMinP(Number(e.target.value))} className="accent-rr-pink" aria-label="Minimum pressure balls" />
          <span className="tnum w-8 text-right">{minP}</span>
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-rr-navy">
          <input type="checkbox" checked={eligibleOnly} onChange={(e) => setEligibleOnly(e.target.checked)} className="accent-rr-pink" />
          Ranked players only
        </label>
        <button type="button" onClick={download} className="ml-auto  bg-rr-pink px-3 py-1.5 text-sm font-semibold text-white">
          Download CSV
        </button>
      </div>

      <Panel title={`${data.length} players`} caption={COPY.explorer.lede}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="bg-rr-panel text-left text-xs text-rr-muted">
                  {hg.headers.map((h) => (
                    <th key={h.id} className="px-2 py-2 font-semibold">
                      <button type="button" onClick={h.column.getToggleSortingHandler()} className="inline-flex items-center gap-1 hover:text-rr-navy" aria-label={`Sort by ${String(h.column.columnDef.header)}`}>
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        <span aria-hidden="true">{{ asc: "▲", desc: "▼" }[h.column.getIsSorted() as string] ?? ""}</span>
                      </button>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.slice(0, 250).map((r, i) => (
                <tr key={r.id} className={i % 2 ? "bg-rr-panel/60" : ""}>
                  {r.getVisibleCells().map((c) => (
                    <td key={c.id} className="px-2 py-1.5 align-middle">
                      {flexRender(c.column.columnDef.cell, c.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.length > 250 && <p className="mt-2 text-xs text-rr-muted">Showing the first 250 rows. Use the filters or download the CSV for all {data.length}.</p>}
        {data.length === 0 && <p className="py-6 text-center text-sm text-rr-muted">No player matches these filters.</p>}
      </Panel>

      <Panel title="Pressure value against ordinary value" caption="Each dot is a qualified player. Pink dots are the top 10. Click a dot to open the profile. Above the diagonal means better under pressure than usual.">
        <ScatterXY points={pts} xLabel="Ordinary value" yLabel="Pressure value" />
        <p className="mt-2 text-xs text-rr-muted">{pct(pts.filter((p) => p.y > p.x).length / Math.max(pts.length, 1))} of qualified players sit above the diagonal; as the Method page shows, how far above does not repeat.</p>
      </Panel>
    </div>
  );
}
