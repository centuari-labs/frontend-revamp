/**
 * Fully-automated capture of a Privy authenticated session for e2e tests.
 *
 * Run via: `pnpm test:e2e:capture`
 *
 * The app's login dialog uses Privy's programmatic SIWE flow via
 * `useLoginWithSiwe` (see CentuariConnectWallet). EmbeddedWalletGuard
 * auto-opens the login dialog on every unauthenticated page load — so
 * we never have to click the home-page "Login" button if the dialog
 * is already visible. This script:
 *
 *   1. Injects an EIP-6963 mock wallet provider into the page, backed by a
 *      deterministic test private key. `page.exposeFunction` lets the in-page
 *      mock call out to viem in Node to sign the SIWE message.
 *   2. Drives the open login dialog: detects its current view (wallet picker
 *      vs. login menu vs. home page) and clicks through to the E2E Mock
 *      Wallet entry, which fires handleWalletLogin → eth_requestAccounts →
 *      wallet_switchEthereumChain → personal_sign.
 *   3. Waits for Privy to write its session cookies + localStorage.
 *   4. Persists the browser context to `e2e/.auth/privy.json` (gitignored).
 *
 * The test private key is well-known and committed. It has zero funds on any
 * chain. Anyone with this key can authenticate as the derived address on
 * Centuari's Privy app — acceptable for a testnet-only auth fixture.
 *
 * Runbook: `e2e/.auth/README.md`.
 */

import fs from "node:fs";
import path from "node:path";
import { test } from "@playwright/test";
import { privateKeyToAccount } from "viem/accounts";

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3200";
const STATE_PATH = path.join(__dirname, ".auth", "privy.json");

// Well-known Anvil dev key #0. Testnet auth fixture only — never used to hold
// funds. The canonical EIP-55 address is derived from this at runtime via
// viem (`account.address`) and used everywhere downstream — never hardcode
// the address form here; viem is the source of truth.
const TEST_PRIVATE_KEY =
	"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" as const;
const ACTIVE_CHAIN_ID_HEX = "0x66eee"; // Arbitrum Sepolia (421614)

