import { CentuariTooltip } from "@/components/centuari-tooltip";
import { Info } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface TransactionSummaryProps {
  transactionFee?: number;
  amountToPay?: number;
  futureAmount?: number;
  items?: Array<{ label: string; value: string }>;
  futurePayment?: string;
  futureLabel?: string;
  tokenSymbol?: string;
}

export function TransactionSummary({
  transactionFee,
  amountToPay,
  futureAmount,
  items,
  futurePayment,
  futureLabel = "In the future you'll get",
  tokenSymbol,
}: TransactionSummaryProps) {
  const suffix = tokenSymbol ? ` ${tokenSymbol}` : "";

  // Use provided values or fallback to items prop (for backward compatibility)
  const displayItems = items || [
    {
      label: "Transaction Fee",
      value: (transactionFee !== undefined ? formatNumber(transactionFee) : "0.000") + suffix,
    },
    {
      label: "Amount to Pay Now",
      value: (amountToPay !== undefined ? formatNumber(amountToPay) : "0.000") + suffix,
    },
  ];

  const displayFuturePayment = futurePayment || ((futureAmount !== undefined ? formatNumber(futureAmount) : "0.000") + suffix);

  return (
    <>
      <div className="bg-white/5 py-3 px-5 text-sm rounded-xl rounded-b-none border border-white/5 flex flex-col gap-2 mt-5">
        {displayItems.map(({ label, value }, i) => (
          <div
            key={label}
            className={`flex flex-row items-center justify-between gap-4 min-h-[2rem] ${
              i < displayItems.length - 1 ? "border-b border-dashed pb-3" : ""
            }`}
          >
            <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1 text-muted-foreground">
              {label}{" "}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <p>{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="py-3 px-5 text-sm border border-white/5 rounded-b-lg border-t-0 text-muted-foreground bg-white/5 flex flex-col justify-center">
        <div className="flex flex-row items-center justify-between gap-4 min-h-[2rem]">
          <div className="flex flex-wrap items-center gap-1 min-w-0 flex-1">
            {futureLabel}{" "}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-transparent font-semibold bg-clip-text bg-gradient-to-r from-primary-blue-base via-white to-primary-blue-base">
              {displayFuturePayment}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
