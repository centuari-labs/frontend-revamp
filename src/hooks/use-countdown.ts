"use client";

import { useEffect, useState } from "react";

function formatHMS(sec: number): string {
	if (sec <= 0) return "0h 0m 0s";
	const h = Math.floor(sec / 3600);
	const m = Math.floor((sec % 3600) / 60);
	const s = sec % 60;
	return `${h}h ${m}m ${s}s`;
}

/**
 * Tick once per second toward `targetSec` (unix seconds). Returns the
 * remaining seconds and a `"23h 45m 12s"`-style formatted string. Used by
 * the 24h flag-lock countdown badge.
 *
 * Sentinel: `targetSec === 0` (the indexer's "not locked" sentinel) — no
 * interval runs and the result is `{ remainingSec: 0, formatted: "0h 0m 0s" }`.
 * If the target is already in the past, the same zero-state result is returned
 * without starting an interval.
 */
export function useCountdown(targetSec: number): {
	remainingSec: number;
	formatted: string;
} {
	const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

	useEffect(() => {
		if (targetSec === 0) return;
		const id = setInterval(() => {
			const current = Math.floor(Date.now() / 1000);
			setNow(current);
			if (current >= targetSec) {
				clearInterval(id);
			}
		}, 1000);
		return () => clearInterval(id);
	}, [targetSec]);

	const remainingSec = targetSec === 0 ? 0 : Math.max(0, targetSec - now);
	return { remainingSec, formatted: formatHMS(remainingSec) };
}
