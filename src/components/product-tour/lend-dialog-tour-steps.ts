import type { Step } from "react-joyride";

export const LEND_DIALOG_TOUR_STEPS: Step[] = [
  {
    target: "#tour-dialog-asset-overview",
    title: "Asset & Term Overview",
    content:
      "Review the selected asset, its maturity date, and the estimated yield before you proceed.",
    placement: "right-start",
  },
  {
    target: "#tour-dialog-market-banner",
    title: "Maturity Selection",
    content:
      "Switch to Market view and select the available maturity there.",
    placement: "right",
  },
  {
    target: "#tour-lend-amount",
    title: "Amount to Lend",
    content:
      "Enter how much you want to lend. You can use the maximum available balance.",
    placement: "right",
  },
  {
    target: "#tour-lend-summary",
    title: "Transaction Details",
    content:
      "View estimated fees, total return, and other important transaction details.",
    placement: "right",
  },
  {
    target: "#tour-lend-confirm",
    title: "Confirm Lending",
    content:
      "Review all details carefully before confirming your lending position.",
    placement: "top",
  },
];
