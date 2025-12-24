import { Bundle, Pool } from "../../model";
import { getBundleId, getPoolId } from "../helpers/ids.helper";

import { DataHandlerContext } from "@subsquid/evm-processor";
import { Store } from "@subsquid/typeorm-store";
import { config, MappingContext } from "../../main";

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

export const updateBundlePrice = async (mctx: MappingContext) => {
  const bundleSourcePool = await mctx.store.get(
    Pool,
    getPoolId(config.bundleSourcePoolId)
  );
  if (!bundleSourcePool) {
    console.log(`Bundle source pool not found: ${config.bundleSourcePoolId}`);
    return;
  }

  await mctx.store.upsert(
    new Bundle({
      id: getBundleId(),
      nativePriceUSD: config.isNativeToken0
        ? bundleSourcePool.price1
        : bundleSourcePool.price0,
      chainId: config.chainId,
    })
  );
};
