import assert from "node:assert/strict";
import test from "node:test";
import { classifyConsume, x402DeliveryDecision } from "./consume";

test("no error = fresh consume (first proof passes)", () => {
  assert.equal(classifyConsume(null), "fresh");
  assert.equal(classifyConsume(undefined), "fresh");
});

test("unique violation (23505) = replayed — same proof, or reused for another resource", () => {
  assert.equal(classifyConsume({ code: "23505" }), "replayed");
});

test("any other db error = unavailable (fail closed)", () => {
  assert.equal(classifyConsume({ code: "42P01" }), "unavailable"); // undefined_table (migration missing)
  assert.equal(classifyConsume({}), "unavailable");
  assert.equal(classifyConsume({ code: null }), "unavailable");
});

test("delivery is fail-CLOSED: only a fresh consume delivers the resource", () => {
  assert.deepEqual(x402DeliveryDecision("fresh"), { deliver: true, status: 200 });

  const replayed = x402DeliveryDecision("replayed");
  assert.equal(replayed.deliver, false);
  assert.equal(replayed.status, 402);

  const unavailable = x402DeliveryDecision("unavailable");
  assert.equal(unavailable.deliver, false);
  assert.equal(unavailable.status, 503);
});
