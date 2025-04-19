import {
  StoreWithCache,
  TypeormDatabaseWithCache,
} from "@belopash/typeorm-store";
import { ProcessorContext, processor } from "./processor";
import { TaskQueue } from "../../utils/queue";
import { initializeBundle } from "./utils/entities/bundle";
import {
  block_intervals,
  CHAIN_TAG,
  NFT_POSITION_MANAGER,
  POOL_MANAGER,
} from "./utils/constants/network.constant";
import * as nftPositionAbi from "../../abi/nftPosition";
import * as poolManagerAbi from "../../abi/poolManager";

import { handleTransferPosition } from "./mappings/positionManager";
import {
  handleDonate,
  handleInitialize,
  handleModifyLiquidity,
  handleSwap,
} from "./mappings/poolManager";
import { createNativeToken, initializeTokens } from "./utils/entities/token";
import {
  updateAllPositionsOnce,
  updateAllPositionsSwapped,
} from "./utils/entities/position";

import { createManager } from "./utils/entities/manager";
import {
  initializePoolManager,
  sumPoolAndCountPoolManager,
} from "./utils/entities/poolManager";
import { updateAllPoolsTvlUSD } from "./utils/entities/pool";

export type MappingContext = ProcessorContext<StoreWithCache> & {
  queue: TaskQueue;
};

let handleOnce = false;
let hasUpdatedPositions = false;
let lastTvlUpdateBlock = 0;

processor.run(
  new TypeormDatabaseWithCache({
    supportHotBlocks: true,
    stateSchema: `${CHAIN_TAG}_processor`,
    isolationLevel: "READ COMMITTED",
  }),
  async (ctx) => {
    if (!handleOnce) {
      await initializeBundle(ctx);
      await initializePoolManager(ctx);
      await createNativeToken(ctx);
      await initializeTokens(ctx);
      await createManager(ctx, NFT_POSITION_MANAGER);
      await ctx.store.flush();

      handleOnce = true;
    }

    const mctx: MappingContext = {
      ...ctx,
      queue: new TaskQueue(),
    };

    for (let block of mctx.blocks) {
      for (let log of block.logs) {
        if (
          log.address === NFT_POSITION_MANAGER &&
          log.topics[0] === nftPositionAbi.events.Transfer.topic
        ) {
          handleTransferPosition(mctx, log);
        } else if (log.address === POOL_MANAGER) {
          switch (log.topics[0]) {
            case poolManagerAbi.events.Initialize.topic:
              handleInitialize(mctx, log);
              break;
            case poolManagerAbi.events.ModifyLiquidity.topic:
              handleModifyLiquidity(mctx, log);
              break;
            case poolManagerAbi.events.Swap.topic:
              handleSwap(mctx, log);
              break;
            case poolManagerAbi.events.Donate.topic:
              handleDonate(mctx, log);
              break;
            default:
              break;
          }
        }
      }
    }

    mctx.queue.add(async () => {
      await sumPoolAndCountPoolManager(mctx);
    });

    if (mctx.isHead) {
      mctx.queue.add(async () => {
        if (!hasUpdatedPositions) {
          await updateAllPositionsOnce(mctx);
          console.log("Update all positions");

          hasUpdatedPositions = true;
        }
        await updateAllPositionsSwapped(mctx);

        const lastBlock = mctx.blocks[mctx.blocks.length - 1].header.height;

        if (lastBlock - lastTvlUpdateBlock >= block_intervals.poolsTvlUSD) {
          await updateAllPoolsTvlUSD(mctx);
          lastTvlUpdateBlock = lastBlock;
        }
        // update position.coreTotalUsd missing and token.tvlUsd and
      });
    }

    await mctx.queue.run();
  }
);
