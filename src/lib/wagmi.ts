import { createConfig, http, injected } from "wagmi";
import { base } from "wagmi/chains";

export const wagmiConfig = createConfig({
	chains: [{
    id: base.id,
    name: base.name,
    nativeCurrency: base.nativeCurrency,
    rpcUrls: base.rpcUrls,
    blockExplorers: base.blockExplorers,
  }],
	connectors: [injected()],
	transports: {
		[base.id]: http(),
	},
});
