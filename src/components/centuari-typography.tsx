import { cn } from "@/lib/utils";
import * as React from "react";

const CentuariVariant = [
  "j1",
  "j2",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "s1",
  "s2",
  "s3",
  "s4",
  "b1",
  "b2",
  "b3",
  "c1",
  "c2",
  "l1",
  "l2",

  "heading-xl",
  "heading-lg",
  "heading-md",
  "heading-sm",
  "title-xl",
  "title-lg",
  "title-md",
  "title-sm",
  "body-xl",
  "body-lg",
  "body-md",
  "body-sm",
  "subheading-lg",
  "subheading-md",
  "subheading-sm",
  "label-lg",
  "label-md",
  "label-sm",
] as const;

const CentuariColor = [
  "primary",
  "secondary",
  "tertiary",
  "danger",
  "white",
] as const;

type CentuariProps<T extends React.ElementType> = {
  as?: T;
  className?: string;
  color?: (typeof CentuariColor)[number];
  variant?: (typeof CentuariVariant)[number];
  children?: React.ReactNode;
} & React.ComponentPropsWithoutRef<T>;

type CentuariComponent = <T extends React.ElementType = "p">(
  props: CentuariProps<T>
) => React.ReactNode | null;

export const CentuariTypography: CentuariComponent = React.forwardRef<
  any,
  CentuariProps<any>
>(
  (
    {
      as,
      children,
      className,
      color = "primary",
      variant = "b2",
      font,
      ...rest
    },
    ref
  ) => {
    const Component = as || "p";
    return (
      <Component
        ref={ref}
        className={cn(
          [
            variant === "j1" && ["text-4xl font-bold"],
            variant === "j2" && ["text-3xl font-bold"],
            variant === "h1" && ["text-2xl font-semibold"],
            variant === "h2" && ["text-xl font-semibold"],
            variant === "h3" && ["text-lg font-semibold"],
            variant === "h4" && ["text-base font-bold"],
            variant === "h5" && ["text-base font-semibold"],
            variant === "h6" && ["text-sm font-semibold"],
            variant === "s1" && ["text-lg font-medium"],
            variant === "s2" && ["text-base font-medium"],
            variant === "s3" && ["text-sm font-medium"],
            variant === "s4" && ["text-xs font-medium"],
            variant === "b1" && ["text-lg"],
            variant === "b2" && ["font-primary text-base"],
            variant === "b3" && ["text-sm font-normal"],
            variant === "c1" && ["text-xs"],
            variant === "c2" && ["text-[11px] leading-[14px]"],

            // Heading styles
            variant === "heading-xl" && [
              "text-[40px] font-medium leading-[1.2] tracking-[-0.01em]",
            ],
            variant === "heading-lg" && [
              "text-[32px] font-semibold leading-[1.2] tracking-[-0.01em]",
            ],
            variant === "heading-md" && [
              "text-[24px] font-semibold leading-[1.2] tracking-[-0.01em]",
            ],
            variant === "heading-sm" && [
              "text-[18px] font-semibold leading-[1.2] tracking-[-0.01em]",
            ],

            // Title styles
            variant === "title-xl" && [
              "text-[18px] font-medium leading-[1.2] tracking-[-0.01em]",
            ],
            variant === "title-lg" && [
              "text-[16px] font-medium leading-[1.2] tracking-[-0.01em]",
            ],
            variant === "title-md" && [
              "text-[14px] font-medium leading-[1.2] tracking-[-0.01em]",
            ],
            variant === "title-sm" && [
              "text-[12px] font-medium leading-[1.2] tracking-[-0.01em]",
            ],

            // Body styles
            variant === "body-xl" && [
              "text-[18px] font-normal leading-[1.2] tracking-[-0.01em]",
            ],
            variant === "body-lg" && [
              "text-[16px] font-normal leading-[1.2] tracking-[-0.01em]",
            ],
            variant === "body-md" && [
              "text-[14px] font-normal leading-[140%] tracking-[-0.01em]",
            ],
            variant === "body-sm" && [
              "text-[12px] font-normal leading-[1.2] tracking-[-0.01em]",
            ],

            // Sub-heading styles
            variant === "subheading-lg" && [
              "text-[12px] font-medium leading-[1.2] tracking-[-0.01em]",
            ],
            variant === "subheading-md" && [
              "text-[11px] font-medium leading-[1.2] tracking-[-0.01em]",
            ],
            variant === "subheading-sm" && [
              "text-[10px] font-medium leading-[140%] tracking-[-0.01em]",
            ],

            // Label styles
            variant === "label-lg" && [
              "text-[16px] font-medium leading-[1.2] tracking-[-0.01em]",
            ],
            variant === "label-md" && [
              "text-[14px] font-medium leading-[1.2] tracking-[-0.01em]",
            ],
            variant === "label-sm" && [
              "text-[12px] font-medium leading-[1.2] tracking-[-0.01em]",
            ],
          ],
          [
            color === "primary" && ["text-white"],
            color === "secondary" && ["text-gray-700"],
            color === "tertiary" && ["text-gray-500"],
            color === "danger" && ["text-red-500"],
            color === "white" && ["text-white"],
          ],
          className
        )}
        {...rest}
      >
        {children}
      </Component>
    );
  }
);
