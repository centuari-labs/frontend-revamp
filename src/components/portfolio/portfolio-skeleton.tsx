import { Skeleton } from "@/components/ui/skeleton";

function PortfolioCardSkeleton() {
  return (
    <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white/5 border rounded-lg w-full px-6 md:px-8 py-8 lg:py-6 overflow-hidden">
      {/* Left: Title + Stats */}
      <div>
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:flex-row items-start md:items-center gap-6 md:gap-8 mt-6 md:mt-9 py-3.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-36" />
            </div>
          ))}
        </div>
      </div>

      {/* Right: Legend + Chart */}
      <div className="flex flex-col sm:flex-row items-center gap-8 lg:gap-4 w-full lg:w-auto">
        <div className="w-full sm:w-70 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Skeleton className="w-3 h-3 rounded-full" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-3 w-10" />
            </div>
          ))}
          <Skeleton className="h-9 w-full rounded-md mt-4" />
        </div>
        <div className="w-full sm:w-55 flex justify-center">
          <Skeleton className="h-44 w-44 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function LendBorrowSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between bg-white/5 border rounded-xl overflow-hidden p-6 lg:p-0 lg:pl-8">
      <div>
        <Skeleton className="h-5 w-44" />
        <div className="mt-8 lg:mt-12 flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-10">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-7 w-36" />
            </div>
          ))}
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-28 rounded-full" />
          </div>
        </div>
      </div>
      <div className="w-full lg:w-175 mt-6 lg:mt-0">
        <Skeleton className="h-48 w-full rounded-md" />
      </div>
    </div>
  );
}

function TableSkeleton({ title }: { title: string }) {
  return (
    <div className="w-full overflow-hidden flex flex-col h-full rounded-xl bg-white/5 border">
      <div className="py-3.5 px-6">
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="bg-white/5 px-6 py-3">
        <div className="flex gap-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-3 w-20" />
          ))}
        </div>
      </div>
      <div className="px-6 py-4 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-8 items-center">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="mt-auto flex items-center justify-between py-4 px-6 border-t border-white/5">
        <Skeleton className="h-3 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function PortfolioPageSkeleton() {
  return (
    <>
      <div className="mt-10 md:mt-20">
        <PortfolioCardSkeleton />
      </div>

      <div className="mt-3">
        <LendBorrowSkeleton />
      </div>

      <div className="flex flex-col lg:flex-row items-stretch gap-3 mt-3">
        <div className="flex-1 min-h-[400px] min-w-0">
          <TableSkeleton title="My Assets" />
        </div>
        <div className="flex-1 min-h-[400px] min-w-0">
          <TableSkeleton title="All My Positions" />
        </div>
      </div>
    </>
  );
}
