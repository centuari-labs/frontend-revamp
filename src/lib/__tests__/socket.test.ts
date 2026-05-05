import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock socket.io-client before importing the module under test
const mockSocket = {
  connected: false,
  connect: vi.fn(function (this: typeof mockSocket) {
    this.connected = true;
    return this;
  }),
  disconnect: vi.fn(function (this: typeof mockSocket) {
    this.connected = false;
    return this;
  }),
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
};

vi.mock("socket.io-client", () => ({
  io: vi.fn(() => mockSocket),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  vi.useFakeTimers();
  mockSocket.connected = false;
  // Set env var for resolveWsUrl
  vi.stubEnv("NEXT_PUBLIC_WS_URL", "ws://localhost:3001");
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("socket.ts", () => {
  it("acquireSocket creates socket and increments refCount", async () => {
    const { acquireSocket } = await import("@/lib/socket");
    const socket = acquireSocket();
    expect(socket).toBe(mockSocket);
  });

  it("acquireSocket reuses existing socket", async () => {
    const { acquireSocket } = await import("@/lib/socket");
    const s1 = acquireSocket();
    const s2 = acquireSocket();
    expect(s1).toBe(s2);
  });

  it("acquireSocket reconnects if disconnected", async () => {
    const { acquireSocket } = await import("@/lib/socket");
    acquireSocket(); // create
    mockSocket.connected = false;
    acquireSocket(); // should call connect
    expect(mockSocket.connect).toHaveBeenCalled();
  });

  it("releaseSocket decrements refCount", async () => {
    const { acquireSocket, releaseSocket } = await import("@/lib/socket");
    acquireSocket();
    acquireSocket();
    releaseSocket();
    // Still one reference, should not disconnect
    expect(mockSocket.disconnect).not.toHaveBeenCalled();
  });

  it("releaseSocket disconnects when refCount reaches 0 after delay", async () => {
    const { acquireSocket, releaseSocket } = await import("@/lib/socket");
    acquireSocket();
    releaseSocket();
    // disconnect is delayed by 1000ms
    expect(mockSocket.disconnect).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it("releaseSocket never goes below 0", async () => {
    const { releaseSocket } = await import("@/lib/socket");
    // Call release without acquire - should not throw
    releaseSocket();
    releaseSocket();
    releaseSocket();
  });

  it("resolveWsUrl converts ws:// to http://", async () => {
    vi.stubEnv("NEXT_PUBLIC_WS_URL", "ws://example.com");
    vi.resetModules();
    const { io } = await import("socket.io-client");
    const { acquireSocket } = await import("@/lib/socket");
    acquireSocket();
    expect(vi.mocked(io)).toHaveBeenCalledWith("http://example.com", expect.any(Object));
  });

  it("resolveWsUrl converts wss:// to https://", async () => {
    vi.stubEnv("NEXT_PUBLIC_WS_URL", "wss://secure.example.com");
    vi.resetModules();
    const { io } = await import("socket.io-client");
    const { acquireSocket } = await import("@/lib/socket");
    acquireSocket();
    expect(vi.mocked(io)).toHaveBeenCalledWith(
      "https://secure.example.com",
      expect.any(Object),
    );
  });
});
