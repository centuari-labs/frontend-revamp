"use client";

import { useCallback, useEffect, useState } from "react";
import type { Token } from "@/types";
import { useDepositTokens } from "./use-deposit-tokens";

const STORAGE_KEY = "centuari_tokens";
const UPDATE_EVENT = "centuari-tokens-updated";

function readFromStorage(): Token[] {
	if (typeof window === "undefined") return [];
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) return [];
		return JSON.parse(stored) as Token[];
	} catch {
		return [];
	}
}

function writeToStorage(tokens: Token[]): void {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
		window.dispatchEvent(new Event(UPDATE_EVENT));
	} catch {
		// ignore write failures (e.g. private browsing storage limits)
	}
}

/**
 * Returns cached token metadata, serving from localStorage immediately
 * and refreshing in the background on every app load (stale-while-revalidate).
 *
 * isLoading is true only on first visit before any tokens are cached.
 */
export function useTokens(): { tokens: Token[]; isLoading: boolean } {
	const [tokens, setTokens] = useState<Token[]>(() => readFromStorage());

	const { data, isLoading: isFetching } = useDepositTokens();

	useEffect(() => {
		if (!data) return;
		writeToStorage(data as Token[]);
		setTokens(data as Token[]);
	}, [data]);

	const handleUpdate = useCallback(() => {
		setTokens(readFromStorage());
	}, []);

	useEffect(() => {
		if (typeof window === "undefined") return;
		window.addEventListener("storage", handleUpdate);
		window.addEventListener(UPDATE_EVENT, handleUpdate);
		return () => {
			window.removeEventListener("storage", handleUpdate);
			window.removeEventListener(UPDATE_EVENT, handleUpdate);
		};
	}, [handleUpdate]);

	return { tokens, isLoading: isFetching && tokens.length === 0 };
}

export function getTokenById(tokens: Token[], id: string): Token | undefined {
	return tokens.find((t) => t.id === id);
}
