import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient } from "@/lib/api-client";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("apiClient", () => {
  it("makes GET request by default", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ statusCode: 200, data: { result: "ok" } }),
    });

    const data = await apiClient("/test");

    expect(mockFetch).toHaveBeenCalledWith("/api/test", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      body: undefined,
    });
    expect(data).toEqual({ result: "ok" });
  });

  it("sends POST with JSON body", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ statusCode: 200, data: { id: 1 } }),
    });

    await apiClient("/orders", {
      method: "POST",
      body: { amount: 100 },
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 100 }),
    });
  });

  it("includes Authorization header when token provided", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ statusCode: 200, data: null }),
    });

    await apiClient("/auth/validate", { token: "my-jwt-token" });

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers.Authorization).toBe("Bearer my-jwt-token");
  });

  it("unwraps {statusCode, data} envelope", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        statusCode: 200,
        data: { markets: [{ id: "1" }] },
      }),
    });

    const result = await apiClient<{ markets: { id: string }[] }>("/market");
    expect(result.markets).toHaveLength(1);
  });

  it("throws on non-2xx status", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
    });

    await expect(apiClient("/protected")).rejects.toThrow(
      "API error: 401 Unauthorized",
    );
  });

  it("throws on 500 error", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    await expect(apiClient("/fail")).rejects.toThrow("API error: 500");
  });

  it("handles PATCH method", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ statusCode: 200, data: { name: "updated" } }),
    });

    const result = await apiClient("/auth/name", {
      method: "PATCH",
      body: { name: "Bob" },
      token: "tok",
    });

    expect(result).toEqual({ name: "updated" });
    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe("PATCH");
  });
});
