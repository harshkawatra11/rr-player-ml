"use client";

import { useState } from "react";
import type { ShowcaseMatch } from "@/lib/types";
import { MatchWorm } from "@/components/charts/MatchWorm";

export function Replay({ matches }: { matches: ShowcaseMatch[] }) {
  const [i, setI] = useState(0);
  const m = matches[i];
  return (
    <div>
      <label className="mb-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-rr-navy">
        Chase
        <select value={i} onChange={(e) => setI(Number(e.target.value))} className="border border-rr-line bg-white px-2 py-1.5 text-sm" aria-label="Choose a chase">
          {matches.map((x, k) => (
            <option key={x.id} value={k}>
              {x.date}: {x.home} against {x.away}
            </option>
          ))}
        </select>
      </label>
      <p className="mb-2 text-sm text-rr-muted">
        {m.comp}. Result: {m.result}.
      </p>
      <MatchWorm match={m} />
    </div>
  );
}
