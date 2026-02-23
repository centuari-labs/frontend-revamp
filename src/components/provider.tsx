"use client";

import { useState } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "@privy-io/wagmi";
import { wagmiConfig } from "@/lib/wagmi";
import { EmbeddedWalletGuard } from "./embedded-wallet-guard";

export const Provider = ({ children }: { children: React.ReactNode }) => {
	const [queryClient] = useState(() => new QueryClient());

	return (
		<PrivyProvider
			appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
			config={{
				loginMethods: ["email", "google", "apple", "twitter"],
				appearance: {
					theme: "dark",
				},
				embeddedWallets: {
					ethereum: {
						createOnLogin: "users-without-wallets",
					},
				},
			}}
		>
			<QueryClientProvider client={queryClient}>
				<WagmiProvider config={wagmiConfig}>
					<EmbeddedWalletGuard>{children}</EmbeddedWalletGuard>
				</WagmiProvider>
			</QueryClientProvider>
		</PrivyProvider>
	);
};
