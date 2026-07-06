import { deriveFundingRoute, type FundingRouteContext, type SourceLeg, type UaActivityLike } from "./route";

// Server-side funding-route verification (R22 #3 → L2). READ-ONLY and OFF the settlement path:
// called at receipt render time only. Fail-closed — any missing id / import error / network error /
// timeout / mismatch returns `client_reported`, so the receipt falls back to today's honest
// "reported by your wallet" label. NEVER throws into the render.

export type FundingRouteStatus = "particle_verified" | "client_reported";

export interface VerifiedFundingRoute {
  status: FundingRouteStatus;
  sourceChainIds: number[];
  crossChain: boolean;
  sourceLegs: SourceLeg[];
}

const CLIENT_REPORTED: VerifiedFundingRoute = {
  status: "client_reported",
  sourceChainIds: [],
  crossChain: false,
  sourceLegs: [],
};

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("getTransaction timeout")), ms)),
  ]);
}

/**
 * Verify a payment's cross-chain funding route via Particle `getTransaction(uaTransactionId)`.
 * Server-authoritative (not client-reported), vendor-verified (not an on-chain proof).
 */
export async function verifyFundingRoute(
  uaTransactionId: string | null | undefined,
  ctx: FundingRouteContext,
): Promise<VerifiedFundingRoute> {
  if (!uaTransactionId || !ctx.payer) return CLIENT_REPORTED;

  const projectId = process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID;
  const projectClientKey = process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY;
  const projectAppUuid = process.env.NEXT_PUBLIC_PARTICLE_APP_ID;
  if (!projectId || !projectClientKey || !projectAppUuid) return CLIENT_REPORTED;

  try {
    // Dynamic import so any load error (or the SDK's browser-only deps) fails closed here, and the
    // heavy SDK stays out of the render path until a cross-chain receipt actually needs it.
    const { UniversalAccount, UNIVERSAL_ACCOUNT_VERSION } = await import(
      "@particle-network/universal-account-sdk"
    );
    const ua = new UniversalAccount({
      projectId,
      projectClientKey,
      projectAppUuid,
      smartAccountOptions: {
        useEIP7702: true,
        name: "UNIVERSAL",
        version: UNIVERSAL_ACCOUNT_VERSION,
        ownerAddress: ctx.payer,
      },
    });
    const activity = (await withTimeout(ua.getTransaction(uaTransactionId), 2500)) as UaActivityLike;
    const route = deriveFundingRoute(activity, ctx);
    if (route.verified) {
      return {
        status: "particle_verified",
        sourceChainIds: route.sourceChainIds,
        crossChain: route.crossChain,
        sourceLegs: route.sourceLegs,
      };
    }
    return CLIENT_REPORTED;
  } catch {
    return CLIENT_REPORTED;
  }
}
