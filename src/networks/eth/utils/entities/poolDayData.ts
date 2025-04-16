import { Pool, PoolDayData } from "../../../../model";
import { MappingContext } from "../../main";
import { Log } from "../../processor";
import { MINUS_ONE_BI, ONE_BI, ZERO_BI } from "../constants/global.contant";
import { CHAIN_ID } from "../constants/network.constant";
import {
  DAY_MS,
  getDayIndex,
  getPricesFromSqrtPriceX96,
} from "../helpers/global.helper";
import { getPoolDayDataId, getPoolId } from "../helpers/ids.helper";

export const createPoolDayData = (
  poolDayDataId: string,
  poolId: string,
  timestamp: number,
  token0Price: number
) => {
  const dayIndex = getDayIndex(timestamp);

  return new PoolDayData({
    id: poolDayDataId,
    date: new Date(dayIndex * DAY_MS),
    poolId: poolId,
    liquidity: ZERO_BI,
    sqrtPrice: ZERO_BI,
    tick: 0,
    volumeToken0: ZERO_BI,
    volumeToken1: ZERO_BI,
    swapCount: ZERO_BI,
    open: token0Price,
    high: token0Price,
    low: token0Price,
    close: token0Price,
    chainId: CHAIN_ID,
  });
};

export const updatePoolDayData = async (
  mctx: MappingContext,
  log: Log,
  id: string,
  liquidity: bigint,
  sqrtPriceX96: bigint,
  tick: number,
  amount0: bigint,
  amount1: bigint
) => {
  let poolId = getPoolId(id);
  let pool = await mctx.store.getOrFail(Pool, poolId);

  const { token0Price } = getPricesFromSqrtPriceX96(
    sqrtPriceX96,
    pool.token0Decimals,
    pool.token1Decimals
  );

  let poolDayDataId = getPoolDayDataId(id, log.block.timestamp);
  let poolDayData = await mctx.store.get(PoolDayData, poolDayDataId);
  if (!poolDayData) {
    poolDayData = createPoolDayData(
      poolDayDataId,
      poolId,
      log.block.timestamp,
      token0Price
    );
  }
  poolDayData.swapCount += ONE_BI;
  poolDayData.liquidity = liquidity;
  poolDayData.sqrtPrice = sqrtPriceX96;
  poolDayData.tick = tick;

  poolDayData.high = Math.max(poolDayData.high, token0Price);
  poolDayData.low = Math.min(poolDayData.low, token0Price);
  poolDayData.close = token0Price;

  const swappedAmount0 = amount0 * MINUS_ONE_BI;
  const swappedAmount1 = amount1 * MINUS_ONE_BI;

  if (swappedAmount0 > ZERO_BI) {
    poolDayData.volumeToken0 += swappedAmount0;
  } else if (swappedAmount1 > ZERO_BI) {
    poolDayData.volumeToken1 += swappedAmount1;
  }

  await mctx.store.upsert(poolDayData);
};
