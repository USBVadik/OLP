import assert from "node:assert/strict";
import test from "node:test";
import { getConfiguredPaymentMode } from "./payment";

const originalMode = process.env.NEXT_PUBLIC_PAYMENT_MODE;

test("payment mode defaults to transfer_fallback", () => {
  delete process.env.NEXT_PUBLIC_PAYMENT_MODE;
  assert.equal(getConfiguredPaymentMode(), "transfer_fallback");
});

test("payment mode can select universal_invoice", () => {
  process.env.NEXT_PUBLIC_PAYMENT_MODE = "universal_invoice";
  assert.equal(getConfiguredPaymentMode(), "universal_invoice");
});

test("unknown payment mode falls back to transfer_fallback", () => {
  process.env.NEXT_PUBLIC_PAYMENT_MODE = "not_a_mode";
  assert.equal(getConfiguredPaymentMode(), "transfer_fallback");
});

test.after(() => {
  if (originalMode === undefined) {
    delete process.env.NEXT_PUBLIC_PAYMENT_MODE;
  } else {
    process.env.NEXT_PUBLIC_PAYMENT_MODE = originalMode;
  }
});
