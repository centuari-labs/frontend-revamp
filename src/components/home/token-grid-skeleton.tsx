import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

function TokenCardSkeleton() {
  return (
    <Card className="w-full p-3 md:p-4 gap-2 bg-white/5">
      <CardHeader className="gap-0 pb-0">
        <div className="flex flex-col items-center gap-3 md:gap-4">
          <Skeleton className="w-12 h-12 md:w-[68px] md:h-[68px] rounded-full" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <div className="bg-white/5 p-3 md:p-4 rounded-xl border border-white/5 flex flex-col gap-3 md:gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`flex items-center justify-between ${i < 3 ? "border-b border-dashed pb-2" : ""}`}
            >
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col px-0">
        <div className="flex gap-2 w-full">
          <Skeleton className="h-10 flex-1 rounded-md" />
          <Skeleton className="h-10 flex-1 rounded-md" />
        </div>
        <Skeleton className="h-4 w-40 mt-3 md:mt-4 mx-auto" />
      </CardFooter>
    </Card>
  );
}

export function TokenGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-8">
      {Array.from({ length: count }).map((_, i) => (
        <TokenCardSkeleton key={i} />
      ))}
    </div>
  );
}
