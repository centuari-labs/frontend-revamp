import * as TooltipPrimitive from "@radix-ui/react-tooltip";

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
        <TooltipPrimitive.Trigger asChild>
          {children}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            sideOffset={8}
            className="z-[200] w-fit rounded-md px-3 py-1.5 text-xs text-balance bg-white/10 backdrop-blur-xl border border-white/15 text-white shadow-lg shadow-black/20 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-tooltip-content-transform-origin)"
          >
            <p className="text-sm">{message}</p>
            <TooltipPrimitive.Arrow asChild>
              <svg
                width="10"
                height="6"
                viewBox="0 0 10 6"
                className="fill-white/20 drop-shadow-sm"
              >
                <path d="M5 6L0 0h10L5 6z" />
              </svg>
            </TooltipPrimitive.Arrow>
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
