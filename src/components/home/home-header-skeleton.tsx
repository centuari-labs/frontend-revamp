import { Skeleton } from "@/components/ui/skeleton";

export function HomeHeaderSkeleton() {
  return (
    <div className="relative flex flex-col justify-between items-center md:items-start gap-6 bg-primary-blue-100/5 overflow-hidden px-6 md:px-12 py-8 rounded-xl border-0 md:border">
      {/* Header Text */}
      <div className="text-center md:text-left w-full space-y-2">
        <Skeleton className="h-9 w-60 mx-auto md:mx-0" />
        <Skeleton className="h-9 w-80 mx-auto md:mx-0" />
      </div>

      {/* Balance Cards */}
      <div className="w-full md:w-auto flex flex-col sm:flex-row gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
