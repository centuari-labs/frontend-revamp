"use client";

import Image from "next/image";
import * as React from "react";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useDepositTokens } from "@/hooks/use-deposit-tokens";
import { getAllTokens, getTokenLogo } from "@/lib/tokens";
import { Label } from "./ui/label";

interface SelectTokenProps {
	value?: string;
	onValueChange?: (value: string) => void;
}

export function SelectToken({ value, onValueChange }: SelectTokenProps) {
	const id = React.useId();
	const [internalToken, setInternalToken] = React.useState("usdc");

	// Subscribe to the token list so this component re-renders when the
	// mirror is hydrated. The hook dedupes via TanStack Query.
	useDepositTokens();
	const tokens = getAllTokens();

	const selectedToken = value ?? internalToken;
	const handleValueChange = (newValue: string) => {
		if (onValueChange) {
			onValueChange(newValue);
		} else {
			setInternalToken(newValue);
		}
	};

	return (
		<div className="w-full space-y-2 mt-3.5">
			<Label htmlFor={id}>Select Token</Label>
			<Select value={selectedToken} onValueChange={handleValueChange}>
				<SelectTrigger className="!h-9 border-0 bg-transparent px-2 py-1 focus:ring-0 focus:ring-offset-0 gap-1 w-full">
					<SelectValue placeholder="Select Token" />
				</SelectTrigger>
				<SelectContent className="z-[120] bg-white/5 backdrop-blur-[140px]">
					<SelectGroup>
						{tokens.map((token) => {
							const value = token.symbol.toLowerCase();
							const label = token.symbol.toUpperCase();
							return (
								<SelectItem key={token.id} value={value}>
									<Image
										src={getTokenLogo(
											token.symbol,
											token.imageUrl ?? undefined,
										)}
										width={16}
										height={16}
										alt={label}
									/>
									{label}
								</SelectItem>
							);
						})}
					</SelectGroup>
				</SelectContent>
			</Select>
		</div>
	);
}
