import { formatDate } from "./utils";

/**
 * Returns 3 maturity timestamps: 1st of next month, 1st of month+1, 1st of month+2.
 * e.g. If today is Feb 1 → Mar 1, Apr 1, May 1
 *      If today is Mar 25 → Apr 1, May 1, Jun 1
 */
export function getAvailableMaturityTimestamps(): number[] {
	const now = new Date();
	const options: number[] = [];
	for (let i = 1; i <= 3; i++) {
		const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
		options.push(d.getTime());
	}
	return options;
}

/**
 * Returns the first of the 3 available maturity options (default selection).
 */
export function getDefaultMaturityTimestamp(): number {
	return getAvailableMaturityTimestamps()[0];
}

/**
 * Converts timestamp to display format (e.g., "1 Mar 2026").
 */
export function formatMaturityTimestamp(ts: number): string {
	return formatDate(ts);
}

/**
 * Returns maturity timestamp, or default when undefined/invalid.
 */
export function normalizeMaturity(value: number | undefined): number {
	if (
		value === undefined ||
		value === null ||
		typeof value !== "number" ||
		Number.isNaN(value)
	) {
		return getDefaultMaturityTimestamp();
	}
	return value;
}

/**
 * Checks if a timestamp is one of the valid maturity options.
 */
export function isValidMaturityTimestamp(ts: number): boolean {
	const options = getAvailableMaturityTimestamps();
	return options.includes(ts);
}
