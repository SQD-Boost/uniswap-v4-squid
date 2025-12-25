import { config, MappingContext } from "../main";
import { Log } from "../processor";
import * as poolManagerAbi from "../abi/poolManager";
import {
  createToken,
  getPoolTokens,
  incrementTokensSwapCount,
  updateTokenPrice,
} from "../utils/entities/token";
import {
  getHookId,
  getPoolId,
  getTokenId,
  getWalletId,
} from "../utils/helpers/ids.helper";
import { getPoolFromMapOrDb } from "../utils/EntityManager";
import { createHook } from "../utils/entities/hook";
import { createPool, updatePoolStates } from "../utils/entities/pool";
import { getPricesFromSqrtPriceX96 } from "../utils/helpers/global.helper";
import { updatePositionAndPool } from "../utils/entities/position";
import { updatePoolDayData } from "../utils/entities/poolDayData";
import { updatePoolHourData } from "../utils/entities/poolHourData";
import { createModifyLiquidityReccord } from "../utils/entities/modifyLiquidityReccord";
import { createWallet } from "../utils/entities/wallet";
import { createSwapReccord } from "../utils/entities/swapReccord";
import { createDonateReccord } from "../utils/entities/donateReccord";
import { updateBundlePrice } from "../utils/entities/bundle";
import {
  incrementTokensDayDataSwapCount,
  updateTokenDayData,
} from "../utils/entities/tokenDayData";
import {
  incrementTokensHourDataSwapCount,
  updateTokenHourData,
} from "../utils/entities/tokenHourData";
import { addFeeVolumePoolManager } from "../utils/entities/poolManager";
import {
  getTokenFromMapOrDb,
  getHookFromMapOrDb,
  getWalletFromMapOrDb,
} from "../utils/EntityManager";

export const handleInitialize = async (mctx: MappingContext, log: Log) => {
  let {
    currency0,
    currency1,
    hooks,
    tick,
    id,
    sqrtPriceX96,
    fee,
    tickSpacing,
  } = poolManagerAbi.events.Initialize.decode(log);

  let token0Id = getTokenId(currency0);
  let token1Id = getTokenId(currency1);
  let hookId = getHookId(hooks);

  let token0 = await getTokenFromMapOrDb(mctx.store, mctx.entities, token0Id);
  if (!token0) {
    token0 = await createToken(mctx, currency0);
    mctx.entities.tokensMap.set(token0Id, token0);
  }
  token0.poolCount += 1;

  let token1 = await getTokenFromMapOrDb(mctx.store, mctx.entities, token1Id);
  if (!token1) {
    token1 = await createToken(mctx, currency1);
    mctx.entities.tokensMap.set(token1Id, token1);
  }
  token1.poolCount += 1;

  let hook = await getHookFromMapOrDb(mctx.store, mctx.entities, hookId);
  if (!hook) {
    hook = createHook(hooks);
    mctx.entities.hooksMap.set(hookId, hook);
  }

  let token0Decimals = token0?.decimals ?? 18;
  let token1Decimals = token1?.decimals ?? 18;

  const { token0Price, token1Price } = getPricesFromSqrtPriceX96(
    sqrtPriceX96,
    token0Decimals,
    token1Decimals
  );
  const pool = createPool(
    id,
    tick,
    sqrtPriceX96,
    fee,
    token0Id,
    token1Id,
    hookId,
    token0Price,
    token1Price,
    token0Decimals,
    token1Decimals,
    tickSpacing,
    log
  );
  mctx.entities.poolsMap.set(pool.id, pool);
};

