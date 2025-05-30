import {
  assertNotNull,
  DataHandlerContext,
  EvmBatchProcessor,
} from "@subsquid/evm-processor";
import { Database, LocalDest, Store } from "@subsquid/file-store";

import * as poolManagerAbi from "../abi/poolManager";
import * as ERC20Abi from "../abi/ERC20";
import * as ERC20NameBytesAbi from "../abi/ERC20NameBytes";
import * as ERC20SymbolBytesAbi from "../abi/ERC20SymbolBytes";
import { hexToString } from "../utils/helpers/global.helper";
import { ZERO_ADDRESS } from "../utils/constants/global.contant";
import assert from "assert";
import { networksConfigs } from "../utils/constants/network.constant";

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
    url: assertNotNull(
      config.rpcUrl,
      "Required env variable RPC_HTTP is missing"
    ),
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

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
}

let tokens: TokenInfo[] = [];

let tokensInitialized = false;
let tokensReady = false;

type Metadata = {
  height: number;
  hash: string;
  tokens: TokenInfo[];
};

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

async function addUniqueToken(
  ctx: DataHandlerContext<Store<{}>>,
  log: any,
  tokenAddress: string
) {
  const normalizedAddress = tokenAddress.toLowerCase();
  if (normalizedAddress === ZERO_ADDRESS) {
    return;
  }

  const exists = tokens.some((token) => token.address === normalizedAddress);

  if (!exists) {
    const latestBlock = ctx.blocks[ctx.blocks.length - 1];
    const erc20Contract = new ERC20Abi.Contract(
      ctx,
      latestBlock.header,
      normalizedAddress
    );

    let symbol = "UNKNOWN";
    let name = "Unknown Token";
    let decimals = 18;

    try {
      [symbol, name, decimals] = await Promise.all([
        erc20Contract.symbol(),
        erc20Contract.name(),
        erc20Contract.decimals(),
      ]);
    } catch (error) {
      try {
        const erc20NameContract = new ERC20NameBytesAbi.Contract(
          ctx,
          latestBlock.header,
          normalizedAddress
        );
        const erc20SymbolContract = new ERC20SymbolBytesAbi.Contract(
          ctx,
          latestBlock.header,
          normalizedAddress
        );
        [symbol, name, decimals] = await Promise.all([
          erc20SymbolContract.symbol(),
          erc20NameContract.name(),
          erc20Contract.decimals(),
        ]);

        symbol = hexToString(symbol);
        name = hexToString(name);
      } catch (error: any) {
        console.log(
          `Error getting name/symbol/decimal for token ${normalizedAddress}, hash ${log.transactionHash} block  ${latestBlock.header.height}: ${error.message}`
        );
      }
    }

    tokens.push({
      address: normalizedAddress,
      name: name,
      symbol: symbol,
      decimals: decimals,
    });
  }
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
          promises.push(addUniqueToken(ctx, log, currency0));
          promises.push(addUniqueToken(ctx, log, currency1));
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
