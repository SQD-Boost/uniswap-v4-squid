export const NFT_POSITION_MANAGER =
  "0xbd216513d74c8cf14cf4747e6aaa6420ff64ee9e";

export const NFT_POSITION_MANAGER_FIRST_BLOCK = 21689089;

export const POOL_MANAGER = "0x000000000004444c5dc75cb358380d2e3de08a90";

export const POOL_MANAGER_FIRST_BLOCK = 21688329;

export const CHAIN_ID: number = 1;
export const CHAIN_TAG = "eth";

export const native_name = "Ether";
export const native_symbol = "ETH";
export const native_decimals = 18;

export const WRAP_NATIVE = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

export const RPC_URL = process.env.RPC_ETH_HTTP;

export const GATEWAY_SQD_URL =
  "https://v2.archive.subsquid.io/network/ethereum-mainnet";

export const BLOCK_UPDATE_ALL_POSITIONS = 22276763;

const USDC_ADDRESS = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
const USDC_DECIMALS = 6;
const USDT_ADDRESS = "0xdac17f958d2ee523a2206206994597c13d831ec7";
const USDT_DECIMALS = 6;

export const STABLE_ADDRESSES = [USDC_ADDRESS, USDT_ADDRESS];

export const STABLE_DECIMALS = {
  [USDC_ADDRESS]: USDC_DECIMALS,
  [USDT_ADDRESS]: USDT_DECIMALS,
};

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const BASE_TOKEN_ADDRESSES = [
  ...STABLE_ADDRESSES,
  WRAP_NATIVE,
  ZERO_ADDRESS,
];

export const BUNDLE_SOURCE_POOL_ID =
  "0x21c67e77068de97969ba93d4aab21826d33ca12bb9f565d8496e8fda8a82ca27";

export const IS_NATIVE_TOKEN0 = true;
