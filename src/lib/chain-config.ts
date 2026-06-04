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

// Fail closed in production: a prod build must declare its target chain
// explicitly so it can never silently inherit the testnet default (D5).
if (process.env.NODE_ENV === "production" && chainEnv === undefined) {
	throw new Error(
		`[chain-config] NEXT_PUBLIC_CHAIN_ENV must be set explicitly ("mainnet" or "testnet") in a production build — refusing to fall back to the testnet default.`,
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

function requireValue(name: string, value: string | undefined): string {
	if (!value) {
		throw new Error(
			`[chain-config] Missing ${name}. Set it in your environment (.env.local) before building — mainnet and testnet use separate Privy apps.`,
		);
	}
	return value;
}

// Privy app id is env-specific (testnet and mainnet are distinct Privy apps);
// guard it here so a build with no app id fails at import rather than opaquely
// at runtime (D5).
export const PRIVY_APP_ID = requireValue(
	"NEXT_PUBLIC_PRIVY_APP_ID",
	process.env.NEXT_PUBLIC_PRIVY_APP_ID,
);
