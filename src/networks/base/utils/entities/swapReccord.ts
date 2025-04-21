import { SwapReccord } from "../../../../model";
import { MappingContext } from "../../main";
import { Log } from "../../processor";
import { getPoolId, getSwapReccordId } from "../helpers/ids.helper";

export const createSwapReccord = async (
  mctx: MappingContext,
  id: string,
  senderId: string,
  log: Log,
  amount0: bigint,
  amount1: bigint,
  fee: number,
  liquidity: bigint,
  sqrtPriceX96: bigint,
  tick: number
) => {
  const swapReccordId = getSwapReccordId(log.id);
  const swapReccord = new SwapReccord({
    id: swapReccordId,
    poolId: id,
    poolEntityId: getPoolId(id),
    amount0: amount0,
    amount1: amount1,
    fee: fee,
    liquidity: liquidity,
    senderId: senderId,
    sqrtPriceX96: sqrtPriceX96,
    tick: tick,
    hash: log.transaction?.hash,
    txAtTimestamp: BigInt(log.block.timestamp),
    txAtBlockNumber: BigInt(log.block.height),
  });

  await mctx.store.insert(swapReccord);
};
