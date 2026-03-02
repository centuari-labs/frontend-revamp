"use client";

import { useAccount, useReadContract } from "wagmi";
import { formatUnits, erc20Abi } from "viem";
import { useDepositTokens } from "@/hooks/use-deposit-tokens";
import { useMarketData } from "@/hooks/use-market-data";
import { useMemo } from "react";

/**
 * Reads the on-chain ERC20 balance for a given token symbol
 * using the connected wallet address.
 *
 * Looks up the token address from both deposit tokens (collateral)
 * and market data (loan tokens) so it works for any supported token.
 */
export function useOnChainBalance(tokenSymbol: string) {
	const { address } = useAccount();
	const { data: depositTokens } = useDepositTokens();
	const { markets } = useMarketData();

	const resolved = useMemo(() => {
		const sym = tokenSymbol.toLowerCase();

		// 1. Check deposit tokens (collateral tokens)
		const depositToken = depositTokens?.find(
			(t) => t.symbol.toLowerCase() === sym,
		);
		if (depositToken?.tokenAddress) {
			return {
				tokenAddress: depositToken.tokenAddress as `0x${string}`,
				decimals: depositToken.decimals ?? 18,
			};
		}

		// 2. Check market data (loan tokens like USDC, USDT, etc.)
		const marketAsset = markets.find(
			(m) => m.asset.symbol.toLowerCase() === sym,
		);
		if (marketAsset?.asset.token_address) {
			return {
				tokenAddress: marketAsset.asset.token_address as `0x${string}`,
				decimals: marketAsset.asset.decimals ?? 18,
			};
		}

		return null;
	}, [depositTokens, markets, tokenSymbol]);

	const tokenAddress = resolved?.tokenAddress;
	const decimals = resolved?.decimals ?? 18;

	const { data: rawBalance, isLoading } = useReadContract({
		address: tokenAddress,
		abi: erc20Abi,
		functionName: "balanceOf",
		args: address ? [address] : undefined,
		query: {
			enabled: !!tokenAddress && !!address,
			refetchInterval: 15_000,
			staleTime: 10_000,
		},
	});

	const formattedBalance = useMemo(() => {
		if (rawBalance == null) return 0;
		return Number(formatUnits(rawBalance as bigint, decimals));
	}, [rawBalance, decimals]);

	return {
		balance: formattedBalance,
		rawBalance: rawBalance as bigint | undefined,
		decimals,
		isLoading,
		hasToken: !!resolved,
	};
}
