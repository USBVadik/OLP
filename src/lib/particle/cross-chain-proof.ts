export interface CrossChainPreviewSummary {
  rootHashPresent: boolean;
  userOpChainIds: number[];
  tokenChangeFromChains: number[];
  tokenChangeToChains: number[];
  authRequiredChainIds: number[];
  delegatedChainIds: number[];
  multiChainUserOps: boolean;
  crossChainTokenChanges: boolean;
  crossChainCandidate: boolean;
}

function uniqueNumbers(values: unknown[]): number[] {
  return Array.from(
    new Set(values.filter((value): value is number => typeof value === "number"))
  );
}

function getUserOps(transaction: any): any[] {
  return transaction?.userOps ?? transaction?.data?.userOps ?? [];
}

export function summarizeCrossChainPreview(transaction: any): CrossChainPreviewSummary {
  const userOps = getUserOps(transaction);
  const userOpChainIds = uniqueNumbers(userOps.map((op) => op?.chainId));
  const tokenChangeFromChains = uniqueNumbers(transaction?.tokenChanges?.fromChains ?? []);
  const tokenChangeToChains = uniqueNumbers(transaction?.tokenChanges?.toChains ?? []);
  const tokenChangeChainIds = uniqueNumbers([...tokenChangeFromChains, ...tokenChangeToChains]);

  const authRequiredChainIds = uniqueNumbers(
    userOps
      .filter((op) => Boolean(op?.eip7702Auth) && op?.eip7702Delegated === false)
      .map((op) => op?.chainId)
  );
  const delegatedChainIds = uniqueNumbers(
    userOps
      .filter((op) => op?.eip7702Delegated === true)
      .map((op) => op?.chainId)
  );

  const multiChainUserOps = userOpChainIds.length > 1;
  const crossChainTokenChanges = tokenChangeChainIds.length > 1;

  return {
    rootHashPresent: Boolean(transaction?.rootHash),
    userOpChainIds,
    tokenChangeFromChains,
    tokenChangeToChains,
    authRequiredChainIds,
    delegatedChainIds,
    multiChainUserOps,
    crossChainTokenChanges,
    crossChainCandidate: multiChainUserOps || crossChainTokenChanges,
  };
}

