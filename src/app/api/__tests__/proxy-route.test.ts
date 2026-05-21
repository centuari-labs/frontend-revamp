import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock fetch before importing the handler
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const { GET, POST, PUT, PATCH, DELETE } = await import(
	"@/app/api/[...path]/route"
);

function makeRequest(
	path: string,
	options: {
		method?: string;
		headers?: Record<string, string>;
		body?: string;
	} = {},
) {
	const { method = "GET", headers = {}, body } = options;
	const url = `http://localhost:3200/api/${path}`;
	return new NextRequest(url, {
		method,
		headers: new Headers(headers),
		body,
	});
}

function makeParams(path: string) {
	return { params: Promise.resolve({ path: path.split("/") }) };
}

function mockBackendResponse(
	body = '{"statusCode":200,"data":"ok"}',
	status = 200,
	contentType = "application/json",
) {
	mockFetch.mockResolvedValue({
		text: async () => body,
		status,
		headers: new Headers({ "Content-Type": contentType }),
	});
}

beforeEach(() => {
	vi.clearAllMocks();
	mockBackendResponse();
});

// ─── Path Whitelist ─────────────────────────────────────────────────────────

describe("path whitelist", () => {
	it.each([
		["auth/login", "POST"],
		["auth/redeem-access-code", "POST"],
		["auth/name", "PATCH"],
		["market", "GET"],
		["market/some-asset-id", "GET"],
		["market/some-asset-id/rate-history", "GET"],
		["orders/lend/limit", "POST"],
		["orders/borrow/market", "POST"],
		["orders/some-id/cancel", "POST"],
		["portfolio/my-portfolio", "GET"],
		["portfolio/my-position", "GET"],
		["portfolio/order-history", "GET"],
		["portfolio/open-orders", "GET"],
		["portfolio/is-collateral", "PUT"],
		["portfolio/repay", "POST"],
		["portfolio/withdraw-lend-position", "POST"],
		["deposit", "POST"],
		["deposit/tokens", "GET"],
		["deposit/confirm", "POST"],
		["deposit/balance/some-asset", "GET"],
		["withdraw", "POST"],
		["faucet/request-tokens", "POST"],
	])("allows %s (%s)", async (path, method) => {
		const handlers: Record<string, typeof GET> = {
			GET,
			POST,
			PUT,
			PATCH,
			DELETE,
		};
		const handler = handlers[method] ?? GET;
		const req = makeRequest(path, { method });
		const res = await handler(req, makeParams(path));

		expect(res.status).toBe(200);
		expect(mockFetch).toHaveBeenCalledOnce();
	});

	it.each([
		"admin/users",
		"internal/debug",
		"graphql",
		"config",
		"health",
		"__internal/secret",
		"",
	])("blocks disallowed path: %s", async (path) => {
		const req = makeRequest(path || "blocked");
		const segments = path ? path : "blocked";
		const res = await GET(req, makeParams(segments));

		expect(res.status).toBe(403);
		const body = await res.json();
		expect(body.error).toBe("Endpoint not allowed");
		expect(mockFetch).not.toHaveBeenCalled();
	});
});

// ─── Path Traversal / Sanitization ──────────────────────────────────────────

describe("path sanitization", () => {
	it("blocks path traversal with ..", async () => {
		const req = makeRequest("market/../etc/passwd");
		const res = await GET(req, makeParams("market/../etc/passwd"));

		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.error).toBe("Invalid path");
		expect(mockFetch).not.toHaveBeenCalled();
	});

	it("blocks double slashes", async () => {
		const req = makeRequest("market//data");
		const res = await GET(req, makeParams("market//data"));

		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.error).toBe("Invalid path");
		expect(mockFetch).not.toHaveBeenCalled();
	});

	it("blocks .. at the beginning of path", async () => {
		const req = makeRequest("../../../etc/passwd");
		const res = await GET(req, makeParams("../../../etc/passwd"));

		expect(res.status).toBe(400);
		expect(mockFetch).not.toHaveBeenCalled();
	});

	it("blocks encoded traversal in joined segments", async () => {
		// Next.js decodes segments before they hit the handler, so
		// path segments like ["..", "etc", "passwd"] would join to "../etc/passwd"
		const req = makeRequest("market/..%2Fetc%2Fpasswd");
		const res = await GET(
			req,
			makeParams("market/..%2Fetc%2Fpasswd"),
		);

		// This contains ".." so should be blocked
		expect(res.status).toBe(400);
		expect(mockFetch).not.toHaveBeenCalled();
	});
});

// ─── SSRF Prevention ────────────────────────────────────────────────────────

describe("SSRF prevention", () => {
	it("cannot proxy to internal services via path manipulation", async () => {
		const req = makeRequest("internal-service/admin");
		const res = await GET(req, makeParams("internal-service/admin"));

		expect(res.status).toBe(403);
		expect(mockFetch).not.toHaveBeenCalled();
	});

	it("cannot access cloud metadata endpoint patterns", async () => {
		const req = makeRequest("latest/meta-data");
		const res = await GET(req, makeParams("latest/meta-data"));

		expect(res.status).toBe(403);
		expect(mockFetch).not.toHaveBeenCalled();
	});

	it("only forwards Authorization and Content-Type headers", async () => {
		const req = makeRequest("market", {
			headers: {
				authorization: "Bearer token123",
				"content-type": "application/json",
				"x-custom-header": "malicious",
				cookie: "session=hijacked",
				host: "evil.com",
			},
		});
		await GET(req, makeParams("market"));

		const [, fetchOptions] = mockFetch.mock.calls[0];
		expect(fetchOptions.headers).toEqual({
			Authorization: "Bearer token123",
			"Content-Type": "application/json",
		});
		// Verify dangerous headers are NOT forwarded
		expect(fetchOptions.headers).not.toHaveProperty("cookie");
		expect(fetchOptions.headers).not.toHaveProperty("x-custom-header");
		expect(fetchOptions.headers).not.toHaveProperty("host");
	});
});

