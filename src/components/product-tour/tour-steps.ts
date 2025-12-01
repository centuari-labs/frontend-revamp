import { DriveStep } from "driver.js";

export const TOUR_STEPS: DriveStep[] = [
  {
    element: "#tour-home-header",
    popover: {
      title: "Track the Pulse of Centuari",
      description:
        "Here you can see total liquidity and active loans — updated in real time.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#tour-token-card-1",
    popover: {
      title: "Choose a Market to Get Started",
      description:
        "Each card shows a lending pool. You can supply assets to earn yield or borrow using your collateral.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#tour-token-card-1-content",
    popover: {
      title: "Understand Your Returns and Risks",
      description:
        "Borrow Rate is what you pay. Net APR is what you earn. Collateral Factor defines your borrow power.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#tour-token-card-1-btn",
    popover: {
      title: "Start Earning or Borrowing",
      description:
        "Supply your assets to earn stable yield, or borrow safely using your collateral.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "#tour-token-card-1-btn-view",
    popover: {
      title: "Explore More Opportunities",
      description:
        "Browse all Centuari markets and find assets that fit your strategy.",
      side: "right",
      align: "center",
    },
  },
];
