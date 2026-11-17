import type { ReactNode } from "react";

/** White card with a title, an optional one-line caption stating what the content shows and its unit, and a body. */
export function Panel({
  title,
  caption,
  children,
  className = "",
  action,
  id,
}: {
  title?: string;
  caption?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className={`rounded-xl border border-rr-line bg-white p-4 sm:p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="font-display text-sm font-bold uppercase tracking-wide text-rr-navy">{title}</h2>}
            {caption && <p className="mt-1 text-sm text-rr-muted">{caption}</p>}
          </div>
          {action}
        </div>
      )}
      {!title && caption && <p className="mb-3 text-sm text-rr-muted">{caption}</p>}
      {children}
    </section>
  );
}

export function PageHeader({ kicker, title, lede, right }: { kicker?: string; title: string; lede?: string; right?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        {kicker && <p className="mb-1 font-display text-xs font-bold uppercase tracking-[0.14em] text-rr-pink-deep">{kicker}</p>}
        <h1 className="font-display text-2xl font-extrabold leading-tight text-rr-navy sm:text-3xl">{title}</h1>
        {lede && <p className="mt-2 text-base text-rr-muted">{lede}</p>}
      </div>
      {right}
    </header>
  );
}

export function SourceNote({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-xs text-rr-muted">{children}</p>;
}

export function EmptyState({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-rr-line bg-rr-panel p-6 text-center">
      {title && <p className="font-display text-sm font-bold text-rr-navy">{title}</p>}
      <p className="mt-1 text-sm text-rr-muted">{children}</p>
    </div>
  );
}
