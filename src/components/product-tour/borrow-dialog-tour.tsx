"use client";

import { useCallback, useEffect, useState } from "react";
import { Joyride, type EventData, type TooltipRenderProps } from "react-joyride";

import { BORROW_DIALOG_TOUR_STEPS } from "./borrow-dialog-tour-steps";
import { CentuariTourTooltip } from "./centuari-tour-tooltip";

const BORROW_DIALOG_TOUR_STORAGE_KEY = "centuari_borrow_dialog_tour_seen";

interface BorrowDialogTourProps {
  open: boolean;
}

export function BorrowDialogTour({ open }: BorrowDialogTourProps) {
  const [run, setRun] = useState(false);

  const closeTour = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(BORROW_DIALOG_TOUR_STORAGE_KEY, "true");
    }
    setRun(false);
  }, []);

  useEffect(() => {
    if (!open) {
      setRun(false);
      return;
    }

    if (typeof window === "undefined") return;
    const seen = localStorage.getItem(BORROW_DIALOG_TOUR_STORAGE_KEY);
    if (seen) return;

    const timer = setTimeout(() => setRun(true), 600);
    return () => clearTimeout(timer);
  }, [open]);

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
    [closeTour]
  );

  if (!open) return null;

  return (
    <Joyride
      steps={BORROW_DIALOG_TOUR_STEPS}
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