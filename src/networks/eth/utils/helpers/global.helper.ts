import {
  MAX_TICK,
  MaxUint256,
  MIN_TICK,
  ONE_BI,
  PRECISION,
  Q96,
  ZERO_ADDRESS,
  ZERO_BI,
} from "../constants/global.contant";
import {
  BASE_TOKEN_ADDRESSES,
  STABLE_DECIMALS,
  WRAP_NATIVE,
} from "../constants/network.constant";
import { getTokenId } from "./ids.helper";

export function hexToString(hex: string): string {
  hex = hex.startsWith("0x") ? hex.slice(2) : hex;

  let str = "";
  for (let i = 0; i < hex.length; i += 2) {
    const code = parseInt(hex.substr(i, 2), 16);
    if (code === 0) break;
    str += String.fromCharCode(code);
  }
  return str.trim();
}

export function getPricesFromSqrtPriceX96(
  sqrtPriceX96: bigint,
  token0Decimals: number,
  token1Decimals: number
): { token0Price: number; token1Price: number } {
  const Q96 = BigInt(2) ** BigInt(96);
  const priceInX192_NUM = sqrtPriceX96 * sqrtPriceX96;
  const DENOM = Q96 * Q96;

  const scaledNumerator = priceInX192_NUM * PRECISION;

  const scaledPriceRaw = scaledNumerator / DENOM;

  const decimalAdjustment = 10 ** (token0Decimals - token1Decimals);

  const token1Price =
    (Number(scaledPriceRaw.toString()) * decimalAdjustment) / Number(PRECISION);

  const token0Price = token1Price === 0 ? 0 : 1 / token1Price;

  return {
    token0Price,
    token1Price,
  };
}

const getPriceFromTick = (tick: number) => {
  return 1.0001 ** tick;
};

export const convertTokenToDecimal = (
  weiBalanceBigInt: bigint,
  decimals: number
) => {
  let weiBalanceStr = weiBalanceBigInt.toString();
  weiBalanceStr = weiBalanceStr.padStart(decimals + 1, "0");

  const position = weiBalanceStr.length - decimals;
  const etherStr = `${weiBalanceStr.substring(
    0,
    position
  )}.${weiBalanceStr.substring(position)}`;

  const trimmedEtherStr = etherStr.replace(/\.?0+$/, "");

  return Number(trimmedEtherStr);
};

export const getAllTokensInBaseAmount = (
  token0Id: string,
  token0Decimals: number,
  token1Decimals: number,
  amount0: bigint,
  amount1: bigint,
  price0: number,
  price1: number
): number => {
  const isToken0Base = BASE_TOKEN_ADDRESSES.map((token) =>
    getTokenId(token)
  ).includes(token0Id);

  if (isToken0Base) {
    const amount1InBase =
      convertTokenToDecimal(amount1, token1Decimals) * price0;

    const amount0Base = convertTokenToDecimal(amount0, token0Decimals);

    return (amount1InBase + amount0Base) / 2;
  } else {
    const amount0InBase =
      convertTokenToDecimal(amount0, token0Decimals) * price1;

    const amount1Base = convertTokenToDecimal(amount1, token1Decimals);

    return (amount0InBase + amount1Base) / 2;
  }
};

export const calculateCoreTotalUSD = (
  token0Id: string,
  token1Id: string,
  positionBaseAmount: number,
  bundleNativePrice: number
): number => {
  const isToken0Stablecoin = Object.keys(STABLE_DECIMALS)
    .map(getTokenId)
    .includes(token0Id);
  const isToken1Stablecoin = Object.keys(STABLE_DECIMALS)
    .map(getTokenId)
    .includes(token1Id);

  const isToken0WrappedNative =
    getTokenId(WRAP_NATIVE) === token0Id ||
    getTokenId(ZERO_ADDRESS) === token0Id;
  const isToken1WrappedNative =
    getTokenId(WRAP_NATIVE) === token1Id ||
    getTokenId(ZERO_ADDRESS) === token1Id;

  if (isToken0Stablecoin || isToken1Stablecoin) {
    return positionBaseAmount;
  } else if (isToken0WrappedNative || isToken1WrappedNative) {
    return positionBaseAmount * bundleNativePrice;
  } else {
    return 0;
  }
};

