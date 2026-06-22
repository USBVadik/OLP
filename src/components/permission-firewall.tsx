"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatUnits, type Address } from "viem";
import { computeMandateId, deriveMandate } from "@/lib/mandates/mandate";
import { type MandatePreset, type PaymentMandate } from "@/lib/mandates/types";
import { Chip, ConceptTag, Dot, IconBan, IconBolt, IconCheck, IconShield } from "@/components/ui";

const ZERO: Address = "0x0000000000000000000000000000000000000000";

const PRESETS: { id: MandatePreset; label: string; blurb: string }[] = [
  { id: "one_time", label: "One-time", blurb: "A single charge — nothing more." },
  { id: "subscription", label: "Subscription", blurb: "Recurring, capped to a few cycles." },
  { id: "agent_budget", label: "Agent budget", blurb: "A daily budget an AI agent can spend." },
];

function fmt(atomic: bigint, decimals: number, symbol: string) {
  const n = Number(formatUnits(atomic, decimals));
  const s = n % 1 === 0 ? n.toString() : n.toFixed(2);
  return `${s} ${symbol}`;
}

function shortAddr(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function expiryLabel(expiry: number) {
  const d = new Date(expiry * 1000);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function PermissionFirewall({
  merchantAddress,
  tokenAddress,
  chainId,
  amountAtomic,
  symbol,
  decimals,
  payerAddress,
  onMandateChange,
}: {
  merchantAddress: string;
  tokenAddress: Address;
  chainId: number;
  amountAtomic: string;
  symbol: string;
  decimals: number;
  payerAddress?: string | null;
  onMandateChange?: (mandate: PaymentMandate, preset: MandatePreset) => void;
}) {
  const [preset, setPreset] = useState<MandatePreset>("agent_budget");

  const mandate = useMemo(
    () =>
      deriveMandate({
        payer: (payerAddress as Address | null) ?? ZERO,
        merchant: merchantAddress as Address,
        token: tokenAddress,
        chainId,
        invoiceAmount: BigInt(amountAtomic),
        preset,
      }),
    // nonce/now are intentionally re-rolled only when these inputs change
    [payerAddress, merchantAddress, tokenAddress, chainId, amountAtomic, preset]
  );

  const onChangeRef = useRef(onMandateChange);
  useEffect(() => {
    onChangeRef.current = onMandateChange;
  });
  useEffect(() => {
    onChangeRef.current?.(mandate, preset);
  }, [mandate, preset]);

  const mandateId = useMemo(() => computeMandateId(mandate), [mandate]);

  const perCharge = fmt(mandate.maxPerCharge, decimals, symbol);
  const daily = mandate.maxPerDay > BigInt(0) ? fmt(mandate.maxPerDay, decimals, symbol) : "No daily limit";
  const total = fmt(mandate.totalCap, decimals, symbol);

  return (
    <section className="overflow-hidden rounded-3xl border border-line bg-paper">
      <div className="flex items-center justify-between px-5 pt-5">
        <span className="op-eyebrow inline-flex items-center gap-1.5">
          <IconShield className="h-3.5 w-3.5 text-gold" /> Permission Firewall
        </span>
        <Chip tone="gold">Consent</Chip>
      </div>

      <p className="px-5 pt-2 text-sm leading-relaxed text-muted">
        Universal Accounts execute invisibly. The firewall makes the consent visible: you grant a
        scoped, revocable permission — and everything outside it is blocked.
      </p>

      {/* Preset selector */}
      <div className="mt-4 grid grid-cols-3 gap-2 px-5">
        {PRESETS.map((p) => {
          const active = p.id === preset;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPreset(p.id)}
              aria-pressed={active}
              className={[
                "rounded-xl border px-2.5 py-2 text-center transition-colors",
                active
                  ? "border-gold/50 bg-gold-soft/60 text-ink"
                  : "border-line bg-paper2 text-muted hover:border-gold/30",
              ].join(" ")}
            >
              <span className="flex items-center justify-center gap-1 text-[13px] font-semibold">
                {p.id === "agent_budget" ? <IconBolt className="h-3.5 w-3.5 text-gold" /> : null}
                {p.label}
              </span>
            </button>
          );
        })}
      </div>
      <p className="px-5 pt-1.5 text-xs text-faint">{PRESETS.find((p) => p.id === preset)?.blurb}</p>

      {/* Allowed scope */}
      <dl className="mt-3 divide-y divide-line px-5">
        <Row label="Merchant (only recipient)" value={shortAddr(merchantAddress)} mono />
        <Row label="Max per charge" value={perCharge} />
        <Row label="Daily limit" value={daily} />
        <Row label="Total cap" value={total} />
        <Row label="Expires" value={expiryLabel(mandate.expiry)} />
      </dl>

      {/* Blocked by policy */}
      <div className="m-5 mt-4 rounded-2xl border border-line bg-paper2 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
          <IconBan className="h-4 w-4 text-danger" /> Blocked by policy
        </p>
        <ul className="mt-2 space-y-1.5 text-sm text-muted">
          <BlockedRow>Any charge above {perCharge}</BlockedRow>
          <BlockedRow>Payments to anyone except this merchant</BlockedRow>
          <BlockedRow>Anything after {expiryLabel(mandate.expiry)}, or beyond {total} total</BlockedRow>
        </ul>
        <p className="mt-3 flex items-center gap-2 text-xs text-faint">
          <IconCheck className="h-3.5 w-3.5 text-verify" />
          Revocable anytime · enforced by EIP-7702, not by trust
          <span className="ml-auto"><ConceptTag>Arming next</ConceptTag></span>
        </p>
        <p className="mt-2 font-mono text-[11px] text-faint">mandate {mandateId.slice(0, 14)}…</p>
      </div>
    </section>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className={mono ? "font-mono text-xs text-ink2" : "text-sm font-medium text-ink"}>{value}</dd>
    </div>
  );
}

function BlockedRow({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Dot tone="muted" />
      <span>{children}</span>
    </li>
  );
}
