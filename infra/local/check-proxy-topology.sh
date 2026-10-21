#!/usr/bin/env bash
#
# check-proxy-topology.sh -- Run the frontend production image behind a reverse proxy and check, with a
#                            negative control for every observation, that the server resolves the public
#                            origin and the client's address as a deployment needs.
#
# ORIGIN, ADDRESS_HEADER and XFF_DEPTH configure the Node adapter, not the application. Only a run behind a proxy shows that a form post passes the origin check and that a forwarded address cannot be spoofed. This script builds the image, starts it behind the nginx of docker-compose.proxy.yml and reaches it as the public origin only: every request names http://vaa.example.test:<port> and is sent to 127.0.0.1 with curl --resolve, while the proxy reaches the container under the name `frontend`. For each variant it recreates the containers with other environment values; it never rebuilds for a variant.
#
# Usage:
#   ```sh
#   infra/local/check-proxy-topology.sh --out /tmp/proxy-check
#   PROXY_CHECK_SUPABASE_URL=http://host.docker.internal:55800 PROXY_CHECK_SUPABASE_ANON_KEY=<key> \
#     PROXY_CHECK_LOGIN_EMAIL=<address> PROXY_CHECK_LOGIN_PASSWORD=<password> \
#     infra/local/check-proxy-topology.sh --out /tmp/proxy-check --with-login
#   infra/local/check-proxy-topology.sh --out /tmp/proxy-sigterm --sigterm
#   ```
#
#   --out <dir>     REQUIRED. Receives summary.txt, one file per observation, and the logs of the builds and of each variant. A relative path is resolved against the REPO ROOT, never against $PWD.
#   --with-login    OPTIONAL. Also post a real login through the proxy and follow its redirect. Needs PROXY_CHECK_SUPABASE_URL, PROXY_CHECK_SUPABASE_ANON_KEY, PROXY_CHECK_LOGIN_EMAIL and PROXY_CHECK_LOGIN_PASSWORD in the environment. The URL must be one the CONTAINER can reach, so a Supabase on this host is http://host.docker.internal:<port>.
#   --sigterm       OPTIONAL. Run ONLY observation 7 below, not observations 1 to 6. It uses the frontend image already present and builds it, with BUILD_SHA, only when none is. It cannot be combined with --with-login.
#   --keep         OPTIONAL. Leave the stack of the last variant running, and the control image in place.
#   -h, --help      Print this header and exit 0.
#
# Observations. Each writes lines to summary.txt of the form `label | expected: ... | observed: ... | PASS` (or FAIL), and its control runs BEFORE the observation the control licenses:
#   1. Build id. /api/health answers 200 and names the BUILD_SHA given to the build, and /_app/version.json names the same. Control: an image built with no build argument names a string of digits.
#   2. Origin. The diagnostics response reports the configured ORIGIN. Control: with ORIGIN set to another origin, it reports that other origin.
#   3. Form post. A POST to the login form with the public origin in its Origin header is not answered 403. Control: the same POST with Origin: http://attacker.example is answered 403 "Cross-site POST form submissions are forbidden".
#   4. Login, under --with-login. The POST of the address and the password is answered 303 with a Location that is a path or begins with the public origin and names neither the container nor a loopback host; following it with the session's cookies ends on the public origin.
#   5. Spoof. A request carrying X-Forwarded-For: 203.0.113.99 is not attributed to that address. Control: with XFF_DEPTH one higher it is, which shows the check can see a spoof.
#   6. Diagnostics switch. /api/diagnostics is 404 with DEPLOYMENT_DIAGNOSTICS unset. Control: 200 when it is true.
#   7. Stop signal, under --sigterm only. Process 1 of the frontend container is node. A slow form upload to the login action, rate-limited with curl --limit-rate and passed on by the proxy as it arrives, is first timed with no signal: it must stay open at least 8 s and at most 20 s, or the leg cannot show anything and exits 3. The same upload is then started, and 2 s later the container is stopped with a timeout of 40 s, above the adapter's own 30 s. The upload must end with the status it had with no signal, and the container must exit by itself, with an exit code other than 137, in under 35 s. Control: the same with the entry point forced to /bin/sh -c "node ./apps/frontend/build/index.js" by an override file written to --out; its process 1, the upload's outcome, the seconds to exit and the exit code are recorded whichever way they go, and the leg fails on the control only when it could not be run. The upload asks for JSON, so the action's answer is not followed by a page render.
#
# Environment:
#   BUILD_SHA                      The id given to the image build. Default: the commit the checkout is on.
#   PROXY_CHECK_PORT               The host port of the proxy, on 127.0.0.1. Default 8181. The public origin is http://vaa.example.test:<this port>.
#   PROXY_CHECK_ADDRESS_HEADER     Passed to the container as ADDRESS_HEADER. Default x-forwarded-for.
#   PROXY_CHECK_XFF_DEPTH          Passed as XFF_DEPTH: the number of proxies in front of the server. Default 1. The spoof control runs with one more.
#   PROXY_CHECK_SUPABASE_URL, PROXY_CHECK_SUPABASE_ANON_KEY, PROXY_CHECK_PROJECT_ID
#                                  Passed as the three PUBLIC_ variables. Unset, the server starts against a closed port and every read of the backend fails, which the observations other than the login do not need.
#   PROXY_CHECK_LOGIN_EMAIL, PROXY_CHECK_LOGIN_PASSWORD
#                                  The account of the login leg.
#   PROXY_CHECK_ORIGIN and PROXY_CHECK_DIAGNOSTICS are set by this script for each variant; a value in the caller's environment is not used.
#
# Neither the key nor the password is printed or written to --out: the password reaches curl through a file in a private temporary directory, the login's response headers and cookies stay in that directory, and it is removed on every way out. Shell tracing must stay off.
#
# Prerequisites. This script ASSERTS them; it never performs them:
#   1. Docker is running.
#   2. The proxy image docker-compose.proxy.yml pins is ALREADY PRESENT locally. This script does not pull it: a pull that waits on a credential helper stalls with no output, and would read as a hung check.
#   3. Nothing listens on the proxy's host port, and no container of the project openvaa-proxy-check exists.
#
# Exit codes -- the caller must be able to branch on the status alone:
#   0:  every observation was as expected
#   1:  an observation differed from what was expected; summary.txt names it with FAIL
#   2:  usage error
#   3:  the check could not run: Docker is unavailable, the proxy image is not present, a build failed or outlasted its bound, the port is in use, the server did not come up, or under --sigterm no rate kept the upload open for 8 to 20 s or the control could not be run
#   130:  interrupted (SIGINT/SIGTERM). Never 0.

