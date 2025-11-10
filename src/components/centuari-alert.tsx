import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "./ui/button";

export function CentuariAlert({
  text,
  description,
  variant,
  icon,
  className,
  action,
}: {
  variant: "destructive" | "default";
  text: string;
  description: string;
  icon?: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <Alert
      variant={variant || "default"}
      className={`flex items-center justify-between [&>svg]:translate-y-0 ${className}`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <AlertTitle className="font-semibold">{text}</AlertTitle>
          <AlertDescription className="text-xs">{description}</AlertDescription>
        </div>
      </div>
      {action && <div>{action}</div>}
    </Alert>
  );
}
