import { arbitrum, arbitrumSepolia } from "viem/chains";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

export const ACTIVE_CHAIN = IS_PRODUCTION ? arbitrum : arbitrumSepolia;
export const ACTIVE_CHAIN_LABEL = IS_PRODUCTION
	? "Arbitrum"
	: "Arbitrum Sepolia";
