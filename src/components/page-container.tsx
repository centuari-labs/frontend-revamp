"use client";

import { cn } from "@/lib/utils";

export interface PageContainerProps {
	children: React.ReactNode;
	className?: string;
	innerClassName?: string;
	maxWidth?: "default" | "wide" | "full";
}

const maxWidthClasses = {
	default: "w-full max-w-6xl xl:max-w-[88rem] 2xl:max-w-[140rem] mx-auto px-4",
	wide: "w-full max-w-full sm:max-w-6xl xl:max-w-[88rem] 2xl:max-w-[140rem] mx-auto px-2 sm:px-4",
	full: "w-full max-w-full mx-auto px-4",
};

export function PageContainer({
	children,
	className,
	innerClassName,
	maxWidth = "default",
}: PageContainerProps) {
	return (
		<div className={cn("relative w-full mt-14 2xl:min-h-0", className)}>
			<div
				className={cn(
					maxWidthClasses[maxWidth],
					"2xl:min-h-[calc(100vh-6rem)]",
					innerClassName,
				)}
			>
				{children}
			</div>
		</div>
	);
}
