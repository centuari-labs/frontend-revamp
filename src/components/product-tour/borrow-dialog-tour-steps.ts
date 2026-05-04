import type { Step } from "react-joyride";

export const BORROW_DIALOG_TOUR_STEPS: Step[] = [
  {
    target: "#tour-dialog-asset-overview",
    title: "Market Overview",
    content:
      "See the asset you're borrowing, its maturity date, and the applicable rates.",
    placement: "right-start",
  },
  {
    target: "#tour-dialog-market-banner",
    title: "Select other maturity",
    content:
      "This view uses the default maturity. Switch to Market View to choose another one.",
    placement: "right",
  },
  {
    target: "#tour-borrow-amount",
    title: "Amount to Borrow",
    content: "Enter how much you want to borrow for this position.",
    placement: "right",
  },
  {
    target: "#tour-borrow-collateral",
    title: "Collateral Selection",
    content: "Choose which assets you want to use as collateral.",
    placement: "right",
  },
  {
    target: "#tour-borrow-health-factor",
    title: "Health Factor",
    content:
      "Indicates how safe your position is. Lower values increase liquidation risk.",
    placement: "right",
  },
  {
    target: "#tour-borrow-summary",
    title: "Repayment Summary",
    content: "See the total amount you'll repay, including interest.",
    placement: "right",
  },
  {
    target: "#tour-borrow-confirm",
    title: "Confirm Borrow",
    content: "Finalize and open your borrowing position.",
    placement: "top",
  },
];
