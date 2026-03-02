import { arbitrum, arbitrumSepolia } from "viem/chains";

// TODO: use process.env.NODE_ENV to determine the active chain and remove the hardcoded `IS_PRODUCTION` variable
const IS_PRODUCTION = false // process.env.NODE_ENV === "production";

export const ACTIVE_CHAIN = IS_PRODUCTION ? arbitrum : arbitrumSepolia;
export const ACTIVE_CHAIN_LABEL = IS_PRODUCTION
	? "Arbitrum"
	: "Arbitrum Sepolia";
