import { config, MappingContext } from "../../main";
import { Pool, TokenHourData } from "../../model";
import { Log } from "../../processor";
import { ONE_BI, ZERO_BI } from "../constants/global.contant";
import { getHourIndex, HOUR_MS } from "../helpers/global.helper";
import { getTokenHourDataId } from "../helpers/ids.helper";
import { getTokenHourDataFromMapOrDb } from "../EntityManager";

export const createTokenHourData = (
  tokenHourDataId: string,
  tokenId: string,
  timestamp: number
) => {
  const hourIndex = getHourIndex(timestamp);

  return new TokenHourData({
    id: tokenHourDataId,
    date: new Date(hourIndex * HOUR_MS),
    tokenId: tokenId,
    swapCount: ZERO_BI,
    open: -1,
    high: -1,
    low: -1,
    close: -1,
    chainId: config.chainId,
  });
};

export const incrementTokensHourDataSwapCount = async (
  mctx: MappingContext,
  log: Log,
  pool: Pool
) => {
  let token0HourDataId = getTokenHourDataId(pool.token0Id, log.block.timestamp);
  let token1HourDataId = getTokenHourDataId(pool.token1Id, log.block.timestamp);

  let token0HourData = await getTokenHourDataFromMapOrDb(mctx.store, mctx.entities, token0HourDataId);
  if (!token0HourData) {
    token0HourData = createTokenHourData(
      token0HourDataId,
      pool.token0Id,
      log.block.timestamp
    );
    mctx.entities.tokenHourDatasMap.set(token0HourDataId, token0HourData);
  }
  let token1HourData = await getTokenHourDataFromMapOrDb(mctx.store, mctx.entities, token1HourDataId);
  if (!token1HourData) {
    token1HourData = createTokenHourData(
      token1HourDataId,
      pool.token1Id,
      log.block.timestamp
    );
    mctx.entities.tokenHourDatasMap.set(token1HourDataId, token1HourData);
  }
  token0HourData.swapCount += ONE_BI;
  token1HourData.swapCount += ONE_BI;
};

export const updateTokenHourData = async (
  mctx: MappingContext,
  log: Log,
  priceUpdate: {
    tokenId: string;
    price: number;
  }
) => {
  let tokenHourDataId = getTokenHourDataId(
    priceUpdate.tokenId,
    log.block.timestamp
  );

  let tokenHourData = await getTokenHourDataFromMapOrDb(mctx.store, mctx.entities, tokenHourDataId);
  if (!tokenHourData) {
    mctx.log.warn(`updateTokenHourData: TokenHourData ${tokenHourDataId} not found`);
    return;
  }
  if (tokenHourData.open === -1) {
    tokenHourData.open = priceUpdate.price;
    tokenHourData.high = priceUpdate.price;
    tokenHourData.low = priceUpdate.price;
    tokenHourData.close = priceUpdate.price;
  } else {
    tokenHourData.high = Math.max(tokenHourData.high, priceUpdate.price);
    tokenHourData.low = Math.min(tokenHourData.low, priceUpdate.price);
    tokenHourData.close = priceUpdate.price;
  }
};
