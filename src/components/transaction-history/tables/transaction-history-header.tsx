import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";

export function TransactionHistoryHeader() {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between py-6 gap-4">
      <Link href={"/portfolio"} className="flex items-center gap-2">
        <ArrowLeft size={28} />
        <h2 className="text-2xl md:text-4xl font-semibold">
          Transaction History
        </h2>
      </Link>
      <Button
        variant={"primary"}
        className="w-full md:w-auto flex items-center gap-2 hidden"
      >
        <Download className="w-4 h-4" />
        Download .CSV
      </Button>
    </div>
  );
}
