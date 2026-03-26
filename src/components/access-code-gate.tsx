"use client";

import { type FormEvent, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CentuariLoginDialog } from "@/components/centuari-login-dialog";
import { useAccessContext } from "@/contexts/access-context";
import { useAuthToken } from "@/hooks/use-auth-token";
import { redeemAccessCode } from "@/lib/api";

export function AccessCodeGate({ children }: { children: React.ReactNode }) {
	const { ready, authenticated } = usePrivy();
	const { hasAccess, isChecked } = useAccessContext();

	// Privy still initializing — show loading overlay to avoid flash
	if (!ready) {
		return (
			<>
				{children}
				<LoadingOverlay />
			</>
		);
	}

	// Not logged in — show login dialog over blurred app
	if (!authenticated) {
		return (
			<>
				{children}
				<div className="fixed inset-0 z-50 backdrop-blur-md bg-black/40" />
				<CentuariLoginDialog
					open
					onOpenChange={() => {}}
					showTrigger={false}
					showCloseButton={false}
				/>
			</>
		);
	}

	// Logged in but backend hasn't responded yet — show loading overlay
	if (!isChecked) {
		return (
			<>
				{children}
				<LoadingOverlay />
			</>
		);
	}

	// Logged in and has access — render app
	if (hasAccess) {
		return <>{children}</>;
	}

	// Logged in but no access — show access code gate
	return (
		<>
			{children}
			<AccessCodeForm />
		</>
	);
}

function LoadingOverlay() {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/40">
			<Loader2 className="w-8 h-8 animate-spin text-white/60" />
		</div>
	);
}

function AccessCodeForm() {
	const [code, setCode] = useState("");
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { getToken } = useAuthToken();
	const { setHasAccess } = useAccessContext();

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setError("");

		const trimmed = code.trim();
		if (!trimmed) {
			setError("Please enter an access code");
			return;
		}

		setIsSubmitting(true);
		try {
			const token = await getToken();
			if (!token) {
				setError("Authentication error. Please refresh and try again.");
				return;
			}

			await redeemAccessCode(trimmed, token);
			setHasAccess(true);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to redeem access code",
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/40">
			<div className="w-full max-w-sm mx-4 rounded-xl border border-white/10 bg-black/60 backdrop-blur-xl p-8">
				<div className="flex flex-col items-center gap-6">
					<div className="relative">
						<div className="absolute inset-0 bg-primary-blue-base/20 blur-xl rounded-full" />
						<img
							src="/centuari-logo.png"
							alt="Centuari"
							className="w-16 h-16 relative z-10"
						/>
					</div>

					<div className="text-center">
						<h1 className="text-xl font-semibold text-white">
							Welcome to Centuari
						</h1>
						<p className="mt-2 text-sm text-muted-foreground">
							Enter your access code to continue
						</p>
					</div>

					<form onSubmit={handleSubmit} className="w-full space-y-4">
						<div className="space-y-2">
							<Input
								value={code}
								onChange={(e) => {
									setCode(e.target.value);
									setError("");
								}}
								placeholder="Enter access code"
								autoFocus
								autoComplete="off"
								className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
							/>
							{error && (
								<p className="text-sm text-destructive">{error}</p>
							)}
						</div>

						<Button
							type="submit"
							variant="primary"
							className="w-full"
							disabled={isSubmitting}
						>
							{isSubmitting ? (
								<>
									<Loader2 className="w-4 h-4 animate-spin" />
									Verifying...
								</>
							) : (
								"Continue"
							)}
						</Button>
					</form>
				</div>
			</div>
		</div>
	);
}
