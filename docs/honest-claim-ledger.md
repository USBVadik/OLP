# Honest Claim Ledger

> Locked 2026-06-21. Pairs with `.kiro/steering/methodology.md` §8.
>
> **Rule:** any claim made publicly (README, pitch deck, demo voiceover, social post, slide,
> tweet, judge Q&A) must have a row here. The row needs a proof artifact and a `last_verified`
> date ≤ 7 days. If stale, re-verify before reusing the claim.
>
> **Risk levels:**
> - `low` — fully on-chain or in our own code, infra-independent.
> - `med` — depends on a single external dependency (Magic, Supabase, Particle SDK build path).
> - `high` — depends on external infra mid-migration / mid-rollout (Particle V2 cross-chain
>   settlement, Circle Gateway).

## How to add a row

1. Define the exact public-facing sentence.
2. Find or create the proof artifact: tx hash + explorer URL, or test file path, or deployed URL.
3. Re-run the proof on today's date; record success.
4. Set `last_verified` to today.
5. Set risk based on dependency surface.

## How to use a row in the demo

- Read the exact sentence verbatim. No paraphrasing during the live demo voiceover.
- If the row is `high` risk, have a pre-recorded backup video for that exact moment.
- If `last_verified` is >7 days old, do not use the claim until re-verified.

## Ledger

