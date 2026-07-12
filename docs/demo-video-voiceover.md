# Demo Video Voiceover

> Final narration for the primary 115-second judge cut. Pair it with
> `docs/demo-video-shotlist.md`. Words in brackets are operator cues, not narration.
>
> Target: **1:50-2:00**, calm delivery at roughly 125-135 words per minute.

## Primary Cut

### 0:00-0:08 — Promise

**Screen:** Landing hero, then open the Research Agent.

> Autonomous software needs purchasing power. It should not get unrestricted access to your
> wallet. OneLink gives it a card instead.

### 0:08-0:24 — Consent

**Screen:** Armed Research Agent mission and readable mandate limits.

> I am asking this workflow to prepare an Ethereum market-risk brief. I authorize one provider,
> ten cents per tool, two dollars per day, an expiry, and instant revocation. These are not dashboard
> preferences. They are a signed mandate enforced on-chain.

**Optional overlay:** `One merchant · $0.10/tool · $2/day · Expires · Revocable`

### 0:24-0:57 — Useful Work, Then Refusal

**Screen:** Click **Run task with my budget** once. Hold on the two purchases, the finished brief,
and the blocked premium export.

> One click starts the task. It buys market insight for five cents and sentiment for eight cents,
> then produces the brief. Next, an unexpected premium export asks for twenty cents. That exceeds
> the permission I signed, so the contract refuses it before settlement. The useful work finishes;
> the unexpected spend does not.

**Optional overlay:** `0.13 USDC spent · 0.20 USDC blocked`

### 0:57-1:09 — Kill Switch

**Screen:** Revoke the budget, or show the already verified revoke result and Arbiscan link.

> The authority remains mine. One revoke disarms the budget on-chain, and future charges under that
> mandate fail.

### 1:09-1:40 — Particle UA Track Proof

**Screen:** Canonical receipt `fc5adc83-3b17-4004-8902-a5a40a178dd5`. Show the route, amount,
merchant, Base source leg, Arbitrum settlement, UniversalX activity, and InvoicePaid proof.

> Underneath this experience, Magic signs for the user's own EOA, upgraded in place through a
> Particle Universal Account in EIP-7702 mode. In this verified payment, the account sourced USDC
> from Base and paid two USDC to the merchant on Arbitrum without a manual bridge. The value legs
> are on-chain and linked by the completed Particle activity. Separately, our Arbitrum onboarding
> path proves the one-time delegation can be relayer-sponsored. The public receipt exposes it all.

**Optional overlay:** `Base source → Particle UA → Arbitrum merchant · Public proof`

### 1:40-1:55 — Close

**Screen:** Receipt seal, then product mark.

> The workflow in this demo is deliberately deterministic; the mainnet payments, limits, refusal,
> and revoke are real. Particle handles the rails. OneLink gives autonomous payments consent,
> limits, and proof.

## Caption-Only Version

Use these six cards if the video is watched muted:

1. `Give autonomous software a card. Not your wallet.`
2. `Sign the boundary once: merchant, amount, day, expiry, revoke.`
3. `Task completed · 0.13 USDC spent.`
4. `Unexpected 0.20 USDC charge blocked before settlement.`
5. `Base → Arbitrum through Particle UA · no manual bridge.`
6. `Consent before execution. Proof after settlement.`

## Recording Guardrails

- Do not narrate addresses, hashes, SDK versions, or internal route names; let the receipt hold that
  evidence visually.
- Say **x402 pattern** only if asked. Do not claim Coinbase facilitator compatibility.
- Say **deterministic workflow**, not an LLM that reasons or chooses tools dynamically.
- The `0.05 + 0.08 USDC` purchases are same-chain Arbitrum payments. The canonical receipt is the
  separate Particle UA Base-to-Arbitrum proof.
- `Zero native gas` is scoped to the relayer-sponsored one-time delegation. The Particle settlement
  fee is paid in USDC; OneLink does not claim a general paymaster.
- If a live dependency stalls, show the existing verified result and label it as an earlier live run.
  Never imply replayed evidence is a fresh transaction.

## One-Sentence Judge Recall

> The workflow completed the task, physically could not overspend, and every payment is provable.
