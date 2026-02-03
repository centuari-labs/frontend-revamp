"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "checked" | "onChange"> {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

const CheckIcon = () => (
  <svg
    width="8"
    height="6"
    viewBox="0 0 10 8"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0 text-primary-blue-base"
    aria-hidden
  >
    <path
      d="M1 4L3.5 6.5L9 1"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ id, label, checked, onCheckedChange, disabled, className, ...props }, ref) => {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <label
          htmlFor={id}
          className={cn(
            "relative inline-flex h-6 w-6 shrink-0 cursor-pointer select-none items-center justify-center rounded-[6px] transition-colors",
            "disabled:cursor-not-allowed disabled:opacity-50",
            checked
              ? "border-2 border-primary-blue-base bg-primary-blue-100"
              : "border border-transparent bg-[#2C2C30]"
          )}
          aria-hidden
        >
          <input
            ref={ref}
            type="checkbox"
            id={id}
            checked={checked}
            disabled={disabled}
            onChange={(e) => onCheckedChange(e.target.checked)}
            className="peer sr-only"
            aria-checked={checked}
            {...props}
          />
          {/* Inner circle: always perfectly centered */}
          <span
            className={cn(
              "absolute top-1/2 left-1/2 flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition-colors [&_svg]:block",
              checked ? "bg-white" : "border border-[#A0A0A0] bg-transparent"
            )}
          >
            {checked && <CheckIcon />}
          </span>
        </label>
        <Label htmlFor={id} className="cursor-pointer text-sm text-foreground font-normal">
          {label}
        </Label>
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
