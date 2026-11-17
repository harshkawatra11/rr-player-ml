import { COLORS } from "@/lib/scale";

export interface BarItem {
  label: string;
  value: number;
  display: string;
  color?: string;
  note?: string;
}

/** Horizontal bars with direct value labels. Zero baseline; bars are thin with a rounded data end. */
export function BarList({ items, max, ariaLabel }: { items: BarItem[]; max?: number; ariaLabel?: string }) {
  const top = max ?? Math.max(...items.map((i) => i.value), 1e-9);
  return (
    <ul className="space-y-2.5" aria-label={ariaLabel}>
      {items.map((i) => (
        <li key={i.label} className="grid grid-cols-[120px_1fr_64px] items-center gap-3 sm:grid-cols-[150px_1fr_72px]">
          <span className="text-sm font-semibold text-rr-navy">{i.label}</span>
          <span className="h-3 rounded-full bg-rr-panel">
            <span className="block h-3 rounded-full" style={{ width: `${Math.max(2, (100 * i.value) / top)}%`, background: i.color ?? COLORS.pink }} />
          </span>
          <span className="tnum text-right text-sm font-bold text-rr-navy">{i.display}</span>
          {i.note && <span className="col-span-3 -mt-1.5 text-xs text-rr-muted">{i.note}</span>}
        </li>
      ))}
    </ul>
  );
}
