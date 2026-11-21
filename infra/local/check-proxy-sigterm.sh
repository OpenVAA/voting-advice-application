#!/usr/bin/env bash
#
# check-proxy-sigterm.sh -- Run the frontend production image behind the reverse proxy of
#                           docker-compose.proxy.yml, stop its container during a request in flight,
#                           and check, with a negative control, that the server drains that request
#                           and exits by itself.
#
# A deployment stops the container with SIGTERM, which reaches the server only when node is process 1, and adapter-node then finishes the requests in flight before it exits. This script reaches the server as the public origin only, as check-proxy-topology.sh does: every request names http://vaa.example.test:<port> and is sent to 127.0.0.1 with curl --resolve.
#
# Usage:
#   ```sh
#   infra/local/check-proxy-sigterm.sh --out /tmp/proxy-sigterm
#   ```
#
#   --out <dir>     REQUIRED. Receives summary.txt, sigterm.txt and the logs of each run. A relative path is resolved against the REPO ROOT, never against $PWD.
#   --keep          OPTIONAL. Leave the stack of the control running.
#   -h, --help      Print this header and exit 0.
#
# The observation. It writes lines to summary.txt of the form `label | expected: ... | observed: ... | PASS` (or FAIL). The frontend image already present is used; it is built, with BUILD_SHA, only when none is.
#   1. Process 1 of the frontend container is node.
#   2. A slow form upload to the login action, rate-limited with curl --limit-rate and passed on by the proxy as it arrives, is first timed with no signal: it must stay open at least 8 s and at most 20 s, or the check cannot show anything and exits 3.
#   3. The same upload is then started, and 2 s later the container is stopped with a timeout of 40 s, above the adapter's own 30 s. The upload must end with the status it had with no signal, and the container must exit by itself, with an exit code other than 137, in under 35 s.
#   Control: the same stop with the entry point forced to /bin/sh -c "node ./apps/frontend/build/index.js; exit" by an override file written to --out. The command after node keeps the shell from replacing itself with node, so the shell stays process 1 and does not pass the signal on. Process 1 must begin with /bin/sh, and the container must either exit 137 or take at least 35 s to stop, which shows the check can see a process 1 that drops the signal. The control exits 3 when it could not be run.
#   The upload asks for JSON, so the action's answer is not followed by a page render.
#
# Environment:
#   BUILD_SHA                      The id given to the image build, when one is needed. Default: the commit the checkout is on.
#   PROXY_CHECK_PORT               The host port of the proxy, on 127.0.0.1. Default 8181. The public origin is http://vaa.example.test:<this port>.
#   PROXY_CHECK_ADDRESS_HEADER     Passed to the container as ADDRESS_HEADER. Default x-forwarded-for.
#   PROXY_CHECK_XFF_DEPTH          Passed as XFF_DEPTH: the number of proxies in front of the server. Default 1.
#   PROXY_CHECK_SUPABASE_URL, PROXY_CHECK_SUPABASE_ANON_KEY, PROXY_CHECK_PROJECT_ID
#                                  Passed as the three PUBLIC_ variables. Unset, the URL names a closed port and every read of the backend fails, which this check does not need; an unset project id defaults to the seed project 00000000-0000-0000-0000-000000000001.
#   PROXY_CHECK_ORIGIN and PROXY_CHECK_DIAGNOSTICS are set by this script; a value in the caller's environment is not used.
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
#   3:  the check could not run: Docker is unavailable, the proxy image is not present, a build failed or outlasted its bound, the port is in use, the server did not come up, the login page did not resolve on the public origin, no rate kept the upload open for 8 to 20 s, or the control could not be run
#   130:  interrupted (SIGINT/SIGTERM). Never 0.

set -euo pipefail

# Auto-detect paths from the script's location, so the script behaves identically from any working directory.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_NAME="check-proxy-sigterm.sh"
# shellcheck source=proxy-check-lib.sh
. "$SCRIPT_DIR/proxy-check-lib.sh"

