import { config } from "../../main";
import { Wallet } from "../../model";
import { getWalletId } from "../helpers/ids.helper";

export const createWallet = (address: string): Wallet => {
  const walletId = getWalletId(address);
  const wallet = new Wallet({
    id: walletId,
    chainId: config.chainId,
    walletAddress: address,
  });

  return wallet;
};
