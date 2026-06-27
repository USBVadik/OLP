# OneLink Pay — Demo Runbook

Last updated: 2026-06-26

The definitive "what to show and say" for judges. Reflects the current build — Arbitrum-first, with
cross-chain settlement via the Particle Universal Account (prod mode `universal_7702_transfer`),
deployed live at onelink-pay.vercel.app.

## Pitch card (rehearse this — 60–90s)

**Hook (10s):** "You can't hand an AI your wallet. OneLink Pay gives it a *card* instead — a spending limit enforced on-chain, not on trust."

**90-second beats:**
1. Magic login (no seed phrase) → Particle Universal Account in EIP-7702 mode.
2. Read the mandate card aloud: `$0.10/charge`, `$2/day`, one merchant, expires today, revocable.
3. **Send the agent** → it buys within budget (`402 → pay → 200`); the Budget HUD drains.
4. It tries an over-cap buy → **BLOCKED on-chain**: "no funds moved, zero gas."
5. Cross-chain: the merchant is paid on Arbitrum with USDC sourced from Base — no manual bridge.
6. Open the public proof receipt → anyone verifies on a block explorer. **Revoke** → agent disarmed.

**Must-say honesty lines:** x402 *pattern* (`onelink-mandate`, not the Coinbase facilitator) · the agent is an *unattended deterministic* loop, **not** LLM-driven · **gas abstraction** is real (the network fee is paid in USDC, no destination-chain gas) but **no gas sponsorship** is claimed (a first-time 7702 delegation needs a little native gas).

**Skeptic Q&A (rehearse):**
- *"Is this really x402?"* → "The pattern — 402 → pay → retry-with-proof — settled by our on-chain mandate, not the Coinbase facilitator. Enforcement is real; wire-compat isn't claimed."
- *"Is the agent autonomous?"* → "Unattended, one click — but deterministic, not an LLM. We don't claim AI reasoning; the on-chain limit is fully real."
- *"What does 'zero gas' mean?"* → "Over-cap charges revert in simulation, before broadcast — no funds move and no gas is spent on the blocked attempt."
- *"Is cross-chain real?"* → "Proven live + on-chain — here are the tx hashes and the UniversalX link. A first-time payer needs a little native gas per chain for the one-time delegation."
- *"Didn't you reinvent spend limits?"* → "The primitive isn't new — here's the prior-art table. Our wedge is the packaging: an on-chain revocable mandate bound to x402, via a UA/7702 account, with a public receipt."

## One-liner

OneLink Pay is the consent + proof layer for Universal Accounts: see exactly what you authorize, have it enforced on-chain by EIP-7702, and get a verifiable receipt. The safety rails the agentic-payments era needs.

## Thesis (why this wins, not "another checkout")

Three 2026 rails are converging:

- **x402** (Coinbase) gives AI agents a way to pay over HTTP in USDC (now wired into AWS CloudFront).
- **AP2** (Google, donated to FIDO) defines signed "mandates" — scoped permission for agents — but as off-chain Verifiable Credentials.
- **EIP-7702** is the delegation mechanism that upgrades an EOA in place, and its #1 documented risk is drainer phishing (signing a delegation to malicious code).

The missing piece: nothing enforces the mandate **on-chain at the user's account**. OneLink Pay fills that gap — sign one scoped mandate, the Universal Account can be charged only inside it, everything else reverts, and the user can revoke instantly. It is the on-chain guardrail that makes agentic, cross-chain payments safe.

Positioning: **Particle handles execution. OneLink Pay handles consent, proof, and payment safety.**

## What is live and proven

- **Magic email / Google login -> Particle UA in EIP-7702 mode.** EOA delegated in place (same address), across Base + Arbitrum + Optimism.
- **Permission Firewall — real on-chain enforcement (live on Base and Arbitrum).** `SpendPolicy` enforces per-charge / daily / total caps + expiry + merchant-only recipient + revoke. Off-scope or over-cap charges revert.
- **Cross-chain settlement via the Universal Account (C21).** USDC sourced from Base, settled to the merchant on Arbitrum in one operation — no manual bridge. Proven live + deployed.
- **Autonomous agent on a leash.** One-click unattended run buys within the mandate and is halted by the firewall on the over-cap call (deterministic — not LLM-driven).
- **Proof Receipt.** A verified -> matched -> recorded trail, shareable at `/receipt/[id]`; anyone can verify on a block explorer.
- **InvoicePaid proof** anchored on Base via `ReceiptEmitter`.

## Live demo (~2 minutes, two acts)

Two wows, two flows. **Act 1** = the chain-abstraction magic (cross-chain checkout). **Act 2** = the
agent on a leash. Both are live on Arbitrum + Base; keep amounts tiny.

### Act 1 — Cross-chain checkout: one balance, any chain (UX 40% + UA 30%) — `/pay/<id>`

