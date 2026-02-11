"use client";

import { IcAtomCentuari } from "@/components/icons/ic-atom-centuari";
import { IcLightingCentuari } from "@/components/icons/ic-lighting-centuari";
import { IcTargetCentuari } from "@/components/icons/ic-target-centuari";
import { SubmitProofDialog } from "@/components/leaderboard/dialogs/submit-proof-dialog";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import PointsBadge from "@/components/leaderboard/point-badge";
import { TierEmblem } from "@/components/tier-emblem";
import { PageContainer } from "@/components/page-container";
import { Button } from "@/components/ui/button";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import {
  Label,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";

export default function PointsPage() {
  const chartData = [
    { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
  ];
  const chartConfig = {
    visitors: {
      label: "Visitors",
    },
    safari: {
      label: "Safari",
      color: "var(--chart-2)",
    },
  } satisfies ChartConfig;

  return (
    <PageContainer className="mt-14 2xl:mt-16" innerClassName="flex flex-col">
        <h1 className="mt-8 text-2xl sm:text-3xl 2xl:text-4xl font-semibold inline-block">
          Points
        </h1>

        <div className="mt-4 2xl:mt-6 grid gap-4 2xl:gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-stretch flex-1">
          {/* LEFT */}
          <div className="min-w-0 flex flex-col relative">
            {/* TOP STATS */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
              <div className="inline-flex items-center gap-3 2xl:gap-4 w-full sm:w-1/2 xl:w-[206.75px]">
                <PointsBadge />
                <div>
                  <h3 className="text-xs sm:text-sm 2xl:text-base text-muted-foreground">
                    League
                  </h3>
                  <p className="text-base sm:text-lg 2xl:text-xl font-medium">
                    Aurora
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-3 2xl:gap-4 w-full sm:w-1/2 xl:w-[206.75px]">
                <div className="flex h-[52px] w-[52px] 2xl:h-[60px] 2xl:w-[60px] items-center justify-center bg-white/10 rounded-xl border border-white/5">
                  <IcAtomCentuari />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm 2xl:text-base text-muted-foreground">
                    Season
                  </h3>
                  <p className="text-base sm:text-lg 2xl:text-xl">Beta Stars</p>
                </div>
              </div>

              <div className="inline-flex items-center gap-3 2xl:gap-4 w-full sm:w-1/2 xl:w-[206.75px]">
                <div className="flex h-[52px] w-[52px] 2xl:h-[60px] 2xl:w-[60px] items-center justify-center bg-white/10 rounded-xl border border-white/5">
                  <IcLightingCentuari />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm 2xl:text-base text-muted-foreground">
                    Multiplier
                  </h3>
                  <p className="text-base sm:text-lg 2xl:text-xl">0%</p>
                </div>
              </div>

              <div className="inline-flex items-center gap-3 2xl:gap-4 w-full sm:w-1/2 xl:w-[206.75px]">
                <div className="flex h-[52px] w-[52px] 2xl:h-[60px] 2xl:w-[60px] items-center justify-center bg-white/10 rounded-xl border border-white/5">
                  <IcTargetCentuari />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm 2xl:text-base text-muted-foreground">
                    Mission
                  </h3>
                  <p className="text-base sm:text-lg 2xl:text-xl">1/6</p>
                </div>
              </div>
            </div>

            {/* REFERRAL INPUT */}
            <div className="mt-1 2xl:mt-4 flex flex-col gap-3 2xl:gap-4 rounded-lg bg-white/5 p-3 2xl:p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3 2xl:gap-4">
                <div className="relative h-16 w-24 2xl:h-20 2xl:w-28 overflow-hidden rounded-lg border border-white/5 bg-slate-800/95 shrink-0">
                  <img
                    src={"/assets/half-centuari.svg"}
                    alt="centuari-token-multiple"
                    className="relative z-10 h-full w-full object-contain"
                  />
                  <div className="absolute top-0 left-0 flex h-full w-full items-end">
                    <img
                      src={"/assets/blur-shadow.png"}
                      alt="blur shadow"
                      className="h-2/3 w-full"
                    />
                  </div>
                  <div className="absolute inset-x-0 top-0 mx-auto h-px w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent shadow-2xl" />
                </div>
                <div>
                  <h3 className="text-base 2xl:text-xl font-semibold">
                    Multiply Your Points
                  </h3>
                  <p className="text-xs sm:text-sm 2xl:text-base text-muted-foreground">
                    Enter a referral code to get a{" "}
                    <span className="text-white">10% point boost</span>
                  </p>
                </div>
              </div>

              <Input
                placeholder="Enter referral code"
                className="w-full md:w-[260px] lg:w-[281px] 2xl:w-[320px] 2xl:text-base mt-2 md:mt-0"
              />
            </div>

            {/* LEADERBOARD */}
            <div className="mt-3 2xl:mt-4 rounded-lg bg-white/5 p-3 2xl:p-4 flex-1 flex flex-col min-h-0">
              <h1 className="mb-2 2xl:mb-3 text-sm sm:text-base 2xl:text-lg font-medium">
                Leaderboard
              </h1>
              <div className="flex-1 min-h-0 overflow-x-auto">
                <LeaderboardTable />
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="min-w-0 w-full flex flex-col gap-3 2xl:gap-4">
            {/* REFER A FRIEND */}
            <div className="h-auto rounded-lg bg-white/5 p-4 2xl:p-5">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3 2xl:gap-4">
                <div className="w-full sm:max-w-xs 2xl:max-w-sm">
                  <h1 className="text-base sm:text-lg 2xl:text-xl font-medium">
                    Refer a Friend and Both Earn more Centuari Points
                  </h1>
                  <p className="text-sm 2xl:text-base text-muted-foreground mt-2 sm:mt-3">
                    Earn faster with a{" "}
                    <span className="text-white">10% point boost</span>.
                  </p>
                </div>
                <div className="relative overflow-hidden rounded-lg border border-white/5 bg-slate-800/95 p-2 2xl:p-3 mx-auto sm:mx-0">
                  <Image
                    src="/assets/centuari-single-token.png"
                    alt="centuari single token"
                    width={90}
                    height={90}
                  />
                  <div className="absolute top-0 left-0 flex h-full w-full items-end">
                    <img
                      src={"/assets/blur-shadow.png"}
                      alt="blur shadow"
                      className="h-2/3 w-full"
                    />
                  </div>
                  <div className="absolute inset-x-0 top-0 mx-auto h-px w-full bg-gradient-to-r from-transparent via-white/50 to-transparent shadow-2xl" />
                </div>
              </div>
              <Button
                variant="primary"
                className="mt-6 sm:mt-6 w-full 2xl:h-11 2xl:text-base"
              >
                Create a Referral Link
              </Button>
            </div>

            {/* MISSIONS */}
            <div className="flex-1">
              <div className="h-full rounded-lg bg-white/5 p-4 2xl:p-5 flex flex-col">
                <h1 className="mb-2 2xl:mb-3 text-sm sm:text-lg 2xl:text-xl font-medium">
                  Your Mission
                </h1>
                <div className="flex flex-col gap-2 2xl:gap-3 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 2xl:gap-4 rounded-lg bg-white/5 p-3 2xl:p-4">
                    <div className="inline-flex items-center gap-3 2xl:gap-4">
                      <div className="relative inline-flex gap-1 rounded-lg bg-neutral-80/10 p-2 2xl:p-2.5 border border-white/5">
                        <Image
                          src={"/assets/centuari-single-token.png"}
                          alt="single centuari token"
                          width={22}
                          height={22}
                        />
                        <p className="text-xs sm:text-sm 2xl:text-base font-medium">
                          200 PTS
                        </p>
                        <div className="absolute inset-x-0 top-0 mx-auto h-px w-full bg-gradient-to-r from-transparent via-white/50 to-transparent shadow-2xl" />
                      </div>
                      <p className="text-sm 2xl:text-base font-medium">
                        Supply more than $100
                      </p>
                    </div>
                    <SubmitProofDialog />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 2xl:gap-4 rounded-lg bg-white/5 p-3 2xl:p-4">
                    <div className="inline-flex items-center gap-3 2xl:gap-4">
                      <div className="relative inline-flex gap-1 rounded-lg bg-neutral-80/10 p-2 2xl:p-2.5 border border-white/5">
                        <Image
                          src={"/assets/centuari-single-token.png"}
                          alt="single centuari token"
                          width={22}
                          height={22}
                        />
                        <p className="text-xs sm:text-sm 2xl:text-base font-medium">
                          200 PTS
                        </p>
                        <div className="absolute inset-x-0 top-0 mx-auto h-px w-full bg-gradient-to-r from-transparent via-white/50 to-transparent shadow-2xl" />
                      </div>
                      <p className="text-sm 2xl:text-base font-medium">
                        Supply more than $100
                      </p>
                    </div>
                    <div className="relative h-6 w-6 2xl:h-7 2xl:w-7 shrink-0">
                      <svg
                        className="h-full w-full -rotate-90 transform"
                        viewBox="0 0 36 36"
                      >
                        <circle
                          cx="18"
                          cy="18"
                          r="16"
                          fill="none"
                          stroke="#374151"
                          strokeWidth="4"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="16"
                          fill="none"
                          stroke="white"
                          strokeWidth="4"
                          strokeDasharray="75 25"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  </div>

                  <div className="flex-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
    </PageContainer>
  );
}
