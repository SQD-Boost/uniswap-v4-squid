import { DataHandlerContext } from "@subsquid/evm-processor";
import { Store } from "@subsquid/typeorm-store";
import { getManagerId } from "../helpers/ids.helper";
import { Manager } from "../../model";
import { config } from "../../main";

export const createManager = async (
  ctx: DataHandlerContext<Store, {}>,
  managerAddress: string
) => {
  const managerId = getManagerId(managerAddress);
  let managerEntity = await ctx.store.get(Manager, managerId);
  if (!managerEntity) {
    managerEntity = new Manager({
      id: managerId,
      managerAddress: managerAddress,
      chainId: config.chainId,
    });
    await ctx.store.insert(managerEntity);
  }
};
