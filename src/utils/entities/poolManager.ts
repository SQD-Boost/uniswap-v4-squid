import { DataHandlerContext } from "@subsquid/evm-processor";
import { Store } from "@subsquid/typeorm-store";
import { getPoolManagerId } from "../helpers/ids.helper";
import { PoolManager } from "../../model";
import { ZERO_BI } from "../constants/global.contant";
import { config, MappingContext } from "../../main";
import * as poolManagerAbi from "../../abi/poolManager";
import { getPoolManagerFromMapOrDb } from "../EntityManager";

export const initializePoolManager = async (
  ctx: DataHandlerContext<Store, {}>
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

  const poolManagerId = getPoolManagerId();
  let poolManager = await getPoolManagerFromMapOrDb(mctx.store, mctx.entities, poolManagerId);
  if (!poolManager) {
    console.log(`sumPoolAndCountPoolManager: PoolManager ${poolManagerId} not found`);
    return;
  }

  poolManager.poolCount += poolCount;
  poolManager.swapCount += BigInt(swapCount);
};

export const addFeeVolumePoolManager = async (
  mctx: MappingContext,
  volumeUSDAdded: number,
  feeUSDAdded: number
) => {
  const poolManagerId = getPoolManagerId();
  let poolManager = await getPoolManagerFromMapOrDb(mctx.store, mctx.entities, poolManagerId);
  if (!poolManager) {
    console.log(`addFeeVolumePoolManager: PoolManager ${poolManagerId} not found`);
    return;
  }

  poolManager.totalVolumeUSD += volumeUSDAdded;
  poolManager.totalFeesUSD += feeUSDAdded;
};
