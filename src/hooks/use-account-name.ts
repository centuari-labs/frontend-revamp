"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useSyncExternalStore } from "react";

const LS_USERNAME_KEY = "centuari_username";

function getSnapshot(): string {
	if (typeof window === "undefined") return "";
	return localStorage.getItem(LS_USERNAME_KEY) ?? "";
}

function getServerSnapshot(): string {
	return "";
}

function subscribe(callback: () => void): () => void {
	// Listen for storage changes from other tabs
	window.addEventListener("storage", callback);
	// Listen for custom event so same-tab updates (from user menu save) are picked up
	window.addEventListener("centuari_username_changed", callback);
	return () => {
		window.removeEventListener("storage", callback);
		window.removeEventListener("centuari_username_changed", callback);
	};
}

function getDefaultUsername(user: ReturnType<typeof usePrivy>["user"]): string {
	const email = user?.email?.address;
	if (email) return email.split("@")[0];

	const google = user?.google?.name;
	if (google) return google;

	const twitter = user?.twitter?.name;
	if (twitter) return twitter;

	return "User";
}

export function useAccountName(): string | null {
	const { user, authenticated } = usePrivy();
	const stored = useSyncExternalStore(
		subscribe,
		getSnapshot,
		getServerSnapshot,
	);
	if (stored) return stored;
	if (!authenticated) return null;
	return getDefaultUsername(user);
}
