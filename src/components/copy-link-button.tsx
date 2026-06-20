"use client";

import { useEffect, useState } from "react";
import { IconCheck } from "@/components/ui";

function IconLink(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M9 12h6" />
      <path d="M10.5 8H8a4 4 0 0 0 0 8h2.5M13.5 8H16a4 4 0 0 1 0 8h-2.5" />
    </svg>
  );
}

/**
 * Copies the current receipt URL so the verified certificate can be shared.
 * Presentation only — no payment, network, or chain interaction.
 */
export function CopyLinkButton({ label = "Copy receipt link" }: { label?: string }) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    setShareUrl(window.location.href);
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl || window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" onClick={handleCopy} className="op-btn-secondary" aria-live="polite">
      {copied ? <IconCheck className="h-4 w-4 text-verify" /> : <IconLink className="h-4 w-4" />}
      {copied ? "Link copied" : label}
    </button>
  );
}
