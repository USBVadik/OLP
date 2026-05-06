"use client";

import {
  UniversalAccount,
  CHAIN_ID,
  SUPPORTED_TOKEN_TYPE,
} from "@particle-network/universal-account-sdk";

let uaInstance: UniversalAccount | null = null;

export function getUniversalAccount(ownerAddress: string): UniversalAccount {
  if (!uaInstance) {
    uaInstance = new UniversalAccount({
      projectId: process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID!,
      projectClientKey: process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY!,
      projectAppUuid: process.env.NEXT_PUBLIC_PARTICLE_APP_ID!,
      ownerAddress,
    });
  }
  return uaInstance;
}

export { UniversalAccount, CHAIN_ID, SUPPORTED_TOKEN_TYPE };
