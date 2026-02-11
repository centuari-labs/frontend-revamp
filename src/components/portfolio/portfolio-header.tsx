import { CentuariTypography } from "@/components/centuari-typography";
import { StatCard } from "@/components/stat-card";
import { CurrencyValue } from "@/components/currency-value";
import { CentuariBadge } from "../centuari-badge";

export function PortfolioHeader() {
  return (
    <div className="flex justify-between items-center w-full md:flex-items-start md:items-center gap-6 md:gap-0">
      <h1 className="text-3xl font-semibold">Portfolio</h1>
      <div className="flex flex-col items-center md:flex-row gap-6 md:gap-12 md:mt-0 py-3.5">
        <StatCard
          label="Total Balance"
          value={<CurrencyValue value={2340340.0} decimalPlaces={2} />}
          variant="compact"
        />
        <StatCard
          label="My Total Supply"
          value={<CurrencyValue value={840340.0} decimalPlaces={2} />}
          variant="compact"
        />
        <StatCard
          label="My Total Borrow"
          value={<CurrencyValue value={840340.0} decimalPlaces={2} />}
          variant="compact"
        />
        <StatCard
          label="Health Factor"
          value={<CentuariBadge variant="success">0.0 ~ Safe</CentuariBadge>}
          variant="compact"
        />
      </div>
    </div>
  );
}
