export const CHAINS = [
  {
    value: "arbitrum",
    label: "Arbitrum",
    icon: "https://assets.coingecko.com/coins/images/16547/standard/arb.jpg?1721358242",
  },
  {
    value: "base",
    label: "Base",
    icon: "https://avatars.githubusercontent.com/u/108554348?s=280&v=4",
  },
  {
    value: "eth",
    label: "Ethereum",
    icon: "https://assets.coingecko.com/coins/images/279/standard/ethereum.png?1696501628",
  },
  {
    value: "sol",
    label: "Solana",
    icon: "https://assets.coingecko.com/coins/images/4128/standard/solana.png?1718769756",
  },
] as const;

export type ChainValue = (typeof CHAINS)[number]["value"];

export type Chain = (typeof CHAINS)[number];

const DEFAULT_ICON = CHAINS[2].icon; // eth

export function getChainIcon(value: string): string {
  const chain = CHAINS.find((c) => c.value === value);
  return chain?.icon ?? DEFAULT_ICON;
}

export function getChainByValue(value: string): Chain | undefined {
  return CHAINS.find((c) => c.value === value);
}
