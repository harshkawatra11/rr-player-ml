"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { COPY } from "@/lib/copy";

export function NavLinks({ orientation }: { orientation: "rail" | "bar" }) {
  const path = usePathname() || "/";
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  if (orientation === "bar") {
    return (
      <nav aria-label="Sections" className="flex gap-1 overflow-x-auto px-3 pb-3">
        {COPY.nav.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active(n.href) ? "page" : undefined}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${
              active(n.href) ? "bg-rr-pink text-white" : "bg-white/10 text-white/90"
            }`}
          >
            {n.label}
          </Link>
        ))}
      </nav>
    );
  }
  return (
    <nav aria-label="Sections" className="flex flex-col gap-1">
      {COPY.nav.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          aria-current={active(n.href) ? "page" : undefined}
          className={`group rounded-lg border-l-4 px-3 py-2 transition-colors ${
            active(n.href)
              ? "border-rr-pink bg-sidebar-accent text-white"
              : "border-transparent text-white/80 hover:bg-sidebar-accent hover:text-white"
          }`}
        >
          <span className="block text-sm font-semibold">{n.label}</span>
          <span className="block text-xs text-white/55">{n.hint}</span>
        </Link>
      ))}
    </nav>
  );
}
