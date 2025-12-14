import erc20Abi from "../../../abi/ERC20.json";
import erc20NameBytesAbi from "../../../abi/ERC20NameBytes.json";
import erc20SymbolBytesAbi from "../../../abi/ERC20SymbolBytes.json";
import { createViemClient } from "../clients/viem.client";

function hexToString(hex: string): string {
  hex = hex.startsWith("0x") ? hex.slice(2) : hex;

  let str = "";
  for (let i = 0; i < hex.length; i += 2) {
    const code = parseInt(hex.substr(i, 2), 16);
    if (code === 0) break;
    str += String.fromCharCode(code);
  }
  return str.trim();
}

function sanitizeString(str: string | null | undefined): string {
  if (!str) return "";

  return str.replace(/[\x00-\x1F\x7F-\x9F]/g, "").trim();
}

export interface TokenMetadata {
  symbol: string;
  name: string;
  decimals: number;
}

export const fetchTokensMetadata = async (
  currencies: string[],
  chainId: number,
  rpcUrl: string
): Promise<TokenMetadata[]> => {
  const client = createViemClient(chainId, rpcUrl);

  const contracts = currencies.flatMap((currency) => [
    {
      address: currency as `0x${string}`,
      abi: erc20Abi as any,
      functionName: "symbol" as const,
    },
    {
      address: currency as `0x${string}`,
      abi: erc20Abi as any,
      functionName: "name" as const,
    },
    {
      address: currency as `0x${string}`,
      abi: erc20Abi as any,
      functionName: "decimals" as const,
    },
  ]);

  let results;
  try {
    results = await client.multicall({ contracts });
  } catch (error) {
    const fallbackContracts = currencies.flatMap((currency) => [
      {
        address: currency as `0x${string}`,
        abi: erc20SymbolBytesAbi as any,
        functionName: "symbol" as const,
      },
      {
        address: currency as `0x${string}`,
        abi: erc20NameBytesAbi as any,
        functionName: "name" as const,
      },
      {
        address: currency as `0x${string}`,
        abi: erc20Abi as any,
        functionName: "decimals" as const,
      },
    ]);

    try {
      results = await client.multicall({ contracts: fallbackContracts });
    } catch (fallbackError: any) {
      console.log(
        `[ChainId: ${chainId}] Error getting metadata for tokens: ${fallbackError.message}`
      );
      return currencies.map(() => ({
        symbol: "UNKNOWN",
        name: "Unknown Token",
        decimals: 18,
      }));
    }
  }

  return currencies.map((currency, i) => {
    const baseIndex = i * 3;
    let symbol = "UNKNOWN";
    let name = "Unknown Token";
    let decimals = 18;

    if (results[baseIndex].status === "success") {
      const symbolResult = results[baseIndex].result;
      symbol =
        typeof symbolResult === "string"
          ? symbolResult
          : hexToString(symbolResult as `0x${string}`);
    }

    if (results[baseIndex + 1].status === "success") {
      const nameResult = results[baseIndex + 1].result;
      name =
        typeof nameResult === "string"
          ? nameResult
          : hexToString(nameResult as `0x${string}`);
    }

    if (results[baseIndex + 2].status === "success") {
      decimals = results[baseIndex + 2].result as number;
    }

    if (
      typeof decimals !== "number" ||
      decimals < 0 ||
      decimals > 255 ||
      !Number.isInteger(decimals)
    ) {
      console.log(
        `[ChainId: ${chainId}] Invalid decimals value ${decimals} for token ${currency}, using default value 18`
      );
      decimals = 18;
    }

    return {
      symbol: sanitizeString(symbol),
      name: sanitizeString(name),
      decimals,
    };
  });
};