test("capture Privy session via headless SIWE wallet login", async ({
	page,
	context,
}) => {
	test.setTimeout(120_000);
	fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });

	const account = privateKeyToAccount(TEST_PRIVATE_KEY);
	const walletAddress = account.address; // viem's canonical EIP-55 form

	// Pipe all page-side console + errors to Node for full diagnostic visibility.
	page.on("console", (msg) => {
		console.log(`[page ${msg.type()}] ${msg.text()}`);
	});
	page.on("pageerror", (err) => {
		console.log(`[page error] ${err.message}`);
	});

	// Bridge: the in-page mock calls window.__e2eSignMessage(input) →
	// viem signs in Node and returns the signature. `input` is either a UTF-8
	// string (plain text, the EIP-191 default Privy uses) or { raw: "0x..." }
	// for already-hex-encoded byte payloads.
	await context.exposeFunction(
		"__e2eSignMessage",
		async (input: string | { raw: string }) => {
			if (typeof input === "string") {
				return account.signMessage({ message: input });
			}
			return account.signMessage({
				message: { raw: input.raw as `0x${string}` },
			});
		},
	);

	await context.addInitScript(
		({ address, chainIdHex }: { address: string; chainIdHex: string }) => {
			const calls: Array<{ method: string; params: unknown }> = [];
			(window as unknown as { __ethCalls: typeof calls }).__ethCalls = calls;

			// Real-wallet semantics: `eth_accounts` returns [] until the user has
			// authorised via `eth_requestAccounts`. wagmi auto-probes window.ethereum
			// on page load — if we return [address] there, wagmi treats us as
			// already-connected and validates the address before any explicit
			// user action, which is the source of the "Invalid ethereum address"
			// warnings we saw. Tracking an authorised flag matches MetaMask.
			let authorized = false;

			const isHexString = (v: string): boolean =>
				v.startsWith("0x") && v.length % 2 === 0 && /^0x[0-9a-fA-F]*$/.test(v);

			const provider = {
				isMetaMask: false,
				request: async ({
					method,
					params,
				}: {
					method: string;
					params?: unknown;
				}) => {
					calls.push({ method, params });
					console.log(`[E2E mock] ${method}`);
					if (method === "eth_chainId") return chainIdHex;
					if (method === "eth_accounts") {
						return authorized ? [address] : [];
					}
					if (method === "eth_requestAccounts") {
						authorized = true;
						return [address];
					}
					if (
						method === "wallet_switchEthereumChain" ||
						method === "wallet_addEthereumChain"
					) {
						return null;
					}
					if (method === "personal_sign") {
						// EIP-191 personal_sign: params[0] is data (hex or plain utf-8),
						// params[1] is the signer address. Privy's useLoginWithSiwe passes
						// the SIWE message as plain utf-8 — handle both forms anyway.
						const [data] = (params ?? []) as [string, string];
						const input = isHexString(data) ? { raw: data } : data;
						console.log(
							`[E2E mock] personal_sign input=${typeof input === "string" ? "utf8" : "hex"} len=${typeof input === "string" ? input.length : input.raw.length}`,
						);
						try {
							const sig = await (
								window as unknown as {
									__e2eSignMessage: (
										m: string | { raw: string },
									) => Promise<string>;
								}
							).__e2eSignMessage(input);
							console.log(`[E2E mock] signed ${sig.slice(0, 12)}…`);
							return sig;
						} catch (err) {
							console.error("[E2E mock] sign failed", err);
							throw err;
						}
					}
					if (method === "eth_signTypedData_v4") {
						// Not used by SIWE flow; return a placeholder if anything reaches here.
						return "0x".padEnd(132, "a");
					}
					if (
						method === "eth_sendTransaction" ||
						method === "wallet_sendTransaction"
					) {
						return "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";
					}
					return null;
				},
				on: () => {},
				removeListener: () => {},
			};

			(window as unknown as { ethereum: typeof provider }).ethereum = provider;

			const info = {
				uuid: "11111111-1111-1111-1111-111111111111",
				name: "E2E Mock Wallet",
				icon:
					"data:image/svg+xml;base64," +
					btoa(
						"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' fill='#2563eb'/></svg>",
					),
				rdns: "com.centuari.e2e.mock",
			};

			const announce = () => {
				window.dispatchEvent(
					new CustomEvent("eip6963:announceProvider", {
						detail: { info, provider },
					}),
				);
			};

			window.addEventListener("eip6963:requestProvider", announce);
			announce();
		},
		{ address: walletAddress, chainIdHex: ACTIVE_CHAIN_ID_HEX },
	);

	console.log("\n=== Centuari E2E Privy session capture ===");
	console.log(`Frontend:      ${FRONTEND_URL}`);
	console.log(
		`Wallet:        ${walletAddress} (Anvil dev key #0, viem canonical form)`,
	);
	console.log("Flow:          headless SIWE — no human interaction needed\n");

	await page.goto(FRONTEND_URL);
	// Do not wait for `networkidle` — the page makes repeated websocket
	// connection attempts to ws://localhost:8080 that the CSP blocks but the
	// app retries indefinitely. networkidle never fires.

	const mockWallet = page.getByRole("button", { name: /E2E Mock Wallet/i });
	const useWalletButton = page.getByRole("button", {
		name: /Use Wallet to Login/i,
	});

	// EmbeddedWalletGuard auto-opens the login dialog for unauthenticated
	// users. The dialog renders asynchronously — wait for either the wallet
	// picker (mock wallet visible) or the login view (Use Wallet to Login
	// button visible), whichever the dialog lands on first. 30s is generous
	// enough to cover Next dev-server cold-start.
	console.log("[capture] waiting for login dialog to render…");
	await mockWallet
		.or(useWalletButton)
		.first()
		.waitFor({ state: "visible", timeout: 30_000 });

	if (!(await mockWallet.isVisible().catch(() => false))) {
		console.log("[capture] login view open — switching to wallet view");
		await useWalletButton.click();
		await mockWallet.waitFor({ state: "visible", timeout: 10_000 });
	} else {
		console.log("[capture] wallet picker already open");
	}

	console.log("[capture] clicking E2E Mock Wallet");
	await mockWallet.click();

	console.log("[capture] waiting for Privy session in localStorage…");
	await page.waitForFunction(
		() =>
			!!localStorage.getItem("privy:token") ||
			!!localStorage.getItem("privy:session"),
		undefined,
		{ timeout: 60_000 },
	);

	// Small settle so Privy can finish writing all session keys + cookies
	// before we snapshot the context.
	await page.waitForTimeout(1_500);

	await context.storageState({ path: STATE_PATH });

	console.log("\n=== Captured ===");
	console.log(`Storage state: ${STATE_PATH}`);
	console.log(`Wallet:        ${walletAddress}`);
	console.log(
		"\nIf this address differs from WALLET_ADDRESS in collateral-toggle.spec.ts,",
	);
	console.log(
		"update the spec — the mocked /api/portfolio/user-details response",
	);
	console.log("must match the Privy session's wallet.");
	console.log("Do not commit e2e/.auth/privy.json — it is gitignored.\n");
});
