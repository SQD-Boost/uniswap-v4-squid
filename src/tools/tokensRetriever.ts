import { EvmBatchProcessor } from "@subsquid/evm-processor";
import { Database, LocalDest } from "@subsquid/file-store";
import { networksConfigs } from "../utils/constants/network.constant";
import * as poolManagerAbi from "../abi/poolManager";
import { ZERO_ADDRESS } from "../utils/constants/global.contant";
import assert from "assert";
import { fetchTokensMetadata } from "../utils/helpers/viem.helper";
import { Metadata, TokenInfo } from "../utils/types/global.type";
import { promisify } from "util";
import * as zlib from "zlib";

const brotliCompress = promisify(zlib.brotliCompress);
const brotliDecompress = promisify(zlib.brotliDecompress);

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

let pendingAddresses = new Set<string>();
const BATCH_THRESHOLD = 4000;

let db = new Database({
  tables: {},
  dest: new LocalDest(`./assets/${config.chainTag}`),
  chunkSizeMb: Infinity,
  hooks: {
    async onStateRead(dest) {
      if (await dest.exists("tokens.br")) {
        try {
          const fileContent = await dest.readFile("tokens.br");

          const buffer = Buffer.from(fileContent, "base64");

          if (buffer.length === 0) {
            return undefined;
          }

          const decompressed = await brotliDecompress(buffer);
          let {
            height,
            hash,
            tokens: retrievedTokens,
          }: Metadata = JSON.parse(decompressed.toString());
          if (!tokensInitialized) {
            tokens = retrievedTokens;
            tokensSet = new Set(retrievedTokens.map((token) => token[0]));
            tokensInitialized = true;
          }
          return { height, hash };
        } catch (error) {
          console.error("Error reading/decompressing tokens.br:", error);
          return undefined;
        }
      } else {
        return undefined;
      }
    },
    async onStateUpdate(dest, info) {
      if (tokensReady) {
        let metadata: Metadata = {
          ...info,
          tokens,
        };
        const jsonData = JSON.stringify(metadata);
        const compressed = await brotliCompress(jsonData, {
          params: {
            [zlib.constants.BROTLI_PARAM_QUALITY]:
              zlib.constants.BROTLI_MAX_QUALITY,
          },
        });
        const base64 = compressed.toString("base64");
        await dest.writeFile("tokens.br", base64);
      }
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

  const CHUNK_SIZE = 200;
  const chunks: string[][] = [];
  for (let i = 0; i < normalizedAddresses.length; i += CHUNK_SIZE) {
    chunks.push(normalizedAddresses.slice(i, i + CHUNK_SIZE));
  }

  const allPromises = chunks.map((chunk) =>
    fetchTokensMetadata(chunk, config.chainId, config.rpcUrl)
  );
  const allResults = await Promise.all(allPromises);

  allResults.forEach((metadataResults, chunkIndex) => {
    metadataResults.forEach((metadata, index) => {
      tokens.push([
        chunks[chunkIndex][index],
        metadata.name,
        metadata.symbol,
        metadata.decimals,
      ]);
    });
  });
}

processor.run(db, async (ctx) => {
  if (tokensReady) process.exit();

  for (let c of ctx.blocks) {
    for (let log of c.logs) {
      if (log.address === config.poolManager) {
        try {
          let { currency0, currency1 } =
            poolManagerAbi.events.Initialize.decode(log);
          pendingAddresses.add(currency0);
          pendingAddresses.add(currency1);
        } catch (error) {
          ctx.log.error(`Error decoding Initialize event: ${error}`);
        }
      }
    }
  }

  if (pendingAddresses.size >= BATCH_THRESHOLD || ctx.isHead) {
    if (pendingAddresses.size > 0) {
      await addUniqueTokens(Array.from(pendingAddresses));
      pendingAddresses.clear();
    }
  }

  if (ctx.isHead) tokensReady = true;

  ctx.log.info(`tokens: ${tokens.length}`);
  ctx.store.setForceFlush(true);
});