# Seconds. The signal timeout is above adapter-node's SHUTDOWN_TIMEOUT of 30 s, so the adapter's own drain runs to its end before the runtime kills the process; a stop that lasts until the drain bound is a process that did not exit by itself.
SIGNAL_STOP_TIMEOUT=40
DRAIN_BOUND=35
SLOW_MIN_SECONDS=8
SLOW_MAX_SECONDS=20
SIGNAL_DELAY=2
# Pairs of body size in bytes and upload rate in bytes per second, tried in order until one keeps the upload open for SLOW_MIN_SECONDS to SLOW_MAX_SECONDS. Every body is far below the adapter's BODY_SIZE_LIMIT of 512K.
SLOW_CANDIDATES="36000:3000 60000:4000 60000:3000 100000:6000"
# A shell given one simple command may exec it in its own place; the command after node keeps it from doing so. A bare exit returns node's status and needs no `$`, which the compose file would interpolate.
SHELL_FORM_COMMAND='node ./apps/frontend/build/index.js; exit'

# --- the observation ----------------------------------------------------------------

# Runs the observation and its control, then ends the script with the verdict.
run_sigterm_leg() {
  local candidate result code seconds chosen=0 image_sha

  if docker image inspect "$FRONTEND_IMAGE" > /dev/null 2>&1; then
    echo "$SCRIPT_NAME: using the frontend image already present"
  else
    echo "$SCRIPT_NAME: no frontend image is present; building it with BUILD_SHA=$SHA"
    BUILD_SHA="$SHA" build_frontend "$OUT_DIR/build.log"
  fi
  image_sha="$(docker image inspect --format '{{range .Config.Env}}{{println .}}{{end}}' "$FRONTEND_IMAGE" 2> /dev/null | sed -n 's/^BUILD_SHA=//p')"

  FILE="$OUT_DIR/sigterm.txt"
  {
    echo "image: $(docker image inspect --format '{{.Id}}' "$FRONTEND_IMAGE" 2> /dev/null), BUILD_SHA ${image_sha:-<empty>}"
    echo "Dockerfile CMD of the production stage: $(grep '^CMD' "$REPO_ROOT/apps/frontend/Dockerfile" | sed -n '$p')"
  } > "$FILE"

  start_variant sigterm
  resolve_login_path || could_not_run "the login page did not resolve on the public origin: $LOGIN_FOLLOWED"
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

  # 4. Control: the shell-form entry point, which must show a process 1 that drops the signal.
  OVERRIDE_FILE="$OUT_DIR/shell-form.override.yml"
  {
    echo "# Written by $SCRIPT_NAME: the frontend started through a shell that stays process 1."
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
  case "$SIG_PID1" in
    /bin/sh | /bin/sh\ *) record "sigterm.control.shell-form.pid1" "begins with /bin/sh" "$SIG_PID1" PASS ;;
    *) record "sigterm.control.shell-form.pid1" "begins with /bin/sh" "$SIG_PID1" FAIL ;;
  esac
  if [ "$SIG_EXIT_CODE" = "137" ] || ! below "$SIG_STOP_SECONDS" "$DRAIN_BOUND"; then
    record "sigterm.control.shell-form.exit" "exit code 137, or at least $DRAIN_BOUND s to stop" "exit code $SIG_EXIT_CODE after $SIG_STOP_SECONDS s" PASS
  else
    record "sigterm.control.shell-form.exit" "exit code 137, or at least $DRAIN_BOUND s to stop" "exit code $SIG_EXIT_CODE after $SIG_STOP_SECONDS s" FAIL
  fi

  finish
}

# Prints the command line of process 1 of the running frontend container, its arguments separated by spaces, or nothing when it cannot be read.
pid1_command() {
  { compose exec -T frontend cat /proc/1/cmdline 2> /dev/null || true; } | tr '\0' ' ' | sed 's/ *$//'
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

# --- argument parsing -------------------------------------------------------------

while [ $# -gt 0 ]; do
  case "$1" in
    --out)
      require_value --out $#
      OUT_DIR="$2"
      shift 2
      ;;
    --keep)
      KEEP=1
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

read_settings
preflight
run_sigterm_leg
