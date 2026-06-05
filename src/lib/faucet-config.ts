export const IS_FAUCET_ENABLED =
	process.env.NEXT_PUBLIC_CHAIN_ENV !== "mainnet";

export function isFaucetEnabled(): boolean {
	return process.env.NEXT_PUBLIC_CHAIN_ENV !== "mainnet";
}
