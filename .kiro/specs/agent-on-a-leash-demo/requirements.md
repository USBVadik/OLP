# Spec: agent-on-a-leash-demo — Requirements

> Epic: **E1. AI-safe card narrative + agent-on-a-leash demo**
> Stories: **E1.S1, E1.S2, E1.S3, E1.S5**
> Priority: **P1** (Block B, target close: 2026-06-25 EOD)
> Estimated effort: **6-8h**
> Process: `.kiro/steering/methodology.md`

## 1. Why this exists

This is the centerpiece. All four deep-research reports converged on a single highest-leverage
move: a visceral "agent autonomously pays, then gets blocked on-chain" 60-90 second scene. The
contract-level enforcement is already proven on mainnet (claims `C3`, `C4`, `C5`, `C6`); this
spec wraps that proof in a memorable demo experience.

## 2. User stories covered

- **E1.S1** — As a hackathon judge, I see the agent autonomously pay 0.10 USDC from a mandate
  and the budget HUD update, so I understand "agent paid safely" in <10s.
- **E1.S2** — As a hackathon judge, I see the agent attempt 0.20 USDC, the simulation refuse it,
  and the UI show `PerChargeExceeded` with no funds moved, so I feel the "blocked on-chain" wow
  in <10s.
- **E1.S3** — As a hackathon judge, I see the user click "Revoke" and the next agent attempt
  fail (`MandateIsRevoked`), so I understand reversibility.
- **E1.S5** — As a viewer of the recorded demo, I see split-screen (agent terminal | firewall
  dashboard), so the contrast between autonomous activity and on-chain immunity is visceral.

## 3. Acceptance criteria (EARS)

### Ubiquitous
- The `/firewall` page shall display the existing firewall dashboard side-by-side with a new
  agent terminal panel.
- The agent terminal panel shall append timestamped entries with the prefix `[AGENT]` for agent
  actions and `[FIREWALL]` for on-chain responses.

### Event-driven
- **When** the demo operator clicks **"Run agent (within cap)"** while a mandate is armed, **the
  system shall** append `[AGENT] Detected offer: 0.10 USDC. Calling firewall...`, POST to
  `/api/mandates/charge` with amount `100000` (0.10 USDC), and append the success entry
  `[FIREWALL] Charged 0.10 USDC. Tx: <hash>` within 30s.
- **When** the demo operator clicks **"Run agent (over cap)"** while a mandate is armed, **the
  system shall** attempt amount `200000` (0.20 USDC) — `0.10` over the per-charge cap of
  `0.10` — append `[AGENT] Attempting 0.20 USDC...`, the `/api/mandates/charge` route shall
  return `code: PerChargeExceeded` from simulation, and the panel shall append
  `[FIREWALL] BLOCKED: PerChargeExceeded. No funds moved. Zero gas.` within 5s.
- **When** the demo operator clicks **"Run agent (within cap)"** after the mandate has been
  revoked, **the system shall** append `[AGENT] Detected offer: 0.10 USDC. Calling firewall...`
  and `[FIREWALL] BLOCKED: MandateIsRevoked. Agent disarmed.`.
- **When** the user clicks **"Revoke"**, **the system shall** call
  `SpendPolicy.revoke(mandateHash)` on the active chain and append
  `[USER] Revoke signed. Mandate now inert.` followed by
  `[FIREWALL] Mandate revoked: <hash>. Tx: <hash>`.

### State-driven
- **While** a charge is in flight, **the system shall** show a "Running…" indicator on the
  triggering button and disable both Run-agent buttons.
- **While** no mandate is armed, **the system shall** disable both Run-agent buttons with a
  tooltip "Arm a mandate to run the agent."

### Unwanted-behavior
- **If** the relayer returns a non-revert error (network, RPC, signature mismatch), **the
  system shall** append `[FIREWALL] ERROR: <code>. <human message>.` and re-enable the buttons,
  and shall NOT pretend the charge was blocked by policy.

## 4. Scope

### In scope
- A small set of typed agent **scenarios** (within-cap, over-cap, post-revoke).
- An **agent terminal panel** UI component on `/firewall`.
- A **split-screen** layout for `/firewall` so the terminal sits beside the firewall dashboard.
- Wiring the scenarios to the existing `/api/mandates/charge` relayer route.
- A demo-runbook update with the new scene.

### Out of scope (cut)
- Making the agent autonomously decide on amounts via an LLM.
- A separate Node CLI bot (it would not run on the demo machine reliably). The "agent" is a
  stylized button that emits agent-flavored log lines; this is acceptable per
  `.kiro/steering/methodology.md` §13 (vertical slice, simplest demoable thing first).
- Multiple concurrent agents.
- Persisting agent runs across reloads.
- Agent identity / signing keys distinct from the operator (single user demo).

## 5. Dependencies

- ✅ `SpendPolicy` deployed on Arbitrum (claim `C2`).
- ✅ `/api/mandates/charge` route exists with simulate-first behavior (claim `C3` lineage).
- ✅ `permission-firewall.tsx` arm/charge/revoke flow exists (working today).
- ↪ This spec must NOT regress the working `/firewall` flow. Verify the "manual charge" buttons
  (existing) still work after the agent panel ships.

## 6. INVEST check

- **I**ndependent — does not block on E2 (cross-chain) or E3 (Magic OAuth). ✅
- **N**egotiable — the visual style of the terminal is open. ✅
- **V**aluable — directly UX 40% + UA 30%. ✅
- **E**stimable — 6-8h. ✅
- **S**mall — fits in <2 days. ✅
- **T**estable — every acceptance criterion maps to a test or manual checklist row. ✅

## 7. Definition of Done (per `methodology.md` §6)

A task is closed when: tests green, typecheck/lint/build green, manually verified on the dev
server, claim ledger and risk register updated where relevant, demo runbook updated.

The spec is closed when ALL tasks in `tasks.md` are closed AND the verification trail row in
`docs/master-tz.md` §7 is filled.