1. **Hook:** "You can't hand an AI — or a merchant — your wallet."
2. Open `/pay/<id>`. **Continue with Google** (Magic) — no seed phrase, no extension, no chain
   selector. Logged in within seconds.
3. **Trust Preview, before signing:** the card shows the *planned* route — **Base → Arbitrum, no
   manual bridge**, the network fee paid in USDC — and the exact amount the merchant receives.
   Consent you can read, not a blind signature (EIP-712 hash behind "Show technical details").
4. **Confirm.** The Universal Account sources USDC cross-chain and settles to the merchant on
   Arbitrum in one operation.
5. **Proof Receipt:** open the public `/receipt/<id>` — "Cross-chain: Base → Arbitrum" badge, the
   animated route, per-chain explorer links, the UniversalX activity link, and the InvoicePaid
   attestation. Verifiable by anyone, no account.

Talk track: "Particle's Universal Account is one balance across 15 chains — the user never bridges,
never picks a network, never holds gas on the settlement chain. We make that visible and provable."

### Act 2 — The agent on a leash (the thesis) — `/agent`

6. (Still signed in.) The **Universal Account balance** shows one balance across 15 named chains
   (Base, Arbitrum, Solana, BNB Chain, Avalanche, …) — Particle's superpower, made visible.
7. **Mandate Card** — read it aloud: `$0.10 / charge`, `$2 / day`, `$10 total`, **one merchant**,
   **expires today**, **revocable anytime**. "If a charge breaks any limit it reverts on-chain —
   you pay nothing." **Arm** it (one signature + one approve). The Budget HUD lights up
   2.00/2.00 today, 10.00/10.00 lifetime.
8. **Send the agent (autonomous run).** One click. The terminal narrates the real x402 handshake —
   it buys **Market insight ($0.05)** then **Live sentiment ($0.08)** (`402 → pay within mandate →
   200 OK`), and the **Budget HUD drains** with each purchase.
