"use client";

import { useCallback, useEffect, useState } from "react";
import {
	Joyride,
	type EventData,
	type TooltipRenderProps,
} from "react-joyride";

import { LEND_DIALOG_TOUR_STEPS } from "./lend-dialog-tour-steps";
import { CentuariTourTooltip } from "./centuari-tour-tooltip";

const LEND_DIALOG_TOUR_STORAGE_KEY = "centuari_lend_dialog_tour_seen";

interface LendDialogTourProps {
	open: boolean;
}

export function LendDialogTour({ open }: LendDialogTourProps) {
	const [run, setRun] = useState(false);

	const closeTour = useCallback(() => {
		if (typeof window !== "undefined") {
			localStorage.setItem(LEND_DIALOG_TOUR_STORAGE_KEY, "true");
		}
		setRun(false);
	}, []);

	useEffect(() => {
		if (!open) {
			setRun(false);
			return;
		}

		if (typeof window === "undefined") return;
		const seen = localStorage.getItem(LEND_DIALOG_TOUR_STORAGE_KEY);
		if (seen) return;

		// Wait for dialog content to fully mount and animate before starting tour
		const timer = setTimeout(() => setRun(true), 600);
		return () => clearTimeout(timer);
	}, [open]);

	// Custom ESC handler — Joyride's internal ESC also fires non-final close events
	// that can prematurely end the tour during step transitions. We handle ESC ourselves.
	useEffect(() => {
		if (!run) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				e.stopPropagation();
				closeTour();
			}
		};
		document.addEventListener("keydown", onKey, true);
		return () => document.removeEventListener("keydown", onKey, true);
	}, [run, closeTour]);

	const handleEvent = (data: EventData) => {
		if (data.status === "finished") {
			closeTour();
		}
	};

	const TooltipComponent = useCallback(
		(props: TooltipRenderProps) => (
			<CentuariTourTooltip {...props} onClose={closeTour} />
		),
		[closeTour],
	);

	if (!open) return null;

	return (
		<Joyride
			steps={LEND_DIALOG_TOUR_STEPS}
			run={run}
			continuous
			tooltipComponent={TooltipComponent}
			options={{
				skipBeacon: true,
				zIndex: 10001,
				overlayColor: "rgba(10, 12, 20, 0.7)",
				primaryColor: "#3361EF",
				spotlightRadius: 18,
				spotlightPadding: 8,
				showProgress: true,
			}}
			onEvent={handleEvent}
		/>
	);
}
