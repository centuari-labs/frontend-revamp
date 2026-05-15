"use client";

import { useState, useCallback } from "react";
import {
	formatNumberWithSeparator,
	parseNumberFromSeparator,
} from "@/lib/utils";

export function useAmountInput(initialAmount = "", initialDisplayAmount = "") {
	const [amount, setAmount] = useState(initialAmount);
	const [displayAmount, setDisplayAmount] = useState(initialDisplayAmount);

	const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		const numericValue = parseNumberFromSeparator(value);
		const formattedValue = formatNumberWithSeparator(numericValue);
		setAmount(numericValue);
		setDisplayAmount(formattedValue);
	}, []);

	const setMax = useCallback((maxValue: number) => {
		const maxStr = maxValue.toString();
		const formatted = formatNumberWithSeparator(maxStr);
		setAmount(maxStr);
		setDisplayAmount(formatted);
	}, []);

	const reset = useCallback(() => {
		setAmount("");
		setDisplayAmount("");
	}, []);

	return {
		amount,
		displayAmount,
		setAmount,
		setDisplayAmount,
		handleChange,
		setMax,
		reset,
	};
}
