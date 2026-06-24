"use client";

import { useState } from "react";
import { computeMandateId } from "@/lib/mandates/mandate";
import {
  formatExpiry,
  formatMerchant,
  formatUsdcAmount,
} from "@/lib/mandates/format";
import { type PaymentMandate } from "@/lib/mandates/types";
import { IconCheck, IconShield } from "@/components/ui";

type Props = {
  /** The mandate the user is about to sign. */
  mandate: PaymentMandate;
  /** Optional: render with the technical-details disclosure already open. */
  initiallyExpanded?: boolean;
};

/**
 * Plain-English preview of an EIP-712 PaymentMandate. Renders BEFORE the user
 * signs so they can see merchant, caps, and expiry as words instead of as a
 * 32-byte hex hash. The technical hash + struct stay available behind a
 * disclosure for power users / judges who want to verify.
 */
export function MandateCard({ mandate, initiallyExpanded = false }: Props) {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const [copied, setCopied] = useState(false);
  const mandateId = computeMandateId(mandate);
  const notes = mandateNotes(mandate);

  const onCopyMerchant = async () => {
    try {
      await navigator.clipboard.writeText(mandate.merchant);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — silent */
    }
  };

  return (
    <section
      aria-label="Permission preview"
      className="rounded-2xl border border-line bg-paper2 p-4 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <IconShield className="h-4 w-4 text-gold" />
        <p className="op-eyebrow">Permission to be granted</p>
      </div>
      <p className="mt-1 text-xs text-muted">A scoped spending limit — like setting a limit on a card.</p>

      <dl className="mt-3 space-y-2 text-sm">
        <Row label="Merchant">
          <span className="font-mono text-ink">{formatMerchant(mandate.merchant)}</span>
          <button
            type="button"
            onClick={onCopyMerchant}
            className="ml-2 text-xs text-muted hover:text-ink"
            aria-label="Copy merchant address"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </Row>
        <Row label="Max per charge">{formatUsdcAmount(mandate.maxPerCharge)}</Row>
        <Row label="Daily limit">
          {mandate.maxPerDay > 0n ? formatUsdcAmount(mandate.maxPerDay) : "No daily limit"}
        </Row>
        <Row label="Total cap">{formatUsdcAmount(mandate.totalCap)}</Row>
        <Row label="Expires">{formatExpiry(Number(mandate.expiry))}</Row>
      </dl>

      <div className="mt-3 rounded-xl border border-verify/20 bg-verify-soft/50 px-3 py-2.5 text-xs text-verify">
        <p className="flex items-center gap-1.5 font-semibold">
          <IconCheck className="h-3.5 w-3.5" /> Enforced on-chain · revocable anytime
        </p>
        <p className="mt-1 leading-relaxed text-verify/90">
          If a charge breaks any limit, it reverts on-chain — no funds move and you pay nothing.
        </p>
      </div>

      {notes.length ? (
        <ul className="mt-2 space-y-1.5">
          {notes.map((n, i) => (
            <li
              key={i}
              className={`flex items-start gap-1.5 text-[11px] leading-snug ${
                n.tone === "warn" ? "text-gold" : "text-muted"
              }`}
            >
              <span
                aria-hidden="true"
                className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                  n.tone === "warn" ? "bg-gold" : "bg-faint"
                }`}
              />
              <span>{n.text}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        aria-expanded={expanded}
        className="mt-3 text-xs text-muted hover:text-ink"
      >
        {expanded ? "▾ Hide technical details" : "▸ Show technical details"}
      </button>
      {expanded ? (
        <dl className="mt-2 space-y-1 rounded-xl bg-paper p-3 font-mono text-[11px] text-ink2">
          <Row label="Mandate hash" small>
            <span className="break-all">{mandateId}</span>
          </Row>
          <Row label="Type" small>
            PaymentMandate (EIP-712)
          </Row>
          <Row label="Chain id" small>
            {String(mandate.chainId)}
          </Row>
          <Row label="Token" small>
            <span className="break-all">{mandate.token}</span>
          </Row>
          <Row label="Payer" small>
            <span className="break-all">{mandate.payer}</span>
          </Row>
          <Row label="Nonce" small>
            <span className="break-all">{mandate.nonce}</span>
          </Row>
        </dl>
      ) : null}
    </section>
  );
}

function Row({
  label,
  children,
  small = false,
}: {
  label: string;
  children: React.ReactNode;
  small?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-3 ${
        small ? "text-[11px]" : ""
      }`}
    >
      <dt className={small ? "text-faint" : "text-muted"}>{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

/**
 * Calm, honest "good to know" notes about a mandate's shape, so the card reads like a
 * thoughtful card-limit form. Pure display logic — reflects the mandate's real values only.
 */
function mandateNotes(m: PaymentMandate): { tone: "info" | "warn"; text: string }[] {
  const notes: { tone: "info" | "warn"; text: string }[] = [];

  if (m.maxPerDay === 0n) {
    notes.push({ tone: "info", text: "No daily limit — only the per-charge and total caps apply." });
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const days = Math.round((Number(m.expiry) - nowSec) / 86400);
  if (Number.isFinite(days) && days >= 90) {
    notes.push({
      tone: "warn",
      text: `Long-lived: expires in ~${days} days. A shorter expiry limits exposure.`,
    });
  }

  if (m.maxPerCharge > 0n) {
    const charges = m.totalCap / m.maxPerCharge;
    if (charges >= 50n) {
      notes.push({ tone: "info", text: `Allows up to ${charges.toString()} charges before the total cap.` });
    }
  }

  return notes;
}
