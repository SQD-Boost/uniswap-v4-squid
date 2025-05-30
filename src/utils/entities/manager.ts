import { DataHandlerContext } from "@subsquid/evm-processor";
import { StoreWithCache } from "@belopash/typeorm-store";
import { getManagerId } from "../helpers/ids.helper";
import { CHAIN_ID } from "../constants/network.constant";
import { Manager } from "../../model";

export const createManager = async (
  ctx: DataHandlerContext<StoreWithCache, {}>,
  managerAddress: string
) => {
  const managerId = getManagerId(managerAddress);
  let managerEntity = await ctx.store.get(Manager, managerId);
  if (!managerEntity) {
    managerEntity = new Manager({
      id: managerId,
      managerAddress: managerAddress,
      chainId: CHAIN_ID,
    });
    await ctx.store.insert(managerEntity);
  }
};
