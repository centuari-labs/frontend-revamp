"use client";

import { CentuariGlassLayers } from "@/components/centuari-glass-surface";
import { CentuariTypography } from "@/components/centuari-typography";
import Image from "next/image";

export function FaucetHeader() {
  return (
    <div className="group/glass relative isolate flex flex-col justify-between items-center md:items-start gap-6 overflow-hidden px-6 md:px-12 py-8 rounded-xl border border-white/10 bg-[#05070D]">
      <div
        className="pointer-events-none absolute inset-0 -z-20 hidden md:block"
        style={{
          backgroundImage:
            "linear-gradient(90deg, #05070D 0%, #070B18 45%, #0A1430 70%, #0E1D52 100%)",
        }}
      />
      <Image
        src={"/assets/centuari-faucet-header.png"}
        fill
        className="object-contain object-right z-50 hidden md:block"
        alt="centuari-faucet-header"
      />

      <CentuariGlassLayers intensity="soft" sheen={false} />

      <div className="relative z-20 text-center md:text-left w-full">
        <CentuariTypography className="text-2xl md:text-4xl font-semibold mt-1 md:mt-2">
          Request Your Testnet
        </CentuariTypography>
        <CentuariTypography
          className="text-2xl md:text-4xl font-semibold bg-clip-text text-transparent bg-[linear-gradient(to_right,#508FFF,#B9CEFF,#3361EF,#B9CEFF,#508FFF)] bg-size-[200%_auto] animate-gradient"
        >
          Tokens Instantly
        </CentuariTypography>
        <CentuariTypography
          variant="b2"
          className="text-white/60 mt-12 max-w-xl"
        >
          Get testnet tokens to experiment with the Centuari protocol. <br /> Select the assets you need and request a drip instantly.
        </CentuariTypography>
      </div>
    </div>
  );
}
