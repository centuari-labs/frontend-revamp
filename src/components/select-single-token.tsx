"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { CentuariTooltip } from "./centuari-tooltip";
import { InfoIcon } from "lucide-react";
import Image from "next/image";

export function SelectSingleToken() {
  const id = React.useId();
  const [selectedToken, setSelectedToken] = React.useState("usdt");

  // refs untuk elemen kiri (SelectTrigger) dan kanan (Button Max)
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const maxButtonRef = React.useRef<HTMLButtonElement | null>(null);

  // default value: kira-kira sama dengan pl-28 (7rem) dan pr-20 (5rem)
  const [padding, setPadding] = React.useState<{ left: number; right: number }>(
    { left: 112, right: 80 }
  );

  React.useEffect(() => {
    const updatePadding = () => {
      let left = 112; // fallback kalau ref belum kepasang
      let right = 80;

      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        left = rect.width + 12; // + sedikit space biar nggak nempel
      }

      if (maxButtonRef.current) {
        const rect = maxButtonRef.current.getBoundingClientRect();
        right = rect.width + 12;
      }

      setPadding({ left, right });
    };

    // Gunakan requestAnimationFrame untuk memastikan DOM sudah selesai render
    requestAnimationFrame(() => {
      updatePadding();
    });

    const observer = new ResizeObserver(() => {
      updatePadding();
    });

    if (triggerRef.current) observer.observe(triggerRef.current);
    if (maxButtonRef.current) observer.observe(maxButtonRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  console.log("padding", padding);

  return (
    <div className="w-full space-y-2 mt-3.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>Collateral Asset</Label>
        <div>
          <span className="text-xs text-muted-foreground">
            Available <span className="font-medium text-white">100</span> USDT
          </span>
          <CentuariTooltip message="Select the asset you want to use as collateral.">
            <InfoIcon size={12} className="ml-1 inline-block" />
          </CentuariTooltip>
        </div>
      </div>
      <div className="relative">
        <Input
          id={id}
          type="text"
          placeholder="Amount"
          className="peer h-9 text-base bg-[#1a1d24] border-[#2a2e38] focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-search-cancel-button]:appearance-none"
          // padding kiri & kanan dinamis
          style={{
            paddingLeft: padding.left === 12 ? 112 : padding.left,
            paddingRight: padding.right === 12 ? 112 : padding.right,
          }}
        />
        <div className="absolute inset-y-0 left-1 flex items-center">
          <Select value={selectedToken} onValueChange={setSelectedToken}>
            <SelectTrigger
              ref={triggerRef}
              className="!h-7 w-auto border-0 bg-transparent px-2 py-1 focus:ring-0 focus:ring-offset-0 gap-1"
            >
              <SelectValue placeholder="Select Token" />
            </SelectTrigger>
            <SelectContent className="bg-white/5 backdrop-blur-[140px]">
              <SelectGroup>
                <SelectItem value="usdt">
                  <Image
                    src={"/tokens/usdt-icon.webp"}
                    width={16}
                    height={16}
                    alt="USDT"
                  />
                  USDT
                </SelectItem>
                <SelectItem value="usdc">
                  <Image
                    src={"/tokens/usdc-icon.webp"}
                    width={16}
                    height={16}
                    alt="USDC"
                  />
                  USDC
                </SelectItem>
                <SelectItem value="btc">
                  <Image
                    src={"/tokens/btc-icon.webp"}
                    width={16}
                    height={16}
                    alt="BTC"
                  />
                  BTC
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="absolute inset-y-0 right-3 flex items-center">
          <Button
            ref={maxButtonRef}
            variant={"link"}
            className="px-0"
            type="button"
          >
            Max
          </Button>
        </div>
      </div>
    </div>
  );
}
