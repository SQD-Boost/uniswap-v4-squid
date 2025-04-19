import { Pool, Token } from "../../../../model";
import { MappingContext } from "../../main";
import { getPoolId } from "../helpers/ids.helper";
import { Log } from "../../processor";
import {
  BASE_FEE,
  IMPOSSIBLE_TICK,
  MINUS_ONE_BI,
  ONE_BI,
  ZERO_BI,
} from "../constants/global.contant";
import {
  convertTokenToDecimal,
  getPricesFromSqrtPriceX96,
} from "../helpers/global.helper";
import {
  BLOCK_UPDATE_ALL_POSITIONS,
  CHAIN_ID,
} from "../constants/network.constant";

export const createPool = (
  poolAddress: string,
  tick: number,
  sqrtPriceX96: bigint,
  fee: number,
  token0Id: string,
  token1Id: string,
  hookId: string,
  token0Price: number,
  token1Price: number,
  token0Decimals: number,
  token1Decimals: number,
  tickSpacing: number,
  log: Log
) => {
  let poolId = getPoolId(poolAddress);
  return new Pool({
    id: poolId,
    token0Id: token0Id,
    token1Id: token1Id,
    token0Decimals: token0Decimals,
    token1Decimals: token1Decimals,
    amount0: ZERO_BI,
    amount0D: 0,
    amount1: ZERO_BI,
    amount1D: 0,
    price0: token0Price,
    price1: token1Price,
    fee: fee,
    hookId: hookId,
    sqrtPriceX96: sqrtPriceX96,
    currentTick: tick,
    batchBlockMaximumTick: IMPOSSIBLE_TICK,
    batchBlockMinimumTick: IMPOSSIBLE_TICK,
    liquidity: ZERO_BI,
    volumeToken0: ZERO_BI,
    volumeToken0D: 0,
    volumeToken1: ZERO_BI,
    volumeToken1D: 0,
    volumeUSD: 0,
    collectedFeesToken0: ZERO_BI,
    collectedFeesToken1: ZERO_BI,
    collectedFeesUSD: 0,
    tvlUSD: 0,
    tickSpacing: tickSpacing,
    swapCount: ZERO_BI,
    chainId: CHAIN_ID,
    blockNumber: ZERO_BI,
    timestamp: ZERO_BI,
    createdAtBlockNumber: BigInt(log.block.height),
    createdAtTimestamp: BigInt(log.block.timestamp),
  });
};

export const updatePoolStates = async (
  mctx: MappingContext,
  log: Log,
  id: string,
  tick: number,
  liquidity: bigint,
  sqrtPriceX96: bigint,
  amount0: bigint,
  amount1: bigint,
  fee: number
): Promise<{ volumeUSDAdded: number; feeUSDAdded: number }> => {
  let poolId = getPoolId(id);
  let pool = await mctx.store.get(Pool, poolId);
  if (!pool) {
    console.log(`updatePoolStates : Pool ${poolId} not found`);
    return { volumeUSDAdded: 0, feeUSDAdded: 0 };
  }

  if (log.block.height >= BLOCK_UPDATE_ALL_POSITIONS) {
    if (
      pool.batchBlockMaximumTick === IMPOSSIBLE_TICK &&
      pool.batchBlockMinimumTick === IMPOSSIBLE_TICK
    ) {
      pool.batchBlockMaximumTick = pool.currentTick;
      pool.batchBlockMinimumTick = pool.currentTick;
    }
    pool.batchBlockMaximumTick = Math.max(pool.batchBlockMaximumTick, tick);
    pool.batchBlockMinimumTick = Math.min(pool.batchBlockMinimumTick, tick);
  }

  pool.currentTick = tick;
  pool.liquidity = liquidity;
  pool.sqrtPriceX96 = sqrtPriceX96;
  pool.swapCount += ONE_BI;

  const swappedAmount0 = amount0 * MINUS_ONE_BI;
  const swappedAmount1 = amount1 * MINUS_ONE_BI;

  // let amount0WithFee = swappedAmount0;
  // let amount1WithFee = swappedAmount1;

  // if (swappedAmount0 > BigInt(0)) {
  //   const fee0 = (swappedAmount0 * BigInt(fee)) / (BASE_FEE - BigInt(fee));
  //   amount0WithFee = swappedAmount0 - fee0;
  // } else if (swappedAmount1 > BigInt(0)) {
  //   const fee1 = (swappedAmount1 * BigInt(fee)) / (BASE_FEE - BigInt(fee));
  //   amount1WithFee = swappedAmount1 - fee1;
  // }

  let fee0 = ZERO_BI;
  let fee1 = ZERO_BI;

  let volume0USD = 0;
  let volume1USD = 0;

  let fee0USD = 0;
  let fee1USD = 0;

  if (swappedAmount0 > ZERO_BI) {
    const token0 = await mctx.store.getOrFail(Token, pool.token0Id);

    fee0 = (swappedAmount0 * BigInt(fee)) / (BASE_FEE - BigInt(fee));
    pool.volumeToken0 += swappedAmount0;
    pool.volumeToken0D = convertTokenToDecimal(
      pool.volumeToken0,
      pool.token0Decimals
    );
    volume0USD =
      convertTokenToDecimal(swappedAmount0, pool.token0Decimals) * token0.price;

    fee0USD = convertTokenToDecimal(fee0, pool.token0Decimals) * token0.price;
  } else if (swappedAmount1 > ZERO_BI) {
    const token1 = await mctx.store.getOrFail(Token, pool.token1Id);

    fee1 = (swappedAmount1 * BigInt(fee)) / (BASE_FEE - BigInt(fee));
    pool.volumeToken1 += swappedAmount1;
    pool.volumeToken1D = convertTokenToDecimal(
      pool.volumeToken1,
      pool.token1Decimals
    );
    volume1USD =
      convertTokenToDecimal(swappedAmount1, pool.token1Decimals) * token1.price;

    fee1USD = convertTokenToDecimal(fee1, pool.token1Decimals) * token1.price;
  }

  pool.collectedFeesToken0 += fee0;
  pool.collectedFeesToken1 += fee1;

  const volumeUSDAdded = volume0USD + volume1USD;
  const feeUSDAdded = fee0USD + fee1USD;

  pool.volumeUSD = volumeUSDAdded;
  pool.collectedFeesUSD = feeUSDAdded;

  pool.amount0 = pool.amount0 + swappedAmount0;
  pool.amount1 = pool.amount1 + swappedAmount1;

  pool.amount0D = convertTokenToDecimal(pool.amount0, pool.token0Decimals);
  pool.amount1D = convertTokenToDecimal(pool.amount1, pool.token1Decimals);

  const { token0Price, token1Price } = getPricesFromSqrtPriceX96(
    sqrtPriceX96,
    pool.token0Decimals,
    pool.token1Decimals
  );

  pool.price0 = token0Price;
  pool.price1 = token1Price;

  pool.blockNumber = BigInt(log.block.height);
  pool.timestamp = BigInt(log.block.timestamp);

  await mctx.store.upsert(pool);

  return {
    volumeUSDAdded,
    feeUSDAdded,
  };
};
