import { Skeleton } from "@/components/ui/skeleton";
import { CentuariGlassLayers } from "@/components/centuari-glass-surface";

function FaucetTokenCardSkeleton() {
  return (
    <div className="group/glass relative w-full flex items-stretch rounded-xl bg-transparent border-0 overflow-hidden isolate">
      <CentuariGlassLayers intensity="soft" />

      {/* Left section */}
      <div className="relative z-20 flex flex-col justify-center items-center gap-3 p-7 min-w-0">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-16 mx-auto" />
          <Skeleton className="h-3 w-20 mx-auto" />
        </div>
      </div>

      {/* Divider */}
      <div className="relative z-20 w-px bg-white/10" />

      {/* Right section */}
      <div className="relative z-20 flex flex-col justify-center px-4 py-4 min-w-[120px]">
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
      <div className="group/glass relative flex flex-col justify-between items-center md:items-start gap-4 bg-transparent border-0 overflow-hidden isolate px-6 md:px-12 py-8 rounded-xl">
        <CentuariGlassLayers intensity="soft" />
        <div className="relative z-20 text-center md:text-left w-full space-y-3">
          <Skeleton className="h-9 w-48 mx-auto md:mx-0" />
          <Skeleton className="h-4 w-full max-w-xl mx-auto md:mx-0" />
          <Skeleton className="h-4 w-80 mx-auto md:mx-0" />
        </div>
      </div>

      {/* Category tabs */}
      <div className="mt-6">
        <div className="group/glass relative flex items-center gap-1.5 p-1 bg-transparent border-0 rounded-lg overflow-hidden isolate w-full md:w-fit">
          <CentuariGlassLayers intensity="soft" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="relative z-20 h-9 w-24 rounded-md" />
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
