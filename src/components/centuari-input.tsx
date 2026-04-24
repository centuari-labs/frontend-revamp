import * as React from "react";

import { cn } from "@/lib/utils";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { cva } from "class-variance-authority";
import { CentuariTooltip } from "./centuari-tooltip";
import { InfoIcon } from "lucide-react";

interface CentuariInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  id: string;
  placeholder?: string;
  variant?: "default" | "currency" | "lead-dropdown";
  size: "small" | "medium" | "large";
  leftIcon?: React.ReactNode | string;
  rightIcon?: React.ReactNode | string;
  suffix?: React.ReactNode;
  balanceText?: React.ReactNode;
  helperText?: string;
  containerClassName?: string;
  label?: string;
  labelClassName?: string;
  tooltipMessage?: string;
  showTooltip?: boolean;
  readonly?: boolean;
  disabled?: boolean;
}

const inputVariants = cva("", {
  variants: {
    variant: {
      default: "",
      currency:
        "pl-10 pr-10 bg-input/30 dark:bg-input/50 border-input focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
      "lead-dropdown": "pl-10 pr-10 bg-transparent border-0",
    },
    size: {
      small: "h-8 text-sm",
      medium: "h-9 text-base",
      large: "h-9 text-lg",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "medium",
  },
});

export function CentuariInput({
  id,
  leftIcon,
  rightIcon,
  suffix,
  balanceText,
  helperText,
  containerClassName,
  placeholder,
  size = "medium",
  variant,
  className,
  label,
  labelClassName,
  tooltipMessage = "Coming Soon",
  showTooltip = true,
  readOnly,
  disabled,
  ...props
}: CentuariInputProps) {
  return (
    <div className={containerClassName}>
      <div className={"mb-1.5 flex items-center justify-between"}>
        {label && (
          <Label htmlFor={id} className={cn(labelClassName)}>
            {label}
          </Label>
        )}
        {balanceText && (
          <div
            className={cn(
              "flex text-xs text-muted-foreground mt-1",
              balanceText && "items-center gap-1"
            )}
          >
            Available <span className="text-white">{balanceText}</span>
            {showTooltip && (
              <>
                {" "}
                <CentuariTooltip message={tooltipMessage}>
                  <InfoIcon size={12} />
                </CentuariTooltip>
              </>
            )}
          </div>
        )}
      </div>
      <div className="relative">
        {leftIcon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            {leftIcon}
          </div>
        )}
        <Input
          id={id}
          placeholder={placeholder}
          readOnly={readOnly}
          disabled={disabled}
          className={cn(
            (readOnly || disabled) && "cursor-not-allowed opacity-50",
            inputVariants({ variant, size }),
            leftIcon && "pl-10",
            (rightIcon || suffix) && "pr-10",
            rightIcon && suffix && "pr-24",
            className
          )}
          {...props}
        />
        {(suffix || rightIcon) && (
          <div className="absolute inset-y-0 right-0 flex items-center gap-1.5 pr-3">
            {suffix && (
              <span className="text-muted-foreground text-sm select-none">
                {suffix}
              </span>
            )}
            {rightIcon}
          </div>
        )}
      </div>
      {helperText && (
        <p className="mt-2 text-sm text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}
