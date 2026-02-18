/** biome-ignore-all lint/performance/noImgElement: <explanation> */
"use client";

import * as React from "react";
import {
  useLoginWithSiwe,
  usePrivy,
  useWallets,
} from "@privy-io/react-auth";
import { useSetActiveWallet } from "@privy-io/wagmi";
import { ArrowLeft, Search, X } from "lucide-react";
import { useEffect, useId } from "react";
import {
  type Connector,
  useChainId,
  useConnect,
  useConnection,
  useConnectors,
} from "wagmi";
import { CentuariButton } from "./centuari-button";
import { CentuariInput } from "./centuari-input";
import { CentuariTypography } from "./centuari-typography";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";

export function CentuariConnectWallet({ onBack }: { onBack: () => void }) {
  const id = useId();
  const { connectAsync } = useConnect();
  const chainId = useChainId();
  const { setActiveWallet } = useSetActiveWallet();
  const { address: wagmiAddress, isConnected } = useConnection();
  const { wallets } = useWallets();
  const { authenticated } = usePrivy();
  const { generateSiweMessage, loginWithSiwe } = useLoginWithSiwe();

  const connectors = useConnectors();

  const handleLogin = async (connector: Connector) => {
    connectAsync({ connector, chainId }).then(async (result) => {
      const activeWallet = result.accounts[0];

      const walletInPrivy = wallets.find(
        (wallet) => wallet.address === activeWallet
      );

      await setActiveWallet(walletInPrivy!);

      const message = await generateSiweMessage({
        address: walletInPrivy?.address as string,
        chainId: `eip155:${chainId}`,
      });

      const signature = (await walletInPrivy?.sign(message)) as string;
      await loginWithSiwe({ signature, message });
    });
  };

  const connectPrivy = async () => {
    const walletInPrivy = wallets.find(
      (wallet) => wallet.address === wagmiAddress
    );

    if (!walletInPrivy) {
      console.error("Wallet not found in Privy wallets");
      return;
    }

    const message = await generateSiweMessage({
      address: walletInPrivy?.address as string,
      chainId: `eip155:${chainId}`,
    });

    const signature = (await walletInPrivy?.sign(message)) as string;
    await loginWithSiwe({ signature, message });
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (!authenticated && wagmiAddress && isConnected) {
      connectPrivy();
    }
  }, [wagmiAddress, authenticated, isConnected]);

  return (
    <div className="flex flex-col gap-0 sm:max-w-md">
      <Button onClick={onBack} variant="ghost" className="justify-start w-fit">
        <ArrowLeft size={24} />
      </Button>
      <div className="contents space-y-0 text-left">
        <div className="mt-6 flex flex-col gap-4 mb-8">
          <CentuariTypography variant="heading-md">
            Connect Centuari With Your Wallet
          </CentuariTypography>
        </div>
        <CentuariInput
          id={id}
          size="medium"
          placeholder="Search something"
          leftIcon={<Search size={16} />}
          rightIcon={<X size={16} />}
          disabled={true}
        />
        <CentuariTypography className="text-sm text-muted-foreground mt-4">
          Available Wallets
        </CentuariTypography>
        <ScrollArea className="bg-white/5 h-48 md:h-72 border rounded-md border-white/5 mt-2">
          <div className="flex flex-col py-1.5 gap-2">
            {/* <button
								type="button"
								key={`wallet-option-${id}`}
								onClick={handleLogin}
								className="px-3 py-1.5 hover:bg-white/10 cursor-pointer flex items-center gap-4"
							>
								<div className="bg-white rounded-lg h-8 w-8 flex items-center justify-center">
									<Image
										src={"/assets/rabby.png"}
										alt="MetaMask"
										width={24}
										height={24}
									/>
								</div>
								<CentuariTypography className="text-white">
									Rabby Wallet
								</CentuariTypography>
							</button> */}
            {connectors
              .filter((connector) => connector.id !== "injected")
              .map((connector) => {
                return (
                  <button
                    type="button"
                    key={`wallet-option-${connector.id}`}
                    onClick={() => handleLogin(connector)}
                    className="px-3 py-1.5 hover:bg-white/10 cursor-pointer flex items-center gap-4"
                  >
                    <div className=" rounded-lg h-8 w-8 flex items-center justify-center">
                      <img src={connector.icon || ""} alt={connector.name} />
                    </div>
                    <CentuariTypography className="text-white">
                      {connector.name}
                    </CentuariTypography>
                  </button>
                );
              })}
          </div>
        </ScrollArea>
        <CentuariTypography className="text-sm text-center text-muted-foreground mt-4">
          By connecting your wallet and using Centuari, you agree to our Terms
          of <span className="text-white">Service & Privacy Policy.</span>
        </CentuariTypography>
      </div>
    </div>
  );
}
