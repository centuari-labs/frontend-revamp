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
import { Button } from "./ui/button";
import { Headphones, Info, Pencil } from "lucide-react";
import Image from "next/image";
import { CentuariTypography } from "./centuari-typography";
import { OrderBookCard } from "./market/order-book";
import HealthFactor from "./centuari-health-factor";
import { Label } from "./ui/label";
import { CentuariTooltip } from "./centuari-tooltip";
import { SelectSingleToken } from "./select-single-token";
import { IcDollarCentuari } from "./icons/ic-dollar-centuari";
import { CentuariInput } from "./centuari-input";
import { Badge } from "./ui/badge";

export function AmendDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" size="icon">
          <Pencil size={14} />
        </Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col gap-0 sm:max-w-2xl data-[state=open]:!zoom-in-0 data-[state=open]:duration-600 p-6">
        <DialogHeader className="contents space-y-0 text-left">
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
            <div className="absolute w-[568px] h-[450px] -top-72 left-0 bg-primary-blue-base/50 blur-[264px] opacity-100 transition-opacity duration-500" />
            <div className="absolute w-[150px] h-[216px] -top-60 left-1/3 bg-white blur-3xl opacity-100 transition-opacity duration-500" />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">Amend Dialog</h1>
            <span className="text-sm text-muted-foreground">
              Want to make a quick change? You can update your rate or amount
              here — no need to cancel.
            </span>
          </div>
        </DialogHeader>
        <div className="flex gap-2 mt-5">
          <div className="relative flex-1">
            <div className="absolute inset-x-0 h-px w-2/3 mx-auto top-0 shadow-2xl bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            <OrderBookCard height="500px" />
          </div>
          <div className="relative text-center text-white/60 flex-1 bg-white/5 px-2.5 rounded-md">
            <div className="absolute inset-x-0 h-px w-2/3 mx-auto top-0 shadow-2xl bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            <form action="">
              <CentuariInput
                id="amount"
                label="Amount to Lend"
                size="large"
                placeholder="Placeholder"
                leftIcon={<IcDollarCentuari size={16} />}
                rightIcon={
                  <Button variant={"link"} className="px-0" type="button">
                    Max
                  </Button>
                }
                balanceText="$1,000"
                className="mt-0"
                containerClassName="mt-3.5"
              />
              <SelectSingleToken />
              <SelectSingleToken />
              <div>
                <Label className="mb-2 mt-4">
                  Health Factor{" "}
                  <CentuariTooltip message="Your health factor indicates the safety of your borrowed position.">
                    <Info size={16} />
                  </CentuariTooltip>
                  <Badge variant="success">0.0 ~ Safe</Badge>
                </Label>
                <div className="border border-white/5 rounded-lg mt-2">
                  <div className="h-11 flex items-center justify-center px-4 rounded-lg border-b border-white/5 bg-white/10 z-50">
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
              <div className="py-4 mt-8 flex gap-2.5">
                <Button type="button" variant="secondary" className="flex-1">
                  Cancel
                </Button>
                <Button type="button" variant="primary" className="flex-1">
                  Amend Order
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
