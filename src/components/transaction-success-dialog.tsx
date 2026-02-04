"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CentuariButton } from "@/components/centuari-button";
import Image from "next/image";

export interface TransactionSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export function TransactionSuccessDialog({
  open,
  onOpenChange,
  title,
  description,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel = "Done",
  onSecondaryAction,
}: TransactionSuccessDialogProps) {
  const handlePrimary = () => {
    onPrimaryAction();
    onOpenChange(false);
  };

  const handleSecondary = () => {
    onSecondaryAction?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[min(600px,80vh)] flex-col gap-0 p-0 sm:max-w-md data-[state=open]:!zoom-in-0 data-[state=open]:duration-600"
      >
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
            <DialogTitle className="text-2xl font-semibold text-center">
              {title}
            </DialogTitle>
            <DialogDescription className="text-center">
              {description}
            </DialogDescription>
          </div>
        </DialogHeader>
        <DialogFooter className="flex flex-row items-center justify-center gap-2 px-6 pb-6">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-lg border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={handleSecondary}
          >
            {secondaryActionLabel}
          </Button>
          <CentuariButton
            type="button"
            variant="primary"
            className="flex-1"
            onClick={handlePrimary}
          >
            {primaryActionLabel}
          </CentuariButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
