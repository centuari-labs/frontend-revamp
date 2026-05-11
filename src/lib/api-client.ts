const API_URL = "/api";

interface ApiResponse<T> {
	statusCode: number;
	data: T;
}

export class AuthError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "AuthError";
	}
}

/**
 * Thrown for non-2xx responses where the server payload carries a structured
 * `code` (e.g. `RATE_LIMITED`, `COLLATERAL_LIMIT_EXCEEDED`, `FlagLockActive`).
 * Callers branch on `err.code`; the human-readable `err.message` is still set
 * for fallbacks. Extends `Error` so existing `catch (err)` blocks keep working.
 */
export class ApiError extends Error {
	code?: string;
	currentCount?: number;
	cap?: number;
	retryAfterSeconds?: number;
	unlocksAt?: string | number;

	constructor(message: string, body?: unknown) {
		super(message);
		this.name = "ApiError";
		if (body && typeof body === "object") {
			const b = body as Record<string, unknown>;
			if (typeof b.code === "string") this.code = b.code;
			if (typeof b.currentCount === "number")
				this.currentCount = b.currentCount;
			if (typeof b.cap === "number") this.cap = b.cap;
			if (typeof b.retryAfterSeconds === "number") {
				this.retryAfterSeconds = b.retryAfterSeconds;
			}
			if (typeof b.unlocksAt === "string" || typeof b.unlocksAt === "number") {
				this.unlocksAt = b.unlocksAt;
			}
		}
	}
}

export async function apiClient<T>(
	path: string,
	options: { method?: string; body?: unknown; token?: string } = {},
): Promise<T> {
	const { method = "GET", body, token } = options;

	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};

	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	const res = await fetch(`${API_URL}${path}`, {
		method,
		headers,
		body: body ? JSON.stringify(body) : undefined,
	});

	if (!res.ok) {
		let message = `API error: ${res.status} ${res.statusText}`;
		let structuredBody: Record<string, unknown> | undefined;
		try {
			const errorBody = await res.json();
			const msg = errorBody?.message;
			if (typeof msg === "string") {
				message = msg;
			} else if (Array.isArray(msg)) {
				message = msg.join(", ");
			} else if (msg && typeof msg === "object") {
				// NestJS HttpException wraps a structured payload as `message`.
				// Two shapes occur in this codebase:
				//   { statusCode, message: "human string", error }
				//   { statusCode, message: { code, ...fields } }
				// The second is our structured-error case.
				const obj = msg as Record<string, unknown>;
				if (typeof obj.message === "string") {
					message = obj.message;
				}
				structuredBody = obj;
			}
		} catch {
			// response body is not JSON — keep the default message
		}

		if (res.status === 401) {
			throw new AuthError(message);
		}
		throw new ApiError(message, structuredBody);
	}

	const json: ApiResponse<T> = await res.json();
	return json.data;
}
