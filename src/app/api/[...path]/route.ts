import { type NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

/**
 * Allowed API path prefixes. Requests to paths not matching any prefix are rejected.
 */
const ALLOWED_PATH_PREFIXES = [
	"auth/",
	"market",
	"orders/",
	"portfolio/",
	"deposit",
	"withdraw",
	"faucet/",
];

function isPathAllowed(path: string): boolean {
	return ALLOWED_PATH_PREFIXES.some(
		(prefix) => path === prefix.replace(/\/$/, "") || path.startsWith(prefix),
	);
}

/**
 * Simple in-memory rate limiter: max requests per window per IP.
 */
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 100;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
	const now = Date.now();
	const entry = rateLimitMap.get(ip);

	if (!entry || now >= entry.resetAt) {
		rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
		return false;
	}

	entry.count += 1;
	return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

// Periodically clean up expired entries to prevent memory leaks
setInterval(() => {
	const now = Date.now();
	for (const [ip, entry] of rateLimitMap) {
		if (now >= entry.resetAt) {
			rateLimitMap.delete(ip);
		}
	}
}, RATE_LIMIT_WINDOW_MS);

function getClientIp(req: NextRequest): string {
	return (
		req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
		req.headers.get("x-real-ip") ||
		"unknown"
	);
}

async function handler(
	req: NextRequest,
	{ params }: { params: Promise<{ path: string[] }> },
) {
	const { path } = await params;
	const joinedPath = path.join("/");

	// Block path traversal attempts
	if (joinedPath.includes("..") || joinedPath.includes("//")) {
		return NextResponse.json(
			{ error: "Invalid path" },
			{ status: 400 },
		);
	}

	// Validate against allowed path prefixes
	if (!isPathAllowed(joinedPath)) {
		return NextResponse.json(
			{ error: "Endpoint not allowed" },
			{ status: 403 },
		);
	}

	// Rate limiting
	const clientIp = getClientIp(req);
	if (isRateLimited(clientIp)) {
		return NextResponse.json(
			{ error: "Too many requests" },
			{ status: 429 },
		);
	}

	const targetUrl = `${BACKEND_URL}/${joinedPath}${req.nextUrl.search}`;

	const headers: Record<string, string> = {};
	const authorization = req.headers.get("authorization");
	if (authorization) {
		headers.Authorization = authorization;
	}
	const contentType = req.headers.get("content-type");
	if (contentType) {
		headers["Content-Type"] = contentType;
	}

	const body =
		req.method !== "GET" && req.method !== "HEAD"
			? await req.text()
			: undefined;

	const res = await fetch(targetUrl, {
		method: req.method,
		headers,
		body,
	});

	const responseBody = await res.text();
	return new NextResponse(responseBody, {
		status: res.status,
		headers: {
			"Content-Type":
				res.headers.get("Content-Type") || "application/json",
		},
	});
}

export { handler as GET, handler as POST, handler as PATCH, handler as PUT, handler as DELETE };
