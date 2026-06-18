import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { CentuariGlassSurface } from "./centuari-glass-surface";

export function CentuariTooltip({
	children,
	message,
}: {
	children: React.ReactNode;
	message: string;
}) {
	return (
		<TooltipPrimitive.Provider delayDuration={0}>
			<TooltipPrimitive.Root>
				<TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
				<TooltipPrimitive.Portal>
					<TooltipPrimitive.Content
						sideOffset={8}
						collisionPadding={12}
						className="z-200 max-w-xs animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-tooltip-content-transform-origin)"
					>
						<CentuariGlassSurface
							intensity="soft"
							className="rounded-lg bg-black/40 backdrop-blur-xl"
						>
							<p className="px-3 py-2 text-center text-sm leading-snug text-white">
								{message}
							</p>
						</CentuariGlassSurface>
					</TooltipPrimitive.Content>
				</TooltipPrimitive.Portal>
			</TooltipPrimitive.Root>
		</TooltipPrimitive.Provider>
	);
}
