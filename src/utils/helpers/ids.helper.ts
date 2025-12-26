import { config } from "../../main";
import { getDayIndex, getHourIndex } from "./global.helper";

export const getBundleId = () => {
  return `${config.chainId}`;
};

export const getPoolManagerId = () => {
  return `${config.chainId}-${config.poolManager}`;
};

export const getManagerId = (managerAddress: string) => {
  return `${config.chainId}-${managerAddress}`;
};

export const getWalletId = (walletAddress: string) => {
  return `${config.chainId}-${walletAddress}`;
};

export const getPositionId = (
  positionManagerAddress: string,
  nftId: bigint | number
) => {
  return `${config.chainId}-${positionManagerAddress}-${nftId}`;
};

export const getDirectPositionId = (
  poolId: string,
  sender: string,
  tickLower: number,
  tickUpper: number,
  salt: string
) => {
  return `${config.chainId}-direct-${poolId}-${sender}-${tickLower}-${tickUpper}-${salt}`;
};

export const getTokenId = (tokenAddress: string) => {
  return `${config.chainId}-${tokenAddress}`;
};
export const getHookId = (hooksAddress: string) => {
  return `${config.chainId}-${hooksAddress}`;
};
export const getPoolId = (poolAddress: string) => {
  return `${config.chainId}-${poolAddress}`;
};

export const getPoolDayDataId = (poolAddress: string, timestamp: number) => {
  let dayIndex = getDayIndex(timestamp);
  return `${config.chainId}-${poolAddress}-${dayIndex}`;
};
export const getTokenDayDataId = (tokenId: string, timestamp: number) => {
  let dayIndex = getDayIndex(timestamp);
  return `${tokenId}-${dayIndex}`;
};
export const getPoolHourDataId = (poolAddress: string, timestamp: number) => {
  let hourIndex = getHourIndex(timestamp);
  return `${config.chainId}-${poolAddress}-${hourIndex}`;
};
export const getTokenHourDataId = (tokenId: string, timestamp: number) => {
  let hourIndex = getHourIndex(timestamp);
  return `${tokenId}-${hourIndex}`;
};

export const getModifyLiquidityReccordId = (logId: String) => {
  return `${config.chainId}-${logId}`;
};

export const getSwapReccordId = (logId: String) => {
  return `${config.chainId}-${logId}`;
};
export const getDonateReccordId = (logId: String) => {
  return `${config.chainId}-${logId}`;
};
