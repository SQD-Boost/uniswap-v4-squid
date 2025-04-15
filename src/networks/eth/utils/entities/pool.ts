import { Pool } from "../../../../model";
import { MappingContext } from "../../main";
import { getPoolId } from "../helpers/ids.helper";
import { Log } from "../../processor";
import {
  BASE_FEE,
  IMPOSSIBLE_TICK,
  MINUS_ONE_BI,
} from "../constants/global.contant";
import { getPricesFromSqrtPriceX96 } from "../helpers/global.helper";
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
  token1Decimals: number
) => {
  let poolId = getPoolId(poolAddress);
  return new Pool({
    id: poolId,
    token0Id: token0Id,
    token1Id: token1Id,
    token0Decimals: token0Decimals,
    token1Decimals: token1Decimals,
    amount0: BigInt(0),
    amount1: BigInt(0),
    price0: token0Price,
    price1: token1Price,
    fee: fee,
    hookId: hookId,
    sqrtPriceX96: sqrtPriceX96,
    currentTick: tick,
    batchBlockMaximumTick: IMPOSSIBLE_TICK,
    batchBlockMinimumTick: IMPOSSIBLE_TICK,
    liquidity: BigInt(0),
    chainId: CHAIN_ID,
    blockNumber: BigInt(0),
    timestamp: BigInt(0),
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
) => {
  let poolId = getPoolId(id);
  let pool = await mctx.store.get(Pool, poolId);
  if (!pool) {
    console.log(`updatePoolStates : Pool ${poolId} not found`);
    return;
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

  pool.amount0 = pool.amount0 + swappedAmount0;
  pool.amount1 = pool.amount1 + swappedAmount1;

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
};
