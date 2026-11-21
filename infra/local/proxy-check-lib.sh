# shellcheck shell=bash
#
# proxy-check-lib.sh -- What check-proxy-topology.sh and check-proxy-sigterm.sh share: the compose wrapper, the exit traps and the teardown, the bounded build, the variants and their readiness, the login page's path, the summary lines and the pre-flight guards. Sourced, never run.
#
# The sourcing script sets SCRIPT_NAME and SCRIPT_DIR before it sources this file. Once its arguments are parsed it calls read_settings, then preflight. Its header, from the second line to `set -euo pipefail`, is its usage text.

REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd -P)"
# shellcheck source=../../scripts/lib/cli.sh
. "$REPO_ROOT/scripts/lib/cli.sh"
# shellcheck source=../../scripts/lib/redact.sh
. "$REPO_ROOT/scripts/lib/redact.sh"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.proxy.yml"

PROJECT="openvaa-proxy-check"
FRONTEND_IMAGE="$PROJECT-frontend"
PUBLIC_HOST="vaa.example.test"
LOGIN_ROUTE="/contestant/login"

# Seconds. A page of this application answers only after its retries against an unreachable backend have run out, so one request can take far longer than the server takes to start.
REQUEST_TIMEOUT=90
READY_TIMEOUT=90
BUILD_TIMEOUT=2700
# The timeout of a recreation and of the teardown. A container that does not stop by itself is not waited for there.
STOP_TIMEOUT=10

OUT_DIR=""
KEEP=0
OVERRIDE_FILE=""
SUMMARY=""
PRIVATE_DIR=""
CHILD_PID=""
STACK_TOUCHED=0
# An image this run tagged, removed at teardown unless --keep.
TAGGED_IMAGE=""
FAILED=0
SHA=""
LOGIN_PATH="$LOGIN_ROUTE"
LOGIN_URL=""
LOGIN_FOLLOWED=""

# Every value comes from this process's environment: no .env file takes part in the interpolation.
# OVERRIDE_FILE, when set, is layered over the compose file; the project name stays the same, so teardown removes either stack.
compose() {
  if [ -n "$OVERRIDE_FILE" ]; then
    docker compose --env-file /dev/null -f "$COMPOSE_FILE" -f "$OVERRIDE_FILE" "$@"
  else
    docker compose --env-file /dev/null -f "$COMPOSE_FILE" "$@"
  fi
}

end_child() {
  if [ -n "$CHILD_PID" ]; then
    pkill -TERM -P "$CHILD_PID" 2> /dev/null || true
    kill -TERM "$CHILD_PID" 2> /dev/null || true
    wait "$CHILD_PID" 2> /dev/null || true
    CHILD_PID=""
  fi
}

teardown() {
  if [ "$STACK_TOUCHED" -eq 1 ]; then
    if [ "$KEEP" -eq 1 ]; then
      echo "$SCRIPT_NAME: --keep: the stack is left running. Remove it with: docker compose -f $COMPOSE_FILE down" >&2
    else
      compose down --remove-orphans --timeout "$STOP_TIMEOUT" > "$OUT_DIR/compose-down.log" 2>&1 ||
        echo "$SCRIPT_NAME: the stack could not be removed. Run: docker compose -f $COMPOSE_FILE down" >&2
      if [ -n "$TAGGED_IMAGE" ]; then
        docker image rm "$TAGGED_IMAGE" > /dev/null 2>&1 || true
      fi
    fi
  fi
  if [ -n "$PRIVATE_DIR" ]; then
    rm -rf -- "$PRIVATE_DIR" || true
  fi
}

on_exit() {
  local status=$?
  trap - EXIT
  end_child
  teardown
  exit "$status"
}

on_interrupt() {
  trap - INT TERM
  echo "$SCRIPT_NAME: interrupted" >&2
  exit 130
}

trap on_exit EXIT
trap on_interrupt INT TERM

# $1 = message. For everything that keeps the check from running after the arguments were accepted.
could_not_run() {
  fatal "$1" 3
}

is_digits() {
  case "$1" in
    '' | *[!0123456789]*) return 1 ;;
    *) return 0 ;;
  esac
}

# Runs a command with its output in a file and ends it when it outlasts the bound. $1 = seconds, $2 = log file, the rest = the command. Returns the command's status, or 124 when it was ended.
run_bounded() {
  local limit="$1" log="$2" started status=0
  shift 2
  "$@" > "$log" 2>&1 &
  CHILD_PID=$!
  started="$(date +%s)"
  while kill -0 "$CHILD_PID" 2> /dev/null; do
    if [ $(($(date +%s) - started)) -ge "$limit" ]; then
      end_child
      return 124
    fi
    sleep 2
  done
  wait "$CHILD_PID" || status=$?
  CHILD_PID=""
  return "$status"
}

