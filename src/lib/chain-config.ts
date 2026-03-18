import { arbitrum, arbitrumSepolia } from "viem/chains";

const IS_MAINNET = process.env.NEXT_PUBLIC_CHAIN_ENV === "mainnet";

export const ACTIVE_CHAIN = IS_MAINNET ? arbitrum : arbitrumSepolia;
export const ACTIVE_CHAIN_LABEL = IS_MAINNET
	? "Arbitrum"
	: "Arbitrum Sepolia";
