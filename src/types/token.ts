export interface Token {
	id: string;
	symbol: string;
	name: string;
	tokenAddress: string;
	decimals: number | null;
	imageUrl: string | null;
	chainId: number | null;
}
