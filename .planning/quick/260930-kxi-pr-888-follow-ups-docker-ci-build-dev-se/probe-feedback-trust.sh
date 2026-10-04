#!/usr/bin/env bash
# Live probe of the feedback rate-limit trust gate through the local Kong/PostgREST path.
#
# Stage A: behind_cloudflare=false, six POSTs rotating cf-connecting-ip -> five 201, sixth refused.
# Stage B: behind_cloudflare=true, six POSTs with six distinct cf-connecting-ip -> six 201.
# Stage C: behind_cloudflare=true, six POSTs with one repeated cf-connecting-ip -> sixth refused.
# An EXIT trap restores behind_cloudflare=true and deletes the probe's feedback and rate-limit rows.
#
# Usage: bash probe-feedback-trust.sh   (run from anywhere inside the checkout)
set -euo pipefail

ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT"

STATUS_ENV=$(yarn workspace @openvaa/supabase supabase status -o env 2>/dev/null)
API_URL=$(printf '%s\n' "$STATUS_ENV" | sed -n 's/^API_URL="\{0,1\}\([^"]*\)"\{0,1\}$/\1/p')
ANON_KEY=$(printf '%s\n' "$STATUS_ENV" | sed -n 's/^ANON_KEY="\{0,1\}\([^"]*\)"\{0,1\}$/\1/p')
unset STATUS_ENV
[ -n "$API_URL" ] || { echo "FAIL: API_URL not found in supabase status"; exit 2; }
[ -n "$ANON_KEY" ] || { echo "FAIL: ANON_KEY not found in supabase status"; exit 2; }
case "$API_URL" in
  http://127.0.0.1:54321 | http://localhost:54321) ;;
  *) echo "FAIL: refusing to probe a non-local API URL"; exit 2 ;;
esac

PROJECT_ID=00000000-0000-0000-0000-000000000001
BODY="{\"project_id\":\"$PROJECT_ID\",\"rating\":3,\"description\":\"kxi-probe\"}"
TMP=$(mktemp -d)

sql() {
  if command -v psql > /dev/null 2>&1; then
    psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -v ON_ERROR_STOP=1 -Atqc "$1"
  else
    docker exec supabase_db_openvaa-local psql -U postgres -d postgres -v ON_ERROR_STOP=1 -Atqc "$1"
  fi
}

cleanup() {
  sql "UPDATE private.deployment_settings SET behind_cloudflare = true;" > /dev/null || true
  sql "DELETE FROM public.feedback WHERE description = 'kxi-probe';" > /dev/null || true
  if [ -f "$TMP/hops" ]; then
    while read -r hop; do
      [ -n "$hop" ] && sql "DELETE FROM private.feedback_rate_limits WHERE ip_address = '$hop';" > /dev/null || true
    done < "$TMP/hops"
  fi
  sql "DELETE FROM private.feedback_rate_limits WHERE ip_address LIKE '203.0.113.%';" > /dev/null || true
  rm -rf "$TMP"
}
trap cleanup EXIT

reset_state() {
  sql "UPDATE private.deployment_settings SET behind_cloudflare = $1;" > /dev/null
  sql "DELETE FROM private.feedback_rate_limits;" > /dev/null
  [ "$(sql 'SELECT behind_cloudflare::text FROM private.deployment_settings;')" = "$1" ] || {
    echo "FAIL: could not set behind_cloudflare=$1"
    exit 1
  }
}

# post <cf-connecting-ip> <n> -> prints the HTTP status; the body lands in $TMP/body.<n>
post() {
  curl -sS -o "$TMP/body.$2" -w '%{http_code}' -X POST "$API_URL/rest/v1/feedback" \
    -H "apikey: $ANON_KEY" \
    -H "Authorization: Bearer $ANON_KEY" \
    -H 'Content-Type: application/json' \
    -H 'Prefer: return=minimal' \
    -H "cf-connecting-ip: $1" \
    --data "$BODY"
}

record_hops() {
  sql "SELECT ip_address FROM private.feedback_rate_limits WHERE ip_address NOT LIKE '203.0.113.%';" >> "$TMP/hops"
}

refused() {
  local code=$1 body=$2
  [[ "$code" != 2* ]] && grep -q 'P0001' "$body" && grep -q 'Rate limit exceeded' "$body"
}

FAILED=0

# Stage A
reset_state false
codes=()
for i in 1 2 3 4 5 6; do codes+=("$(post "203.0.113.$((10 + i))" "a$i")"); done
record_hops
buckets_on_cf=$(sql "SELECT count(*) FROM private.feedback_rate_limits WHERE ip_address LIKE '203.0.113.%';")
if [ "${codes[*]:0:5}" = "201 201 201 201 201" ] && refused "${codes[5]}" "$TMP/body.a6" && [ "$buckets_on_cf" = "0" ]; then
  echo "PASS stage A (behind_cloudflare=false, rotating cf-connecting-ip): ${codes[*]}; cf buckets=$buckets_on_cf"
else
  echo "FAIL stage A (behind_cloudflare=false, rotating cf-connecting-ip): ${codes[*]}; cf buckets=$buckets_on_cf"
  FAILED=1
fi

# Stage B
reset_state true
codes=()
for i in 1 2 3 4 5 6; do codes+=("$(post "203.0.113.$((20 + i))" "b$i")"); done
record_hops
if [ "${codes[*]}" = "201 201 201 201 201 201" ]; then
  echo "PASS stage B (behind_cloudflare=true, six distinct cf-connecting-ip): ${codes[*]}"
else
  echo "FAIL stage B (behind_cloudflare=true, six distinct cf-connecting-ip): ${codes[*]}"
  FAILED=1
fi

# Stage C
reset_state true
codes=()
for i in 1 2 3 4 5 6; do codes+=("$(post "203.0.113.30" "c$i")"); done
record_hops
if [ "${codes[*]:0:5}" = "201 201 201 201 201" ] && refused "${codes[5]}" "$TMP/body.c6"; then
  echo "PASS stage C (behind_cloudflare=true, one repeated cf-connecting-ip): ${codes[*]}"
else
  echo "FAIL stage C (behind_cloudflare=true, one repeated cf-connecting-ip): ${codes[*]}"
  FAILED=1
fi

exit "$FAILED"
