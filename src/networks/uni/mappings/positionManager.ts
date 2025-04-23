import { MappingContext } from "../main";

import * as nftPositionAbi from "../../../abi/nftPosition";
import { Log } from "../processor";
import { createWallet } from "../utils/entities/wallet";
import { createPositionUpdateOwner } from "../utils/entities/position";
import { Position, Wallet } from "../../../model";
import { getPositionId, getWalletId } from "../utils/helpers/ids.helper";

export const handleTransferPosition = (mctx: MappingContext, log: Log) => {
  let { id, to } = nftPositionAbi.events.Transfer.decode(log);

  mctx.store.defer(Wallet, getWalletId(to));
  mctx.store.defer(Position, getPositionId(log.address, id));

  mctx.queue.add(async () => {
    let wallet = await mctx.store.get(Wallet, getWalletId(to));
    if (!wallet) {
      wallet = createWallet(to);
      await mctx.store.insert(wallet);
    }

    let position = await mctx.store.get(
      Position,
      getPositionId(log.address, id)
    );
    if (!position) {
      position = createPositionUpdateOwner(log, id);
    }
    position.ownerId = wallet.id;
    await mctx.store.upsert(position);
  });
};
