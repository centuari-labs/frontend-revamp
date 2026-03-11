"use client";

import { CentuariTypography } from "@/components/centuari-typography";
import { AlertCircle } from "lucide-react";

export function FaucetErrorPage() {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-primary-blue-100/5 rounded-xl border border-white/10 mt-6 overflow-hidden relative">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-500/5 blur-[120px] pointer-events-none" />

            <div className="relative w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
                <AlertCircle className="w-8 h-8 text-red-500" />
            </div>

            <CentuariTypography variant="title-lg" className="font-semibold text-white relative">
                No Faucet Tokens Available
            </CentuariTypography>

            <CentuariTypography variant="body-md" className="text-white/40 mt-3 max-w-md relative leading-relaxed">
                We couldn't find any tokens available for dripping at the moment. Please ensure the backend services are running or try again later.
            </CentuariTypography>
        </div>
    );
}
