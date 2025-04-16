import * as erc20Abi from "../../../../abi/ERC20";
import * as ERC20NameBytesAbi from "../../../../abi/ERC20NameBytes";
import * as ERC20SymbolBytes from "../../../../abi/ERC20SymbolBytes";
import { Token } from "../../../../model";
import { MappingContext } from "../../main";
import { ZERO_ADDRESS } from "../constants/global.contant";
import {
  CHAIN_ID,
  native_decimals,
  native_name,
  native_symbol,
} from "../constants/network.constant";
import { DataHandlerContext } from "@subsquid/evm-processor";
import { StoreWithCache } from "@belopash/typeorm-store";
import { hexToString, sanitizeString } from "../helpers/global.helper";
import { In } from "typeorm";
import { getTokenId } from "../../utils/helpers/ids.helper";
import { ZERO_BI } from "../../utils/constants/global.contant";
import { preloadedTokensMetadata, ProcessorContext } from "../../processor";

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

  return new Token({
    id: tokenId,
    name: name,
    symbol: symbol,
    decimals: decimals,
    tvlUSD: 0,
    chainId: CHAIN_ID,
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
      name: native_name,
      symbol: native_symbol,
      decimals: native_decimals,
      tvlUSD: 0,
      chainId: CHAIN_ID,
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
    getTokenId(token.address)
  );
  let dbTokensRecords = await ctx.store.findBy(Token, {
    id: In(tokensIds),
  });

  const tokensAddressRecords = dbTokensRecords.map(
    (token) => token.tokenAddress
  );

  let missingTokens = preloadedTokensMetadata.tokens.filter(
    (token) => !tokensAddressRecords.includes(token.address)
  );

  let arrayTokens = missingTokens.map(
    (tokenInfo) =>
      new Token({
        id: getTokenId(tokenInfo.address),
        name: sanitizeString(tokenInfo.name),
        symbol: sanitizeString(tokenInfo.symbol),
        decimals: tokenInfo.decimals,
        tvlUSD: 0,
        chainId: CHAIN_ID,
        tokenAddress: tokenInfo.address,
        blockNumber: ZERO_BI,
        timestamp: ZERO_BI,
      })
  );

  await ctx.store.save(arrayTokens);
};