# Removes the two values that must not be written anywhere from the text on standard input, then every other credential print_redacted recognises.
scrub() {
  SCRUB_KEY="${PROXY_CHECK_SUPABASE_ANON_KEY:-}" SCRUB_PASSWORD="${PROXY_CHECK_LOGIN_PASSWORD:-}" awk '
    (ENVIRON["SCRUB_KEY"] != "" && index($0, ENVIRON["SCRUB_KEY"])) ||
    (ENVIRON["SCRUB_PASSWORD"] != "" && index($0, ENVIRON["SCRUB_PASSWORD"])) {
      print "<a line holding the key or the password was removed>"
      next
    }
    { print }
  ' | print_redacted
}

# Appends one line to summary.txt. $1 = label, $2 = expected, $3 = observed, $4 = PASS, FAIL or NOT-RUN.
record() {
  printf '%s | expected: %s | observed: %s | %s\n' "$1" "$2" "$3" "$4" >> "$SUMMARY"
  if [ "$4" = "FAIL" ]; then
    FAILED=1
  fi
}

# $1 = label, $2 = the expected value, $3 = the observed value.
expect_equal() {
  if [ "$3" = "$2" ]; then
    record "$1" "$2" "$3" PASS
  else
    record "$1" "$2" "${3:-<nothing>}" FAIL
  fi
}

# Waits until the health route answers 200 through the proxy.
wait_ready() {
  local deadline code
  deadline=$(($(date +%s) + READY_TIMEOUT))
  while [ "$(date +%s)" -lt "$deadline" ]; do
    code="$(curl -s --max-time 5 --resolve "$PUBLIC_HOST:$PORT:127.0.0.1" -o /dev/null -w '%{http_code}' \
      "$PUBLIC_ORIGIN/api/health" 2> /dev/null)" || code="000"
    if [ "$code" = "200" ]; then
      return 0
    fi
    sleep 1
  done
  return 1
}

# $1 = variant name. Keeps what the frontend container wrote, for the diagnosis of a line that failed.
save_frontend_log() {
  compose logs --no-color frontend 2>&1 | scrub > "$OUT_DIR/variant-$1.frontend.log" || true
}

# Recreates both containers. $1 = variant name, the rest = NAME=value pairs that hold for this variant only.
start_variant() {
  local name="$1" pair
  shift
  STACK_TOUCHED=1
  if ! (
    for pair in "$@"; do
      export "${pair?}"
    done
    compose up -d --no-build --force-recreate --timeout "$STOP_TIMEOUT"
  ) > "$OUT_DIR/variant-$name.compose.log" 2>&1; then
    could_not_run "the containers of the variant '$name' did not start; see $OUT_DIR/variant-$name.compose.log"
  fi
  if ! wait_ready; then
    save_frontend_log "$name"
    could_not_run "the health route did not answer 200 through the proxy within $READY_TIMEOUT s in the variant '$name'; see $OUT_DIR/variant-$name.frontend.log"
  fi
  echo "$SCRIPT_NAME: variant '$name' is up"
}

# $1 = log file; the caller's environment decides whether the build gets BUILD_SHA.
build_frontend() {
  local status=0
  run_bounded "$BUILD_TIMEOUT" "$1" compose build frontend || status=$?
  if [ "$status" -eq 124 ]; then
    could_not_run "the image build outlasted $BUILD_TIMEOUT s and was ended; see $1"
  fi
  if [ "$status" -ne 0 ]; then
    tail -n 25 "$1" >&2 || true
    could_not_run "the image build exited $status; see $1"
  fi
}

