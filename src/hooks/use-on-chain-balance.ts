"use client";

import { useAccount, useReadContract } from "wagmi";
import { formatUnits, erc20Abi } from "viem";
import { useDepositTokens } from "@/hooks/use-deposit-tokens";
import { useMemo } from "react";

/**
 * Reads the on-chain ERC20 balance for a given token symbol
 * using the connected wallet address.
 */
export function useOnChainBalance(tokenSymbol: string) {
	const { address } = useAccount();
	const { data: depositTokens } = useDepositTokens();

	const token = useMemo(
		() =>
			depositTokens?.find(
				(t) => t.symbol.toLowerCase() === tokenSymbol.toLowerCase(),
			),
		[depositTokens, tokenSymbol],
	);

	const tokenAddress = token?.tokenAddress as `0x${string}` | undefined;
	const decimals = token?.decimals ?? 18;

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
		hasToken: !!token,
	};
}
