import { Skeleton } from "@/components/ui/skeleton";

export function TransactionHistorySkeleton() {
  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between py-6 gap-4">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-10 w-full md:w-40 rounded-md" />
      </div>

      {/* Content */}
      <div className="bg-white/5 rounded-lg p-4 md:p-6">
        {/* Tabs + Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28 rounded-md" />
            <Skeleton className="h-9 w-40 rounded-md" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-9 w-48 rounded-md" />
            <Skeleton className="h-9 w-32 rounded-md" />
            <Skeleton className="h-9 w-32 rounded-md" />
          </div>
        </div>

        {/* Table Header */}
        <div className="bg-white/5 rounded-t-md px-4 py-3">
          <div className="grid grid-cols-7 gap-4">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>

        {/* Table Rows */}
        <div className="space-y-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="grid grid-cols-7 gap-4 items-center px-4 py-3 border-b border-white/5 last:border-b-0">
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-6 w-3/5 rounded-full" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                <Skeleton className="h-3 w-3/5" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                <Skeleton className="h-3 w-3/5" />
              </div>
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-3/5" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
          <Skeleton className="h-3 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>
      </div>
    </>
  );
}
