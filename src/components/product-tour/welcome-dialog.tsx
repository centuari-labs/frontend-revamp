"use client";

import { CentuariButton } from "@/components/centuari-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import Image from "next/image";

interface WelcomeDialogProps {
  isOpen: boolean;
  onStartTour: () => void;
  onSkip: () => void;
}

export function WelcomeDialog({
  isOpen,
  onStartTour,
  onSkip,
}: WelcomeDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onSkip()}>
      <DialogContent className="sm:max-w-[425px] max-h-[min(600px,80vh)]">
        <DialogHeader className="contents space-y-0 text-left">
          <Image
            src="/centuari-logo.png"
            alt="Centuari"
            width={40}
            height={40}
            priority
          />
          <DialogTitle className="text-2xl font-semibold">
            Welcome to Centuari
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm mt-2">
            You can lend or borrow using the assets you already own, with rates
            and terms set from the start.
          </DialogDescription>
          <ul className="ps-3 my-4 space-y-1 list-disc list-inside text-white text-sm">
            <li>Earn fixed returns by lending your assets</li>
            <li>Borrow with clear, predictable costs</li>
            <li>Choose your rate and duration upfront</li>
          </ul>
          <p className="text-muted-foreground text-sm">
            Everything is designed to help you plan with confidence.
          </p>
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
            <div className="absolute w-[568px] h-[450px] -top-72 left-0 bg-primary-blue-base/50 blur-[264px] opacity-100 transition-opacity duration-500" />
            <div className="absolute w-[150px] h-[216px] -top-60 left-1/3 bg-white blur-3xl opacity-100 transition-opacity duration-500" />
          </div>
          <div className="mt-6 px-6 flex items-center justify-center flex-col gap-4"></div>
        </DialogHeader>
        <DialogFooter className="flex-row justify-end gap-2">
          <CentuariButton variant="secondary" onClick={onSkip} className="flex-1">
            I'll do it by myself
          </CentuariButton>
          <CentuariButton onClick={onStartTour} variant="primary" className="flex-1">
            Start Tour
          </CentuariButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}