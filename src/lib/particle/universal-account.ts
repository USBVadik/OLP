"use client";

import {
  UniversalAccount,
  CHAIN_ID,
  SUPPORTED_TOKEN_TYPE,
  UNIVERSAL_ACCOUNT_VERSION,
} from "@particle-network/universal-account-sdk";

function particleCredentials() {
  return {
    projectId: process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID!,
    projectClientKey: process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY!,
    projectAppUuid: process.env.NEXT_PUBLIC_PARTICLE_APP_ID!,
  };
}

/**
 * Legacy Smart Account mode (a separate smart-account address is derived from the
 * owner EOA). Kept for the transfer_fallback / universal_invoice paths. This is the
 * account class Particle is migrating away from in the Universal Accounts V2 upgrade.
 */
let uaInstance: UniversalAccount | null = null;
export function getUniversalAccount(ownerAddress: string): UniversalAccount {
  if (!uaInstance) {
    uaInstance = new UniversalAccount({
      ...particleCredentials(),
      ownerAddress,
    });
  }
  return uaInstance;
}

/**
 * EIP-7702 mode (default, recommended). The owner EOA itself becomes the Universal
 * Account in place after a one-time Type-4 delegation. Funds and balances are read
 * from the EOA, not a separate smart-account address.
 *
 * `version` must come from the SDK's exported UNIVERSAL_ACCOUNT_VERSION constant —
 * do not hardcode it (a wrong literal like "2.0" yields "Unsupported smart account").
 */
export function createUniversal7702Account(ownerAddress: string): UniversalAccount {
  return new UniversalAccount({
    ...particleCredentials(),
    smartAccountOptions: {
      useEIP7702: true,
      name: "UNIVERSAL",
      version: UNIVERSAL_ACCOUNT_VERSION,
      ownerAddress,
    },
    tradeConfig: {
      slippageBps: 100, // 1% slippage tolerance
      universalGas: false,
    },
  });
}

export { UniversalAccount, CHAIN_ID, SUPPORTED_TOKEN_TYPE, UNIVERSAL_ACCOUNT_VERSION };
