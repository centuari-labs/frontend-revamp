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
import { Info, ArrowLeft } from "lucide-react";
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

type ViewMode = "borrow" | "add-collateral";

export function CentuariBorrowDialog() {
  const [viewMode, setViewMode] = useState<ViewMode>("borrow");
  const borrowViewRef = useRef<HTMLDivElement>(null);
  const collateralViewRef = useRef<HTMLDivElement>(null);

  const handleAddCollateralClick = () => setViewMode("add-collateral");
  const handleBackToBorrow = () => setViewMode("borrow");

  const handleDialogChange = (open: boolean) => {
    if (!open) setViewMode("borrow");
  };

  // Animate transitions between views
  useEffect(() => {
    const tl = gsap.timeline();

    if (
      viewMode === "borrow" &&
      borrowViewRef.current &&
      collateralViewRef.current
    ) {
      tl.to(collateralViewRef.current, {
        x: 100,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
      }).fromTo(
        borrowViewRef.current,
        { x: -100, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.3, ease: "power2.out" },
        "-=0.15"
      );
    } else if (
      viewMode === "add-collateral" &&
      borrowViewRef.current &&
      collateralViewRef.current
    ) {
      tl.to(borrowViewRef.current, {
        x: -100,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
      }).fromTo(
        collateralViewRef.current,
        { x: 100, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.3, ease: "power2.out" },
        "-=0.15"
      );
    }
  }, [viewMode]);

  return (
    <Dialog onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="flex-1">
          Borrow
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[min(600px,80vh)] flex-col gap-0 p-0 sm:max-w-md data-[state=open]:!zoom-in-0 data-[state=open]:duration-600">
        <DialogHeader className="contents space-y-0 text-left">
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
            <div className="absolute w-[568px] h-[450px] -top-72 left-0 bg-[#1D7656]/50 blur-[264px] opacity-100 transition-opacity duration-500" />
            <div className="absolute w-[150px] h-[216px] -top-60 left-1/3 bg-white blur-3xl opacity-100 transition-opacity duration-500" />
          </div>
          <ScrollArea className="flex max-h-full flex-col overflow-hidden pb-2">
            <div className="relative overflow-hidden min-h-[400px]">
              {/* Borrow View */}
              <div
                ref={borrowViewRef}
                className={
                  viewMode === "borrow"
                    ? "relative"
                    : "absolute inset-0 pointer-events-none"
                }
                style={{ opacity: viewMode === "borrow" ? 1 : 0 }}
              >
                <div className="flex flex-col items-center justify-center gap-2 mt-6">
                  <Image
                    src="/tokens/centuari-usdt.png"
                    alt="usdt"
                    width={76.5}
                    height={76.5}
                  />
                  <CentuariTypography variant="h4">USDT</CentuariTypography>
                  <div className="flex w-full items-center justify-around mt-4 px-6">
                    <div>
                      <CentuariTypography
                        className="flex items-center gap-1 text-muted-foreground"
                        variant="b3"
                      >
                        Borrow Rate{" "}
                        <CentuariTooltip message="The interest rate at which you can borrow USDT.">
                          <Info size={16} />
                        </CentuariTooltip>
                      </CentuariTypography>
                      <CentuariTypography variant="h5" className="text-center">
                        7.2%
                      </CentuariTypography>
                    </div>
                    <div>
                      <CentuariTypography
                        className="flex items-center gap-1 text-muted-foreground"
                        variant="b3"
                      >
                        Net APR{" "}
                        <CentuariTooltip message="The annual percentage rate for borrowing USDT after fees.">
                          <Info size={16} />
                        </CentuariTooltip>
                      </CentuariTypography>
                      <CentuariTypography variant="h5" className="text-center">
                        7.2%
                      </CentuariTypography>
                    </div>
                  </div>
                </div>

                <div className="mt-6 px-6">
                  <form action="">
                    <CentuariInput
                      id="amount"
                      label="Amount to Borrow"
                      size="large"
                      placeholder="Placeholder"
                      leftIcon={<IcDollarCentuari size={16} />}
                      rightIcon={
                        <Button variant="link" className="px-0" type="button">
                          Max
                        </Button>
                      }
                      balanceText="$1,000"
                    />

                    <div>
                      <Label className="mb-2 mt-4">
                        Maturity{" "}
                        <CentuariTooltip message="Select the maturity period for your borrowed USDT.">
                          <Info size={16} />
                        </CentuariTooltip>
                      </Label>
                      <MaturityToggle />
                      <CentuariTypography
                        variant="s4"
                        className="mt-2 text-muted-foreground flex items-center gap-1"
                      >
                        Withdrawal Unlocks on
                        <CentuariTypography variant="s4">
                          21 Oct 2026
                        </CentuariTypography>
                      </CentuariTypography>
                    </div>

                    <SelectSingleToken />

                    <CentuariAlert
                      variant="destructive"
                      text="Not enough collateral"
                      description="Increase collateral to borrow more"
                      className="mt-4"
                      action={
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleAddCollateralClick}
                          type="button"
                        >
                          Add Collateral
                        </Button>
                      }
                    />

                    <div>
                      <Label className="mb-2 mt-4">
                        Health Factor{" "}
                        <CentuariTooltip message="Your health factor indicates the safety of your borrowed position.">
                          <Info size={16} />
                        </CentuariTooltip>
                        <Badge variant="success">0.0 ~ Safe</Badge>
                      </Label>
                      <div className="border border-white/5 rounded-lg mt-2">
                        <div className="px-2 py-5 rounded-lg border-b border-white/5 bg-white/10 z-50">
                          <HealthFactor />
                        </div>
                        <div className="px-2 py-4 z-20 -mt-2 border-t-0 border-white/5 rounded-b-lg">
                          <p className="text-xs text-muted-foreground">
                            If USDC drops{" "}
                            <span className="text-white font-medium">
                              below $000
                            </span>
                            , your position could be liquidated.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 py-3 px-4 text-sm rounded-xl rounded-b-none border border-white/5 flex flex-col gap-2 mt-5">
                      {[
                        { label: "Transaction Fee", value: "0.1%" },
                        { label: "Amount to Pay Now", value: "$1,001.00" },
                      ].map(({ label, value }, i) => (
                        <div
                          key={label}
                          className={`flex items-center justify-between ${
                            i < 1 ? "border-b border-dashed pb-2" : ""
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
                          $1,049.00
                        </span>
                      </div>
                    </div>
                  </form>
                </div>
              </div>

              {/* Add-Collateral View */}
              <div
                ref={collateralViewRef}
                className={
                  viewMode === "add-collateral"
                    ? "relative mt-6 px-6"
                    : "absolute inset-0 pointer-events-none mt-6 px-6"
                }
                style={{ opacity: viewMode === "add-collateral" ? 1 : 0 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToBorrow}
                  className="mb-4 -ml-2"
                  type="button"
                >
                  <ArrowLeft size={16} />
                </Button>
                <CentuariTypography variant="h1" className="mb-1">
                  Add Collateral
                </CentuariTypography>
                <span className="text-sm text-muted-foreground">
                  Increase your borrowing limit and keep your position safe.
                </span>
                <form action="">
                  <SelectSingleToken />
                  <div>
                    <Label className="mb-2 mt-4">
                      Est. Health Factor{" "}
                      <CentuariTooltip message="Your health factor indicates the safety of your borrowed position.">
                        <Info size={16} />
                      </CentuariTooltip>
                      <Badge variant="success">0.0 ~ Safe</Badge>
                    </Label>
                    <div className="border border-white/5 rounded-lg mt-2">
                      <div className="px-2 py-5 rounded-lg border-b border-white/5 bg-white/10 z-50">
                        <HealthFactor />
                      </div>
                      <div className="px-2 py-4 z-20 -mt-2 border-t-0 border-white/5 rounded-b-lg">
                        <p className="text-xs text-muted-foreground">
                          If USDC drops{" "}
                          <span className="text-white font-medium">
                            below $000
                          </span>
                          , your position could be liquidated.
                        </p>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </ScrollArea>
        </DialogHeader>
        <DialogFooter className="flex-row items-center justify-end px-6 py-4">
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button type="button" variant="primary" className="flex-1">
            {viewMode === "borrow"
              ? "Confirm Borrow"
              : "Confirm Add Collateral"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
