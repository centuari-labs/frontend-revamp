"use client";

import { Badge } from "@/components/ui/badge";
import { getHealthFactorDisplayStatus } from "@/lib/utils";

export interface HealthFactorBadgeProps {
	healthFactor: number;
	isEmpty?: boolean;
}

export function HealthFactorBadge({
	healthFactor,
	isEmpty = false,
}: HealthFactorBadgeProps) {
	if (isEmpty) {
		return <Badge variant="default">0.00 ~ Safe</Badge>;
	}

	const { value, status, variant } = getHealthFactorDisplayStatus(healthFactor);
	const displayText = `${value} ~ ${status}`;

	return <Badge variant={variant}>{displayText}</Badge>;
}