export function sanitizeString(str: string | null | undefined): string {
  if (!str) return "";

  return str.replace(/\u0000/g, "").replace(/[^\x20-\x7E\xA0-\xFF]/g, "");
}

function mulShift(val: bigint, mulBy: bigint): bigint {
  return (val * mulBy) >> 128n; // Right shift by 128 bits
}

function getSqrtRatioAtTick(tick: number): bigint {
  if (tick < MIN_TICK || tick > MAX_TICK) {
    throw new Error("TICK");
  }
  const absTick: number = tick < 0 ? -tick : tick;

  let ratio: bigint =
    (absTick & 0x1) !== 0
      ? BigInt("0xfffcb933bd6fad37aa2d162d1a594001")
      : BigInt("0x100000000000000000000000000000000");

  if ((absTick & 0x2) !== 0)
    ratio = mulShift(ratio, BigInt("0xfff97272373d413259a46990580e213a"));
  if ((absTick & 0x4) !== 0)
    ratio = mulShift(ratio, BigInt("0xfff2e50f5f656932ef12357cf3c7fdcc"));
  if ((absTick & 0x8) !== 0)
    ratio = mulShift(ratio, BigInt("0xffe5caca7e10e4e61c3624eaa0941cd0"));
  if ((absTick & 0x10) !== 0)
    ratio = mulShift(ratio, BigInt("0xffcb9843d60f6159c9db58835c926644"));
  if ((absTick & 0x20) !== 0)
    ratio = mulShift(ratio, BigInt("0xff973b41fa98c081472e6896dfb254c0"));
  if ((absTick & 0x40) !== 0)
    ratio = mulShift(ratio, BigInt("0xff2ea16466c96a3843ec78b326b52861"));
  if ((absTick & 0x80) !== 0)
    ratio = mulShift(ratio, BigInt("0xfe5dee046a99a2a811c461f1969c3053"));
  if ((absTick & 0x100) !== 0)
    ratio = mulShift(ratio, BigInt("0xfcbe86c7900a88aedcffc83b479aa3a4"));
  if ((absTick & 0x200) !== 0)
    ratio = mulShift(ratio, BigInt("0xf987a7253ac413176f2b074cf7815e54"));
  if ((absTick & 0x400) !== 0)
    ratio = mulShift(ratio, BigInt("0xf3392b0822b70005940c7a398e4b70f3"));
  if ((absTick & 0x800) !== 0)
    ratio = mulShift(ratio, BigInt("0xe7159475a2c29b7443b29c7fa6e889d9"));
  if ((absTick & 0x1000) !== 0)
    ratio = mulShift(ratio, BigInt("0xd097f3bdfd2022b8845ad8f792aa5825"));
  if ((absTick & 0x2000) !== 0)
    ratio = mulShift(ratio, BigInt("0xa9f746462d870fdf8a65dc1f90e061e5"));
  if ((absTick & 0x4000) !== 0)
    ratio = mulShift(ratio, BigInt("0x70d869a156d2a1b890bb3df62baf32f7"));
  if ((absTick & 0x8000) !== 0)
    ratio = mulShift(ratio, BigInt("0x31be135f97d08fd981231505542fcfa6"));
  if ((absTick & 0x10000) !== 0)
    ratio = mulShift(ratio, BigInt("0x9aa508b5b7a84e1c677de54f3e99bc9"));
  if ((absTick & 0x20000) !== 0)
    ratio = mulShift(ratio, BigInt("0x5d6af8dedb81196699c329225ee604"));
  if ((absTick & 0x40000) !== 0)
    ratio = mulShift(ratio, BigInt("0x2216e584f5fa1ea926041bedfe98"));
  if ((absTick & 0x80000) !== 0)
    ratio = mulShift(ratio, BigInt("0x48a170391f7dc42444e8fa2"));

  if (tick > 0) ratio = MaxUint256 / ratio;

  return (ratio >> 32n) + ((ratio & ((1n << 32n) - 1n)) > 0n ? 1n : 0n);
}

