import * as erc20Abi from "../../abi/ERC20";
import * as ERC20NameBytesAbi from "../../abi/ERC20NameBytes";
import * as ERC20SymbolBytes from "../../abi/ERC20SymbolBytes";
import { Token } from "../../model";
import { config, MappingContext } from "../../main";
import { ONE_BI, ZERO_ADDRESS } from "../constants/global.contant";
import { DataHandlerContext } from "@subsquid/evm-processor";
import { Store } from "@subsquid/typeorm-store";
import { hexToString, sanitizeString } from "../helpers/global.helper";
import { In } from "typeorm";
import { getBundleId, getTokenId } from "../helpers/ids.helper";
import { ZERO_BI } from "../constants/global.contant";
import { ProcessorContext } from "../../processor";
import { Metadata } from "../types/global.type";
import {
  getTokenFromMapOrDb,
  getBundleFromMapOrDb,
} from "../EntityManager";
import { Pool } from "../../model";

export const createToken = async (mctx: MappingContext, currency: string) => {
  const latestBlock = mctx.blocks[mctx.blocks.length - 1];
  const erc20Contract = new erc20Abi.Contract(
    mctx,
    latestBlock.header,
    currency
  );
  let symbol = "UNKNOWN";
  let name = "Unknown Token";
  let decimals = 18;

  try {
    [symbol, name, decimals] = await Promise.all([
      erc20Contract.symbol(),
      erc20Contract.name(),
      erc20Contract.decimals(),
    ]);
  } catch (error) {
    try {
      const erc20NameContract = new ERC20NameBytesAbi.Contract(
        mctx,
        latestBlock.header,
        currency
      );
      const erc20SymbolContract = new ERC20SymbolBytes.Contract(
        mctx,
        latestBlock.header,
        currency
      );
      [symbol, name, decimals] = await Promise.all([
        erc20SymbolContract.symbol(),
        erc20NameContract.name(),
        erc20Contract.decimals(),
      ]);

      symbol = hexToString(symbol);
      name = hexToString(name);
    } catch (error: any) {
      mctx.log.warn(
        `Error getting decimals for token ${currency} : ${error.message}`
      );
    }
  }

  const tokenId = getTokenId(currency);

  const isTokenStable = config.stableAddresses.some(
    (address) => getTokenId(address).toLowerCase() === tokenId
  );

  return new Token({
    id: tokenId,
    name: sanitizeString(name),
    symbol: sanitizeString(symbol),
    decimals: decimals,
    price: isTokenStable ? 1 : 0,
    poolCount: 0,
    swapCount: ZERO_BI,
    chainId: config.chainId,
    tokenAddress: currency,
    blockNumber: BigInt(latestBlock.header.height),
    timestamp: BigInt(latestBlock.header.timestamp),
  });
};

export const createNativeToken = async (
  ctx: DataHandlerContext<Store, {}>
) => {
  const tokenId = getTokenId(ZERO_ADDRESS);
  let token = await ctx.store.get(Token, tokenId);
  if (!token) {
    token = new Token({
      id: tokenId,
      name: config.nativeName,
      symbol: config.nativeSymbol,
      decimals: config.nativeDecimals,
      price: 0,
      poolCount: 0,
      swapCount: ZERO_BI,
      chainId: config.chainId,
      tokenAddress: ZERO_ADDRESS,
      blockNumber: ZERO_BI,
      timestamp: ZERO_BI,
    });
    await ctx.store.upsert(token);
  }
};

export const initializeTokens = async (
  ctx: ProcessorContext<Store>,
  preloadedTokensMetadata: Metadata
) => {
  const CHUNK_SIZE = 10000;
  const tokens = preloadedTokensMetadata.tokens;

  for (let i = 0; i < tokens.length; i += CHUNK_SIZE) {
    const tokenChunk = tokens.slice(i, i + CHUNK_SIZE);

    const tokensIds = tokenChunk.map((token) => getTokenId(token[0]));

    let dbTokensRecords = await ctx.store.findBy(Token, {
      id: In(tokensIds),
    });

    const tokensAddressRecords = dbTokensRecords.map(
      (token) => token.tokenAddress
    );

    let missingTokens = tokenChunk.filter(
      (token) => !tokensAddressRecords.includes(token[0])
    );

    let arrayTokens = missingTokens.map((tokenInfo) => {
      const tokenId = getTokenId(tokenInfo[0]);
      const isTokenStable = config.stableAddresses.some(
        (address) => getTokenId(address).toLowerCase() === tokenId
      );
      return new Token({
        id: tokenId,
        name: sanitizeString(tokenInfo[1]),
        symbol: sanitizeString(tokenInfo[2]),
        decimals: tokenInfo[3],
        price: isTokenStable ? 1 : 0,
        poolCount: 0,
        swapCount: ZERO_BI,
        chainId: config.chainId,
        tokenAddress: tokenInfo[0],
        blockNumber: ZERO_BI,
        timestamp: ZERO_BI,
      });
    });

    await ctx.store.save(arrayTokens);
    ctx.log.info(
      `Processed ${i + tokenChunk.length} / ${tokens.length} tokens`
    );
  }
};

export const getPoolTokens = async (
  mctx: MappingContext,
  pool: Pool
): Promise<{ token0: Token; token1: Token } | null> => {
  const [token0, token1] = await Promise.all([
    getTokenFromMapOrDb(mctx.store, mctx.entities, pool.token0Id),
    getTokenFromMapOrDb(mctx.store, mctx.entities, pool.token1Id),
  ]);

  if (!token0 || !token1) {
    mctx.log.warn(`getPoolTokens: Token not found for pool ${pool.id}`);
    return null;
  }

  return { token0, token1 };
};

export const incrementTokensSwapCount = (token0: Token, token1: Token) => {
  token0.swapCount += ONE_BI;
  token1.swapCount += ONE_BI;
};

export const updateTokenPrice = async (mctx: MappingContext, pool: Pool) => {
  const isToken0Base = config.baseTokenAddresses.some(
    (address) => getTokenId(address).toLowerCase() === pool.token0Id
  );

  const isToken1Base = config.baseTokenAddresses.some(
    (address) => getTokenId(address).toLowerCase() === pool.token1Id
  );

  if (!isToken0Base && !isToken1Base) return null;

  const isToken0Stable = config.stableAddresses.some(
    (address) => getTokenId(address).toLowerCase() === pool.token0Id
  );
  const isToken1Stable = config.stableAddresses.some(
    (address) => getTokenId(address).toLowerCase() === pool.token1Id
  );

  const updatePrice = async (tokenId: string, price: number) => {
    const token = await getTokenFromMapOrDb(mctx.store, mctx.entities, tokenId);
    if (!token) {
      mctx.log.warn(`updateTokenPrice: Token ${tokenId} not found`);
      return null;
    }
    token.price = price;
    return { tokenId, price };
  };

  if (isToken0Stable) {
    return await updatePrice(pool.token1Id, pool.price0);
  } else if (isToken1Stable) {
    return await updatePrice(pool.token0Id, pool.price1);
  } else {
    const bundle = await getBundleFromMapOrDb(mctx.store, mctx.entities, getBundleId());
    if (!bundle) {
      mctx.log.warn(`updateTokenPrice: Bundle not found`);
      return null;
    }
    if (isToken0Base) {
      return await updatePrice(
        pool.token1Id,
        pool.price0 * bundle.nativePriceUSD
      );
    } else if (isToken1Base) {
      return await updatePrice(
        pool.token0Id,
        pool.price1 * bundle.nativePriceUSD
      );
    }
  }

  return null;
};
