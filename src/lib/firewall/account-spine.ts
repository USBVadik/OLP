// Account "spine" facts for the Permission Firewall moment — makes the Universal Account / own-EOA
// differentiator a CO-STAR of the on-chain block, instead of leaving UA as invisible plumbing.
//
// HONESTY (this renders next to the "over-cap charge blocked" beat, so wording is load-bearing):
//  - The /firewall charge path is ERC20 approve + SpendPolicy.charge on a single chain (Arbitrum),
//    NOT a 7702 or cross-chain operation. So these facts describe the ACCOUNT (own EOA, same
//    address, non-custodial, runs as a Particle UA in the product) — they must NEVER imply the
//    blocked charge itself was cross-chain-sourced or bridged.
//  - Enforcement chains are ONLY where SpendPolicy is deployed live: Base + Arbitrum. No Solana,
//    no Optimism (experimental / not live). The unit test guards this so copy can't regress.

/** Chains where SpendPolicy is deployed live and enforcement is real. */
export const ENFORCEMENT_CHAINS = ["Base", "Arbitrum"] as const;

/** e.g. "Base + Arbitrum" — the chains where the mandate is enforced on-chain. */
export function enforcementChainsLabel(): string {
  return ENFORCEMENT_CHAINS.join(" + ");
}

/** Compact address for display, e.g. "0x53Bd…206a". Returns the input unchanged if too short. */
export function shortAddress(address: string | null | undefined): string {
  if (!address || address.length < 12) return address ?? "";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export type SpineFact = { label: string; value: string };

/**
 * The three always-true differentiators to show at the block moment. Deliberately about the
 * ACCOUNT, not the charge: own EOA, same address as the Particle UA, on-chain enforcement.
 */
export function accountSpineFacts(): SpineFact[] {
  return [
    { label: "Non-custodial", value: "Your own account — no vendor wallet, no MPC custodian" },
    {
      label: "Universal Account",
      value: `Same address via EIP-7702 — one balance across ${enforcementChainsLabel()}`,
    },
    { label: "Enforcement", value: "On-chain, on your own account — not a vendor dashboard" },
  ];
}

/** Short line emphasized when a charge is blocked — ties the block to the user's own account. */
export function blockHeldOnAccountLine(): string {
  return "Firewall held — enforced on your own account";
}

/**
 * The same account-level differentiators as chip-length facts for the pre-arm consent view —
 * one glanceable line where the user hands the workflow its card. Same honesty rules as the
 * spine: about the ACCOUNT, never about how a specific charge settles.
 */
export function compactAccountFacts(): string[] {
  return [
    "Your own EOA",
    "Same address · EIP-7702",
    `One balance · ${enforcementChainsLabel()}`,
    "Enforced on-chain · revocable",
  ];
}
