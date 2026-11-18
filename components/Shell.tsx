import Link from "next/link";
import { NavLinks } from "./NavLinks";
import { COPY } from "@/lib/copy";

function Crest() {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-dashed border-white/50 text-sm font-extrabold tracking-wide text-white" title="Crest placeholder" aria-hidden="true">
      RR
    </div>
  );
}

/** Straight-line arrow pointing to the top right: the usual external-link mark. */
function ArrowUpRight({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" aria-hidden="true">
      <path d="M3 11 L11 3" />
      <path d="M4.5 3 H11 V9.5" />
    </svg>
  );
}

function GithubMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

function GithubButton({ compact = false }: { compact?: boolean }) {
  return (
    <a
      href={COPY.repoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center justify-between gap-3 bg-black font-semibold text-white transition-colors duration-150 hover:bg-[#1a1a1a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${compact ? "px-3 py-2 text-sm" : "px-3 py-2.5 text-sm"}`}
      aria-label="Open the GitHub repository in a new tab"
    >
      <span className="flex items-center gap-2.5">
        <GithubMark />
        GitHub
      </span>
      <ArrowUpRight />
    </a>
  );
}

export function Shell({ hash, generated, children }: { hash: string; generated: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <header className="bg-sidebar pt-3 lg:hidden">
        <div className="flex items-center gap-3 px-4 pb-3">
          <Crest />
          <div className="flex-1">
            <p className="text-sm font-extrabold leading-tight text-white">Reliable Under Pressure</p>
            <p className="text-xs text-white/70">{COPY.team}</p>
          </div>
          <div className="w-32">
            <GithubButton compact />
          </div>
        </div>
        <NavLinks orientation="bar" />
      </header>
      <aside className="sticky top-0 hidden h-screen flex-col justify-between bg-sidebar p-5 lg:flex">
        <div>
          <Link href="/" className="mb-6 flex items-center gap-3">
            <Crest />
            <span>
              <span className="block text-base font-extrabold leading-tight text-white">Reliable Under Pressure</span>
              <span className="block text-xs text-white/70">SupeRR Selector Season 2</span>
            </span>
          </Link>
          <NavLinks orientation="rail" />
          <div className="mt-4 space-y-px">
            <a href={COPY.researchPath} className="flex items-center justify-between gap-3 border border-white/30 px-3 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-sidebar-accent">
              <span>
                Research PDF
                <span className="block text-xs font-normal text-white/70">Method and evidence</span>
              </span>
              <ArrowUpRight />
            </a>
            <GithubButton />
          </div>
        </div>
        <div className="text-xs text-white/70">
          <p className="tnum">Model hash {hash}</p>
          <p>Built {generated}</p>
          <p className="mt-2">{COPY.team}</p>
        </div>
      </aside>
      <main className="min-w-0">
        <div className="mx-auto max-w-[1400px] space-y-5 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
        <footer className="border-t border-rr-line px-4 py-5 text-xs text-rr-muted sm:px-6 lg:px-8">
          <p>{COPY.footer}</p>
          <p className="mt-1">{COPY.logoNote}</p>
        </footer>
      </main>
    </div>
  );
}
