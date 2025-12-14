import { createPublicClient, http } from "viem";
import {
  mainnet,
  base,
  baseSepolia,
  avalanche,
  bsc,
  sepolia,
  polygon,
  arbitrum,
  optimism,
  unichain,
} from "viem/chains";

const getChain = (chainId: number) => {
  switch (chainId) {
    case 1:
      return mainnet;
    case 8453:
      return base;
    case 84532:
      return baseSepolia;
    case 42161:
      return arbitrum;
    case 43114:
      return avalanche;
    case 56:
      return bsc;
    case 137:
      return polygon;
    case 11155111:
      return sepolia;
    case 10:
      return optimism;
    case 130:
      return unichain;
    default:
      throw new Error(`Unsupported chainId: ${chainId}`);
  }
};

export const createViemClient = (chainId: number, rpcUrl: string) => {
  const chain = getChain(chainId);

  return createPublicClient({
    chain,
    transport: http(rpcUrl),
  });
};
