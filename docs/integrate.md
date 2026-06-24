# Integrate OneLink Pay

> Honest scope: this is a **reference implementation**, not a published npm package. The endpoints
> below are the routes this app already serves. Two integration paths, smallest first.

## Path 1 — Hosted pay link (no contracts, no SDK)

A merchant backend creates a link, then sends the customer to the hosted checkout. The customer
logs in with email/Google (Magic) and pays in USDC; funds are sourced cross-chain by the Universal
Account and settled on your chain — you just poll the link's status.

```ts
// Server-side (keep ADMIN_CREATE_TOKEN secret — never ship it to the browser).
const res = await fetch("https://onelink-pay.vercel.app/api/payment-links", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-admin-create-token": process.env.ADMIN_CREATE_TOKEN!,
  },
  body: JSON.stringify({
    merchantAddress: "0xYourMerchantAddress",
    amount: "1000000",            // atomic USDC (6 decimals) → 1.00 USDC
    token: "USDC",
    destinationChainId: 42161,    // Base (8453) | Arbitrum (42161) | Optimism (10)
    label: "Invoice #1024",       // optional
    expiresInHours: 24,           // optional
  }),
});
const link = await res.json();        // { id, ... }
const checkoutUrl = `https://onelink-pay.vercel.app/pay/${link.id}`;
// Redirect the customer to checkoutUrl. Verify completion via the receipt or your webhook.
```

## Path 2 — Charge a bounded mandate (agent / recurring)

The payer signs ONE EIP-712 `PaymentMandate` (per-charge / daily / total caps + merchant + expiry +
revoke). Your service (or an agent) then charges within it. The relayer simulates first, so an
over-cap / off-merchant / post-revoke charge reverts on-chain — no funds move, no gas burned.

```ts
// `mandate` (EIP-712, signed by the payer) + `signature` come from the client helpers in
// src/lib/mandates/*. uint fields are passed as strings; chainId/expiry as numbers.
const res = await fetch("https://onelink-pay.vercel.app/api/mandates/charge", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ mandate, signature, amount: "100000" }), // 0.10 USDC
});
const result = await res.json();
if (result.ok) {
  // settled to the merchant; result.txHash is the on-chain settlement
} else if (result.blocked) {
  // firewall enforced a cap/rule: result.reason (e.g. "over the per-charge cap")
} else {
  // a real failure (e.g. insufficient USDC on the settlement chain): result.error
}
```

## Notes

- Atomic amounts are USDC base units (6 decimals): `1000000` = 1.00 USDC.
- Settlement chains: Base, Arbitrum One, Optimism. Proof (`InvoicePaid`) is anchored on Base.
- The mandate is enforced by `SpendPolicy.sol` (see `contracts/`), not a third-party session-key
  service — the policy is on-chain and auditable.
- `result.blocked` is the only signal that means "the firewall stopped it"; everything else is a
  real error and is surfaced as such (never dressed up as an over-budget block).
