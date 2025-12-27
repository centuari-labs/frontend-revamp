import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function TransactionHistoryHeader() {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between py-6 gap-4">
      <h2 className="text-3xl md:text-4xl font-semibold">
        Transaction History
      </h2>
      <Button
        variant={"primary"}
        className="w-full md:w-auto flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        Download .CSV
      </Button>
    </div>
  );
}
