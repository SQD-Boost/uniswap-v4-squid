import { Bundle, Pool } from "../../model";
import { getBundleId } from "../helpers/ids.helper";

import { DataHandlerContext } from "@subsquid/evm-processor";
import { Store } from "@subsquid/typeorm-store";
import { config, MappingContext } from "../../main";
import { getBundleFromMapOrDb } from "../EntityManager";

export const initializeBundle = async (
  ctx: DataHandlerContext<Store, {}>
) => {
  const bundleId = getBundleId();
  let bundle = await ctx.store.get(Bundle, bundleId);
  if (!bundle) {
    bundle = new Bundle({
      id: bundleId,
      nativePriceUSD: 0,
      chainId: config.chainId,
    });
    await ctx.store.insert(bundle);
  }

  return bundle;
};

export const updateBundlePrice = async (mctx: MappingContext, pool: Pool) => {
  const bundle = await getBundleFromMapOrDb(
    mctx.store,
    mctx.entities,
    getBundleId()
  );
  if (!bundle) {
    mctx.log.warn(`Bundle not found`);
    return;
  }

  bundle.nativePriceUSD = config.isNativeToken0 ? pool.price1 : pool.price0;
};
