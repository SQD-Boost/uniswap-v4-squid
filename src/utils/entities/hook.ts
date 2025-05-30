import { config } from "../../main";
import { Hook } from "../../model";
import { ZERO_BI } from "../constants/global.contant";
import { getHookId } from "../helpers/ids.helper";

export const createHook = (hooks: string) => {
  let hookId = getHookId(hooks);
  return new Hook({
    id: hookId,
    isWhitelisted: false,
    isBlacklisted: false,
    chainId: config.chainId,
    hookAddress: hooks,
    blockNumber: ZERO_BI,
    timestamp: ZERO_BI,
  });
};
