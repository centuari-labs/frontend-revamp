import { useState, useCallback } from "react";

export interface UseSuccessDialogReturn {
	showSuccessDialog: boolean;
	setShowSuccessDialog: (show: boolean) => void;
	successAmount: string;
	successTokenSymbol: string;
	setSuccess: (amount: string, tokenSymbol: string) => void;
	resetSuccess: () => void;
}

export function useSuccessDialog(): UseSuccessDialogReturn {
	const [showSuccessDialog, setShowSuccessDialog] = useState(false);
	const [successAmount, setSuccessAmount] = useState("");
	const [successTokenSymbol, setSuccessTokenSymbol] = useState("");

	const setSuccess = useCallback((amount: string, tokenSymbol: string) => {
		setSuccessAmount(amount);
		setSuccessTokenSymbol(tokenSymbol);
		setShowSuccessDialog(true);
	}, []);

	const resetSuccess = useCallback(() => {
		setShowSuccessDialog(false);
		setSuccessAmount("");
		setSuccessTokenSymbol("");
	}, []);

	return {
		showSuccessDialog,
		setShowSuccessDialog,
		successAmount,
		successTokenSymbol,
		setSuccess,
		resetSuccess,
	};
}
