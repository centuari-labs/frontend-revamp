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
import { PortfolioPageSkeleton } from "@/components/portfolio/portfolio-skeleton";

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
  const { portfolio: apiPortfolio, isLoading } = useMyPortfolio();
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

  // ─── Dummy data for development ──────────────────────────────────
  const dummyAssets: AssetProps[] = [
    { id: "usdc", assetImg: "/tokens/usdc.svg", assetName: "USD Coin", assetSymbol: "USDC", walletBalance: 5200.50, amountInUsd: 5200.50, idleAssetYield: 312.03, isCollateral: true, tokenValue: "usdc" },
    { id: "eth", assetImg: "/tokens/eth.svg", assetName: "Ethereum", assetSymbol: "ETH", walletBalance: 2.35, amountInUsd: 7520.00, idleAssetYield: 451.20, isCollateral: true, tokenValue: "eth" },
    { id: "wbtc", assetImg: "/tokens/wbtc.svg", assetName: "Wrapped Bitcoin", assetSymbol: "WBTC", walletBalance: 0.15, amountInUsd: 9750.00, idleAssetYield: 585.00, isCollateral: false, tokenValue: "wbtc" },
    { id: "usdt", assetImg: "/tokens/usdt.svg", assetName: "Tether", assetSymbol: "USDT", walletBalance: 3100.00, amountInUsd: 3100.00, idleAssetYield: 186.00, isCollateral: true, tokenValue: "usdt" },
    { id: "dai", assetImg: "/tokens/dai.svg", assetName: "Dai", assetSymbol: "DAI", walletBalance: 4500.00, amountInUsd: 4500.00, idleAssetYield: 270.00, isCollateral: true, tokenValue: "dai" },
    { id: "link", assetImg: "/tokens/link.svg", assetName: "Chainlink", assetSymbol: "LINK", walletBalance: 320.00, amountInUsd: 4480.00, idleAssetYield: 268.80, isCollateral: false, tokenValue: "link" },
    { id: "uni", assetImg: "/tokens/uni.svg", assetName: "Uniswap", assetSymbol: "UNI", walletBalance: 450.00, amountInUsd: 3150.00, idleAssetYield: 189.00, isCollateral: false, tokenValue: "uni" },
    { id: "aave", assetImg: "/tokens/aave.svg", assetName: "Aave", assetSymbol: "AAVE", walletBalance: 25.00, amountInUsd: 6250.00, idleAssetYield: 375.00, isCollateral: true, tokenValue: "aave" },
    { id: "matic", assetImg: "/tokens/matic.svg", assetName: "Polygon", assetSymbol: "MATIC", walletBalance: 8500.00, amountInUsd: 5100.00, idleAssetYield: 306.00, isCollateral: true, tokenValue: "matic" },
    { id: "arb", assetImg: "/tokens/arb.svg", assetName: "Arbitrum", assetSymbol: "ARB", walletBalance: 6200.00, amountInUsd: 4960.00, idleAssetYield: 297.60, isCollateral: false, tokenValue: "arb" },
    { id: "op", assetImg: "/tokens/op.svg", assetName: "Optimism", assetSymbol: "OP", walletBalance: 3800.00, amountInUsd: 5700.00, idleAssetYield: 342.00, isCollateral: true, tokenValue: "op" },
    { id: "sol", assetImg: "/tokens/sol.svg", assetName: "Solana", assetSymbol: "SOL", walletBalance: 42.00, amountInUsd: 6300.00, idleAssetYield: 378.00, isCollateral: false, tokenValue: "sol" },
    { id: "avax", assetImg: "/tokens/avax.svg", assetName: "Avalanche", assetSymbol: "AVAX", walletBalance: 180.00, amountInUsd: 4320.00, idleAssetYield: 259.20, isCollateral: true, tokenValue: "avax" },
    { id: "crv", assetImg: "/tokens/crv.svg", assetName: "Curve", assetSymbol: "CRV", walletBalance: 7500.00, amountInUsd: 3750.00, idleAssetYield: 225.00, isCollateral: false, tokenValue: "crv" },
    { id: "mkr", assetImg: "/tokens/mkr.svg", assetName: "Maker", assetSymbol: "MKR", walletBalance: 2.80, amountInUsd: 8400.00, idleAssetYield: 504.00, isCollateral: true, tokenValue: "mkr" },
    { id: "snx", assetImg: "/tokens/snx.svg", assetName: "Synthetix", assetSymbol: "SNX", walletBalance: 1500.00, amountInUsd: 3000.00, idleAssetYield: 180.00, isCollateral: false, tokenValue: "snx" },
    { id: "comp", assetImg: "/tokens/comp.svg", assetName: "Compound", assetSymbol: "COMP", walletBalance: 55.00, amountInUsd: 2750.00, idleAssetYield: 165.00, isCollateral: true, tokenValue: "comp" },
    { id: "ldo", assetImg: "/tokens/ldo.svg", assetName: "Lido DAO", assetSymbol: "LDO", walletBalance: 2200.00, amountInUsd: 4400.00, idleAssetYield: 264.00, isCollateral: false, tokenValue: "ldo" },
    { id: "frax", assetImg: "/tokens/frax.svg", assetName: "Frax", assetSymbol: "FRAX", walletBalance: 6000.00, amountInUsd: 6000.00, idleAssetYield: 360.00, isCollateral: true, tokenValue: "frax" },
    { id: "reth", assetImg: "/tokens/reth.svg", assetName: "Rocket Pool ETH", assetSymbol: "rETH", walletBalance: 1.80, amountInUsd: 5940.00, idleAssetYield: 356.40, isCollateral: true, tokenValue: "reth" },
  ];

  const now = Math.floor(Date.now() / 1000);
  const dummyPositions: PositionProps[] = [
    { id: "pos-1", assetImg: "/tokens/usdc.svg", assetName: "USDC", amount: 10000.00, apr: 0.065, type: "lend", maturity: now + 86400 * 90 },
    { id: "pos-2", assetImg: "/tokens/eth.svg", assetName: "ETH", amount: 5000.00, apr: 0.045, type: "lend", maturity: now + 86400 * 180 },
    { id: "pos-3", assetImg: "/tokens/wbtc.svg", assetName: "WBTC", amount: 3500.00, apr: 0.072, type: "borrow", maturity: now + 86400 * 60 },
    { id: "pos-4", assetImg: "/tokens/usdt.svg", assetName: "USDT", amount: 8000.00, apr: 0.055, type: "borrow", maturity: now + 86400 * 120 },
    { id: "pos-5", assetImg: "/tokens/dai.svg", assetName: "DAI", amount: 12000.00, apr: 0.058, type: "lend", maturity: now + 86400 * 45 },
    { id: "pos-6", assetImg: "/tokens/link.svg", assetName: "LINK", amount: 4200.00, apr: 0.082, type: "borrow", maturity: now + 86400 * 30 },
    { id: "pos-7", assetImg: "/tokens/uni.svg", assetName: "UNI", amount: 3000.00, apr: 0.038, type: "lend", maturity: now + 86400 * 150 },
    { id: "pos-8", assetImg: "/tokens/aave.svg", assetName: "AAVE", amount: 6500.00, apr: 0.068, type: "borrow", maturity: now + 86400 * 75 },
    { id: "pos-9", assetImg: "/tokens/matic.svg", assetName: "MATIC", amount: 2800.00, apr: 0.042, type: "lend", maturity: now + 86400 * 200 },
    { id: "pos-10", assetImg: "/tokens/arb.svg", assetName: "ARB", amount: 4800.00, apr: 0.061, type: "borrow", maturity: now + 86400 * 100 },
    { id: "pos-11", assetImg: "/tokens/op.svg", assetName: "OP", amount: 7200.00, apr: 0.052, type: "lend", maturity: now + 86400 * 60 },
    { id: "pos-12", assetImg: "/tokens/sol.svg", assetName: "SOL", amount: 9100.00, apr: 0.075, type: "borrow", maturity: now + 86400 * 45 },
    { id: "pos-13", assetImg: "/tokens/avax.svg", assetName: "AVAX", amount: 3300.00, apr: 0.048, type: "lend", maturity: now + 86400 * 120 },
    { id: "pos-14", assetImg: "/tokens/crv.svg", assetName: "CRV", amount: 2500.00, apr: 0.085, type: "borrow", maturity: now + 86400 * 90 },
    { id: "pos-15", assetImg: "/tokens/mkr.svg", assetName: "MKR", amount: 11000.00, apr: 0.056, type: "lend", maturity: now + 86400 * 240 },
    { id: "pos-16", assetImg: "/tokens/snx.svg", assetName: "SNX", amount: 1800.00, apr: 0.078, type: "borrow", maturity: now + 86400 * 55 },
    { id: "pos-17", assetImg: "/tokens/comp.svg", assetName: "COMP", amount: 4000.00, apr: 0.041, type: "lend", maturity: now + 86400 * 160 },
    { id: "pos-18", assetImg: "/tokens/ldo.svg", assetName: "LDO", amount: 5500.00, apr: 0.069, type: "borrow", maturity: now + 86400 * 80 },
    { id: "pos-19", assetImg: "/tokens/frax.svg", assetName: "FRAX", amount: 8500.00, apr: 0.047, type: "lend", maturity: now + 86400 * 110 },
    { id: "pos-20", assetImg: "/tokens/reth.svg", assetName: "rETH", amount: 6800.00, apr: 0.063, type: "borrow", maturity: now + 86400 * 70 },
  ];

  // ─── Map API assets → DataTableAssets props ────────────────────────
  const assetTableData: AssetProps[] | undefined = useMemo(() => {
    if (USE_MOCK) return undefined;
    const mapped = apiAssets.map((a) => ({
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
    return mapped;
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
    const mapped = apiPositions.map((p) => ({
      id: p.id,
      assetImg: p.imageUrl ?? "/tokens/default-token.svg",
      assetName: p.name,
      amount: p.amountInUsd,
      apr: 0,
      type: p.side.toLowerCase() as "lend" | "borrow",
      maturity: p.maturity ?? undefined,
    }));
    return mapped;
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

  // if (!USE_MOCK && isLoading) {
  //   return (
  //     <PageContainer>
  //       <PortfolioPageSkeleton />
  //     </PageContainer>
  //   );
  // }

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
          <div className="flex-1 min-h-[400px] min-w-0 overflow-x-auto">
            <DataTableAssets assets={assetTableData} onToggleCollateral={handleToggleCollateral} />
          </div>
          <div className="flex-1 min-h-[400px] min-w-0 overflow-x-auto">
            <DataTableAllPosition positions={positionTableData} />
          </div>
        </div>
    </PageContainer>
  );
}
