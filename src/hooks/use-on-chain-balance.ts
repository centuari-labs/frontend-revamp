"use client";

import { useReadContract } from "wagmi";
import { formatUnits, erc20Abi, getAddress } from "viem";
import { useDepositTokens } from "@/hooks/use-deposit-tokens";
import { useWalletAddress } from "@/hooks/use-wallet-address";
import { ACTIVE_CHAIN } from "@/lib/chain-config";
import { isValidDecimals } from "@/lib/erc20-decimals";
import { isAllowlistedAddress } from "@/lib/token-config";
import { QUERY_CONFIG } from "@/lib/query-config";
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
		if (!depositToken?.tokenAddress) return null;
		if (!isAllowlistedAddress(ACTIVE_CHAIN.id, depositToken.tokenAddress)) {
			return null;
		}
		if (!isValidDecimals(depositToken.decimals)) return null;
		return {
			tokenAddress: getAddress(depositToken.tokenAddress),
			decimals: depositToken.decimals,
		};
	}, [depositTokens, tokenSymbol]);

	const tokenAddress = resolved?.tokenAddress;
	const decimals = resolved?.decimals;

	const { data: rawBalance, isLoading } = useReadContract({
		address: tokenAddress,
		abi: erc20Abi,
		functionName: "balanceOf",
		args: address ? [address] : undefined,
		query: {
			enabled: !!tokenAddress && !!address,
			refetchInterval: QUERY_CONFIG.POLLING_INTERVAL,
		},
	});

	const formattedBalance = useMemo(() => {
		if (rawBalance == null || decimals == null) return 0;
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
