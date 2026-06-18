"use client";

import { useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { AuthError } from "@/lib/api-client";

/**
 * Returns a `getToken()` function that produces a Privy JWT
 * and an `authFetch()` helper that automatically retries on 401.
 *
 * Privy's `getAccessToken()` automatically refreshes expired tokens.
 * If the refresh token itself has expired (returns null while authenticated),
 * the user is logged out so they can re-authenticate.
 */
export function useAuthToken() {
	const { getAccessToken, authenticated, logout } = usePrivy();

	const getToken = useCallback(async (): Promise<string | null> => {
		const token = await getAccessToken();

		if (!token && authenticated) {
			// Refresh token expired — session is unrecoverable, force re-auth
			await logout();
			return null;
		}

		return token;
	}, [getAccessToken, authenticated, logout]);

	/**
	 * Executes an async function that requires a token.
	 * On 401 (AuthError), fetches a fresh token and retries once.
	 * Throws if the token is unavailable or the retry also fails.
	 */
	const authFetch = useCallback(
		async <T>(fn: (token: string) => Promise<T>): Promise<T> => {
			const token = await getToken();
			if (!token) throw new Error("No auth token");

			try {
				return await fn(token);
			} catch (error) {
				if (error instanceof AuthError) {
					const freshToken = await getToken();
					if (!freshToken) throw error;
					return await fn(freshToken);
				}
				throw error;
			}
		},
		[getToken],
	);

	return { getToken, authFetch };
}
