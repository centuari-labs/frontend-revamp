import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
	return (
		<div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
			<h1 className="bg-linear-to-r from-primary-blue-base via-white to-primary-blue-base bg-clip-text text-8xl font-bold tracking-tight text-transparent md:text-9xl">
				404
			</h1>
			<h2 className="mt-4 text-2xl font-semibold text-white">
				Page Not Found
			</h2>
			<p className="mt-2 max-w-md text-sm text-muted-foreground">
				The page you&apos;re looking for doesn&apos;t exist or has been
				moved.
			</p>
			<Button asChild variant="primary" className="mt-8">
				<Link href="/">Go Home</Link>
			</Button>
		</div>
	);
}
