#!/usr/bin/env node
// Refuse to build against a Next.js version below the CVE-2025-29927 patch
// floor (x-middleware-subrequest auth bypass; patched in 15.2.3 / 14.2.25 /
// 13.5.9 / 12.3.5). Wired into `pnpm build` so a future dependency downgrade
// cannot silently land in production.
//
// See docs/audits/2026-05-08-frontend-review/forward-looking-hardening.md
// and docs/audits/2026-05-08-frontend-review/issues/14-nextjs-config-hardening.md.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const MIN = "15.2.3";

function cmp(a, b) {
	const pa = a.split(".").map(Number);
	const pb = b.split(".").map(Number);
	for (let i = 0; i < 3; i++) {
		const ai = pa[i] ?? 0;
		const bi = pb[i] ?? 0;
		if (ai !== bi) return ai - bi;
	}
	return 0;
}

let version;
try {
	const pkg = JSON.parse(
		readFileSync(resolve("node_modules/next/package.json"), "utf8"),
	);
	version = pkg.version;
} catch (err) {
	console.error(
		"check-next-version: could not read node_modules/next/package.json. " +
			"Run `pnpm install` first.",
	);
	console.error(err.message);
	process.exit(1);
}

if (cmp(version, MIN) < 0) {
	console.error(
		`check-next-version: next ${version} is below the security floor ${MIN} ` +
			"(CVE-2025-29927: x-middleware-subrequest auth bypass). " +
			`Update next to >= ${MIN}.`,
	);
	process.exit(1);
}

console.log(`check-next-version: next ${version} >= ${MIN} ok`);