function hexToBigInt(hex: string) {
  if (hex.startsWith("0x")) {
    hex = hex.slice(2);
  }

  return BigInt("0x" + hex);
}

function getAmount0Delta(
  sqrtRatioAX96: bigint,
  sqrtRatioBX96: bigint,
  liquidity: bigint,
  roundUp: boolean
): bigint {
  if (sqrtRatioAX96 > sqrtRatioBX96) {
    const temp = sqrtRatioAX96;
    sqrtRatioAX96 = sqrtRatioBX96;
    sqrtRatioBX96 = temp;
  }

  const numerator1 = liquidity << 96n;
  const numerator2 = sqrtRatioBX96 - sqrtRatioAX96;

  return roundUp
    ? FullMath.mulDivRoundingUp(
        FullMath.mulDivRoundingUp(numerator1, numerator2, sqrtRatioBX96),
        ONE_BI,
        sqrtRatioAX96
      )
    : (numerator1 * numerator2) / sqrtRatioBX96 / sqrtRatioAX96;
}

function getAmount1Delta(
  sqrtRatioAX96: bigint,
  sqrtRatioBX96: bigint,
  liquidity: bigint,
  roundUp: boolean
): bigint {
  if (sqrtRatioAX96 > sqrtRatioBX96) {
    const temp = sqrtRatioAX96;
    sqrtRatioAX96 = sqrtRatioBX96;
    sqrtRatioBX96 = temp;
  }

  const difference = sqrtRatioBX96 - sqrtRatioAX96;

  return roundUp
    ? FullMath.mulDivRoundingUp(liquidity, difference, Q96)
    : (liquidity * difference) / Q96;
}

const FullMath = {
  mulDivRoundingUp(a: bigint, b: bigint, denominator: bigint): bigint {
    const product = a * b;
    const result = product / denominator;

    if (product % denominator > 0n) {
      return result + 1n;
    }

    return result;
  },
};

export function getAmount0(
  tickLower: number,
  tickUpper: number,
  currTick: number,
  amount: bigint,
  currSqrtPriceX96: bigint
): bigint {
  const sqrtRatioAX96 = getSqrtRatioAtTick(tickLower);
  const sqrtRatioBX96 = getSqrtRatioAtTick(tickUpper);

  let amount0 = ZERO_BI;
  const roundUp = amount > ZERO_BI;

  if (currTick < tickLower) {
    amount0 = getAmount0Delta(sqrtRatioAX96, sqrtRatioBX96, amount, roundUp);
  } else if (currTick < tickUpper) {
    amount0 = getAmount0Delta(currSqrtPriceX96, sqrtRatioBX96, amount, roundUp);
  } else {
    amount0 = ZERO_BI;
  }

  return amount0;
}

export function getAmount1(
  tickLower: number,
  tickUpper: number,
  currTick: number,
  amount: bigint,
  currSqrtPriceX96: bigint
): bigint {
  const sqrtRatioAX96 = getSqrtRatioAtTick(tickLower);
  const sqrtRatioBX96 = getSqrtRatioAtTick(tickUpper);

  let amount1 = ZERO_BI;
  const roundUp = amount > ZERO_BI;

  if (currTick < tickLower) {
    amount1 = ZERO_BI;
  } else if (currTick < tickUpper) {
    amount1 = getAmount1Delta(sqrtRatioAX96, currSqrtPriceX96, amount, roundUp);
  } else {
    amount1 = getAmount1Delta(sqrtRatioAX96, sqrtRatioBX96, amount, roundUp);
  }

  return amount1;
}

export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;

export function getDayIndex(timestamp: number) {
  return Math.floor(timestamp / DAY_MS);
}
export function getHourIndex(timestamp: number) {
  return Math.floor(timestamp / HOUR_MS);
}
