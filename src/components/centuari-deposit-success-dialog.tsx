"use client";

import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { CentuariTypography } from "./centuari-typography";

interface CentuariDepositSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token?: string;
  amount?: string;
}

export function CentuariDepositSuccessDialog({
  open,
  onOpenChange,
  token,
  amount,
}: CentuariDepositSuccessDialogProps) {
  // Auto-close after 3 seconds
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        onOpenChange(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [open, onOpenChange]);

  const tokenName = token?.toUpperCase() || "Token";
  const displayAmount = amount || "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(600px,80vh)] flex-col gap-0 p-0 sm:max-w-md data-[state=open]:!zoom-in-0 data-[state=open]:duration-600">
        <DialogHeader className="contents space-y-0 text-left">
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
            <div className="absolute w-[568px] h-[450px] -top-72 left-0 bg-primary-blue-base/50 blur-[264px] opacity-100 transition-opacity duration-500" />
            <div className="absolute w-[150px] h-[216px] -top-60 left-1/3 bg-white blur-3xl opacity-100 transition-opacity duration-500" />
          </div>
          <div className="mt-6 px-6 flex items-center justify-center flex-col gap-4 pb-6">
            <Image
              src="/assets/tx-success.png"
              alt="Success"
              width={116}
              height={124}
            />
            <CentuariTypography className="text-2xl font-semibold">
              Deposit Successful!
            </CentuariTypography>
            <CentuariTypography className="text-center text-muted-foreground">
              {displayAmount ? (
                <>
                  You have successfully deposited {displayAmount} {tokenName} to
                  your vault.
                </>
              ) : (
                <>Your {tokenName} deposit has been completed successfully.</>
              )}
            </CentuariTypography>
            <div className="flex items-center gap-2 text-muted-foreground mt-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Closing...</span>
            </div>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
