"use client";

import { useEffect, useState } from "react";
import { Chip, IconShield, IconCheck } from "@/components/ui";
import {
  accountSpineFacts,
  shortAddress,
  blockHeldOnAccountLine,
} from "@/lib/firewall/account-spine";

/**
 * The "your own account" spine — makes the non-custodial / Universal Account differentiator a
 * CO-STAR of the firewall block, instead of leaving UA as invisible plumbing. Rendered beside the
 * budget HUD so it's on screen at the block moment, and it flashes when a charge is blocked.
 *
 * Honesty: this describes the ACCOUNT (own EOA, same address, runs as a Particle UA), never the
 * specific charge — the /firewall charge is same-chain, so nothing here implies a cross-chain op.
 */
export function AccountSpine({
  address,
  protectedPulse,
}: {
  address: string | null;
  protectedPulse?: number;
}) {
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (!protectedPulse) return;
    setHeld(true);
    const id = setTimeout(() => setHeld(false), 1700);
    return () => clearTimeout(id);
  }, [protectedPulse]);

  const facts = accountSpineFacts();

  return (
    <div
      className={`relative rounded-2xl border p-4 transition-shadow duration-300 ${
        held ? "border-gold/50 bg-gold-soft/40 ring-2 ring-gold/50" : "border-line bg-paper2"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="op-eyebrow">Your own account</p>
        <Chip tone="gold">
          <IconShield className="h-3.5 w-3.5" /> Non-custodial
        </Chip>
      </div>

      {address ? (
        <p className="mt-1 font-mono text-sm text-ink2">{shortAddress(address)}</p>
      ) : null}

      <ul className="mt-3 space-y-2">
        {facts.map((f) => (
          <li key={f.label} className="flex items-start gap-2 text-sm leading-relaxed">
            <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-verify" aria-hidden="true" />
            <span className="text-ink2">
              <span className="font-medium text-ink">{f.label}:</span> {f.value}
            </span>
          </li>
        ))}
      </ul>

      {held ? (
        <p className="animate-seal mt-3 flex items-center gap-1.5 rounded-xl bg-gold-soft px-3 py-2 text-xs font-semibold text-ink">
          <IconShield className="h-3.5 w-3.5 text-gold" /> {blockHeldOnAccountLine()}
        </p>
      ) : null}
    </div>
  );
}
