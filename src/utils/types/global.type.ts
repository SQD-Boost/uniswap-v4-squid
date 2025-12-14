export type TokenInfo = [
  address: string,
  name: string,
  symbol: string,
  decimals: number
];

export type Metadata = {
  height: number;
  hash: string;
  tokens: TokenInfo[];
};
