import {
  LessThan,
  LessThanOrEqual,
  MoreThan,
  MoreThanOrEqual,
  Not,
} from "typeorm";
import { Pool, Position } from "../../../../model";
import { MappingContext } from "../../main";
import { Log } from "../../processor";
import { IMPOSSIBLE_TICK, ZERO_BI } from "../constants/global.contant";
import { CHAIN_ID, NFT_POSITION_MANAGER } from "../constants/network.constant";
import { getAmount0, getAmount1, getAmounts } from "../helpers/global.helper";
import { getManagerId, getPoolId, getPositionId } from "../helpers/ids.helper";

export const createPositionUpdateOwner = (log: Log, nftId: bigint) => {
  const positionId = getPositionId(log.address, nftId);

  const position = new Position({
    id: positionId,
    nftId: nftId,
    lowerTick: 0,
    upperTick: 0,
    liquidity: ZERO_BI,
    amount0: ZERO_BI,
    amount1: ZERO_BI,
    coreTotalUSD: 0,
    managerId: getManagerId(log.address),
    chainId: CHAIN_ID,
    blockNumber: BigInt(log.block.height),
    timestamp: BigInt(log.block.timestamp),
  });
  return position;
};

export const updatePositionAndPool = async (
  mctx: MappingContext,
  log: Log,
  id: string,
  liquidityDelta: bigint,
  salt: string,
  tickLower: number,
  tickUpper: number
) => {
  const nftId = parseInt(salt, 16);
  let positionId = getPositionId(NFT_POSITION_MANAGER, nftId);
  let poolId = getPoolId(id);

  if (liquidityDelta === ZERO_BI) {
    return;
  }

  let pool = await mctx.store.get(Pool, poolId);
  if (pool) {
    if (
      pool.currentTick !== null &&
      tickLower < pool.currentTick &&
      tickUpper > pool.currentTick
    ) {
      pool.liquidity = pool.liquidity + liquidityDelta;
    }

    const amount0Raw = getAmount0(
      tickLower,
      tickUpper,
      pool.currentTick,
      liquidityDelta,
      pool.sqrtPriceX96
    );
    const amount1Raw = getAmount1(
      tickLower,
      tickUpper,
      pool.currentTick,
      liquidityDelta,
      pool.sqrtPriceX96
    );

    pool.amount0 = pool.amount0 + BigInt(amount0Raw);
    pool.amount1 = pool.amount1 + BigInt(amount1Raw);

    await mctx.store.upsert(pool);
  }

  let position = await mctx.store.get(Position, positionId);
  if (!position) {
    // console.log(
    //   `updatePositionAndPool : position ${positionId} not found hash : ${log.transaction?.hash}`
    // );
    return;
  }

  position.poolId = poolId;
  position.liquidity = position.liquidity + liquidityDelta;
  position.lowerTick = tickLower;
  position.upperTick = tickUpper;

  if (pool) {
    const { amount0, amount1 } = getAmounts(
      Number(position.liquidity),
      Number(pool.sqrtPriceX96),
      tickLower,
      tickUpper
    );

    position.amount0 = BigInt(Math.floor(amount0));
    position.amount1 = BigInt(Math.floor(amount1));
    position.token0Id = pool.token0Id;
    position.token1Id = pool.token1Id;

    const ratio = getPositionRatio(
      position.amount0,
      position.amount1,
      pool.price1,
      pool.token0Decimals,
      pool.token1Decimals
    );
    position.ratio = ratio;
  }

  position.blockNumber = BigInt(log.block.height);
  position.timestamp = BigInt(log.block.timestamp);
  await mctx.store.upsert(position);
};

export const getPositionRatio = (
  amount0: bigint,
  amount1: bigint,
  token1Price: number,
  token0Decimals: number,
  token1Decimals: number
) => {
  const amount0InBase = (Number(amount0) / 10 ** token0Decimals) * token1Price;
  const amount1base = Number(amount1) / 10 ** token1Decimals;

  if (amount0InBase === 0) {
    return 0;
  }

  return amount0InBase / (amount0InBase + amount1base);
};

export const updateAllPositionsOnce = async (mctx: MappingContext) => {
  const pools = await mctx.store.find(Pool, {
    where: {
      chainId: CHAIN_ID,
    },
  });

  for (let i = 0; i < pools.length; i++) {
    const pool = pools[i];
    const positions = await mctx.store.find(Position, {
      where: {
        poolId: pool.id,
        liquidity: MoreThan(ZERO_BI),
      },
    });

    for (let i = 0; i < positions.length; i++) {
      const position = positions[i];
      const { amount0, amount1 } = getAmounts(
        Number(position.liquidity),
        Number(pool.sqrtPriceX96),
        position.lowerTick,
        position.upperTick
      );

      position.amount0 = BigInt(Math.floor(amount0));
      position.amount1 = BigInt(Math.floor(amount1));

      const ratio = getPositionRatio(
        position.amount0,
        position.amount1,
        pool.price1,
        pool.token0Decimals,
        pool.token1Decimals
      );
      position.ratio = ratio;
    }
    await mctx.store.save(positions);
  }
};

export const updateAllPositionsSwapped = async (mctx: MappingContext) => {
  const pools = await mctx.store.find(Pool, {
    where: [
      {
        batchBlockMaximumTick: Not(IMPOSSIBLE_TICK),
        batchBlockMinimumTick: Not(IMPOSSIBLE_TICK),
        chainId: CHAIN_ID,
      },
    ],
  });

  for (let i = 0; i < pools.length; i++) {
    const pool = pools[i];
    const positions = await mctx.store.find(Position, {
      where: [
        {
          poolId: pool.id,
          liquidity: MoreThan(ZERO_BI),
          lowerTick: LessThanOrEqual(pool.batchBlockMaximumTick),
          upperTick: MoreThanOrEqual(pool.batchBlockMinimumTick),
        },
        {
          poolId: pool.id,
          liquidity: MoreThan(ZERO_BI),
          lowerTick: LessThanOrEqual(pool.batchBlockMaximumTick),
          upperTick: MoreThan(pool.batchBlockMaximumTick),
        },
        {
          poolId: pool.id,
          liquidity: MoreThan(ZERO_BI),
          lowerTick: LessThan(pool.batchBlockMinimumTick),
          upperTick: MoreThanOrEqual(pool.batchBlockMinimumTick),
        },
        {
          poolId: pool.id,
          liquidity: MoreThan(ZERO_BI),
          lowerTick: MoreThanOrEqual(pool.batchBlockMinimumTick),
          upperTick: LessThanOrEqual(pool.batchBlockMaximumTick),
        },
      ],
    });

    for (let i = 0; i < positions.length; i++) {
      const position = positions[i];
      const { amount0, amount1 } = getAmounts(
        Number(position.liquidity),
        Number(pool.sqrtPriceX96),
        position.lowerTick,
        position.upperTick
      );

      position.amount0 = BigInt(Math.floor(amount0));
      position.amount1 = BigInt(Math.floor(amount1));

      const ratio = getPositionRatio(
        position.amount0,
        position.amount1,
        pool.price1,
        pool.token0Decimals,
        pool.token1Decimals
      );
      position.ratio = ratio;
    }
    await mctx.store.save(positions);

    pool.batchBlockMaximumTick = IMPOSSIBLE_TICK;
    pool.batchBlockMinimumTick = IMPOSSIBLE_TICK;
  }

  await mctx.store.upsert(pools);
};
