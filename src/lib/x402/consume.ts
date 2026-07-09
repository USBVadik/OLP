// x402 replay protection — pure decision logic (DB-agnostic, unit-tested).
//
// A verified payment proof (the settlement tx hash) may unlock ONE paid resource exactly once. The
// x402 route atomically claims the tx hash in a consume-store with a UNIQUE(tx_hash) constraint
// BEFORE delivering. Because the on-chain MandateCharged event does not bind to a resource id, the
// uniqueness is on tx_hash alone: one payment unlocks one resource — you cannot spread a single
// charge across every resource, nor replay the same proof for the same resource.

/** Outcome of trying to claim a proof in the consume-store. */
export type ConsumeResult = "fresh" | "replayed" | "unavailable";

/**
 * Classify a Supabase insert outcome:
 *  - no error            -> "fresh"       (first time this tx unlocked a resource)
 *  - unique_violation    -> "replayed"    (this tx was already consumed — replay / cross-resource)
 *  - any other / thrown  -> "unavailable" (store down or migration missing -> fail CLOSED upstream)
 */
export function classifyConsume(
  error: { code?: string | null } | null | undefined
): ConsumeResult {
  if (!error) return "fresh";
  if (error.code === "23505") return "replayed"; // Postgres unique_violation
  return "unavailable";
}

export interface X402Decision {
  deliver: boolean;
  status: number;
  reason?: string;
}

/**
 * Fail-CLOSED delivery decision for a PAID x402 resource. Only a fresh consume delivers. A replayed
 * proof is rejected (402). An unavailable consume-store must NOT deliver (503) — we never hand out a
 * paid resource we could not de-duplicate, so "replay is closed" stays an honest claim.
 */
export function x402DeliveryDecision(result: ConsumeResult): X402Decision {
  switch (result) {
    case "fresh":
      return { deliver: true, status: 200 };
    case "replayed":
      return {
        deliver: false,
        status: 402,
        reason: "payment proof already used — each paid proof unlocks one resource once",
      };
    case "unavailable":
      return {
        deliver: false,
        status: 503,
        reason: "payment verification store unavailable — proof could not be de-duplicated",
      };
  }
}
