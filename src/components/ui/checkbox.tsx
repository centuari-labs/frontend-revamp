"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "checked" | "onChange"> {
  id: string;
  label: React.ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

const CheckIcon = () => (
  <svg
    width="10"
    height="8"
    viewBox="0 0 10 8"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0 text-white"
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
            "relative inline-flex h-4 w-4 shrink-0 cursor-pointer select-none items-center justify-center rounded-[6px] transition-colors",
            "disabled:cursor-not-allowed disabled:opacity-50 rounded-full",
            checked
              ? "bg-primary-blue-base"
              : "border border-white/20 bg-transparent"
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
          {checked && (
            <span className="absolute inset-0 flex items-center justify-center [&_svg]:block">
              <CheckIcon />
            </span>
          )}
        </label>
        <Label htmlFor={id} className="cursor-pointer text-sm text-white font-normal">
          {label}
        </Label>
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
