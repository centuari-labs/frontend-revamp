"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { LendForm } from "@/components/market/lend-form";
import { BorrowForm } from "@/components/market/borrow-form";

interface TokenOption {
  logo: string;
  value: string;
  label: string;
}

interface MobileLendBorrowButtonsProps {
  tokenList: TokenOption[];
}

export function MobileLendBorrowButtons({
  tokenList,
}: MobileLendBorrowButtonsProps) {
  const [isLendOpen, setIsLendOpen] = useState(false);
  const [isBorrowOpen, setIsBorrowOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 md:hidden z-50 bg-background/10 backdrop-blur-sm border-t border-white/10 p-3 pb-safe">
        <div className="flex gap-2 max-w-md mx-auto mb-3">
          <Button
            variant="secondary"
            className="flex-1 text-base font-medium"
            onClick={() => setIsBorrowOpen(true)}
          >
            Borrow
          </Button>
          <Button
            variant="primary"
            className="flex-1 text-base font-medium"
            onClick={() => setIsLendOpen(true)}
          >
            Lend
          </Button>
        </div>
      </div>

      <Drawer open={isLendOpen} onOpenChange={setIsLendOpen}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="border-b border-white/10">
            <DrawerTitle className="text-xl">Lend</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto">
            <LendForm tokenList={tokenList} />
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={isBorrowOpen} onOpenChange={setIsBorrowOpen}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="border-b border-white/10">
            <DrawerTitle className="text-xl">Borrow</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto">
            <BorrowForm />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
