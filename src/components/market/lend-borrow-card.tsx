"use client";

import { LendForm } from "@/components/market/lend-form";
import { BorrowForm } from "@/components/market/borrow-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TokenOption } from "@/types";
import { CentuariGlassLayers } from "@/components/centuari-glass-surface";

interface LendBorrowCardProps {
  tokenList: TokenOption[];
  selectedToken?: TokenOption;
  maturityOptions?: number[];
  assetId?: string;
}

export function LendBorrowCard({
  tokenList,
  selectedToken,
  maturityOptions,
  assetId,
}: LendBorrowCardProps) {
  return (
    <div className="col-span-1 hidden md:block">
      <div className="group/glass relative bg-transparent border-0 rounded-xl h-auto md:h-[500px] md:flex md:flex-col overflow-hidden isolate">
        <CentuariGlassLayers intensity="soft" />
        <Tabs
          defaultValue="lend"
          className="rounded-t-md gap-0 md:flex md:flex-col md:flex-1 md:min-h-0"
        >
          <TabsList className="bg-transparent rounded-none border-b-[1px] border-white/10 p-0 w-full justify-start md:shrink-0">
            <TabsTrigger
              value="lend"
              className="bg-transparent data-[state=active]:!bg-transparent data-[state=active]:border-primary dark:data-[state=active]:border-primary data-[state=active]:text-white text-white/40 dark:text-white/40 hover:text-white dark:hover:text-white hover:border-white/30 h-full rounded-none border-0 border-b-2 border-transparent data-[state=active]:shadow-none px-4 sm:px-6 md:px-8 py-3 md:py-4 font-medium text-sm md:text-base"
            >
              Lend
            </TabsTrigger>
            <TabsTrigger
              value="borrow"
              className="bg-transparent data-[state=active]:!bg-transparent data-[state=active]:border-primary dark:data-[state=active]:border-primary data-[state=active]:text-white text-white/40 dark:text-white/40 hover:text-white dark:hover:text-white hover:border-white/30 h-full rounded-none border-0 border-b-2 border-transparent data-[state=active]:shadow-none px-4 sm:px-6 md:px-8 py-3 md:py-4 font-medium text-sm md:text-base"
            >
              Borrow
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lend" className="md:flex-1 md:min-h-0">
            <LendForm
              tokenList={tokenList}
              selectedToken={selectedToken}
              maturityOptions={maturityOptions}
              assetId={assetId}
            />
          </TabsContent>

          <TabsContent value="borrow" className="md:flex-1 md:min-h-0">
            <BorrowForm
              tokenList={tokenList}
              selectedToken={selectedToken}
              maturityOptions={maturityOptions}
              assetId={assetId}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
