import { assertNotNull } from "@subsquid/util-internal";
import { NetworkConfig } from "../../types/global.type";

export const baseConfig: NetworkConfig = {
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
};
