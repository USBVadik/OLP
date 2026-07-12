import assert from "node:assert/strict";
import test from "node:test";
import {
  requestGoogleCredential,
  selectGoogleLoginMode,
  type GoogleAccountsId,
} from "./google-one-tap";

test("One Tap is selected only for the exact flag, client id, and supported Magic method", () => {
  assert.equal(
    selectGoogleLoginMode({ enabled: "true", clientId: "client.apps.googleusercontent.com", supportsIdTokenLogin: true }),
    "one_tap"
  );
  assert.equal(
    selectGoogleLoginMode({ enabled: "false", clientId: "client.apps.googleusercontent.com", supportsIdTokenLogin: true }),
    "redirect"
  );
  assert.equal(
    selectGoogleLoginMode({ enabled: "TRUE", clientId: "client.apps.googleusercontent.com", supportsIdTokenLogin: true }),
    "redirect"
  );
  assert.equal(
    selectGoogleLoginMode({ enabled: "true", clientId: "  ", supportsIdTokenLogin: true }),
    "redirect"
  );
  assert.equal(
    selectGoogleLoginMode({ enabled: "true", clientId: "client.apps.googleusercontent.com", supportsIdTokenLogin: false }),
    "redirect"
  );
});

test("requestGoogleCredential resolves the Google-issued credential", async () => {
  let configuredClientId = "";
  const accountsId: GoogleAccountsId = {
    initialize(config) {
      configuredClientId = config.client_id;
      queueMicrotask(() => config.callback({ credential: "google.jwt.value" }));
    },
    prompt() {},
  };

  const credential = await requestGoogleCredential(accountsId, "client-id", 100);
  assert.equal(configuredClientId, "client-id");
  assert.equal(credential, "google.jwt.value");
});

test("requestGoogleCredential rejects an empty callback credential", async () => {
  const accountsId: GoogleAccountsId = {
    initialize(config) {
      queueMicrotask(() => config.callback({}));
    },
    prompt() {},
  };

  await assert.rejects(() => requestGoogleCredential(accountsId, "client-id", 100), /no credential/);
});

test("requestGoogleCredential rejects when One Tap cannot be displayed", async () => {
  const accountsId: GoogleAccountsId = {
    initialize() {},
    prompt(callback) {
      callback?.({
        isNotDisplayed: () => true,
        getNotDisplayedReason: () => "browser_not_supported",
      });
    },
  };

  await assert.rejects(
    () => requestGoogleCredential(accountsId, "client-id", 100),
    /browser_not_supported/
  );
});

test("requestGoogleCredential times out instead of leaving login busy forever", async () => {
  const accountsId: GoogleAccountsId = {
    initialize() {},
    prompt() {},
  };

  await assert.rejects(() => requestGoogleCredential(accountsId, "client-id", 5), /timed out/);
});
