"use client";

import Image from "next/image";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CentuariButton } from "@/components/centuari-button";
import { CentuariTypography } from "@/components/centuari-typography";

export type UseAllAssetsAsCollateralDialogAsset = {
  logo: string;
  label: string;
};

interface UseAllAssetsAsCollateralDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assets: UseAllAssetsAsCollateralDialogAsset[];
  onConfirm: () => void;
  /** Tampilkan tombol close (X) di pojok kanan atas. Default: true */
  showCloseButton?: boolean;
}

export function UseAllAssetsAsCollateralDialog({
  open,
  onOpenChange,
  assets,
  onConfirm,
  showCloseButton = false,
}: UseAllAssetsAsCollateralDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const displayAssets = assets.slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={showCloseButton}
        className="flex max-h-[min(600px,80vh)] flex-col gap-0 p-0 sm:max-w-md data-[state=open]:!zoom-in-0 data-[state=open]:duration-600"
      >
        <DialogHeader className="contents space-y-0 text-left">
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
            <div className="absolute w-[568px] h-[450px] -top-72 left-0 bg-primary-blue-base/50 blur-[264px] opacity-100 transition-opacity duration-500" />
            <div className="absolute w-[150px] h-[216px] -top-60 left-1/3 bg-white blur-3xl opacity-100 transition-opacity duration-500" />
          </div>
          <div className="mt-6 px-6 flex items-center justify-center flex-col gap-4 pb-6 z-50">
            <div className="flex items-center justify-center -space-x-3">
              {displayAssets.map((asset, index) => (
                <div
                  key={`${asset.label}-${index}`}
                  className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center overflow-hidden shrink-0"
                >
                  <Image
                    src={asset.logo}
                    alt={asset.label}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                    unoptimized
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/tokens/eth-icon.webp";
                    }}
                  />
                </div>
              ))}
            </div>
            <CentuariTypography className="text-2xl font-semibold text-center">
              Use All Assets as Collateral?
            </CentuariTypography>
            <CentuariTypography className="text-center text-muted-foreground">
              All eligible assets in your wallet will be <br/> enabled as collateral.
            </CentuariTypography>
          </div>
        </DialogHeader>
        <DialogFooter className="flex-row gap-2 items-center px-6 py-4">
          <DialogClose asChild>
            <CentuariButton variant="secondary" className="flex-1">Cancel</CentuariButton>
          </DialogClose>
          <Button variant="primary" onClick={handleConfirm} className="flex-1">
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