set -euo pipefail

# Auto-detect paths from the script's location, so the script behaves identically from any working directory.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd -P)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.proxy.yml"

PROJECT="openvaa-proxy-check"
FRONTEND_IMAGE="$PROJECT-frontend"
CONTROL_IMAGE="$FRONTEND_IMAGE:no-build-arg"
PUBLIC_HOST="vaa.example.test"
OTHER_HOST="other-origin.example.test"
FOREIGN_ORIGIN="http://attacker.example"
SPOOFED_ADDRESS="203.0.113.99"
FORBIDDEN_TEXT="Cross-site POST form submissions are forbidden"
LOGIN_ROUTE="/contestant/login"
# The Accept header of a browser's native form submission. Kit answers a form action as JSON, with status 200 whatever the action's result, when Accept prefers application/json, and curl's default */* does.
FORM_ACCEPT="Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"

# Seconds. A page of this application answers only after its retries against an unreachable backend have run out, so one request can take far longer than the server takes to start.
REQUEST_TIMEOUT=90
READY_TIMEOUT=90
BUILD_TIMEOUT=2700
# Observations 1 to 6 do not measure shutdown, so a container that does not stop by itself is not waited for there.
STOP_TIMEOUT=10
# Observation 7. The signal timeout is above adapter-node's SHUTDOWN_TIMEOUT of 30 s, so the adapter's own drain runs to its end before the runtime kills the process; a stop that lasts until the drain bound is a process that did not exit by itself.
SIGNAL_STOP_TIMEOUT=40
DRAIN_BOUND=35
SLOW_MIN_SECONDS=8
SLOW_MAX_SECONDS=20
SIGNAL_DELAY=2
# Pairs of body size in bytes and upload rate in bytes per second, tried in order until one keeps the upload open for SLOW_MIN_SECONDS to SLOW_MAX_SECONDS. Every body is far below the adapter's BODY_SIZE_LIMIT of 512K.
SLOW_CANDIDATES="36000:3000 60000:4000 60000:3000 100000:6000"
SHELL_FORM_COMMAND="node ./apps/frontend/build/index.js"

OUT_DIR=""
WITH_LOGIN=0
KEEP=0
SIGTERM_ONLY=0
OVERRIDE_FILE=""
SUMMARY=""
PRIVATE_DIR=""
CHILD_PID=""
STACK_TOUCHED=0
CONTROL_TAGGED=0
FAILED=0
LOGIN_PATH="$LOGIN_ROUTE"

usage() {
  # Delimit the header block rather than hardcoding a line range, so the exit-code table is never truncated when the header grows.
  sed -n '2,/^set -euo pipefail/p' "${BASH_SOURCE[0]}" | sed '$d'
}

fatal() {
  echo "check-proxy-topology.sh: FATAL -- $1" >&2
  exit "$2"
}

usage_error() {
  usage >&2
  fatal "$1" 2
}

# A value-taking flag given as the LAST argument must be a usage error. `shift 2` with one positional left fails, and under `set -e` the script would die with status 1, which the table above gives to a failed observation.
#
# $1 = flag name, $2 = the caller's remaining argument count ($#).
require_value() {
  if [ "$2" -lt 2 ]; then
    usage_error "$1 requires a value"
  fi
}

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
      echo "check-proxy-topology.sh: --keep: the stack is left running. Remove it with: docker compose -f $COMPOSE_FILE down" >&2
    else
      compose down --remove-orphans --timeout "$STOP_TIMEOUT" > "$OUT_DIR/compose-down.log" 2>&1 ||
        echo "check-proxy-topology.sh: the stack could not be removed. Run: docker compose -f $COMPOSE_FILE down" >&2
      if [ "$CONTROL_TAGGED" -eq 1 ]; then
        docker image rm "$CONTROL_IMAGE" > /dev/null 2>&1 || true
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
  echo "check-proxy-topology.sh: interrupted" >&2
  exit 130
}

trap on_exit EXIT
trap on_interrupt INT TERM

# --- helpers ----------------------------------------------------------------------

# $1 = message. For everything that keeps the check from running after the arguments were accepted.
could_not_run() {
  fatal "$1" 3
}

