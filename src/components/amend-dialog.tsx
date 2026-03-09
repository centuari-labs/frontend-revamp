"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { Pencil } from "lucide-react";
import { LendForm } from "./market/lend-form";
import { BorrowForm } from "./market/borrow-form";
import { OrderBookCard } from "./market/order-book";
import type { Position } from "@/types/positions";

interface TokenOption {
  logo: string;
  value: string;
  label: string;
}

interface AmendDialogProps {
  position: Position;
  tokenList: TokenOption[];
  onUpdate?: (updatedPosition: Position) => void;
  trigger?: React.ReactNode;
}

const defaultTokenList: TokenOption[] = [
  { logo: "/tokens/btc-icon.svg", value: "btc", label: "Bitcoin" },
  { logo: "/tokens/xaut-icon.png", value: "xaut", label: "Tether Gold" },
  { logo: "/tokens/eth-icon.svg", value: "eth", label: "Ethereum" },
  { logo: "/tokens/centuari-arbitrum.png", value: "arb", label: "Arbitrum" },
  { logo: "/tokens/usdc-icon.svg", value: "usdc", label: "USDC" },
  { logo: "/tokens/usdt-icon.svg", value: "usdt", label: "USDT" },
  { logo: "/tokens/centuari-dai.png", value: "dai", label: "DAI" },
  { logo: "/tokens/centuari-centuari.png", value: "centuari", label: "Centuari" },
];

export function AmendDialog({ 
  position, 
  tokenList = defaultTokenList,
  onUpdate,
  trigger 
}: AmendDialogProps) {
  const [open, setOpen] = useState(false);

  const handleUpdate = (updatedPosition: Position) => {
    if (onUpdate) {
      onUpdate(updatedPosition);
    }
    setOpen(false);
  };

  const selectedToken = tokenList.find(t => t.value === position.tokenValue) || tokenList[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="secondary" size="icon">
            <Pencil size={14} />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="flex flex-col gap-0 sm:max-w-4xl data-[state=open]:!zoom-in-0 data-[state=open]:duration-600 p-6">
        <DialogHeader className="contents space-y-0 text-left">
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
            <div className="absolute w-[568px] h-[450px] -top-72 left-0 bg-primary-blue-base/50 blur-[264px] opacity-100 transition-opacity duration-500" />
            <div className="absolute w-[150px] h-[216px] -top-60 left-1/3 bg-white blur-3xl opacity-100 transition-opacity duration-500" />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">Amend Order</h1>
            <span className="text-sm text-muted-foreground">
              Want to make a quick change? You can update your APR or amount
              here — no need to cancel.
            </span>
          </div>
        </DialogHeader>
        <div className="flex gap-2 mt-5">
          <div className="relative flex-1 hidden md:block">
            <div className="absolute inset-x-0 h-px w-2/3 mx-auto top-0 shadow-2xl bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            <OrderBookCard height="500px" />
          </div>
          <div className="relative text-center text-white/60 flex-1 bg-white/5 px-2.5 rounded-md">
            <div className="absolute inset-x-0 h-px w-2/3 mx-auto top-0 shadow-2xl bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            {position.type === "lend" ? (
              <LendForm
                tokenList={tokenList}
                selectedToken={selectedToken}
                editingPosition={position}
                onUpdate={handleUpdate}
              />
            ) : (
              <BorrowForm
                tokenList={tokenList}
                selectedToken={selectedToken}
                editingPosition={position}
                onUpdate={handleUpdate}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
