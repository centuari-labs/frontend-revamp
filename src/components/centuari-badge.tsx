import { VariantProps } from "class-variance-authority";
import { Badge, badgeVariants } from "./ui/badge";
import { cn } from "@/lib/utils";

export function CentuariBadge({
  className,
  variant = "primary",
  children,
  isDot = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    children: React.ReactNode;
    isDot?: boolean;
  }) {
  return (
    <Badge variant={variant} className={cn(className)} {...props}>
      {isDot && (
        <span
          className="size-1.5 rounded-full bg-amber-600 dark:bg-amber-400"
          aria-hidden="true"
        />
      )}
      {children}
    </Badge>
  );
}
