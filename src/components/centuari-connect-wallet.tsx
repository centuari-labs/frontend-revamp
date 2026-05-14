/** biome-ignore-all lint/performance/noImgElement: <explanation> */
"use client";

import { useLoginWithSiwe } from "@privy-io/react-auth";
import { ArrowLeft, Search, X } from "lucide-react";
import { useId, useState } from "react";
import { getAddress } from "viem";
import { CentuariInput } from "./centuari-input";
import { CentuariTypography } from "./centuari-typography";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import {
	useDetectedWallets,
	type DetectedWallet,
} from "@/hooks/use-detected-wallets";
import { ACTIVE_CHAIN } from "@/lib/chain-config";

export function CentuariConnectWallet({ onBack }: { onBack: () => void }) {
	const id = useId();
	const { generateSiweMessage, loginWithSiwe } = useLoginWithSiwe();
	const detectedWallets = useDetectedWallets();
	const [connecting, setConnecting] = useState<string | null>(null);

	const handleWalletLogin = async (wallet: DetectedWallet) => {
		try {
			setConnecting(wallet.info.rdns);

			// Request accounts from the wallet provider
			const accounts = (await wallet.provider.request({
				method: "eth_requestAccounts",
			})) as string[];
			const rawAddress = accounts[0];

			if (!rawAddress) {
				throw new Error("No account returned from wallet");
			}

			// EIP-55 checksum required by SIWE spec
			const address = getAddress(rawAddress);

			// Switch wallet to the correct chain before SIWE login
			const targetChainHex = `0x${ACTIVE_CHAIN.id.toString(16)}`;
			try {
				await wallet.provider.request({
					method: "wallet_switchEthereumChain",
					params: [{ chainId: targetChainHex }],
				});
			} catch (switchErr: unknown) {
				// Chain not added — try adding it
				if ((switchErr as { code?: number })?.code === 4902) {
					await wallet.provider.request({
						method: "wallet_addEthereumChain",
						params: [
							{
								chainId: targetChainHex,
								chainName: ACTIVE_CHAIN.name,
								rpcUrls: [ACTIVE_CHAIN.rpcUrls.default.http[0]],
								nativeCurrency: ACTIVE_CHAIN.nativeCurrency,
								blockExplorerUrls: ACTIVE_CHAIN.blockExplorers
									? [ACTIVE_CHAIN.blockExplorers.default.url]
									: undefined,
							},
						],
					});
				} else {
					throw switchErr;
				}
			}

			const chainId = ACTIVE_CHAIN.id;

			// Generate SIWE message via Privy
			const message = await generateSiweMessage({
				address,
				chainId: `eip155:${chainId}`,
			});

			// Sign with the wallet provider directly
			const signature = (await wallet.provider.request({
				method: "personal_sign",
				params: [message, address],
			})) as string;

			// Complete Privy login
			await loginWithSiwe({ signature, message });
		} catch (err) {
			console.error(`Wallet login error (${wallet.info.name}):`, err);
		} finally {
			setConnecting(null);
		}
	};

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
						{detectedWallets.map((wallet) => (
							<button
								type="button"
								key={`wallet-option-${wallet.info.rdns}`}
								onClick={() => handleWalletLogin(wallet)}
								disabled={connecting !== null}
								className="px-3 py-1.5 hover:bg-white/10 cursor-pointer flex items-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<div className="rounded-lg h-8 w-8 flex items-center justify-center">
									<img
										src={wallet.info.icon}
										alt={wallet.info.name}
										className="h-8 w-8 rounded-lg"
									/>
								</div>
								<CentuariTypography className="text-white">
									{connecting === wallet.info.rdns
										? `Connecting ${wallet.info.name}...`
										: wallet.info.name}
								</CentuariTypography>
							</button>
						))}
						{detectedWallets.length === 0 && (
							<CentuariTypography className="text-sm text-muted-foreground px-3 py-4 text-center">
								No wallet extensions detected. Please install a wallet like
								Rabby or MetaMask.
							</CentuariTypography>
						)}
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
