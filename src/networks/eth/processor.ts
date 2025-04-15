import {
  BlockHeader,
  DataHandlerContext,
  EvmBatchProcessor,
  EvmBatchProcessorFields,
  Log as _Log,
  Transaction as _Transaction,
  BlockData as _BlockData,
  assertNotNull,
} from "@subsquid/evm-processor";
import {
  CHAIN_TAG,
  GATEWAY_SQD_URL,
  NFT_POSITION_MANAGER,
  NFT_POSITION_MANAGER_FIRST_BLOCK,
  POOL_MANAGER,
  POOL_MANAGER_FIRST_BLOCK,
  RPC_URL,
} from "./utils/constants/network.constant";
import * as poolManagerAbi from "../../abi/poolManager";
import * as nftPositionAbi from "../../abi/nftPosition";
import fs from "fs";
import { TokenInfo } from "./tools/tokensRetriever";

export const preloadedTokensMetadata = JSON.parse(
  fs.readFileSync(`./assets/${CHAIN_TAG}/tokens.json`, "utf-8")
) as { height: number; tokens: TokenInfo[] };

export const processor = new EvmBatchProcessor()
  .setGateway(GATEWAY_SQD_URL)
  .setRpcEndpoint({
    url: assertNotNull(
      RPC_URL,
      "Required env variable RPC_ETH_HTTP is missing"
    ),
  })
  .setFinalityConfirmation(75)
  .addLog({
    address: [NFT_POSITION_MANAGER],
    range: { from: NFT_POSITION_MANAGER_FIRST_BLOCK },
    topic0: [nftPositionAbi.events.Transfer.topic],
  })
  .addLog({
    address: [POOL_MANAGER],
    range: { from: POOL_MANAGER_FIRST_BLOCK },
    topic0: [
      poolManagerAbi.events.Initialize.topic,
      poolManagerAbi.events.ModifyLiquidity.topic,
      poolManagerAbi.events.Swap.topic,
    ],
    transaction: true,
  })

  .setFields({});

export type Fields = EvmBatchProcessorFields<typeof processor>;
export type Block = BlockHeader<Fields>;
export type BlockData = _BlockData<Fields>;
export type Log = _Log<Fields>;
export type Transaction = _Transaction<Fields>;
export type ProcessorContext<Store> = DataHandlerContext<Store, Fields>;
