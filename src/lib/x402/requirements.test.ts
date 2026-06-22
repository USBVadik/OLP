import assert from "node:assert/strict";
import test from "node:test";
import {
  X402_VERSION,
  X402_SCHEME,
  buildPaymentRequirements,
  build402Response,
  encodePaymentHeader,
  decodePaymentHeader,
  type X402PaymentProof,
} from "./requirements";

const MERCHANT = "0x8C54783849A2C042544efc37c4657Ee98a411Fb7" as const;
const USDC = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" as const;
const POLICY = "0x9782e3724859469fbBAC5085EA8bf8E70724164E" as const;

function reqs() {
  return buildPaymentRequirements({
    resource: "/api/x402/market-insight",
    description: "Market insight snapshot",
    priceAtomic: 50_000n,
    payTo: MERCHANT,
    asset: USDC,
    network: "arbitrum",
    mandatePolicy: POLICY,
  });
}

test("buildPaymentRequirements uses the onelink-mandate scheme (honest, not 'exact')", () => {
  assert.equal(reqs().scheme, X402_SCHEME);
  assert.equal(X402_SCHEME, "onelink-mandate");
});

test("buildPaymentRequirements expresses the amount as an atomic string", () => {
  assert.equal(reqs().maxAmountRequired, "50000");
});

test("buildPaymentRequirements carries payTo, asset, resource, network, mandatePolicy", () => {
  const r = reqs();
  assert.equal(r.payTo, MERCHANT);
  assert.equal(r.asset, USDC);
  assert.equal(r.resource, "/api/x402/market-insight");
  assert.equal(r.network, "arbitrum");
  assert.equal(r.extra.mandatePolicy, POLICY);
  assert.equal(r.extra.settledVia, "spend-mandate");
  assert.equal(r.mimeType, "application/json");
  assert.ok(r.maxTimeoutSeconds > 0);
});

test("build402Response wraps requirements with x402Version and accepts[]", () => {
  const body = build402Response(reqs());
  assert.equal(body.x402Version, X402_VERSION);
  assert.equal(body.accepts.length, 1);
  assert.equal(body.accepts[0].resource, "/api/x402/market-insight");
  assert.equal(body.error, undefined);
});

test("build402Response can carry an error string", () => {
  const body = build402Response(reqs(), "insufficient amount");
  assert.equal(body.error, "insufficient amount");
});

test("encode/decode payment header round-trips the proof", () => {
  const proof: X402PaymentProof = {
    scheme: X402_SCHEME,
    txHash: "0xabc123",
    amount: "50000",
    asset: USDC,
    payTo: MERCHANT,
    resource: "/api/x402/market-insight",
  };
  const header = encodePaymentHeader(proof);
  assert.equal(typeof header, "string");
  const decoded = decodePaymentHeader(header);
  assert.deepEqual(decoded, proof);
});

test("decodePaymentHeader returns null on non-base64 garbage (never throws)", () => {
  assert.equal(decodePaymentHeader("!!!not base64!!!"), null);
});

test("decodePaymentHeader returns null on base64 of non-JSON", () => {
  const notJson = Buffer.from("hello world", "utf8").toString("base64");
  assert.equal(decodePaymentHeader(notJson), null);
});

test("decodePaymentHeader returns null when required fields are missing", () => {
  const partial = Buffer.from(JSON.stringify({ scheme: X402_SCHEME }), "utf8").toString("base64");
  assert.equal(decodePaymentHeader(partial), null);
});

test("decodePaymentHeader returns null on the wrong scheme", () => {
  const wrongScheme = Buffer.from(
    JSON.stringify({
      scheme: "exact",
      txHash: "0xabc",
      amount: "50000",
      asset: USDC,
      payTo: MERCHANT,
      resource: "/api/x402/market-insight",
    }),
    "utf8"
  ).toString("base64");
  assert.equal(decodePaymentHeader(wrongScheme), null);
});

test("decodePaymentHeader returns null on empty input", () => {
  assert.equal(decodePaymentHeader(""), null);
});
