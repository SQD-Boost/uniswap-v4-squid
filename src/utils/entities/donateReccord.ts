import { DonateReccord } from "../../model";
import { MappingContext } from "../../main";
import { Log } from "../../processor";
import { getDonateReccordId, getPoolId } from "../helpers/ids.helper";

export const createDonateReccord = async (
  mctx: MappingContext,
  id: string,
  senderId: string,
  log: Log,
  amount0: bigint,
  amount1: bigint
) => {
  const donateReccordId = getDonateReccordId(log.id);
  const donateReccord = new DonateReccord({
    id: donateReccordId,
    poolId: id,
    poolEntityId: getPoolId(id),
    amount0: amount0,
    amount1: amount1,
    senderId: senderId,
    hash: log.transaction?.hash,
    txAtTimestamp: BigInt(log.block.timestamp),
    txAtBlockNumber: BigInt(log.block.height),
  });

  await mctx.store.insert(donateReccord);
};
