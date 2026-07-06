import { ethers, network } from "hardhat";

/**
 * Transfer ReceiptEmitter ownership to a DISTINCT attestor key, so the party that signs the
 * InvoicePaid attestation (the emitter owner) is no longer the same address that RECEIVES the
 * payment (the merchant). Fixes the "payee self-attests its own receipt" finding (risk-register R26).
 *
 * SAFETY: default is a DRY RUN — it reads owner() and runs every guard but sends NO transaction.
 * Re-run with CONFIRM_TRANSFER=yes to actually broadcast transferOwnership.
 *
 * Usage (run per chain; the signer is RECEIPT_EMITTER_OWNER_PRIVATE_KEY = the CURRENT owner):
 *   NEW_RECEIPT_EMITTER_OWNER=0x<newAttestor> \
 *   RECEIPT_EMITTER_OWNER_PRIVATE_KEY=0x<currentOwnerKey> \
 *   BASE_MAINNET_RPC_URL=... \
 *   corepack pnpm hardhat run scripts/transfer-receipt-emitter-owner.ts --network base
 *   # review the dry run, then re-run the same command with CONFIRM_TRANSFER=yes
 *   # repeat with --network arbitrum
 */

// Deployed ReceiptEmitter addresses (public; see docs/proof-pack.md). Override with
// RECEIPT_EMITTER_ADDRESS if you point this at a different deployment.
const RECEIPT_EMITTER_BY_CHAIN: Record<number, string> = {
  8453: "0x89CF50C01BDb8b47fc8f38AE4dB495FCCC685bC3", // Base
  42161: "0xe4C6656B6c248B20Bd2C5ddf9168A4531AAbD2A1", // Arbitrum One
};

async function main() {
  const [signer] = await ethers.getSigners();
  if (!signer) {
    throw new Error(
      "No signer — set RECEIPT_EMITTER_OWNER_PRIVATE_KEY (the CURRENT owner key) for this network.",
    );
  }

  const chainId = Number((await ethers.provider.getNetwork()).chainId);
  const emitterAddress = process.env.RECEIPT_EMITTER_ADDRESS || RECEIPT_EMITTER_BY_CHAIN[chainId];
  if (!emitterAddress) {
    throw new Error(
      `No ReceiptEmitter address known for chainId ${chainId}. Set RECEIPT_EMITTER_ADDRESS.`,
    );
  }

  const newOwnerRaw = process.env.NEW_RECEIPT_EMITTER_OWNER;
  if (!newOwnerRaw) {
    throw new Error("Set NEW_RECEIPT_EMITTER_OWNER to the new (distinct) attestor address.");
  }
  let newOwner: string;
  try {
    newOwner = ethers.getAddress(newOwnerRaw); // validates checksum + format
  } catch {
    throw new Error(`NEW_RECEIPT_EMITTER_OWNER is not a valid address: ${newOwnerRaw}`);
  }

  const emitter = await ethers.getContractAt("ReceiptEmitter", emitterAddress);
  const currentOwner: string = await emitter.owner();

  console.log("— ReceiptEmitter ownership transfer —");
  console.log(`Network:        ${network.name} (chainId ${chainId})`);
  console.log(`ReceiptEmitter: ${emitterAddress}`);
  console.log(`Current owner:  ${currentOwner}`);
  console.log(`Signer:         ${signer.address}`);
  console.log(`New owner:      ${newOwner}`);

  // --- Guards (fail closed) ---
  if (signer.address.toLowerCase() !== currentOwner.toLowerCase()) {
    throw new Error(
      `Signer (${signer.address}) is NOT the current owner (${currentOwner}). ` +
        "Set RECEIPT_EMITTER_OWNER_PRIVATE_KEY to the current owner's key for this network.",
    );
  }
  if (newOwner === ethers.ZeroAddress) {
    throw new Error("New owner is the zero address — that would renounce control. Aborting.");
  }
  if (newOwner.toLowerCase() === currentOwner.toLowerCase()) {
    throw new Error(
      "New owner equals the current owner — no split. Use a DISTINCT attestor address " +
        "(and it must differ from the merchant payee).",
    );
  }

  if (process.env.CONFIRM_TRANSFER !== "yes") {
    console.log(
      "\nDRY RUN — all guards passed, NO transaction sent.\n" +
        "Re-run with CONFIRM_TRANSFER=yes to broadcast transferOwnership on this network.",
    );
    return;
  }

  console.log("\nBroadcasting transferOwnership…");
  const tx = await emitter.transferOwnership(newOwner);
  console.log(`tx hash: ${tx.hash}`);
  await tx.wait();

  const confirmedOwner: string = await emitter.owner();
  console.log(`Post-transfer on-chain owner: ${confirmedOwner}`);
  if (confirmedOwner.toLowerCase() !== newOwner.toLowerCase()) {
    throw new Error("owner() after transfer does not match the new owner — investigate before proceeding.");
  }
  console.log("✓ Ownership transferred — attestor is now distinct from the merchant payee.");
  console.log(
    "NEXT (do promptly): set RECEIPT_EMITTER_OWNER_PRIVATE_KEY to the NEW owner key (local + Vercel) " +
      "and redeploy — after this transfer the OLD key can no longer register/record.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
