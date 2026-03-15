import { createConfig } from "@privy-io/wagmi";
import { http, type Transport } from "wagmi";
import { ACTIVE_CHAIN } from "./chain-config";

const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || undefined;

export const wagmiConfig = createConfig({
	chains: [ACTIVE_CHAIN],
	batch: {
		multicall: true,
	},
	transports: {
		[ACTIVE_CHAIN.id]: http(rpcUrl, {
			batch: true,
			retryCount: 3,
			retryDelay: 1000,
		}),
	} as Record<number, Transport>,
});
