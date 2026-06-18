import type { NextConfig } from "next";

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://auth.privy.io https://*.walletconnect.com https://*.walletconnect.org;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https://assets.coingecko.com https://avatars.githubusercontent.com https://auth.privy.io;
  font-src 'self' data:;
  connect-src 'self' https://auth.privy.io https://*.privy.io https://*.walletconnect.com https://*.walletconnect.org wss://*.walletconnect.com wss://*.walletconnect.org wss://*.centuari.finance https://*.centuari.finance https://*.arbitrum.io https://*.alchemyapi.io https://*.infura.io;
  frame-src 'self' https://auth.privy.io https://*.walletconnect.com https://*.walletconnect.org;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
`;

const nextConfig: NextConfig = {
	images: {
		formats: ["image/avif", "image/webp"],
		// Specific hostnames + pathname constraints. Never use a wildcard hostname —
		// it turns /_next/image into an SSRF gateway.
		// See docs/audits/2026-05-08-frontend-review/forward-looking-hardening.md
		remotePatterns: [
			{
				protocol: "https",
				hostname: "assets.coingecko.com",
				pathname: "/coins/images/**",
			},
			{
				protocol: "https",
				hostname: "avatars.githubusercontent.com",
				pathname: "/u/**",
			},
			{ protocol: "https", hostname: "auth.privy.io", pathname: "/**" },
		],
		// Keep false — SVG enables stored XSS via crafted <script>/<foreignObject>.
		dangerouslyAllowSVG: false,
		// Serve as download instead of inline-rendering, in case an upstream
		// redirect points /_next/image at non-image content.
		contentDispositionType: "attachment",
		minimumCacheTTL: 60,
	},
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [
					{
						key: "Content-Security-Policy",
						value: ContentSecurityPolicy.replace(/\s{2,}/g, " ").trim(),
					},
					{
						key: "X-Frame-Options",
						value: "DENY",
					},
					{
						key: "X-Content-Type-Options",
						value: "nosniff",
					},
					{
						key: "Strict-Transport-Security",
						value: "max-age=31536000; includeSubDomains",
					},
					{
						key: "Referrer-Policy",
						value: "strict-origin-when-cross-origin",
					},
					{
						key: "Permissions-Policy",
						value: "camera=(), microphone=(), geolocation=()",
					},
				],
			},
		];
	},
};

export default nextConfig;
