"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { TOUR_STEPS } from "./tour-steps";
import { WelcomeDialog } from "./welcome-dialog";

interface TourContextType {
  startTour: () => void;
  hasSeenTour: boolean;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [hasSeenTour, setHasSeenTour] = useState(true); // Default to true to prevent flash
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("centuari_tour_seen");
    if (!seen) {
      setHasSeenTour(false);
      // Small delay to ensure UI is ready
      setTimeout(() => setShowWelcome(true), 1000);
    }
  }, []);

  const startTour = () => {
    setShowWelcome(false);

    const driverObj = driver({
      showProgress: true,
      steps: TOUR_STEPS,
      popoverClass: "centuari-tour-theme",
      nextBtnText: "Next",
      prevBtnText: "Previous",
      doneBtnText: "Done",
      onDestroyed: () => {
        completeTour();
      },
      onHighlightStarted: (element, step, options) => {
        setTimeout(() => updateProgressBars(driverObj), 100);
      },
      onPopoverRender: (popover, options) => {
        setTimeout(() => updateProgressBars(driverObj), 100);
      },
    });

    driverObj.drive();
  };

  const updateProgressBars = (driverObj: any) => {
    if (!driverObj) return;

    const progressText = document.querySelector(
      ".driver-popover-progress-text"
    );
    if (!progressText) return;

    const text = progressText.textContent || "";
    const match = text.match(/(\d+)\s*of\s*(\d+)/);

    if (match) {
      const current = parseInt(match[1]);
      const total = parseInt(match[2]);

      // Clear existing bars
      progressText.innerHTML = "";

      // Create progress bars
      for (let i = 1; i <= total; i++) {
        const bar = document.createElement("div");
        bar.style.cssText = `
          width: 32px;
          height: 4px;
          background: ${i <= current ? "white" : "rgba(255, 255, 255, 0.15)"};
          border-radius: 2px;
          transition: all 0.3s ease;
        `;
        progressText.appendChild(bar);
      }
    }
  };

  const completeTour = () => {
    localStorage.setItem("centuari_tour_seen", "true");
    setHasSeenTour(true);
    setShowWelcome(false);
  };

  return (
    <TourContext.Provider value={{ startTour, hasSeenTour }}>
      <style jsx global>{`
        /* Modern Tour Theme - Matching Screenshot */
        .centuari-tour-theme {
          background: linear-gradient(
            135deg,
            #1a1d29 0%,
            #0f1117 100%
          ) !important;
          color: white !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-radius: 16px !important;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5) !important;
          padding: 0 !important;
          max-width: 420px !important;
        }

        /* Popover Content Padding */
        .centuari-tour-theme .driver-popover-title,
        .centuari-tour-theme .driver-popover-description {
          padding-left: 24px !important;
          padding-right: 24px !important;
        }

        .centuari-tour-theme .driver-popover-title {
          padding-top: 24px !important;
          font-size: 1.375rem !important;
          font-weight: 600 !important;
          margin-bottom: 0.5rem !important;
          color: white !important;
          line-height: 1.3 !important;
        }

        .centuari-tour-theme .driver-popover-description {
          color: #94a3b8 !important;
          font-size: 0.9375rem !important;
          line-height: 1.6 !important;
          margin-bottom: 0 !important;
          padding-bottom: 20px !important;
        }

        /* Progress Stepper */
        .centuari-tour-theme .driver-popover-footer {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          padding: 16px 24px 20px !important;
          margin: 0 !important;
          border-top: 1px solid rgba(255, 255, 255, 0.06) !important;
        }

        /* Progress Stepper Bar */
        .centuari-tour-theme .driver-popover-progress-text {
          display: flex !important;
          align-items: center !important;
          gap: 6px !important;
          color: transparent !important;
          font-size: 0 !important;
          min-width: fit-content !important;
          margin-right: 12px !important;
        }

        .centuari-tour-theme .driver-popover-progress-text > div {
          width: 32px !important;
          height: 4px !important;
          border-radius: 2px !important;
          transition: all 0.3s ease !important;
        }

        /* Navigation Buttons */
        .centuari-tour-theme .driver-popover-navigation-btns {
          display: flex !important;
          gap: 10px !important;
          margin-left: auto !important;
        }

        .centuari-tour-theme button {
          border-radius: 10px !important;
          padding: 9px 20px !important;
          font-size: 0.9375rem !important;
          font-weight: 500 !important;
          transition: all 0.2s ease !important;
          text-shadow: none !important;
          border: none !important;
          cursor: pointer !important;
        }

        .centuari-tour-theme .driver-popover-navigation-btns .driver-popover-next-btn {
          background: #3361EF !important;
          background-image: radial-gradient(120% 180% at 50% 0%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 65%), linear-gradient(180deg, #3361EF 0%, #2546B8 100%) !important;
          color: white !important;
          box-shadow: 0 4px 12px rgba(51, 97, 239, 0.3) !important;
          position: relative !important;
          overflow: hidden !important;
        }

        .centuari-tour-theme .driver-popover-navigation-btns .driver-popover-next-btn:hover {
          filter: brightness(1.1) !important;
          transform: none !important;
          box-shadow: 0 6px 16px rgba(51, 97, 239, 0.4) !important;
        }

        .centuari-tour-theme .driver-popover-navigation-btns .driver-popover-prev-btn {
          display: none !important;
        }

        /* Close Button (X) */
        .centuari-tour-theme .driver-popover-close-btn {
          position: absolute !important;
          top: -10px !important;
          right: -10px !important;
          width: 32px !important;
          height: 32px !important;
          padding: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          background: rgba(255, 255, 255, 0.05) !important;
          color: #94a3b8 !important;
          border-radius: 8px !important;
          font-size: 18px !important;
          transition: all 0.2s !important;
          box-shadow: none !important;
        }

        .centuari-tour-theme .driver-popover-close-btn:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          color: white !important;
          transform: none !important;
        }

        /* Arrow styling */
        .centuari-tour-theme .driver-popover-arrow {
          border: none !important;
        }

        /* Progress dots with actual step tracking */
        .centuari-tour-theme .driver-popover-footer {
          position: relative !important;
        }
      `}</style>
      {children}
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