// ─── Proxy Behavior ─────────────────────────────────────────────────────────

describe("proxy forwarding", () => {
	it("forwards GET requests without body", async () => {
		const req = makeRequest("market?page=1", { method: "GET" });
		await GET(req, makeParams("market"));

		const [url, options] = mockFetch.mock.calls[0];
		expect(url).toContain("/market");
		expect(url).toContain("page=1");
		expect(options.method).toBe("GET");
		expect(options.body).toBeUndefined();
	});

	it("forwards POST requests with body", async () => {
		const body = JSON.stringify({ amount: "100" });
		const req = makeRequest("orders/lend/limit", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body,
		});
		await POST(req, makeParams("orders/lend/limit"));

		const [, options] = mockFetch.mock.calls[0];
		expect(options.method).toBe("POST");
		expect(options.body).toBe(body);
	});

	it("preserves backend response status codes", async () => {
		mockFetch.mockResolvedValue({
			text: async () => '{"error":"Not Found"}',
			status: 404,
			headers: new Headers({ "Content-Type": "application/json" }),
		});

		const req = makeRequest("market/nonexistent");
		const res = await GET(req, makeParams("market/nonexistent"));

		expect(res.status).toBe(404);
	});

	it("forwards query string parameters to backend", async () => {
		const req = makeRequest("portfolio/order-history?page=2&limit=10&side=lend");
		await GET(req, makeParams("portfolio/order-history"));

		const [url] = mockFetch.mock.calls[0];
		expect(url).toContain("page=2");
		expect(url).toContain("limit=10");
		expect(url).toContain("side=lend");
	});
});

// ─── BACKEND_URL normalization ──────────────────────────────────────────────

describe("BACKEND_URL trailing slash", () => {
	it("strips a trailing slash so the upstream path is not doubled", async () => {
		vi.resetModules();
		const originalBackendUrl = process.env.BACKEND_URL;
		process.env.BACKEND_URL = "http://backend.example/";

		const localFetch = vi.fn().mockResolvedValue({
			text: async () => '{"ok":true}',
			status: 200,
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		vi.stubGlobal("fetch", localFetch);

		try {
			const { POST: PostHandler } = await import(
				"@/app/api/[...path]/route"
			);
			const req = makeRequest("auth/login", { method: "POST" });
			await PostHandler(req, makeParams("auth/login"));

			const [url] = localFetch.mock.calls[0];
			expect(url).toBe("http://backend.example/auth/login");
			expect(url).not.toContain("//auth");
		} finally {
			process.env.BACKEND_URL = originalBackendUrl;
			vi.stubGlobal("fetch", mockFetch);
			vi.resetModules();
		}
	});

	it("also strips multiple trailing slashes", async () => {
		vi.resetModules();
		const originalBackendUrl = process.env.BACKEND_URL;
		process.env.BACKEND_URL = "http://backend.example///";

		const localFetch = vi.fn().mockResolvedValue({
			text: async () => "{}",
			status: 200,
			headers: new Headers({ "Content-Type": "application/json" }),
		});
		vi.stubGlobal("fetch", localFetch);

		try {
			const { GET: GetHandler } = await import(
				"@/app/api/[...path]/route"
			);
			const req = makeRequest("market");
			await GetHandler(req, makeParams("market"));

			const [url] = localFetch.mock.calls[0];
			expect(url).toBe("http://backend.example/market");
		} finally {
			process.env.BACKEND_URL = originalBackendUrl;
			vi.stubGlobal("fetch", mockFetch);
			vi.resetModules();
		}
	});
});

// ─── HTTP Methods ───────────────────────────────────────────────────────────

describe("HTTP methods", () => {
	it("handles PATCH requests", async () => {
		const req = makeRequest("auth/name", {
			method: "PATCH",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ name: "test" }),
		});
		const res = await PATCH(req, makeParams("auth/name"));

		expect(res.status).toBe(200);
		const [, options] = mockFetch.mock.calls[0];
		expect(options.method).toBe("PATCH");
	});

	it("handles PUT requests", async () => {
		const req = makeRequest("portfolio/is-collateral", {
			method: "PUT",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ assetId: "1", isCollateral: true }),
		});
		const res = await PUT(req, makeParams("portfolio/is-collateral"));

		expect(res.status).toBe(200);
		const [, options] = mockFetch.mock.calls[0];
		expect(options.method).toBe("PUT");
	});

	it("handles DELETE requests", async () => {
		const req = makeRequest("orders/some-id", {
			method: "DELETE",
			headers: { "content-type": "application/json" },
		});
		const res = await DELETE(req, makeParams("orders/some-id"));

		expect(res.status).toBe(200);
	});
});