export const handleModifyLiquidity = async (mctx: MappingContext, log: Log) => {
  let { id, liquidityDelta, salt, sender, tickLower, tickUpper } =
    poolManagerAbi.events.ModifyLiquidity.decode(log);

  await updatePositionAndPool(
    mctx,
    log,
    id,
    liquidityDelta,
    salt,
    tickLower,
    tickUpper
  );

  const walletId = getWalletId(sender);
  let wallet = await getWalletFromMapOrDb(mctx.store, mctx.entities, walletId);
  if (!wallet) {
    wallet = createWallet(sender);
    mctx.entities.walletsMap.set(walletId, wallet);
  }

  if (config.permissionRecordTx.modifyLiquidity) {
    await createModifyLiquidityReccord(
      mctx,
      id,
      liquidityDelta,
      salt,
      walletId,
      tickLower,
      tickUpper,
      log
    );
  }
};

export const handleSwap = async (mctx: MappingContext, log: Log) => {
  let { id, amount0, amount1, fee, liquidity, sender, sqrtPriceX96, tick } =
    poolManagerAbi.events.Swap.decode(log);

  const poolId = getPoolId(id);
  const pool = await getPoolFromMapOrDb(mctx.store, mctx.entities, poolId);
  if (!pool) {
    mctx.log.warn(`handleSwap: Pool ${poolId} not found`);
    return;
  }

  const tokens = await getPoolTokens(mctx, pool);
  if (!tokens) {
    return;
  }
  const { token0, token1 } = tokens;

  incrementTokensSwapCount(token0, token1);

  if (config.permissionRecordTx.tokendaydata) {
    await incrementTokensDayDataSwapCount(mctx, log, pool);
  }
  if (config.permissionRecordTx.tokenhourdata) {
    await incrementTokensHourDataSwapCount(mctx, log, pool);
  }
  const { volumeUSDAdded, feeUSDAdded } = updatePoolStates(
    mctx,
    log,
    pool,
    token0,
    token1,
    tick,
    liquidity,
    sqrtPriceX96,
    amount0,
    amount1,
    fee
  );

  await addFeeVolumePoolManager(mctx, volumeUSDAdded, feeUSDAdded);
  if (config.permissionRecordTx.pooldaydata) {
    await updatePoolDayData(
      mctx,
      log,
      pool,
      token0,
      token1,
      liquidity,
      sqrtPriceX96,
      tick,
      amount0,
      amount1,
      fee
    );
  }
  if (config.permissionRecordTx.poolhourdata) {
    await updatePoolHourData(
      mctx,
      log,
      pool,
      token0,
      token1,
      liquidity,
      sqrtPriceX96,
      tick,
      amount0,
      amount1,
      fee
    );
  }

  if (id === config.bundleSourcePoolId) {
    await updateBundlePrice(mctx);
  }
  const priceUpdate = await updateTokenPrice(mctx, pool);
  if (priceUpdate) {
    if (config.permissionRecordTx.tokendaydata) {
      await updateTokenDayData(mctx, log, priceUpdate);
    }
    if (config.permissionRecordTx.tokenhourdata) {
      await updateTokenHourData(mctx, log, priceUpdate);
    }
  }

  const walletId = getWalletId(sender);
  let wallet = await getWalletFromMapOrDb(mctx.store, mctx.entities, walletId);
  if (!wallet) {
    wallet = createWallet(sender);
    mctx.entities.walletsMap.set(walletId, wallet);
  }

  if (config.permissionRecordTx.swap) {
    await createSwapReccord(
      mctx,
      id,
      walletId,
      log,
      amount0,
      amount1,
      fee,
      liquidity,
      sqrtPriceX96,
      tick
    );
  }
};

export const handleDonate = async (mctx: MappingContext, log: Log) => {
  let { id, amount0, amount1, sender } =
    poolManagerAbi.events.Donate.decode(log);

  const walletId = getWalletId(sender);
  let wallet = await getWalletFromMapOrDb(mctx.store, mctx.entities, walletId);
  if (!wallet) {
    wallet = createWallet(sender);
    mctx.entities.walletsMap.set(walletId, wallet);
  }

  if (config.permissionRecordTx.donate) {
    await createDonateReccord(mctx, id, walletId, log, amount0, amount1);
  }
};
