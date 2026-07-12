import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const PROBE_PAGE = join(
  process.cwd(),
  "src/app/debug/ua-expense-card-probe/page.tsx"
);

test("UA-funded Expense Card probe is build-only and cannot sign or send", () => {
  const source = readFileSync(PROBE_PAGE, "utf8");
  const forbiddenCalls = [
    "sendTransaction(",
    "personal_sign",
    "signMessage(",
    "sign7702Authorization(",
    "send7702Transaction(",
    ".approve(",
    "signTypedData(",
    "writeContract(",
    "sendRawTransaction(",
    "eth_sendTransaction",
    "eth_sendRawTransaction",
    "wallet_sendCalls",
  ];

  for (const call of forbiddenCalls) {
    assert.equal(source.includes(call), false, `debug probe must not contain ${call}`);
  }
  assert.match(source, /NEXT_PUBLIC_ENABLE_DEBUG_PROBES/);
  assert.match(source, /createUniversalTransaction\(/);
});
