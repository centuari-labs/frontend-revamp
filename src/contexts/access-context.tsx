"use client";

import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
	type ReactNode,
} from "react";

interface AccessContextValue {
	/** Whether the current user has redeemed an access code */
	hasAccess: boolean;
	/** Whether the backend has responded with the access status (prevents flash) */
	isChecked: boolean;
	/** Update access state (called after login sync or code redemption) */
	setHasAccess: (granted: boolean) => void;
	/** Reset both flags on logout so state is clean for next login */
	resetAccess: () => void;
}

const AccessContext = createContext<AccessContextValue | undefined>(undefined);

export function AccessProvider({ children }: { children: ReactNode }) {
	const [hasAccess, setHasAccessState] = useState(false);
	const [isChecked, setIsChecked] = useState(false);

	const setHasAccess = useCallback((granted: boolean) => {
		setHasAccessState(granted);
		setIsChecked(true);
	}, []);

	const resetAccess = useCallback(() => {
		setHasAccessState(false);
		setIsChecked(false);
	}, []);

	const value = useMemo<AccessContextValue>(
		() => ({ hasAccess, isChecked, setHasAccess, resetAccess }),
		[hasAccess, isChecked, setHasAccess, resetAccess],
	);

	return (
		<AccessContext.Provider value={value}>{children}</AccessContext.Provider>
	);
}

export function useAccessContext(): AccessContextValue {
	const ctx = useContext(AccessContext);
	if (!ctx) {
		throw new Error(
			"useAccessContext must be used within an AccessProvider",
		);
	}
	return ctx;
}
