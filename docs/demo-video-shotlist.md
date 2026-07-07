# Demo Video — Shot List (what to click & show)

> The RECORDING plan for the Checkpoint-3 demo video. This is the "what to do on screen"
> storyboard — NOT the voiceover. Record following this, then send me a second-by-second note of
> what was on screen at each moment and I'll write the narration to match.
>
> Target length: **~2:30** (hard cap 3:00). It compresses to a 90-sec cut by keeping segments
> 0–2 + 4 and dropping 3.
> Judging weights to serve: UX 40 · Universal Accounts + EIP-7702 30 · adoption 20 · polish 10.
> Golden rule: **lead with the block moment, not the plumbing.**

## Pre-flight (do BEFORE hitting record — so nothing flakes)

- [ ] Clean Chrome profile, **no extensions / no ad-block** (R7). Window ~1280–1440 wide; browser
      zoom ~110–125% so text is legible in the recording.
- [ ] Serving the **prod** build (onelink-pay.vercel.app) with `NEXT_PUBLIC_ENABLE_DEBUG_PROBES=false`.
- [ ] Demo wallet ready: payer `0x53Bd…206a` holds a little **USDC on Arbitrum** (≥ ~0.5 for a live
      charge) and the relayer `0x0AC0…9f41` has a little **ETH on Arbitrum** for gas.
- [ ] **Pre-arm the firewall mandate** on `/firewall` (log in with Magic + arm the "agent budget"
      preset) so Segment 2 opens ALREADY armed — do NOT record the arming.
- [ ] Tabs pre-opened (so cuts are clean): `/` · `/try` · `/firewall` (armed) ·
      `/receipt/fc5adc83-3b17-4004-8902-a5a40a178dd5` · the SpendPolicy Basescan #code page.
- [ ] Do one silent dry-run of the whole click path first.

## Shot list

### Segment 0 — Hook (0:00–0:10) · screen: `/`
- Land on the homepage. Let the H1 **"Give your AI a card. Not your wallet."** + the tagline
  ("Trust before you pay. Proof after it settles.") sit for a beat.
- Move the cursor to the primary CTA **"Watch an AI get blocked — no wallet."** (don't click yet —
  this sets up the payoff).
- *Emphasis:* one clear promise in the first 10 seconds.

### Segment 1 — The walletless BLOCK moment (0:10–0:35) · screen: `/try`
- Click the primary CTA → `/try`. Point out: **no wallet, no login.**
- Tap the block button once. Show the result: **"Blocked on-chain · PerChargeExceeded · No funds
  moved · Zero gas."**
- *Emphasis (the 10-sec wow):* an over-spend hit a real on-chain contract (the live Arbitrum
  `SpendPolicy`) and was refused — money never moved. A judge can do this themselves.

### Segment 2 — Permission Firewall / agent on a leash (0:35–1:20) · screen: `/firewall` (pre-armed)
- Open `/firewall` — already armed. Read the **Permission Receipt** card aloud with the cursor:
  merchant (one recipient), **per action 0.10**, daily/total caps, expires, revocable.
- Click **Run agent (within budget)** → a charge settles; the **Budget HUD drains**; a "view tx"
  link appears. (Real USDC moved inside the limit.)
- Click **Run agent (over cap → blocked)** → **"BLOCKED: over the per-charge cap — attempted 0.20
  USDC, cap 0.10 USDC. No funds moved, zero gas."** + the "Firewall held" beat.
- Click **Revoke permission** → then click a charge again → **"BLOCKED: mandate revoked."**
  (The kill switch is yours — 7702 reversibility.)
- *Emphasis:* the limit is enforced on-chain, on your own account; even the same button that just
  paid can't move a cent after revoke.

### Segment 3 — Cross-chain checkout (OPTIONAL, 1:20–1:55) · screen: `/pay/<fresh-id>`
> Riskiest live beat (login + settlement). Only record it if it ran clean in the dry-run. If not,
> SKIP straight to Segment 4 — the verified receipt is the same proof, safer.
- Open a **fresh unpaid** `/pay/<id>` (create one in `/dashboard` beforehand). **Continue with
  Google** (Magic) — no seed phrase, no chain picker.
- Show the **Trust Preview**: You pay / Merchant receives / **Base → Arbitrum** route / fee in USDC
  / no manual bridge.
- One tap **Pay** → it settles.
- *Emphasis:* one balance, cross-chain, no bridge — Particle UA in EIP-7702 mode.

### Segment 4 — Proof Receipt + verified contract (1:55–2:25) · screens: `/receipt/fc5adc83…` then Basescan
- Open `/receipt/fc5adc83-3b17-4004-8902-a5a40a178dd5`. Show the verified certificate: amount,
  merchant, **payment tx** (Arbiscan), **proof tx / InvoicePaid** (Basescan), the **Base → Arbitrum**
  cross-chain badge + route, UniversalX link, "verified by Particle activity."
- Click the payment-tx link once → it resolves on Arbiscan (real, re-checkable).
- Cut to the **SpendPolicy on Basescan `#code`** tab → "the enforcement contract is verified — read
  it yourself."
- *Emphasis:* anyone can verify, no account; the contract is public.

### Segment 5 — Close (2:25–2:40) · screen: `/` or `/trust`
- Back to the homepage (or a glimpse of `/trust`).
- *Emphasis / the closing line:* "Particle makes execution chain-abstracted; OneLink makes consent
  visible, limits enforceable, and every settlement provable."

## Fallbacks (if something flakes mid-record — R4)
- Magic/Particle/RPC hiccup on `/pay` → skip Segment 3, use the verified `fc5adc83` receipt as the
  cross-chain proof (Segment 4).
- Live charge on `/firewall` slow → the pre-armed state + the over-cap BLOCK + revoke still tell the
  whole story without a settled charge; or fall back to `/demo-replay` (a labeled replay).
- Never show `/debug/*` (probes are off in prod anyway).

## Honesty while narrating (keep these true — denylist)
- Say "x402 **pattern**, settled by our on-chain mandate" — never "x402 facilitator-compatible."
- Say the agent is "**unattended, deterministic**" — never "AI/LLM agent."
- Say gas sponsorship is "the one-time **7702 delegation**" — never "a general gas paymaster."
- Cross-chain is "**Base → Arbitrum**" (supported chains) — never "any/every chain."
- "We build on the spend-permission wave (ERC-7715, Coinbase, MetaMask)" — never "we invented it."

## After you record
Send me, per beat: the on-screen timestamp range + exactly which screen/action was showing (e.g.
"0:12–0:34 — /try, tapped block, 'Blocked on-chain' visible"). I'll write tight voiceover text
matched to your real timings.
