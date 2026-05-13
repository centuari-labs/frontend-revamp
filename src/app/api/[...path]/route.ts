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
	"collateral/",
];

function isPathAllowed(path: string): boolean {
	return ALLOWED_PATH_PREFIXES.some(
		(prefix) => path === prefix.replace(/\/$/, "") || path.startsWith(prefix),
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
