import { assertNotNull } from "@subsquid/util-internal";
import { NetworkConfig } from "../../types/global.type";

export const uniConfig: NetworkConfig = {
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
};
