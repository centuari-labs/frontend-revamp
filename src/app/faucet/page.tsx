"use client";

import { FaucetHeader } from "@/components/faucet/faucet-header";
import { FaucetTokenGrid } from "@/components/faucet/faucet-token-grid";

export default function FaucetPage() {
  return (
    <div className="relative w-full flex justify-center mt-24">
      <div className="max-w-7xl w-full px-6">
        <FaucetHeader />
        <FaucetTokenGrid />
      </div>
    </div>
  );
}
