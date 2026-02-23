import { type NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

async function handler(
	req: NextRequest,
	{ params }: { params: Promise<{ path: string[] }> },
) {
	const { path } = await params;
	const targetUrl = `${BACKEND_URL}/${path.join("/")}`;

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
		headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
	});
}

export { handler as GET, handler as POST, handler as PATCH, handler as PUT, handler as DELETE };
