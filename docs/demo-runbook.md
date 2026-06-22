# OneLink Pay — Demo Runbook

Last updated: 2026-06-21

The definitive "what to show and say" for judges. Reflects the current build (live on Base mainnet).

## One-liner

OneLink Pay is the consent + proof layer for Universal Accounts: see exactly what you authorize, have it enforced on-chain by EIP-7702, and get a verifiable receipt. The safety rails the agentic-payments era needs.

## Thesis (why this wins, not "another checkout")

Three 2026 rails are converging:

- **x402** (Coinbase) gives AI agents a way to pay over HTTP in USDC (now wired into AWS CloudFront).
- **AP2** (Google, donated to FIDO) defines signed "mandates" — scoped permission for agents — but as off-chain Verifiable Credentials.
- **EIP-7702** is the delegation mechanism that upgrades an EOA in place, and its #1 documented risk is drainer phishing (signing a delegation to malicious code).

The missing piece: nothing enforces the mandate **on-chain at the user's account**. OneLink Pay fills that gap — sign one scoped mandate, the Universal Account can be charged only inside it, everything else reverts, and the user can revoke instantly. It is the on-chain guardrail that makes agentic, cross-chain payments safe.

Positioning: **Particle handles execution. OneLink Pay handles consent, proof, and payment safety.**

## What is live and proven on Base mainnet

- **Magic email login -> Particle UA in EIP-7702 mode.** EOA delegated in place (same address), across Base + Arbitrum + Optimism.
- **Permission Firewall — real on-chain enforcement (live on Base and Arbitrum).** `SpendPolicy` enforces per-charge / daily / total caps + expiry + merchant-only recipient + revoke. Off-scope or over-cap charges revert.
- **Proof Receipt.** A verified -> matched -> recorded trail, shareable at `/receipt/[id]`; anyone can verify on a block explorer.
- **InvoicePaid proof** anchored on Base via `ReceiptEmitter`.

## Live demo (about 4 minutes)

### Part A — Checkout with visible consent (UX 40%)

1. Open a payment link: `/pay/<id>`. **Continue with Google** (Magic) — no seed phrase, no extension, no chain selector. Back on the page in seconds, logged in.
2. Show the **legible Mandate Card**: merchant, per-charge / daily / total caps, and expiry in plain English — with the EIP-712 hash tucked behind "Show technical details". This is consent you can read, not a blind signature.
3. Pay. Show the **Proof Receipt** (verified -> matched -> recorded), then open `/receipt/<id>` — the public, verifiable receipt.

### Part B — The agent on a leash (the wow moment): `/firewall`

Split-screen: the firewall dashboard on the left, an autonomous AI-agent terminal on the right.

1. Sign in (Google/Magic). **Arm** a mandate using the **Agent budget** preset (0.10 per charge, 2.00/day, 10.00 total) — one signature + one approve. The **Budget HUD** lights up: "2.00 left of 2.00 today, 10.00 left of 10.00 lifetime, expires in 24h".
2. **Run agent (within budget)** -> the terminal narrates `[AGENT] pay 0.10 USDC… [FIREWALL] Charged 0.10. Settled to merchant. view tx`. The budget HUD visibly drains (2.00 -> 1.90).
3. **Run agent (over cap)** -> `[AGENT] premium upsell 0.20 USDC… [FIREWALL] BLOCKED: PerChargeExceeded. No funds moved, zero gas.` Rejected at simulation — nothing hits the chain. The seatbelt holds, on camera.
4. **Revoke** -> `[USER] Revoke signed. [FIREWALL] Mandate revoked. Agent disarmed.` Run the agent again -> `BLOCKED: MandateIsRevoked`. 7702 reversibility as a safety feature.

Proven live on Arbitrum 2026-06-21: armed agent_budget mandate, within-cap charge settled + budget drained to 1.90/9.90, over-cap blocked with `PerChargeExceeded`, revoke confirmed.

Talk track: "Universal Accounts execute invisibly. We make the consent legible and the limits unbreakable — enforced by EIP-7702, not by trust. The agent can pay. It cannot overpay. That is what makes agentic, cross-chain payments safe."

### Part C — Agent commerce on x402, bounded by the mandate (the originality beat): `/agent`

This is the wedge no one else has: x402 lets an agent pay per API call, but nothing bounds how
much it can spend. OneLink Pay settles every x402 payment through the on-chain mandate.

1. Sign in (Google/Magic), **Arm agent budget** (0.10/call, 2.00/day, 10.00 total). The
   **Unified Balance HUD** shows the agent's Particle Universal Account as ONE balance across Base +
   Arbitrum (read live via `getPrimaryAssets`) — "your agent holds one balance across chains; it
   never picks a chain or holds gas." This is Particle's chain-abstraction superpower, made visible.