# Follows the login route through the proxy and sets LOGIN_FOLLOWED to "<status> <final URL>" and LOGIN_URL to that URL.
# When the URL is on the public origin, sets LOGIN_PATH to its path without the query and returns 0; otherwise leaves LOGIN_PATH as it was and returns 1.
resolve_login_path() {
  LOGIN_FOLLOWED="$(curl -sS --max-time "$REQUEST_TIMEOUT" --resolve "$PUBLIC_HOST:$PORT:127.0.0.1" -L --max-redirs 5 \
    -o /dev/null -w '%{http_code} %{url_effective}' "$PUBLIC_ORIGIN$LOGIN_ROUTE" 2>> "$OUT_DIR/curl-errors.log")" || LOGIN_FOLLOWED="000 none"
  LOGIN_URL="${LOGIN_FOLLOWED#* }"
  case "$LOGIN_URL" in
    "$PUBLIC_ORIGIN"/*)
      LOGIN_PATH="${LOGIN_URL#"$PUBLIC_ORIGIN"}"
      LOGIN_PATH="${LOGIN_PATH%%\?*}"
      return 0
      ;;
    *) return 1 ;;
  esac
}

# Prints summary.txt and exits with the verdict's status.
finish() {
  echo
  cat "$SUMMARY"
  echo
  if [ "$FAILED" -ne 0 ]; then
    echo "$SCRIPT_NAME: an observation differed from what was expected; see the FAIL lines above and the files in $OUT_DIR" >&2
    exit 1
  fi
  echo "$SCRIPT_NAME: every observation was as expected"
  exit 0
}

# Checks the settings the arguments and the environment give, and exits 2 on a bad one. Sets OUT_DIR to an absolute path, PORT, BASE_DEPTH and PUBLIC_ORIGIN, and holds BUILD_SHA in SHA, so a build gets it only when the caller passes it on.
read_settings() {
  if [ -z "$OUT_DIR" ]; then
    usage_error "--out is required"
  fi
  OUT_DIR="$(resolve_path "$OUT_DIR")"

  PORT="${PROXY_CHECK_PORT:-8181}"
  if ! is_digits "$PORT"; then
    usage_error "PROXY_CHECK_PORT must be a number, got: $PORT"
  fi
  BASE_DEPTH="${PROXY_CHECK_XFF_DEPTH:-1}"
  if ! is_digits "$BASE_DEPTH" || [ "$BASE_DEPTH" -lt 1 ]; then
    usage_error "PROXY_CHECK_XFF_DEPTH must be a number from 1, got: $BASE_DEPTH"
  fi
  PUBLIC_ORIGIN="http://$PUBLIC_HOST:$PORT"

  SHA="${BUILD_SHA:-}"
  unset BUILD_SHA
}

# The guards that run before anything is built or started, and the files and the environment every variant uses.
preflight() {
  install -d "$OUT_DIR" || fatal "the directory $OUT_DIR could not be created" 2
  SUMMARY="$OUT_DIR/summary.txt"
  : > "$SUMMARY"
  : > "$OUT_DIR/curl-errors.log"

  if ! docker version > "$OUT_DIR/docker-version.txt" 2>&1; then
    could_not_run "the docker daemon did not answer"
  fi
  if ! compose version > "$OUT_DIR/compose-version.txt" 2>&1; then
    could_not_run "docker compose is not available"
  fi

  PROXY_IMAGE="$(sed -n 's/^[[:space:]]*image:[[:space:]]*\(nginx@sha256:[0-9a-f]\{64\}\)[[:space:]]*$/\1/p' "$COMPOSE_FILE" | sed -n '1p')"
  if [ -z "$PROXY_IMAGE" ]; then
    could_not_run "$COMPOSE_FILE pins no nginx image by digest"
  fi
  if ! docker image inspect "$PROXY_IMAGE" > /dev/null 2>&1; then
    echo "$SCRIPT_NAME: the proxy image is not present locally, and this script does not pull it." >&2
    echo "$SCRIPT_NAME: fetch it deliberately, then retry:  docker pull $PROXY_IMAGE" >&2
    could_not_run "proxy image not present locally"
  fi

  if [ -n "$(compose ps -aq 2> /dev/null)" ]; then
    could_not_run "containers of the project $PROJECT already exist. Remove them with: docker compose -f $COMPOSE_FILE down"
  fi
  if port_has_listener "$PORT"; then
    could_not_run "port $PORT is in use; set PROXY_CHECK_PORT to a free port"
  fi

  if [ -z "$SHA" ]; then
    SHA="$(git -C "$REPO_ROOT" rev-parse HEAD 2> /dev/null)" || could_not_run "BUILD_SHA is not set and the commit of $REPO_ROOT could not be read"
  fi

  PRIVATE_DIR="$(mktemp -d "${TMPDIR:-/tmp}/proxy-check.XXXXXX")" || could_not_run "no private temporary directory could be created"
  chmod 700 "$PRIVATE_DIR"

  export PROXY_CHECK_PORT="$PORT"
  export PROXY_CHECK_ORIGIN="$PUBLIC_ORIGIN"
  export PROXY_CHECK_XFF_DEPTH="$BASE_DEPTH"
  export PROXY_CHECK_DIAGNOSTICS=""

  echo "$SCRIPT_NAME: public origin $PUBLIC_ORIGIN, proxy image $PROXY_IMAGE"
  echo "$SCRIPT_NAME: output in $OUT_DIR"
}
