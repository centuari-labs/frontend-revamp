import { CentuariTooltip } from "@/components/centuari-tooltip";
import { Info } from "lucide-react";

interface TransactionItem {
  label: string;
  value: string;
}

interface TransactionSummaryProps {
  items?: TransactionItem[];
  futurePayment?: string;
}

const defaultItems: TransactionItem[] = [
  { label: "Transaction Fee", value: "0.1%" },
  { label: "Amount to Pay Now", value: "$1,001.00" },
];

export function TransactionSummary({
  items = defaultItems,
  futurePayment = "$1,049.00",
}: TransactionSummaryProps) {
  return (
    <>
      <div className="bg-white/5 py-3 px-4 text-sm rounded-xl rounded-b-none border border-white/5 flex flex-col gap-2 mt-5">
        {items.map(({ label, value }, i) => (
          <div
            key={label}
            className={`flex items-center justify-between ${
              i < items.length - 1 ? "border-b border-dashed pb-2" : ""
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
            In the future you'll pay{" "}
            <CentuariTooltip message="Coming Soon">
              <Info size={12} />
            </CentuariTooltip>{" "}
          </div>
          <span className="text-transparent font-semibold bg-clip-text bg-gradient-to-r from-primary-blue-base via-white to-primary-blue-base">
            {futurePayment}
          </span>
        </div>
      </div>
    </>
  );
}
