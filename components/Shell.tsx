import Link from "next/link";
import { NavLinks } from "./NavLinks";
import { COPY } from "@/lib/copy";

function Crest() {
  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-dashed border-white/50 font-display text-sm font-extrabold tracking-wide text-white"
      title="Crest placeholder"
      aria-hidden="true"
    >
      RR
    </div>
  );
}

export function Shell({ hash, generated, children }: { hash: string; generated: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <header className="bg-sidebar pt-3 lg:hidden">
        <div className="flex items-center gap-3 px-4 pb-3">
          <Crest />
          <div>
            <p className="font-display text-sm font-extrabold leading-tight text-white">Reliable Under Pressure</p>
            <p className="text-xs text-white/60">{COPY.team}</p>
          </div>
        </div>
        <NavLinks orientation="bar" />
      </header>
      <aside className="sticky top-0 hidden h-screen flex-col justify-between bg-sidebar p-5 lg:flex">
        <div>
          <Link href="/" className="mb-6 flex items-center gap-3">
            <Crest />
            <span>
              <span className="block font-display text-base font-extrabold leading-tight text-white">Reliable Under Pressure</span>
              <span className="block text-xs text-white/60">SupeRR Selector Season 2</span>
            </span>
          </Link>
          <NavLinks orientation="rail" />
          <a
            href={COPY.researchPath}
            className="mt-3 block rounded-lg border border-white/25 px-3 py-2 text-sm font-semibold text-white hover:bg-sidebar-accent"
          >
            Research PDF
            <span className="block text-xs font-normal text-white/55">Method and evidence</span>
          </a>
        </div>
        <div className="text-xs text-white/55">
          <p className="tnum">Model hash {hash}</p>
          <p>Built {generated}</p>
          <p className="mt-2">{COPY.team}</p>
        </div>
      </aside>
      <main className="min-w-0">
        <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
        <footer className="border-t border-rr-line px-4 py-5 text-xs text-rr-muted sm:px-6 lg:px-8">
          <p>{COPY.footer}</p>
          <p className="mt-1">{COPY.logoNote}</p>
        </footer>
      </main>
    </div>
  );
}
