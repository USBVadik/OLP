// Pure funding-route mapper for the shareable receipt (R22 #3 → L2, read-time verification).
//
// Turns a Particle `getTransaction(uaTransactionId)` activity object into a server-VERIFIED funding
// route, WITHOUT trusting any client-supplied field. It is deliberately pure + chain-config-free so
// it is unit-testable against a captured real activity fixture; the caller resolves chain names and
// performs the network fetch. Vendor-verified (Particle backend), NOT an on-chain proof.

/** Particle `UA_TRANSACTION_STATUS.FINISHED` — the only status we treat as a completed route. */
export const UA_STATUS_FINISHED = 7;

/** The subset of a Particle activity we read. `any`-ish because `getTransaction` returns `Promise<any>`. */
export interface UaActivityLike {
  status?: number;
  sender?: string;
  receiver?: string;
  tokenChanges?: { fromChains?: unknown } | null;
}

export interface FundingRouteContext {
  /** The payer EOA (the UA owner) this receipt belongs to. */
  payer: string;
  /** The merchant payee this receipt belongs to. */
  merchant: string;
  /** The settlement (destination) chain id; source chains are those != this. */
  settlementChainId: number;
}

export interface FundingRoute {
  /** True only when the activity is FINISHED and its sender/receiver match this payment. */
  verified: boolean;
  /** True when at least one funding source chain differs from the settlement chain. */
  crossChain: boolean;
  /** Unique source chain ids (funding legs) excluding the settlement chain. */
  sourceChainIds: number[];
  /** Machine-readable outcome, for logs/tests. */
  reason: string;
}

function eqAddr(a?: string, b?: string): boolean {
  return typeof a === "string" && typeof b === "string" && a.toLowerCase() === b.toLowerCase();
}

const NOT_VERIFIED = (reason: string): FundingRoute => ({
  verified: false,
  crossChain: false,
  sourceChainIds: [],
  reason,
});

/**
 * Derive a server-verified funding route from a Particle activity. Fail-closed: any missing/mismatched
 * field yields `{ verified: false }` so the caller falls back to the honest "reported" label.
 */
export function deriveFundingRoute(
  activity: UaActivityLike | null | undefined,
  ctx: FundingRouteContext,
): FundingRoute {
  if (!activity || typeof activity !== "object") return NOT_VERIFIED("no activity");
  if (activity.status !== UA_STATUS_FINISHED) return NOT_VERIFIED(`status ${activity.status ?? "?"} != FINISHED`);
  if (!eqAddr(activity.sender, ctx.payer)) return NOT_VERIFIED("sender != payer");
  if (!eqAddr(activity.receiver, ctx.merchant)) return NOT_VERIFIED("receiver != merchant");

  const raw = activity.tokenChanges?.fromChains;
  const fromChains = Array.isArray(raw) ? raw : [];
  const sourceChainIds = Array.from(
    new Set(
      fromChains.filter(
        (c): c is number => typeof c === "number" && Number.isFinite(c) && c !== ctx.settlementChainId,
      ),
    ),
  );

  return {
    verified: true,
    crossChain: sourceChainIds.length > 0,
    sourceChainIds,
    reason: "ok",
  };
}
