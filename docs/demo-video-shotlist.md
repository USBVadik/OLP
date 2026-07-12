# Demo Video Shot List

> Recording plan for the final judge video. This is the click-and-screen storyboard, not the
> voiceover. Target length: **1:45-2:10**. Hard cap: 2:30.
>
> Judging weights served: UX 40 · Universal Accounts + EIP-7702 30 · adoption 20 · polish 10.
> Golden rule: **show useful work, the hard block, and the proof. Do not tour the app.**

## Pre-flight

- [ ] Use a clean browser profile without extensions. Window 1280-1440 px; zoom 110-125%.
- [ ] Record the production build at `https://onelink-pay.vercel.app`.
- [ ] Confirm the Research Agent payer has enough Arbitrum USDC for `0.13 USDC` of purchases and
      the relayer has enough Arbitrum ETH.
- [ ] Open `/agent`, sign in with Magic, and arm the `agent budget` mandate before recording. Keep
      this tab in the same session because armed state is not restored after a reload.
- [ ] Pre-open these tabs: `/` · `/agent` (armed) · canonical
      `/receipt/fc5adc83-3b17-4004-8902-a5a40a178dd5` · `/try`.
- [ ] Run the exact click path once silently. If any external dependency is unstable, record the
      existing verified state and use the canonical receipt rather than sending another payment.

## Primary 115-second cut

### 1. Promise (0:00-0:08) · `/`

- Hold on **"Give your AI a card. Not your wallet."**
- Let the supporting line sit for one beat.
- Click the Research Agent CTA.

Voiceover intent: "Autonomous software needs purchasing power, not unrestricted wallet access."

### 2. Permission before execution (0:08-0:25) · `/agent` armed

- Show the mission: prepare an ETH market-risk brief.
- Point to the signed limits: `0.10 USDC/tool`, `2 USDC/day`, one merchant, expiry, revoke.
- Keep addresses, hashes, and x402 details closed.

Voiceover intent: "I give this workflow a card it cannot exceed: one provider, ten cents per tool,
two dollars per day, revocable whenever I choose."

### 3. Useful work and hard refusal (0:25-1:00) · `/agent`

- Click **Run task with my budget** once.
- Let Market insight (`0.05`) and Live sentiment (`0.08`) settle.
- Hold on the **Brief ready** result. Point to `0.13 spent`, `0.20 protected`, and the readable brief.
- Point to the blocked premium export: attempted `0.20`, signed cap `0.10`, no settlement.
- Do not open raw logs unless the judge explicitly asks.

Voiceover intent: "It buys the two inputs it needs and produces the brief. Then a buggy premium
export asks for twenty cents. The contract refuses it before settlement. Useful work completed;
unexpected spend prevented."

### 4. Kill switch (1:00-1:13) · `/agent`

- Click **Revoke budget** and confirm through Magic.
- Hold on the revoked confirmation and disabled run action.
- If recording without another mainnet action, use the already verified RC2 revoke state/video and
  show its Arbiscan link instead. Never imply a replay is a fresh transaction.

Voiceover intent: "And the authority remains mine. One revoke disarms the budget on-chain."

### 5. Particle UA track proof (1:13-1:43) · canonical `/receipt`

- Open `/receipt/fc5adc83-3b17-4004-8902-a5a40a178dd5`.
- Show the Base -> Arbitrum route, amount, merchant, settlement transaction, UniversalX activity,
  and InvoicePaid proof.
- Open one explorer link only if it loads immediately.

Voiceover intent: "Underneath, the same Magic EOA is a Particle Universal Account in EIP-7702
mode. This verified payment sourced USDC from Base and settled on Arbitrum without a manual bridge.
The receipt is public and independently checkable."

### 6. Close (1:43-1:55) · `/` or receipt header

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
2. Agent provider/relayer is slow: show the verified Research Agent result and transaction links,
   clearly labelled as an earlier live run.
3. Magic is slow: use `/try` for the interactive block and the canonical receipt for cross-chain
   proof.
4. Never open `/debug/*`, expose raw secrets, or send a replacement transaction merely to rescue a
   recording.

## Claim discipline

- Say **x402 pattern, settled by our on-chain mandate**, not Coinbase-facilitator compatible.
- Say **unattended deterministic workflow**, not LLM reasoning.
- Say the two research resources are deterministic demo fixtures; the payments and enforcement are
  real.
- Say the Research Agent purchases settle on Arbitrum. The separate canonical Particle UA receipt
  is the Base -> Arbitrum cross-chain proof.
- Say the one-time EIP-7702 delegation is sponsored, not that every transaction has a general gas
  paymaster.
- Say no private key or unrestricted signing authority is shared with the workflow. Do not imply
  that no token allowance exists.

## After recording

Write down each visible time range and action. Trim dead waits, OTP entry, wallet modals, repeated
explorer loading, and technical accordions. The finished video should make a judge repeat this in
one sentence: **"The workflow completed the task, could not overspend, and the payment is provable."**
