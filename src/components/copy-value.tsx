"use client";

import { useState } from "react";
import { IconCheck } from "@/components/ui";

function IconCopy(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

/**
 * A one-tap copyable value for the proof receipt (merchant address, invoice id). Lets anyone copy
 * the exact identifier to verify it on a block explorer — part of the "shareable verified
 * certificate" feel. Presentation only: no payment / network / chain interaction; the value is
 * passed in and only written to the clipboard.
 */
export function CopyValue({ value, display }: { value: string; display?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "Copied" : `Copy ${value}`}
      aria-live="polite"
      className="group inline-flex max-w-full items-center gap-1.5 rounded break-all font-mono text-xs text-ink2 transition-colors hover:text-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
    >
      <span className="break-all">{display ?? value}</span>
      {copied ? (
        <IconCheck className="h-3 w-3 shrink-0 text-verify" />
      ) : (
        <IconCopy className="h-3 w-3 shrink-0 text-faint group-hover:text-gold" />
      )}
    </button>
  );
}
