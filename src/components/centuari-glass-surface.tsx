"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const FILTER_ID = "centuari-liquid-glass-distortion";

export function GlassDistortionFilter() {
  return (
    <svg aria-hidden className="pointer-events-none absolute h-0 w-0">
      <defs>
        <filter
          id={FILTER_ID}
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          filterUnits="objectBoundingBox"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.008 0.012"
            numOctaves="2"
            seed="4"
            result="noise"
          />
          <feGaussianBlur in="noise" stdDeviation="2" result="softNoise" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="softNoise"
            scale="70"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}

export interface CentuariGlassLayersProps {
  /** Bevel intensity — "soft" for large surfaces (cards), "crisp" for small (buttons). */
  intensity?: "soft" | "crisp";
  /** Enable the sweeping sheen on hover (via group/glass on parent). */
  sheen?: boolean;
  className?: string;
}

/**
 * Injects the 5-layer liquid-glass visual stack into its parent.
 * Parent MUST be `relative isolate overflow-hidden` and (optionally) have
 * `group/glass` class if `sheen` is true. Content after <CentuariGlassLayers />
 * should carry `relative z-20` to sit above the layers.
 */
export function CentuariGlassLayers({
  intensity = "crisp",
  sheen = true,
  className,
}: CentuariGlassLayersProps) {
  const bevelSoft = [
    "inset 0 0 0 1px rgba(255,255,255,0.05)",
    "inset 2px 2px 2px -12px rgba(255,255,255,0.45)",
    "inset 8px 8px 4px -8px rgba(200,200,200,0.35)",
    "inset -8px -8px 4px -8px rgba(200,200,200,0.35)",
    "inset 0 0 120px 0 rgba(242,242,242,0.12)",
    "0 24px 60px -20px rgba(0,0,0,0.55)",
  ].join(", ");

  const bevelCrisp = [
    "inset 0 0 0 1px rgba(255,255,255,0.6)",
    "inset 4px 4px 0.8px -5px rgba(255,255,255,0.7)",
    "inset 2.8px 2.8px 1.4px -2.8px rgba(200,200,200,0.85)",
    "inset -2.8px -2.8px 1.4px -2.8px rgba(200,200,200,0.85)",
    "inset 0 0 0 1.4px rgba(170,170,170,0.45)",
    "inset 0 0 32px 0 rgba(242,242,242,0.28)",
    "0 8px 24px -8px rgba(0,0,0,0.45)",
  ].join(", ");

  return (
    <>
      {/* <GlassDistortionFilter /> */}

      {/* Distortion: warps background pixels like real glass. */}
      {/* <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 rounded-[inherit]",
          className,
        )}
        style={{
          backdropFilter: `url(#${FILTER_ID}) blur(2px) saturate(180%)`,
          WebkitBackdropFilter: `url(#${FILTER_ID}) blur(2px) saturate(180%)`,
        }}
      /> */}

      {/* Tint */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-white/0"
      />

      {/* Specular highlight (plus-lighter) */}
      {/* <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] mix-blend-plus-lighter opacity-80"
        style={{
          backgroundImage:
            "radial-gradient(130% 85% at 18% 8%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 55%)",
        }}
      /> */}

      {/* Inner bevel */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] z-10"
        style={{ boxShadow: intensity === "soft" ? bevelSoft : bevelCrisp }}
      />

      {/* Sheen sweep */}
      {sheen && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] -translate-x-[120%] transition-transform duration-1200 ease-out group-hover/glass:translate-x-[120%]"
          style={{
            backgroundImage:
              "linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.28) 50%, transparent 65%)",
          }}
        />
      )}
    </>
  );
}

export interface CentuariGlassSurfaceProps
  extends React.HTMLAttributes<HTMLDivElement> {
  intensity?: "soft" | "crisp";
  sheen?: boolean;
  /** Element tag to render. Defaults to "div". */
  as?: "div" | "span" | "section" | "header" | "article";
}

/**
 * Ready-to-use glass surface container. Handles the required wrapper classes
 * (`relative isolate overflow-hidden group/glass`) and injects the glass layers
 * automatically. Children are rendered above the layers at `z-20`.
 */
export function CentuariGlassSurface({
  intensity = "crisp",
  sheen = false,
  as: Tag = "div",
  className,
  children,
  ...props
}: CentuariGlassSurfaceProps) {
  return (
    <Tag
      className={cn(
        "group/glass relative isolate overflow-hidden",
        className,
      )}
      {...props}
    >
      <CentuariGlassLayers intensity={intensity} sheen={sheen} />
      <span className="relative z-20 flex w-full items-center justify-center">
        {children}
      </span>
    </Tag>
  );
}
