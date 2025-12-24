import {
  BlockHeader,
  DataHandlerContext,
  EvmBatchProcessor,
  EvmBatchProcessorFields,
  Log as _Log,
  Transaction as _Transaction,
  BlockData as _BlockData,
  assertNotNull,
  FieldSelection,
} from "@subsquid/evm-processor";
import * as poolManagerAbi from "./abi/poolManager";
import * as nftPositionAbi from "./abi/nftPosition";
import { NetworkConfig } from "./utils/types/global.type";

const fields = {
  log: {
    transactionHash: true,
  },
} satisfies FieldSelection;

export type Fields = typeof fields;
export type Block = BlockHeader<Fields>;
export type BlockData = _BlockData<Fields>;
export type Log = _Log<Fields>;
export type Transaction = _Transaction<Fields>;
export type ProcessorContext<Store> = DataHandlerContext<Store, Fields>;

export const makeProcessor = (config: NetworkConfig) => {
  return new EvmBatchProcessor()
    .setGateway(config.gatewaySqdUrl)
    .setRpcEndpoint({
      url: assertNotNull(
        config.rpcUrl,
        "Required env variable RPC_HTTP is missing"
      ),
    })
    .setFinalityConfirmation(75)
    .addLog({
      address: [config.nftPositionManager],
      range: { from: config.nftPositionManagerFirstBlock },
      topic0: [nftPositionAbi.events.Transfer.topic],
    })
    .addLog({
      address: [config.poolManager],
      range: { from: config.poolManagerFirstBlock },
      topic0: [
        poolManagerAbi.events.Initialize.topic,
        poolManagerAbi.events.ModifyLiquidity.topic,
        poolManagerAbi.events.Swap.topic,
        poolManagerAbi.events.Donate.topic,
      ],
      transaction: true,
    })
    .setFields({});
};
