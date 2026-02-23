import { createConfig } from "@privy-io/wagmi";
import { arbitrum } from "viem/chains";
import { http } from "wagmi";

export const wagmiConfig = createConfig({
	chains: [arbitrum],
	transports: {
		[arbitrum.id]: http(),
	},
});