# A TCP connection that opens on either loopback address means something listens there.
port_has_listener() {
  (exec 3<> "/dev/tcp/127.0.0.1/$1") 2> /dev/null && return 0
  (exec 3<> "/dev/tcp/::1/$1") 2> /dev/null && return 0
  return 1
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

# Removes the two values that must not be written anywhere, and anything shaped like a JWT, from the text on standard input.
scrub() {
  SCRUB_KEY="${PROXY_CHECK_SUPABASE_ANON_KEY:-}" SCRUB_PASSWORD="${PROXY_CHECK_LOGIN_PASSWORD:-}" awk '
    (ENVIRON["SCRUB_KEY"] != "" && index($0, ENVIRON["SCRUB_KEY"])) ||
    (ENVIRON["SCRUB_PASSWORD"] != "" && index($0, ENVIRON["SCRUB_PASSWORD"])) {
      print "<a line holding the key or the password was removed>"
      next
    }
    { print }
  ' | sed -E 's/eyJ[A-Za-z0-9_-]{10,}(\.[A-Za-z0-9_-]+)*/<redacted>/g'
}

# Sends one request to the proxy as the public origin and prints the status, or 000 when no answer came. $1 = file for the body, $2 = file for the response headers, the rest = curl arguments, the URL among them.
request() {
  local body="$1" headers="$2" code
  shift 2
  code="$(curl -sS --max-time "$REQUEST_TIMEOUT" --resolve "$PUBLIC_HOST:$PORT:127.0.0.1" \
    -o "$body" -D "$headers" -w '%{http_code}' "$@" 2>> "$OUT_DIR/curl-errors.log")" || code="000"
  printf '%s' "$code"
}

# Prints the string value of one member of a one-line JSON object, and nothing when the member is absent or not a string. $1 = file, $2 = member.
json_string() {
  sed -n 's/.*"'"$2"'":"\([^"]*\)".*/\1/p' "$1" | sed -n '1p'
}

# Prints the value of one response header, without its carriage return. $1 = headers file, $2 = lower-case name.
header_value() {
  awk -v want="$2" '
    {
      line = $0
      sub(/\r$/, "", line)
      split(line, parts, ":")
      if (tolower(parts[1]) == want) {
        sub(/^[^:]*:[ \t]*/, "", line)
        print line
        exit
      }
    }
  ' "$1"
}

# Appends one line to summary.txt. $1 = label, $2 = expected, $3 = observed, $4 = PASS, FAIL, NOT-RUN, or RECORDED for a control that is recorded whichever way it goes.
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

# $1 = label, $2 = the observed value.
expect_digits() {
  if is_digits "$2"; then
    record "$1" "a string of digits" "$2" PASS
  else
    record "$1" "a string of digits" "${2:-<nothing>}" FAIL
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
  echo "check-proxy-topology.sh: variant '$name' is up"
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

# Prints summary.txt and exits with the verdict's status.
finish() {
  echo
  cat "$SUMMARY"
  echo
  if [ "$FAILED" -ne 0 ]; then
    echo "check-proxy-topology.sh: an observation differed from what was expected; see the FAIL lines above and the files in $OUT_DIR" >&2
    exit 1
  fi
  echo "check-proxy-topology.sh: every observation was as expected"
  exit 0
}

# --- helpers of observation 7, the stop signal --------------------------------------

# The helpers below compare and print decimal seconds with awk, which follows LC_NUMERIC: a locale with a decimal comma prints 9,1, which awk then compares as a string.
c_awk() {
  LC_ALL=C awk "$@"
}

# Prints the wall-clock time in seconds, with one decimal where perl is present.
now() {
  perl -MTime::HiRes=time -e 'printf "%.1f\n", time' 2> /dev/null || date +%s
}

# Succeeds when $1 lies in [$2, $3]. The values may carry decimals.
in_range() {
  c_awk -v v="$1" -v lo="$2" -v hi="$3" 'BEGIN { exit !(v >= lo && v <= hi) }'
}

# Succeeds when $1 is below $2. The values may carry decimals.
below() {
  c_awk -v v="$1" -v hi="$2" 'BEGIN { exit !(v < hi) }'
}

# Prints the command line of process 1 of the running frontend container, its arguments separated by spaces, or nothing when it cannot be read.
pid1_command() {
  { compose exec -T frontend cat /proc/1/cmdline 2> /dev/null || true; } | tr '\0' ' ' | sed 's/ *$//'
}

# Sets LOGIN_PATH to the path the login page is served at once its redirects are followed, as observation 3 does.
resolve_login_path() {
  local followed url
  followed="$(curl -sS --max-time "$REQUEST_TIMEOUT" --resolve "$PUBLIC_HOST:$PORT:127.0.0.1" -L --max-redirs 5 \
    -o /dev/null -w '%{http_code} %{url_effective}' "$PUBLIC_ORIGIN$LOGIN_ROUTE" 2>> "$OUT_DIR/curl-errors.log")" || followed="000 none"
  url="${followed#* }"
  case "$url" in
    "$PUBLIC_ORIGIN"/*)
      LOGIN_PATH="${url#"$PUBLIC_ORIGIN"}"
      LOGIN_PATH="${LOGIN_PATH%%\?*}"
      ;;
    *) could_not_run "the login page did not resolve on the public origin: $followed" ;;
  esac
}

# Writes a form body of exactly $1 bytes to $2: a login form with a padding field. It names no real account.
make_body() {
  local prefix='email=nobody%40example.test&password=not-a-password&pad='
  {
    printf '%s' "$prefix"
    head -c $(($1 - ${#prefix})) /dev/zero | tr '\0' 'a'
  } > "$2"
}

# Sends the slow upload to the login action as the public origin and prints "<status> <seconds> <curl exit>". The status is 000 when no answer came or the transfer broke off. $1 = body file, $2 = rate in bytes per second, $3 = file for the answer's body.
slow_upload() {
  local out status=0
  out="$(curl -sS --max-time "$REQUEST_TIMEOUT" --resolve "$PUBLIC_HOST:$PORT:127.0.0.1" --limit-rate "$2" \
    -H "Accept: application/json" -H "Origin: $PUBLIC_ORIGIN" -H "Content-Type: application/x-www-form-urlencoded" \
    --data-binary "@$1" -o "$3" -w '%{http_code} %{time_total}' "$PUBLIC_ORIGIN$LOGIN_PATH" 2>> "$OUT_DIR/curl-errors.log")" || status=$?
  case "$out" in
    *' '*) : ;;
    *) out="000 0" ;;
  esac
  if [ "$status" -ne 0 ]; then
    out="000 ${out#* }"
  fi
  printf '%s %s' "$out" "$status"
}

# Starts the slow upload, stops the frontend container SIGNAL_DELAY s later with a timeout of SIGNAL_STOP_TIMEOUT s, and waits for both. $1 = name of the run, for its files.
# Sets SIG_PID1, SIG_HTTP, SIG_UPLOAD_SECONDS, SIG_CURL_EXIT, SIG_STOP_STATUS, SIG_STOP_SECONDS and SIG_EXIT_CODE.
signal_run() {
  local name="$1" cid started stopped result
  cid="$(compose ps -q frontend 2> /dev/null || true)"
  if [ -z "$cid" ]; then
    could_not_run "the run '$name' found no frontend container"
  fi
  SIG_PID1="$(pid1_command)"
  slow_upload "$SLOW_BODY" "$SLOW_RATE" "$OUT_DIR/$name.upload.body" > "$OUT_DIR/$name.upload.result" &
  CHILD_PID=$!
  sleep "$SIGNAL_DELAY"
  started="$(now)"
  SIG_STOP_STATUS=0
  docker stop -t "$SIGNAL_STOP_TIMEOUT" "$cid" > "$OUT_DIR/$name.stop.log" 2>&1 || SIG_STOP_STATUS=$?
  stopped="$(now)"
  wait "$CHILD_PID" || true
  CHILD_PID=""
  result="$(cat "$OUT_DIR/$name.upload.result" 2> /dev/null || true)"
  SIG_HTTP="$(echo "$result" | awk '{ print $1 }')"
  SIG_UPLOAD_SECONDS="$(echo "$result" | awk '{ print $2 }')"
  SIG_CURL_EXIT="$(echo "$result" | awk '{ print $3 }')"
  SIG_EXIT_CODE="$(docker inspect --format '{{.State.ExitCode}}' "$cid" 2> /dev/null || true)"
  SIG_STOP_SECONDS="$(c_awk -v a="$started" -v b="$stopped" 'BEGIN { printf "%.1f", b - a }')"
  {
    echo "run '$name':"
    echo "  process 1: ${SIG_PID1:-<not read>}"
    echo "  upload of $SLOW_SIZE bytes at $SLOW_RATE B/s started; the stop was sent $SIGNAL_DELAY s later, with a timeout of $SIGNAL_STOP_TIMEOUT s"
    echo "  upload -> HTTP ${SIG_HTTP:-<none>} after ${SIG_UPLOAD_SECONDS:-?} s, curl exit ${SIG_CURL_EXIT:-?}, body: $(head -c 300 "$OUT_DIR/$name.upload.body" 2> /dev/null | tr -d '\r\n')"
    echo "  docker stop exit $SIG_STOP_STATUS, $SIG_STOP_SECONDS s from the stop to the container's exit"
    echo "  container: $(docker inspect --format 'exit code {{.State.ExitCode}}, OOMKilled {{.State.OOMKilled}}, started {{.State.StartedAt}}, finished {{.State.FinishedAt}}' "$cid" 2> /dev/null || echo '<not inspected>')"
  } >> "$FILE"
  save_frontend_log "$name"
}

# Observation 7. Ends the script with the verdict.
run_sigterm_leg() {
  local candidate result code seconds chosen=0 image_sha

  if docker image inspect "$FRONTEND_IMAGE" > /dev/null 2>&1; then
    echo "check-proxy-topology.sh: using the frontend image already present"
  else
    echo "check-proxy-topology.sh: no frontend image is present; building it with BUILD_SHA=$SHA"
    BUILD_SHA="$SHA" build_frontend "$OUT_DIR/build.log"
  fi
  image_sha="$(docker image inspect --format '{{range .Config.Env}}{{println .}}{{end}}' "$FRONTEND_IMAGE" 2> /dev/null | sed -n 's/^BUILD_SHA=//p')"

  FILE="$OUT_DIR/07-sigterm.txt"
  {
    echo "image: $(docker image inspect --format '{{.Id}}' "$FRONTEND_IMAGE" 2> /dev/null), BUILD_SHA ${image_sha:-<empty>}"
    echo "Dockerfile CMD of the production stage: $(grep '^CMD' "$REPO_ROOT/apps/frontend/Dockerfile" | sed -n '$p')"
  } > "$FILE"

  start_variant sigterm
  resolve_login_path
  echo "the login action: POST $LOGIN_PATH" >> "$FILE"

  # 1. Process 1.
  PID1="$(pid1_command)"
  echo "process 1 of the frontend container: ${PID1:-<not read>}" >> "$FILE"
  case "$PID1" in
    node | node\ *) record "sigterm.pid1" "begins with node" "$PID1" PASS ;;
    *) record "sigterm.pid1" "begins with node" "${PID1:-<nothing>}" FAIL ;;
  esac

  # 2. The upload's duration with no signal, which licenses step 3.
  echo "duration control, no signal:" >> "$FILE"
  for candidate in $SLOW_CANDIDATES; do
    SLOW_SIZE="${candidate%%:*}"
    SLOW_RATE="${candidate#*:}"
    SLOW_BODY="$OUT_DIR/slow-body-$SLOW_SIZE.txt"
    make_body "$SLOW_SIZE" "$SLOW_BODY"
    result="$(slow_upload "$SLOW_BODY" "$SLOW_RATE" "$OUT_DIR/no-signal.upload.body")"
    code="${result%% *}"
    seconds="$(echo "$result" | awk '{ print $2 }')"
    echo "  $SLOW_SIZE bytes at $SLOW_RATE B/s -> HTTP $code after $seconds s, curl exit ${result##* }, body: $(head -c 300 "$OUT_DIR/no-signal.upload.body" 2> /dev/null | tr -d '\r\n')" >> "$FILE"
    if [ "$code" = "000" ]; then
      could_not_run "the slow upload got no answer with no signal sent; see $FILE and $OUT_DIR/curl-errors.log"
    fi
    if in_range "$seconds" "$SLOW_MIN_SECONDS" "$SLOW_MAX_SECONDS"; then
      chosen=1
      break
    fi
  done
  if [ "$chosen" -ne 1 ]; then
    record "sigterm.slow-request.no-signal.seconds" "$SLOW_MIN_SECONDS to $SLOW_MAX_SECONDS" "none of: $SLOW_CANDIDATES" NOT-RUN
    could_not_run "no body size and rate kept the upload open for $SLOW_MIN_SECONDS to $SLOW_MAX_SECONDS s, so the signal leg cannot show a request in flight; see $FILE"
  fi
  NO_SIGNAL_HTTP="$code"
  record "sigterm.slow-request.no-signal.seconds" "$SLOW_MIN_SECONDS to $SLOW_MAX_SECONDS" "$seconds ($SLOW_SIZE bytes at $SLOW_RATE B/s, HTTP $code)" PASS

  # 3. The signal during the upload.
  signal_run sigterm
  if [ -n "$SIG_UPLOAD_SECONDS" ] && below "$SIGNAL_DELAY" "$SIG_UPLOAD_SECONDS"; then
    record "sigterm.in-flight.open-at-signal" "the upload outlasts the $SIGNAL_DELAY s before the stop" "$SIG_UPLOAD_SECONDS s" PASS
  else
    record "sigterm.in-flight.open-at-signal" "the upload outlasts the $SIGNAL_DELAY s before the stop" "${SIG_UPLOAD_SECONDS:-<nothing>} s" FAIL
  fi
  # A proxy error or no answer must not pass as "completed": the status must be the one the action gave with no signal.
  expect_equal "sigterm.in-flight.status" "$NO_SIGNAL_HTTP" "$SIG_HTTP"
  if [ "$SIG_STOP_STATUS" -eq 0 ] && [ -n "$SIG_EXIT_CODE" ] && [ "$SIG_EXIT_CODE" != "137" ] && below "$SIG_STOP_SECONDS" "$DRAIN_BOUND"; then
    record "sigterm.exit.by-itself" "an exit code other than 137 in under $DRAIN_BOUND s" "exit code $SIG_EXIT_CODE after $SIG_STOP_SECONDS s" PASS
  else
    record "sigterm.exit.by-itself" "an exit code other than 137 in under $DRAIN_BOUND s" "exit code ${SIG_EXIT_CODE:-<none>} after $SIG_STOP_SECONDS s (docker stop exit $SIG_STOP_STATUS)" FAIL
  fi

  # 4. Control: the shell-form entry point, recorded whichever way it goes.
  OVERRIDE_FILE="$OUT_DIR/shell-form.override.yml"
  {
    echo "# Written by check-proxy-topology.sh --sigterm: the frontend started through a shell, as a shell-form CMD would start it."
    echo "services:"
    echo "  frontend:"
    echo "    entrypoint: [\"/bin/sh\", \"-c\", \"$SHELL_FORM_COMMAND\"]"
  } > "$OVERRIDE_FILE"
  echo "control, entry point /bin/sh -c \"$SHELL_FORM_COMMAND\" (override: $OVERRIDE_FILE):" >> "$FILE"
  start_variant shell-form-control
  signal_run shell-form-control
  if [ -z "$SIG_PID1" ] || [ "$SIG_STOP_STATUS" -ne 0 ] || [ -z "$SIG_EXIT_CODE" ]; then
    could_not_run "the shell-form control could not be run to its end; see $FILE"
  fi
  record "sigterm.control.shell-form.pid1" "recorded" "$SIG_PID1" RECORDED
  record "sigterm.control.shell-form.in-flight" "recorded" "HTTP $SIG_HTTP after $SIG_UPLOAD_SECONDS s (curl exit $SIG_CURL_EXIT)" RECORDED
  record "sigterm.control.shell-form.exit" "recorded" "exit code $SIG_EXIT_CODE after $SIG_STOP_SECONDS s" RECORDED

  finish
}

# --- argument parsing -------------------------------------------------------------

while [ $# -gt 0 ]; do
  case "$1" in
    --out)
      require_value --out $#
      OUT_DIR="$2"
      shift 2
      ;;
    --with-login)
      WITH_LOGIN=1
      shift
      ;;
    --keep)
      KEEP=1
      shift
      ;;
    --sigterm)
      SIGTERM_ONLY=1
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      usage_error "unknown argument: $1"
      ;;
  esac
done

if [ -z "$OUT_DIR" ]; then
  usage_error "--out is required"
fi
case "$OUT_DIR" in
  /*) : ;;
  *) OUT_DIR="$REPO_ROOT/$OUT_DIR" ;;
esac

PORT="${PROXY_CHECK_PORT:-8181}"
if ! is_digits "$PORT"; then
  usage_error "PROXY_CHECK_PORT must be a number, got: $PORT"
fi
BASE_DEPTH="${PROXY_CHECK_XFF_DEPTH:-1}"
if ! is_digits "$BASE_DEPTH" || [ "$BASE_DEPTH" -lt 1 ]; then
  usage_error "PROXY_CHECK_XFF_DEPTH must be a number from 1, got: $BASE_DEPTH"
fi
CONTROL_DEPTH=$((BASE_DEPTH + 1))
PUBLIC_ORIGIN="http://$PUBLIC_HOST:$PORT"
OTHER_ORIGIN="http://$OTHER_HOST:$PORT"

if [ "$SIGTERM_ONLY" -eq 1 ] && [ "$WITH_LOGIN" -eq 1 ]; then
  usage_error "--sigterm runs only the stop-signal leg and cannot be combined with --with-login"
fi

if [ "$WITH_LOGIN" -eq 1 ]; then
  for required in PROXY_CHECK_SUPABASE_URL PROXY_CHECK_SUPABASE_ANON_KEY PROXY_CHECK_LOGIN_EMAIL PROXY_CHECK_LOGIN_PASSWORD; do
    if [ -z "${!required:-}" ]; then
      usage_error "--with-login needs $required in the environment"
    fi
  done
fi

# The build argument is held here and given to one build only, so the control build gets none.
SHA="${BUILD_SHA:-}"
unset BUILD_SHA

# --- pre-flight guards, before anything is built or started -------------------------

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
  echo "check-proxy-topology.sh: the proxy image is not present locally, and this script does not pull it." >&2
  echo "check-proxy-topology.sh: fetch it deliberately, then retry:  docker pull $PROXY_IMAGE" >&2
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

echo "check-proxy-topology.sh: public origin $PUBLIC_ORIGIN, proxy image $PROXY_IMAGE"
echo "check-proxy-topology.sh: output in $OUT_DIR"

if [ "$SIGTERM_ONLY" -eq 1 ]; then
  run_sigterm_leg
fi

# --- 1. build id ------------------------------------------------------------------

FILE="$OUT_DIR/01-build-id.txt"
{
  echo "BUILD_SHA given to the second build: $SHA"
  echo "tracked changes in the checkout at build time: $(git -C "$REPO_ROOT" status --porcelain --untracked-files=no 2> /dev/null | wc -l | tr -d ' ')"
} > "$FILE"

echo "check-proxy-topology.sh: building the control image, with no build argument (the long part)"
build_frontend "$OUT_DIR/build-control.log"
start_variant control-no-build-arg

CODE="$(request "$PRIVATE_DIR/health.json" "$PRIVATE_DIR/discard.headers" "$PUBLIC_ORIGIN/api/health")"
CONTROL_BUILD="$(json_string "$PRIVATE_DIR/health.json" build)"
CODE_VERSION="$(request "$PRIVATE_DIR/version.json" "$PRIVATE_DIR/discard.headers" "$PUBLIC_ORIGIN/_app/version.json")"
CONTROL_VERSION="$(json_string "$PRIVATE_DIR/version.json" version)"
{
  echo "control, image built with no build argument:"
  echo "  GET /api/health -> $CODE $(cat "$PRIVATE_DIR/health.json")"
  echo "  GET /_app/version.json -> $CODE_VERSION $(cat "$PRIVATE_DIR/version.json")"
} >> "$FILE"
expect_digits "build-id.control.no-build-arg.health" "$CONTROL_BUILD"
expect_digits "build-id.control.no-build-arg.version-json" "$CONTROL_VERSION"
save_frontend_log control-no-build-arg

docker tag "$FRONTEND_IMAGE" "$CONTROL_IMAGE" || could_not_run "the control image could not be tagged"
CONTROL_TAGGED=1

echo "check-proxy-topology.sh: building the image with BUILD_SHA=$SHA"
BUILD_SHA="$SHA" build_frontend "$OUT_DIR/build.log"
docker image inspect --format '{{.Id}} {{.Size}}' "$FRONTEND_IMAGE" "$CONTROL_IMAGE" "$PROXY_IMAGE" > "$OUT_DIR/images.txt" 2>&1 || true

# --- 2. origin, 5. spoof and 6. the diagnostics switch: the controls first ----------

start_variant other-origin "PROXY_CHECK_DIAGNOSTICS=true" "PROXY_CHECK_ORIGIN=$OTHER_ORIGIN"
FILE="$OUT_DIR/02-origin.txt"
CODE="$(request "$PRIVATE_DIR/diagnostics.json" "$PRIVATE_DIR/discard.headers" "$PUBLIC_ORIGIN/api/diagnostics")"
{
  echo "control, ORIGIN=$OTHER_ORIGIN, requested as $PUBLIC_ORIGIN:"
  echo "  GET /api/diagnostics -> $CODE $(cat "$PRIVATE_DIR/diagnostics.json")"
} > "$FILE"
expect_equal "origin.control.other-origin-configured" "$OTHER_ORIGIN" "$(json_string "$PRIVATE_DIR/diagnostics.json" origin)"
save_frontend_log other-origin

start_variant depth-control "PROXY_CHECK_DIAGNOSTICS=true" "PROXY_CHECK_XFF_DEPTH=$CONTROL_DEPTH"
FILE="$OUT_DIR/05-spoof.txt"
CODE="$(request "$PRIVATE_DIR/diagnostics.json" "$PRIVATE_DIR/discard.headers" -H "X-Forwarded-For: $SPOOFED_ADDRESS" "$PUBLIC_ORIGIN/api/diagnostics")"
{
  echo "control, XFF_DEPTH=$CONTROL_DEPTH, request sent with X-Forwarded-For: $SPOOFED_ADDRESS:"
  echo "  GET /api/diagnostics -> $CODE $(cat "$PRIVATE_DIR/diagnostics.json")"
} > "$FILE"
expect_equal "spoof.control.depth-$CONTROL_DEPTH.client-address" "$SPOOFED_ADDRESS" "$(json_string "$PRIVATE_DIR/diagnostics.json" clientAddress)"
save_frontend_log depth-control

start_variant diagnostics-on "PROXY_CHECK_DIAGNOSTICS=true"
CODE="$(request "$PRIVATE_DIR/diagnostics.json" "$PRIVATE_DIR/discard.headers" "$PUBLIC_ORIGIN/api/diagnostics")"
{
  echo "control, DEPLOYMENT_DIAGNOSTICS=true:"
  echo "  GET /api/diagnostics -> $CODE"
} > "$OUT_DIR/06-diagnostics-switch.txt"
expect_equal "diagnostics.control.enabled.status" "200" "$CODE"

{
  echo "observation, ORIGIN=$PUBLIC_ORIGIN, requested as $PUBLIC_ORIGIN:"
  echo "  GET /api/diagnostics -> $CODE $(cat "$PRIVATE_DIR/diagnostics.json")"
} >> "$OUT_DIR/02-origin.txt"
expect_equal "origin.reported" "$PUBLIC_ORIGIN" "$(json_string "$PRIVATE_DIR/diagnostics.json" origin)"

CODE="$(request "$PRIVATE_DIR/diagnostics.json" "$PRIVATE_DIR/discard.headers" -H "X-Forwarded-For: $SPOOFED_ADDRESS" "$PUBLIC_ORIGIN/api/diagnostics")"
CLIENT="$(json_string "$PRIVATE_DIR/diagnostics.json" clientAddress)"
{
  echo "observation, XFF_DEPTH=$BASE_DEPTH, request sent with X-Forwarded-For: $SPOOFED_ADDRESS:"
  echo "  GET /api/diagnostics -> $CODE $(cat "$PRIVATE_DIR/diagnostics.json")"
} >> "$OUT_DIR/05-spoof.txt"
# An absent address must not pass as "another address".
if [ "$CODE" = "200" ] && [ -n "$CLIENT" ] && [ "$CLIENT" != "$SPOOFED_ADDRESS" ]; then
  record "spoof.depth-$BASE_DEPTH.client-address" "an address other than $SPOOFED_ADDRESS" "$CLIENT" PASS
else
  record "spoof.depth-$BASE_DEPTH.client-address" "an address other than $SPOOFED_ADDRESS" "${CLIENT:-<nothing>} (HTTP $CODE)" FAIL
fi
save_frontend_log diagnostics-on

# --- the default variant: 1. build id, 6. the switch, 3. the form post, 4. the login ---

start_variant default

FILE="$OUT_DIR/01-build-id.txt"
CODE="$(request "$PRIVATE_DIR/health.json" "$PRIVATE_DIR/discard.headers" "$PUBLIC_ORIGIN/api/health")"
CODE_VERSION="$(request "$PRIVATE_DIR/version.json" "$PRIVATE_DIR/discard.headers" "$PUBLIC_ORIGIN/_app/version.json")"
{
  echo "observation, image built with BUILD_SHA=$SHA:"
  echo "  GET /api/health -> $CODE $(cat "$PRIVATE_DIR/health.json")"
  echo "  GET /_app/version.json -> $CODE_VERSION $(cat "$PRIVATE_DIR/version.json")"
} >> "$FILE"
expect_equal "build-id.health.status" "200" "$CODE"
expect_equal "build-id.health.build" "$SHA" "$(json_string "$PRIVATE_DIR/health.json" build)"
expect_equal "build-id.version-json" "$SHA" "$(json_string "$PRIVATE_DIR/version.json" version)"

CODE="$(request /dev/null "$PRIVATE_DIR/discard.headers" "$PUBLIC_ORIGIN/api/diagnostics")"
{
  echo "observation, DEPLOYMENT_DIAGNOSTICS unset:"
  echo "  GET /api/diagnostics -> $CODE"
} >> "$OUT_DIR/06-diagnostics-switch.txt"
expect_equal "diagnostics.default.status" "404" "$CODE"

FILE="$OUT_DIR/03-form-post.txt"
CODE="$(request /dev/null "$PRIVATE_DIR/login-page.headers" "$PUBLIC_ORIGIN$LOGIN_ROUTE")"
FOLLOWED="$(curl -sS --max-time "$REQUEST_TIMEOUT" --resolve "$PUBLIC_HOST:$PORT:127.0.0.1" -L --max-redirs 5 \
  -o /dev/null -w '%{http_code} %{url_effective}' "$PUBLIC_ORIGIN$LOGIN_ROUTE" 2>> "$OUT_DIR/curl-errors.log")" || FOLLOWED="000 none"
LOGIN_URL="${FOLLOWED#* }"
{
  echo "the login page:"
  echo "  GET $LOGIN_ROUTE -> $CODE, Location: $(header_value "$PRIVATE_DIR/login-page.headers" location)"
  echo "  followed -> ${FOLLOWED%% *} at $LOGIN_URL"
} > "$FILE"
case "$LOGIN_URL" in
  "$PUBLIC_ORIGIN"/*)
    LOGIN_PATH="${LOGIN_URL#"$PUBLIC_ORIGIN"}"
    LOGIN_PATH="${LOGIN_PATH%%\?*}"
    record "form-post.login-page" "on the public origin" "$LOGIN_PATH (HTTP ${FOLLOWED%% *})" PASS
    ;;
  *)
    record "form-post.login-page" "on the public origin" "$LOGIN_URL (HTTP ${FOLLOWED%% *})" FAIL
    ;;
esac

FORM_BODY='email=nobody%40example.test&password=not-a-password'
CODE="$(request "$PRIVATE_DIR/forbidden.body" "$PRIVATE_DIR/discard.headers" -H "$FORM_ACCEPT" -H "Origin: $FOREIGN_ORIGIN" --data "$FORM_BODY" "$PUBLIC_ORIGIN$LOGIN_PATH")"
if grep -qF "$FORBIDDEN_TEXT" "$PRIVATE_DIR/forbidden.body" 2> /dev/null; then
  FORBIDDEN_SEEN="present"
else
  FORBIDDEN_SEEN="absent"
fi
{
  echo "control, POST $LOGIN_PATH with a form body and Origin: $FOREIGN_ORIGIN:"
  echo "  -> $CODE, body: $(head -c 300 "$PRIVATE_DIR/forbidden.body" 2> /dev/null | tr -d '\r\n')"
} >> "$FILE"
expect_equal "form-post.control.foreign-origin.status" "403" "$CODE"
expect_equal "form-post.control.foreign-origin.body \"$FORBIDDEN_TEXT\"" "present" "$FORBIDDEN_SEEN"

CODE="$(request /dev/null "$PRIVATE_DIR/discard.headers" -H "$FORM_ACCEPT" -H "Origin: $PUBLIC_ORIGIN" --data "$FORM_BODY" "$PUBLIC_ORIGIN$LOGIN_PATH")"
{
  echo "observation, the same POST with Origin: $PUBLIC_ORIGIN:"
  echo "  -> $CODE"
} >> "$FILE"
# No answer at all must not pass as "not 403".
if [ "$CODE" != "000" ] && [ "$CODE" != "403" ]; then
  record "form-post.public-origin.status" "an HTTP status other than 403" "$CODE" PASS
else
  record "form-post.public-origin.status" "an HTTP status other than 403" "$CODE" FAIL
fi

FILE="$OUT_DIR/04-login.txt"
if [ "$WITH_LOGIN" -eq 1 ]; then
  printf '%s' "$PROXY_CHECK_LOGIN_EMAIL" > "$PRIVATE_DIR/email"
  printf '%s' "$PROXY_CHECK_LOGIN_PASSWORD" > "$PRIVATE_DIR/password"
  # The body is discarded and the headers stay in the private directory: the answer sets the session's cookies.
  CODE="$(request /dev/null "$PRIVATE_DIR/login.headers" -H "$FORM_ACCEPT" -H "Origin: $PUBLIC_ORIGIN" \
    --data-urlencode "email@$PRIVATE_DIR/email" --data-urlencode "password@$PRIVATE_DIR/password" "$PUBLIC_ORIGIN$LOGIN_PATH")"
  LOCATION="$(header_value "$PRIVATE_DIR/login.headers" location)"
  expect_equal "login.post.status" "303" "$CODE"

  LOCATION_VERDICT=PASS
  case "$LOCATION" in
    //*) LOCATION_VERDICT=FAIL ;;
    /*) TARGET="$PUBLIC_ORIGIN$LOCATION" ;;
    "$PUBLIC_ORIGIN" | "$PUBLIC_ORIGIN"/*) TARGET="$LOCATION" ;;
    *) LOCATION_VERDICT=FAIL ;;
  esac
  case "$LOCATION" in
    *frontend:3000* | *127.0.0.1* | *localhost*) LOCATION_VERDICT=FAIL ;;
  esac
  record "login.post.location" "a path or the public origin, naming neither the container nor a loopback host" "${LOCATION:-<nothing>}" "$LOCATION_VERDICT"

  if [ "$LOCATION_VERDICT" = "PASS" ]; then
    # The cookies are passed back as one header, from a file: a cookie the server marked Secure would not be sent over plain HTTP from a cookie jar, and the values must stay off the command line.
    COOKIES="$(sed -n 's/^[Ss]et-[Cc]ookie:[[:space:]]*\([^;]*\).*/\1/p' "$PRIVATE_DIR/login.headers" | tr -d '\r' | sed '/=$/d' | paste -sd ';' - | sed 's/;/; /g')"
    printf 'header = "Cookie: %s"\n' "$COOKIES" > "$PRIVATE_DIR/cookies.curlrc"
    FOLLOWED="$(curl -sS --max-time "$REQUEST_TIMEOUT" --resolve "$PUBLIC_HOST:$PORT:127.0.0.1" -K "$PRIVATE_DIR/cookies.curlrc" \
      -L --max-redirs 10 -o /dev/null -w '%{http_code} %{url_effective}' "$TARGET" 2>> "$OUT_DIR/curl-errors.log")" || FOLLOWED="000 none"
    FINAL_URL="${FOLLOWED#* }"
    case "$FINAL_URL" in
      "$PUBLIC_ORIGIN" | "$PUBLIC_ORIGIN"/*) record "login.followed.final-url" "begins with $PUBLIC_ORIGIN" "$FINAL_URL (HTTP ${FOLLOWED%% *})" PASS ;;
      *) record "login.followed.final-url" "begins with $PUBLIC_ORIGIN" "$FINAL_URL (HTTP ${FOLLOWED%% *})" FAIL ;;
    esac
  else
    FOLLOWED="not followed"
    record "login.followed.final-url" "begins with $PUBLIC_ORIGIN" "not followed" FAIL
  fi
  {
    echo "POST $LOGIN_PATH with the account's address and password and Origin: $PUBLIC_ORIGIN:"
    echo "  -> $CODE, Location: $LOCATION"
    echo "  cookies set by the answer: $(grep -ci '^set-cookie:' "$PRIVATE_DIR/login.headers" || true)"
    echo "  followed with those cookies -> $FOLLOWED"
  } > "$FILE"
else
  echo "the login leg was not requested (--with-login)" > "$FILE"
  record "login" "run under --with-login" "not requested" NOT-RUN
fi
save_frontend_log default

# --- verdict ----------------------------------------------------------------------

finish
