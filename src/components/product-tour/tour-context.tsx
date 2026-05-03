"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Joyride, type EventData } from "react-joyride";

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
      const timer = setTimeout(() => setShowWelcome(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const startTour = () => {
    setShowWelcome(false);
    setRun(true);
  };

  const completeTour = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
    setHasSeenTour(true);
    setShowWelcome(false);
    setRun(false);
  };

  const handleEvent = (data: EventData) => {
    // Only react to terminal statuses — ignore initial "ready"/"idle" events.
    if (data.status === "finished" || data.status === "skipped") {
      completeTour();
    }
  };

  return (
    <TourContext.Provider value={{ startTour, hasSeenTour }}>
      {children}
      {mounted && (
        <Joyride
          steps={TOUR_STEPS}
          run={run}
          continuous
          scrollToFirstStep
          tooltipComponent={CentuariTourTooltip}
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
