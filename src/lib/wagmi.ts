import { createConfig } from "@privy-io/wagmi";
import { http, type Transport } from "wagmi";
import { ACTIVE_CHAIN } from "./chain-config";

export const wagmiConfig = createConfig({
	chains: [ACTIVE_CHAIN],
	transports: {
		[ACTIVE_CHAIN.id]: http(),
	} as Record<number, Transport>,
});
