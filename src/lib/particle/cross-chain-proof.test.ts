import assert from "node:assert/strict";
import test from "node:test";
import { summarizeCrossChainPreview } from "./cross-chain-proof";

test("classifies multi-chain userOps as cross-chain proof candidate", () => {
  const summary = summarizeCrossChainPreview({
    rootHash: "0xroot",
    userOps: [
      { chainId: 8453, eip7702Delegated: true },
      {
        chainId: 42161,
        eip7702Delegated: false,
        eip7702Auth: { address: "0xdelegate", chainId: 0, nonce: 0 },
      },
    ],
    tokenChanges: {
      fromChains: [42161],
      toChains: [42161],
    },
  });

  assert.equal(summary.rootHashPresent, true);
  assert.deepEqual(summary.userOpChainIds, [8453, 42161]);
  assert.deepEqual(summary.authRequiredChainIds, [42161]);
  assert.deepEqual(summary.delegatedChainIds, [8453]);
  assert.equal(summary.multiChainUserOps, true);
  assert.equal(summary.crossChainCandidate, true);
});

test("does not classify same-chain token change as cross-chain proof candidate", () => {
  const summary = summarizeCrossChainPreview({
    rootHash: "0xroot",
    userOps: [{ chainId: 8453, eip7702Delegated: true }],
    tokenChanges: {
      fromChains: [8453],
      toChains: [8453],
    },
  });

  assert.equal(summary.multiChainUserOps, false);
  assert.equal(summary.crossChainTokenChanges, false);
  assert.equal(summary.crossChainCandidate, false);
});

