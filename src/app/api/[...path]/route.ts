import { type NextRequest, NextResponse } from "next/server";
import { isFaucetEnabled } from "@/lib/faucet-config";

const BACKEND_URL = (
	process.env.BACKEND_URL || "http://localhost:3000"
).replace(/\/+$/, "");

// Exact paths accepted without a subpath (e.g. POST /deposit, POST /withdraw, GET /market).
const ALLOWED_EXACT_PATHS = new Set<string>(["market", "deposit", "withdraw"]);

// Prefix paths — every entry must end with "/" to prevent collisions like
// "market" → "marketing" or "deposit" → "deposit-admin".
const ALLOWED_PATH_PREFIXES = [
	"auth/",
	"market/",
	"orders/",
	"portfolio/",
	"deposit/",
	"withdraw/",
	"faucet/",
	"collateral/",
] as const;

function isPathAllowed(path: string): boolean {
	if (path.startsWith("faucet/")) return isFaucetEnabled();
	if (ALLOWED_EXACT_PATHS.has(path)) return true;
	return ALLOWED_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

async function handler(
	req: NextRequest,
	{ params }: { params: Promise<{ path: string[] }> },
) {
	const { path } = await params;
	const joinedPath = path.join("/");

	// Block path traversal attempts
	if (joinedPath.includes("..") || joinedPath.includes("//")) {
		return NextResponse.json({ error: "Invalid path" }, { status: 400 });
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
			"Content-Type": res.headers.get("Content-Type") || "application/json",
		},
	});
}

export {
	handler as GET,
	handler as POST,
	handler as PATCH,
	handler as PUT,
	handler as DELETE,
};
