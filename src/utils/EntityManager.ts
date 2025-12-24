import { Store } from "@subsquid/typeorm-store";
import {
  Bundle,
  Wallet,
  Token,
  Hook,
  Pool,
  Position,
  Manager,
  PoolManager,
  PoolDayData,
  PoolHourData,
  TokenDayData,
  TokenHourData,
  ModifyLiquidityReccord,
  SwapReccord,
  DonateReccord,
} from "../model";

export class EntityManager {
  readonly bundlesMap = new Map<string, Bundle>();
  readonly walletsMap = new Map<string, Wallet>();
  readonly tokensMap = new Map<string, Token>();
  readonly hooksMap = new Map<string, Hook>();
  readonly poolsMap = new Map<string, Pool>();
  readonly positionsMap = new Map<string, Position>();
  readonly managersMap = new Map<string, Manager>();
  readonly poolManagersMap = new Map<string, PoolManager>();
  readonly poolDayDatasMap = new Map<string, PoolDayData>();
  readonly poolHourDatasMap = new Map<string, PoolHourData>();
  readonly tokenDayDatasMap = new Map<string, TokenDayData>();
  readonly tokenHourDatasMap = new Map<string, TokenHourData>();
  readonly modifyLiquidityReccordsMap = new Map<
    string,
    ModifyLiquidityReccord
  >();
  readonly swapReccordsMap = new Map<string, SwapReccord>();
  readonly donateReccordsMap = new Map<string, DonateReccord>();

  async upsertAll(store: Store): Promise<void> {
    if (this.bundlesMap.size > 0) {
      await store.upsert([...this.bundlesMap.values()]);
    }
    if (this.walletsMap.size > 0) {
      await store.upsert([...this.walletsMap.values()]);
    }
    if (this.tokensMap.size > 0) {
      await store.upsert([...this.tokensMap.values()]);
    }
    if (this.hooksMap.size > 0) {
      await store.upsert([...this.hooksMap.values()]);
    }
    if (this.managersMap.size > 0) {
      await store.upsert([...this.managersMap.values()]);
    }
    if (this.poolManagersMap.size > 0) {
      await store.upsert([...this.poolManagersMap.values()]);
    }

    if (this.poolsMap.size > 0) {
      await store.upsert([...this.poolsMap.values()]);
    }

    if (this.positionsMap.size > 0) {
      await store.upsert([...this.positionsMap.values()]);
    }

    if (this.poolDayDatasMap.size > 0) {
      await store.upsert([...this.poolDayDatasMap.values()]);
    }
    if (this.poolHourDatasMap.size > 0) {
      await store.upsert([...this.poolHourDatasMap.values()]);
    }
    if (this.tokenDayDatasMap.size > 0) {
      await store.upsert([...this.tokenDayDatasMap.values()]);
    }
    if (this.tokenHourDatasMap.size > 0) {
      await store.upsert([...this.tokenHourDatasMap.values()]);
    }

    if (this.modifyLiquidityReccordsMap.size > 0) {
      await store.upsert([...this.modifyLiquidityReccordsMap.values()]);
    }
    if (this.swapReccordsMap.size > 0) {
      await store.upsert([...this.swapReccordsMap.values()]);
    }
    if (this.donateReccordsMap.size > 0) {
      await store.upsert([...this.donateReccordsMap.values()]);
    }
  }
}

export const getBundleFromMapOrDb = async (
  store: Store,
  entities: EntityManager,
  bundleId: string
): Promise<Bundle | undefined> => {
  let bundle = entities.bundlesMap.get(bundleId);
  if (!bundle) {
    bundle = await store.get(Bundle, bundleId);
    if (bundle) entities.bundlesMap.set(bundleId, bundle);
  }
  return bundle;
};

export const getWalletFromMapOrDb = async (
  store: Store,
  entities: EntityManager,
  walletId: string
): Promise<Wallet | undefined> => {
  let wallet = entities.walletsMap.get(walletId);
  if (!wallet) {
    wallet = await store.get(Wallet, walletId);
    if (wallet) entities.walletsMap.set(walletId, wallet);
  }
  return wallet;
};

