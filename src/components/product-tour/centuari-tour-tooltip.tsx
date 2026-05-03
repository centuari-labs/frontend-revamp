"use client";

import type { TooltipRenderProps } from "react-joyride";
import { XIcon } from "lucide-react";

import { CentuariGlassLayers } from "@/components/centuari-glass-surface";
import { CentuariButton } from "@/components/centuari-button";
import { cn } from "@/lib/utils";

export function CentuariTourTooltip({
  index,
  size,
  step,
  backProps,
  primaryProps,
  closeProps,
  tooltipProps,
  isLastStep,
}: TooltipRenderProps) {
  const isFirst = index === 0;

  return (
    <div
      {...tooltipProps}
      className="relative w-96 max-w-[calc(100vw-32px)]"
    >
      <button
        {...closeProps}
        type="button"
        aria-label="Close tour"
        className="group/glass absolute -top-3 -right-3 z-30 isolate overflow-hidden p-1.5 rounded-full opacity-70 transition-opacity hover:opacity-100 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
      >
        <CentuariGlassLayers intensity="soft" />
        <span className="relative z-20 flex">
          <XIcon className="text-white" />
        </span>
        <span className="sr-only">Close</span>
      </button>

      <div
        className={cn(
          "group/glass relative isolate overflow-hidden",
          "rounded-2xl bg-black/40 backdrop-blur-2xl shadow-2xl"
        )}
      >
        <CentuariGlassLayers intensity="soft" sheen={false} />

        <div className="relative z-20 flex w-full flex-col p-5 text-left">
          {step.title && (
            <h3 className="pr-6 text-lg font-semibold leading-tight tracking-tight text-white">
              {step.title}
            </h3>
          )}
          <p className="mt-1.5 text-sm leading-relaxed text-white/70">
            {step.content}
          </p>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div
              className="flex items-center gap-1.5"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={size}
              aria-valuenow={index + 1}
            >
              {Array.from({ length: size }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1 w-6 rounded-full transition-all duration-300",
                    i <= index ? "bg-white" : "bg-white/15"
                  )}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {!isFirst && (
                <CentuariButton
                  {...backProps}
                  variant="secondary"
                  className="px-4! py-2! text-sm!"
                >
                  Previous
                </CentuariButton>
              )}
              <CentuariButton
                {...primaryProps}
                variant="primary"
                className="px-5! py-2! text-sm!"
              >
                {isLastStep ? "Done" : "Next"}
              </CentuariButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
