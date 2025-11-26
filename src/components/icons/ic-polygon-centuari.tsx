import { IconProps } from "@/types";
import * as React from "react";

export const IcPolygonCentuari = ({
  size = 24,
  color = "currentColor",
  fillColor = "none",
  strokeWidth = 1.2,
  className,
  ...props
}: IconProps) => (
  <svg
    width={11}
    height={9}
    viewBox="0 0 11 9"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M5.19531 0L10.3915 9H-0.00083971L5.19531 0Z" fill={fillColor} />
  </svg>
);
