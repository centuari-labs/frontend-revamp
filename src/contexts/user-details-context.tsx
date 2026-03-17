"use client";

import {
	createContext,
	useContext,
	useMemo,
	type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import {
	getUserDetails,
	type UserDetailsResponse,
	type UserAssetDetail,
	type UserDebtDetail,
} from "@/lib/api";
import { useAuthToken } from "@/hooks/use-auth-token";
import { usePrivy } from "@privy-io/react-auth";

interface UserDetailsContextValue {
	/** Full response from the user-details endpoint, null while loading or unauthenticated */
	userDetails: UserDetailsResponse | null;
	isLoading: boolean;
	isError: boolean;
	refetch: () => void;
}

const UserDetailsContext = createContext<UserDetailsContextValue | undefined>(
	undefined,
);

export function UserDetailsProvider({ children }: { children: ReactNode }) {
	const { getToken } = useAuthToken();
	const { user } = usePrivy();
	const address = user?.wallet?.address;

	const query = useQuery<UserDetailsResponse>({
		queryKey: ["user-details", address],
		queryFn: async () => {
			const token = await getToken();
			if (!token) throw new Error("No auth token");
			return getUserDetails(token);
		},
		staleTime: 10_000,
		refetchInterval: 15_000,
		enabled: !!address,
	});

	const value = useMemo<UserDetailsContextValue>(
		() => ({
			userDetails: query.data ?? null,
			isLoading: query.isLoading,
			isError: query.isError,
			refetch: query.refetch,
		}),
		[query.data, query.isLoading, query.isError, query.refetch],
	);

	return (
		<UserDetailsContext.Provider value={value}>
			{children}
		</UserDetailsContext.Provider>
	);
}

/** Access user details from any component. Must be within UserDetailsProvider. */
export function useUserDetailsContext(): UserDetailsContextValue {
	const ctx = useContext(UserDetailsContext);
	if (!ctx) {
		throw new Error(
			"useUserDetailsContext must be used within a UserDetailsProvider",
		);
	}
	return ctx;
}

/** Convenience: get a single asset by ID */
export function useUserAsset(
	assetId: string | undefined | null,
): UserAssetDetail | undefined {
	const { userDetails } = useUserDetailsContext();
	if (!assetId || !userDetails) return undefined;
	return userDetails.assets.find((a) => a.assetId === assetId);
}

export type { UserAssetDetail, UserDebtDetail, UserDetailsResponse };
