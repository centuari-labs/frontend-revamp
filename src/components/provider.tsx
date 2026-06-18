"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/lib/wagmi";
import { ACTIVE_CHAIN, PRIVY_APP_ID } from "@/lib/chain-config";
import { EmbeddedWalletGuard } from "./embedded-wallet-guard";
import { PriceProvider } from "@/contexts/price-context";
import { UserDetailsProvider } from "@/contexts/user-details-context";
import { AccessProvider } from "@/contexts/access-context";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 10_000,
			refetchOnWindowFocus: false,
		},
	},
});

export const Provider = ({ children }: { children: React.ReactNode }) => {
	return (
		<PrivyProvider
			appId={PRIVY_APP_ID}
			config={{
				loginMethods: ["email", "google", "twitter"],
				appearance: {
					theme: "dark",
				},
				defaultChain: ACTIVE_CHAIN,
				supportedChains: [ACTIVE_CHAIN],
				embeddedWallets: {
					ethereum: {
						createOnLogin: "users-without-wallets",
					},
				},
			}}
		>
			<QueryClientProvider client={queryClient}>
				<WagmiProvider config={wagmiConfig}>
					<AccessProvider>
						<EmbeddedWalletGuard>
							<PriceProvider>
								<UserDetailsProvider>{children}</UserDetailsProvider>
							</PriceProvider>
						</EmbeddedWalletGuard>
					</AccessProvider>
				</WagmiProvider>
			</QueryClientProvider>
		</PrivyProvider>
	);
};
