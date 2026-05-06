/**
 * ZeroDev Repeat-Pay Caps (STRETCH GOAL)
 *
 * Session keys with strict spend limits:
 * - Merchant-bound: can only send to specific merchant address
 * - Amount-capped: max per-tx and cumulative limits
 * - Time-limited: session expires after N days
 *
 * Implementation deferred until core loop is stable.
 */

export interface RepeatPayConfig {
  merchantAddress: string;
  maxPerTransaction: string;
  maxCumulative: string;
  expiresAt: number; // unix timestamp
  token: string;
  chainId: number;
}

export async function createRepeatPaySession(
  _config: RepeatPayConfig
): Promise<{ sessionKey: string }> {
  // TODO: Implement with ZeroDev permissions SDK
  throw new Error("Stretch goal — not yet implemented");
}

export async function executeRepeatPayment(
  _sessionKey: string,
  _amount: string
): Promise<{ txHash: string }> {
  // TODO: Execute capped payment via session key
  throw new Error("Stretch goal — not yet implemented");
}

export async function revokeRepeatPaySession(
  _sessionKey: string
): Promise<void> {
  // TODO: Revoke session key on-chain
  throw new Error("Stretch goal — not yet implemented");
}
