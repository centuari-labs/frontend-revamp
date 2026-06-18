import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
	description?: string;
	icon?: React.ReactNode;
	className?: string;
	action?: React.ReactNode;
}) {
	return (
		<Alert
			variant={variant || "default"}
			className={`flex items-center justify-between !border-[0.5px] [&>svg]:translate-y-0 ${className}`}
		>
			<div className="flex items-center gap-2">
				{icon}
				<div>
					<AlertTitle className="font-semibold">{text}</AlertTitle>
					{description ? (
						<AlertDescription className="text-xs">
							{description}
						</AlertDescription>
					) : null}
				</div>
			</div>
			{action && <div>{action}</div>}
		</Alert>
	);
}
