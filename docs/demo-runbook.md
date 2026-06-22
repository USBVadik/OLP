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

## Live dry-run verification checklist (operator — before judging)

> Purpose: run the wow flow end-to-end on the **live build** and confirm the build-verified
> hardening holds against a real on-chain payment — specifically R15 (proof payer = on-chain
> sender) and R17 (dashboard explorer links resolve to the correct chain), which were only
> build/test-verified. Tick each box and capture the tx hashes noted. Recording this run doubles
> as the R4 backup video.

### 0. Pre-flight

- [ ] Clean Chrome profile, no ad-block / extensions (R7).
- [ ] Demo machine on the latest pushed commit: `git rev-parse --short HEAD` ≥ `5b5cf09`.
- [ ] `.env.local` populated: Magic key, Particle project/client/app ids, `NEXT_PUBLIC_SPEND_POLICY_ADDRESS_ARBITRUM`, `RECEIPT_EMITTER_OWNER_PRIVATE_KEY`, Arbitrum RPC.
- [ ] Demo wallet `0x53Bd…206a` funded: a little USDC on **Arbitrum** + a little ETH on Arbitrum (relayer/owner gas) and on Base (proof gas).
- [ ] If serving a **deployed** build (not localhost): that build was built with `NEXT_PUBLIC_ENABLE_DEBUG_PROBES=false` (R18). Confirm `/debug/*` shows the "disabled" stub.
- [ ] `corepack pnpm dev` up; `/`, `/pay/<id>`, `/firewall`, `/agent`, `/dashboard` load with no console errors.

### 1. Part A — checkout + proof receipt (verifies C8 / C20 + **R15**)

- [ ] Open `/pay/<id>` (a fresh Arbitrum-settled link), Continue with Google, pay the invoice. **Record the payment tx hash** (settles on Arbitrum).
- [ ] Open `/receipt/<id>`: shows verified → matched → recorded; "How is this verified?" disclosure reads correctly; payment-tx link → **arbiscan.io** (resolves), proof-tx (InvoicePaid) link → **basescan.org** (resolves). **Record the proof tx hash.**
- [ ] **R15 check (recorded value):** open `/api/payments?merchantId=<merchant>` and confirm `payer_address` equals the on-chain `Transfer.from` of the payment tx (arbiscan). Note: the explorer can't show the fix on a happy path — `payer` is an `indexed` field (raw hex in Topics, and ReceiptEmitter isn't verified on basescan), and an honest payment records the correct payer either way. The fix only matters against a tampered `payerAddress`; to actually demonstrate it, run the optional adversarial check below.
- [ ] **R15 proof (optional, adversarial):** for a fresh invoice, POST mark-paid with a real matching `txHash` but a bogus `payerAddress` → confirm the stored `payer_address` is still the real sender. This is the only check that proves the fix rather than just showing the value.

### 2. Dashboard — chain-correctness (verifies **R17**)

- [ ] `/dashboard` → enter the merchant address → find the completed link from step 1.
- [ ] Per-link label reads "on **Arbitrum**" (not "on Base"); header chip reads "proof anchor **Base**".
- [ ] "Payment transaction" link → **arbiscan.io** and resolves to the USDC transfer; "Proof transaction" link → **basescan.org** and resolves. (Pre-fix these both pointed at basescan — this is R17 live.)

### 3. Part B — `/firewall` wow (verifies C14 / C15 / C16)

- [ ] Google login → address `0x53Bd…206a` shows (C13).
- [ ] Arm "Agent budget" preset (one sign + one approve); Budget HUD: 2.00/2.00 day, 10.00/10.00 total, expiry ~24h.
- [ ] Run within budget → `[FIREWALL] Charged 0.10. Settled to merchant.`; HUD drains 2.00 → 1.90; "view tx" → arbiscan resolves. **Record the MandateCharged tx hash.**
- [ ] Run over cap (0.20) → `[FIREWALL] BLOCKED: PerChargeExceeded. No funds moved, zero gas.` — confirm **no new tx** appears on arbiscan for that attempt.
- [ ] Revoke → `Mandate revoked`; run again → `BLOCKED: MandateIsRevoked`.
- [ ] (optional a11y) with VoiceOver/NVDA on, the "BLOCKED" line is announced aloud (aria-live fix).

### 4. Part C — `/agent` x402 (verifies C17)

- [ ] Login + Arm; Unified Balance HUD shows a real cross-chain balance — or "Balance unavailable — the rest of the demo still works" with **Retry** recovering it (R12). Demo proceeds either way.
- [ ] Buy Market insight ($0.05) → `402 → Paying… → Charged 0.05 → 200 OK`, JSON appears; HUD drains.
- [ ] Buy Premium dataset ($0.20, over cap) → `402 → BLOCKED: PerChargeExceeded` → resource withheld.

### 5. Record the results

- [ ] In `docs/honest-claim-ledger.md`, bump `last_verified` for the rows just proven live (C8/C16/C17/C20) and move R15/R17 from "build-verified" to "live-verified" in `docs/risk-register.md`, pasting the new tx hashes.
- [ ] Save the recording as the R4 backup video, labeled "replay".

### Fallbacks (R4)

- [ ] If Arbitrum RPC / Magic / Particle flakes mid-run: cut to the pre-recorded backup. The on-chain proofs above are independently verifiable on arbiscan/basescan regardless of the live app.
