"use client";

import { PortfolioChart } from "@/components/portfolio/portfolio-chart";
import { CentuariTypography } from "@/components/centuari-typography";
import LendBorrowChart from "@/components/portfolio/lend-borrow-chart";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { CurrencyValue } from "@/components/currency-value";
import { PageContainer } from "@/components/page-container";
import { DataTableAssets, type AssetProps } from "@/components/portfolio/tables/data-table-assets";
import { DataTableAllPosition, type PositionProps } from "@/components/portfolio/tables/data-table-all-position";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { defaultPortfolio } from "@/lib/portfolio-data";
import {
  getHealthFactorStatus,
  getLocalStorageJson,
  getLocalStorageNumber,
  migratePortfolioFromStorage,
  toPercent,
} from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { USE_MOCK } from "@/lib/use-mock";
import { useMyPortfolio } from "@/hooks/use-my-portfolio";
import { useLendBorrowAssets } from "@/hooks/use-lend-borrow-assets";
import { useMyPositions } from "@/hooks/use-my-positions";
import { useMyAssets } from "@/hooks/use-my-assets";
import { useSetCollateral } from "@/hooks/use-set-collateral";
import { usePrivy } from "@privy-io/react-auth";
import { CentuariLoginDialog } from "@/components/centuari-login-dialog";
import { Lock } from "lucide-react";

