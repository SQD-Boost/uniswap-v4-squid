export type TokenInfo = [
  address: string,
  name: string,
  symbol: string,
  decimals: number
];

export type Metadata = {
  height: number;
  hash: string;
  tokens: TokenInfo[];
};

export type NetworkConfig = {
  nftPositionManager: string;
  nftPositionManagerFirstBlock: number;
  poolManager: string;
  poolManagerFirstBlock: number;
  chainId: number;
  chainTag: string;
  nativeName: string;
  nativeSymbol: string;
  nativeDecimals: number;
  wrapNative: string;
  rpcUrl: string;
  gatewaySqdUrl: string;
  stableAddresses: string[];
  stableDecimals: Record<string, number>;
  zeroAddress: string;
  baseTokenAddresses: string[];
  bundleSourcePoolId: string;
  isNativeToken0: boolean;
  permissionRecordTx: {
    modifyLiquidity: boolean;
    swap: boolean;
    donate: boolean;
    poolhourdata: boolean;
    pooldaydata: boolean;
    tokenhourdata: boolean;
    tokendaydata: boolean;
  };
  blockIntervals: {
    poolsTvlUSD: number;
    coreTotalUSD: number;
  };
};
