# Spec: one-tap-checkout — Requirements

> Epic: **UX excellence (the "transaction abstraction" judges asked for)**
> Story: As a payer, after I've read the **Trust Preview**, I complete the payment with **one tap** —
> no "Build preview" then "Confirm & pay" two-step, no phase-by-phase clicking — while the Trust
> Preview remains the single explicit thing I approve.
> Priority: **P1** (biggest single rubric lever — UX 40%)
> Estimated effort: **M (re-orchestrate the /pay preview→pay trigger; reuse the proven build/sign/send functions verbatim)**
> Process: `.kiro/steering/methodology.md`
> Scores: **UX 40 · Polish 10 · (supports UA+7702 30 legibility)**

## 1. Why this exists

Deep research + both UXmaxx workshops name **transaction abstraction** as exactly what judges reward
(Particle DevRel: Magic's blind signatures let you "automate everything"; the host: "that's exactly
the kind of UX the judges are looking for"). Today `/pay` is a **multi-step UI**: "Build payment
preview" → "Confirm & pay". The friction is the *steps*, not signature popups (Magic blind-signs the
plumbing). Collapsing to **one tap after the Trust Preview** is the highest-leverage UX-40 win, and
it lets us match the frictionless feel of Coinbase/AWS agent wallets **while staying non-custodial
with a single legible consent** — our wedge.

## 2. The one-consent rule (hard, non-negotiable — this is our thesis)

- The **Trust Preview is the single explicit human approval of the spend.** After it, exactly one
  "Pay" action commits the payment.
- Only **plumbing** may be blind-signed without a separate prompt: the EIP-7702 **delegation**, any
  inline **7702 authorizations**, and the **rootHash** signature. These move no funds on their own.
- The system shall **never** silently approve the actual USDC spend — the spend happens only on the
  explicit "Pay" tap. Removing the tap, or auto-paying on page load, is forbidden.

## 3. Non-regression constraints (this touches the payment path — be strict)

- **Reuse the proven logic verbatim.** The transaction **build** (`createUniversalTransaction` +
  `usePrimaryTokens:[USDC]` + per-chain pre-delegation via `delegateChain7702` + rebuild) and the
  **send** (`sendVia7702`: inline-auth signing + rootHash sign + `sendTransaction`) and `mark-paid`
  are **not rewritten** — one-tap only changes *when they are invoked* (one handler chains them).
- **Behind a feature flag, default OFF.** `NEXT_PUBLIC_ONE_TAP_CHECKOUT` (or equivalent const)
  gates the new flow. When off, the current two-step path renders **byte-identical** to today.
  Rollback = unset the env var and redeploy (`NEXT_PUBLIC_` is inlined at build time); no code change. The two-step path is always the fallback.
- **No change** to the EIP-712 `PaymentMandate` / `SpendPolicy` / cross-chain recipe (protects
  C8/C16/C17/C21).
- **Live-verify before enabling in prod.** The flag stays off in prod until a real one-tap `/pay`
  (same-chain AND cross-chain) is run and RPC-verified by the user.
- Canonical positioning + hero untouched.

## 4. Acceptance criteria (EARS)

### Ubiquitous
- When the one-tap flag is ON and the payer is at the preview step, the system shall render the
  **Trust Preview** (amount, merchant, active chain, payment mode, proof behavior) plus a single
  primary action labelled **"Pay {amount}"** — and **no** separate "Build payment preview" step.
- When the flag is OFF, the system shall render today's exact two-step flow unchanged.

### Event-driven
- When the payer taps **"Pay {amount}"**, the system shall, in one orchestrated sequence with
  visible progress: build the universal transaction, pre-delegate any touched chains (blind), sign
  inline auths + the rootHash (blind), send via the Universal Account, then mark-paid — landing on
  the success/receipt state.
- While that sequence runs, the system shall show honest phase feedback (e.g. "Preparing route" →
  "Settling {amount} on {chain}") and, for a cross-chain payment, the route animation — so the tap
  never feels like a dead wait.
- When any step fails (build error, delegation gas missing, RPC flake, user rejects a signature),
  the system shall surface the existing honest error and leave the payer able to retry, with **no
  funds moved** on a failed attempt.

### State
- The success state, proof receipt, `mark-paid` verification, and cross-chain badge shall be
  **identical** to today's (the end result is the same; only the number of taps changed).
- The exact settlement route + USDC fee shall be visible **no later than** the paying phase (they
  are not hidden from the payer).

### Accessibility
- The single action is keyboard-operable, has an accessible busy/disabled state, and announces phase
  changes (aria-live); reduced-motion respected.

## 5. Out of scope
- Rewriting the build/sign/send internals or the mandate/contract.
- Removing the Trust Preview or the explicit Pay tap (forbidden by §2).
- Eager-building the transaction on page load (delegating before intent) — considered and rejected
  in design; the build runs on the Pay tap.
