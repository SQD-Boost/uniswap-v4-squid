import { Pool, PoolDayData, Token } from "../../../../model";
import { MappingContext } from "../../main";
import { Log } from "../../processor";
import {
  BASE_FEE,
  DAY_SECONDS_MILI,
  MINUS_ONE_BI,
  ONE_BI,
  ZERO_BI,
  ZERO_STRING,
} from "../constants/global.contant";
import { CHAIN_ID } from "../constants/network.constant";
import {
  convertTokenToDecimal,
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
    volumeToken0D: ZERO_STRING,
    volumeToken1: ZERO_BI,
    volumeToken1D: ZERO_STRING,
    volumeUSD: 0,
    volumePercentageChange: 0,
    collectedFeesToken0: ZERO_BI,
    collectedFeesToken1: ZERO_BI,
    collectedFeesUSD: 0,
    swapCount: ZERO_BI,
    open: token0Price,
    high: token0Price,
    low: token0Price,
    close: token0Price,
    chainId: CHAIN_ID,
  });
};

export const updatePreviousDayVolumePercentageChange = async (
  mctx: MappingContext,
  id: string,
  timestamp: number
) => {
  const previousDayTimestamp = timestamp - DAY_SECONDS_MILI;
  const previousDayDataId = getPoolDayDataId(id, previousDayTimestamp);
  const previousDayData = await mctx.store.get(PoolDayData, previousDayDataId);

  if (previousDayData) {
    const twoDaysAgoTimestamp = timestamp - 3 * DAY_SECONDS_MILI;
    const twoDaysAgoDataId = getPoolDayDataId(id, twoDaysAgoTimestamp);

    const twoDaysAgoData = await mctx.store.get(PoolDayData, twoDaysAgoDataId);

    if (twoDaysAgoData && twoDaysAgoData.volumeUSD > 0) {
      const previousDayPercentageChange =
        (previousDayData.volumeUSD - twoDaysAgoData.volumeUSD) /
        twoDaysAgoData.volumeUSD;

      previousDayData.volumePercentageChange = previousDayPercentageChange;

      await mctx.store.upsert(previousDayData);
    }
  }
};

export const updatePoolDayData = async (
  mctx: MappingContext,
  log: Log,
  id: string,
  liquidity: bigint,
  sqrtPriceX96: bigint,
  tick: number,
  amount0: bigint,
  amount1: bigint,
  fee: number
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

    await updatePreviousDayVolumePercentageChange(
      mctx,
      id,
      log.block.timestamp
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

  let fee0 = ZERO_BI;
  let fee1 = ZERO_BI;

  let volume0USD = 0;
  let volume1USD = 0;

  let fee0USD = 0;
  let fee1USD = 0;

  if (swappedAmount0 > ZERO_BI) {
    const token0 = await mctx.store.getOrFail(Token, pool.token0Id);

    fee0 = (swappedAmount0 * BigInt(fee)) / (BASE_FEE - BigInt(fee));

    poolDayData.volumeToken0 += swappedAmount0;
    poolDayData.volumeToken0D = convertTokenToDecimal(
      poolDayData.volumeToken0,
      pool.token0Decimals
    );
    volume0USD =
      Number(convertTokenToDecimal(swappedAmount0, pool.token0Decimals)) *
      token0.price;

    fee0USD =
      Number(convertTokenToDecimal(fee0, pool.token0Decimals)) * token0.price;
  } else if (swappedAmount1 > ZERO_BI) {
    const token1 = await mctx.store.getOrFail(Token, pool.token1Id);

    fee1 = (swappedAmount1 * BigInt(fee)) / (BASE_FEE - BigInt(fee));
    poolDayData.volumeToken1 += swappedAmount1;
    poolDayData.volumeToken1D = convertTokenToDecimal(
      poolDayData.volumeToken1,
      pool.token1Decimals
    );
    volume1USD =
      Number(convertTokenToDecimal(swappedAmount1, pool.token1Decimals)) *
      token1.price;

    fee1USD =
      Number(convertTokenToDecimal(fee1, pool.token1Decimals)) * token1.price;
  }

  poolDayData.collectedFeesToken0 += fee0;
  poolDayData.collectedFeesToken1 += fee1;

  const volumeUSDAdded = volume0USD + volume1USD;
  const feeUSDAdded = fee0USD + fee1USD;

  poolDayData.volumeUSD += volumeUSDAdded;
  poolDayData.collectedFeesUSD += feeUSDAdded;

  await mctx.store.upsert(poolDayData);
};
