"use client";

import { CentuariTypography } from "@/components/centuari-typography";

export function FaucetHeader() {
  return (
    <div className="relative flex flex-col justify-between items-center md:items-start gap-4 bg-primary-blue-100/5 overflow-hidden px-6 md:px-12 py-8 rounded-xl border border-white/10">
      {/* Water droplet icon */}
      <div className="hidden md:flex absolute top-6 right-8 items-center justify-center w-20 h-20 rounded-full bg-primary-blue-base/10">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0L12 2.69z"
            fill="url(#droplet-gradient)"
            stroke="url(#droplet-gradient)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient
              id="droplet-gradient"
              x1="4"
              y1="2"
              x2="20"
              y2="22"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#3B82F6" />
              <stop offset="1" stopColor="#06B6D4" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="text-center md:text-left w-full">
      <CentuariTypography className="text-transparent font-semibold text-2xl md:text-4xl bg-clip-text bg-gradient-to-r from-primary-blue-base via-white to-primary-blue-base">
          Token Faucet
        </CentuariTypography>
        <CentuariTypography
          variant="b2"
          className="text-white/60 mt-2 max-w-xl"
        >
          Get testnet tokens to experiment with the Centuari protocol. Select
          the assets you need and request a drip instantly.
        </CentuariTypography>
      </div>
    </div>
  );
}
