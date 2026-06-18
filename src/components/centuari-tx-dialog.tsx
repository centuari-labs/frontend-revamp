"use client";

import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { CentuariButton } from "./centuari-button";
import { Headphones } from "lucide-react";
import Image from "next/image";
import { CentuariTypography } from "./centuari-typography";

type txDialogType = "success" | "failed";

export function CentuariTxDialog({
	type,
	title,
	description,
}: {
	type: txDialogType;
	title: string;
	description: string;
}) {
	const result: Record<
		txDialogType,
		{ title: string; description: string; image: string }
	> = {
		success: {
			title,
			description,
			image: "/assets/tx-success.webp",
		},
		failed: {
			title,
			description,
			image: "/assets/tx-failed.webp",
		},
	};
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="primary-dark" className="flex-1">
					Tx Failed
				</Button>
			</DialogTrigger>
			<DialogContent className="flex max-h-[min(600px,80vh)] flex-col gap-0 p-0 sm:max-w-md data-[state=open]:!zoom-in-0 data-[state=open]:duration-600">
				<DialogHeader className="contents space-y-0 text-left">
					<div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
						<div className="absolute w-[568px] h-[450px] -top-72 left-0 bg-primary-blue-base/50 blur-[264px] opacity-100 transition-opacity duration-500" />
						<div className="absolute w-[150px] h-[216px] -top-60 left-1/3 bg-white blur-3xl opacity-100 transition-opacity duration-500" />
					</div>
					<div className="mt-6 px-6 flex items-center justify-center flex-col gap-4">
						{result[type] && (
							<>
								<Image
									src={result[type].image}
									alt={result[type].title}
									width={116}
									height={124}
								/>
								<CentuariTypography className="text-2xl font-semibold">
									{result[type].title}
								</CentuariTypography>
								<CentuariTypography className="text-center text-muted-foreground">
									{result[type].description}
								</CentuariTypography>
							</>
						)}
					</div>
				</DialogHeader>
				{type === "success" ? (
					<DialogFooter className="flex-row items-center justify-end px-6 py-4">
						<DialogClose asChild>
							<CentuariButton variant="secondary" className="flex-1">
								Done
							</CentuariButton>
						</DialogClose>
						<Button type="button" variant={"primary"} className="flex-1">
							View Portfolio
						</Button>
					</DialogFooter>
				) : (
					<DialogFooter className="flex-row items-center justify-end px-6 py-4">
						<DialogClose asChild>
							<CentuariButton variant="secondary">
								<Headphones /> Contact Support
							</CentuariButton>
						</DialogClose>
						<Button type="button" variant={"primary"} className="flex-1">
							Try Again
						</Button>
					</DialogFooter>
				)}
			</DialogContent>
		</Dialog>
	);
}
