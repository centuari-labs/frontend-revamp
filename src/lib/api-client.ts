const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface ApiResponse<T> {
	statusCode: number;
	data: T;
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
		throw new Error(`API error: ${res.status} ${res.statusText}`);
	}

	const json: ApiResponse<T> = await res.json();
	return json.data;
}
