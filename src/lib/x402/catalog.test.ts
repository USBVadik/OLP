import assert from "node:assert/strict";
import test from "node:test";
import { X402_CATALOG, getResource, listResources } from "./catalog";

test("catalog has the three demo resources", () => {
  assert.ok(X402_CATALOG["market-insight"]);
  assert.ok(X402_CATALOG["sentiment-feed"]);
  assert.ok(X402_CATALOG["premium-dataset"]);
  assert.equal(Object.keys(X402_CATALOG).length, 3);
});

test("prices match the design (atomic USDC, 6 decimals)", () => {
  assert.equal(X402_CATALOG["market-insight"].priceAtomic, 50_000n); // 0.05
  assert.equal(X402_CATALOG["sentiment-feed"].priceAtomic, 80_000n); // 0.08
  assert.equal(X402_CATALOG["premium-dataset"].priceAtomic, 200_000n); // 0.20
});

test("the two cheap resources are under a 0.10 per-charge cap (within budget)", () => {
  const cap = 100_000n;
  assert.ok(X402_CATALOG["market-insight"].priceAtomic < cap);
  assert.ok(X402_CATALOG["sentiment-feed"].priceAtomic < cap);
});

test("premium-dataset is over a 0.10 per-charge cap (the block trigger)", () => {
  const cap = 100_000n;
  assert.ok(X402_CATALOG["premium-dataset"].priceAtomic > cap);
});

test("getResource returns the resource for a known id", () => {
  const r = getResource("market-insight");
  assert.ok(r);
  assert.equal(r?.id, "market-insight");
  assert.equal(typeof r?.title, "string");
});

test("getResource returns null for an unknown id", () => {
  assert.equal(getResource("does-not-exist"), null);
});

test("each resource has an id, title, description, and a payload producer", () => {
  for (const id of Object.keys(X402_CATALOG)) {
    const r = X402_CATALOG[id];
    assert.equal(r.id, id);
    assert.ok(r.title.length > 0);
    assert.ok(r.description.length > 0);
    assert.equal(typeof r.payload, "function");
    // payload must produce something serializable
    const data = r.payload();
    assert.doesNotThrow(() => JSON.stringify(data));
  }
});

test("listResources returns every catalog entry", () => {
  const list = listResources();
  assert.equal(list.length, 3);
  const ids = list.map((r) => r.id).sort();
  assert.deepEqual(ids, ["market-insight", "premium-dataset", "sentiment-feed"]);
});