9. It then reaches **Premium dataset ($0.20)** — over the $0.10 per-charge cap. **BLOCKED: over the
   per-charge cap. No funds moved, zero gas.** The agent halts itself ("I cannot exceed the
   mandate"); the HUD flashes **Firewall held · budget untouched** — the bars do NOT move.
10. **Revoke** → "Mandate revoked. Agent disarmed." Run again → `BLOCKED: MandateIsRevoked`. 7702
    reversibility as a safety feature.

Proven live on Arbitrum (2026-06-21): autonomous run bought 0.05 + 0.08, over-cap 0.20 blocked
(`PerChargeExceeded`), HUD drained to 1.87/9.87, revoke confirmed.

Talk track: "x402 gives an agent a wallet; OneLink is the leash. The agent runs unattended and
makes its own purchases — but the on-chain firewall is the hard limit. Even a buggy or
prompt-injected agent physically cannot exceed what you signed."

**Honesty lines (say them):** the agent is a real **unattended deterministic** loop — **not**
LLM-driven, so no AI reasoning is claimed. The x402 flow is the *pattern* settled by our
`onelink-mandate` scheme — **not** the Coinbase facilitator. **Gas abstraction** is real — the
network fee is paid in USDC from the UA, no destination-chain gas to hold. **No gas *sponsorship***
is claimed (the account is paymaster-compatible, but no paymaster covers the fee); a first-time
7702 delegation needs a little native gas per chain (we pre-delegate before the demo).

*(Alternative scripted version of the same beat lives at `/firewall` — preset scenarios instead of
the one-click autonomous run.)*

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

Cross-chain (C21 — Base -> Arbitrum, no manual bridge):

- Arbitrum settlement: `0x85d8c4c24b75ef404889b44a63e97b9b2ac23d9a341a991f86cd0a4dbf6a4911`
- Base source: `0x8b85d45f013f7ef86436b723e00cabebd41cba8f96c5d9ec85ad4e5d757d4a2e`
- UniversalX activity: `https://universalx.app/activity/details?id=0x0654e81cfea86a`
- Product receipt (invoice `40027dcf`): `/receipt/40027dcf-f45e-4991-a215-553dfb71d0e3` (Arbitrum settle `0x8163be21…f966464`, Base proof `0x2fba4854…63fd7055`)
- Full evidence: `docs/proof-pack.md`

Accounts:

- Payer / UA owner: `0x53Bd615635Af778e5E460d5EEC2d6b234693206a`
- Merchant: `0x8C54783849A2C042544efc37c4657Ee98a411Fb7`

## Judging-criteria map

- **UX excellence (40%):** email onboarding; legible consent vs blind signature; live agent budget; visceral "overcharge blocked"; one-tap revoke; shareable proof receipt.
- **Universal Accounts + EIP-7702 (30%):** UA in 7702 mode; same address delegated across 3 chains; account-level mandate enforcement; directly addresses the documented 7702 drainer risk.
- **Adoption potential (20%):** plugs into the real agentic economy (x402 + AWS, AP2 + Google/FIDO); concrete markets in subscriptions and AI-agent spending.
- **Technical quality / polish (10%):** SpendPolicy covered by 22 passing tests; typed end to end; EIP-712 mandate byte-identical between contract and frontend.

## Honest status (state this plainly)

- **Live and proven:** EIP-7702 delegation; on-chain mandate enforcement (per-charge / daily /
  total / expiry / merchant / revoke); the **autonomous agent on a leash**; on-chain proof receipts;
  **gas abstraction** (the network fee is paid in USDC, no destination-chain gas to hold); and
  **cross-chain value movement via the Universal Account (C21)** — a merchant paid on Arbitrum
  with USDC sourced from Base in one operation, no manual bridge (proven live + deployed).
- **Honest framing:** the x402 flow is the *pattern* (`onelink-mandate` scheme, not the Coinbase
  facilitator); the agent is an *unattended deterministic* loop (not LLM-driven); prod runs a
  pinned Particle **beta** SDK (`2.0.0-beta.3`).
- **Not claimed:** gas sponsorship; AI/LLM agent reasoning; Circle / ZeroDev / Openfort integration.

## Run locally

- App: `corepack pnpm dev` (mode `universal_7702_transfer`).
- Firewall demo requires `NEXT_PUBLIC_SPEND_POLICY_ADDRESS` set (deployed: `0x73C862a8312c12C764487a9a484f1d1ad44E3957`).
- Contracts: `cd contracts && npx hardhat test` (22 passing).

## Stacked prizes

- Universal Accounts Track (main submission): UA + 7702 + UX + proof + firewall + **cross-chain (C21)**. (Confirm the exact Particle prize tier from the official rules — reports disagree, so don't quote a number.)
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
- [ ] Demo machine on the latest pushed commit: `git rev-parse --short HEAD` ≥ `15df7c1`.
- [ ] `.env.local` populated: Magic key, Particle project/client/app ids, `NEXT_PUBLIC_SPEND_POLICY_ADDRESS_ARBITRUM`, `RECEIPT_EMITTER_OWNER_PRIVATE_KEY`, Arbitrum RPC.
- [ ] Demo wallet `0x53Bd…206a` funded: a little USDC on **Arbitrum** + a little ETH on Arbitrum (relayer/owner gas) and on Base (proof gas).
- [ ] If serving a **deployed** build (not localhost): that build was built with `NEXT_PUBLIC_ENABLE_DEBUG_PROBES=false` (R18). Confirm `/debug/*` shows the "disabled" stub.
- [ ] `corepack pnpm dev` up; `/`, `/pay/<id>`, `/firewall`, `/agent`, `/dashboard` load with no console errors.

### 1. Act 1 — cross-chain checkout + proof receipt (verifies C8 / C20 / C21 + **R15**)

- [ ] Open `/pay/<id>` (a Base-funded → Arbitrum-settled link), Continue with Google. **Before signing**, the Trust Preview shows the **Base → Arbitrum** route + fee in USDC. Pay. **Record the settlement tx hash** (Arbitrum).
- [ ] Open `/receipt/<id>`: **"Cross-chain: Base → Arbitrum" badge** + animated route + UniversalX link present; "How is this verified?" disclosure reads correctly; payment-tx link → **arbiscan.io** (resolves), proof-tx (InvoicePaid) link → **basescan.org** (resolves). **Record the proof tx hash.**
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

### 4. Act 2 — `/agent` autonomous run (verifies C16 / C17)

- [ ] Login + Arm; the Universal Account balance shows one balance across **15 named chains** (Base, Arbitrum, Solana, …) — or "Balance unavailable … Retry" (R12). Demo proceeds either way.
- [ ] Click **Send the agent (autonomous run)** → it buys Market insight ($0.05) then Live sentiment ($0.08) (`402 → Paying… → 200 OK`), HUD drains 2.00 → 1.87.
- [ ] It reaches Premium dataset ($0.20, over cap) → `BLOCKED: over the per-charge cap. No funds moved, zero gas.` → agent halts; **no new tx** on arbiscan for that attempt.
- [ ] (optional) Revoke on `/firewall` → re-run → `MandateIsRevoked`.

### 5. Record the results

- [ ] In `docs/honest-claim-ledger.md`, bump `last_verified` for the rows just proven live (C8/C16/C17/C20) and move R15/R17 from "build-verified" to "live-verified" in `docs/risk-register.md`, pasting the new tx hashes.
- [ ] Save the recording as the R4 backup video, labeled "replay".

### Fallbacks (R4)

- [ ] If Arbitrum RPC / Magic / Particle flakes mid-run: cut to the pre-recorded backup. The on-chain proofs above are independently verifiable on arbiscan/basescan regardless of the live app.
