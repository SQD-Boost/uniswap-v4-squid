import * as erc20Abi from "../../abi/ERC20";
import * as ERC20NameBytesAbi from "../../abi/ERC20NameBytes";
import * as ERC20SymbolBytes from "../../abi/ERC20SymbolBytes";
import { Bundle, Pool, Token } from "../../model";
import { config, MappingContext, preloadedTokensMetadata } from "../../main";
import { ONE_BI, ZERO_ADDRESS } from "../constants/global.contant";

import { DataHandlerContext } from "@subsquid/evm-processor";
import { StoreWithCache } from "@belopash/typeorm-store";
import { hexToString, sanitizeString } from "../helpers/global.helper";
import { In } from "typeorm";
import { getBundleId, getPoolId, getTokenId } from "../helpers/ids.helper";
import { ZERO_BI } from "../constants/global.contant";
import { Log, ProcessorContext } from "../../processor";

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
      console.log(
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
  ctx: DataHandlerContext<StoreWithCache, {}>
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
  ctx: ProcessorContext<StoreWithCache>
) => {
  const tokensIds = preloadedTokensMetadata.tokens.map((token) =>
    getTokenId(token[0])
  );
  let dbTokensRecords = await ctx.store.findBy(Token, {
    id: In(tokensIds),
  });

  const tokensAddressRecords = dbTokensRecords.map(
    (token) => token.tokenAddress
  );

  let missingTokens = preloadedTokensMetadata.tokens.filter(
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
};

export const incrementTokensSwapCount = async (
  mctx: MappingContext,
  log: Log,
  id: string
) => {
  let poolId = getPoolId(id);
  let pool = await mctx.store.get(Pool, poolId);
  if (!pool) {
    console.log(`updatePoolStates : Pool ${poolId} not found`);
    return;
  }

  const token0 = await mctx.store.getOrFail(Token, pool.token0Id);
  const token1 = await mctx.store.getOrFail(Token, pool.token1Id);

  token0.swapCount += ONE_BI;
  token1.swapCount += ONE_BI;

  await mctx.store.upsert([token0, token1]);
};

export const updateTokenPrice = async (mctx: MappingContext, id: string) => {
  let poolId = getPoolId(id);
  let pool = await mctx.store.get(Pool, poolId);
  if (!pool) {
    console.log(`updatePoolStates : Pool ${poolId} not found`);
    return null;
  }

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
    const token = await mctx.store.getOrFail(Token, tokenId);
    token.price = price;
    await mctx.store.upsert(token);
    return { tokenId, price };
  };

  if (isToken0Stable) {
    return await updatePrice(pool.token1Id, pool.price0);
  } else if (isToken1Stable) {
    return await updatePrice(pool.token0Id, pool.price1);
  } else {
    const bundle = await mctx.store.getOrFail(Bundle, getBundleId());
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
