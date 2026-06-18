"use client";

import { Star } from "lucide-react";
import { RadialBarChart, RadialBar, PolarRadiusAxis } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";

const chartConfig = {
	value: {
		label: "Value",
	},
} satisfies ChartConfig;

const VALUE = 70;
const POINTS = 240;

const chartData = [
	{
		name: "tier",
		value: VALUE,
		fill: "var(--chart-1)",
	},
];

export function TierEmblem() {
	return (
		<div className="flex items-center gap-3 text-white">
			{/* Badge kiri */}
			<div className="relative h-24 w-24">
				{/* Radial progress (ring luar), sekarang absolute & sepusat */}
				<ChartContainer
					config={chartConfig}
					className="absolute inset-0 flex items-center justify-center"
				>
					<RadialBarChart
						data={chartData}
						width={96}
						height={96}
						// radius lebih kecil supaya nempel ke badge, tidak keluar jauh
						innerRadius={70}
						outerRadius={82}
						// sudut dibikin lebih sempit supaya hanya bagian atas
						startAngle={210}
						endAngle={-30}
					>
						<PolarRadiusAxis
							type="number"
							domain={[0, 100]}
							tick={false}
							tickLine={false}
							axisLine={false}
						/>

						<RadialBar
							dataKey="value"
							cornerRadius={999}
							background={{ fill: "rgba(255,255,255,0.2)" }}
						/>
					</RadialBarChart>
				</ChartContainer>

				{/* Isi badge (lingkaran biru + emblem) */}
				<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
					<div className="h-16 w-16 rounded-full bg-gradient-to-b from-[#4d7dff] to-[#3350ff] flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.8)] relative overflow-hidden">
						{/* highlight atas */}
						<div className="absolute -top-1 left-1/2 h-3 w-10 -translate-x-1/2 rounded-full bg-white/70 blur-[2px]" />

						{/* emblem tengah */}
						<div className="relative h-10 w-10 rounded-2xl bg-gradient-to-b from-[#c27a34] to-[#5b3113] border border-black/50 shadow-[0_4px_10px_rgba(0,0,0,0.75)] flex items-center justify-center">
							<Star className="h-5 w-5 text-amber-200 drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]" />
						</div>
					</div>
				</div>

				{/* pill PTS */}
				<div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#0f172a] text-[10px] font-semibold tracking-wide shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
					{POINTS} PTS
				</div>
			</div>

			{/* Teks kanan */}
			<div className="flex flex-col leading-tight">
				<div className="flex items-center gap-1 text-[11px] text-slate-400">
					<span>League</span>
					<span className="flex h-4 w-4 items-center justify-center rounded-full border border-slate-600 text-[9px]">
						i
					</span>
				</div>
				<div className="text-xl font-semibold tracking-tight">Aurorra</div>
			</div>
		</div>
	);
}