export const getTokenFromMapOrDb = async (
  store: Store,
  entities: EntityManager,
  tokenId: string
): Promise<Token | undefined> => {
  let token = entities.tokensMap.get(tokenId);
  if (!token) {
    token = await store.get(Token, tokenId);
    if (token) entities.tokensMap.set(tokenId, token);
  }
  return token;
};

export const getHookFromMapOrDb = async (
  store: Store,
  entities: EntityManager,
  hookId: string
): Promise<Hook | undefined> => {
  let hook = entities.hooksMap.get(hookId);
  if (!hook) {
    hook = await store.get(Hook, hookId);
    if (hook) entities.hooksMap.set(hookId, hook);
  }
  return hook;
};

export const getPoolFromMapOrDb = async (
  store: Store,
  entities: EntityManager,
  poolId: string
): Promise<Pool | undefined> => {
  let pool = entities.poolsMap.get(poolId);
  if (!pool) {
    pool = await store.get(Pool, poolId);
    if (pool) entities.poolsMap.set(poolId, pool);
  }
  return pool;
};

export const getPositionFromMapOrDb = async (
  store: Store,
  entities: EntityManager,
  positionId: string
): Promise<Position | undefined> => {
  let position = entities.positionsMap.get(positionId);
  if (!position) {
    position = await store.get(Position, positionId);
    if (position) entities.positionsMap.set(positionId, position);
  }
  return position;
};

export const getManagerFromMapOrDb = async (
  store: Store,
  entities: EntityManager,
  managerId: string
): Promise<Manager | undefined> => {
  let manager = entities.managersMap.get(managerId);
  if (!manager) {
    manager = await store.get(Manager, managerId);
    if (manager) entities.managersMap.set(managerId, manager);
  }
  return manager;
};

export const getPoolManagerFromMapOrDb = async (
  store: Store,
  entities: EntityManager,
  poolManagerId: string
): Promise<PoolManager | undefined> => {
  let poolManager = entities.poolManagersMap.get(poolManagerId);
  if (!poolManager) {
    poolManager = await store.get(PoolManager, poolManagerId);
    if (poolManager) entities.poolManagersMap.set(poolManagerId, poolManager);
  }
  return poolManager;
};

export const getPoolDayDataFromMapOrDb = async (
  store: Store,
  entities: EntityManager,
  poolDayDataId: string
): Promise<PoolDayData | undefined> => {
  let poolDayData = entities.poolDayDatasMap.get(poolDayDataId);
  if (!poolDayData) {
    poolDayData = await store.get(PoolDayData, poolDayDataId);
    if (poolDayData) entities.poolDayDatasMap.set(poolDayDataId, poolDayData);
  }
  return poolDayData;
};

export const getPoolHourDataFromMapOrDb = async (
  store: Store,
  entities: EntityManager,
  poolHourDataId: string
): Promise<PoolHourData | undefined> => {
  let poolHourData = entities.poolHourDatasMap.get(poolHourDataId);
  if (!poolHourData) {
    poolHourData = await store.get(PoolHourData, poolHourDataId);
    if (poolHourData)
      entities.poolHourDatasMap.set(poolHourDataId, poolHourData);
  }
  return poolHourData;
};

export const getTokenDayDataFromMapOrDb = async (
  store: Store,
  entities: EntityManager,
  tokenDayDataId: string
): Promise<TokenDayData | undefined> => {
  let tokenDayData = entities.tokenDayDatasMap.get(tokenDayDataId);
  if (!tokenDayData) {
    tokenDayData = await store.get(TokenDayData, tokenDayDataId);
    if (tokenDayData)
      entities.tokenDayDatasMap.set(tokenDayDataId, tokenDayData);
  }
  return tokenDayData;
};

export const getTokenHourDataFromMapOrDb = async (
  store: Store,
  entities: EntityManager,
  tokenHourDataId: string
): Promise<TokenHourData | undefined> => {
  let tokenHourData = entities.tokenHourDatasMap.get(tokenHourDataId);
  if (!tokenHourData) {
    tokenHourData = await store.get(TokenHourData, tokenHourDataId);
    if (tokenHourData)
      entities.tokenHourDatasMap.set(tokenHourDataId, tokenHourData);
  }
  return tokenHourData;
};
