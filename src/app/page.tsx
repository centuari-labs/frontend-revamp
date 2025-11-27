"use client";

import { HomeHeader } from "@/components/home/home-header";
import { TokenGrid } from "@/components/home/token-grid";

export default function Page() {
  return (
    <div className="relative w-full flex justify-center mt-24">
      <div className="max-w-7xl w-full px-6">
        <HomeHeader />
        <TokenGrid />
      </div>
    </div>
  );
}
