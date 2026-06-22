"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPublicClient, http, type Address } from "viem";
import { arbitrum, base } from "viem/chains";
import { SPEND_POLICY_ABI, toContractMandate } from "@/lib/contracts/spend-policy";
import { getSpendPolicyAddress } from "@/lib/mandates/mandate";
import { type PaymentMandate } from "@/lib/mandates/types";

export type LiveMandateStatus = "armed" | "revoked" | "expired" | "exhausted";

export type LiveMandateState = {
  /** Per-charge cap effective right now — equals mandate.maxPerCharge unless inert. */
  perChargeLeft: bigint;
  /** Remaining for today's 24h window (post auto-reset by the contract). */
  todayLeft: bigint;
  /** Remaining lifetime room under totalCap. */
  totalLeft: bigint;
  /** True if the payer has explicitly revoked the mandate on-chain. */
  revoked: boolean;
  /** Status the UI should render. */
  status: LiveMandateStatus;
};

const POLL_INTERVAL_MS = 8000;

function chainById(chainId: number) {
  if (chainId === arbitrum.id) return arbitrum;
  if (chainId === base.id) return base;
  throw new Error(`useMandateState: unsupported chainId ${chainId}`);
}

/**
 * Reads live SpendPolicy state for a mandate and re-polls every 8s while the
 * mandate is armed. Stops polling once the mandate becomes revoked or expired.
 *
 * Consumers (BudgetHud, agent demo) should call `refetch()` after an action that
 * mutates state (charge, revoke) to reflect the change without waiting for the
 * next poll tick.
 */
export function useMandateState(chainId: number, mandate: PaymentMandate | null) {
  const [state, setState] = useState<LiveMandateState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const inFlightRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Capture the latest mandate in a ref so the polling closure does not have to
  // be re-bound on every render; the useEffect dependency on `mandate` still
  // controls subscribe/unsubscribe.
  const mandateRef = useRef(mandate);
  mandateRef.current = mandate;

  const fetchOnce = useCallback(async () => {
    const m = mandateRef.current;
    if (!m || inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const spendPolicy = getSpendPolicyAddress(chainId) as Address;
      const chain = chainById(chainId);
      const client = createPublicClient({ chain, transport: http() });
      const contractMandate = toContractMandate(m);

      const remainingResult = (await client.readContract({
        address: spendPolicy,
        abi: SPEND_POLICY_ABI,
        functionName: "remaining",
        args: [contractMandate],
      })) as readonly [bigint, bigint, bigint];

      const mandateId = (await client.readContract({
        address: spendPolicy,
        abi: SPEND_POLICY_ABI,
        functionName: "hashMandate",
        args: [contractMandate],
      })) as `0x${string}`;

      const stateStruct = (await client.readContract({
        address: spendPolicy,
        abi: SPEND_POLICY_ABI,
        functionName: "getMandateState",
        args: [mandateId],
      })) as { spentTotal: bigint; spentToday: bigint; dayStart: bigint; revoked: boolean };

      const [perChargeLeft, todayLeft, totalLeft] = remainingResult;
      const nowSec = BigInt(Math.floor(Date.now() / 1000));
      const expiredOnChain = nowSec >= m.expiry;

      let status: LiveMandateStatus;
      if (stateStruct.revoked) status = "revoked";
      else if (expiredOnChain) status = "expired";
      else if (totalLeft === 0n) status = "exhausted";
      else status = "armed";

      setState({
        perChargeLeft,
        todayLeft,
        totalLeft,
        revoked: stateStruct.revoked,
        status,
      });
      setError(null);
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      inFlightRef.current = false;
    }
  }, [chainId]);

  useEffect(() => {
    if (!mandate) {
      setState(null);
      return;
    }
    setIsLoading(true);
    fetchOnce().finally(() => setIsLoading(false));
    intervalRef.current = setInterval(() => {
      // Stop polling once the mandate is inert.
      const cur = mandateRef.current;
      if (!cur) return;
      void fetchOnce().then(() => {
        if (!intervalRef.current) return;
        // Read back the latest state via setState callback to avoid stale closure.
        setState((prev) => {
          if (
            prev &&
            (prev.status === "revoked" || prev.status === "expired") &&
            intervalRef.current
          ) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return prev;
        });
      });
    }, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchOnce, mandate]);

  return { state, isLoading, error, refetch: fetchOnce };
}
