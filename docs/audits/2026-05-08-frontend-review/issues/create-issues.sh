#!/usr/bin/env bash
# Bulk-create the 26 issues from this folder via the gh CLI:
#   - 1 epic (#0)
#   - 6 sub-issues (#1..#6) under the epic — token & decimals trust
#   - 19 standalone (#7..#25) — proxy hardening, faucet auth, fee logic,
#     wallet fallback, apiClient consistency, wallet-address validation,
#     low-severity cleanup bundle, next.config.ts hardening,
#     deploy.yml conflict resolution, lint + typecheck restoration,
#     Docker / CI hardening bundle, APR units bug, mapStatus fail-loud,
#     DEV_TOKEN backend verification, orderbook/trades decimals default,
#     health factor calculation bundle, viem/wagmi dedupe,
#     borrow form silent validation, tokenList hardcoded prices
#
# Requirements:
#   - gh installed and authenticated (`gh auth status`)
#   - run from this directory (or any cwd; the script resolves its own location)
#
# Behavior:
#   1. Creates sub-issues #1..#6 in dependency order, capturing each issue number.
#   2. Creates the epic with sub-issue references resolved to real numbers.
#   3. Creates the standalone #7..#13 (independent of the epic).
#   4. Does not deduplicate — re-running creates duplicates. Close existing first.

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$SCRIPT_DIR"

if ! command -v gh >/dev/null 2>&1; then
  echo "error: gh CLI not found. Install with: brew install gh" >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "error: gh is not authenticated. Run: gh auth login" >&2
  exit 1
fi

# Parse `title:` and `labels:` from the YAML front-matter of a markdown file.
parse_title() {
  awk '/^---$/{c++; next} c==1 && /^title:/ {sub(/^title:[ ]*"?/, ""); sub(/"?$/, ""); print; exit}' "$1"
}

parse_labels() {
  # labels: ["a", "b", "c"]  ->  a,b,c
  awk '/^---$/{c++; next} c==1 && /^labels:/ {
    sub(/^labels:[ ]*\[/, ""); sub(/\][ ]*$/, "");
    gsub(/"/, ""); gsub(/, */, ",");
    print; exit
  }' "$1"
}

# Body = everything after the closing `---` of the front-matter.
parse_body() {
  awk '/^---$/{c++; next} c>=2 {print}' "$1"
}

create_issue() {
  local file="$1"
  local title labels body
  title="$(parse_title "$file")"
  labels="$(parse_labels "$file")"
  body="$(parse_body "$file")"

  echo "Creating: $title"
  local args=(--title "$title" --body "$body")
  if [ -n "$labels" ]; then
    args+=(--label "$labels")
  fi

  # Capture URL, then extract the issue number.
  local url number
  url="$(gh issue create "${args[@]}")"
  number="${url##*/}"
  echo "  → #$number  $url"
  printf '%s' "$number"
}

echo "Creating sub-issues 1..6..."
N1=$(create_issue 01-token-allowlist-module.md)
N2=$(create_issue 02-reject-invalid-decimals.md)
N3=$(create_issue 03-validate-token-address.md)
N4=$(create_issue 04-allowlist-wiring.md)
N5=$(create_issue 05-onchain-decimals-check.md)
N6=$(create_issue 06-pre-signature-confirmation-dialog.md)

echo
echo "Creating epic with resolved sub-issue numbers..."

EPIC_TITLE="$(parse_title 00-epic.md)"
EPIC_LABELS="$(parse_labels 00-epic.md)"
EPIC_BODY="$(parse_body 00-epic.md)"

# Substitute placeholder #1..#6 references in the epic with the real numbers.
# The epic uses #1, #2, ... as placeholders for the six sub-issues.
EPIC_BODY="${EPIC_BODY//#1/#$N1}"
EPIC_BODY="${EPIC_BODY//#2/#$N2}"
EPIC_BODY="${EPIC_BODY//#3/#$N3}"
EPIC_BODY="${EPIC_BODY//#4/#$N4}"
EPIC_BODY="${EPIC_BODY//#5/#$N5}"
EPIC_BODY="${EPIC_BODY//#6/#$N6}"

EPIC_URL="$(gh issue create --title "$EPIC_TITLE" --body "$EPIC_BODY" --label "$EPIC_LABELS")"
EPIC_NUMBER="${EPIC_URL##*/}"
echo "  → #$EPIC_NUMBER  $EPIC_URL"

