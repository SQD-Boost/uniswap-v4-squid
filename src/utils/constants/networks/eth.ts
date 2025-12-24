import { assertNotNull } from "@subsquid/util-internal";
import { NetworkConfig } from "../../types/global.type";

export const ethConfig: NetworkConfig = {
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
};
