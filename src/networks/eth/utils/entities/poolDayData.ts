import { PoolDayData } from "../../../../model";
import { MappingContext } from "../../main";
import { Log } from "../../processor";
import { ONE_BI, ZERO_BI } from "../constants/global.contant";
import { CHAIN_ID } from "../constants/network.constant";
import { DAY_MS, getDayIndex } from "../helpers/global.helper";
import { getPoolDayDataId, getPoolId } from "../helpers/ids.helper";

export const createPoolDayData = (
  poolDayDataId: string,
  id: string,
  timestamp: number
) => {
  const poolId = getPoolId(id);
  const dayIndex = getDayIndex(timestamp);

  return new PoolDayData({
    id: poolDayDataId,
    date: new Date(dayIndex * DAY_MS),
    poolId: poolId,
    swapCount: ZERO_BI,
    chainId: CHAIN_ID,
  });
};

export const updatePoolDayData = async (
  mctx: MappingContext,
  log: Log,
  id: string
) => {
  let poolDayDataId = getPoolDayDataId(id, log.block.timestamp);
  let poolDayData = await mctx.store.get(PoolDayData, poolDayDataId);
  if (!poolDayData) {
    poolDayData = createPoolDayData(poolDayDataId, id, log.block.timestamp);
  }
  poolDayData.swapCount += ONE_BI;

  await mctx.store.upsert(poolDayData);
};
