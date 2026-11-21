#!/usr/bin/env bash
#
# 178-stack-probe.sh -- what the RUNNING local auth service and edge runtime hold, against what the tree states.
#
# Usage (PD = .planning/phases/178-sign-in-email-code-registration):
#   bash PD/178-stack-probe.sh
# It takes no argument.
#
# `config.toml`, the functions' environment and a function's source are read when the stack starts, so what the
# tree says and what the running services do can differ. This probe reads the running services and compares
# them with the tree as it stands. It has no "before" and no "after": whatever the tree states is what the
# services must hold, so the same call judges the stack before and after each change of the configuration.
#
# How a container is read. Every container value is read by name, one variable per call. The script never
# lists a container's environment, never reads a container log, and opens one environment file only: the
# tracked template apps/supabase/supabase/functions/.env.example.
#
# The auth part. Rows 1 to 6 print the observed value, the expected value and OK or MISMATCH; rows 7 to 10
# print the running service's value, the tree's value and EQUAL or DIFFERS:
#   1. GOTRUE_DISABLE_SIGNUP of the auth container                 true
#   2. GOTRUE_MAILER_AUTOCONFIRM of the auth container             false
#   3. disable_signup of GET /auth/v1/settings                     true
#   4. mailer_autoconfirm of GET /auth/v1/settings                 false
#   5. a live POST /auth/v1/signup, fresh address                  422 signup_disabled
#   6. a live POST /auth/v1/otp with create_user, fresh address    422 signup_disabled
#   7. GOTRUE_PASSWORD_MIN_LENGTH of the auth container against `minimum_password_length` under `[auth]` in
#      config.toml
#   8. GOTRUE_MAILER_OTP_EXP of the auth container, the life of a mailed link in seconds, against `otp_expiry`
#      under `[auth.email]` in config.toml
#   9. GOTRUE_HOOK_SEND_EMAIL_ENABLED of the auth container against `enabled` under `[auth.hook.send_email]`
#      in config.toml; a table that is absent and a variable that is unset both read as false
#  10. GOTRUE_HOOK_SEND_EMAIL_URI of the auth container against `uri` under `[auth.hook.send_email]`; a table
#      that is absent and a variable that is unset both read as (none)
#
# The edge part, four rows, each ending in EQUAL or DIFFERS:
#  11. a live POST to the `account-access` function with the operation `request-recovery`, the default project
#      of the seed and a fresh address under the probe's prefix. EQUAL when the answer is 200 with the accepted
#      body and apps/supabase/supabase/functions/account-access/contract.ts names that operation, or when the
#      answer is 400 and the file does not; anything else is DIFFERS. It tells whether the edge runtime serves
#      the function's source as the tree holds it.
#   12-14. SITE_URL, SMTP_HOST and SMTP_PORT of the edge-runtime container, each with the value of the same key
#      in the tracked template beside it. The three hold an origin, a host name and a port, never a secret, and
#      are printed.
#
# The cleanup row, last: through the service-role key and the auth admin API every user whose address begins
# with r178-probe-stack- is deleted; the row says how many were found and how many remain, and expects none of
# either, because a closed service creates no user and a recovery request for an unknown address creates none.
#
# The live requests use the addresses r178-probe-stack-signup-<epoch>@test.openvaa.local,
# r178-probe-stack-otp-<epoch>@test.openvaa.local and r178-probe-stack-recovery-<epoch>@test.openvaa.local, and
# a random password. Only the HTTP status and one fixed word of an answer are printed, never a body.
#
# The two API keys are captured from `supabase status -o env` into shell variables. They are never echoed,
# never written to a file and never put on a command line: each request hands its headers to curl on standard
# input.
#
# Exit codes:
#   0  every row OK or EQUAL
#   1  at least one MISMATCH or DIFFERS
#   2  usage error
#   3  a service or a container did not answer, or a key or a file could not be read

set -u

