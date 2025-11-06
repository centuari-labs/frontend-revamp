import { IconProps } from "@/types";
import * as React from "react";

export const IcPieChartColorCentuari = ({
  size = 24,
  color = "currentColor",
  fillColor = "none",
  strokeWidth = 1.2,
  className,
  ...props
}: IconProps) => (
  <svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g clipPath="url(#clip0_12859_37734)">
      <g filter="url(#filter0_d_12859_37734)">
        <path
          d="M12 2C13.3132 2 14.6136 2.25866 15.8268 2.76121C17.0401 3.26375 18.1425 4.00035 19.0711 4.92893C19.9997 5.85752 20.7363 6.95991 21.2388 8.17317C21.7413 9.38643 22 10.6868 22 12M12 2V12M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5229 22 12M12 2C17.5228 2 22 6.47716 22 12M22 12L12 12M22 12C22 13.5781 21.6265 15.1338 20.9101 16.5399C20.1936 17.946 19.1546 19.1626 17.8779 20.0902L12 12"
          stroke="url(#paint0_linear_12859_37734)"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          shapeRendering="crispEdges"
        />
      </g>
    </g>
    <defs>
      <filter
        id="filter0_d_12859_37734"
        x={-4.89844}
        y={1.1001}
        width={33.7969}
        height={33.7998}
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity={0} result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feMorphology
          radius={2}
          operator="erode"
          in="SourceAlpha"
          result="effect1_dropShadow_12859_37734"
        />
        <feOffset dy={6} />
        <feGaussianBlur stdDeviation={4} />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_12859_37734"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_12859_37734"
          result="shape"
        />
      </filter>
      <linearGradient
        id="paint0_linear_12859_37734"
        x1={12}
        y1={2}
        x2={12}
        y2={22}
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="white" />
        <stop offset={1} stopColor="white" stopOpacity={0.5} />
      </linearGradient>
      <clipPath id="clip0_12859_37734">
        <rect width={24} height={24} fill="white" />
      </clipPath>
    </defs>
  </svg>
);
