import { Hook } from "../../../../model";
import { CHAIN_ID } from "../constants/network.constant";
import { getHookId } from "../helpers/ids.helper";

export const createHook = (hooks: string) => {
  let hookId = getHookId(hooks);
  return new Hook({
    id: hookId,
    isWhitelisted: false,
    isBlacklisted: false,
    chainId: CHAIN_ID,
    hookAddress: hooks,
    blockNumber: BigInt(0),
    timestamp: BigInt(0),
  });
};
