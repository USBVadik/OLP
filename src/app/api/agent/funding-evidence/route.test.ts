import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "./route";

test("funding evidence API is unavailable while the UA-funded agent flag is off", async () => {
  const previous = process.env.NEXT_PUBLIC_ENABLE_UA_FUNDED_AGENT;
  process.env.NEXT_PUBLIC_ENABLE_UA_FUNDED_AGENT = "false";
  try {
    const response = await POST(
      new Request("http://localhost/api/agent/funding-evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uaTransactionId: "0x0655f16e0cd6c8",
          payerAddress: "0x53Bd615635Af778e5E460d5EEC2d6b234693206a",
        }),
      }),
    );
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: "UA-funded Expense Card is disabled" });
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_ENABLE_UA_FUNDED_AGENT;
    else process.env.NEXT_PUBLIC_ENABLE_UA_FUNDED_AGENT = previous;
  }
});

test("rejects an unsigned caller before Particle, RPC, or Supabase verification", async () => {
  const previousFlag = process.env.NEXT_PUBLIC_ENABLE_UA_FUNDED_AGENT;
  const previousPolicy = process.env.NEXT_PUBLIC_SPEND_POLICY_ADDRESS_ARBITRUM;
  process.env.NEXT_PUBLIC_ENABLE_UA_FUNDED_AGENT = "true";
  process.env.NEXT_PUBLIC_SPEND_POLICY_ADDRESS_ARBITRUM =
    "0x9782e3724859469fbBAC5085EA8bf8E70724164E";
  try {
    const response = await POST(
      new Request("http://localhost/api/agent/funding-evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uaTransactionId: "0x0655f16e0cd6c8",
          payerAddress: "0x53Bd615635Af778e5E460d5EEC2d6b234693206a",
          mandate: {
            payer: "0x53Bd615635Af778e5E460d5EEC2d6b234693206a",
            merchant: "0x8C54783849A2C042544efc37c4657Ee98a411Fb7",
            token: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
            chainId: 42161,
            maxPerCharge: "100000",
            maxPerDay: "2000000",
            totalCap: "10000000",
            expiry: Math.floor(Date.now() / 1000) + 3_600,
            nonce: `0x${"66".repeat(32)}`,
          },
          signature: `0x${"00".repeat(65)}`,
        }),
      }),
    );
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: "Invalid Expense Card mandate signature" });
  } finally {
    if (previousFlag === undefined) delete process.env.NEXT_PUBLIC_ENABLE_UA_FUNDED_AGENT;
    else process.env.NEXT_PUBLIC_ENABLE_UA_FUNDED_AGENT = previousFlag;
    if (previousPolicy === undefined) delete process.env.NEXT_PUBLIC_SPEND_POLICY_ADDRESS_ARBITRUM;
    else process.env.NEXT_PUBLIC_SPEND_POLICY_ADDRESS_ARBITRUM = previousPolicy;
  }
});
