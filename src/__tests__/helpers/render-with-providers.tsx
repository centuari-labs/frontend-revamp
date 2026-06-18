import type React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, type RenderHookOptions } from "@testing-library/react";

export function createTestQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: { retry: false },
		},
	});
}

export function renderHookWithProviders<Result, Props>(
	hook: (props: Props) => Result,
	options?: Omit<RenderHookOptions<Props>, "wrapper">,
) {
	const queryClient = createTestQueryClient();
	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
	return renderHook(hook, { wrapper, ...options });
}
