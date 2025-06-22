import { assertNotNull } from "@subsquid/util-internal";

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

export const networksConfigs: Record<string, NetworkConfig> = {
  uni: {
    nftPositionManager: "0x4529a01c7a0410167c5740c487a8de60232617bf",
    nftPositionManagerFirstBlock: 6819679,
    poolManager: "0x1f98400000000000000000000000000000000004",
    poolManagerFirstBlock: 1,
    chainId: 130,
    chainTag: "uni",
    nativeName: "Ether",
    nativeSymbol: "ETH",
    nativeDecimals: 18,
    wrapNative: "0x4200000000000000000000000000000000000006",
    rpcUrl: assertNotNull(
      process.env.RPC_UNICHAIN_HTTP,
      "No UNI RPC endpoint supplied via env.RPC_UNI_HTTP"
    ),
    gatewaySqdUrl: "https://v2.archive.subsquid.io/network/unichain-mainnet",
    stableAddresses: ["0x078d782b760474a361dda0af3839290b0ef57ad6"],
    stableDecimals: {
      "0x078d782b760474a361dda0af3839290b0ef57ad6": 6,
    },
    zeroAddress: "0x0000000000000000000000000000000000000000",
    get baseTokenAddresses() {
      return [...this.stableAddresses, this.wrapNative, this.zeroAddress];
    },
    bundleSourcePoolId:
      "0x25939956ef14a098d95051d86c75890cfd623a9eeba055e46d8dd9135980b37c",
    isNativeToken0: true,
    permissionRecordTx: {
      modifyLiquidity: false,
      swap: false,
      donate: false,
      poolhourdata: false,
      pooldaydata: false,
      tokenhourdata: false,
      tokendaydata: false,
    },
    blockIntervals: {
      poolsTvlUSD: 50,
      coreTotalUSD: 75,
    },
  },

  eth: {
    nftPositionManager: "0xbd216513d74c8cf14cf4747e6aaa6420ff64ee9e",
    nftPositionManagerFirstBlock: 21689089,
    poolManager: "0x000000000004444c5dc75cb358380d2e3de08a90",
    poolManagerFirstBlock: 21688329,
    chainId: 1,
    chainTag: "eth",
    nativeName: "Ether",
    nativeSymbol: "ETH",
    nativeDecimals: 18,
    wrapNative: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    rpcUrl: assertNotNull(
      process.env.RPC_ETH_HTTP,
      "No ETH RPC endpoint supplied via env.RPC_ETH_HTTP"
    ),
    gatewaySqdUrl: "https://v2.archive.subsquid.io/network/ethereum-mainnet",
    stableAddresses: [
      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // USDC
      "0xdac17f958d2ee523a2206206994597c13d831ec7", // USDT
    ],
    stableDecimals: {
      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": 6, // USDC
      "0xdac17f958d2ee523a2206206994597c13d831ec7": 6, // USDT
    },
    zeroAddress: "0x0000000000000000000000000000000000000000",
    get baseTokenAddresses() {
      return [...this.stableAddresses, this.wrapNative, this.zeroAddress];
    },
    bundleSourcePoolId:
      "0x21c67e77068de97969ba93d4aab21826d33ca12bb9f565d8496e8fda8a82ca27",
    isNativeToken0: true,
    permissionRecordTx: {
      modifyLiquidity: false,
      swap: false,
      donate: false,
      poolhourdata: false,
      pooldaydata: false,
      tokenhourdata: false,
      tokendaydata: false,
    },
    blockIntervals: {
      poolsTvlUSD: 10,
      coreTotalUSD: 15,
    },
  },

  base: {
    nftPositionManager: "0x7c5f5a4bbd8fd63184577525326123b519429bdc",
    nftPositionManagerFirstBlock: 25350993,
    poolManager: "0x498581ff718922c3f8e6a244956af099b2652b2b",
    poolManagerFirstBlock: 25350988,
    chainId: 8453,
    chainTag: "base",
    nativeName: "Ether",
    nativeSymbol: "ETH",
    nativeDecimals: 18,
    wrapNative: "0x4200000000000000000000000000000000000006",
    rpcUrl: assertNotNull(
      process.env.RPC_BASE_HTTP,
      "No BASE RPC endpoint supplied via env.RPC_BASE_HTTP"
    ),
    gatewaySqdUrl: "https://v2.archive.subsquid.io/network/base-mainnet",
    stableAddresses: ["0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"], // USDC
    stableDecimals: {
      "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": 6, // USDC
    },
    zeroAddress: "0x0000000000000000000000000000000000000000",
    get baseTokenAddresses() {
      return [...this.stableAddresses, this.wrapNative, this.zeroAddress];
    },
    bundleSourcePoolId:
      "0x96d4b53a38337a5733179751781178a2613306063c511b78cd02684739288c0a",
    isNativeToken0: true,
    permissionRecordTx: {
      modifyLiquidity: false,
      swap: false,
      donate: false,
      poolhourdata: false,
      pooldaydata: false,
      tokenhourdata: false,
      tokendaydata: false,
    },
    blockIntervals: {
      poolsTvlUSD: 50,
      coreTotalUSD: 75,
    },
  },
};

// Helper function to get config for a specific chain
export function getNetworkConfig(chainTag: string): NetworkConfig {
  const config = networksConfigs[chainTag];
  if (!config) {
    throw new Error(`Chain configuration not found for: ${chainTag}`);
  }
  return config;
}

// Export individual configs for backward compatibility if needed
export const uniConfig = networksConfigs.uni;
export const ethConfig = networksConfigs.eth;
export const baseConfig = networksConfigs.base;
