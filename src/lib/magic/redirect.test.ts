import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeReturnPath, buildOauthCallbackUrl } from "./redirect";

// `sanitizeReturnPath` decides where to send the user after the OAuth round-trip.
// It MUST refuse anything that is not a same-origin path because the value is read
// from a URL query parameter and could be controlled by an attacker (open-redirect).

test("sanitizeReturnPath returns the path when it is a clean relative path", () => {
  assert.equal(sanitizeReturnPath("/pay/abc123"), "/pay/abc123");
});

test("sanitizeReturnPath preserves query string and hash on a relative path", () => {
  assert.equal(sanitizeReturnPath("/firewall?demo=1#armed"), "/firewall?demo=1#armed");
});

test("sanitizeReturnPath falls back to '/' when input is null", () => {
  assert.equal(sanitizeReturnPath(null), "/");
});

test("sanitizeReturnPath falls back to '/' when input is empty string", () => {
  assert.equal(sanitizeReturnPath(""), "/");
});

test("sanitizeReturnPath rejects absolute http URL (open-redirect attack)", () => {
  assert.equal(sanitizeReturnPath("http://attacker.com/phish"), "/");
});

test("sanitizeReturnPath rejects absolute https URL", () => {
  assert.equal(sanitizeReturnPath("https://attacker.com/phish"), "/");
});

test("sanitizeReturnPath rejects protocol-relative URL (//attacker.com)", () => {
  assert.equal(sanitizeReturnPath("//attacker.com/phish"), "/");
});

test("sanitizeReturnPath rejects javascript: scheme", () => {
  assert.equal(sanitizeReturnPath("javascript:alert(1)"), "/");
});

test("sanitizeReturnPath rejects data: scheme", () => {
  assert.equal(sanitizeReturnPath("data:text/html,<script>alert(1)</script>"), "/");
});

test("sanitizeReturnPath rejects path that does not start with /", () => {
  assert.equal(sanitizeReturnPath("pay/abc123"), "/");
});

test("sanitizeReturnPath rejects path with backslash (Windows-style absolute)", () => {
  assert.equal(sanitizeReturnPath("\\\\attacker.com\\phish"), "/");
});

test("sanitizeReturnPath rejects whitespace-only input", () => {
  assert.equal(sanitizeReturnPath("   "), "/");
});

test("sanitizeReturnPath trims surrounding whitespace before validation", () => {
  assert.equal(sanitizeReturnPath("  /firewall  "), "/firewall");
});

test("buildOauthCallbackUrl returns a clean callback URL with NO query string", () => {
  const url = buildOauthCallbackUrl("http://localhost:3000");
  assert.equal(url, "http://localhost:3000/auth/callback");
});

test("buildOauthCallbackUrl works with an https origin", () => {
  const url = buildOauthCallbackUrl("https://onelink.example");
  assert.equal(url, "https://onelink.example/auth/callback");
});

test("buildOauthCallbackUrl never includes a query string (Google requires exact match)", () => {
  const url = buildOauthCallbackUrl("http://localhost:3000");
  assert.equal(url.includes("?"), false);
});
