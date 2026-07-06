"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatUnits, parseUnits, type Address } from "viem";
import { computeMandateId, deriveMandate, mandateFromCustomCaps } from "@/lib/mandates/mandate";
import { type MandatePreset, type PaymentMandate } from "@/lib/mandates/types";
import { formatShortDate } from "@/lib/mandates/format";
import { useProMode } from "@/hooks/use-pro-mode";
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

export function PermissionFirewall({
  merchantAddress,
  tokenAddress,
  chainId,
  amountAtomic,
  symbol,
  decimals,
  payerAddress,
  onMandateChange,
  conceptMode = false,
}: {
  merchantAddress: string;
  tokenAddress: Address;
  chainId: number;
  amountAtomic: string;
  symbol: string;
  decimals: number;
  payerAddress?: string | null;
  onMandateChange?: (mandate: PaymentMandate, preset: MandatePreset) => void;
  /** When true (e.g. inside checkout), label the caps clearly as a not-yet-armed concept preview. */
  conceptMode?: boolean;
}) {
  const [preset, setPreset] = useState<MandatePreset>("agent_budget");
  const [pro] = useProMode();
  const proCustom = pro && !conceptMode; // advanced limits only in the real arming flow, never in checkout concept preview
  const [customOn, setCustomOn] = useState(false);
  const [perChargeStr, setPerChargeStr] = useState("");
  const [dailyStr, setDailyStr] = useState("");
  const [totalStr, setTotalStr] = useState("");
  const [expiryDaysStr, setExpiryDaysStr] = useState("7");

  const presetMandate = useMemo(
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

  // Pro "advanced limits": user-chosen caps flow through the SAME mandate struct
  // (mandateFromCustomCaps → identical EIP-712 envelope). Returns null when inputs are invalid, so we
  // fall back to the preset mandate and arming still works.
  const customMandate = useMemo(() => {
    if (!proCustom || !customOn) return null;
    try {
      const perCharge = parseUnits((perChargeStr || "0").trim(), decimals);
      const daily = parseUnits((dailyStr || "0").trim(), decimals);
      const total = parseUnits((totalStr || "0").trim(), decimals);
      const days = Number(expiryDaysStr);
      if (perCharge <= 0n || total <= 0n || perCharge > total) return null;
      if (daily < 0n || daily > total) return null;
      if (!Number.isFinite(days) || days <= 0 || days > 365) return null;
      return mandateFromCustomCaps({
        payer: (payerAddress as Address | null) ?? ZERO,
        merchant: merchantAddress as Address,
        token: tokenAddress,
        chainId,
        maxPerCharge: perCharge,
        maxPerDay: daily,
        totalCap: total,
        expiry: Math.floor(Date.now() / 1000) + Math.floor(days) * 86_400,
      });
    } catch {
      return null;
    }
  }, [proCustom, customOn, perChargeStr, dailyStr, totalStr, expiryDaysStr, payerAddress, merchantAddress, tokenAddress, chainId, decimals]);

  const customInvalid = proCustom && customOn && customMandate === null;
  const mandate = customMandate ?? presetMandate;

  // Seed the custom inputs from the current preset so the user starts from a valid, sensible mandate.
  function enableCustom() {
    setPerChargeStr(formatUnits(presetMandate.maxPerCharge, decimals));
    setDailyStr(presetMandate.maxPerDay > BigInt(0) ? formatUnits(presetMandate.maxPerDay, decimals) : "0");
    setTotalStr(formatUnits(presetMandate.totalCap, decimals));
    const days = Math.max(1, Math.round((presetMandate.expiry - Math.floor(Date.now() / 1000)) / 86_400));
    setExpiryDaysStr(String(days));
    setCustomOn(true);
  }

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
        {conceptMode ? <ConceptTag>Concept mode</ConceptTag> : <Chip tone="gold">Consent</Chip>}
      </div>

      <p className="px-5 pt-2 text-sm leading-relaxed text-muted">
        Universal Accounts execute invisibly. The firewall makes the consent visible: you grant a
        scoped, revocable permission — and everything outside it is blocked.
      </p>
      {conceptMode ? (
        <p className="mx-5 mt-3 rounded-xl border border-line2 bg-paper2 px-3.5 py-2.5 text-xs leading-relaxed text-muted">
          Concept preview — these caps illustrate the permission you&rsquo;d grant before
          automation. This checkout doesn&rsquo;t arm an agent or change today&rsquo;s payment.
        </p>
      ) : null}

      {/* Preset selector */}
      <div className="mt-4 grid grid-cols-1 gap-2 px-5 sm:grid-cols-3">
        {PRESETS.map((p) => {
          const active = p.id === preset;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPreset(p.id)}
              aria-pressed={active}
              disabled={customOn}
              className={[
                "rounded-xl border px-2.5 py-2 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-40",
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

      {proCustom ? (
        <div className="mx-5 mt-3 rounded-xl border border-line2 bg-paper2 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="op-eyebrow inline-flex items-center gap-1.5">
              Advanced limits <ConceptTag>Pro</ConceptTag>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={customOn}
              aria-label="Set custom limits"
              onClick={() => (customOn ? setCustomOn(false) : enableCustom())}
              className={[
                "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
                customOn ? "border-gold/40 bg-gold" : "border-line2 bg-paper",
              ].join(" ")}
            >
              <span
                className={[
                  "inline-block h-3.5 w-3.5 rounded-full bg-cream shadow-sm transition-transform",
                  customOn ? "translate-x-[18px]" : "translate-x-[3px]",
                ].join(" ")}
                aria-hidden="true"
              />
            </button>
          </div>
          {customOn ? (
            <>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <CapInput label={`Max per charge (${symbol})`} value={perChargeStr} onChange={setPerChargeStr} />
                <CapInput label={`Daily (${symbol}, 0 = none)`} value={dailyStr} onChange={setDailyStr} />
                <CapInput label={`Total cap (${symbol})`} value={totalStr} onChange={setTotalStr} />
                <CapInput label="Expires (days)" value={expiryDaysStr} onChange={setExpiryDaysStr} />
              </div>
              {customInvalid ? (
                <p role="alert" className="mt-2 text-xs text-danger">
                  Enter positive limits with per-charge &le; total, daily &le; total, and 1&ndash;365 days.
                </p>
              ) : (
                <p className="mt-2 text-xs text-faint">Signed as the same on-chain mandate — only the numbers change.</p>
              )}
            </>
          ) : (
            <p className="mt-1 text-xs text-muted">Set your own caps + expiry instead of a preset.</p>
          )}
        </div>
      ) : null}

      {/* Allowed scope */}
      <dl className="mt-3 divide-y divide-line px-5">
        <Row label="Merchant (only recipient)" value={shortAddr(merchantAddress)} mono />
        <Row label="Max per charge" value={perCharge} />
        <Row label="Daily limit" value={daily} />
        <Row label="Total cap" value={total} />
        <Row label="Expires" value={formatShortDate(mandate.expiry)} />
      </dl>

      {/* Blocked by policy */}
      <div className="m-5 mt-4 rounded-2xl border border-line bg-paper2 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
          <IconBan className="h-4 w-4 text-danger" /> Blocked by policy
        </p>
        <ul className="mt-2 space-y-1.5 text-sm text-muted">
          <BlockedRow>Any charge above {perCharge}</BlockedRow>
          <BlockedRow>Payments to anyone except this merchant</BlockedRow>
          <BlockedRow>Anything after {formatShortDate(mandate.expiry)}, or beyond {total} total</BlockedRow>
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

function CapInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-muted">{label}</span>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="op-input"
      />
    </label>
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
