import { arbitrum, arbitrumSepolia } from "viem/chains";

const chainEnv = process.env.NEXT_PUBLIC_CHAIN_ENV;
if (chainEnv !== "mainnet" && chainEnv !== "testnet" && chainEnv !== undefined) {
	throw new Error(
		`Unrecognized NEXT_PUBLIC_CHAIN_ENV: ${chainEnv}. Expected "mainnet", "testnet", or unset.`,
	);
}

const IS_MAINNET = chainEnv === "mainnet";

export const ACTIVE_CHAIN = IS_MAINNET ? arbitrum : arbitrumSepolia;
export const ACTIVE_CHAIN_LABEL = IS_MAINNET
	? "Arbitrum"
	: "Arbitrum Sepolia";
