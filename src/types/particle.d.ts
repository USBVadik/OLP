declare module "@particle-network/universal-account-sdk" {
  export interface ISmartAccountOptions {
    name: string;
    version: string;
    ownerAddress: string;
    smartAccountAddress?: string;
    useEIP7702?: boolean;
    options?: any;
  }

  export interface IUniversalAccountConfig {
    projectId: string;
    projectClientKey: string;
    projectAppUuid: string;
    smartAccountOptions?: ISmartAccountOptions;
    tradeConfig?: any;
    rpcUrl?: string;
    ownerAddress?: string;
  }

  export interface IBasicToken {
    chainId: number;
    address: string;
  }

  export interface IExpectToken {
    type: SUPPORTED_TOKEN_TYPE;
    amount: string;
  }

  export interface EVMTransaction {
    to: string;
    data: string;
    value?: string;
  }

  export interface IUniversalTransaction {
    chainId: number;
    expectTokens: IExpectToken[];
    transactions: EVMTransaction[];
  }

  export interface ITransaction {
    [key: string]: any;
  }

  export interface IAssetsResponse {
    [key: string]: any;
  }

  export class UniversalAccount {
    constructor(config: IUniversalAccountConfig);
    getPrimaryAssets(): Promise<IAssetsResponse>;
    createUniversalTransaction(payload: IUniversalTransaction, tradeConfig?: any): Promise<ITransaction>;
    createTransferTransaction(payload: { token: IBasicToken; amount: string; receiver: string }): Promise<ITransaction>;
    sendTransaction(transaction: ITransaction, signature: string, authorizations?: any[]): Promise<any>;
    getSmartAccountOptions(): Promise<ISmartAccountOptions>;
    getTransaction(transactionId: string): Promise<any>;
    getEIP7702Deployments(): Promise<any>;
    getEIP7702Auth(chainIds: number[]): Promise<any>;
  }

  export enum CHAIN_ID {
    SOLANA_MAINNET = 101,
    ETHEREUM_MAINNET = 1,
    BSC_MAINNET = 56,
    BASE_MAINNET = 8453,
    ARBITRUM_MAINNET_ONE = 42161,
    OPTIMISM_MAINNET = 10,
    POLYGON_MAINNET = 137,
  }

  export enum SUPPORTED_TOKEN_TYPE {
    ETH = "eth",
    USDT = "usdt",
    USDC = "usdc",
    BTC = "btc",
    BNB = "bnb",
    SOL = "sol",
  }
}
