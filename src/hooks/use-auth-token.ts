"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useCallback } from "react";

export function useAuthToken() {
	const { getAccessToken, authenticated, user } = usePrivy();

	const getToken = useCallback(async (): Promise<string> => {
		const token = await getAccessToken();
		if (!token) throw new Error("Not authenticated");
		return token;
	}, [getAccessToken]);

	return { getToken, authenticated, user };
}
