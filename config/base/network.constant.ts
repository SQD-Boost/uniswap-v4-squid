export const NFT_POSITION_MANAGER =
  "0x7c5f5a4bbd8fd63184577525326123b519429bdc";

export const NFT_POSITION_MANAGER_FIRST_BLOCK = 25350993;

export const POOL_MANAGER = "0x498581ff718922c3f8e6a244956af099b2652b2b";

export const POOL_MANAGER_FIRST_BLOCK = 25350988;

export const CHAIN_ID: number = 8453;
export const CHAIN_TAG = "base";

export const native_name = "Ether";
export const native_symbol = "ETH";
export const native_decimals = 18;

export const WRAP_NATIVE = "0x4200000000000000000000000000000000000006";

export const RPC_URL = process.env.RPC_BASE_HTTP;

export const GATEWAY_SQD_URL =
  "https://v2.archive.subsquid.io/network/base-mainnet";

const USDC_ADDRESS = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
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
  "0x96d4b53a38337a5733179751781178a2613306063c511b78cd02684739288c0a";

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
