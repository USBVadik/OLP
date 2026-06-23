import type { ReactNode, SVGProps } from "react";

/* ------------------------------------------------------------------ */
/* Icons — minimal, inline, currentColor                               */
/* ------------------------------------------------------------------ */

export function IconCheck(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function IconArrowUpRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

export function IconChevronDown(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function IconShield(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 3 5 6v6c0 4 3 6.5 7 9 4-2.5 7-5 7-9V6l-7-3Z" />
      <path d="m9.2 12 2 2 3.6-3.8" />
    </svg>
  );
}

export function IconReceipt(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21V3Z" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  );
}

export function IconLock(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </svg>
  );
}

export function IconBan(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M5.6 5.6l12.8 12.8" />
    </svg>
  );
}

export function IconBolt(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Brand                                                               */
/* ------------------------------------------------------------------ */

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink text-cream shadow-sm">
        <span className="font-display text-[15px] font-semibold leading-none">O</span>
      </span>
      <span className="text-[15px] font-semibold tracking-tight text-ink">
        OneLink <span className="text-gold">Pay</span>
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Chips & tags                                                        */
/* ------------------------------------------------------------------ */

type ChipTone = "default" | "verify" | "gold";

export function Chip({ tone = "default", children }: { tone?: ChipTone; children: ReactNode }) {
  const cls = tone === "verify" ? "op-chip-verify" : tone === "gold" ? "op-chip-gold" : "op-chip";
  return <span className={cls}>{children}</span>;
}

export function ConceptTag({ children = "Concept" }: { children?: ReactNode }) {
  return <span className="op-chip-concept">{children}</span>;
}

export function Dot({ tone = "verify" }: { tone?: "verify" | "muted" | "gold" }) {
  const color = tone === "verify" ? "bg-verify" : tone === "gold" ? "bg-gold" : "bg-faint";
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${color}`} aria-hidden="true" />;
}

/* ------------------------------------------------------------------ */
/* Field row (label / value)                                           */
/* ------------------------------------------------------------------ */

export function Field({
  label,
  value,
  hint,
  mono = false,
  emphasis = false,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  mono?: boolean;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <dt className="text-sm text-muted">{label}</dt>
        {hint ? <p className="mt-0.5 text-xs text-faint">{hint}</p> : null}
      </div>
      <dd
        className={[
          "min-w-0 text-right",
          mono ? "break-all font-mono text-xs text-ink2" : "text-sm",
          emphasis ? "font-display text-base font-semibold text-ink" : "font-medium text-ink",
        ].join(" ")}
      >
        {value}
      </dd>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Disclosure (accordion) — native <details>, no client JS needed      */
/* ------------------------------------------------------------------ */

export function Disclosure({
  summary,
  children,
  defaultOpen = false,
}: {
  summary: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="op-disclosure" open={defaultOpen}>
      <summary>
        <span>{summary}</span>
        <IconChevronDown className="op-chevron h-4 w-4" />
      </summary>
      <div className="border-t border-line px-4 py-3">{children}</div>
    </details>
  );
}

/* ------------------------------------------------------------------ */
/* Verified seal — premium certificate mark                            */
/* ------------------------------------------------------------------ */

export function VerifiedSeal({ animate = false }: { animate?: boolean }) {
  return (
    <div
      className={`relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-verify-soft shadow-seal ${animate ? "op-animate-seal" : ""}`}
      role="img"
      aria-label="Verified"
    >
      <span className="absolute inset-[6px] rounded-full border border-gold/30" aria-hidden="true" />
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-verify text-cream">
        <IconCheck className="h-6 w-6" />
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Transaction reference row — labelled, short hash, opens explorer    */
/* ------------------------------------------------------------------ */

function shortHash(hash: string) {
  if (hash.length <= 20) return hash;
  return `${hash.slice(0, 10)}…${hash.slice(-8)}`;
}

export function TxReference({
  label,
  hash,
  href,
  destinationLabel = "block explorer",
}: {
  label: string;
  hash: string | null | undefined;
  href: string | null | undefined;
  /** Where the link opens, for the screen-reader hint (e.g. "block explorer", "UniversalX activity"). */
  destinationLabel?: string;
}) {
  if (!hash) return null;
  const inner = (
    <>
      <span className="flex items-center gap-2 text-muted">
        <Dot tone="gold" />
        {label}
      </span>
      <span className="flex items-center gap-1.5 font-mono text-xs text-ink2 group-hover:text-gold">
        {shortHash(hash)}
        {href ? <IconArrowUpRight className="h-3.5 w-3.5 text-faint group-hover:text-gold" /> : null}
      </span>
    </>
  );

  if (!href) {
    return <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-paper2 px-3.5 py-2.5 text-sm">{inner}</div>;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group flex items-center justify-between gap-3 rounded-xl border border-line bg-paper2 px-3.5 py-2.5 text-sm transition-colors hover:border-gold/40 hover:bg-gold-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
    >
      {inner}
      <span className="sr-only">{label}: {hash} (opens {destinationLabel} in a new tab)</span>
    </a>
  );
}
