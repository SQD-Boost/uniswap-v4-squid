import { Bundle } from "../../../../model";
import { getBundleId } from "../helpers/ids.helper";
import { CHAIN_ID } from "../constants/network.constant";
import { DataHandlerContext } from "@subsquid/evm-processor";
import { StoreWithCache } from "@belopash/typeorm-store";

export const initializeBundle = async (
  ctx: DataHandlerContext<StoreWithCache, {}>
) => {
  const bundleId = getBundleId();
  let bundle = await ctx.store.get(Bundle, bundleId);
  if (!bundle) {
    bundle = new Bundle({
      id: bundleId,
      nativePriceUSD: 0,
      chainId: CHAIN_ID,
    });
    await ctx.store.insert(bundle);
  }

  return bundle;
};
