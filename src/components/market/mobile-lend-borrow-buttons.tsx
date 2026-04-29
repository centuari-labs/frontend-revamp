"use client";

import { useState } from "react";
import { CentuariButton } from "@/components/centuari-button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { LendForm } from "@/components/market/lend-form";
import { BorrowForm } from "@/components/market/borrow-form";
import type { TokenOption } from "@/types";

interface MobileLendBorrowButtonsProps {
  tokenList: TokenOption[];
  selectedToken?: TokenOption;
  maturityOptions?: number[];
  assetId?: string;
}

export function MobileLendBorrowButtons({
  tokenList,
  selectedToken,
  maturityOptions,
  assetId,
}: MobileLendBorrowButtonsProps) {
  const [isLendOpen, setIsLendOpen] = useState(false);
  const [isBorrowOpen, setIsBorrowOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 md:hidden z-50 bg-background/10 backdrop-blur-sm border-t border-white/10 p-3 pb-safe">
        <div className="flex gap-2 max-w-md mx-auto mb-3">
          <CentuariButton
            variant="secondary"
            className="flex-1 text-base font-medium"
            onClick={() => setIsBorrowOpen(true)}
          >
            Borrow
          </CentuariButton>
          <CentuariButton
            variant="primary"
            className="flex-1 text-base font-medium"
            onClick={() => setIsLendOpen(true)}
          >
            Lend
          </CentuariButton>
        </div>
      </div>

      <Drawer open={isLendOpen} onOpenChange={setIsLendOpen}>
        <DrawerContent
          className="max-h-[90vh] !bg-white/[0.04] backdrop-blur-2xl border-t border-white/15"
          style={{
            boxShadow: [
              "inset 0 1px 0 rgba(255,255,255,0.25)",
              "inset 0 0 120px rgba(255,255,255,0.05)",
              "0 -20px 50px -10px rgba(0,0,0,0.6)",
            ].join(", "),
          }}
        >
          <DrawerHeader className="border-b border-white/10">
            <DrawerTitle className="text-xl">Lend</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto">
            <LendForm
              tokenList={tokenList}
              selectedToken={selectedToken}
              maturityOptions={maturityOptions}
              assetId={assetId}
            />
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={isBorrowOpen} onOpenChange={setIsBorrowOpen}>
        <DrawerContent
          className="max-h-[90vh] !bg-white/[0.04] backdrop-blur-2xl border-t border-white/15"
          style={{
            boxShadow: [
              "inset 0 1px 0 rgba(255,255,255,0.25)",
              "inset 0 0 120px rgba(255,255,255,0.05)",
              "0 -20px 50px -10px rgba(0,0,0,0.6)",
            ].join(", "),
          }}
        >
          <DrawerHeader className="border-b border-white/10">
            <DrawerTitle className="text-xl">Borrow</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto">
            <BorrowForm
              tokenList={tokenList}
              selectedToken={selectedToken}
              maturityOptions={maturityOptions}
              assetId={assetId}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
