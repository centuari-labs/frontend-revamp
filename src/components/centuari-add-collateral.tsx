"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "./ui/button";
import { InfoIcon } from "lucide-react";
import Image from "next/image";
import { CentuariTypography } from "./centuari-typography";
import { CentuariTooltip } from "./centuari-tooltip";
import { CentuariInput } from "./centuari-input";
import { IcDollarCentuari } from "./icons/ic-dollar-centuari";
import { MaturityToggle } from "./maturity-toggle";
import { Label } from "./ui/label";
import { SelectSingleToken } from "./select-single-token";
import HealthFactor from "./centuari-health-factor";
import { Badge } from "./ui/badge";

export function CentuariAddDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive" size={"sm"}>
          Add Collateral
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[min(600px,80vh)] flex-col gap-0 p-0 sm:max-w-md data-[state=open]:!zoom-in-0 data-[state=open]:duration-600">
        <DialogHeader className="contents space-y-0 text-left">
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
            <div className="absolute w-[568px] h-[450px] -top-72 left-0 bg-[#1D7656]/50 blur-[264px] opacity-100 transition-opacity duration-500" />
            <div className="absolute w-[150px] h-[216px] -top-60 left-1/3 bg-white blur-3xl opacity-100 transition-opacity duration-500" />
          </div>
          <div className="mt-6 px-6">
            <form action="">
              <SelectSingleToken />
              <div>
                <Label className="mb-2 mt-4">
                  Health Factor{" "}
                  <CentuariTooltip message="Your health factor shows how safe your borrowed position is. Blue indicates a safe position.">
                    <InfoIcon size={16} />
                  </CentuariTooltip>
                  <Badge variant={"success"}>0.0 ~ Safe</Badge>
                </Label>
                <div className="border border-white/5 rounded-lg mt-2">
                  <div className="px-2 py-5 rounded-lg border-b border-white/5 bg-white/10 z-50">
                    <HealthFactor />
                  </div>
                  <div className="px-2 py-4 z-20 -mt-2 border-t-0 border-white/5 rounded-b-lg">
                    <p className="text-xs text-muted-foreground">
                      If USDC drops{" "}
                      <span className="text-white font-medium">below $000</span>
                      , your position could be liquidated.
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </DialogHeader>
        <DialogFooter className="flex-row items-center justify-end px-6 py-4">
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button type="button" variant={"primary"} className="flex-1">
            Confirm Borrow
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
