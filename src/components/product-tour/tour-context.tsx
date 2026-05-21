"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import {
	Joyride,
	type EventData,
	type TooltipRenderProps,
} from "react-joyride";
import { usePrivy } from "@privy-io/react-auth";

import { TOUR_STEPS } from "./tour-steps";
import { CentuariTourTooltip } from "./centuari-tour-tooltip";
import { WelcomeDialog } from "./welcome-dialog";

interface TourContextType {
	startTour: () => void;
	hasSeenTour: boolean;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

const TOUR_STORAGE_KEY = "centuari_tour_seen";

export function TourProvider({ children }: { children: React.ReactNode }) {
	const { ready, authenticated } = usePrivy();
	const [mounted, setMounted] = useState(false);
	const [hasSeenTour, setHasSeenTour] = useState(true);
	const [showWelcome, setShowWelcome] = useState(false);
	const [run, setRun] = useState(false);

	// Mount Joyride only after hydration completes — joyride uses DOM APIs
	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		const seen = localStorage.getItem(TOUR_STORAGE_KEY);
		if (!seen) {
			setHasSeenTour(false);
		}
	}, []);

	// Defer the welcome dialog until the wallet is actually connected, so the
	// tour highlights wallet-gated UI in its connected state.
	useEffect(() => {
		if (!ready || !authenticated || hasSeenTour) return;
		const timer = setTimeout(() => setShowWelcome(true), 1000);
		return () => clearTimeout(timer);
	}, [ready, authenticated, hasSeenTour]);

	const startTour = () => {
		setShowWelcome(false);
		setRun(true);
	};

	const completeTour = useCallback(() => {
		localStorage.setItem(TOUR_STORAGE_KEY, "true");
		setHasSeenTour(true);
		setShowWelcome(false);
		setRun(false);
	}, []);

	// Custom ESC handler — bypasses Joyride's built-in handler which can fire
	// mid-transition close events that prematurely terminate the tour.
	useEffect(() => {
		if (!run) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				e.stopPropagation();
				completeTour();
			}
		};
		document.addEventListener("keydown", onKey, true);
		return () => document.removeEventListener("keydown", onKey, true);
	}, [run, completeTour]);

	const handleEvent = (data: EventData) => {
		// Only treat the final "Done" click as terminal — the explicit X close
		// button uses its own onClose callback, so we don't need status === "skipped".
		if (data.status === "finished") {
			completeTour();
		}
	};

	const TooltipComponent = useCallback(
		(props: TooltipRenderProps) => (
			<CentuariTourTooltip {...props} onClose={completeTour} />
		),
		[completeTour],
	);

	return (
		<TourContext.Provider value={{ startTour, hasSeenTour }}>
			{children}
			{mounted && (
				<Joyride
					steps={TOUR_STEPS}
					run={run}
					continuous
					scrollToFirstStep
					tooltipComponent={TooltipComponent}
					options={{
						// Skip beacon stage so the tour jumps straight to the tooltip on each step.
						skipBeacon: true,
						zIndex: 10000,
						arrowColor: "rgba(0, 0, 0, 0.55)",
						overlayColor: "rgba(10, 12, 20, 0.7)",
						primaryColor: "#3361EF",
						spotlightRadius: 18,
						spotlightPadding: 8,
						showProgress: true,
					}}
					onEvent={handleEvent}
				/>
			)}
			<WelcomeDialog
				isOpen={showWelcome}
				onStartTour={startTour}
				onSkip={completeTour}
			/>
		</TourContext.Provider>
	);
}

export const useTour = () => {
	const context = useContext(TourContext);
	if (context === undefined) {
		throw new Error("useTour must be used within a TourProvider");
	}
	return context;
};
