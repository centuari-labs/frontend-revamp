import type * as React from "react";
import type { VariantProps } from "class-variance-authority";
import { Button, type buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";

export function CentuariButton({
	className,
	variant = "primary",
	children,
	size,
	...props
}: React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants> & {
		children: React.ReactNode;
	}) {
	return (
		<Button
			variant={variant}
			size={size}
			className={cn("relative", className)}
			{...props}
		>
			{(variant === "primary-dark" || variant === "primary") && (
				<div className="absolute inset-x-0 h-px w-1/2 mx-auto top-0 shadow-2xl bg-gradient-to-r from-transparent via-white/50 to-transparent" />
			)}
			{children}
		</Button>
	);
}
