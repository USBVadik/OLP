/**
 * x402 payment-requirements helpers.
 *
 * OneLink Pay speaks the x402 HTTP handshake (server returns `402 Payment Required` with a list
 * of payment requirements; the client pays; the client retries with a proof header), but settles
 * payment through an on-chain spend mandate instead of a raw EIP-3009 transfer. To be honest about
 * that, the scheme is named `onelink-mandate` (NOT the canonical x402 `exact` scheme), and the
 * `extra.settledVia` field says so explicitly. This is the x402 *pattern* with an on-chain
 * spending-limit settlement layer — not a drop-in Coinbase-facilitator endpoint.
 *
 * All functions here are pure.
 */

export const X402_VERSION = 1;
export const X402_SCHEME = "onelink-mandate" as const;

export type Hex = `0x${string}`;

export type X402PaymentRequirements = {
  scheme: typeof X402_SCHEME;
  network: string;
  /** Atomic USDC amount required, as a decimal string. */
  maxAmountRequired: string;
  /** The resource path being paid for. */
  resource: string;
  description: string;
  mimeType: string;
  /** Recipient of the payment (the merchant). */
  payTo: Hex;
  maxTimeoutSeconds: number;
  /** Token contract the payment must be denominated in (USDC). */
  asset: Hex;
  extra: {
    /** The SpendPolicy contract that enforces the mandate. */
    mandatePolicy: Hex;
    settledVia: "spend-mandate";
  };
};

export type X402Response = {
  x402Version: number;
  accepts: X402PaymentRequirements[];
  error?: string;
};

export type X402PaymentProof = {
  scheme: typeof X402_SCHEME;
  /** The on-chain charge transaction the agent claims as payment. */
  txHash: Hex;
  /** Atomic USDC amount the agent claims it paid. */
  amount: string;
  asset: Hex;
  payTo: Hex;
  resource: string;
};

const DEFAULT_TIMEOUT_SECONDS = 120;

export function buildPaymentRequirements(input: {
  resource: string;
  description: string;
  priceAtomic: bigint;
  payTo: Hex;
  asset: Hex;
  network: string;
  mandatePolicy: Hex;
  maxTimeoutSeconds?: number;
}): X402PaymentRequirements {
  return {
    scheme: X402_SCHEME,
    network: input.network,
    maxAmountRequired: input.priceAtomic.toString(),
    resource: input.resource,
    description: input.description,
    mimeType: "application/json",
    payTo: input.payTo,
    maxTimeoutSeconds: input.maxTimeoutSeconds ?? DEFAULT_TIMEOUT_SECONDS,
    asset: input.asset,
    extra: { mandatePolicy: input.mandatePolicy, settledVia: "spend-mandate" },
  };
}

export function build402Response(
  requirements: X402PaymentRequirements,
  error?: string
): X402Response {
  const body: X402Response = {
    x402Version: X402_VERSION,
    accepts: [requirements],
  };
  if (error) body.error = error;
  return body;
}

/** Encode a payment proof as a base64 JSON string for the `X-PAYMENT` header. */
export function encodePaymentHeader(proof: X402PaymentProof): string {
  return Buffer.from(JSON.stringify(proof), "utf8").toString("base64");
}

/**
 * Decode and validate an `X-PAYMENT` header. Returns `null` on anything malformed (bad base64,
 * non-JSON, wrong scheme, or missing fields) so the route can return a clean 402 instead of a 500.
 */
export function decodePaymentHeader(header: string): X402PaymentProof | null {
  if (!header || typeof header !== "string") return null;

  let json: string;
  try {
    json = Buffer.from(header, "base64").toString("utf8");
  } catch {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object") return null;
  const p = parsed as Record<string, unknown>;

  if (p.scheme !== X402_SCHEME) return null;
  const required = ["txHash", "amount", "asset", "payTo", "resource"] as const;
  for (const key of required) {
    if (typeof p[key] !== "string" || (p[key] as string).length === 0) return null;
  }

  return {
    scheme: X402_SCHEME,
    txHash: p.txHash as Hex,
    amount: p.amount as string,
    asset: p.asset as Hex,
    payTo: p.payTo as Hex,
    resource: p.resource as string,
  };
}
