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
		try {
			const errorBody = await res.json();
			const msg = errorBody?.message;
			if (typeof msg === "string") {
				message = msg;
			} else if (Array.isArray(msg)) {
				message = msg.join(", ");
			} else if (msg && typeof msg === "object" && typeof msg.message === "string") {
				// NestJS HttpException wraps response as { statusCode, message, error }
				message = msg.message;
			}
		} catch {
			// response body is not JSON — keep the default message
		}

		if (res.status === 401) {
			throw new AuthError(message);
		}
		throw new Error(message);
	}

	const json: ApiResponse<T> = await res.json();
	return json.data;
}
