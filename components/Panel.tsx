import type { ReactNode } from "react";

/** Flat exhibit: a titled block with a hairline under the title, an optional caption stating what it shows and its unit, and a source line. */
export function Panel({
  title,
  caption,
  children,
  className = "",
  action,
  id,
  source,
}: {
  title?: string;
  caption?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
  id?: string;
  source?: string;
}) {
  return (
    <section id={id} className={`border border-rr-line bg-white ${className}`}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 border-b border-rr-line px-4 py-3 sm:px-5">
          <div>
            {title && <h2 className="text-[15px] font-bold leading-snug text-rr-navy">{title}</h2>}
            {caption && <p className="mt-0.5 max-w-prose text-[13px] leading-snug text-rr-muted">{caption}</p>}
          </div>
          {action}
        </header>
      )}
      <div className="p-4 sm:p-5">
        {!title && caption && <p className="mb-3 text-[13px] text-rr-muted">{caption}</p>}
        {children}
      </div>
      {source && <p className="border-t border-rr-line px-4 py-2 text-xs text-rr-muted sm:px-5">Source: {source}</p>}
    </section>
  );
}

export function PageHeader({ title, lede, right }: { kicker?: string; title: string; lede?: string; right?: ReactNode }) {
  return (
    <header className="flex flex-col gap-4 border-b border-rr-navy pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        <h1 className="text-balance text-2xl font-extrabold leading-tight text-rr-navy sm:text-[28px]">{title}</h1>
        {lede && <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-rr-muted">{lede}</p>}
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
    <div className="border border-dashed border-rr-line bg-rr-panel p-6 text-center">
      {title && <p className="text-sm font-bold text-rr-navy">{title}</p>}
      <p className="mt-1 text-sm text-rr-muted">{children}</p>
    </div>
  );
}

/** A band of key figures separated by hairlines, instead of separate cards. */
export function KeyFigures({ children, cols = 4 }: { children: ReactNode; cols?: 3 | 4 | 5 }) {
  const c = cols === 5 ? "lg:grid-cols-5" : cols === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4";
  return <div className={`grid grid-cols-2 gap-px border border-rr-line bg-rr-line ${c}`}>{children}</div>;
}
