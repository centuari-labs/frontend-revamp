"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/lib/wagmi";

export const Provider = ({ children }: { children: React.ReactNode }) => {
	const queryClient = new QueryClient();

	return (
		<PrivyProvider appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}>
			<QueryClientProvider client={queryClient}>
				<QueryClientProvider client={queryClient}>
					<WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
				</QueryClientProvider>
			</QueryClientProvider>
		</PrivyProvider>
	);
};
