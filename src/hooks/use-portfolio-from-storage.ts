"use client";

import { useState, useEffect } from "react";
import { defaultPortfolio } from "@/lib/portfolio-data";
import { USE_MOCK } from "@/lib/use-mock";
import { useMyPortfolio, useLendBorrowAssets, useMyAssets } from "./use-portfolio";

export function usePortfolioFromStorage() {
	// ── Mock mode state ────────────────────────────────
	const [portfolio, setPortfolio] = useState<Record<string, number>>(() => {
		if (typeof window === "undefined") return defaultPortfolio;
		const stored = localStorage.getItem("centuari_portfolio");
		if (stored) {
			try {
				return JSON.parse(stored);
			} catch {
				return defaultPortfolio;
			}
		}
		return defaultPortfolio;
	});

	const [totalDebt, setTotalDebt] = useState<number>(() => {
		if (typeof window === "undefined") return 80000;
		const stored = localStorage.getItem("centuari_total_debt");
		if (stored) {
			try {
				const parsed = Number.parseFloat(stored);
				return !Number.isNaN(parsed) && parsed > 0 ? parsed : 80000;
			} catch {
				return 80000;
			}
		}
		return 80000;
	});

	const [collateralStatus, setCollateralStatus] = useState<
		Record<string, boolean>
	>(() => {
		if (typeof window === "undefined") return {};
		const stored = localStorage.getItem("centuari_collateral");
		if (stored) {
			try {
				return JSON.parse(stored);
			} catch {
				return {};
			}
		}
		return {};
	});

	useEffect(() => {
		if (!USE_MOCK) return;

		const handleStorageChange = () => {
			if (typeof window === "undefined") return;

			const storedPortfolio = localStorage.getItem("centuari_portfolio");
			if (storedPortfolio) {
				try {
					const newPortfolio = JSON.parse(storedPortfolio);
					setPortfolio((prev) => {
						if (JSON.stringify(newPortfolio) !== JSON.stringify(prev)) {
							return newPortfolio;
						}
						return prev;
					});
				} catch {
					// ignore
				}
			}

			const storedDebt = localStorage.getItem("centuari_total_debt");
			if (storedDebt) {
				try {
					const parsed = Number.parseFloat(storedDebt);
					if (!Number.isNaN(parsed)) {
						setTotalDebt((prev) => (parsed !== prev ? parsed : prev));
					}
				} catch {
					// ignore
				}
			}

			const storedCollateral = localStorage.getItem("centuari_collateral");
			if (storedCollateral) {
				try {
					const newCollateral = JSON.parse(storedCollateral);
					setCollateralStatus((prev) => {
						if (JSON.stringify(newCollateral) !== JSON.stringify(prev)) {
							return newCollateral;
						}
						return prev;
					});
				} catch {
					// ignore
				}
			}
		};

		window.addEventListener("storage", handleStorageChange);
		window.addEventListener("centuari-positions-updated", handleStorageChange);

		return () => {
			window.removeEventListener("storage", handleStorageChange);
			window.removeEventListener(
				"centuari-positions-updated",
				handleStorageChange,
			);
		};
	}, []);

	// ── API mode ───────────────────────────────────────
	const apiPortfolio = useMyPortfolio();
	const apiLendBorrow = useLendBorrowAssets();
	const apiAssets = useMyAssets(1, 100);

	if (!USE_MOCK) {
		// Build portfolio record from API assets
		const apiPortfolioRecord: Record<string, number> = {};
		if (apiAssets.data?.data) {
			for (const asset of apiAssets.data.data) {
				apiPortfolioRecord[asset.symbol.toLowerCase()] = asset.amountInUsd;
			}
		}

		// Build collateral status from API assets
		const apiCollateral: Record<string, boolean> = {};
		if (apiAssets.data?.data) {
			for (const asset of apiAssets.data.data) {
				apiCollateral[asset.symbol.toLowerCase()] = asset.isCollateral;
			}
		}

		return {
			portfolio:
				Object.keys(apiPortfolioRecord).length > 0
					? apiPortfolioRecord
					: defaultPortfolio,
			totalDebt: apiLendBorrow.data?.borrowedAssets ?? 80000,
			collateralStatus: apiCollateral,
			setPortfolio: () => {},
			setTotalDebt: () => {},
			setCollateralStatus: () => {},
		};
	}

	return {
		portfolio,
		totalDebt,
		collateralStatus,
		setPortfolio,
		setTotalDebt,
		setCollateralStatus,
	};
}
