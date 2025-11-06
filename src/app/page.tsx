import { CentuariTokenCard } from "@/components/centuari-token-card";
import { CentuariTypography } from "@/components/centuari-typography";
import { IcPieChartColorCentuari } from "@/components/icons/ic-pie-chart-color-centuari";
import { IcWalletColorCentuari } from "@/components/icons/ic-wallet-color-centuari";

export default function Page() {
  return (
    <div className="relative w-full flex justify-center mt-24">
      <div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-0">
          <div>
            <CentuariTypography className="text-transparent text-4xl bg-clip-text bg-gradient-to-r from-primary-blue-base via-white to-primary-blue-base">
              Hi Centuari!, Let's
            </CentuariTypography>
            <CentuariTypography className="text-4xl font-semibold mt-2">
              Earning and Borrowing
            </CentuariTypography>
          </div>
          <div className="flex flex-col md:flex-row gap-6 md:gap-12 mt-6 md:mt-0">
            <div className="mt-6 flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-lg border border-white/5">
                <IcWalletColorCentuari />
              </div>
              <div>
                <CentuariTypography className="text-sm text-muted-foreground">
                  Total Balance
                </CentuariTypography>
                <CentuariTypography className="text-2xl font-semibold mt-1">
                  {(() => {
                    const totalBalance = 8910.11; // nanti ganti dari API
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
                        <span className="text-[#2B2F37]">
                          {formatted.slice(idx)}
                        </span>
                      </>
                    );
                  })()}
                </CentuariTypography>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-lg border border-white/5">
                <IcPieChartColorCentuari />
              </div>
              <div>
                <CentuariTypography className="text-sm text-muted-foreground">
                  Active Loans
                </CentuariTypography>
                <CentuariTypography className="text-2xl font-semibold mt-1">
                  {(() => {
                    const activeLoans = 8910.11; // nanti ganti dari API
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
                        <span className="text-[#2B2F37]">
                          {formatted.slice(idx)}
                        </span>
                      </>
                    );
                  })()}
                </CentuariTypography>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <CentuariTokenCard />
          <CentuariTokenCard />
          <CentuariTokenCard />
          <CentuariTokenCard />
          <CentuariTokenCard />
          <CentuariTokenCard />
        </div>
      </div>
    </div>
  );
}
