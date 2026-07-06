# Integrate OneLink Pay

> Honest scope: this is a **reference implementation**, not a published npm package. Every endpoint
> below is a route this app already serves (`src/app/api/*`). No contracts to deploy, no SDK — three
> paths, smallest first. Base URL in these examples: `https://onelink-pay.vercel.app`.
>
> **Who it's for:** AI-agent frameworks that need a hard, revocable spend ceiling · usage- or
> subscription-billing that wants a capped on-chain mandate · API providers pricing per call over
> **x402**. Amounts are atomic USDC (6 decimals): `1000000` = 1.00 USDC.

## Path 1 — Hosted pay link (no contracts, no SDK)

Your backend creates a link, then sends the customer to the hosted checkout. They log in with
email/Google (Magic) and pay in USDC; the Universal Account sources funds cross-chain and settles on
your chain. You poll the link's status (or read the public receipt).

```bash
# Server-side only — keep ADMIN_CREATE_TOKEN secret, never ship it to the browser.
curl -s https://onelink-pay.vercel.app/api/payment-links \
  -H "content-type: application/json" \
  -H "x-admin-create-token: $ADMIN_CREATE_TOKEN" \
  -d '{
    "merchantAddress": "0xYourMerchantAddress",
    "amount": "1000000",
    "token": "USDC",
    "destinationChainId": 42161,
    "label": "Invoice #1024"
  }'
# → { "paymentLink": { "id": "…", … }, "checkoutUrl": "https://onelink-pay.vercel.app/pay/<id>" }
```

```ts
const res = await fetch("https://onelink-pay.vercel.app/api/payment-links", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-admin-create-token": process.env.ADMIN_CREATE_TOKEN!,
  },
  body: JSON.stringify({
    merchantAddress: "0xYourMerchantAddress",
    amount: "1000000",           // atomic USDC (6 decimals) → 1.00 USDC
    token: "USDC",
    destinationChainId: 42161,   // Arbitrum (42161) | Base (8453) | Optimism (10); default 42161
    label: "Invoice #1024",      // optional
    expiresInHours: 24,          // optional
  }),
});
const { paymentLink, checkoutUrl } = await res.json();
// Redirect the customer to `checkoutUrl` (= `/pay/${paymentLink.id}`). Confirm completion via the
// public receipt at /receipt/<id> or by polling GET /api/payment-links?merchantId=<addr>.
```

## Path 2 — Charge a bounded mandate (server-to-server)

The payer signs ONE EIP-712 `PaymentMandate` (per-charge / daily / total caps + merchant + expiry +
revoke). Your service then charges within it. The relayer **simulates first**, so an over-cap /
off-merchant / post-revoke charge reverts on-chain — no funds move, no gas burned.

```ts
// `mandate` (EIP-712, signed by the payer) + `signature` come from the client helpers in
// src/lib/mandates/*. uint fields are strings; chainId/expiry are numbers.
const res = await fetch("https://onelink-pay.vercel.app/api/mandates/charge", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ mandate, signature, amount: "100000" }), // 0.10 USDC
});
const result = await res.json();
if (result.ok)            { /* settled — result.txHash is the on-chain charge */ }
else if (result.blocked)  { /* firewall enforced a cap/rule — result.reason */ }
else                      { /* a real failure (e.g. insufficient USDC) — result.error */ }
```

## Path 3 — Bound an agent's x402 spend (the leash)

Your agent hits an x402-priced resource; the OneLink mandate is the ceiling. `GET → 402 → pay within
the mandate → retry with proof → 200`. Over-budget calls are refused before any funds move.

```ts
const APP = "https://onelink-pay.vercel.app";

// 1) Ask for the resource → 402 Payment Required + terms
const terms = await fetch(`${APP}/api/x402/market-insight`).then((r) => r.json());
const req = terms.accepts[0]; // { maxAmountRequired, payTo, asset, resource, extra:{ mandatePolicy }, … }

// 2) Pay within your signed mandate — the on-chain SpendPolicy enforces the caps
const pay = await fetch(`${APP}/api/mandates/charge`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ mandate, signature, amount: req.maxAmountRequired }),
}).then((r) => r.json());
if (!pay.ok) throw new Error(pay.blocked ? `firewall blocked: ${pay.reason}` : pay.error);

// 3) Retry with the proof header (base64 JSON) → 200 + the data
const xPayment = Buffer.from(JSON.stringify({
  scheme: "onelink-mandate",       // NOT the Coinbase `exact` scheme — the x402 *pattern*
  txHash: pay.txHash,
  amount: req.maxAmountRequired,
  asset: req.asset,
  payTo: req.payTo,
  resource: req.resource,
}), "utf8").toString("base64");

const data = await fetch(`${APP}${req.resource}`, { headers: { "X-PAYMENT": xPayment } })
  .then((r) => r.json()); // 200: { resource, data, paidTx, settledVia: "spend-mandate" }
```

## Notes

- Settlement chains: Arbitrum One, Base, Optimism. Proof (`InvoicePaid`) is anchored on Base.
- The mandate is enforced by `SpendPolicy.sol` (see `contracts/`) — on-chain and auditable, not a
  third-party session-key service. The InvoicePaid attestor is a distinct key from the merchant
  payee (risk-register R26).
- `result.blocked` / a `402` with the same terms is the ONLY signal that means "the firewall stopped
  it"; everything else is a real error surfaced honestly (never dressed up as an over-budget block).
- x402 here is the **pattern** with a custom `onelink-mandate` settlement scheme — not the Coinbase
  EIP-3009 facilitator. Enforcement is real; wire-compatibility is not claimed.
