import { Pool, Token } from "../../model";
import { config, MappingContext } from "../../main";
import { getPoolId } from "../helpers/ids.helper";
import { Log } from "../../processor";
import {
  BASE_FEE,
  IMPOSSIBLE_TICK,
  MINUS_ONE_BI,
  ONE_BI,
  ZERO_BI,
  ZERO_STRING,
} from "../constants/global.contant";
import {
  convertTokenToDecimal,
  getPricesFromSqrtPriceX96,
} from "../helpers/global.helper";
import { MoreThan } from "typeorm";
import { getTokenFromMapOrDb } from "../EntityManager";

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
    amount0D: ZERO_STRING,
    amount1: ZERO_BI,
    amount1D: ZERO_STRING,
    price0: token0Price,
    price1: token1Price,
    fee: fee,
    poolAddress: poolAddress,
    hookId: hookId,
    sqrtPriceX96: sqrtPriceX96,
    currentTick: tick,
    batchBlockMaximumTick: IMPOSSIBLE_TICK,
    batchBlockMinimumTick: IMPOSSIBLE_TICK,
    liquidity: ZERO_BI,
    volumeToken0: ZERO_BI,
    volumeToken0D: ZERO_STRING,
    volumeToken1: ZERO_BI,
    volumeToken1D: ZERO_STRING,
    volumeUSD: 0,
    collectedFeesToken0: ZERO_BI,
    collectedFeesToken1: ZERO_BI,
    collectedFeesUSD: 0,
    tvlUSD: 0,
    tickSpacing: tickSpacing,
    swapCount: ZERO_BI,
    chainId: config.chainId,
    blockNumber: ZERO_BI,
    timestamp: ZERO_BI,
    createdAtBlockNumber: BigInt(log.block.height),
    createdAtTimestamp: BigInt(log.block.timestamp),
  });
};

export const updatePoolStates = async (
  mctx: MappingContext,
  log: Log,
  pool: Pool,
  tick: number,
  liquidity: bigint,
  sqrtPriceX96: bigint,
  amount0: bigint,
  amount1: bigint,
  fee: number
): Promise<{ volumeUSDAdded: number; feeUSDAdded: number }> => {
  if (mctx.isHead) {
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

  let fee0 = ZERO_BI;
  let fee1 = ZERO_BI;

  let volume0USD = 0;
  let volume1USD = 0;

  let fee0USD = 0;
  let fee1USD = 0;

  if (swappedAmount0 > ZERO_BI) {
    const token0 = await getTokenFromMapOrDb(mctx.store, mctx.entities, pool.token0Id);
    if (!token0) {
      mctx.log.warn(`updatePoolStates: Token ${pool.token0Id} not found`);
      return { volumeUSDAdded: 0, feeUSDAdded: 0 };
    }

    fee0 =
      BigInt(fee) === BASE_FEE
        ? swappedAmount0
        : (swappedAmount0 * BigInt(fee)) / (BASE_FEE - BigInt(fee));
    pool.volumeToken0 += swappedAmount0;
    pool.volumeToken0D = convertTokenToDecimal(
      pool.volumeToken0,
      pool.token0Decimals
    );
    volume0USD =
      Number(convertTokenToDecimal(swappedAmount0, pool.token0Decimals)) *
      token0.price;

    fee0USD =
      Number(convertTokenToDecimal(fee0, pool.token0Decimals)) * token0.price;
  } else if (swappedAmount1 > ZERO_BI) {
    const token1 = await getTokenFromMapOrDb(mctx.store, mctx.entities, pool.token1Id);
    if (!token1) {
      mctx.log.warn(`updatePoolStates: Token ${pool.token1Id} not found`);
      return { volumeUSDAdded: 0, feeUSDAdded: 0 };
    }

    fee1 =
      BigInt(fee) === BASE_FEE
        ? swappedAmount1
        : (swappedAmount1 * BigInt(fee)) / (BASE_FEE - BigInt(fee));
    pool.volumeToken1 += swappedAmount1;
    pool.volumeToken1D = convertTokenToDecimal(
      pool.volumeToken1,
      pool.token1Decimals
    );
    volume1USD =
      Number(convertTokenToDecimal(swappedAmount1, pool.token1Decimals)) *
      token1.price;

    fee1USD =
      Number(convertTokenToDecimal(fee1, pool.token1Decimals)) * token1.price;
  }

  pool.collectedFeesToken0 += fee0;
  pool.collectedFeesToken1 += fee1;

  const volumeUSDAdded = volume0USD + volume1USD;
  const feeUSDAdded = fee0USD + fee1USD;

  pool.volumeUSD += volumeUSDAdded;
  pool.collectedFeesUSD += feeUSDAdded;

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

  return {
    volumeUSDAdded,
    feeUSDAdded,
  };
};

export async function updateAllPoolsTvlUSD(
  mctx: MappingContext,
  batchSize: number = 100
) {
  let skip = 0;
  const startTime = Date.now();

  while (true) {
    const pools = await mctx.store.find(Pool, {
      where: {
        chainId: config.chainId,
        liquidity: MoreThan(ZERO_BI),
      },
      skip: skip,
      take: batchSize,
    });

    if (pools.length === 0) {
      break;
    }

    const tokenIds = new Set<string>();
    pools.forEach((pool) => {
      tokenIds.add(pool.token0Id);
      tokenIds.add(pool.token1Id);
    });

    const tokens = await Promise.all(
      Array.from(tokenIds).map((id) => mctx.store.get(Token, id))
    );

    const tokenPriceMap = new Map<string, number>();
    tokens.forEach((token) => {
      if (token) {
        tokenPriceMap.set(token.id, token.price);
      }
    });

    for (const pool of pools) {
      const token0Price = tokenPriceMap.get(pool.token0Id) || 0;
      const token1Price = tokenPriceMap.get(pool.token1Id) || 0;

      pool.tvlUSD =
        Number(pool.amount0D) * token0Price +
        Number(pool.amount1D) * token1Price;

      await mctx.store.save(pool);
    }

    skip += batchSize;
  }

  mctx.log.info(`updateAllPoolsTvlUSD completed in ${Date.now() - startTime}ms`);
}
