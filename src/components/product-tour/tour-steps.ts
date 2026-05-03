import type { Step } from "react-joyride";

export const TOUR_STEPS: Step[] = [
  {
    target: "#tour-home-header",
    title: "Track the Pulse of Centuari",
    content:
      "Here you can see total liquidity and active loans — updated in real time.",
    placement: "bottom-start",
  },
  {
    target: "#tour-token-card-1",
    title: "Choose a Market to Get Started",
    content:
      "Each card shows a lending pool. You can supply assets to earn yield or borrow using your collateral.",
    placement: "right-start",
  },
  {
    target: "#tour-token-card-1-content",
    title: "Understand Your Returns and Risks",
    content:
      "Borrow APR is what you pay. Lend APR is what you earn. Collateral Factor defines your borrow power.",
    placement: "right-start",
  },
  {
    target: "#tour-token-card-1-btn",
    title: "Start Earning or Borrowing",
    content:
      "Supply your assets to earn stable yield, or borrow safely using your collateral.",
    placement: "right",
  },
  {
    target: "#tour-token-card-1-btn-view",
    title: "Explore More Opportunities",
    content:
      "Browse all Centuari markets and find assets that fit your strategy.",
    placement: "right",
  },
];