| id | claim | proof_artifact | last_verified | risk | notes |
|----|-------|----------------|---------------|------|-------|
| C1 | "SpendPolicy is deployed live on Base mainnet at `0x73C862a8312c12C764487a9a484f1d1ad44E3957`." | https://basescan.org/address/0x73C862a8312c12C764487a9a484f1d1ad44E3957 ; deploy tx `0x63de9403...8a3` | 2026-06-20 | low | from `docs/status.md` |
| C2 | "SpendPolicy is deployed live on Arbitrum One at `0x9782e3724859469fbBAC5085EA8bf8E70724164E`." | https://arbiscan.io/address/0x9782e3724859469fbBAC5085EA8bf8E70724164E | 2026-06-20 | low | from `docs/status.md` |
| C3 | "An over-cap charge attempt is rejected on-chain with `PerChargeExceeded`, no funds move, zero gas spent past simulation." | Hardhat test: `contracts/test/SpendPolicy.test.ts` (over-cap reject) ; live blocked attempts on both chains | 2026-06-20 | low | 22 contract tests pass |
| C4 | "A within-cap MandateCharged transfer (0.10 USDC, payer → merchant) is proven live on Base." | tx `0x4e64eaddd25b3eb65b0d531d3e3237122775c1ca0fcae0497e3b073346334b00` | 2026-06-20 | low | from `docs/status.md` |
| C5 | "A within-cap MandateCharged transfer (0.10 USDC, payer → merchant) is proven live on Arbitrum One." | tx `0x33a4e69e2d4f0a2a9269bf9fb758b3043cbae4c5e146e3e16cf9c75d439b9ced` | 2026-06-20 | low | from `docs/status.md` |
| C6 | "The user's revoke kills future charges (`MandateIsRevoked` reverts subsequent attempts)." | Hardhat test: `contracts/test/SpendPolicy.test.ts` (revoke + non-payer rejection) | 2026-06-20 | low | 22 contract tests pass |
| C7 | "EIP-7702 delegation of the Magic EOA on Base is proven live (delegate contract `0x6640c1CCCaF07Dbe765eC05E294FE427cC92831C`)." | tx `0x4ca63029e2f4fb0824ba63407b28c518fc22c6270b6fc18c258bf2c13c29cef0` | 2026-06-20 | med | depends on Magic + Particle build paths |
| C8 | "End-to-end checkout settles USDC on Arbitrum and anchors a proof receipt on Base." | invoice `70bfbad2-aafa-4a45-a793-d21b1ce64f1c` ; settle tx `0xce43e057...3550b` ; proof tx `0xff365c09...6715e` | 2026-06-20 | med | depends on Particle UA same-chain transfer + Supabase verifier. ✅ 2026-06-21: re-confirmed on the new `createUniversalTransaction` path (C21/Step 3) — a same-chain Base `/pay` (invoice `95d86b74`) settled 0.10 USDC to the merchant: Base settle `0x2f5d80fd…b99166a7` (USDC→merchant = 0.1, status 0x1, RPC-verified), InvoicePaid on Base `0xc7691340…5162a3ce`. Same-chain settlement intact on the unified cross-chain path. |
| C9 | "ReceiptEmitter is deployed on Base at `0x89CF50C01BDb8b47fc8f38AE4dB495FCCC685bC3` and on Arbitrum at `0xe4C6656B6c248B20Bd2C5ddf9168A4531AAbD2A1`." | https://basescan.org/address/0x89CF50C01BDb8b47fc8f38AE4dB495FCCC685bC3 , https://arbiscan.io/address/0xe4C6656B6c248B20Bd2C5ddf9168A4531AAbD2A1 | 2026-06-20 | low | |
| C10 | "22 Hardhat tests cover the SpendPolicy contract: valid charge, per-charge cap, daily cap + reset, total cap, expiry, revoke, non-payer rejection, forged signature, wrong chain, gasless permit." | `contracts/test/SpendPolicy.test.ts` (run: `cd contracts && npx hardhat test`) | 2026-06-20 | low | |
| C11 | "The EIP-712 PaymentMandate type is byte-identical between contract and frontend so the signature validates on-chain." | `contracts/contracts/SpendPolicy.sol` ↔ `src/lib/mandates/types.ts` ↔ `src/lib/contracts/spend-policy.ts` ; verified via the live MandateCharged txs (C4, C5) | 2026-06-20 | low | |
| C12 | "OneLink Pay is positioned as 'on-chain spending limits for the agent era — give your AI a card, not your wallet.'" | `src/app/page.tsx` hero section + `README.md` opening block; spec `pitch-positioning-rewrite` ; typecheck + lint exit 0 ; user visual confirmation pending | 2026-06-21 | low | core public-facing positioning sentence; reusable in pitch deck and demo voiceover |
| C13 | "Sign in with Google in seconds via Magic embedded wallet — no seed phrase, no extension; the session persists across page reload." | spec `magic-social-login` T15 + T17 user-confirmed: full Google OAuth round-trip on `/firewall` produced address `0x53Bd…206a`; reload restored the same logged-in state via `magic.user.isLoggedIn()` auto-detect. typecheck + lint + 29 unit tests green. | 2026-06-21 | med | depends on Magic dashboard config (Google + creds saved) and browser environment; clean Chrome profile recommended for live demo |
| C14 | "Before you sign, OneLink Pay shows the mandate in plain English — merchant, per-charge / daily / total caps, expiry — with the EIP-712 hash available behind a 'Show technical details' disclosure." | `src/components/mandate-card.tsx` ; rendered live on `/firewall` (user paste 2026-06-21 confirmed caps + status render); 25 unit tests for `format.ts` green | 2026-06-21 | low | the "no blind signature" UX moment |
| C15 | "Once armed, a live budget HUD shows remaining today / lifetime as draining gauges plus an expiry countdown, updated from on-chain SpendPolicy state." | `src/components/budget-hud.tsx` + `src/hooks/use-mandate-state.ts` ; user paste 2026-06-21 confirmed HUD renders with on-chain reads (correctly showed 'Cap reached' for an exhausted one_time mandate); drain confirmed live (2.00→1.90 today, 10.00→9.90 lifetime after one 0.10 charge) | 2026-06-21 | low | reads `remaining()` + `getMandateState()` live; polls every 8s |
| C16 | "In the /firewall demo, an agent-initiated charge is enforced on-chain: a within-cap charge settles to the merchant, an over-cap charge is blocked (PerChargeExceeded — no funds moved, zero gas), and after the payer revokes, the next charge reverts (MandateIsRevoked)." | `/firewall` split-screen agent demo (`src/components/agent-terminal.tsx`, `src/lib/agent/*`) ; **proven live on Arbitrum 2026-06-21**: within-cap 0.10 settled + budget drained to 1.90/9.90, over-cap 0.20 BLOCKED PerChargeExceeded, revoke confirmed. 12 unit tests. | 2026-06-21 | low | the centerpiece wow moment. HONESTY: the "agent" is a demo harness — a button that emits agent-voice log lines and calls the SAME relayer + SpendPolicy a real agent would. The on-chain enforcement is 100% real; the autonomy is dramatized. A truly autonomous LLM agent loop is the x402 stretch (E5). |
| C17 | "OneLink Pay exposes an x402 HTTP gateway (`/api/x402/<resource>` returns `402 Payment Required` + payment requirements) whose settlement is enforced by an on-chain spend mandate, so an agent's per-call x402 payments are bounded by per-charge/daily/total caps; over-budget calls are refused before any funds move." | **PROVEN LIVE on Arbitrum 2026-06-21**: armed agent_budget (10 total / 0.10 per call); `market-insight` $0.05 bought via the full x402 handshake (GET→402→charge→retry-with-proof→200 OK with real data; budget drained to 1.95/9.95); `premium-dataset` $0.20 → BLOCKED PerChargeExceeded, no funds moved, resource withheld. 28 unit tests; production build clean. | 2026-06-21 | low | scheme is `onelink-mandate` (NOT Coinbase-facilitator-compatible). Frame as "x402-pattern, mandate-settled". |
| C18 | "OneLink Pay shows the agent's Particle Universal Account balance aggregated across chains (one balance over Base + Arbitrum), surfacing Particle's chain-abstraction superpower; the aggregation is read live via `getPrimaryAssets`." | `src/lib/particle/assets.ts` (11 unit tests) + `src/components/universal-balance-card.tsx` + read-only Particle UA init on `/agent`; production build clean; `/agent` renders the card. | 2026-06-21 | med | READ-ONLY (no tx, no gas). The aggregated balance is real cross-chain; settlement in the demo is same-chain Arbitrum — do NOT claim cross-chain settlement. Depends on Particle `getPrimaryAssets` availability. |
| C19 | "OneLink Pay positions against prior art (Coinbase Spend Permissions, ERC-7715/7710, ZeroDev session keys, Google AP2, x402) as the on-chain revocable spending limit for the x402 agent economy — building on the spend-permission wave, not reinventing it." | landing `AgentEconomySection` + prior-art table (`src/app/page.tsx`) + README "How OneLink compares" with linked sources; `/agent` linked from nav + hero. | 2026-06-21 | low | comparison facts grounded in `docs/RES/*` with sources in README; neutral phrasing ("build on", not "beat"). |
| C20 | "Every completed proof receipt is shareable — a copy-link and a scannable QR point at the public `/receipt/[id]`, where anyone can verify the settlement + InvoicePaid proof on-chain with no account." | `src/lib/receipts/share.ts` (5 unit tests) + server-side QR SVG (`qrcode`) + Share section on `/receipt/[id]` (completed only); build clean. | 2026-06-21 | low | QR/share render only for completed receipts; QR encodes the public URL only (no PII/secrets). Live completed-branch visual pending a completed invoice in the DB. 2026-06-21: added a "How is this verified?" disclosure (trustless settlement vs attested InvoicePaid proof) + concrete matched-leg detail on `/receipt/[id]` + `/success/[id]`; build + typecheck + lint + 110 unit + 22 contract green (closes R8). 2026-06-21: receipt also surfaces a UniversalX cross-chain activity link (`universalx.app/activity/details?id=<UA transactionId>`) for UA/7702 payments — wired on the live `/pay/[id]` success state + `/receipt/[id]`, persisted via `payments.ua_transaction_id` (Supabase migration applied + verified live). Typecheck/lint/build green. 2026-06-21: OBSERVED LIVE — the shareable `/receipt/[id]` completed branch now renders end-to-end with the UniversalX link for the cross-chain `/pay` payment (invoice `7be9118e`, UniversalX `0x0654e9323a0bf7`), after fixing a Next.js data-cache bug (the server-only `supabaseAdmin` client now forces `no-store`, so a just-completed payment shows immediately). Closes C20's pending completed-branch visual. |
| C21 | "A cross-chain USDC payment settles live via a Magic-signed Particle Universal Account in EIP-7702 mode: a merchant is paid 1.0 USDC on Arbitrum with ~0.12 USDC sourced cross-chain from Base in the same operation — no manual bridge." | Arbitrum settlement tx `0x85d8c4c24b75ef404889b44a63e97b9b2ac23d9a341a991f86cd0a4dbf6a4911` (USDC Transfer `0x53Bd…206a`→merchant `0x8C54…Fb7` = 1.0, status 0x1, verified via Arbitrum RPC); Base source tx `0x8b85d45f013f7ef86436b723e00cabebd41cba8f96c5d9ec85ad4e5d757d4a2e` (status 0x1); UniversalX `https://universalx.app/activity/details?id=0x0654e81cfea86a` | 2026-06-21 | med | PROVEN both in the cross-chain proof lab AND end-to-end through the product `/pay` checkout (commit `92b7fe5`, local feature branch): invoice `7be9118e` paid 1.0 USDC to the merchant on Arbitrum sourced 100% cross-chain from Base — Arbitrum settlement `0x41217d8b…c3dd12e1` (USDC→merchant = 1.0, status 0x1, RPC-verified), Base InvoicePaid proof `0x9d66901d…4068359e` (status 0x1), UniversalX `0x0654e9323a0bf7`; `ua_transaction_id` persisted and the UniversalX link renders on both the live receipt and the shareable `/receipt/[id]`. Deployed to prod 2026-06-21 (cross-chain `/pay` live at https://onelink-pay.vercel.app with `NEXT_PUBLIC_PAYMENT_MODE=universal_7702_transfer`; the receipt for invoice `7be9118e` is publicly verifiable there). Same-chain re-confirmed on the same path (see C8). Recipe: `createUniversalTransaction` + `usePrimaryTokens:[USDC]` + per-chain pre-delegation to the V2 delegate (fixes AA24) + single-shot build/sign/send (fixes -32608). Depends on the Particle v2-beta SDK. |

## Claims we are NOT yet allowed to make

These are explicitly off-limits until they get a verified row above. If a draft of any
public-facing artifact contains them, they must be removed before use.

- ⚠️ "OneLink Pay supports cross-chain value movement via the Universal Account." — PROVEN end-to-end
  (C21): a live cross-chain payment to the merchant settled through the product `/pay` checkout on
  v2-beta.3, independently verified on-chain. The old `REFUND_FAILED` / `-32613` / `-32801` failures
  are resolved. As of 2026-06-21 the cross-chain `/pay` is DEPLOYED to prod
  (`NEXT_PUBLIC_PAYMENT_MODE=universal_7702_transfer`, https://onelink-pay.vercel.app) — the
  cross-chain payment's shareable receipt is publicly verifiable live at `/receipt/7be9118e-…`.
  HONESTY: a fresh cross-chain payment THROUGH the prod `/pay` UI has not been re-run (the proof
  was made via the identical code locally, against the same DB + mainnet); a first-time payer needs
  a little native gas per touched chain for the one-time 7702 delegation. Frame the cross-chain
  settlement as Particle Universal Accounts' chain abstraction, which it is.
- ❌ "OneLink Pay integrates Circle Gateway."
  Reason: not yet built. Add row only after a deposit + mint round-trip is observed.
- ❌ "A fully autonomous LLM agent decides and pays on its own in our demo."
  Reason: the `/firewall` demo uses an agent-styled harness (a button that emits agent-voice
  log lines and calls the real charge route) — not an autonomous decision-making loop. The
  on-chain enforcement is real (C16); the autonomy is dramatized. A genuinely autonomous agent
  loop is the x402 stretch (E5). When framing to judges, say "agent-initiated" or "an agent
  calls the same firewall", not "our autonomous agent thinks and pays".

- ❌ "OneLink Pay is Coinbase x402 / facilitator compatible."
  Reason: our gateway uses the x402 HTTP *pattern* with a custom `onelink-mandate` settlement
  scheme, not the canonical EIP-3009 facilitator. The end-to-end live buy IS proven (C17), but
  always frame it as "x402-pattern, mandate-settled" — never "Coinbase x402 facilitator
  compatible".

- ❌ Any superlative ("first," "only," "the leading"). Reason: cannot prove without industry
  survey. Use specific differentiators instead.

## Re-verification cadence

- Before any new public artifact (README, pitch, video): re-verify all rows it cites.
- Weekly until submission week, daily during submission week: spot-check 3 random rows.
- After any external dependency upgrade (Magic SDK, Particle SDK, Hardhat, Solidity, Next.js):
  re-verify rows whose risk is `med` or `high`.

## Change log

| date | change | author |
|------|--------|--------|
| 2026-06-21 | Initial ledger created from `docs/status.md`. | Kiro |
| 2026-06-21 | Added C12 (positioning) when `pitch-positioning-rewrite` shipped. | Kiro |
| 2026-06-21 | Added C13 (Magic Google login) when `magic-social-login` shipped + user-confirmed live. Removed corresponding denylist entry. | Kiro |
| 2026-06-21 | Added C14 (legible mandate card) + C15 (live budget HUD) when `legible-mandate-card` shipped + user-confirmed rendering live. | Kiro |
| 2026-06-21 | Added C16 (agent-on-a-leash demo) when `agent-on-a-leash-demo` shipped + proven live on Arbitrum. Reworded denylist to forbid overclaiming a fully autonomous LLM agent (the demo is an honest agent-styled harness over the real on-chain firewall). | Kiro |
| 2026-06-21 | Added C17 (x402 gateway) as DRAFT when `x402-mandate-gateway` shipped code-complete (route smoke-verified, 30 tests, build clean) — live on-chain buy pending user. Added denylist note: not facilitator-compatible; live buy not yet proven. | Kiro |
| 2026-06-21 | Promoted C17 out of DRAFT → PROVEN: user ran the live x402 buy on Arbitrum ($0.05 delivered, budget drained to 1.95/9.95) + $0.20 over-cap blocked (PerChargeExceeded). Risk lowered med→low. Denylist keeps only the "not facilitator-compatible" caveat. | Kiro |
| 2026-06-21 | Added C18 (Particle unified-balance HUD, read-only) when `particle-unified-balance` shipped: real cross-chain `getPrimaryAssets` aggregation surfaced on `/agent` as the chain-abstraction showcase. | Kiro |
| 2026-06-21 | Added C19 (prior-art positioning) when `landing-narrative-prior-art` shipped: landing links `/agent` + agent-economy section + prior-art table + sponsor strip; README prior-art section with sources. | Kiro |
| 2026-06-21 | Added C20 (shareable proof receipt) when `proof-receipt-polish` shipped: copy-link + server-side QR on completed `/receipt/[id]`. Marked `prior-art-readme` superseded by `landing-narrative-prior-art`. | Kiro |
| 2026-06-21 | Strengthening pass (no new public claims): added an honest "How is this verified?" disclosure to `/receipt/[id]` + `/success/[id]` distinguishing the trustless settlement from the attested InvoicePaid proof (closes R8), plus a Retry affordance + clearer copy on the unified-balance HUD (strengthens R12). Clarify/de-risk only — no capability claim added. Re-verified: typecheck + lint + 110 unit + 22 contract + production build all green. Live on-chain rows (C1–C9, C13) were NOT re-run this pass. | Kiro |
| 2026-06-21 | External-audit hardening pass (no new public claims): bound the proof payer to the on-chain transfer sender in `mark-paid` (R15), added a dedicated relayer-key fallback + in-memory gas budget guard to `/api/mandates/charge` (R16), fixed the dashboard to resolve explorer links/labels per settlement chain (R17), documented the debug-probe deploy flag (R18). Hardening/correctness only — no capability claim added or strengthened; if anything it makes C20's "provable" stricter. Re-verified: typecheck + lint + 110 unit + 22 contract + production build all green. NOT re-run against a live mainnet payment. | Kiro |
| 2026-06-21 | Operator live-verified the wow flow (user-run dry-run): `/firewall` arm → within-cap charge → over-cap BLOCKED → revoke; `/agent` x402 buy + over-cap block; dashboard chain links. R15 confirmed live (payments `payer_address` == on-chain sender); R17 confirmed live (dashboard payment-tx → arbiscan, proof-tx → basescan). Tx hashes still to be pasted into the proof rows for the permanent record. | Kiro |
| 2026-06-21 | Shipped the UniversalX activity link on the proof receipt (commits `3534f0b`, `09d9987`): `getUniversalXActivityUrl` + an optional `universalActivity` prop on `ProofReceiptCard`, captured on the `/pay/[id]` success state and persisted to `payments.ua_transaction_id` for the shareable `/receipt/[id]`. Applied + live-verified the Supabase `ua_transaction_id` migration (Data API returns the column, HTTP 200; was 400 `42703`). Deployed v2 to prod: `@particle-network/universal-account-sdk@2.0.0-beta.3` (the build Particle confirmed real EIP-7702 requires) now live at https://onelink-pay.vercel.app — Vercel build green, 12/12 static, route smoke 200 on `/`, `/demo-replay`, `/success/[id]`, `/receipt/[id]`. HONESTY: the UniversalX link's live render is NOT yet observed (needs a real post-migration 7702 payment); the med-risk live rows C7 + C8 were proven on SDK 1.1.1 and are NOT re-verified on v2 — see R19. | Kiro |
| 2026-06-21 | CROSS-CHAIN PROVEN LIVE (C21): a real cross-chain USDC payment to the merchant settled on Arbitrum funded partly from Base via a Magic-signed Particle UA in 7702 mode on v2-beta.3 — Arbitrum settlement `0x85d8c4c2…4911` (USDC→merchant = 1.0, verified via RPC), Base source `0x8b85d45f…4a2e`, UniversalX `0x0654e81cfea86a`. Recipe: `createUniversalTransaction` + `usePrimaryTokens:[USDC]` + per-chain pre-delegation to the V2 delegate (fixes AA24) + single-shot build/sign/send (fixes -32608). Proven in the cross-chain proof lab; product `/pay` wiring is the next step. Softened the cross-chain denylist entry accordingly. | Kiro |
| 2026-06-21 | Step 3 — cross-chain wired into the PRODUCT `/pay` (commit `92b7fe5`) + proven live end-to-end: the 7702 checkout now builds via `createUniversalTransaction` + `usePrimaryTokens:[USDC]` and pre-delegates every routed chain. Invoice `7be9118e` settled cross-chain (100% from Base → merchant on Arbitrum `0x41217d8b…c3dd12e1`), InvoicePaid on Base `0x9d66901d…4068359e`, UniversalX `0x0654e9323a0bf7` — RPC-verified; the UniversalX link renders on the live receipt AND the shareable `/receipt`. Fixed a Next.js data-cache bug: the server-only `supabaseAdmin` now forces `no-store` so `/receipt` reflects a just-completed payment (closes C20's pending completed-branch). C21 upgraded lab→product. NOT deployed to prod; the 7702 same-chain path also moved to `createUniversalTransaction` (re-confirm C8). | Kiro |
| 2026-06-21 | Same-chain re-confirmed on the new path (closes the C8 caveat): a Base `/pay` (invoice `95d86b74`, 0.10 USDC) settled same-chain via `createUniversalTransaction` (`touchedChains: [8453]`) — Base settle `0x2f5d80fd…b99166a7` (USDC→merchant = 0.1, status 0x1, RPC-verified), InvoicePaid on Base `0xc7691340…5162a3ce`, UniversalX `0x0654e9876715d6`. Both same-chain (Base) and cross-chain (Base→Arbitrum) now proven on the unified `/pay` path. | Kiro |
| 2026-06-21 | Step 3 cross-chain DEPLOYED to prod: set `NEXT_PUBLIC_PAYMENT_MODE=universal_7702_transfer` on Vercel + `--force` redeploy of the feature-branch code (SDK 2.0.0-beta.3, build green, 12/12, `Aliased https://onelink-pay.vercel.app`). Smoke 200 on `/`, `/demo-replay`, `/agent`; the cross-chain payment's shareable receipt (invoice `7be9118e`) renders the completed proof + UniversalX link on the live prod URL (`/receipt/7be9118e…`). HONESTY: a fresh payment through the prod `/pay` UI not re-run (identical code, proven locally); first-time payer needs native gas per chain for the one-time delegation. | Kiro |
| 2026-06-21 | Polish — cross-chain made VISIBLE on the proof receipt + deployed to prod (commit `174193d`): gold "Cross-chain: Base → Arbitrum" chip + "funded from Base … no manual bridge" line on the live success AND shareable `/receipt`; `mark-paid` now records the TRUE funding source in `source_chain_id` (was the settlement chain), no migration. Verified live end-to-end (invoice `40027dcf`): Arbitrum settle `0x8163be21…9f966464` (USDC→merchant = 1.0, RPC-verified), Base proof `0x2fba4854…63fd7055`, UniversalX `0x0654ea35e34844`, `source_chain_id=8453`; prod `/receipt/40027dcf` renders the badge (smoke-verified). | Kiro |

## Risks closed (kept for trace)

(see `docs/risk-register.md` — R2, R3, R7, R8, R15, R17 closed 2026-06-21; R16, R18 in_progress; R19 (beta Particle SDK live in prod) open)
