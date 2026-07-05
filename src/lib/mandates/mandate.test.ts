import test from "node:test";
import assert from "node:assert/strict";
import { type Address, type Hex } from "viem";
import {
  deriveMandate,
  mandateFromCustomCaps,
  computeMandateId,
  buildMandateTypedData,
  getMandateDomain,
  MANDATE_EIP712_TYPES,
  MANDATE_PRIMARY_TYPE,
} from "./mandate";

const PAYER = "0x1111111111111111111111111111111111111111" as Address;
const MERCH = "0x2222222222222222222222222222222222222222" as Address;
const TOKEN = "0x3333333333333333333333333333333333333333" as Address;
const CHAIN = 42161;
const NONCE = ("0x" + "ab".repeat(32)) as Hex;

// Pro-mode custom caps (P6) must ride the SAME signed struct as the presets — a user's advanced
// limits change only the numbers they sign, never the EIP-712 envelope the on-chain SpendPolicy
// verifies. These guards fail CI if custom caps ever drift the struct/domain/hash.

test("mandateFromCustomCaps copies caps/expiry verbatim and keeps a provided nonce", () => {
  const m = mandateFromCustomCaps({
    payer: PAYER, merchant: MERCH, token: TOKEN, chainId: CHAIN,
    maxPerCharge: 1_000_000n, maxPerDay: 5_000_000n, totalCap: 20_000_000n,
    expiry: 1_900_000_000, nonce: NONCE,
  });
  assert.equal(m.maxPerCharge, 1_000_000n);
  assert.equal(m.maxPerDay, 5_000_000n);
  assert.equal(m.totalCap, 20_000_000n);
  assert.equal(m.expiry, 1_900_000_000);
  assert.equal(m.payer, PAYER);
  assert.equal(m.merchant, MERCH);
  assert.equal(m.token, TOKEN);
  assert.equal(m.chainId, CHAIN);
  assert.equal(m.nonce, NONCE);
});

test("mandateFromCustomCaps rolls a fresh 32-byte nonce when none is provided", () => {
  const base = { payer: PAYER, merchant: MERCH, token: TOKEN, chainId: CHAIN, maxPerCharge: 1n, maxPerDay: 0n, totalCap: 1n, expiry: 1 };
  const a = mandateFromCustomCaps(base);
  const b = mandateFromCustomCaps(base);
  assert.match(a.nonce, /^0x[0-9a-f]{64}$/);
  assert.notEqual(a.nonce, b.nonce);
});

test("BYTE-IDENTITY: a custom mandate hashes identically to a preset mandate with the same fields", () => {
  const preset = deriveMandate({
    payer: PAYER, merchant: MERCH, token: TOKEN, chainId: CHAIN,
    invoiceAmount: 1_000_000n, preset: "agent_budget", now: 1_800_000_000,
  });
  const custom = mandateFromCustomCaps({
    payer: preset.payer, merchant: preset.merchant, token: preset.token, chainId: preset.chainId,
    maxPerCharge: preset.maxPerCharge, maxPerDay: preset.maxPerDay, totalCap: preset.totalCap,
    expiry: preset.expiry, nonce: preset.nonce,
  });
  // identical EIP-712 digest => identical struct + domain + hashing path
  assert.equal(computeMandateId(custom), computeMandateId(preset));
  const td = buildMandateTypedData(custom);
  assert.equal(td.primaryType, MANDATE_PRIMARY_TYPE);
  assert.deepEqual(td.domain, getMandateDomain(CHAIN));
  assert.equal(td.types, MANDATE_EIP712_TYPES); // same reference: the shared envelope
});

test("STRUCT SNAPSHOT: the PaymentMandate EIP-712 fields are unchanged (names, types, order)", () => {
  assert.deepEqual(
    MANDATE_EIP712_TYPES.PaymentMandate.map((f) => `${f.name}:${f.type}`),
    [
      "payer:address", "merchant:address", "token:address", "chainId:uint256",
      "maxPerCharge:uint256", "maxPerDay:uint256", "totalCap:uint256",
      "expiry:uint256", "nonce:bytes32",
    ],
  );
});
