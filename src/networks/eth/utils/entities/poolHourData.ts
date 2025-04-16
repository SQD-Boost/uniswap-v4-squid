import { Pool, PoolHourData } from "../../../../model";
import { MappingContext } from "../../main";
import { Log } from "../../processor";
import { MINUS_ONE_BI, ONE_BI, ZERO_BI } from "../constants/global.contant";
import { CHAIN_ID } from "../constants/network.constant";
import {
  getHourIndex,
  getPricesFromSqrtPriceX96,
  HOUR_MS,
} from "../helpers/global.helper";
import { getPoolHourDataId, getPoolId } from "../helpers/ids.helper";

export const createPoolHourData = (
  poolHourDataId: string,
  poolId: string,
  timestamp: number,
  token0Price: number
) => {
  const hourIndex = getHourIndex(timestamp);

  return new PoolHourData({
    id: poolHourDataId,
    date: new Date(hourIndex * HOUR_MS),
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

export const updatePoolHourData = async (
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

  let poolHourDataId = getPoolHourDataId(id, log.block.timestamp);
  let poolHourData = await mctx.store.get(PoolHourData, poolHourDataId);
  if (!poolHourData) {
    poolHourData = createPoolHourData(
      poolHourDataId,
      poolId,
      log.block.timestamp,
      token0Price
    );
  }
  poolHourData.swapCount += ONE_BI;
  poolHourData.liquidity = liquidity;
  poolHourData.sqrtPrice = sqrtPriceX96;
  poolHourData.tick = tick;

  poolHourData.high = Math.max(poolHourData.high, token0Price);
  poolHourData.low = Math.min(poolHourData.low, token0Price);
  poolHourData.close = token0Price;

  const swappedAmount0 = amount0 * MINUS_ONE_BI;
  const swappedAmount1 = amount1 * MINUS_ONE_BI;

  if (swappedAmount0 > ZERO_BI) {
    poolHourData.volumeToken0 += swappedAmount0;
  } else if (swappedAmount1 > ZERO_BI) {
    poolHourData.volumeToken1 += swappedAmount1;
  }

  await mctx.store.upsert(poolHourData);
};
