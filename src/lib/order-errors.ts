export const MIN_APR_PCT = 0.01;
export const MAX_APR_PCT = 100;

export function mapOrderErrorToFriendlyMessage(raw: string): string {
	const message = raw.toLowerCase();

	if (
		message.includes("rate must not exceed") ||
		(message.includes("too_big") && message.includes("rate"))
	) {
		return `Target APR cannot exceed ${MAX_APR_PCT}%.`;
	}

	if (
		message.includes("rate must be at least") ||
		(message.includes("too_small") && message.includes("rate"))
	) {
		return `Target APR must be at least ${MIN_APR_PCT}%.`;
	}

	if (message.includes("amount must be at least")) {
		return "Order amount must be at least 10 USD.";
	}

	if (message.includes("internal server error")) {
		return "Something went wrong. Please try again.";
	}

	return raw;
}
