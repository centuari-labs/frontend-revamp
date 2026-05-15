export function assertValidDecimals(
	decimals: number | null | undefined,
	symbol: string,
): asserts decimals is number {
	if (!isValidDecimals(decimals)) {
		throw new Error(
			`Invalid decimals for ${symbol}: ${decimals === null ? "null" : String(decimals)}. Token configuration is invalid. Please refresh and try again.`,
		);
	}
}

export function isValidDecimals(
	decimals: number | null | undefined,
): decimals is number {
	return (
		decimals != null &&
		Number.isInteger(decimals) &&
		decimals >= 0 &&
		decimals <= 36
	);
}
