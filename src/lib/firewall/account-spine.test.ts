import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ENFORCEMENT_CHAINS,
  enforcementChainsLabel,
  shortAddress,
  accountSpineFacts,
  compactAccountFacts,
  blockHeldOnAccountLine,
  shouldShowCompactAccountFacts,
} from "./account-spine";

test("enforcement chains are exactly the live SpendPolicy chains (Base + Arbitrum)", () => {
  assert.deepEqual([...ENFORCEMENT_CHAINS], ["Base", "Arbitrum"]);
  assert.equal(enforcementChainsLabel(), "Base + Arbitrum");
});

test("honesty guard: no Solana / Optimism anywhere in the chains label", () => {
  const label = enforcementChainsLabel().toLowerCase();
  assert.ok(!label.includes("solana"), "must not claim Solana");
  assert.ok(!label.includes("optimism"), "must not claim Optimism (experimental, not live)");
});

test("shortAddress formats a full EOA and passes through short input", () => {
  assert.equal(
    shortAddress("0x53Bd615635Af778e5E460d5EEC2d6b234693206a"),
    "0x53Bd…206a",
  );
  assert.equal(shortAddress(""), "");
  assert.equal(shortAddress(null), "");
  assert.equal(shortAddress("0x123"), "0x123");
});

test("account spine facts: three account-level differentiators, chains correct", () => {
  const facts = accountSpineFacts();
  assert.equal(facts.length, 3);
  const ua = facts.find((f) => f.label === "Universal Account");
  assert.ok(ua && ua.value.includes("Base + Arbitrum"));
});

test("honesty guard: block-moment copy never implies cross-chain / bridge / Solana", () => {
  // The /firewall charge is same-chain (Arbitrum); the spine must not imply the blocked charge
  // was cross-chain-sourced or bridged, nor claim Solana.
  const blob = [
    ...accountSpineFacts().map((f) => `${f.label} ${f.value}`),
    blockHeldOnAccountLine(),
  ]
    .join(" ")
    .toLowerCase();
  for (const forbidden of ["cross-chain", "bridge", "solana", "sourced from"]) {
    assert.ok(!blob.includes(forbidden), `spine copy must not contain "${forbidden}"`);
  }
});

test("block line ties the held firewall to the user's own account", () => {
  assert.match(blockHeldOnAccountLine(), /your own account/i);
});

test("compact account facts: four chip-length facts covering EOA, 7702, one balance, enforcement", () => {
  const facts = compactAccountFacts();
  assert.equal(facts.length, 4);
  const blob = facts.join(" ");
  assert.match(blob, /own EOA/i);
  assert.match(blob, /EIP-7702/);
  assert.match(blob, /one balance/i);
  assert.ok(blob.includes(enforcementChainsLabel()));
  assert.match(blob, /on-chain/i);
  // Chip-length: each fact must stay glanceable on camera.
  for (const f of facts) {
    assert.ok(f.length <= 34, `fact too long for a chip: "${f}"`);
  }
});

test("honesty guard: compact facts never imply cross-chain charges / bridge / Solana", () => {
  const blob = compactAccountFacts().join(" ").toLowerCase();
  for (const forbidden of ["cross-chain", "bridge", "solana", "sourced from", "gasless"]) {
    assert.ok(!blob.includes(forbidden), `compact facts must not contain "${forbidden}"`);
  }
});

test("compact facts describe capabilities instead of claiming an already-completed delegation", () => {
  const blob = compactAccountFacts().join(" ");
  assert.match(blob, /EIP-7702 mode/i);
  assert.match(blob, /on-chain limits/i);
  assert.doesNotMatch(blob, /delegated|armed|activated/i);
});

test("compact facts render only after both Particle UA and its balance read succeed", () => {
  assert.equal(
    shouldShowCompactAccountFacts({ uaReady: true, balanceReady: true, balanceFailed: false }),
    true,
  );
  assert.equal(
    shouldShowCompactAccountFacts({ uaReady: false, balanceReady: true, balanceFailed: false }),
    false,
  );
  assert.equal(
    shouldShowCompactAccountFacts({ uaReady: true, balanceReady: false, balanceFailed: false }),
    false,
  );
  assert.equal(
    shouldShowCompactAccountFacts({ uaReady: true, balanceReady: true, balanceFailed: true }),
    false,
  );
});
