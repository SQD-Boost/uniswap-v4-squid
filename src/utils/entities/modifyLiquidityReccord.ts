import { ModifyLiquidityReccord } from "../../model";
import { MappingContext } from "../../main";
import { Log } from "../../processor";
import { getModifyLiquidityReccordId, getPoolId } from "../helpers/ids.helper";

export const createModifyLiquidityReccord = async (
  mctx: MappingContext,
  id: string,
  liquidityDelta: bigint,
  salt: string,
  senderId: string,
  tickLower: number,
  tickUpper: number,
  log: Log
) => {
  const modifyLiquidityReccordId = getModifyLiquidityReccordId(log.id);
  const modifyLiquidityReccord = new ModifyLiquidityReccord({
    id: modifyLiquidityReccordId,
    poolId: id,
    poolEntityId: getPoolId(id),
    liquidityDelta: liquidityDelta,
    salt: salt,
    senderId: senderId,
    tickLower: tickLower,
    tickUpper: tickUpper,
    hash: log.transaction?.hash,
    txAtTimestamp: BigInt(log.block.timestamp),
    txAtBlockNumber: BigInt(log.block.height),
  });

  await mctx.store.insert(modifyLiquidityReccord);
};
