import { Pool, PoolHourData, Token } from "../../../../model";
import { MappingContext } from "../../main";
import { Log } from "../../processor";
import { MINUS_ONE_BI, ONE_BI, ZERO_BI } from "../constants/global.contant";
import { CHAIN_ID } from "../constants/network.constant";
import {
  convertTokenToDecimal,
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
    volumeToken0D: 0,
    volumeToken1: ZERO_BI,
    volumeToken1D: 0,
    volumeUSD: 0,
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
    const token0 = await mctx.store.getOrFail(Token, pool.token0Id);

    poolHourData.volumeToken0 += swappedAmount0;
    poolHourData.volumeToken0D = convertTokenToDecimal(
      poolHourData.volumeToken0,
      pool.token0Decimals
    );
    poolHourData.volumeUSD +=
      convertTokenToDecimal(swappedAmount0, token0.decimals) * token0.price;
  } else if (swappedAmount1 > ZERO_BI) {
    const token1 = await mctx.store.getOrFail(Token, pool.token1Id);

    poolHourData.volumeToken1 += swappedAmount1;
    poolHourData.volumeToken1D = convertTokenToDecimal(
      poolHourData.volumeToken1,
      pool.token1Decimals
    );
    poolHourData.volumeUSD +=
      convertTokenToDecimal(swappedAmount1, token1.decimals) * token1.price;
  }

  await mctx.store.upsert(poolHourData);
};
