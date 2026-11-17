"use client";

import { useMemo, useState } from "react";

export interface SearchPlayer {
  id: number;
  role: "bat" | "bowl";
  name: string;
  ipl_team: string | null;
  rank: number | null;
}

/** Type-ahead search over player names. Calls onPick with the chosen player. */
export function PlayerSearch({
  players,
  onPick,
  placeholder = "Search a player",
  exclude = [],
}: {
  players: SearchPlayer[];
  onPick: (p: SearchPlayer) => void;
  placeholder?: string;
  exclude?: string[];
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const hits = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return [];
    return players.filter((p) => p.name.toLowerCase().includes(s) && !exclude.includes(`${p.role}-${p.id}`)).slice(0, 8);
  }, [q, players, exclude]);
  return (
    <div className="relative">
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-lg border border-rr-line bg-white px-3 py-2 text-sm outline-none focus:border-rr-pink focus:ring-2 focus:ring-rr-pink/30"
      />
      {open && hits.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-rr-line bg-white shadow-lg" role="listbox">
          {hits.map((p) => (
            <li key={`${p.role}-${p.id}`}>
              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-rr-pink-tint"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onPick(p);
                  setQ("");
                  setOpen(false);
                }}
              >
                <span>
                  <span className="font-semibold text-rr-navy">{p.name}</span>
                  <span className="ml-2 text-xs text-rr-muted">{p.role === "bat" ? "Batter" : "Bowler"}</span>
                </span>
                <span className="text-xs text-rr-muted">{p.rank ? `Rank ${p.rank}` : "Unranked"}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
