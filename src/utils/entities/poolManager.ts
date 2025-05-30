import { DataHandlerContext } from "@subsquid/evm-processor";
import { StoreWithCache } from "@belopash/typeorm-store";
import { getPoolManagerId } from "../helpers/ids.helper";
import { PoolManager } from "../../model";
import { ZERO_BI } from "../constants/global.contant";
import { config, MappingContext } from "../../main";
import * as poolManagerAbi from "../../abi/poolManager";

export const initializePoolManager = async (
  ctx: DataHandlerContext<StoreWithCache, {}>
) => {
  const poolManagerId = getPoolManagerId();
  let poolManager = await ctx.store.get(PoolManager, poolManagerId);
  if (!poolManager) {
    poolManager = new PoolManager({
      id: poolManagerId,
      poolCount: 0,
      swapCount: ZERO_BI,
      totalVolumeUSD: 0,
      totalFeesUSD: 0,
      poolManagerAddress: config.poolManager,
      chainId: config.chainId,
    });
    await ctx.store.insert(poolManager);
  }

  return poolManager;
};

export const sumPoolAndCountPoolManager = async (mctx: MappingContext) => {
  const swapCount = mctx.blocks.flatMap((block) =>
    block.logs.filter(
      (log) =>
        log.address === config.poolManager &&
        log.topics[0] === poolManagerAbi.events.Swap.topic
    )
  ).length;

  const poolCount = mctx.blocks.flatMap((block) =>
    block.logs.filter(
      (log) =>
        log.address === config.poolManager &&
        log.topics[0] === poolManagerAbi.events.Initialize.topic
    )
  ).length;

  let poolManager = await mctx.store.getOrFail(PoolManager, getPoolManagerId());

  poolManager.poolCount += poolCount;
  poolManager.swapCount += BigInt(swapCount);

  await mctx.store.upsert(poolManager);
};

export const addFeeVolumePoolManager = async (
  mctx: MappingContext,
  volumeUSDAdded: number,
  feeUSDAdded: number
) => {
  let poolManager = await mctx.store.getOrFail(PoolManager, getPoolManagerId());

  poolManager.totalVolumeUSD += volumeUSDAdded;
  poolManager.totalFeesUSD += feeUSDAdded;

  await mctx.store.upsert(poolManager);
};
