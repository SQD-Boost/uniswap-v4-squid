import { MappingContext } from "../main";

import * as nftPositionAbi from "../abi/nftPosition";
import { Log } from "../processor";
import { createWallet } from "../utils/entities/wallet";
import { createPositionUpdateOwner } from "../utils/entities/position";
import { getPositionId, getWalletId } from "../utils/helpers/ids.helper";
import {
  getWalletFromMapOrDb,
  getPositionFromMapOrDb,
} from "../utils/EntityManager";

export const handleTransferPosition = async (mctx: MappingContext, log: Log) => {
  let { id, to } = nftPositionAbi.events.Transfer.decode(log);

  const walletId = getWalletId(to);
  let wallet = await getWalletFromMapOrDb(mctx.store, mctx.entities, walletId);
  if (!wallet) {
    wallet = createWallet(to);
    mctx.entities.walletsMap.set(walletId, wallet);
  }

  const positionId = getPositionId(log.address, id);
  let position = await getPositionFromMapOrDb(mctx.store, mctx.entities, positionId);
  if (!position) {
    position = createPositionUpdateOwner(log, id);
    mctx.entities.positionsMap.set(positionId, position);
  }
  position.ownerId = wallet.id;
};
