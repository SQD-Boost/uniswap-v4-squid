import { Store, TypeormDatabase } from "@subsquid/typeorm-store";
import { ProcessorContext, makeProcessor } from "./processor";
import { EntityManager } from "./utils/EntityManager";
import { initializeBundle } from "./utils/entities/bundle";
import * as nftPositionAbi from "./abi/nftPosition";
import * as poolManagerAbi from "./abi/poolManager";
import { handleTransferPosition } from "./mappings/positionManager";
import {
  handleDonate,
  handleInitialize,
  handleModifyLiquidity,
  handleSwap,
} from "./mappings/poolManager";
import { createNativeToken, initializeTokens } from "./utils/entities/token";
import {
  updateAllPositionsCoreTotalUSD,
  updateAllPositionsOnce,
  updateAllPositionsSwapped,
} from "./utils/entities/position";
import { createManager } from "./utils/entities/manager";
import {
  initializePoolManager,
  sumPoolAndCountPoolManager,
} from "./utils/entities/poolManager";
import { updateAllPoolsTvlUSD } from "./utils/entities/pool";
import assert from "assert";
import { networksConfigs } from "./utils/constants/network.constant";
import { loadPreloadedTokensMetadata } from "./utils/helpers/metadata.helper";

export type MappingContext = ProcessorContext<Store> & {
  entities: EntityManager;
};

assert(
  networksConfigs.hasOwnProperty(process.argv[2]),
  `Processor executable takes one argument - a network string ID - ` +
    `that must be in ${JSON.stringify(Object.keys(networksConfigs))}. Got "${
      process.argv[2]
    }".`
);

const network = process.argv[2];
export const config = networksConfigs[network];

let preloadedTokensMetadata = loadPreloadedTokensMetadata(config.chainTag);

const processor = makeProcessor(config);

const database = new TypeormDatabase({
  supportHotBlocks: true,
  stateSchema: `${config.chainTag}_processor`,
  isolationLevel: "READ COMMITTED",
});

let handleOnce = false;
let hasUpdatedPositions = false;
let lastTvlUpdateBlock = 0;
let coreTotalUSDUpdateBlock = 0;

processor.run(database, async (ctx) => {
  if (!handleOnce) {
    await initializeBundle(ctx);
    await initializePoolManager(ctx);
    await createNativeToken(ctx);
    await initializeTokens(ctx, preloadedTokensMetadata!);
    await createManager(ctx, config.nftPositionManager);

    preloadedTokensMetadata = null;
    if (global.gc) {
      global.gc();
    }

    handleOnce = true;
  }

  const mctx: MappingContext = {
    ...ctx,
    entities: new EntityManager(),
  };

  for (let block of mctx.blocks) {
    for (let log of block.logs) {
      if (
        log.address === config.nftPositionManager &&
        log.topics[0] === nftPositionAbi.events.Transfer.topic
      ) {
        await handleTransferPosition(mctx, log);
      } else if (log.address === config.poolManager) {
        switch (log.topics[0]) {
          case poolManagerAbi.events.Initialize.topic:
            await handleInitialize(mctx, log);
            break;
          case poolManagerAbi.events.ModifyLiquidity.topic:
            await handleModifyLiquidity(mctx, log);
            break;
          case poolManagerAbi.events.Swap.topic:
            await handleSwap(mctx, log);
            break;
          case poolManagerAbi.events.Donate.topic:
            await handleDonate(mctx, log);
            break;
          default:
            break;
        }
      }
    }
  }

  await sumPoolAndCountPoolManager(mctx);

  await mctx.entities.upsertAll(mctx.store);

  if (mctx.isHead) {
    if (!hasUpdatedPositions) {
      await updateAllPositionsOnce(mctx);
      ctx.log.info("Update all positions");

      hasUpdatedPositions = true;
    }
    await updateAllPositionsSwapped(mctx);

    const lastBlock = mctx.blocks[mctx.blocks.length - 1].header.height;

    if (lastBlock - lastTvlUpdateBlock >= config.blockIntervals.poolsTvlUSD) {
      await updateAllPoolsTvlUSD(mctx);
      lastTvlUpdateBlock = lastBlock;
    }
    if (
      lastBlock - coreTotalUSDUpdateBlock >=
      config.blockIntervals.coreTotalUSD
    ) {
      await updateAllPositionsCoreTotalUSD(mctx);
      coreTotalUSDUpdateBlock = lastBlock;
    }
  }
});
