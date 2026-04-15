"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { CentuariGlassLayers } from "@/components/centuari-glass-surface";
import { cn } from "@/lib/utils";

const glassButtonVariants = cva(
  [
    "relative isolate inline-flex items-center justify-center gap-2",
    "font-medium text-white cursor-pointer select-none whitespace-nowrap",
    "overflow-hidden rounded-lg",
    "transition-[transform,filter] duration-300 ease-out",
    "group-hover/glass:brightness-125 hover:brightness-125 active:scale-[0.98]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 [&_svg]:relative [&_svg]:z-20",
  ],
  {
    variants: {
      size: {
        sm: "h-8 px-3 text-xs",
        default: "h-9 px-4 text-sm",
        lg: "h-10 px-6 text-base",
      },
      shape: {
        rounded: "rounded-lg",
        pill: "rounded-full",
      },
    },
    defaultVariants: {
      size: "default",
      shape: "rounded",
    },
  },
);

export interface CentuariGlassButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof glassButtonVariants> {
  asChild?: boolean;
}

export const CentuariGlassButton = React.forwardRef<
  HTMLButtonElement,
  CentuariGlassButtonProps
>(({ className, size, shape, asChild = false, children, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      ref={ref}
      data-slot="glass-button"
      className={cn(glassButtonVariants({ size, shape, className }))}
      {...props}
    >
      <CentuariGlassLayers intensity="soft" sheen={false} />
      <span className="relative z-20 inline-flex items-center gap-2">
        {children}
      </span>
    </Comp>
  );
});

CentuariGlassButton.displayName = "CentuariGlassButton";

export { glassButtonVariants };
