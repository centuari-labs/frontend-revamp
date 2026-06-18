"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useState } from "react";
import { ChevronDown, Check, Loader2, AlertTriangle } from "lucide-react";
import { ACTIVE_CHAIN } from "@/lib/chain-config";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

const EXPECTED_CAIP2 = `eip155:${ACTIVE_CHAIN.id}`;

const SUPPORTED_CHAINS = [
	{
		id: ACTIVE_CHAIN.id,
		name: ACTIVE_CHAIN.name,
		icon: "https://assets.coingecko.com/coins/images/16547/standard/arb.jpg?1721358242",
		caip2: EXPECTED_CAIP2,
	},
];

export function NetworkSwitcher() {
	const { user } = usePrivy();
	const { wallets } = useWallets();
	const [switching, setSwitching] = useState(false);
	const [open, setOpen] = useState(false);

	const linkedAddress = user?.wallet?.address?.toLowerCase();

	const loginWallet = linkedAddress
		? wallets.find(
				(w) =>
					w.walletClientType !== "privy" &&
					w.address.toLowerCase() === linkedAddress,
			)
		: undefined;

	// If no external wallet (social login / embedded only), don't show
	if (!loginWallet) return null;

	const currentChainId = loginWallet.chainId;
	const isCorrectNetwork = currentChainId === EXPECTED_CAIP2;

	const currentChain = isCorrectNetwork ? SUPPORTED_CHAINS[0] : null;

	const handleSwitchChain = async (chainId: number) => {
		if (!loginWallet || switching) return;
		setSwitching(true);
		try {
			await loginWallet.switchChain(chainId);
			setOpen(false);
		} catch {
			// User rejected or switch failed
		} finally {
			setSwitching(false);
		}
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					type="button"
					className={`flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium transition-all duration-200 hover:bg-white/10 ${
						isCorrectNetwork
							? "border-white/10 bg-white/5 text-white"
							: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
					}`}
				>
					{isCorrectNetwork && currentChain ? (
						<>
							<img
								src={currentChain.icon}
								alt={currentChain.name}
								className="h-5 w-5 rounded-full"
							/>
							<span className="hidden lg:inline">{currentChain.name}</span>
						</>
					) : (
						<>
							<AlertTriangle className="h-4 w-4" />
							<span className="hidden lg:inline">Wrong Network</span>
						</>
					)}
					<ChevronDown className="h-3.5 w-3.5 opacity-50" />
				</button>
			</PopoverTrigger>
			<PopoverContent
				align="start"
				sideOffset={8}
				className="z-200 w-56 rounded-xl border border-white/10 bg-white/5 p-1.5 backdrop-blur-[140px] shadow-2xl"
			>
				<p className="px-2.5 py-2 text-[11px] font-medium uppercase tracking-wider text-white/40">
					Networks
				</p>
				{SUPPORTED_CHAINS.map((chain) => {
					const isActive = currentChainId === chain.caip2;
					return (
						<button
							key={chain.id}
							type="button"
							onClick={() => handleSwitchChain(chain.id)}
							disabled={switching || isActive}
							className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm text-white transition-colors hover:bg-white/10 disabled:opacity-70"
						>
							<img
								src={chain.icon}
								alt={chain.name}
								className="h-6 w-6 rounded-full"
							/>
							<span className="flex-1 text-left font-medium">{chain.name}</span>
							{switching && !isActive ? (
								<Loader2 className="h-4 w-4 animate-spin text-white/50" />
							) : isActive ? (
								<div className="flex items-center gap-1.5">
									<div className="h-2 w-2 rounded-full bg-green-400" />
									<Check className="h-4 w-4 text-green-400" />
								</div>
							) : null}
						</button>
					);
				})}
			</PopoverContent>
		</Popover>
	);
}
