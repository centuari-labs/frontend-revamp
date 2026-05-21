"use client";

import Image from "next/image";

export default function PointsBadge() {
	const size = 70;
	const strokeWidth = 6;
	const radius = (size - strokeWidth) / 2;
	const center = size / 2;

	const points = 340;
	const maxPoints = 400;
	const progress = points / maxPoints;

	const circumference = 2 * Math.PI * radius;

	const arcLength = circumference * 0.75;

	const progressLength = arcLength * progress;

	return (
		<div className="flex items-center">
			<div className="relative" style={{ width: size, height: size }}>
				<svg
					className="absolute inset-0"
					height={size}
					style={{ transform: "rotate(135deg)" }}
					width={size}
				>
					<circle
						cx={center}
						cy={center}
						fill="none"
						r={radius}
						stroke="#E5E7EB"
						strokeDasharray={`${arcLength} ${circumference}`}
						strokeLinecap="round"
						strokeWidth={strokeWidth}
					/>

					<circle
						cx={center}
						cy={center}
						fill="none"
						r={radius}
						stroke="#fff"
						strokeDasharray={`${progressLength} ${circumference}`}
						strokeLinecap="round"
						strokeWidth={strokeWidth}
					/>

					<defs>
						<linearGradient id="gradient" x1="0%" x2="100%" y1="0%" y2="0%">
							<stop offset="0%" stopColor="#4F8CFF" />
							<stop offset="100%" stopColor="#1B47FF" />
						</linearGradient>
					</defs>
				</svg>

				<div className="absolute inset-[8px] rounded-full bg-linear-to-b from-[#4F8CFF] to-[#1B47FF] flex items-center justify-center">
					<Image
						src={"/assets/tier-3.png"}
						alt="tier"
						width={35.57811737060547}
						height={43.27375793457031}
					/>
				</div>

				<div className="absolute left-1/2 bottom-1 translate-y-1/2 -translate-x-1/2 bg-[#39445B] py-0.5 px-2 rounded-full shadow-md">
					<span className="text-white font-semibold whitespace-nowrap text-xs">
						{points} PTS
					</span>
				</div>
			</div>
		</div>
	);
}
