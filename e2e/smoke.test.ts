// App-level smoke test (audit F8). A lightweight HTTP smoke over the live judge path, using the
// repo's existing node:test runner — deliberately NOT Playwright, so it stays runnable and offline
// from any browser download. It lives outside `src/`, so it is NOT part of `test:unit` (which stays
// deterministic + network-free); run it explicitly with `pnpm test:smoke`. Point it at a preview
// deploy with SMOKE_BASE_URL=https://<preview>.vercel.app.
//
// Scope: it guards the routes a judge actually touches (landing wow, walletless firewall block,
// x402 402, the canonical cross-chain receipt, and the F6 security headers). It does NOT exercise
// client-side rendering — that would need a browser E2E — it catches deploy/route regressions.
import assert from "node:assert/strict";
import test from "node:test";

const BASE = (process.env.SMOKE_BASE_URL ?? "https://onelink-pay.vercel.app").replace(/\/$/, "");
const DEMO_MERCHANT = "0x8c54783849a2c042544efc37c4657ee98a411fb7";
const CANONICAL_RECEIPT = "fc5adc83-3b17-4004-8902-a5a40a178dd5";

function get(path: string): Promise<Response> {
  return fetch(`${BASE}${path}`);
}

test("landing responds 200 and shows the tagline", async () => {
  const res = await get("/");
  assert.equal(res.status, 200);
  assert.match(await res.text(), /Trust before you pay/i);
});

test("landing sends the F6 baseline security headers", async () => {
  const res = await get("/");
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
  assert.equal(res.headers.get("x-frame-options"), "SAMEORIGIN");
});

test("/try (walletless firewall) responds 200", async () => {
  const res = await get("/try");
  assert.equal(res.status, 200);
});

test("walletless firewall verdict is a live on-chain over-cap block", async () => {
  const res = await get("/api/demo/firewall-block");
  assert.equal(res.status, 200);
  const body = (await res.json()) as { blocked?: boolean; errorName?: string };
  assert.equal(body.blocked, true);
  assert.equal(body.errorName, "PerChargeExceeded");
});

test("x402 resource requires payment (402 + requirements to the demo merchant)", async () => {
  const res = await get("/api/x402/market-insight");
  assert.equal(res.status, 402);
  const body = (await res.json()) as { accepts?: Array<{ payTo?: string }> };
  assert.equal(body.accepts?.[0]?.payTo?.toLowerCase(), DEMO_MERCHANT);
});

test("canonical cross-chain receipt renders", async () => {
  const res = await get(`/receipt/${CANONICAL_RECEIPT}`);
  assert.equal(res.status, 200);
});
