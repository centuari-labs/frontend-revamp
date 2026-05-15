import { getAddress, isAddress } from "viem";
import { z } from "zod";
import tokensJson from "@/../config/tokens.json";

const AddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);
const ChainSchema = z.record(z.string(), AddressSchema);
const RootSchema = z.record(z.string().regex(/^\d+$/), ChainSchema);

const { _meta: _META, ...chains } = tokensJson as Record<string, unknown>;
const parsed = RootSchema.parse(chains);

const ADDRESSES_BY_CHAIN: ReadonlyMap<number, ReadonlySet<string>> = new Map(
	Object.entries(parsed).map(([chainId, symbols]) => [
		Number(chainId),
		new Set(Object.values(symbols).map((addr) => getAddress(addr))),
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
