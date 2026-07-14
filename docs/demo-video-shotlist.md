# Demo Video Shot List

> Recording plan for the final judge video. This is the click-and-screen storyboard, not the
> voiceover. Target length: **1:45-2:10**. Hard cap: 2:30.
> Read it alongside `docs/demo-video-voiceover.md`, which contains the timed final narration.
>
> Judging weights served: UX 40 · Universal Accounts + EIP-7702 30 · adoption 20 · polish 10.
> Golden rule: **show useful work, the hard block, and the proof. Do not tour the app.**

## Pre-flight

- [ ] Use a clean browser profile without extensions. Window 1280-1440 px; zoom 110-125%.
- [ ] Record the production build at `https://onelink-pay.vercel.app`.
- [ ] Re-run the full Magic Google OAuth round-trip in that clean profile before recording. C13 is a
      live dependency; seeing the button is not enough. Never show the email address or OTP in the cut.
- [ ] Confirm the Research Agent payer has **less than 2 USDC on Arbitrum**, enough USDC on Base
      for the missing balance + Particle fee, and the relayer has enough Arbitrum ETH. The normal
      task spends `0.13 USDC`, so a completed rehearsal naturally leaves the card at `1.87 USDC`
      and primes the next Base -> Arbitrum top-up.
- [ ] Open `/agent` and sign in with Magic, but do **not** arm before recording. Wait for the live
      preview to say **Live cross-chain funding**, show Base as a source, Arbitrum as destination,
      and expose the CTA **Fund live cross-chain & arm agent**. If the preview is same-chain, stop;
      never narrate it as cross-chain.
- [ ] Pre-open these tabs: `/` · `/agent` (signed in, live funding preview ready) · `/try`.
- [ ] Run the exact click path once silently. If any external dependency is unstable, record the
      existing verified state and use the canonical receipt rather than sending another payment.
- [ ] Treat revoke as a one-take state mutation: record it last, or capture it as a separate shot.
      Re-arm a fresh mandate before another take; never pretend a previous revoke is live.
- [ ] Mention Pro key export only if Magic's reveal flow is manually re-verified that day; otherwise
      leave C22 out of the main cut.

## Primary 115-second cut

### 1. Promise (0:00-0:08) · `/`

- Hold on **"Give your AI a card. Not your wallet."**
- Let the supporting line sit for one beat.
- Click the Research Agent CTA.

Voiceover intent: "Autonomous software needs purchasing power, not unrestricted wallet access."

### 2. Permission + live Particle route (0:08-0:28) · `/agent` signed in

- Show the mission: prepare an ETH market-risk brief.
- Point to the signed limits: `0.10 USDC/tool`, `2 USDC/day`, one merchant, expiry, revoke.
- Hold on **Live cross-chain funding**: Base source, Arbitrum destination, fee in USDC.
- Click **Fund live cross-chain & arm agent** and complete the Magic confirmations.
- Keep addresses, hashes, and x402 details closed.

Voiceover intent: "I give this workflow a card it cannot exceed. Particle now tops that card up
from my Base balance and makes the budget available on Arbitrum — no bridge or chain picker."

### 3. Live cross-chain proof (0:28-0:45) · `/agent`

- Keep the status progression visible while Particle settles; trim only dead waiting time.
- Hold on **Daily card budget is ready on Arbitrum** and the verified Base -> Arbitrum route.
- Click **Open Particle explorer** once. Let the activity id and `FINISHED` state remain visible for
  a beat, then return to OneLink.

Voiceover intent: "The live Particle activity is finished and server-verified. This button opens
Particle's own explorer, not a screenshot or a OneLink-only claim."

### 4. Useful work and hard refusal (0:45-1:18) · `/agent`

- Click **Run task with my budget** once.
- Let Market insight (`0.05`) and Live sentiment (`0.08`) settle.
- Hold on the **Brief ready** result. Point to `0.13 spent`, `0.20 protected`, and the readable brief.
- Point to the blocked premium export: attempted `0.20`, signed cap `0.10`, no settlement.
- Do not open raw logs unless the judge explicitly asks.

Voiceover intent: "It buys the two inputs it needs and produces the brief. Then a buggy premium
export asks for twenty cents. The contract refuses it before settlement. Useful work completed;
unexpected spend prevented."

### 5. Kill switch (1:18-1:31) · `/agent`

- Click **Revoke budget** and confirm through Magic.
- Hold on the revoked confirmation and disabled run action.
- If recording without another mainnet action, use the already verified RC2 revoke state/video and
  show its Arbiscan link instead. Never imply a replay is a fresh transaction.

Voiceover intent: "And the authority remains mine. One revoke disarms the budget on-chain."

### 6. Unified outcome proof (1:31-1:47) · `/agent`

- Return to the completed task outcome.
- Show the Particle Network proof near the top, the `0.13 USDC` useful spend, the `0.20 USDC`
  protected spend, and the Arbiscan links for the two separate tool purchases.
- Keep the distinction visible: Particle proves the cross-chain card funding; each tool purchase
  settled separately on Arbitrum under SpendPolicy.

Voiceover intent: "Particle handled the cross-chain funding on my own EIP-7702 account. OneLink
then enforced every tool purchase and kept each proof independently inspectable."

### 7. Close (1:47-1:58) · outcome or `/`

- Finish on the product name or verified receipt.

Closing line: "Particle handles the rails. OneLink gives autonomous payments consent, limits, and
proof."

## Optional inserts

- **Walletless judge action (`/try`, 10-15s):** one tap triggers the real Arbitrum
  `PerChargeExceeded` simulation with no login, no wallet, no funds moved, and no gas. Use as a
  leave-behind or when the live agent run is unavailable, not in addition to every other flow.
- **Magic onboarding (8-12s):** include only if a clean OAuth capture helps the Magic bonus. Show
  email/Google login and the same EOA; do not show OTP codes.
- **Verified contract (5-8s):** one quick Arbiscan `Contract / Code` shot if the audience is
  technical. Never replace the useful result with Solidity on screen.

## Fallback hierarchy

1. Agent run works: use the primary cut.
2. Agent provider/relayer is slow: open `/demo-replay` and show the verified Research Agent result,
   transaction links, policy refusal, and revoke proof, clearly labelled as an earlier live run.
3. Magic is slow: use `/try` for the interactive block and the canonical receipt for cross-chain
   proof.
4. Never open `/debug/*`, expose raw secrets, or send a replacement transaction merely to rescue a
   recording.

## Claim discipline

- Say **x402 pattern, settled by our on-chain mandate**, not Coinbase-facilitator compatible.
- Say **unattended deterministic workflow**, not LLM reasoning.
- Say the two research resources are deterministic demo fixtures; the payments and enforcement are
  real.
- Say the Research Agent purchases settle on Arbitrum and are **not** themselves cross-chain. The
  live Particle activity shown during card funding is the Base -> Arbitrum cross-chain proof.
- Say the one-time EIP-7702 delegation is sponsored, not that every transaction has a general gas
  paymaster.
- Say no private key or unrestricted signing authority is shared with the workflow. Do not imply
  that no token allowance exists.

## After recording

Write down each visible time range and action. Trim dead waits, OTP entry, wallet modals, repeated
explorer loading, and technical accordions. The finished video should make a judge repeat this in
one sentence: **"The workflow completed the task, could not overspend, and the payment is provable."**
