"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import { CentuariTooltip } from "./centuari-tooltip";
import { ArrowRight, InfoIcon } from "lucide-react";
import { CentuariTypography } from "./centuari-typography";
import { CentuariBorrowDialog } from "./centuari-borrow-dialog";
import { CentuariLendDialog } from "./centuari-lend-dialog";
import { useRouter } from "next/navigation";
import {
  getBestLendAPRDisplay,
  getBestBorrowAPRDisplay,
  getCollateralFactorDisplay,
} from "@/lib/positions-adapter.mock";

export const CentuariTokenCard = ({
  token_image,
  token_name,
  token_symbol,
  id,
}: {
  token_image: string;
  token_name: string;
  token_symbol: string;
  id: number;
}) => {
  const router = useRouter();

  const rates = {
    borrowAPR: getBestBorrowAPRDisplay(token_symbol),
    lendAPR: getBestLendAPRDisplay(token_symbol),
    collateralFactor: getCollateralFactorDisplay(token_symbol),
  };

  // Generate random vault total for each token card (between 50,000 and 500,000)
  const [vaultTotal] = useState(() => {
    const min = 50000;
    const max = 500000;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  });

  return (
    <Card
      id={`tour-token-card-${id}`}
      className="w-full p-3 md:p-4 gap-2 bg-white/5 relative group overflow-hidden transition-all duration-300"
    >
      <CardHeader className="gap-0 pb-0">
        <div className="flex flex-col items-center gap-3 md:gap-4">
          <CardTitle>
            <Image
              src={token_image}
              alt={token_name}
              width={68}
              height={68}
              className="w-12 h-12 md:w-[68px] md:h-[68px]"
            />
          </CardTitle>
          <CentuariTypography variant="b1" className="text-sm md:text-base">
            {token_symbol}
          </CentuariTypography>
        </div>
      </CardHeader>
      <CardContent id={`tour-token-card-${id}-content`} className="px-0">
        <div className="bg-white/5 p-3 md:p-4 rounded-xl border border-white/5 flex flex-col gap-3 md:gap-4">
          {[
            { label: "Borrow APR", value: rates.borrowAPR },
            { label: "Lend APR", value: rates.lendAPR },
            { label: "Collateral Factor", value: rates.collateralFactor },
          ].map(({ label, value }, i) => (
            <div
              key={label}
              className={`flex items-center justify-between ${i < 2 ? "border-b border-dashed pb-2" : ""
                }`}
            >
              <p className="text-xs md:text-sm">{label}</p>
              <div className="flex items-center gap-1">
                <p className="text-xs md:text-sm">{value}</p>
                <CentuariTooltip message="Coming Soon">
                  <InfoIcon size={12} />
                </CentuariTooltip>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col px-0 z-50">
        <div id={`tour-token-card-${id}-btn`} className="flex gap-2 w-full">
          <CentuariBorrowDialog
            token_image={token_image}
            token_name={token_name}
            token_symbol={token_symbol}
            lendAPR={rates.lendAPR}
            borrowAPR={rates.borrowAPR}
            collateralFactor={rates.collateralFactor}
            vaultTotal={vaultTotal}
          />
          <CentuariLendDialog
            token_image={token_image}
            token_name={token_name}
            token_symbol={token_symbol}
            lendAPR={rates.lendAPR}
            borrowAPR={rates.borrowAPR}
            collateralFactor={rates.collateralFactor}
            vaultTotal={vaultTotal}
          />
        </div>
        <Button
          className="w-full flex items-center justify-center mt-3 md:mt-4 gap-2 text-xs md:text-sm bg-transparent hover:bg-transparent text-white"
          onClick={() => {
            // Map token symbol to token value for market page
            const tokenValueMap: Record<string, string> = {
              "USDC": "usdc",
              "XSGD": "xsgd",
              "IDRX": "idrx",
              "USDT": "usdt",
              "SOL": "sol",
              "BTC": "btc",
              "ETH": "eth",
              "LINK": "link",
            };
            const tokenValue = tokenValueMap[token_symbol.toUpperCase()] || "usdc";
            router.push(`/market?token=${tokenValue}`);
          }}
        >
          <span
            className="relative flex items-center gap-2 group hover:after:w-full after:absolute after:bottom-0 after:left-0 after:h-[1px] after:bg-white after:w-0 after:transition-all after:duration-300"
            id={`tour-token-card-${id}-btn-view`}
          >
            View Market for Details
            <ArrowRight size={12} />
          </span>
        </Button>
      </CardFooter>
      <div className="pointer-events-none absolute w-[568px] h-[450px] top-[96px] left-[-90px] bg-[#1D7656]/10 blur-[264px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="pointer-events-none absolute w-[448px] h-[216px] top-[350px] left-[-35px] bg-primary-blue-base/50 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </Card>
  );
};
