// The API proxy only ever forwards JSON bodies — there are no FormData/file
// uploads anywhere in the codebase. Constrain the Content-Type it forwards to
// the backend to an allowlist so a hostile client cannot smuggle an arbitrary
// type; anything else (or anything malformed) is normalized to application/json.
const ALLOWED_CONTENT_TYPES = new Set<string>(["application/json"]);

export function sanitizeContentType(contentType: string | null): string {
	if (!contentType) return "application/json";
	// Drop charset/boundary params and compare case-insensitively.
	const base = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
	return ALLOWED_CONTENT_TYPES.has(base) ? base : "application/json";
}
