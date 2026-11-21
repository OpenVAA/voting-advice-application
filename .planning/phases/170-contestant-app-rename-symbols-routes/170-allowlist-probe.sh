#!/usr/bin/env bash
#
# 170-allowlist-probe.sh -- what the RUNNING local auth service does with a redirect URL.
#
# Usage: bash .planning/phases/170-contestant-app-rename-symbols-routes/170-allowlist-probe.sh <before|after>
#
# For each URL of the table below it sends
#   GET http://127.0.0.1:54321/auth/v1/verify?token=<invalid>&type=recovery&redirect_to=<url>
# and reads the Location header. The token is deliberately invalid, so the service answers 303 either to
# the requested URL (it ALLOWS the redirect) or to `site_url` of apps/supabase/supabase/config.toml (it
# REJECTS it). No email is sent and no user is touched. The anon key is read from `supabase status -o env`
# into a shell variable and is never printed.
#
# The list the service matches against is `additional_redirect_urls`, baked into the auth container's
# environment (GOTRUE_URI_ALLOW_LIST) when the stack starts. Editing config.toml changes nothing until the
# stack is restarted, so this probe is run in two modes:
#   before  the container still carries the list that admits the two `candidate` callback URLs;
#   after   the container carries the list that admits the two neutral callback URLs.
#
# Every probed URL but the last is on `localhost`. The service allows any URL whose HOSTNAME equals
# site_url's hostname (127.0.0.1) before it consults the list, so a 127.0.0.1 URL would prove nothing.
#
# Output: the GOTRUE_URI_ALLOW_LIST line of the running container, then one row per URL -- the URL, the
# observed verdict, the expected verdict for the mode, and OK or MISMATCH.
#
# Exit codes:
#   0  every row OK
#   1  at least one MISMATCH
#   2  usage error
#   3  the auth service did not answer, sent no Location header, or the anon key could not be read

set -u

MODE="${1:-}"
case "$MODE" in
  before | after) ;;
  *) echo "usage: 170-allowlist-probe.sh <before|after>" >&2; exit 2 ;;
esac

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$REPO_ROOT" || exit 2

NVM_NODE_DIR="$HOME/.nvm/versions/node"
if [ -x "$NVM_NODE_DIR/v24.21.0/bin/node" ]; then export PATH="$NVM_NODE_DIR/v24.21.0/bin:$PATH"; fi

API="http://127.0.0.1:54321"
SITE_URL="$(sed -n 's/^site_url = "\(.*\)"$/\1/p' apps/supabase/supabase/config.toml | head -n 1)"
if [ -z "$SITE_URL" ]; then
  echo "170-allowlist-probe.sh: could not read site_url from apps/supabase/supabase/config.toml" >&2
  exit 3
fi

KEY="$(cd apps/supabase && yarn supabase status -o env 2> /dev/null | sed -n 's/^ANON_KEY="\{0,1\}\([^"]*\)"\{0,1\}$/\1/p' | head -n 1)"
if [ -z "$KEY" ]; then
  echo "170-allowlist-probe.sh: could not read the anon key from 'supabase status -o env' -- is the stack up?" >&2
  exit 3
fi

echo "mode: $MODE"
echo "site_url: $SITE_URL"
ALLOW_LINE="$(docker inspect supabase_auth_openvaa-local --format '{{range .Config.Env}}{{println .}}{{end}}' 2> /dev/null | grep '^GOTRUE_URI_ALLOW_LIST=')"
echo "container: ${ALLOW_LINE:-GOTRUE_URI_ALLOW_LIST not readable}"
echo

# url | expected before | expected after
TABLE='http://localhost:5173/api/auth/callback|rejected|allowed
http://localhost:5173/fi/api/auth/callback|rejected|allowed
http://localhost:5173/fi/en/api/auth/callback|rejected|rejected
http://localhost:5173/fi/api/auth/callback/extra|rejected|rejected
http://localhost:5173/fi/api/evil|rejected|rejected
http://localhost:5173/api/evil|rejected|rejected
http://localhost:5173/|rejected|rejected
http://localhost:5173/api/candidate/auth/callback|allowed|rejected
http://localhost:5173/fi/api/candidate/auth/callback|allowed|rejected
http://evil.example.com/api/auth/callback|rejected|rejected'

MISMATCH=0
printf '%-58s %-10s %-10s %s\n' 'redirect_to' 'observed' 'expected' 'verdict'
while IFS='|' read -r url exp_before exp_after; do
  [ -n "$url" ] || continue
  if [ "$MODE" = before ]; then expected="$exp_before"; else expected="$exp_after"; fi
  headers="$(curl -sS -o /dev/null -D - --max-time 10 -G "$API/auth/v1/verify" \
    --data-urlencode "token=deadbeefdeadbeef" --data-urlencode "type=recovery" \
    --data-urlencode "redirect_to=$url" -H "apikey: $KEY" 2> /dev/null)"
  curl_status=$?
  if [ "$curl_status" -ne 0 ]; then
    echo "170-allowlist-probe.sh: the auth service did not answer for $url (curl exit $curl_status)" >&2
    exit 3
  fi
  location="$(printf '%s\n' "$headers" | tr -d '\r' | sed -n 's/^[Ll]ocation: //p' | head -n 1 | sed -E 's/[#?].*$//')"
  if [ -z "$location" ]; then
    echo "170-allowlist-probe.sh: no Location header for $url; the first response line was: $(printf '%s\n' "$headers" | head -n 1 | tr -d '\r')" >&2
    exit 3
  fi
  if [ "$location" = "$url" ]; then
    observed="allowed"
  elif [ "${location%/}" = "${SITE_URL%/}" ]; then
    observed="rejected"
  else
    observed="other"
  fi
  if [ "$observed" = "$expected" ]; then
    verdict="OK"
  else
    verdict="MISMATCH (Location: $location)"
    MISMATCH=1
  fi
  printf '%-58s %-10s %-10s %s\n' "$url" "$observed" "$expected" "$verdict"
done << EOF
$TABLE
EOF

echo
if [ "$MISMATCH" -ne 0 ]; then
  echo "170-allowlist-probe.sh [$MODE]: MISMATCH"
  exit 1
fi
echo "170-allowlist-probe.sh [$MODE]: every row OK"
exit 0
