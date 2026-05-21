import { arbitrum, arbitrumSepolia } from "viem/chains";

const chainEnv = process.env.NEXT_PUBLIC_CHAIN_ENV;
if (
	chainEnv !== "mainnet" &&
	chainEnv !== "testnet" &&
	chainEnv !== undefined
) {
	throw new Error(
		`Unrecognized NEXT_PUBLIC_CHAIN_ENV: ${chainEnv}. Expected "mainnet", "testnet", or unset.`,
	);
}

const IS_MAINNET = chainEnv === "mainnet";

export const ACTIVE_CHAIN = IS_MAINNET ? arbitrum : arbitrumSepolia;
export const ACTIVE_CHAIN_LABEL = IS_MAINNET ? "Arbitrum" : "Arbitrum Sepolia";

function requireAddress(
	name: string,
	value: string | undefined,
): `0x${string}` {
	if (!value || !/^0x[a-fA-F0-9]{40}$/.test(value)) {
		throw new Error(
			`[chain-config] Missing or invalid ${name}. Run \`cd smart-contract-revamp && ./bin/sync-to-services.sh\` to regenerate frontend-revamp/.env.local.`,
		);
	}
	return value as `0x${string}`;
}

export const HUB_DEPOSITOR_ADDRESS = requireAddress(
	"NEXT_PUBLIC_HUB_DEPOSITOR_ADDRESS",
	process.env.NEXT_PUBLIC_HUB_DEPOSITOR_ADDRESS,
);

export const COLLATERAL_MANAGER_ADDRESS = requireAddress(
	"NEXT_PUBLIC_COLLATERAL_MANAGER_ADDRESS",
	process.env.NEXT_PUBLIC_COLLATERAL_MANAGER_ADDRESS,
);
