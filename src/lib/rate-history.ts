import { format, subDays, subMonths, subYears } from "date-fns";
import type { RateHistoryItem } from "@/lib/api";

export type RangeValue = "7d" | "1m" | "2m" | "3m" | "6m" | "1y";

export interface RangeTab {
	value: RangeValue;
	label: string;
	mobileLabel?: string;
}

export const RANGE_TABS: readonly RangeTab[] = [
	{ value: "7d", label: "7 D" },
	{ value: "1m", label: "1 M" },
	{ value: "2m", label: "2 M" },
	{ value: "3m", label: "3 M" },
	{ value: "6m", label: "6 M" },
	{ value: "1y", label: "1 Y", mobileLabel: "1 Yr" },
] as const;

export const DEFAULT_RANGE: RangeValue = "7d";

export function getRangeStart(range: RangeValue, from: Date): Date {
	switch (range) {
		case "7d":
			return subDays(from, 7);
		case "1m":
			return subMonths(from, 1);
		case "2m":
			return subMonths(from, 2);
		case "3m":
			return subMonths(from, 3);
		case "6m":
			return subMonths(from, 6);
		case "1y":
			return subYears(from, 1);
	}
}

export interface RateChartPoint {
	date: string;
	value: number;
}

export function buildRateChartData(
	rateHistory: RateHistoryItem[],
	range: RangeValue,
): RateChartPoint[] {
	if (rateHistory.length === 0) return [];

	const latest = rateHistory.reduce(
		(max, item) => (new Date(item.date) > new Date(max.date) ? item : max),
		rateHistory[0],
	);
	const cutoff = getRangeStart(range, new Date(latest.date));

	return rateHistory
		.filter((item) => new Date(item.date) >= cutoff)
		.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
		.map((item) => ({
			date: format(new Date(item.date), "d MMM"),
			value: item.rate,
		}));
}
