"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
			<h2 className="text-2xl font-semibold text-foreground">
				Something went wrong
			</h2>
			<p className="text-sm text-muted-foreground">{error.message}</p>
			<Button onClick={reset} variant="outline">
				Try again
			</Button>
		</div>
	);
}
