import { Wallet } from "../../../../model";
import { CHAIN_ID } from "../constants/network.constant";
import { getWalletId } from "../helpers/ids.helper";

export const createWallet = (address: string): Wallet => {
  const walletId = getWalletId(address);
  const wallet = new Wallet({
    id: walletId,
    chainId: CHAIN_ID,
    walletAddress: address,
  });

  return wallet;
};
