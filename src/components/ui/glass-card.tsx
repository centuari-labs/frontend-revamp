import React from "react";
import { cn } from "@/lib/utils";

const glassBackground =
  "linear-gradient(90deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.078) 100%)";

const glassBorderGradient =
  "conic-gradient(from 90deg at 50.43% 50%, rgba(249,249,249,0.3) -32.95deg, rgba(123,123,123,0.1) 10.52deg, rgba(124,124,124,0.08) 32.12deg, rgba(255,255,255,0.25) 60.28deg, rgba(255,255,255,0.2) 107.79deg, rgba(124,124,124,0.08) 138.45deg, rgba(123,123,123,0.05) 172.92deg, rgba(249,249,249,0.05) 210.6deg, rgba(249,249,249,0.15) 327.05deg, rgba(123,123,123,0.1) 370.52deg)";

const glassBoxShadow = [
  "1px -1px 2px 0px rgba(255,255,255,0.05) inset",
  "-2px 2px 3px 0px rgba(255,255,255,0.05) inset",
  "0px 8px 12px 0px rgba(1,1,21,0.2)",
  "0px 17px 28px -11px rgba(0,0,0,0.15)",
].join(", ");

const glassStyle: React.CSSProperties = {
  background: glassBackground,
  boxShadow: glassBoxShadow,
};

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, style, children, as: Component = "div", ...props }, ref) => (
    <Component
      ref={ref}
      className={cn("relative rounded-lg backdrop-blur-xl", className)}
      style={{ ...glassStyle, ...style }}
      {...props}
    >
      {/* Conic gradient border using mask technique */}
      <div
        className="absolute inset-0 rounded-[inherit] pointer-events-none"
        style={{
          padding: "0.5px",
          background: glassBorderGradient,
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "exclude",
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
        }}
      />
      {children}
    </Component>
  )
);
GlassCard.displayName = "GlassCard";

export { GlassCard, glassStyle, glassBorderGradient, glassBoxShadow };
