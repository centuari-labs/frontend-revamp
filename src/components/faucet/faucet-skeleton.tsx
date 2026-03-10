import { Skeleton } from "@/components/ui/skeleton";

function FaucetTokenCardSkeleton() {
  return (
    <div className="relative w-full flex items-stretch rounded-xl border border-white/10 bg-primary-blue-100/5">
      {/* Left section */}
      <div className="flex flex-col justify-center items-center gap-3 p-7 min-w-0">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-16 mx-auto" />
          <Skeleton className="h-3 w-20 mx-auto" />
        </div>
      </div>

      {/* Divider */}
      <div className="w-px bg-white/10" />

      {/* Right section */}
      <div className="flex flex-col justify-center px-4 py-4 min-w-[120px]">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-6 w-24 mt-2" />
      </div>
    </div>
  );
}

export function FaucetPageSkeleton() {
  return (
    <>
      {/* Header */}
      <div className="relative flex flex-col justify-between items-center md:items-start gap-4 bg-primary-blue-100/5 overflow-hidden px-6 md:px-12 py-8 rounded-xl border border-white/10">
        <div className="text-center md:text-left w-full space-y-3">
          <Skeleton className="h-9 w-48 mx-auto md:mx-0" />
          <Skeleton className="h-4 w-full max-w-xl mx-auto md:mx-0" />
          <Skeleton className="h-4 w-80 mx-auto md:mx-0" />
        </div>
      </div>

      {/* Category tabs */}
      <div className="mt-6">
        <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-lg w-full md:w-fit">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-md" />
          ))}
        </div>
      </div>

      {/* Token grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <FaucetTokenCardSkeleton key={i} />
        ))}
      </div>
    </>
  );
}
