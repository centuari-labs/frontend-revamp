import { AlertCircleIcon, CheckCircle2Icon, PopcornIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "./ui/button";

export function CentuariAlert({
  text,
  description,
  variant,
  icon,
}: {
  text: string;
  description?: string;
  variant?: "default" | "success" | "destructive" | "warning";
  icon?: React.ReactNode;
}) {
  return (
    <Alert variant={variant} className="w-full max-w-md">
      {icon}
      <div className="flex items-center justify-between">
        <div>
          <AlertTitle>{text}</AlertTitle>
          <AlertDescription>{description}</AlertDescription>
        </div>
        <Button>Deposit</Button>
      </div>
    </Alert>
  );
}