2. Send the agent to buy **Market insight ($0.05)**. The terminal narrates the real x402
   handshake: `GET /api/x402/market-insight → 402 Payment Required ($0.05)` → `Paying within
   mandate…` → `Charged 0.05` → `GET (paid) → 200 OK`, and the resource JSON appears. Budget HUD
   drains.
3. Send it to buy **Premium dataset ($0.20)** — over the 0.10 per-charge cap. `402 → Paying… →
   BLOCKED: PerChargeExceeded. No funds moved.` → `Access denied — over budget. Resource not
   delivered.` The agent literally cannot overspend on a paid API.

Honesty line for judges: "This is the x402 HTTP pattern — 402, pay, retry — but settlement runs
through our on-chain mandate (`onelink-mandate` scheme), not a raw transfer. That's the missing
spending-control layer for the x402 economy. x402 gives agents a wallet; we give them a leash."
(Not Coinbase-facilitator wire-compatible — say so.)

Context: x402 is the breakout agent rail of 2026 (~120M+ tx, $41M+ USDC, 400k+ agents) with a
documented spend-scope security gap (two arXiv papers on x402 attacks). Figures rephrased for
licensing compliance.

## On-chain proofs (copy-paste)

Base:

- SpendPolicy (Base): `0x73C862a8312c12C764487a9a484f1d1ad44E3957`
- SpendPolicy deploy tx: `0x63de9403bce99cbb0665f12af5ad0a968eedc3f6ce1e9de2db1e059dfab508a3`
- `MandateCharged` (Base, 0.10 USDC): `0x4e64eaddd25b3eb65b0d531d3e3237122775c1ca0fcae0497e3b073346334b00`
- EIP-7702 delegation (Base): `0x4ca63029e2f4fb0824ba63407b28c518fc22c6270b6fc18c258bf2c13c29cef0`
- ReceiptEmitter (Base): `0x89CF50C01BDb8b47fc8f38AE4dB495FCCC685bC3`

Arbitrum (Arbitrum-first):

- SpendPolicy (Arbitrum): `0x9782e3724859469fbBAC5085EA8bf8E70724164E`
- `MandateCharged` (Arbitrum, 0.10 USDC): `0x33a4e69e2d4f0a2a9269bf9fb758b3043cbae4c5e146e3e16cf9c75d439b9ced`
- ReceiptEmitter (Arbitrum): `0xe4C6656B6c248B20Bd2C5ddf9168A4531AAbD2A1`

Accounts:

- Payer / UA owner: `0x53Bd615635Af778e5E460d5EEC2d6b234693206a`
- Merchant: `0x8C54783849A2C042544efc37c4657Ee98a411Fb7`

## Judging-criteria map

- **UX excellence (40%):** email onboarding; legible consent vs blind signature; live agent budget; visceral "overcharge blocked"; one-tap revoke; shareable proof receipt.
- **Universal Accounts + EIP-7702 (30%):** UA in 7702 mode; same address delegated across 3 chains; account-level mandate enforcement; directly addresses the documented 7702 drainer risk.
- **Adoption potential (20%):** plugs into the real agentic economy (x402 + AWS, AP2 + Google/FIDO); concrete markets in subscriptions and AI-agent spending.
- **Technical quality / polish (10%):** SpendPolicy covered by 22 passing tests; typed end to end; EIP-712 mandate byte-identical between contract and frontend.

## Honest status (state this plainly)

- **Live and proven:** EIP-7702 delegation, same-chain UA payment, on-chain mandate enforcement, on-chain proof.
- **In progress — the one gate for the UA Track:** cross-chain value movement via UA. Primary rail is Particle UA native cross-chain (pending Particle V2 general availability); backup is Circle Gateway, which pairs natively with 7702 EOAs (the EOA signs burn intents directly). Finalize at the Particle kickoff (Jun 22) and the Circle Gateway workshop (Jun 25).
- **Not claimed:** gas sponsorship.

## Run locally

- App: `corepack pnpm dev` (mode `universal_7702_transfer`).
- Firewall demo requires `NEXT_PUBLIC_SPEND_POLICY_ADDRESS` set (deployed: `0x73C862a8312c12C764487a9a484f1d1ad44E3957`).
- Contracts: `cd contracts && npx hardhat test` (22 passing).

## Stacked prizes

- Universal Accounts Track ($2,500): main submission (UA + 7702 + UX + proof + firewall; cross-chain is the gate).
- Magic bonus ($500): **done** — Google OAuth + email onboarding live (no seed phrase, no extension); session persists across reload. Proven live 2026-06-21.
- Arbitrum bonus ($2,000): **done** — SpendPolicy + ReceiptEmitter deployed on Arbitrum One; the Permission Firewall demo and the default invoice settlement run on Arbitrum. Proven live (MandateCharged `0x33a4e69e...`).
