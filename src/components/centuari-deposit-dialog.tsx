"use client";

import { useState, useRef, useEffect } from "react";
import { gsap } from "gsap";
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
import { Info, ArrowLeft, Plus } from "lucide-react";
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
import { CentuariAlert } from "./centuari-alert";
import { SelectToken } from "./select-token";

export function CentuariDepositDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="primary" className="flex-1" size={"lg"}>
          Deposit <Plus size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[min(600px,80vh)] flex-col gap-0 p-0 sm:max-w-md data-[state=open]:!zoom-in-0 data-[state=open]:duration-600">
        <DialogHeader className="contents space-y-0 text-left">
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
            <div className="absolute w-[568px] h-[450px] -top-72 left-0 bg-primary-blue-base/50 blur-[264px] opacity-100 transition-opacity duration-500" />
            <div className="absolute w-[150px] h-[216px] -top-60 left-1/3 bg-white blur-3xl opacity-100 transition-opacity duration-500" />
          </div>
          <div className="relative mt-6 px-6">
            <div className="flex flex-col items-center justify-center text-center">
              <Image
                src={"/centuari-logo.png"}
                width={48}
                height={48}
                alt="centuari-logo"
              />
              <CentuariTypography variant="h1" className="mt-8">
                Deposit to Your Vault
              </CentuariTypography>
              <CentuariTypography
                variant="b3"
                className="mb-1 text-muted-foreground mt-3"
              >
                Select the asset and amount you want to add, and power up your
                Centuari balance.
              </CentuariTypography>
            </div>
            <form>
              <SelectToken />
              <CentuariInput
                id="amount"
                label="Deposit Amount"
                size="large"
                placeholder="Amount"
                leftIcon={<IcDollarCentuari size={16} />}
                className="mt-0"
                containerClassName="mt-3.5"
              />
            </form>
          </div>
        </DialogHeader>
        <DialogFooter className="flex-row items-center justify-end px-6 py-4">
          <Button type="button" variant="primary" className="flex-1">
            Confirm Deposit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
