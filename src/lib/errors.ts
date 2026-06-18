export class UserCancelledError extends Error {
	constructor(message = "User cancelled") {
		super(message);
		this.name = "UserCancelledError";
	}
}

export class WalletNotConnectedError extends Error {
	constructor(message = "Please reconnect your external wallet") {
		super(message);
		this.name = "WalletNotConnectedError";
	}
}

export class DecimalsMismatchError extends Error {
	readonly tokenAddress: `0x${string}`;
	readonly symbol: string;
	readonly apiDecimals: number;
	readonly onChainDecimals: number;

	constructor(details: {
		tokenAddress: `0x${string}`;
		symbol: string;
		apiDecimals: number;
		onChainDecimals: number;
	}) {
		super(
			`Decimals mismatch for ${details.symbol}: API says ${details.apiDecimals}, on-chain says ${details.onChainDecimals}. Refusing to sign — please refresh and try again.`,
		);
		this.name = "DecimalsMismatchError";
		this.tokenAddress = details.tokenAddress;
		this.symbol = details.symbol;
		this.apiDecimals = details.apiDecimals;
		this.onChainDecimals = details.onChainDecimals;
	}
}
