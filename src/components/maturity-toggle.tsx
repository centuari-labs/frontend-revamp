"use client";
import * as React from "react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import {
	getAvailableMaturityTimestamps,
	getDefaultMaturityTimestamp,
	formatMaturityTimestamp,
} from "@/lib/maturity";

interface MaturityToggleProps {
	className?: string;
	value?: number;
	onValueChange?: (value: number) => void;
	options?: number[];
}

export function MaturityToggle({
	className,
	value: valueProp,
	onValueChange: onValueChangeProp,
	options: optionsProp,
}: MaturityToggleProps) {
	const [internalValue, setInternalValue] = React.useState(() =>
		getDefaultMaturityTimestamp(),
	);

	const value = valueProp !== undefined ? valueProp : internalValue;
	const options = React.useMemo(
		() => optionsProp ?? getAvailableMaturityTimestamps(),
		[optionsProp],
	);

	const handleValueChange = (newValueStr: string) => {
		const ts = Number(newValueStr);
		if (Number.isNaN(ts)) return;
		if (onValueChangeProp) {
			onValueChangeProp(ts);
		} else {
			setInternalValue(ts);
		}
	};

	return (
		<ToggleGroup
			type="single"
			variant="outline"
			spacing={2}
			size={"lg"}
			className={cn("w-full grid sm:grid-cols-2 xl:grid-cols-3", className)}
			value={value.toString()}
			onValueChange={(newValue) => {
				if (newValue) handleValueChange(newValue);
			}}
		>
			{options.map((ts) => (
				<ToggleGroupItem
					key={ts}
					value={ts.toString()}
					aria-label={`Toggle ${formatMaturityTimestamp(ts)}`}
					className="data-[state=on]:bg-primary-blue-base/20 h-9 data-[state=on]:border-primary-blue-base flex-1"
				>
					{formatMaturityTimestamp(ts)}
				</ToggleGroupItem>
			))}
		</ToggleGroup>
	);
}
