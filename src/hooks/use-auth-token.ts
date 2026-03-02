"use client";

import { useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";

/**
 * Returns a `getToken()` function that produces a Privy JWT
 * for authenticated API requests.
 */
export function useAuthToken() {
	const { getAccessToken } = usePrivy();

	const getToken = useCallback(
		async (): Promise<string | null> => {
			return getAccessToken();
		},
		[getAccessToken],
	);

	return { getToken };
}
