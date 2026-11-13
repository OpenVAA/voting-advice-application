#!/usr/bin/env bash
#
# 174-stack-probe.sh -- what the RUNNING local auth service and edge runtime are configured as.
#
# Usage (PD = .planning/phases/174-invitations-grants-defined-in-advance):
#   bash PD/174-stack-probe.sh <before|after> [--only <auth|edge>]
#
# `config.toml` and the functions' environment are read when the stack starts, so what the tree says and what
# the running services do can differ. This probe reads the running services, in two modes:
#   before  public sign-up is open and addresses are confirmed without a mail (the stack as plan 174-03 finds it);
#   after   public sign-up is closed and confirmation is required (the stack as plan 174-03 leaves it).
#
# How a container is read. Every container value is read by name, one variable per call. The script never
# lists a container's environment, never reads a container log, and opens one environment file only: the
# tracked template apps/supabase/supabase/functions/.env.example.
#
# The auth part, one row per check -- the observed value, the value expected for the mode, OK or MISMATCH:
#   1. GOTRUE_DISABLE_SIGNUP of the auth container            before false   after true
#   2. GOTRUE_MAILER_AUTOCONFIRM of the auth container        before true    after false
#   3. disable_signup of GET /auth/v1/settings                before false   after true
#   4. mailer_autoconfirm of GET /auth/v1/settings            before true    after false
#   5. a live POST /auth/v1/signup, fresh address             before 200     after 422 signup_disabled
#   6. a live POST /auth/v1/otp with create_user, fresh one   before 200     after 422 signup_disabled
#   7. cleanup: through the service-role key and the auth admin API every user whose address begins with
#      r174-probe- is deleted; the row says how many were found and how many remain. One that remains is a
#      MISMATCH in both modes; in `after` mode one that was found is a MISMATCH too, because a closed service
#      creates none.
# The two live requests use the addresses r174-probe-signup-<epoch>@test.openvaa.local and
# r174-probe-otp-<epoch>@test.openvaa.local and a random password. Only the HTTP status and the error code
# of an answer are printed: in `before` mode the sign-up answer carries a session, which never leaves a
# shell variable.
#
# The edge part, three rows: SITE_URL, SMTP_HOST and SMTP_PORT of the edge-runtime container, each with the
# value of the same key in the tracked template beside it, and EQUAL or DIFFERS as the row's last word. The
# three hold an origin, a host name and a port, never a secret, and are printed. In `before` mode a DIFFERS
# is reported and is not a failure; in `after` mode it is.
#
# --only auth runs the auth part alone, --only edge the edge part alone; without it both run.
#
# The two API keys are captured from `supabase status -o env` into shell variables. They are never echoed,
# never written to a file and never put on a command line: each request hands its headers to curl on standard
# input.
#
# Exit codes:
#   0  every row OK (and, in `after` mode, every edge row EQUAL)
#   1  at least one MISMATCH, or a DIFFERS in `after` mode
#   2  usage error
#   3  a service or a container did not answer, or a key could not be read

set -u

SELF="174-stack-probe.sh"
usage() {
  echo "usage: $SELF <before|after> [--only <auth|edge>]" >&2
  exit 2
}

MODE="${1:-}"
case "$MODE" in
  before | after) ;;
  *) usage ;;
esac
shift
ONLY=""
while [ $# -gt 0 ]; do
  case "$1" in
    --only)
      if [ $# -lt 2 ]; then echo "$SELF: --only requires a value" >&2; usage; fi
      case "$2" in
        auth | edge) ONLY="$2" ;;
        *) echo "$SELF: --only takes auth or edge" >&2; usage ;;
      esac
      shift 2
      ;;
    *) echo "$SELF: unexpected argument '$1'" >&2; usage ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$REPO_ROOT" || exit 2

NVM_NODE_DIR="$HOME/.nvm/versions/node"
if [ -x "$NVM_NODE_DIR/v24.21.0/bin/node" ]; then export PATH="$NVM_NODE_DIR/v24.21.0/bin:$PATH"; fi

API="http://127.0.0.1:54321"
AUTH_CONTAINER="supabase_auth_openvaa-local"
EDGE_CONTAINER="supabase_edge_runtime_openvaa-local"
TEMPLATE="apps/supabase/supabase/functions/.env.example"
PROBE_PREFIX="r174-probe-"

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

