import type { IconProps } from "@/types";

export const IcDollarCentuari = ({
	size = 24,
	color = "currentColor",
	fillColor = "none",
	strokeWidth = 1.2,
	className,
	...props
}: IconProps) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill={fillColor}
		xmlns="http://www.w3.org/2000/svg"
		className={className}
		{...props}
	>
		<path
			d="M0.600006 14.6001C0.600006 16.8092 2.39087 18.6001 4.60001 18.6001H8.60001C10.8091 18.6001 12.6 16.8092 12.6 14.6001C12.6 12.391 10.8091 10.6001 8.60001 10.6001H4.60001C2.39087 10.6001 0.600006 8.80924 0.600006 6.6001C0.600006 4.39096 2.39087 2.6001 4.60001 2.6001H8.60001C10.8091 2.6001 12.6 4.39096 12.6 6.6001M6.60001 0.600098V20.6001"
			stroke={color}
			strokeWidth={strokeWidth}
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);
