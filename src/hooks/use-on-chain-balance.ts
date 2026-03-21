"use client";

import { useReadContract } from "wagmi";
import { formatUnits, erc20Abi } from "viem";
import { useDepositTokens } from "@/hooks/use-deposit-tokens";
import { useWalletAddress } from "@/hooks/use-wallet-address";
import { useMemo } from "react";

/**
 * Reads the on-chain ERC20 balance for a given token symbol
 * using the connected wallet address.
 *
 * Looks up the token address from deposit tokens.
 */
export function useOnChainBalance(tokenSymbol: string) {
	const address = useWalletAddress();
	const { data: depositTokens } = useDepositTokens();

	const resolved = useMemo(() => {
		const sym = tokenSymbol.toLowerCase();

		const depositToken = depositTokens?.find(
			(t) => t.symbol.toLowerCase() === sym,
		);
		if (depositToken?.tokenAddress) {
			return {
				tokenAddress: depositToken.tokenAddress as `0x${string}`,
				decimals: depositToken.decimals ?? 18,
			};
		}

		return null;
	}, [depositTokens, tokenSymbol]);

	const tokenAddress = resolved?.tokenAddress;
	const decimals = resolved?.decimals ?? 18;

	const { data: rawBalance, isLoading, error } = useReadContract({
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

	console.log("[OnChainBalance]", { address, tokenAddress, tokenSymbol, rawBalance, isLoading, error: error?.message });

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
