"use client";

import { Loader2 } from "lucide-react";

export default function Loading() {
	return (
		<div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
			<div className="flex flex-col items-center gap-4">
				<div className="relative">
					<div className="absolute inset-0 bg-primary-blue-base/20 blur-xl rounded-full animate-spin" />
					<img
						src="/centuari-logo.png"
						alt="Loading..."
						className="w-16 h-16 relative z-10 animate-pulse"
					/>
				</div>
				<div className="flex items-center gap-2 text-muted-foreground">
					<Loader2 className="w-4 h-4 animate-spin" />
					<span className="text-sm font-medium">Loading Centuari...</span>
				</div>
			</div>
		</div>
	);
}