row() {
  # $1 what, $2 observed, $3 expected
  local verdict="OK"
  if [ "$2" != "$3" ]; then
    verdict="MISMATCH"
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

run_auth() {
  local exp_disable exp_autoconfirm exp_signup exp_otp
  if [ "$MODE" = before ]; then
    exp_disable=false; exp_autoconfirm=true; exp_signup="200 -"; exp_otp="200 -"
  else
    exp_disable=true; exp_autoconfirm=false; exp_signup="422 signup_disabled"; exp_otp="422 signup_disabled"
  fi

  if ! container_running "$AUTH_CONTAINER"; then
    echo "$SELF: the container $AUTH_CONTAINER is not running -- is the stack up?" >&2
    exit 3
  fi

  local status_env anon service
  status_env="$(cd apps/supabase && yarn supabase status -o env 2> /dev/null)"
  anon="$(printf '%s\n' "$status_env" | sed -n 's/^ANON_KEY="\{0,1\}\([^"]*\)"\{0,1\}$/\1/p' | head -n 1)"
  service="$(printf '%s\n' "$status_env" | sed -n 's/^SERVICE_ROLE_KEY="\{0,1\}\([^"]*\)"\{0,1\}$/\1/p' | head -n 1)"
  status_env=""
  if [ -z "$anon" ] || [ -z "$service" ]; then
    echo "$SELF: could not read the two API keys from 'supabase status -o env' -- is the stack up?" >&2
    exit 3
  fi

  echo "auth part"
  printf '%-52s %-24s %-24s %s\n' 'check' 'observed' 'expected' 'verdict'
  row "container GOTRUE_DISABLE_SIGNUP" "$(container_var "$AUTH_CONTAINER" GOTRUE_DISABLE_SIGNUP)" "$exp_disable"
  row "container GOTRUE_MAILER_AUTOCONFIRM" "$(container_var "$AUTH_CONTAINER" GOTRUE_MAILER_AUTOCONFIRM)" "$exp_autoconfirm"

  local answer code body
  answer="$(request "$anon" "$API/auth/v1/settings")"
  code="$(status_of "$answer")"
  body="$(body_of "$answer")"
  if [ "$code" != 200 ]; then
    echo "$SELF: GET /auth/v1/settings answered '${code:-nothing}' -- the auth service did not answer" >&2
    exit 3
  fi
  row "settings disable_signup" "$(printf '%s' "$body" | json_field disable_signup)" "$exp_disable"
  row "settings mailer_autoconfirm" "$(printf '%s' "$body" | json_field mailer_autoconfirm)" "$exp_autoconfirm"

  local epoch password signup_address otp_address
  epoch="$(date +%s)"
  password="$(node -e 'console.log(require("node:crypto").randomBytes(24).toString("base64url"))')"
  signup_address="${PROBE_PREFIX}signup-${epoch}@test.openvaa.local"
  otp_address="${PROBE_PREFIX}otp-${epoch}@test.openvaa.local"

  answer="$(request "$anon" -X POST -H 'Content-Type: application/json' \
    --data "{\"email\":\"$signup_address\",\"password\":\"$password\"}" "$API/auth/v1/signup")"
  code="$(status_of "$answer")"
  if [ -z "$code" ] || [ "$code" = 000 ]; then
    echo "$SELF: POST /auth/v1/signup got no answer" >&2
    exit 3
  fi
  row "live POST /signup (status, error_code)" "$code $(body_of "$answer" | json_field error_code)" "$exp_signup"

  answer="$(request "$anon" -X POST -H 'Content-Type: application/json' \
    --data "{\"email\":\"$otp_address\",\"create_user\":true}" "$API/auth/v1/otp")"
  code="$(status_of "$answer")"
  if [ -z "$code" ] || [ "$code" = 000 ]; then
    echo "$SELF: POST /auth/v1/otp got no answer" >&2
    exit 3
  fi
  row "live POST /otp create_user (status, error_code)" "$code $(body_of "$answer" | json_field error_code)" "$exp_otp"
  answer=""
  password=""

  # Cleanup, in both modes: every probe user is deleted through the admin API and none may remain.
  local found=0 remaining ids id
  if ! ids="$(probe_user_ids "$service")"; then
    echo "$SELF: GET /auth/v1/admin/users did not answer 200 -- the probe's users could not be listed" >&2
    exit 3
  fi
  for id in $ids; do
    found=$((found + 1))
    request "$service" -X DELETE "$API/auth/v1/admin/users/$id" > /dev/null
  done
  if ! ids="$(probe_user_ids "$service")"; then
    echo "$SELF: GET /auth/v1/admin/users did not answer 200 -- the cleanup could not be confirmed" >&2
    exit 3
  fi
  remaining=0
  for id in $ids; do remaining=$((remaining + 1)); done
  if [ "$MODE" = after ]; then
    row "probe users (found, remaining)" "$found found, $remaining left" "0 found, 0 left"
  else
    # Open sign-up creates one user per live request; how many were found is reported, and none may remain.
    row "probe users remaining ($found found and deleted)" "$remaining left" "0 left"
  fi
  echo
}

run_edge() {
  if ! container_running "$EDGE_CONTAINER"; then
    echo "$SELF: the container $EDGE_CONTAINER is not running -- is the stack up?" >&2
    exit 3
  fi
  if [ ! -f "$TEMPLATE" ]; then
    echo "$SELF: the tracked template $TEMPLATE is missing" >&2
    exit 3
  fi
  echo "edge part"
  printf '%-10s %-32s %-32s %s\n' 'variable' 'edge container' 'tracked template' 'verdict'
  local name observed tracked verdict
  for name in SITE_URL SMTP_HOST SMTP_PORT; do
    observed="$(container_var "$EDGE_CONTAINER" "$name")"
    tracked="$(sed -n "s/^$name=//p" "$TEMPLATE" | head -n 1)"
    if [ "$observed" = "$tracked" ]; then
      verdict="EQUAL"
    else
      verdict="DIFFERS"
      if [ "$MODE" = after ]; then MISMATCH=1; fi
    fi
    printf '%-10s %-32s %-32s %s\n' "$name" "$observed" "${tracked:-(no such key)}" "$verdict"
  done
  echo
}

echo "mode: $MODE${ONLY:+ (only the $ONLY part)}"
echo
if [ "$ONLY" != edge ]; then run_auth; fi
if [ "$ONLY" != auth ]; then run_edge; fi

if [ "$MISMATCH" -ne 0 ]; then
  echo "$SELF [$MODE]: MISMATCH"
  exit 1
fi
echo "$SELF [$MODE]: every row OK"
exit 0
