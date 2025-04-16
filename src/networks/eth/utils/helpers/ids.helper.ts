import { CHAIN_ID, POOL_MANAGER } from "../constants/network.constant";
import { getDayIndex, getHourIndex } from "./global.helper";

export const getBundleId = () => {
  return `${CHAIN_ID}`;
};

export const getPoolManagerId = () => {
  return `${CHAIN_ID}-${POOL_MANAGER}`;
};

export const getManagerId = (managerAddress: string) => {
  return `${CHAIN_ID}-${managerAddress}`;
};

export const getWalletId = (walletAddress: string) => {
  return `${CHAIN_ID}-${walletAddress}`;
};

export const getPositionId = (
  positionManagerAddress: string,
  nftId: bigint | number
) => {
  return `${CHAIN_ID}-${positionManagerAddress}-${nftId}`;
};

export const getTokenId = (tokenAddress: string) => {
  return `${CHAIN_ID}-${tokenAddress}`;
};
export const getHookId = (hooksAddress: string) => {
  return `${CHAIN_ID}-${hooksAddress}`;
};
export const getPoolId = (poolAddress: string) => {
  return `${CHAIN_ID}-${poolAddress}`;
};

export const getPoolDayDataId = (poolAddress: string, timestamp: number) => {
  let dayIndex = getDayIndex(timestamp);
  return `${CHAIN_ID}-${poolAddress}-${dayIndex}`;
};
export const getPoolHourDataId = (poolAddress: string, timestamp: number) => {
  let hourIndex = getHourIndex(timestamp);
  return `${CHAIN_ID}-${poolAddress}-${hourIndex}`;
};
