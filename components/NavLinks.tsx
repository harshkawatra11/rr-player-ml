"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { COPY } from "@/lib/copy";

export function NavLinks({ orientation }: { orientation: "rail" | "bar" }) {
  const path = usePathname() || "/";
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  if (orientation === "bar") {
    return (
      <nav aria-label="Sections" className="flex gap-px overflow-x-auto px-3 pb-3">
        {COPY.nav.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active(n.href) ? "page" : undefined}
            className={`shrink-0 px-3 py-1.5 text-sm font-semibold ${active(n.href) ? "bg-white text-rr-navy" : "bg-white/10 text-white"}`}
          >
            {n.label}
          </Link>
        ))}
      </nav>
    );
  }
  return (
    <nav aria-label="Sections" className="flex flex-col">
      {COPY.nav.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          aria-current={active(n.href) ? "page" : undefined}
          className={`px-3 py-2 transition-colors duration-150 ${active(n.href) ? "bg-white text-rr-navy" : "text-white/85 hover:bg-sidebar-accent hover:text-white"}`}
        >
          <span className="block text-sm font-semibold">{n.label}</span>
          <span className={`block text-xs ${active(n.href) ? "text-rr-muted" : "text-white/60"}`}>{n.hint}</span>
        </Link>
      ))}
    </nav>
  );
}