SELF="178-stack-probe.sh"
if [ $# -gt 0 ]; then
  echo "usage: $SELF (it takes no argument; unexpected '$1')" >&2
  exit 2
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$REPO_ROOT" || exit 2

NVM_NODE_DIR="$HOME/.nvm/versions/node"
if [ -x "$NVM_NODE_DIR/v24.21.0/bin/node" ]; then export PATH="$NVM_NODE_DIR/v24.21.0/bin:$PATH"; fi

API="http://127.0.0.1:54321"
AUTH_CONTAINER="supabase_auth_openvaa-local"
EDGE_CONTAINER="supabase_edge_runtime_openvaa-local"
TEMPLATE="apps/supabase/supabase/functions/.env.example"
CONFIG="apps/supabase/supabase/config.toml"
CONTRACT="apps/supabase/supabase/functions/account-access/contract.ts"
DEFAULT_PROJECT_ID="00000000-0000-0000-0000-000000000001"
RECOVERY_OPERATION="request-recovery"
PROBE_PREFIX="r178-probe-stack-"

MISMATCH=0

container_running() { docker ps --format '{{.Names}}' 2> /dev/null | grep -q -x "$1"; }

# One named variable of one container. Prints the value, or (unset) when the container has no such variable.
container_var() {
  local value
  if value="$(docker exec "$1" printenv "$2" 2> /dev/null)"; then
    printf '%s' "$value"
  else
    printf '(unset)'
  fi
}

# The value of the first live `key = value` line inside one table of config.toml, unquoted and without a
# trailing comment. $1 the dotted table name without brackets, $2 the bare key. Prints nothing when the table
# or the key is absent.
config_value() {
  awk -v table="$1" -v key="$2" '
    /^[[:space:]]*\[/ {
      current = $0
      sub(/^[[:space:]]*\[+[[:space:]]*/, "", current)
      sub(/[[:space:]]*\]+.*$/, "", current)
      next
    }
    current == table && $0 ~ ("^[[:space:]]*" key "[[:space:]]*=") {
      value = $0
      sub(/^[^=]*=[[:space:]]*/, "", value)
      sub(/[[:space:]]*#.*$/, "", value)
      sub(/[[:space:]]+$/, "", value)
      gsub(/^"|"$/, "", value)
      print value
      exit
    }' "$CONFIG"
}

row() {
  # $1 what, $2 observed, $3 expected
  local verdict="OK"
  if [ "$2" != "$3" ]; then
    verdict="MISMATCH"
    MISMATCH=1
  fi
  printf '%-52s %-24s %-24s %s\n' "$1" "$2" "$3" "$verdict"
}

compared() {
  # $1 what, $2 the running service's value, $3 the tree's value
  local verdict="EQUAL"
  if [ "$2" != "$3" ]; then
    verdict="DIFFERS"
    MISMATCH=1
  fi
  printf '%-52s %-24s %-24s %s\n' "$1" "$2" "$3" "$verdict"
}

# One request. $1 the key that authorises it, then curl arguments. Prints the body, a newline and the HTTP status.
request() {
  local key="$1"
  shift
  printf 'header = "apikey: %s"\nheader = "Authorization: Bearer %s"\n' "$key" "$key" |
    curl -sS -K - --max-time 20 -w '\n%{http_code}' "$@" 2> /dev/null
}
status_of() { printf '%s\n' "$1" | tail -n 1; }
body_of() { printf '%s\n' "$1" | sed '$d'; }
# One top-level field of a JSON body on standard input; `-` when the body is not JSON or has no such field.
json_field() {
  node -e '
let s = "";
process.stdin.on("data", (d) => (s += d));
process.stdin.on("end", () => {
  try {
    const v = JSON.parse(s)[process.argv[1]];
    console.log(v === undefined || v === null ? "-" : String(v));
  } catch {
    console.log("-");
  }
});' "$1"
}
# One fixed word for the body of a function's answer on standard input: `accepted` for exactly the accepted
# body, the answer's own error word when it carries one, else `other`. The body itself is never printed.
function_answer_word() {
  node -e '
let s = "";
process.stdin.on("data", (d) => (s += d));
process.stdin.on("end", () => {
  try {
    const v = JSON.parse(s);
    const keys = v && typeof v === "object" ? Object.keys(v) : [];
    if (keys.length === 1 && v.accepted === true) console.log("accepted");
    else if (typeof v.error === "string" && /^[a-z-]{1,40}$/.test(v.error)) console.log(v.error);
    else console.log("other");
  } catch {
    console.log("other");
  }
});'
}

# The id of every auth user whose address begins with the probe's prefix, one per line, read page by page
# through the admin API with the service-role key ($1). Non-zero when a page does not answer 200.
probe_user_ids() {
  local page=1 answer code page_out count
  while [ "$page" -le 100 ]; do
    answer="$(request "$1" -G --data-urlencode "page=$page" --data-urlencode "per_page=200" "$API/auth/v1/admin/users")"
    code="$(status_of "$answer")"
    [ "$code" = 200 ] || return 1
    page_out="$(body_of "$answer" | PROBE_PREFIX="$PROBE_PREFIX" node -e '
let s = "";
process.stdin.on("data", (d) => (s += d));
process.stdin.on("end", () => {
  const users = JSON.parse(s).users ?? [];
  console.log(`count ${users.length}`);
  for (const u of users) if (String(u.email ?? "").startsWith(process.env.PROBE_PREFIX)) console.log(u.id);
});')" || return 1
    count="$(printf '%s\n' "$page_out" | sed -n 's/^count //p' | head -n 1)"
    printf '%s\n' "$page_out" | sed '/^count /d'
    [ "${count:-0}" -gt 0 ] || break
    page=$((page + 1))
  done
  return 0
}

for c in "$AUTH_CONTAINER" "$EDGE_CONTAINER"; do
  if ! container_running "$c"; then
    echo "$SELF: the container $c is not running -- is the stack up?" >&2
    exit 3
  fi
done
for f in "$TEMPLATE" "$CONFIG" "$CONTRACT"; do
  if [ ! -f "$f" ]; then
    echo "$SELF: $f is missing" >&2
    exit 3
  fi
done

STATUS_ENV="$(cd apps/supabase && yarn supabase status -o env 2> /dev/null)"
ANON="$(printf '%s\n' "$STATUS_ENV" | sed -n 's/^ANON_KEY="\{0,1\}\([^"]*\)"\{0,1\}$/\1/p' | head -n 1)"
SERVICE="$(printf '%s\n' "$STATUS_ENV" | sed -n 's/^SERVICE_ROLE_KEY="\{0,1\}\([^"]*\)"\{0,1\}$/\1/p' | head -n 1)"
STATUS_ENV=""
if [ -z "$ANON" ] || [ -z "$SERVICE" ]; then
  echo "$SELF: could not read the two API keys from 'supabase status -o env' -- is the stack up?" >&2
  exit 3
fi

EPOCH="$(date +%s)"

run_auth() {
  echo "auth part"
  printf '%-52s %-24s %-24s %s\n' 'check' 'observed' 'expected' 'verdict'
  row "container GOTRUE_DISABLE_SIGNUP" "$(container_var "$AUTH_CONTAINER" GOTRUE_DISABLE_SIGNUP)" "true"
  row "container GOTRUE_MAILER_AUTOCONFIRM" "$(container_var "$AUTH_CONTAINER" GOTRUE_MAILER_AUTOCONFIRM)" "false"

  local answer code body
  answer="$(request "$ANON" "$API/auth/v1/settings")"
  code="$(status_of "$answer")"
  body="$(body_of "$answer")"
  if [ "$code" != 200 ]; then
    echo "$SELF: GET /auth/v1/settings answered '${code:-nothing}' -- the auth service did not answer" >&2
    exit 3
  fi
  row "settings disable_signup" "$(printf '%s' "$body" | json_field disable_signup)" "true"
  row "settings mailer_autoconfirm" "$(printf '%s' "$body" | json_field mailer_autoconfirm)" "false"

  local password signup_address otp_address
  password="$(node -e 'console.log(require("node:crypto").randomBytes(24).toString("base64url"))')"
  signup_address="${PROBE_PREFIX}signup-${EPOCH}@test.openvaa.local"
  otp_address="${PROBE_PREFIX}otp-${EPOCH}@test.openvaa.local"

  answer="$(request "$ANON" -X POST -H 'Content-Type: application/json' \
    --data "{\"email\":\"$signup_address\",\"password\":\"$password\"}" "$API/auth/v1/signup")"
  code="$(status_of "$answer")"
  if [ -z "$code" ] || [ "$code" = 000 ]; then
    echo "$SELF: POST /auth/v1/signup got no answer" >&2
    exit 3
  fi
  row "live POST /signup (status, error_code)" "$code $(body_of "$answer" | json_field error_code)" "422 signup_disabled"

  answer="$(request "$ANON" -X POST -H 'Content-Type: application/json' \
    --data "{\"email\":\"$otp_address\",\"create_user\":true}" "$API/auth/v1/otp")"
  code="$(status_of "$answer")"
  if [ -z "$code" ] || [ "$code" = 000 ]; then
    echo "$SELF: POST /auth/v1/otp got no answer" >&2
    exit 3
  fi
  row "live POST /otp create_user (status, error_code)" "$code $(body_of "$answer" | json_field error_code)" "422 signup_disabled"
  answer=""
  password=""

  echo
  printf '%-52s %-24s %-24s %s\n' 'compared' 'auth container' 'config.toml' 'verdict'
  local tree_length tree_hook running_hook
  tree_length="$(config_value auth minimum_password_length)"
  compared "GOTRUE_PASSWORD_MIN_LENGTH / minimum_password_length" \
    "$(container_var "$AUTH_CONTAINER" GOTRUE_PASSWORD_MIN_LENGTH)" "${tree_length:-(no such key)}"
  local tree_expiry
  tree_expiry="$(config_value auth.email otp_expiry)"
  compared "GOTRUE_MAILER_OTP_EXP / auth.email otp_expiry" \
    "$(container_var "$AUTH_CONTAINER" GOTRUE_MAILER_OTP_EXP)" "${tree_expiry:-(no such key)}"

  tree_hook="$(config_value auth.hook.send_email enabled)"
  running_hook="$(container_var "$AUTH_CONTAINER" GOTRUE_HOOK_SEND_EMAIL_ENABLED)"
  if [ "$running_hook" = "(unset)" ] || [ -z "$running_hook" ]; then running_hook=false; fi
  compared "GOTRUE_HOOK_SEND_EMAIL_ENABLED / hook.send_email" "$running_hook" "${tree_hook:-false}"
  local tree_hook_uri running_hook_uri
  tree_hook_uri="$(config_value auth.hook.send_email uri)"
  running_hook_uri="$(container_var "$AUTH_CONTAINER" GOTRUE_HOOK_SEND_EMAIL_URI)"
  if [ "$running_hook_uri" = "(unset)" ]; then running_hook_uri=""; fi
  compared "GOTRUE_HOOK_SEND_EMAIL_URI / hook.send_email uri" "${running_hook_uri:-(none)}" "${tree_hook_uri:-(none)}"
  echo
}

run_edge() {
  echo "edge part"
  printf '%-52s %-24s %-24s %s\n' 'compared' 'edge runtime' 'tree' 'verdict'

  # The function as served against the function's source in the tree.
  local recovery_address answer code word tree_names served verdict
  recovery_address="${PROBE_PREFIX}recovery-${EPOCH}@test.openvaa.local"
  answer="$(request "$ANON" -X POST -H 'Content-Type: application/json' \
    --data "{\"operation\":\"$RECOVERY_OPERATION\",\"project_id\":\"$DEFAULT_PROJECT_ID\",\"email\":\"$recovery_address\"}" \
    "$API/functions/v1/account-access")"
  code="$(status_of "$answer")"
  if [ -z "$code" ] || [ "$code" = 000 ]; then
    echo "$SELF: POST /functions/v1/account-access got no answer -- the edge runtime did not answer" >&2
    exit 3
  fi
  word="$(body_of "$answer" | function_answer_word)"
  answer=""
  if grep -q -E "['\"]$RECOVERY_OPERATION['\"]" "$CONTRACT"; then tree_names="names it"; else tree_names="does not name it"; fi
  served="$code $word"
  verdict="DIFFERS"
  if [ "$served" = "200 accepted" ] && [ "$tree_names" = "names it" ]; then verdict="EQUAL"; fi
  if [ "$code" = 400 ] && [ "$tree_names" = "does not name it" ]; then verdict="EQUAL"; fi
  if [ "$verdict" = DIFFERS ]; then MISMATCH=1; fi
  printf '%-52s %-24s %-24s %s\n' "account-access $RECOVERY_OPERATION / contract.ts" "$served" "$tree_names" "$verdict"

  echo
  printf '%-10s %-32s %-32s %s\n' 'variable' 'edge container' 'tracked template' 'verdict'
  local name observed tracked
  for name in SITE_URL SMTP_HOST SMTP_PORT; do
    observed="$(container_var "$EDGE_CONTAINER" "$name")"
    tracked="$(sed -n "s/^$name=//p" "$TEMPLATE" | head -n 1)"
    if [ "$observed" = "$tracked" ]; then
      verdict="EQUAL"
    else
      verdict="DIFFERS"
      MISMATCH=1
    fi
    printf '%-10s %-32s %-32s %s\n' "$name" "$observed" "${tracked:-(no such key)}" "$verdict"
  done
  echo
}

# Every probe user is deleted through the admin API; none may have been made and none may remain.
run_cleanup() {
  local found=0 remaining=0 ids id
  if ! ids="$(probe_user_ids "$SERVICE")"; then
    echo "$SELF: GET /auth/v1/admin/users did not answer 200 -- the probe's users could not be listed" >&2
    exit 3
  fi
  for id in $ids; do
    found=$((found + 1))
    request "$SERVICE" -X DELETE "$API/auth/v1/admin/users/$id" > /dev/null
  done
  if ! ids="$(probe_user_ids "$SERVICE")"; then
    echo "$SELF: GET /auth/v1/admin/users did not answer 200 -- the cleanup could not be confirmed" >&2
    exit 3
  fi
  for id in $ids; do remaining=$((remaining + 1)); done
  echo "cleanup"
  printf '%-52s %-24s %-24s %s\n' 'check' 'observed' 'expected' 'verdict'
  row "probe users (found, remaining)" "$found found, $remaining left" "0 found, 0 left"
  echo
}

run_auth
run_edge
run_cleanup
ANON=""
SERVICE=""

if [ "$MISMATCH" -ne 0 ]; then
  echo "$SELF: MISMATCH -- the running services do not hold what the tree states"
  exit 1
fi
echo "$SELF: every row OK or EQUAL"
exit 0
