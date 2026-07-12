import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const LOGIN_COMPONENT = join(process.cwd(), "src/components/login-with-google.tsx");

test("Google login keeps One Tap gated and the redirect fallback present", () => {
  const source = readFileSync(LOGIN_COMPONENT, "utf8");

  assert.match(source, /NEXT_PUBLIC_ENABLE_GOOGLE_ONE_TAP/);
  assert.match(source, /NEXT_PUBLIC_GOOGLE_CLIENT_ID/);
  assert.match(source, /promptGoogleOneTap\(/);
  assert.match(source, /loginWithGoogleIdToken\(/);
  assert.match(source, /loginWithRedirect\(/);
  assert.match(source, /sanitizeReturnPath\(returnTo\)/);
});
