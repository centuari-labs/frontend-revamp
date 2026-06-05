import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
	DetectedWallet,
	EIP1193Provider,
} from "@/hooks/use-detected-wallets";

const mockLogout = vi.fn();
const mockUsePrivy = vi.fn();
const mockClear = vi.fn();
const mockResetAccess = vi.fn();
const mockUseDetectedWallets = vi.fn();

vi.mock("@privy-io/react-auth", () => ({
	usePrivy: () => mockUsePrivy(),
}));

vi.mock("@tanstack/react-query", () => ({
	useQueryClient: () => ({ clear: mockClear }),
}));

vi.mock("@/contexts/access-context", () => ({
	useAccessContext: () => ({ resetAccess: mockResetAccess }),
}));

vi.mock("@/hooks/use-detected-wallets", () => ({
	useDetectedWallets: () => mockUseDetectedWallets(),
}));

import { useWalletDisconnectListener } from "@/hooks/use-wallet-disconnect-listener";

const CURRENT_ADDRESS = "0xf39fd6e51aad88f6f4ce6ab8827279cffFb92266";
const OTHER_ADDRESS = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

type AccountsChangedHandler = (accounts: unknown) => void;

function makeWallet(): {
	wallet: DetectedWallet;
	emit: (accounts: unknown) => void;
} {
	let handler: AccountsChangedHandler | undefined;
	const provider: EIP1193Provider = {
		request: vi.fn(),
		on: (event, h) => {
			if (event === "accountsChanged") handler = h as AccountsChangedHandler;
		},
		removeListener: () => {
			handler = undefined;
		},
	};
	return {
		wallet: {
			info: { uuid: "1", name: "MetaMask", icon: "", rdns: "io.metamask" },
			provider,
		},
		emit: (accounts) => handler?.(accounts),
	};
}

beforeEach(() => {
	vi.clearAllMocks();
	mockUsePrivy.mockReturnValue({
		ready: true,
		authenticated: true,
		user: {
			wallet: { address: CURRENT_ADDRESS },
			linkedAccounts: [{ type: "wallet", walletClientType: "metamask" }],
		},
		logout: mockLogout,
	});
});

describe("useWalletDisconnectListener", () => {
	it("clears the query cache and logs out when the account switches", () => {
		const { wallet, emit } = makeWallet();
		mockUseDetectedWallets.mockReturnValue([wallet]);

		renderHook(() => useWalletDisconnectListener());
		emit([OTHER_ADDRESS]);

		expect(mockLogout).toHaveBeenCalledTimes(1);
		expect(mockClear).toHaveBeenCalledTimes(1);
		expect(mockResetAccess).toHaveBeenCalledTimes(1);
	});

	it("clears the query cache and logs out when the wallet disconnects (no accounts)", () => {
		const { wallet, emit } = makeWallet();
		mockUseDetectedWallets.mockReturnValue([wallet]);

		renderHook(() => useWalletDisconnectListener());
		emit([]);

		expect(mockLogout).toHaveBeenCalledTimes(1);
		expect(mockClear).toHaveBeenCalledTimes(1);
		expect(mockResetAccess).toHaveBeenCalledTimes(1);
	});

	it("does nothing when the account is unchanged", () => {
		const { wallet, emit } = makeWallet();
		mockUseDetectedWallets.mockReturnValue([wallet]);

		renderHook(() => useWalletDisconnectListener());
		emit([CURRENT_ADDRESS]);

		expect(mockLogout).not.toHaveBeenCalled();
		expect(mockClear).not.toHaveBeenCalled();
	});

	it("does not listen for email/social (non-external) logins", () => {
		const { wallet, emit } = makeWallet();
		mockUseDetectedWallets.mockReturnValue([wallet]);
		mockUsePrivy.mockReturnValue({
			ready: true,
			authenticated: true,
			user: {
				wallet: { address: CURRENT_ADDRESS },
				linkedAccounts: [{ type: "wallet", walletClientType: "privy" }],
			},
			logout: mockLogout,
		});

		renderHook(() => useWalletDisconnectListener());
		emit([OTHER_ADDRESS]);

		expect(mockLogout).not.toHaveBeenCalled();
		expect(mockClear).not.toHaveBeenCalled();
	});
});
