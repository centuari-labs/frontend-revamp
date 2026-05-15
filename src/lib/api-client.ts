const API_URL = "/api";

interface ApiResponse<T> {
	statusCode: number;
	data: T;
	meta?: Record<string, unknown>;
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

export interface ApiClientOptions {
	method?: string;
	body?: unknown;
	token?: string;
	params?: Record<string, string | number | undefined>;
}

function buildUrl(path: string, params?: ApiClientOptions["params"]): string {
	if (!params) return `${API_URL}${path}`;
	const sp = new URLSearchParams();
	for (const [key, val] of Object.entries(params)) {
		if (val !== undefined && val !== null) sp.set(key, String(val));
	}
	const qs = sp.toString();
	return qs ? `${API_URL}${path}?${qs}` : `${API_URL}${path}`;
}

async function executeRequest<T>(
	path: string,
	options: ApiClientOptions,
): Promise<ApiResponse<T>> {
	const { method = "GET", body, token, params } = options;

	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};

	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	const res = await fetch(buildUrl(path, params), {
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

	return res.json() as Promise<ApiResponse<T>>;
}

export async function apiClient<T>(
	path: string,
	options: ApiClientOptions = {},
): Promise<T> {
	const json = await executeRequest<T>(path, options);
	return json.data;
}

/**
 * Variant of `apiClient` for paginated endpoints that need both `data` and the
 * sibling `meta` envelope (page, limit, totalData/totalPages, total, etc.).
 * Shape of `meta` is endpoint-specific — callers narrow it with `Number(meta.x)`
 * coercion.
 */
export async function apiClientPaginated<T>(
	path: string,
	options: ApiClientOptions = {},
): Promise<{ data: T; meta: Record<string, unknown> }> {
	const json = await executeRequest<T>(path, options);
	return { data: json.data, meta: json.meta ?? {} };
}
