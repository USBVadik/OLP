import assert from "node:assert/strict";
import test from "node:test";
import { receiptShareUrl } from "./share";

test("builds an absolute receipt URL from app base + id", () => {
  assert.equal(
    receiptShareUrl("https://onelink.example", "abc123"),
    "https://onelink.example/receipt/abc123"
  );
});

test("trims a trailing slash on the base url", () => {
  assert.equal(
    receiptShareUrl("https://onelink.example/", "abc123"),
    "https://onelink.example/receipt/abc123"
  );
});

test("works with a localhost base", () => {
  assert.equal(
    receiptShareUrl("http://localhost:3000", "70bfbad2"),
    "http://localhost:3000/receipt/70bfbad2"
  );
});

test("falls back to a relative path when base url is empty", () => {
  assert.equal(receiptShareUrl("", "abc123"), "/receipt/abc123");
});

test("encodes an id with unsafe characters", () => {
  assert.equal(
    receiptShareUrl("https://x.io", "a b/c"),
    "https://x.io/receipt/a%20b%2Fc"
  );
});
