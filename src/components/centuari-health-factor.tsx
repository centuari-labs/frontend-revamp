"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import Image from "next/image";
import { getHealthFactorPercentage } from "@/lib/utils";

interface HealthFactorProps {
	targetValue?: number;
	healthFactor?: number; // Actual health factor value (e.g., 4.60)
}

export default function HealthFactor({
	targetValue: propTargetValue,
	healthFactor,
}: HealthFactorProps = {}) {
	// Initialize as 0 (empty) if no value provided
	const [targetValue, setTargetValue] = useState(propTargetValue ?? 0);
	const [displayValue, setDisplayValue] = useState(propTargetValue ?? 0);
	const progressRef = useRef<HTMLDivElement>(null);
	const markerRef = useRef<HTMLDivElement>(null);
	const textRef = useRef<HTMLDivElement>(null);
	const glowRef = useRef<HTMLDivElement>(null);
	const animationRef = useRef({ value: 0 });

	const getHFPercentage = (hf: number | undefined): number => {
		if (!hf || hf <= 0) return 0;
		return getHealthFactorPercentage(hf);
	};

	// Determine segment based on health factor value with accurate colors
	// Thresholds: HF >= 2.5 (Excellent), >= 1.5 (Good), >= 1.2 (Warning), >= 1.0 (Critical), < 1.0 (Danger)
	const getSegment = (hf: number | undefined) => {
		if (!hf || hf <= 0) {
			return {
				color: "bg-red-500",
				hex: "#ef4444",
				label: "Danger",
				glow: "shadow-[0_0_20px_rgba(239,68,68,0.6)]",
			};
		}
		if (hf >= 2.5) {
			return {
				color: "bg-green-500",
				hex: "#22c55e",
				label: "Excellent",
				glow: "shadow-[0_0_20px_rgba(34,197,94,0.6)]",
			};
		}
		if (hf >= 1.5) {
			return {
				color: "bg-blue-500",
				hex: "#3b82f6",
				label: "Good",
				glow: "shadow-[0_0_20px_rgba(59,130,246,0.6)]",
			};
		}
		if (hf >= 1.2) {
			return {
				color: "bg-yellow-500",
				hex: "#eab308",
				label: "Warning",
				glow: "shadow-[0_0_20px_rgba(234,179,8,0.6)]",
			};
		}
		if (hf >= 1.0) {
			return {
				color: "bg-orange-500",
				hex: "#f97316",
				label: "Critical",
				glow: "shadow-[0_0_20px_rgba(249,115,22,0.6)]",
			};
		}
		return {
			color: "bg-red-500",
			hex: "#ef4444",
			label: "Danger",
			glow: "shadow-[0_0_20px_rgba(239,68,68,0.6)]",
		};
	};

	const segments = [
		{
			start: 0,
			end: 25,
			color: "bg-red-500",
			hex: "#ef4444",
			label: "Danger",
			glow: "shadow-[0_0_20px_rgba(239,68,68,0.6)]",
		},
		{
			start: 25,
			end: 50,
			color: "bg-orange-500",
			hex: "#f97316",
			label: "Critical",
			glow: "shadow-[0_0_20px_rgba(249,115,22,0.6)]",
		},
		{
			start: 50,
			end: 75,
			color: "bg-yellow-500",
			hex: "#eab308",
			label: "Warning",
			glow: "shadow-[0_0_20px_rgba(234,179,8,0.6)]",
		},
		{
			start: 75,
			end: 100,
			color: "bg-blue-500",
			hex: "#3b82f6",
			label: "Good",
			glow: "shadow-[0_0_20px_rgba(59,130,246,0.6)]",
		},
		{
			start: 100,
			end: 100,
			color: "bg-green-500",
			hex: "#22c55e",
			label: "Excellent",
			glow: "shadow-[0_0_20px_rgba(34,197,94,0.6)]",
		},
	];

	const getActiveSegment = (val: number) => {
		return (
			segments.find((s) => val >= s.start && val < s.end) ||
			segments[segments.length - 1]
		);
	};

	// Update target value when prop changes
	useEffect(() => {
		if (propTargetValue !== undefined) {
			setTargetValue(propTargetValue);
		} else if (healthFactor !== undefined && healthFactor > 0) {
			const percentage = getHFPercentage(healthFactor);
			setTargetValue(percentage);
		} else {
			// Reset to 0 if healthFactor is 0 or undefined
			setTargetValue(0);
		}
		// biome-ignore lint/correctness/useExhaustiveDependencies: getHFPercentage is a stable closure over a pure helper
	}, [propTargetValue, healthFactor, getHFPercentage]);

	useEffect(() => {
		const duration = (Math.abs(targetValue - displayValue) / 100) * 2;

		gsap.to(animationRef.current, {
			value: targetValue,
			duration: Math.max(duration, 0.5),
			ease: "power2.out",
			onUpdate: () => {
				const currentValue = Math.round(animationRef.current.value);
				setDisplayValue(currentValue);

				if (progressRef.current) {
					gsap.to(progressRef.current, {
						width: `${currentValue}%`,
						duration: 0.1,
						ease: "none",
					});
				}

				if (markerRef.current) {
					// Clamp marker so half of it never leaves the bar's visible area
					// (parent containers in some forms use overflow-hidden which clips
					// the marker's right half when displayValue hits 100).
					const clamped = Math.min(Math.max(currentValue, 1.5), 98.5);
					gsap.to(markerRef.current, {
						left: `${clamped}%`,
						duration: 0.1,
						ease: "none",
					});
				}
			},
		});

		if (textRef.current) {
			gsap.fromTo(
				textRef.current,
				{ scale: 1.2, opacity: 0.7 },
				{ scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.7)" },
			);
		}
	}, [targetValue, displayValue]);

	const activeSegment =
		healthFactor !== undefined
			? getSegment(healthFactor)
			: getActiveSegment(displayValue);

	return (
		<div className="w-full">
			<div className="space-y-8">
				<div className="relative">
					<div className="relative h-1 w-full rounded-full overflow-visible">
						{/* Background segments */}
						<div className="absolute inset-0 flex space-x-1">
							{segments.map((segment, idx) => (
								<div
									key={idx}
									className={`h-full ${segment.color} opacity-20 rounded-full`}
									style={{ width: `${segment.end - segment.start}%` }}
								/>
							))}
						</div>

						{/* Active progress with glow */}
						<div className="absolute inset-0">
							<div
								ref={progressRef}
								className={`h-full ${activeSegment.color} rounded-full transition-all duration-300`}
								style={{
									width: `${displayValue}%`,
									boxShadow: `0 0 20px ${activeSegment.hex}80, 0 0 40px ${activeSegment.hex}40`,
								}}
							/>
						</div>

						{/* Glow overlay behind progress */}
						<div
							ref={glowRef}
							className="absolute inset-0 -z-10 blur-xl opacity-60 transition-all duration-300"
							style={{
								width: `${displayValue}%`,
								background: `linear-gradient(90deg, transparent, ${activeSegment.hex})`,
							}}
						/>
					</div>

					{/* Marker with glow — left clamped to keep marker visible inside
              parent containers that use overflow-hidden (e.g. health factor
              cards in borrow-main-view / centuari-add-collateral). */}
					<div
						ref={markerRef}
						className="absolute -top-2 -translate-x-1/2 -translate-y-1 pointer-events-none transition-all duration-300"
						style={{
							left: `${Math.min(Math.max(displayValue, 1.5), 98.5)}%`,
						}}
					>
						<div
							className="relative"
							style={{
								filter: `drop-shadow(0 0 8px ${activeSegment.hex}) drop-shadow(0 0 12px ${activeSegment.hex}80)`,
							}}
						>
							<Image
								className="w-2 rounded-xs"
								src="/icons/marker.svg"
								alt="Progress Marker"
								width={10}
								height={10}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
