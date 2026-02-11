"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import { CentuariTypography } from "@/components/centuari-typography";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

export interface TxSuccessAutoCloseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  autoCloseMs?: number;
}

export function TxSuccessAutoCloseDialog({
  open,
  onOpenChange,
  title,
  description,
  autoCloseMs = 3000,
}: TxSuccessAutoCloseDialogProps) {
  useEffect(() => {
    if (open && autoCloseMs > 0) {
      const timer = setTimeout(() => {
        onOpenChange(false);
      }, autoCloseMs);

      return () => clearTimeout(timer);
    }
  }, [open, autoCloseMs, onOpenChange]);

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
              {title}
            </CentuariTypography>
            <CentuariTypography className="text-center text-muted-foreground">
              {description}
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
