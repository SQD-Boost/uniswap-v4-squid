import { baseConfig } from "./networks/base";
import { ethConfig } from "./networks/eth";
import { uniConfig } from "./networks/uni";
import { NetworkConfig } from "../types/global.type";

export const networksConfigs: Record<string, NetworkConfig> = {
  uni: uniConfig,
  eth: ethConfig,
  base: baseConfig,
};

export function getNetworkConfig(chainTag: string) {
  const config = networksConfigs[chainTag as keyof typeof networksConfigs];
  if (!config) {
    throw new Error(`Chain configuration not found for: ${chainTag}`);
  }
  return config;
}
