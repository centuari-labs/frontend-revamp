import type { ApiEnvelope } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export class ApiError extends Error {
	constructor(
		public statusCode: number,
		message: string,
	) {
		super(message);
		this.name = "ApiError";
	}
}

export async function apiRequest<T>(
	path: string,
	options: RequestInit = {},
): Promise<T> {
	const url = `${API_URL}${path}`;

	const res = await fetch(url, {
		...options,
		headers: {
			"Content-Type": "application/json",
			...options.headers,
		},
	});

	if (!res.ok) {
		const body = await res.json().catch(() => ({ message: res.statusText }));
		throw new ApiError(res.status, body.message ?? res.statusText);
	}

	const envelope: ApiEnvelope<T> = await res.json();
	return envelope.data;
}

export function authHeaders(token: string): HeadersInit {
	return { Authorization: `Bearer ${token}` };
}
