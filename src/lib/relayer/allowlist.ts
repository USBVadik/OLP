// Address allowlists for the PUBLIC relayer routes (R16 hardening): /api/mandates/charge and
// /api/delegate/sponsor spend the relayer's own gas, so we bound WHO can trigger them. A payer's
// FUNDS are already protected by the signed EIP-712 mandate + on-chain caps — these allowlists only
// protect the relayer's GAS from being pointed at arbitrary payees / triggered by arbitrary payers.
//
// Config: comma-separated addresses in the env var. Unset/empty falls back to the demo address.
// The literal "*" disables the restriction (open to any) for operators who want the public route
// open during judging. All comparisons are lowercase-normalized so checksummed and lowercase match.

/** Demo merchant (payee) the /firewall + /agent flows settle to. */
export const DEMO_MERCHANT_FALLBACK = "0x8C54783849A2C042544efc37c4657Ee98a411Fb7";
/** Demo payer (funded Magic EOA / UA owner) the live demo charges from. */
export const DEMO_PAYER_FALLBACK = "0x53Bd615635Af778e5E460d5EEC2d6b234693206a";

/** Parse a comma-separated allowlist env into lowercase entries, falling back to `fallback` when the
 *  env is unset/blank. Trims whitespace and drops empty entries. */
export function parseAllowlist(rawEnv: string | undefined | null, fallback: string): string[] {
  const raw = rawEnv && rawEnv.trim() ? rawEnv : fallback;
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** True if `address` is permitted by the allowlist. "*" in the list disables the restriction. */
export function isAllowlisted(
  address: string,
  rawEnv: string | undefined | null,
  fallback: string
): boolean {
  const list = parseAllowlist(rawEnv, fallback);
  if (list.includes("*")) return true;
  return list.includes(address.toLowerCase());
}
