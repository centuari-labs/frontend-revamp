import { CentuariTooltip } from "@/components/centuari-tooltip";
import { Info } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface TransactionSummaryProps {
  transactionFee?: number;
  amountToPay?: number;
  futureAmount?: number;
  items?: Array<{ label: string; value: string }>;
  futurePayment?: string;
}

export function TransactionSummary({
  transactionFee,
  amountToPay,
  futureAmount,
  items,
  futurePayment,
}: TransactionSummaryProps) {
  // Use provided values or fallback to items prop (for backward compatibility)
  const displayItems = items || [
    {
      label: "Transaction Fee",
      value: transactionFee !== undefined ? `${formatCurrency(transactionFee)} (0.01%)` : "$0.00 (0.01%)",
    },
    {
      label: "Amount to Pay Now",
      value: amountToPay !== undefined ? formatCurrency(amountToPay) : "$0.00",
    },
  ];

  const displayFuturePayment = futurePayment || (futureAmount !== undefined ? formatCurrency(futureAmount) : "$0.00");

  return (
    <>
      <div className="bg-white/5 py-3 px-4 text-sm rounded-xl rounded-b-none border border-white/5 flex flex-col gap-2 mt-5">
        {displayItems.map(({ label, value }, i) => (
          <div
            key={label}
            className={`flex items-center justify-between ${
              i < displayItems.length - 1 ? "border-b border-dashed pb-2" : ""
            }`}
          >
            <p className="flex text-muted-foreground items-center gap-2">
              {label}{" "}
              {i === 0 && (
                <CentuariTooltip message="Coming Soon">
                  <Info size={12} />
                </CentuariTooltip>
              )}
            </p>
            <div className="flex items-center gap-1">
              <p>{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="py-3 px-4 text-sm border border-white/5 rounded-b-lg border-t-0 text-muted-foreground bg-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            In the future you'll get and pay{" "}
            <CentuariTooltip message="Coming Soon">
              <Info size={12} />
            </CentuariTooltip>{" "}
          </div>
          <span className="text-transparent font-semibold bg-clip-text bg-gradient-to-r from-primary-blue-base via-white to-primary-blue-base">
            {displayFuturePayment}
          </span>
        </div>
      </div>
    </>
  );
}
