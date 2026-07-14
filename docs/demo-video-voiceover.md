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

### 0:08-0:28 — Consent + Live Cross-Chain Funding

**Screen:** Signed-in Research Agent, readable limits, live Base -> Arbitrum Particle preview, then
click **Fund live cross-chain & arm agent**.

> I am asking this workflow to prepare an Ethereum market-risk brief. I authorize one provider,
> ten cents per tool, two dollars per day, an expiry, and instant revocation. These are not dashboard
> preferences. They are a signed mandate enforced on-chain. Particle now tops the card up from my
> Base balance and makes the budget available on Arbitrum, without a bridge or chain picker.

**Optional overlay:** `Base → Particle UA → Arbitrum · live mainnet funding`

### 0:28-0:43 — Particle Proof

**Screen:** Particle status reaches `FINISHED`; hold on the verified funding card and open
**Open Particle explorer**.

> The activity is finished and verified against its on-chain legs. This opens Particle's own
> explorer, so the cross-chain route is not just a claim inside our interface.

### 0:43-1:14 — Useful Work, Then Refusal

**Screen:** Click **Run task with my budget** once. Hold on the two purchases, the finished brief,
and the blocked premium export.

> One click starts the task. It buys market insight for five cents and sentiment for eight cents,
> then produces the brief. Next, an unexpected premium export asks for twenty cents. That exceeds
> the permission I signed, so the contract refuses it before settlement. The useful work finishes;
> the unexpected spend does not.

**Optional overlay:** `0.13 USDC spent · 0.20 USDC blocked`

### 1:14-1:27 — Kill Switch

**Screen:** Revoke the budget, or show the already verified revoke result and Arbiscan link.

> The authority remains mine. One revoke disarms the budget on-chain, and future charges under that
> mandate fail.

### 1:27-1:47 — Unified Outcome

**Screen:** Completed Agent outcome. Show Particle Network proof, useful spend, protected spend,
and the separate Arbiscan proofs for the tool purchases.

> Magic signs for the user's own EOA, upgraded in place through a Particle Universal Account in
> EIP-7702 mode. Particle handled the cross-chain card funding. OneLink then enforced each
> Arbitrum tool purchase, blocked the overspend, and kept every proof independently inspectable.

**Optional overlay:** `Particle funding proof · Arbitrum purchase proofs · one outcome`

### 1:47-1:58 — Close

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
5. `Live Base → Arbitrum card funding · Particle activity FINISHED.`
6. `Consent before execution. Proof after settlement.`

## Recording Guardrails

- Do not narrate addresses, hashes, SDK versions, or internal route names; let the receipt hold that
  evidence visually.
- Say **x402 pattern** only if asked. Do not claim Coinbase facilitator compatibility.
- Say **deterministic workflow**, not an LLM that reasons or chooses tools dynamically.
- The `0.05 + 0.08 USDC` purchases are same-chain Arbitrum payments. The immediately preceding
  Expense Card funding activity is the live Particle UA Base-to-Arbitrum proof.
- `Zero native gas` is scoped to the relayer-sponsored one-time delegation. The Particle settlement
  fee is paid in USDC; OneLink does not claim a general paymaster.
- If a live dependency stalls, show the existing verified result and label it as an earlier live run.
  Never imply replayed evidence is a fresh transaction.

## One-Sentence Judge Recall

> The workflow completed the task, physically could not overspend, and every payment is provable.
