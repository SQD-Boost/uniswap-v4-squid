import { EvmBatchProcessor } from "@subsquid/evm-processor";
import { Database, LocalDest } from "@subsquid/file-store";
import { networksConfigs } from "../utils/constants/network.constant";
import * as poolManagerAbi from "../abi/poolManager";
import { ZERO_ADDRESS } from "../utils/constants/global.contant";
import assert from "assert";
import { fetchTokensMetadata } from "../utils/helpers/viem.helper";
import { Metadata, TokenInfo } from "../utils/types/global.type";

assert(
  networksConfigs.hasOwnProperty(process.argv[2]),
  `Processor executable takes one argument - a network string ID - ` +
    `that must be in ${JSON.stringify(Object.keys(networksConfigs))}. Got "${
      process.argv[2]
    }".`
);

const network = process.argv[2];
const config = networksConfigs[network];

const processor = new EvmBatchProcessor()
  .setGateway(config.gatewaySqdUrl)
  .setRpcEndpoint({
    url: config.rpcUrl,
  })
  .setBlockRange({
    from: config.poolManagerFirstBlock,
  })
  .setFields({
    log: {
      topics: true,
      transactionHash: true,
      data: true,
    },
  })
  .addLog({
    address: [config.poolManager],
    topic0: [poolManagerAbi.events.Initialize.topic],
  })
  .setFinalityConfirmation(75);

let tokensSet = new Set<string>();
let tokens: TokenInfo[] = [];

let tokensInitialized = false;
let tokensReady = false;

let db = new Database({
  tables: {},
  dest: new LocalDest(`./assets/${config.chainTag}`),
  chunkSizeMb: Infinity,
  hooks: {
    async onStateRead(dest) {
      if (await dest.exists("tokens.json")) {
        let {
          height,
          hash,
          tokens: retrievedTokens,
        }: Metadata = await dest.readFile("tokens.json").then(JSON.parse);
        if (!tokensInitialized) {
          tokens = retrievedTokens;
          tokensSet = new Set(retrievedTokens.map((token) => token[0]));
          tokensInitialized = true;
        }
        return { height, hash };
      } else {
        return undefined;
      }
    },
    async onStateUpdate(dest, info) {
      let metadata: Metadata = {
        ...info,
        tokens,
      };
      await dest.writeFile("tokens.json", JSON.stringify(metadata));
    },
  },
});

async function addUniqueTokens(tokenAddresses: string[]) {
  const normalizedAddresses = tokenAddresses
    .map((addr) => addr.toLowerCase())
    .filter((addr) => addr !== ZERO_ADDRESS)
    .filter((addr) => {
      if (tokensSet.has(addr)) {
        return false;
      }
      tokensSet.add(addr);
      return true;
    });

  if (normalizedAddresses.length === 0) {
    return;
  }

  const metadataResults = await fetchTokensMetadata(
    normalizedAddresses,
    config.chainId,
    config.rpcUrl
  );

  metadataResults.forEach((metadata, index) => {
    tokens.push([
      normalizedAddresses[index],
      metadata.name,
      metadata.symbol,
      metadata.decimals,
    ]);
  });
}

processor.run(db, async (ctx) => {
  if (tokensReady) process.exit();
  if (ctx.isHead) tokensReady = true;

  const promises = [];
  for (let c of ctx.blocks) {
    for (let log of c.logs) {
      if (log.address === config.poolManager) {
        try {
          let { currency0, currency1 } =
            poolManagerAbi.events.Initialize.decode(log);
          promises.push(addUniqueTokens([currency0, currency1]));
        } catch (error) {
          ctx.log.error(`Error decoding Initialize event: ${error}`);
        }
      }
    }
  }

  await Promise.all(promises);

  ctx.log.info(`tokens: ${tokens.length}`);
  ctx.store.setForceFlush(true);
});
