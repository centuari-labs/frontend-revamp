import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

const mockUsePrivy = vi.fn();

vi.mock("@privy-io/react-auth", () => ({
  usePrivy: () => mockUsePrivy(),
}));

import { useAccountName } from "@/hooks/use-account-name";

beforeEach(() => {
  localStorage.clear();
  mockUsePrivy.mockReturnValue({
    authenticated: false,
    ready: true,
    user: null,
  });
});

describe("useAccountName", () => {
  it("returns stored name from localStorage", () => {
    localStorage.setItem("centuari_username", "Alice");
    const { result } = renderHook(() => useAccountName());
    expect(result.current).toBe("Alice");
  });

  it("returns null when not authenticated and no stored name", () => {
    const { result } = renderHook(() => useAccountName());
    expect(result.current).toBeNull();
  });

  it("returns email username when authenticated", () => {
    mockUsePrivy.mockReturnValue({
      authenticated: true,
      ready: true,
      user: { email: { address: "alice@example.com" } },
    });
    const { result } = renderHook(() => useAccountName());
    expect(result.current).toBe("alice");
  });

  it("returns Google name as fallback", () => {
    mockUsePrivy.mockReturnValue({
      authenticated: true,
      ready: true,
      user: { google: { name: "Bob Smith" } },
    });
    const { result } = renderHook(() => useAccountName());
    expect(result.current).toBe("Bob Smith");
  });

  it("returns Twitter name as fallback", () => {
    mockUsePrivy.mockReturnValue({
      authenticated: true,
      ready: true,
      user: { twitter: { name: "carol_tw" } },
    });
    const { result } = renderHook(() => useAccountName());
    expect(result.current).toBe("carol_tw");
  });

  it("returns 'User' when authenticated with no profile info", () => {
    mockUsePrivy.mockReturnValue({
      authenticated: true,
      ready: true,
      user: {},
    });
    const { result } = renderHook(() => useAccountName());
    expect(result.current).toBe("User");
  });
});
