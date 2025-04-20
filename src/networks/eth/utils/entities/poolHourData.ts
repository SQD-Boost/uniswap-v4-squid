import { Pool, PoolHourData, Token } from "../../../../model";
import { MappingContext } from "../../main";
import { Log } from "../../processor";
import {
  BASE_FEE,
  MINUS_ONE_BI,
  ONE_BI,
  ZERO_BI,
} from "../constants/global.contant";
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

export const updatePreviousHourVolumePercentageChange = async (
  mctx: MappingContext,
  id: string,
  timestamp: number
) => {
  const previousHourTimestamp = timestamp - HOUR_MS;
  const previousHourDataId = getPoolHourDataId(id, previousHourTimestamp);
  const previousHourData = await mctx.store.get(
    PoolHourData,
    previousHourDataId
  );

  if (previousHourData) {
    const twoHoursAgoTimestamp = timestamp - 2 * HOUR_MS;
    const twoHoursAgoDataId = getPoolHourDataId(id, twoHoursAgoTimestamp);
    const twoHoursAgoData = await mctx.store.get(
      PoolHourData,
      twoHoursAgoDataId
    );

    if (twoHoursAgoData && twoHoursAgoData.volumeUSD > 0) {
      const previousHourPercentageChange =
        (previousHourData.volumeUSD - twoHoursAgoData.volumeUSD) /
        twoHoursAgoData.volumeUSD;

      previousHourData.volumePercentageChange = previousHourPercentageChange;

      await mctx.store.upsert(previousHourData);
    }
  }
};

export const updatePoolHourData = async (
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

  let poolHourDataId = getPoolHourDataId(id, log.block.timestamp);
  let poolHourData = await mctx.store.get(PoolHourData, poolHourDataId);
  if (!poolHourData) {
    poolHourData = createPoolHourData(
      poolHourDataId,
      poolId,
      log.block.timestamp,
      token0Price
    );

    await updatePreviousHourVolumePercentageChange(
      mctx,
      id,
      log.block.timestamp
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

  let fee0 = ZERO_BI;
  let fee1 = ZERO_BI;

  let volume0USD = 0;
  let volume1USD = 0;

  let fee0USD = 0;
  let fee1USD = 0;

  if (swappedAmount0 > ZERO_BI) {
    const token0 = await mctx.store.getOrFail(Token, pool.token0Id);

    fee0 = (swappedAmount0 * BigInt(fee)) / (BASE_FEE - BigInt(fee));

    poolHourData.volumeToken0 += swappedAmount0;
    poolHourData.volumeToken0D = convertTokenToDecimal(
      poolHourData.volumeToken0,
      pool.token0Decimals
    );
    volume0USD =
      convertTokenToDecimal(swappedAmount0, token0.decimals) * token0.price;
    fee0USD = convertTokenToDecimal(fee0, pool.token0Decimals) * token0.price;
  } else if (swappedAmount1 > ZERO_BI) {
    const token1 = await mctx.store.getOrFail(Token, pool.token1Id);

    fee1 = (swappedAmount1 * BigInt(fee)) / (BASE_FEE - BigInt(fee));
    poolHourData.volumeToken1 += swappedAmount1;
    poolHourData.volumeToken1D = convertTokenToDecimal(
      poolHourData.volumeToken1,
      pool.token1Decimals
    );
    volume1USD =
      convertTokenToDecimal(swappedAmount1, token1.decimals) * token1.price;
    fee1USD = convertTokenToDecimal(fee1, pool.token1Decimals) * token1.price;
  }

  poolHourData.collectedFeesToken0 += fee0;
  poolHourData.collectedFeesToken1 += fee1;

  const volumeUSDAdded = volume0USD + volume1USD;
  const feeUSDAdded = fee0USD + fee1USD;

  poolHourData.volumeUSD += volumeUSDAdded;
  poolHourData.collectedFeesUSD += feeUSDAdded;

  await mctx.store.upsert(poolHourData);
};
