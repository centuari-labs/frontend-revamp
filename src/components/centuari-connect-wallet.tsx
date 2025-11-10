"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CentuariButton } from "./centuari-button";
import { CentuariTypography } from "./centuari-typography";
import { CentuariInput } from "./centuari-input";
import { Search, X } from "lucide-react";
import Image from "next/image";
import { ScrollArea } from "./ui/scroll-area";

export function CentuariConnectWallet() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <CentuariButton variant="primary" className="flex-1">
          Connect Wallet
        </CentuariButton>
      </DialogTrigger>
      <DialogContent className="flex max-h-[min(600px,80vh)] p-6 flex-col gap-0 sm:max-w-md data-[state=open]:!zoom-in-0 data-[state=open]:duration-600">
        <DialogHeader className="contents space-y-0 text-left">
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
            <div className="absolute w-[568px] h-[450px] -top-72 left-0 bg-primary-blue-base/50 blur-[264px] opacity-100 transition-opacity duration-500" />
            <div className="absolute w-[150px] h-[216px] -top-60 left-1/3 bg-white blur-3xl opacity-100 transition-opacity duration-500" />
          </div>
          <div className="mt-6 flex flex-col gap-4 mb-8">
            <CentuariTypography className="text-3xl font-semibold">
              Connect Centuari With Your Wallet
            </CentuariTypography>
          </div>
          <CentuariInput
            id="search"
            size="small"
            placeholder="Search something"
            leftIcon={<Search size={16} />}
            rightIcon={<X size={16} />}
            disabled={true}
          />
          <CentuariTypography className="text-sm text-muted-foreground mt-4">
            Available Wallets
          </CentuariTypography>
          <ScrollArea className="bg-white/5 h-72 border rounded-md border-white/5 mt-2">
            <div className="flex flex-col py-1.5 gap-2">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="px-3 py-1.5 hover:bg-white/10 cursor-pointer flex items-center gap-4"
                >
                  <>
                    <div className="bg-white rounded-lg h-8 w-8 flex items-center justify-center">
                      <Image
                        src={"/assets/metamask.png"}
                        alt="MetaMask"
                        width={24}
                        height={24}
                      />
                    </div>
                    <CentuariTypography className="text-white">
                      MetaMask
                    </CentuariTypography>
                  </>
                </div>
              ))}
            </div>
          </ScrollArea>
          <CentuariTypography className="text-sm text-center text-muted-foreground mt-4">
            By connecting your wallet and using Centuari, you agree to our Terms
            of <span className="text-white">Service & Privacy Policy.</span>
          </CentuariTypography>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