echo
echo "Creating standalone issues 7..25..."
N7=$(create_issue 07-proxy-path-prefix-bypass.md)
N8=$(create_issue 08-faucet-authenticate.md)
N9=$(create_issue 09-fee-logic-divergence.md)
N10=$(create_issue 10-wallet-fallback-explicit.md)
N11=$(create_issue 11-apiclient-fetch-consistency.md)
N12=$(create_issue 12-wallet-address-validate.md)
N13=$(create_issue 13-low-severity-cleanup.md)
N14=$(create_issue 14-nextjs-config-hardening.md)
N15=$(create_issue 15-deploy-yml-merge-conflicts.md)
N16=$(create_issue 16-restore-lint-typecheck.md)
N17=$(create_issue 17-docker-ci-hardening.md)
N18=$(create_issue 18-apr-units-roundtrip-bug.md)
N19=$(create_issue 19-mapstatus-fail-loud-on-unknown.md)
N20=$(create_issue 20-verify-dev-token-disabled-prod.md)
N21=$(create_issue 21-orderbook-trades-decimals-default.md)
N22=$(create_issue 22-health-factor-calculation-bundle.md)
N23=$(create_issue 23-dedupe-viem-wagmi-lockfile.md)
N24=$(create_issue 24-borrow-form-silent-validation.md)
N25=$(create_issue 25-tokenlist-hardcoded-prices.md)

cat <<SUMMARY

Created issues:
  Epic   #$EPIC_NUMBER  Token & decimals trust in deposit flow
  Sub-1  #$N1   Add hardcoded token allowlist module
  Sub-2  #$N2   Reject invalid ERC20 decimals from API           [Critical]
  Sub-3  #$N3   Validate tokenAddress with isAddress()           [Critical]
  Sub-4  #$N4   Reject tokenAddress not in allowlist             [Critical]    (depends on #$N1, #$N3)
  Sub-5  #$N5   Cross-check on-chain decimals() before approve   [High]        (depends on #$N2, #$N3)
  Sub-6  #$N6   Pre-signature confirmation dialog                [High]        (depends on #$N1..#$N5)
  Stand  #$N7   Tighten proxy path allowlist                     [High]        (independent)
  Stand  #$N8   Authenticate faucet drip endpoint                [Medium]      (independent)
  Stand  #$N9   Fee logic divergence — limit fees over-displayed [Medium]      (independent)
  Stand  #$N10  Make wallet selection explicit in useDeposit     [Medium]      (independent)
  Stand  #$N11  Migrate 3 endpoints to apiClient                 [Medium]      (independent)
  Stand  #$N12  Validate Privy wallet address with isAddress()   [Medium]      (soft dep on #$N3)
  Stand  #$N13  Low-severity cleanup bundle (5 items)            [Low]         (independent)
  Stand  #$N14  Harden next.config.ts + Next.js version CI guard [Low/preventive] (soft dep on #$N13)
  Stand  #$N15  🚨 Resolve deploy.yml merge conflicts            [Critical/op] (URGENT — gates #$N16, parts of #$N17)
  Stand  #$N16  Re-enable lint + typecheck + tsconfig hardening  [High]        (depends on #$N15)
  Stand  #$N17  Docker / CI hardening bundle (6 items)           [Med + Low]   (item-2 depends on #$N15)
  Stand  #$N18  APR units round-trip bug (likely live 100x)      [High]        (independent)
  Stand  #$N19  mapStatus fail-loudly on unknown order status    [Medium]      (independent)
  Stand  #$N20  Verify backend DEV_TOKEN_* path disabled in prod [Info/backend] (tracking only)
  Stand  #$N21  Orderbook/recent-trades decimals=6 default fix   [Medium]      (soft dep on #$N18)
  Stand  #$N22  Health factor: Infinity-from-API + formula divergence [Medium]  (soft dep on #$N16)
  Stand  #$N23  Dedupe viem (and wagmi) version resolution        [Medium]      (soft dep on #$N16)
  Stand  #$N24  Replace silent validation gates (borrow/withdraw/maturity) [Medium] (independent)
  Stand  #$N25  tokenList hardcoded prices (IDRX/XSGD currency confusion)  [High]   (soft dep on #$N16)

Next steps:
  - Open the epic and verify the dependency links resolved correctly.
  - Add issues to your project board / sprint.
  - Optional: post the epic URL into the security audit doc
    (docs/audits/2026-05-08-frontend-review/security.md) for traceability.
SUMMARY
