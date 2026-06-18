import { Skeleton } from "@/components/ui/skeleton";

function MarketHeaderSkeleton() {
	return (
		<>
			{/* Mobile */}
			<div className="flex md:hidden items-center justify-between w-full py-4">
				<Skeleton className="h-10 w-10 rounded-lg" />
				<div className="flex items-center gap-2">
					<Skeleton className="h-6 w-6 rounded-full" />
					<Skeleton className="h-5 w-16" />
				</div>
				<div className="w-10" />
			</div>

			{/* Desktop */}
			<div className="hidden md:flex justify-between items-center w-full">
				<div className="flex items-center gap-4">
					<Skeleton className="h-5 w-5" />
					<Skeleton className="h-9 w-9 rounded-full" />
					<Skeleton className="h-6 w-20" />
				</div>
				<div className="flex gap-12 py-3.5">
					{[1, 2].map((i) => (
						<div key={i} className="flex items-center gap-3">
							<Skeleton className="h-6 w-6 rounded-full" />
							<div className="space-y-2">
								<Skeleton className="h-3 w-24" />
								<Skeleton className="h-5 w-32" />
							</div>
						</div>
					))}
				</div>
			</div>
		</>
	);
}

function APRHistoryCardSkeleton() {
	return (
		<div className="md:col-span-2 lg:col-span-2 bg-white/5 rounded-md overflow-hidden">
			<div className="hidden md:flex px-6 lg:px-8 py-4 items-center justify-between w-full">
				<Skeleton className="h-5 w-24" />
				<div className="flex gap-2">
					{Array.from({ length: 6 }).map((_, i) => (
						<Skeleton key={i} className="h-8 w-10 rounded-md" />
					))}
				</div>
			</div>
			<div className="px-6 pb-6">
				<Skeleton className="h-[300px] w-full rounded-md" />
			</div>
		</div>
	);
}

function OrderBookCardSkeleton() {
	return (
		<div className="col-span-1 bg-white/5 rounded-md p-4 h-[500px]">
			<Skeleton className="h-5 w-24 mb-4" />
			<div className="space-y-2">
				{Array.from({ length: 12 }).map((_, i) => (
					<div key={i} className="flex justify-between">
						<Skeleton className="h-4 w-20" />
						<Skeleton className="h-4 w-16" />
						<Skeleton className="h-4 w-20" />
					</div>
				))}
			</div>
		</div>
	);
}

function LendBorrowCardSkeleton() {
	return (
		<div className="col-span-1 hidden md:block">
			<div className="bg-white/5 rounded-md h-[500px] flex flex-col">
				<div className="flex border-b border-white/10 px-4">
					<Skeleton className="h-12 w-20 mr-4" />
					<Skeleton className="h-12 w-20" />
				</div>
				<div className="p-4 space-y-4 flex-1">
					<Skeleton className="h-4 w-32" />
					<Skeleton className="h-12 w-full rounded-md" />
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-12 w-full rounded-md" />
					<Skeleton className="h-4 w-40" />
					<Skeleton className="h-12 w-full rounded-md" />
					<div className="mt-auto pt-4">
						<Skeleton className="h-11 w-full rounded-md" />
					</div>
				</div>
			</div>
		</div>
	);
}

function PositionSectionSkeleton() {
	return (
		<div className="mt-2 bg-white/5 rounded-md p-4">
			<div className="hidden md:block p-3">
				<div className="mb-4 flex items-center justify-between">
					<Skeleton className="h-5 w-28" />
					<div className="flex items-center gap-3">
						<Skeleton className="h-9 w-60 rounded-md" />
						<Skeleton className="h-9 w-72 rounded-md" />
					</div>
				</div>
				<div className="space-y-3">
					<div className="flex gap-4 bg-white/5 rounded-md p-3">
						{Array.from({ length: 7 }).map((_, i) => (
							<Skeleton key={i} className="h-4 flex-1" />
						))}
					</div>
					{Array.from({ length: 3 }).map((_, i) => (
						<div key={i} className="flex gap-4 p-3">
							{Array.from({ length: 7 }).map((_, j) => (
								<Skeleton key={j} className="h-4 flex-1" />
							))}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

export function MarketPageSkeleton() {
	return (
		<>
			<MarketHeaderSkeleton />

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mt-4">
				<APRHistoryCardSkeleton />
				<OrderBookCardSkeleton />
				<LendBorrowCardSkeleton />
			</div>

			<PositionSectionSkeleton />
		</>
	);
}
