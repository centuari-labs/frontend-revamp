import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import { CentuariTooltip } from "./centuari-tooltip";
import { ArrowRight, InfoIcon } from "lucide-react";
import { CentuariTypography } from "./centuari-typography";

export const CentuariTokenCard = () => {
  return (
    <Card className="w-full min-w-[23.625rem] p-4 gap-2 bg-white/5 relative group overflow-hidden transition-all duration-300">
      <CardHeader className="gap-0 pb-0">
        <div className="flex flex-col items-center gap-4">
          <CardTitle>
            <Image
              src={"/tokens/centuari-usdt.png"}
              alt="token"
              width={68}
              height={68}
            />
          </CardTitle>
          <CentuariTypography variant="b1">USDT</CentuariTypography>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col gap-4">
          {[
            { label: "Borrow Rate", value: "7,2%" },
            { label: "Net APR", value: "7,2%" },
            { label: "Collateral Factor", value: "7,2%" },
          ].map(({ label, value }, i) => (
            <div
              key={label}
              className={`flex items-center justify-between ${
                i < 2 ? "border-b border-dashed pb-2" : ""
              }`}
            >
              <p>{label}</p>
              <div className="flex items-center gap-1">
                <p>{value}</p>
                <CentuariTooltip message="Coming Soon">
                  <InfoIcon size={12} />
                </CentuariTooltip>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col px-0">
        <div className="flex gap-2 w-full">
          <Button variant="secondary" type="submit" className="flex-1">
            Borrow
          </Button>
          <Button variant="primary-dark" className="flex-1">
            Start Earning
          </Button>
        </div>
        <Button
          variant="ghost"
          className="w-full flex items-center justify-center mt-4 gap-2"
        >
          View Market for Details <ArrowRight size={12} />
        </Button>
      </CardFooter>
      <div className="pointer-events-none absolute w-[568px] h-[450px] top-[96px] left-[-90px] bg-[#1D7656]/10 blur-[264px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="pointer-events-none absolute w-[448px] h-[216px] top-[350px] left-[-35px] bg-[#37B48B]/50 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </Card>
  );
};
