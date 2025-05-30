import { Pool, TokenDayData } from "../../model";
import { config, MappingContext } from "../../main";
import { Log } from "../../processor";
import { ONE_BI, ZERO_BI } from "../constants/global.contant";
import { DAY_MS, getDayIndex } from "../helpers/global.helper";
import { getPoolId, getTokenDayDataId } from "../helpers/ids.helper";

export const createTokenDayData = (
  tokenDayDataId: string,
  tokenId: string,
  timestamp: number
) => {
  const dayIndex = getDayIndex(timestamp);

  return new TokenDayData({
    id: tokenDayDataId,
    date: new Date(dayIndex * DAY_MS),
    tokenId: tokenId,
    swapCount: ZERO_BI,
    open: -1,
    high: -1,
    low: -1,
    close: -1,
    chainId: config.chainId,
  });
};

export const incrementTokensDayDataSwapCount = async (
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

  let token0DayDataId = getTokenDayDataId(pool.token0Id, log.block.timestamp);
  let token1DayDataId = getTokenDayDataId(pool.token1Id, log.block.timestamp);

  let token0DayData = await mctx.store.get(TokenDayData, token0DayDataId);
  if (!token0DayData) {
    token0DayData = createTokenDayData(
      token0DayDataId,
      pool.token0Id,
      log.block.timestamp
    );
  }
  let token1DayData = await mctx.store.get(TokenDayData, token1DayDataId);
  if (!token1DayData) {
    token1DayData = createTokenDayData(
      token1DayDataId,
      pool.token1Id,
      log.block.timestamp
    );
  }
  token0DayData.swapCount += ONE_BI;
  token1DayData.swapCount += ONE_BI;

  await mctx.store.upsert([token0DayData, token1DayData]);
};

export const updateTokenDayData = async (
  mctx: MappingContext,
  log: Log,
  priceUpdate: {
    tokenId: string;
    price: number;
  }
) => {
  let tokenDayDataId = getTokenDayDataId(
    priceUpdate.tokenId,
    log.block.timestamp
  );

  let tokenDayData = await mctx.store.getOrFail(TokenDayData, tokenDayDataId);
  if (tokenDayData.open === -1) {
    tokenDayData.open = priceUpdate.price;
    tokenDayData.high = priceUpdate.price;
    tokenDayData.low = priceUpdate.price;
    tokenDayData.close = priceUpdate.price;
  } else {
    tokenDayData.high = Math.max(tokenDayData.high, priceUpdate.price);
    tokenDayData.low = Math.min(tokenDayData.low, priceUpdate.price);
    tokenDayData.close = priceUpdate.price;
  }
  await mctx.store.upsert(tokenDayData);
};
