import { Hook } from "../../model";
import { ZERO_BI } from "../constants/global.contant";
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
    blockNumber: ZERO_BI,
    timestamp: ZERO_BI,
  });
};
