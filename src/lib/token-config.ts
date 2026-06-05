import { getAddress, isAddress } from "viem";
import { z } from "zod";
import mainnetTokensJson from "@/../config/tokens.mainnet.json";
import testnetTokensJson from "@/../config/tokens.testnet.json";

const AddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);
const TokenConfigSchema = z.object({
	address: AddressSchema,
	decimals: z.number().int().min(0).max(36),
});
const TokenEntrySchema = z.union([AddressSchema, TokenConfigSchema]);
const ChainSchema = z.record(z.string(), TokenEntrySchema);
const RootSchema = z.record(z.string().regex(/^\d+$/), ChainSchema);

function parseTokenFile(tokensJson: Record<string, unknown>) {
	const { _meta: _META, ...chains } = tokensJson;
	return RootSchema.parse(chains);
}

const parsed = {
	...parseTokenFile(mainnetTokensJson as Record<string, unknown>),
	...parseTokenFile(testnetTokensJson as Record<string, unknown>),
};

export type AllowlistedTokenConfig = {
	address: `0x${string}`;
	decimals?: number;
};

function normalizeEntry(entry: z.infer<typeof TokenEntrySchema>) {
	if (typeof entry === "string") {
		return { address: getAddress(entry) } satisfies AllowlistedTokenConfig;
	}
	return {
		address: getAddress(entry.address),
		decimals: entry.decimals,
	} satisfies AllowlistedTokenConfig;
}

const TOKENS_BY_CHAIN: ReadonlyMap<
	number,
	ReadonlyMap<string, AllowlistedTokenConfig>
> = new Map(
	Object.entries(parsed).map(([chainId, symbols]) => {
		const tokens = new Map(
			Object.entries(symbols).map(([symbol, entry]) => [
				symbol.toUpperCase(),
				normalizeEntry(entry),
			]),
		);
		return [Number(chainId), tokens];
	}),
);

const ADDRESSES_BY_CHAIN: ReadonlyMap<number, ReadonlySet<string>> = new Map(
	[...TOKENS_BY_CHAIN.entries()].map(([chainId, symbols]) => [
		chainId,
		new Set([...symbols.values()].map((entry) => entry.address)),
	]),
);

export function isAllowlistedAddress(
	chainId: number,
	address: string,
): boolean {
	if (typeof address !== "string" || !isAddress(address)) return false;
	const set = ADDRESSES_BY_CHAIN.get(chainId);
	if (!set) return false;
	return set.has(getAddress(address));
}

export function getAllowlistedAddresses(
	chainId: number,
): readonly `0x${string}`[] {
	const set = ADDRESSES_BY_CHAIN.get(chainId);
	if (!set) return [];
	return [...set] as `0x${string}`[];
}

export function getAllowlistedTokenConfig(
	chainId: number,
	symbol: string,
): AllowlistedTokenConfig | undefined {
	return TOKENS_BY_CHAIN.get(chainId)?.get(symbol.toUpperCase());
}

export function assertAllowlistedAddress(
	chainId: number,
	address: unknown,
	context: string,
): `0x${string}` {
	if (typeof address !== "string" || !isAddress(address)) {
		const preview =
			typeof address === "string"
				? `${address.slice(0, 10)}…`
				: `<${typeof address}>`;
		throw new Error(`Invalid Ethereum address (${context}): ${preview}`);
	}
	const checksummed = getAddress(address);
	const set = ADDRESSES_BY_CHAIN.get(chainId);
	if (!set || !set.has(checksummed)) {
		throw new Error(
			`Address not in allowlist for chain ${chainId} (${context}): ${checksummed}`,
		);
	}
	return checksummed;
}
