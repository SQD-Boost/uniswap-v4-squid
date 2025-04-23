export const NFT_POSITION_MANAGER =
  "0x4529a01c7a0410167c5740c487a8de60232617bf";

export const NFT_POSITION_MANAGER_FIRST_BLOCK = 6819679;

export const POOL_MANAGER = "0x1f98400000000000000000000000000000000004";

export const POOL_MANAGER_FIRST_BLOCK = 1;

export const CHAIN_ID: number = 130;
export const CHAIN_TAG = "uni";

export const native_name = "Ether";
export const native_symbol = "ETH";
export const native_decimals = 18;

export const WRAP_NATIVE = "0x4200000000000000000000000000000000000006";

export const RPC_URL = process.env.RPC_UNI_HTTP;

export const GATEWAY_SQD_URL =
  "https://v2.archive.subsquid.io/network/unichain-mainnet";

const USDC_ADDRESS = "0x078d782b760474a361dda0af3839290b0ef57ad6";

const USDC_DECIMALS = 6;

export const STABLE_ADDRESSES = [USDC_ADDRESS];

export const STABLE_DECIMALS = {
  [USDC_ADDRESS]: USDC_DECIMALS,
};

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const BASE_TOKEN_ADDRESSES = [
  ...STABLE_ADDRESSES,
  WRAP_NATIVE,
  ZERO_ADDRESS,
];

export const BUNDLE_SOURCE_POOL_ID =
  "0x25939956ef14a098d95051d86c75890cfd623a9eeba055e46d8dd9135980b37c";

export const IS_NATIVE_TOKEN0 = true;

export const permissionReccordTx = {
  modifyLiquidity: false,
  swap: false,
  donate: false,
  poolhourdata: false,
  pooldaydata: false,
  tokenhourdata: false,
  tokendaydata: false,
};

export const block_intervals = {
  poolsTvlUSD: 50,
  coreTotalUSD: 75,
};
