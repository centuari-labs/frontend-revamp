/**
 * TanStack Query configuration constants.
 *
 * The global default staleTime (10_000) is set in provider.tsx.
 * Only import these when overriding the default or setting a refetchInterval.
 */

export const QUERY_CONFIG = {
	/** Standard polling interval for frequently-updated data (15 s) */
	POLLING_INTERVAL: 15_000,
	/** Longer polling interval for less-critical data (30 s) */
	LONG_POLLING_INTERVAL: 30_000,
	/** Stale time for rarely-changing data like token lists (6 hours).
	 * Also serves as the TTL for the localStorage token cache (src/lib/token-cache.ts). */
	DEPOSIT_TOKENS_STALE_TIME: 6 * 60 * 60 * 1000,
} as const;
