import { Pool, TokenHourData } from "../../../../model";
import { MappingContext } from "../../main";
import { Log } from "../../processor";
import { ONE_BI, ZERO_BI } from "../constants/global.contant";
import { CHAIN_ID } from "../constants/network.constant";
import { getHourIndex, HOUR_MS } from "../helpers/global.helper";
import { getPoolId, getTokenHourDataId } from "../helpers/ids.helper";

export const createTokenHourData = (
  tokenHourDataId: string,
  tokenId: string,
  timestamp: number
) => {
  const hourIndex = getHourIndex(timestamp);

  return new TokenHourData({
    id: tokenHourDataId,
    date: new Date(hourIndex * HOUR_MS),
    tokenId: tokenId,
    swapCount: ZERO_BI,
    open: -1,
    high: -1,
    low: -1,
    close: -1,
    chainId: CHAIN_ID,
  });
};

export const incrementTokensHourDataSwapCount = async (
  mctx: MappingContext,
  log: Log,
  id: string
) => {
  let poolId = getPoolId(id);
  let pool = await mctx.store.get(Pool, poolId);
  if (!pool) {
    console.log(`updatePoolStates : Pool ${poolId} not found`);
    return;
  }

  let token0HourDataId = getTokenHourDataId(pool.token0Id, log.block.timestamp);
  let token1HourDataId = getTokenHourDataId(pool.token1Id, log.block.timestamp);

  let token0HourData = await mctx.store.get(TokenHourData, token0HourDataId);
  if (!token0HourData) {
    token0HourData = createTokenHourData(
      token0HourDataId,
      pool.token0Id,
      log.block.timestamp
    );
  }
  let token1HourData = await mctx.store.get(TokenHourData, token1HourDataId);
  if (!token1HourData) {
    token1HourData = createTokenHourData(
      token1HourDataId,
      pool.token1Id,
      log.block.timestamp
    );
  }
  token0HourData.swapCount += ONE_BI;
  token1HourData.swapCount += ONE_BI;

  await mctx.store.upsert([token0HourData, token1HourData]);
};

export const updateTokenHourData = async (
  mctx: MappingContext,
  log: Log,
  priceUpdate: {
    tokenId: string;
    price: number;
  }
) => {
  let tokenHourDataId = getTokenHourDataId(
    priceUpdate.tokenId,
    log.block.timestamp
  );

  let tokenHourData = await mctx.store.getOrFail(
    TokenHourData,
    tokenHourDataId
  );
  if (tokenHourData.open === -1) {
    tokenHourData.open = priceUpdate.price;
    tokenHourData.high = priceUpdate.price;
    tokenHourData.low = priceUpdate.price;
    tokenHourData.close = priceUpdate.price;
  } else {
    tokenHourData.high = Math.max(tokenHourData.high, priceUpdate.price);
    tokenHourData.low = Math.min(tokenHourData.low, priceUpdate.price);
    tokenHourData.close = priceUpdate.price;
  }
  await mctx.store.upsert(tokenHourData);
};
