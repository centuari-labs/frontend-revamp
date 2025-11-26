import { CentuariTypography } from "@/components/centuari-typography";
import { IcPieChartColorCentuari } from "@/components/icons/ic-pie-chart-color-centuari";
import { IcWalletColorCentuari } from "@/components/icons/ic-wallet-color-centuari";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { CentuariBadge } from "../centuari-badge";

export function PortfolioHeader() {
  return (
    <div className="flex justify-between items-center w-full md:flex-items-start md:items-center gap-6 md:gap-0">
      <h1 className="text-3xl font-semibold">Portfolio</h1>
      <div className="flex flex-col items-center md:flex-row gap-6 md:gap-12 md:mt-0 py-3.5">
        <div>
          <CentuariTypography className="text-sm text-muted-foreground">
            Total Balance
          </CentuariTypography>
          <CentuariTypography className="text-base font-semibold mt-1">
            {(() => {
              const totalBalance = 2340340.0; // nanti ganti dari API`
              const formatted = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 2,
              }).format(totalBalance);
              const idx = formatted.lastIndexOf(".");
              if (idx === -1) return formatted;
              return (
                <>
                  {formatted.slice(0, idx)}
                  <span className="text-[#2B2F37]">{formatted.slice(idx)}</span>
                </>
              );
            })()}
          </CentuariTypography>
        </div>
        <div>
          <CentuariTypography className="text-sm text-muted-foreground">
            My Total Supply
          </CentuariTypography>
          <CentuariTypography className="text-base font-semibold mt-1">
            {(() => {
              const activeLoans = 840340.0; // nanti ganti dari API
              const formatted = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 2,
              }).format(activeLoans);
              const idx = formatted.lastIndexOf(".");
              if (idx === -1) return formatted;
              return (
                <>
                  {formatted.slice(0, idx)}
                  <span className="text-[#2B2F37]">{formatted.slice(idx)}</span>
                </>
              );
            })()}
          </CentuariTypography>
        </div>
        <div>
          <CentuariTypography className="text-sm text-muted-foreground">
            My Total Borrow
          </CentuariTypography>
          <CentuariTypography className="text-base font-semibold mt-1">
            {(() => {
              const activeLoans = 840340.0; // nanti ganti dari API
              const formatted = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 2,
              }).format(activeLoans);
              const idx = formatted.lastIndexOf(".");
              if (idx === -1) return formatted;
              return (
                <>
                  {formatted.slice(0, idx)}
                  <span className="text-[#2B2F37]">{formatted.slice(idx)}</span>
                </>
              );
            })()}
          </CentuariTypography>
        </div>
        <div>
          <CentuariTypography className="text-sm text-muted-foreground">
            Health Factor
          </CentuariTypography>
          <CentuariBadge variant={"success"}>0.0 ~ Safe</CentuariBadge>
        </div>
      </div>
    </div>
  );
}
