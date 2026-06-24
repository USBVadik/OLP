"use client";

import { useEffect, useState } from "react";
import {
  formatCountdown,
  formatUsdcAmount,
} from "@/lib/mandates/format";
import { useMandateState } from "@/hooks/use-mandate-state";
import { type PaymentMandate } from "@/lib/mandates/types";
import { Chip, IconBolt, IconCheck, IconLock, IconShield } from "@/components/ui";

type Props = {
  /** Chain the SpendPolicy is deployed on (Arbitrum or Base). */
  chainId: number;
  /** The armed mandate. Pass `null` to render an empty placeholder. */
  mandate: PaymentMandate | null;
  /**
   * Bump this counter whenever the firewall BLOCKS a charge. The HUD then flashes a brief
   * "firewall held · budget untouched" beat — the bars deliberately do NOT move, which is the
   * whole point: the over-cap attempt moved zero funds.
   */
  protectedPulse?: number;
  /**
   * Bump this counter after a SUCCESSFUL charge so the HUD refetches immediately and the bars
   * drain right away (instead of waiting for the next 8s poll).
   */
  refreshSignal?: number;
};

/**
 * Live "remaining caps" widget for an armed mandate. Polls SpendPolicy every 8s
 * (and stops once the mandate becomes inert) so the UI stays in sync with charges
 * and revocations without manual refresh.
 */
export function BudgetHud({ chainId, mandate, protectedPulse, refreshSignal }: Props) {
  const { state, isLoading, error, refetch } = useMandateState(chainId, mandate);
  const expirySec = mandate ? Number(mandate.expiry) : 0;
  const countdown = useCountdown(expirySec);
  const [held, setHeld] = useState(false);

  // When a block lands, flash the "budget protected" beat for ~1.7s (one-shot).
  useEffect(() => {
    if (!protectedPulse) return;
    setHeld(true);
    const id = setTimeout(() => setHeld(false), 1700);
    return () => clearTimeout(id);
  }, [protectedPulse]);

  // After a successful charge, refetch now so the bars drain immediately (not on the next poll).
  useEffect(() => {
    if (!refreshSignal) return;
    void refetch();
  }, [refreshSignal, refetch]);

  if (!mandate) {
    return null;
  }

  if (!state) {
    return (
      <div className="rounded-2xl border border-line bg-paper2 p-4 text-sm text-muted">
        {isLoading ? "Loading remaining caps…" : error ? "Could not read mandate state. Retrying…" : "—"}
      </div>
    );
  }

  const todayGauge = gauge(state.todayLeft, mandate.maxPerDay);
  const totalGauge = gauge(state.totalLeft, mandate.totalCap);

  const inert = state.status !== "armed";

  return (
    <div
      className={`relative rounded-2xl border p-4 transition-shadow duration-300 ${
        inert
          ? "border-line bg-paper2 text-ink2"
          : "border-verify/30 bg-verify-soft/40 text-ink"
      } ${held ? "ring-2 ring-verify/60" : ""}`}
    >
      {held ? (
        <div className="pointer-events-none absolute inset-x-3 -top-3 z-10 flex justify-center">
          <span className="animate-seal inline-flex items-center gap-1.5 rounded-full border border-verify/40 bg-paper px-2.5 py-1 text-[11px] font-semibold text-verify shadow-card">
            <IconShield className="h-3 w-3" /> Firewall held &middot; budget untouched
          </span>
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <IconBolt className="h-4 w-4 text-gold" />
          Remaining budget
        </p>
        <StatusChip status={state.status} />
      </div>

      <div className="mt-3 space-y-3">
        <Bar
          label="Today"
          text={mandate.maxPerDay > 0n ? todayGauge.text : "No daily limit"}
          percentLeft={mandate.maxPerDay > 0n ? todayGauge.percentLeft : 100}
          inert={inert || mandate.maxPerDay === 0n}
        />
        <Bar
          label="Lifetime"
          text={totalGauge.text}
          percentLeft={totalGauge.percentLeft}
          inert={inert}
        />
      </div>

      <p className="mt-3 text-xs text-muted">
        {state.status === "expired"
          ? "Expired"
          : state.status === "revoked"
          ? "Revoked — no further charges accepted"
          : state.status === "exhausted"
          ? "Total cap reached"
          : `Expires in ${countdown}`}
      </p>

      <p className="mt-1 text-[11px] text-faint">
        Per charge: up to {formatUsdcAmount(state.perChargeLeft)}
      </p>
    </div>
  );
}

/**
 * Turn a (remaining, cap) pair into a draining fuel-gauge: text + the percent
 * of budget STILL AVAILABLE (so the bar empties as the agent spends).
 */
function gauge(left: bigint, cap: bigint): { text: string; percentLeft: number } {
  if (cap === 0n) return { text: "No limit", percentLeft: 100 };
  const clamped = left < 0n ? 0n : left > cap ? cap : left;
  const percentLeft = Number((clamped * 100n) / cap);
  const leftStr = formatUsdcAmount(clamped).replace(" USDC", "");
  return { text: `${leftStr} left of ${formatUsdcAmount(cap)}`, percentLeft };
}

function StatusChip({ status }: { status: import("@/hooks/use-mandate-state").LiveMandateStatus }) {
  if (status === "armed") {
    return (
      <Chip tone="verify">
        <IconCheck className="h-3 w-3" /> Armed
      </Chip>
    );
  }
  if (status === "revoked") {
    return (
      <Chip>
        <IconLock className="h-3 w-3" /> Revoked
      </Chip>
    );
  }
  if (status === "expired") {
    return <Chip>Expired</Chip>;
  }
  return <Chip tone="gold">Cap reached</Chip>;
}

function Bar({
  label,
  text,
  percentLeft,
  inert,
}: {
  label: string;
  text: string;
  percentLeft: number;
  inert: boolean;
}) {
  // Low-budget warning: amber when under a quarter of the budget remains.
  const low = !inert && percentLeft < 25;
  const fill = inert ? "bg-line2" : low ? "bg-gold" : "bg-verify";
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-muted">{label}</span>
        <span className="font-mono text-ink">{text}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-paper">
        <div
          className={`h-full rounded-full transition-[width,background-color] duration-700 ease-out ${fill}`}
          style={{ width: `${percentLeft}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Tick a countdown string at 1Hz so the "Expires in Xh Ym" line stays current
 * without re-fetching the chain.
 */
function useCountdown(unixSeconds: number): string {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!unixSeconds) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [unixSeconds]);
  // tick is consumed implicitly via the rerender; reading it keeps the linter happy.
  void tick;
  if (!unixSeconds) return "—";
  const remaining = unixSeconds - Math.floor(Date.now() / 1000);
  return formatCountdown(remaining);
}