export default function PortfolioPage() {
  const { authenticated, ready } = usePrivy();
  const [loginOpen, setLoginOpen] = useState(false);

  // ─── Mock mode state (localStorage) ────────────────────────────────
  const [portfolio, setPortfolio] = useState<Record<string, number>>(() =>
    USE_MOCK
      ? getLocalStorageJson("centuari_portfolio", defaultPortfolio, (p) => {
          const m = migratePortfolioFromStorage(p, defaultPortfolio);
          if (typeof window !== "undefined") {
            localStorage.setItem("centuari_portfolio", JSON.stringify(m));
          }
          return m;
        })
      : {},
  );

  const [totalDebt, setTotalDebt] = useState<number>(() =>
    USE_MOCK ? getLocalStorageNumber("centuari_total_debt", 0) : 0,
  );

  const [totalSupply, setTotalSupply] = useState<number>(() =>
    USE_MOCK ? getLocalStorageNumber("centuari_total_supply", 0) : 0,
  );

  useEffect(() => {
    if (!USE_MOCK) return;

    const handleStorageChange = () => {
      setPortfolio(
        getLocalStorageJson("centuari_portfolio", defaultPortfolio),
      );
      setTotalDebt(getLocalStorageNumber("centuari_total_debt", 0));
      setTotalSupply(getLocalStorageNumber("centuari_total_supply", 0));
    };

    window.addEventListener("storage", handleStorageChange);
    const interval = setInterval(handleStorageChange, 500);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // ─── API mode hooks ────────────────────────────────────────────────
  const { portfolio: apiPortfolio } = useMyPortfolio();
  const { lendBorrow } = useLendBorrowAssets();
  const { positions: apiPositions } = useMyPositions();
  const { assets: apiAssets } = useMyAssets();
  const setCollateralMutation = useSetCollateral();

  // ─── Derived values ────────────────────────────────────────────────
  const totalBalance = USE_MOCK
    ? Object.values(portfolio).reduce((sum, v) => sum + v, 0) + totalSupply - totalDebt
    : (apiPortfolio?.totalDeposit ?? 0);

  const allTimeReturn = USE_MOCK
    ? totalSupply
    : (apiPortfolio?.allTimeReturn ?? 0);

  const netAPR = USE_MOCK
    ? 6.9
    : (apiPortfolio?.netAPY ?? 0);

  const availableBalancePercent = USE_MOCK
    ? toPercent(Object.values(portfolio).reduce((sum, v) => sum + v, 0), Object.values(portfolio).reduce((sum, v) => sum + v, 0) + totalSupply - totalDebt)
    : (apiPortfolio?.allocation.availableBalancePct ?? 0);

  const suppliedPercent = USE_MOCK
    ? toPercent(totalSupply, Object.values(portfolio).reduce((sum, v) => sum + v, 0) + totalSupply - totalDebt)
    : (apiPortfolio?.allocation.suppliedAssetsPct ?? 0);

  const borrowedPercent = USE_MOCK
    ? toPercent(totalDebt, Object.values(portfolio).reduce((sum, v) => sum + v, 0) + totalSupply - totalDebt)
    : (apiPortfolio?.allocation.borrowedAssetsPct ?? 0);

  const suppliedAssetsUsd = USE_MOCK ? totalSupply : (lendBorrow?.suppliedAssets ?? 0);
  const borrowedAssetsUsd = USE_MOCK ? totalDebt : (lendBorrow?.borrowedAssets ?? 0);

  const healthFactorValue = USE_MOCK
    ? (totalDebt > 0 ? Object.values(portfolio).reduce((sum, v) => sum + v, 0) / totalDebt : 0)
    : (lendBorrow?.healthFactor ?? 0);
  const healthFactor = healthFactorValue.toFixed(2);
  const healthFactorStatus = getHealthFactorStatus(healthFactorValue);

  // ─── Map API assets → DataTableAssets props ────────────────────────
  const assetTableData: AssetProps[] | undefined = useMemo(() => {
    if (USE_MOCK) return undefined;
    return apiAssets.map((a) => ({
      id: a.symbol,
      assetImg: a.imageUrl ?? "/tokens/default-token.svg",
      assetName: a.name,
      assetSymbol: a.symbol,
      walletBalance: a.walletBalance,
      amountInUsd: a.amountInUsd,
      idleAssetYield: a.amountInUsd * 0.06,
      isCollateral: a.isCollateral,
      tokenValue: a.symbol,
    }));
  }, [apiAssets]);

  const handleToggleCollateral = useMemo(() => {
    if (USE_MOCK) return undefined;
    return (assetId: string, isCollateral: boolean) => {
      setCollateralMutation.mutate({ assetIds: [assetId], isCollateral });
    };
  }, [setCollateralMutation]);

  // ─── Map API positions → DataTableAllPosition props ────────────────
  const positionTableData: PositionProps[] | undefined = useMemo(() => {
    if (USE_MOCK) return undefined;
    return apiPositions.map((p) => ({
      id: p.id,
      assetImg: p.imageUrl ?? "/tokens/default-token.svg",
      assetName: p.name,
      amount: p.amountInUsd,
      apr: 0,
      type: p.side.toLowerCase() as "lend" | "borrow",
      maturity: p.maturity ?? undefined,
    }));
  }, [apiPositions]);

  // ─── Chart props (API mode) ────────────────────────────────────────
  const chartProps = USE_MOCK
    ? {}
    : {
        availableBalance: apiPortfolio?.allocation.availableBalanceUsd ?? 0,
        suppliedAssets: apiPortfolio?.allocation.suppliedAssetsUsd ?? 0,
        borrowedAssets: apiPortfolio?.allocation.borrowedAssetsUsd ?? 0,
        totalValue: apiPortfolio?.totalDeposit ?? 0,
      };

  return (
    <PageContainer>
        {ready && !authenticated && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/5 backdrop-blur-xl">
            <div className="flex flex-col items-center gap-8 rounded-3xl border border-white/15 bg-white/5 px-14 py-14 text-center backdrop-blur-xl shadow-2xl shadow-black/20">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/10">
                <Lock className="h-10 w-10 text-white/70" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white">Login Required</h2>
                <p className="mt-2 text-sm text-white/60">
                  Please login to view your portfolio
                </p>
              </div>
              <div className="w-full min-w-[280px]">
                <CentuariLoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
              </div>
            </div>
          </div>
        )}
        {/* <PortfolioHeader /> */}
        <div className="mt-10 md:mt-20">
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white/5 border rounded-lg w-full px-6 md:px-8 py-8 lg:py-0 overflow-hidden">
            <Image
              src="/assets/portfolio-gradient-card.svg"
              alt="portfolio-gradient-card"
              width={944}
              height={217}
              className="absolute top-0 left-0 object-cover w-full h-full"
            />
            <div className="relative z-10">
              <h1 className="text-2xl md:text-3xl font-semibold">
                My Portofolio
              </h1>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:flex-row items-start md:items-center gap-6 md:gap-8 mt-6 md:mt-9 py-3.5">
                <div>
                  <CentuariTypography className="text-xs md:text-sm text-white">
                    Total Balance
                  </CentuariTypography>
                  <CentuariTypography className="text-xl md:text-2xl font-semibold mt-1">
                    <CurrencyValue
                      value={totalBalance}
                      decimalPlaces={2}
                      decimalClassName="text-white"
                    />
                  </CentuariTypography>
                </div>
                <Image
                  src="/assets/separator.svg"
                  alt="Separator"
                  width={1}
                  height={37}
                  className="hidden md:block"
                />
                <div>
                  <CentuariTypography className="text-xs md:text-sm text-white">
                    All Time Return
                  </CentuariTypography>
                  <CentuariTypography className="text-xl md:text-2xl font-semibold mt-1">
                    <CurrencyValue
                      value={allTimeReturn}
                      decimalPlaces={2}
                      decimalClassName="text-white"
                    />
                  </CentuariTypography>
                </div>
                <Image
                  src="/assets/separator.svg"
                  alt="Separator"
                  width={1}
                  height={37}
                  className="hidden md:block"
                />
                <div>
                  <CentuariTypography className="text-xs md:text-sm text-white">
                    Net APR
                  </CentuariTypography>
                  <CentuariTypography className="text-xl md:text-2xl font-semibold mt-1">
                    {netAPR.toFixed(1)}%
                  </CentuariTypography>
                </div>
              </div>
            </div>
            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8 lg:gap-4 w-full lg:w-auto">
              {/* Legend Section */}
              <div className="flex-shrink-0 w-full sm:w-[280px]">
                {[
                  {
                    label: "Available Balance",
                    color: "bg-[#2A4AC2]",
                    value: `${availableBalancePercent}%`,
                  },
                  {
                    label: "Supplied Assets",
                    color: "bg-[#AAC7F9]",
                    value: `${suppliedPercent}%`,
                  },
                  {
                    label: "Borrowed Assets",
                    color: "bg-[#4F8FFD]",
                    value: `${borrowedPercent}%`,
                  },
                ].map((item, idx) => (
                  <div
                    key={item.label}
                    className={`flex items-center justify-between py-2.5 ${idx !== 0 ? "border-t border-white/10" : ""
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 ${item.color} border border-black rounded-full flex-shrink-0`}
                      />
                      <p className="text-sm text-white/80">{item.label}</p>
                    </div>
                    <p className="text-sm font-medium text-white">
                      {item.value}
                    </p>
                  </div>
                ))}
                <Link href="/portfolio/transaction-history">
                  <Button
                    variant="secondary"
                    size={"sm"}
                    className="w-full mt-4"
                  >
                    See All Transaction
                  </Button>
                </Link>
              </div>
              {/* Chart Section */}
              <div className="flex-shrink-0 w-full sm:w-[220px] flex justify-center">
                <PortfolioChart {...chartProps} />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between bg-white/5 border rounded-xl overflow-hidden p-6 lg:p-0 lg:pl-8">
            <div>
              <h1 className="text-lg font-medium">Lend & Borrow Assets</h1>
              <div className="mt-8 lg:mt-12 flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-10">
                <div className="space-y-1.5">
                  <p className="text-sm">Supplied Assets</p>
                  <span className="text-2xl font-semibold">
                    <CurrencyValue value={suppliedAssetsUsd} decimalPlaces={2} />
                  </span>
                </div>
                <Image
                  src="/assets/separator.svg"
                  alt="Separator"
                  width={1}
                  height={37}
                  className="hidden sm:block"
                />
                <div className="space-y-1.5">
                  <p className="text-sm">Borrowed Assets</p>
                  <span className="text-2xl font-semibold">
                    <CurrencyValue value={borrowedAssetsUsd} decimalPlaces={2} />
                  </span>
                </div>
                <Image
                  src="/assets/separator.svg"
                  alt="Separator"
                  width={1}
                  height={37}
                  className="hidden sm:block"
                />
                <div className="space-y-1.5">
                  <p className="text-sm">Health Factor</p>
                  <Badge
                    variant={
                      healthFactorStatus === "Safe" || healthFactorStatus === "Good"
                        ? "success"
                        : healthFactorStatus === "Warning"
                          ? "warning"
                          : "destructive"
                    }
                  >
                    {healthFactor} ~ {healthFactorStatus}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="w-full lg:w-[700px] xl:w-[700px] mt-6 lg:mt-0">
              <LendBorrowChart />
            </div>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row items-stretch gap-3 mt-3">
          <div className="flex-1 h-[400px] min-w-0 overflow-x-auto">
            <DataTableAssets assets={assetTableData} onToggleCollateral={handleToggleCollateral} />
          </div>
          <div className="flex-1 h-[400px] min-w-0 overflow-x-auto">
            <DataTableAllPosition positions={positionTableData} />
          </div>
        </div>
    </PageContainer>
  );
}
