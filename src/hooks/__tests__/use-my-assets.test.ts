import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHookWithProviders } from "@/__tests__/helpers/render-with-providers";

// ─── Mock USE_MOCK=false for API mode ────────────────────────────────

vi.mock("@/lib/use-mock", () => ({ USE_MOCK: false }));

vi.mock("@/lib/api", () => ({
  getMyAssets: vi.fn(),
}));

vi.mock("@/hooks/use-auth-token", () => ({
  useAuthToken: () => ({
    getToken: vi.fn().mockResolvedValue("test-jwt-token"),
    authFetch: vi.fn((fn: (t: string) => Promise<unknown>) => fn("test-jwt-token")),
  }),
}));

import { getMyAssets } from "@/lib/api";
const mockGetMyAssets = vi.mocked(getMyAssets);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useMyAssets (API mode)", () => {
  async function getHook() {
    const { useMyAssets } = await import("@/hooks/use-my-assets");
    return useMyAssets;
  }

  it("returns empty assets initially while loading", async () => {
    mockGetMyAssets.mockReturnValue(new Promise(() => {})); // never resolves
    const useMyAssets = await getHook();
    const { result } = renderHookWithProviders(() => useMyAssets());

    expect(result.current.assets).toEqual([]);
    expect(result.current.isLoading).toBe(true);
  });

  it("returns assets on successful fetch", async () => {
    const mockAssets = [
      {
        symbol: "USDC",
        name: "USD Coin",
        walletBalance: 5000,
        amountInUsd: 5000,
        isCollateral: false,
        imageUrl: null,
      },
      {
        symbol: "ETH",
        name: "Ethereum",
        walletBalance: 2.5,
        amountInUsd: 7500,
        isCollateral: true,
        imageUrl: null,
      },
    ];

    mockGetMyAssets.mockResolvedValue(mockAssets);

    const useMyAssets = await getHook();
    const { result } = renderHookWithProviders(() => useMyAssets());

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.assets).toEqual(mockAssets);
    expect(result.current.assets).toHaveLength(2);
    expect(result.current.isError).toBe(false);
  });

  it("passes auth token to getMyAssets", async () => {
    mockGetMyAssets.mockResolvedValue([]);

    const useMyAssets = await getHook();
    renderHookWithProviders(() => useMyAssets());

    await vi.waitFor(() => {
      expect(mockGetMyAssets).toHaveBeenCalledWith("test-jwt-token");
    });
  });

  it("returns error state on failure", async () => {
    mockGetMyAssets.mockRejectedValue(new Error("API error"));

    const useMyAssets = await getHook();
    const { result } = renderHookWithProviders(() => useMyAssets());

    await vi.waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.assets).toEqual([]);
  });
});

describe("useMyAssets (mock mode)", () => {
  it("returns empty assets when USE_MOCK is true", async () => {
    // Re-mock USE_MOCK=true for this test
    vi.doMock("@/lib/use-mock", () => ({ USE_MOCK: true }));

    const { useMyAssets } = await import("@/hooks/use-my-assets");
    const { result } = renderHookWithProviders(() => useMyAssets());

    // Query should not fire (enabled: false)
    expect(result.current.assets).toEqual([]);
    expect(mockGetMyAssets).not.toHaveBeenCalled();

    // Restore
    vi.doMock("@/lib/use-mock", () => ({ USE_MOCK: false }));
  });
});
