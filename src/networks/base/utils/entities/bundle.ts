import { Bundle, Pool } from "../../../../model";
import { getBundleId, getPoolId } from "../helpers/ids.helper";
import {
  BUNDLE_SOURCE_POOL_ID,
  CHAIN_ID,
  IS_NATIVE_TOKEN0,
} from "../constants/network.constant";
import { DataHandlerContext } from "@subsquid/evm-processor";
import { StoreWithCache } from "@belopash/typeorm-store";
import { MappingContext } from "../../main";

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

export const updateBundlePrice = async (mctx: MappingContext) => {
  const bundleSourcePool = await mctx.store.get(
    Pool,
    getPoolId(BUNDLE_SOURCE_POOL_ID)
  );
  if (!bundleSourcePool) {
    console.log(`Bundle source pool not found: ${BUNDLE_SOURCE_POOL_ID}`);
    return;
  }

  await mctx.store.upsert(
    new Bundle({
      id: getBundleId(),
      nativePriceUSD: IS_NATIVE_TOKEN0
        ? bundleSourcePool.price1
        : bundleSourcePool.price0,
      chainId: CHAIN_ID,
    })
  );
};
