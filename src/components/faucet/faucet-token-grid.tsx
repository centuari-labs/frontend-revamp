"use client";

import { useEffect, useState, useMemo } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { cn } from "@/lib/utils";
import { CentuariTypography } from "@/components/centuari-typography";
import { CentuariButton } from "@/components/centuari-button";
import { CentuariLoginDialog } from "@/components/centuari-login-dialog";
import { CentuariGlassLayers } from "@/components/centuari-glass-surface";
import { FaucetErrorPage } from "./faucet-error-page";
import { FaucetTokenCard } from "./faucet-token-card";
import { useFaucetDrip } from "@/hooks/use-faucet-drip";
import { useTokens } from "@/hooks/use-tokens";
import { ACTIVE_CHAIN } from "@/lib/chain-config";

const DRIP_AMOUNTS: Record<string, number> = {
	USDC: 5000,
	IDRX: 10000000,
	XSGD: 7000,
	BTC: 1,
	ETH: 5,
	USDT: 5000,
	XAUT: 5,
	NVDAON: 100,
	AAPLON: 100,
	SLVON: 100,
	TLTON: 100,
};

export function FaucetTokenGrid() {
	const { authenticated } = usePrivy();
	const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set());
	const [loginDialogOpen, setLoginDialogOpen] = useState(false);
	const { requestDrip, status, error, transactionHash, reset } =
		useFaucetDrip();
	const { tokens: depositTokens, isLoading: isTokensLoading } = useTokens();

	const tokens = useMemo(() => {
		if (!depositTokens || depositTokens.length === 0) return [];

		return depositTokens.map((t) => {
			const symbol = t.symbol.toUpperCase();
			return {
				value: t.symbol.toLowerCase(),
				label: t.symbol,
				icon: t.imageUrl || "/tokens/usdc-icon.webp",
				tokenAddress: t.tokenAddress,
				dripAmount: DRIP_AMOUNTS[symbol] || 1000,
			};
		});
	}, [depositTokens]);

	const toggleToken = (value: string) => {
		setSelectedTokens((prev) => {
			const next = new Set(prev);
			if (next.has(value)) {
				next.delete(value);
			} else {
				next.add(value);
			}
			return next;
		});
	};

	const handleRequestDrip = async () => {
		if (!authenticated) {
			setLoginDialogOpen(true);
			return;
		}

		const selectedAddresses = tokens
			.filter((t) => selectedTokens.has(t.value))
			.map((t) => t.tokenAddress);

		const result = await requestDrip(selectedAddresses);
		if (result) {
			setSelectedTokens(new Set());
		}
	};

	// Auto-reset success/error status after 3 seconds
	useEffect(() => {
		if (status === "success" || status === "error") {
			const timer = setTimeout(reset, 8000);
			return () => clearTimeout(timer);
		}
	}, [status, reset]);

	const isLoading = status === "loading" || isTokensLoading;

	if (!isTokensLoading && depositTokens.length === 0) {
		return <FaucetErrorPage />;
	}

	return (
		<div className="mt-6 pb-28">
			{/* Token grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
				{tokens.map((token) => (
					<FaucetTokenCard
						key={token.value}
						token={token}
						selected={selectedTokens.has(token.value)}
						onToggle={toggleToken}
					/>
				))}
			</div>

			{/* Sticky bottom bar */}
			{(selectedTokens.size > 0 ||
				status === "success" ||
				status === "error") && (
				<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-7xl px-6">
					<div
						className={cn(
							"group/glass relative isolate overflow-hidden bg-black/40 backdrop-blur-2xl border-0 rounded-2xl shadow-2xl",
							status === "success" && "shadow-[0_0_24px_rgba(16,185,129,0.25)]",
							status === "error" && "shadow-[0_0_24px_rgba(239,68,68,0.25)]",
						)}
					>
						<CentuariGlassLayers intensity="soft" />
						{status === "success" && (
							<span
								aria-hidden
								className="pointer-events-none absolute inset-0 rounded-[inherit] z-10 bg-emerald-500/10 ring-1 ring-emerald-400/30"
							/>
						)}
						{status === "error" && (
							<span
								aria-hidden
								className="pointer-events-none absolute inset-0 rounded-[inherit] z-10 bg-red-500/10 ring-1 ring-red-400/30"
							/>
						)}
						<div className="relative z-20 px-6 py-4 flex items-center justify-between">
							<div>
								{status === "success" ? (
									<>
										<CentuariTypography
											variant="title-md"
											className="font-semibold"
										>
											Tokens Dripped Successfully
										</CentuariTypography>
										{transactionHash ? (
											<a
												href={`${ACTIVE_CHAIN.blockExplorers.default.url}/tx/${transactionHash}`}
												target="_blank"
												rel="noopener noreferrer"
												className="text-emerald-300/80 hover:text-emerald-200 text-xs uppercase tracking-wider underline underline-offset-2 transition-colors"
											>
												Tx: {transactionHash.slice(0, 6)}...
												{transactionHash.slice(-4)}
											</a>
										) : (
											<CentuariTypography
												variant="subheading-sm"
												className="text-emerald-300/60 uppercase tracking-wider"
											>
												Check your wallet
											</CentuariTypography>
										)}
									</>
								) : status === "error" ? (
									<>
										<CentuariTypography
											variant="title-md"
											className="font-semibold"
										>
											Drip Failed
										</CentuariTypography>
										<CentuariTypography
											variant="subheading-sm"
											className="text-red-300/60 uppercase tracking-wider"
										>
											{error ?? "Something went wrong"}
										</CentuariTypography>
									</>
								) : (
									<>
										<CentuariTypography
											variant="title-md"
											className="font-semibold"
										>
											{selectedTokens.size} Asset
											{selectedTokens.size > 1 ? "s" : ""} Selected
										</CentuariTypography>
										<CentuariTypography
											variant="subheading-sm"
											className="text-white/40 uppercase tracking-wider"
										>
											Ready to Drip
										</CentuariTypography>
									</>
								)}
							</div>
							{status !== "success" && status !== "error" && (
								<CentuariButton
									variant="primary"
									onClick={handleRequestDrip}
									disabled={isLoading}
								>
									{!authenticated
										? "Login to Request \u2192"
										: isLoading && status === "loading"
											? "Requesting..."
											: "Request Drip \u2192"}
								</CentuariButton>
							)}
						</div>
					</div>
				</div>
			)}
			<CentuariLoginDialog
				open={loginDialogOpen}
				onOpenChange={setLoginDialogOpen}
				showTrigger={false}
			/>
		</div>
	);
}
