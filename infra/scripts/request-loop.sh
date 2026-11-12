#!/usr/bin/env bash
#
# request-loop.sh -- Request one URL repeatedly and count the answers that were not 2xx.
#
# Run it beside a rollout to see the rollout from a viewer's side: the result is a count of failed requests, not an
# impression.
#
# What it does. It requests the URL once, then once every interval, until the stop file appears, the duration ends or it
# is sent SIGTERM, SIGINT or SIGHUP. Each request is one `curl` with a 10-second limit. For each request it appends one
# line `<utc>,<status>` to the output file, the status being the three-digit HTTP status, or 000 when no answer came.
# At the end it prints one line:
#   requests=<n> non_2xx=<m> first_utc=<utc> last_utc=<utc>
# with the times of the first and the last request, or `none` for both when no request was made.
#
# What it does not record: no response body and no header is written anywhere. A redirect is not followed, so a 3xx
# counts as not 2xx. The requests are sequential: a request that takes longer than the interval delays the next one.
#
# Usage:
#   infra/scripts/request-loop.sh --url https://staging.example.org/api/health --out tmp/rollout.csv --until tmp/stop
#   infra/scripts/request-loop.sh --url https://staging.example.org/ --out tmp/rollout.csv --duration 600 --interval 2
#   infra/scripts/request-loop.sh --self-test
#
#   --url <url>             REQUIRED. The URL to request, http:// or https://.
#   --out <file>            REQUIRED. The file the `<utc>,<status>` lines are written to. It is emptied first; its
#                           directory must exist.
#   --until <stop file>     REQUIRED unless --duration is given. The run ends at the first check after this file
#                           appears. A stop file that already exists is a usage error, so a stale one cannot end a run.
#   --duration <seconds>    REQUIRED unless --until is given. The run ends at the first check after this many seconds.
#                           Both may be given; the first that ends the run wins.
#   --interval <seconds>    OPTIONAL. The pause between requests, a positive number. Default: 1.
#   --self-test             Run the loop against loopback servers started with node. Needs no credential and no
#                           network beyond 127.0.0.1. Each case prints `self_test <name> PASS|FAIL`.
#   -h, --help              Print this header and exit 0.
#
# Exit codes:
#   0:  at least one request was made and every answer was 2xx, or every self-test case passed
#   1:  an answer was not 2xx, no request was made, or a self-test case failed
#   2:  usage error

set -euo pipefail
set -f

export LC_ALL=C

SCRIPT_PATH="${BASH_SOURCE[0]}"

URL=""
OUT=""
UNTIL=""
DURATION=""
INTERVAL="1"
STOP_REQUESTED=0
SLEEP_PID=""

usage_line() {
  echo "usage: request-loop.sh --url <url> --out <file> (--until <stop file> | --duration <seconds>) [--interval <seconds>] | --self-test | -h | --help" >&2
}

print_header() {
  awk 'NR == 1 { next } /^#/ { sub(/^# ?/, ""); print; next } { exit }' "$SCRIPT_PATH"
}

usage_error() {
  echo "request-loop.sh: $1" >&2
  usage_line
  exit 2
}

utc_now() {
  date -u +%Y-%m-%dT%H:%M:%SZ
}

on_stop_signal() {
  STOP_REQUESTED=1
  if [ -n "$SLEEP_PID" ]; then kill "$SLEEP_PID" 2> /dev/null || true; fi
}

# Sets STOP_REQUESTED when the stop file exists or the duration has passed.
check_stop() {
  if [ -n "$UNTIL" ] && [ -e "$UNTIL" ]; then STOP_REQUESTED=1; fi
  if [ -n "$DURATION" ] && [ "$SECONDS" -ge "$DURATION" ]; then STOP_REQUESTED=1; fi
}

run_loop() {
  local requests=0 non_2xx=0 first_utc="none" last_utc="none" now code status_re='^[0-9]{3}$'

  : > "$OUT"
  trap on_stop_signal TERM INT HUP
  SECONDS=0
  while [ "$STOP_REQUESTED" -eq 0 ]; do
    now="$(utc_now)"
    code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 10 "$URL" 2> /dev/null)" || true
    [[ "$code" =~ $status_re ]] || code="000"
    printf '%s,%s\n' "$now" "$code" >> "$OUT"
    requests=$((requests + 1))
    case "$code" in
      2??) ;;
      *) non_2xx=$((non_2xx + 1)) ;;
    esac
    [ "$first_utc" != "none" ] || first_utc="$now"
    last_utc="$now"

    check_stop
    [ "$STOP_REQUESTED" -eq 0 ] || break
    # Slept in the background and waited for, so that a signal ends the pause at once.
    sleep "$INTERVAL" &
    SLEEP_PID=$!
    wait "$SLEEP_PID" 2> /dev/null || true
    SLEEP_PID=""
    check_stop
  done

  echo "requests=$requests non_2xx=$non_2xx first_utc=$first_utc last_utc=$last_utc"
  [ "$requests" -gt 0 ] || return 1
  [ "$non_2xx" -eq 0 ] || return 1
  return 0
}

# ---------------------------------------------------------------------------------------------------
# Self-test. Loopback servers only.
# ---------------------------------------------------------------------------------------------------

ST_CASES=0
ST_FAILED=0
ST=""
ST_SERVER_PIDS=""
ST_PORT=""

# A server on a free loopback port. Mode ok answers 200 to every request; mode every-third answers 503 to every third.
ST_SERVER_JS='
const http = require("node:http");
const fs = require("node:fs");
const [mode, portFile] = process.argv.slice(1);
let count = 0;
const server = http.createServer((request, response) => {
  count += 1;
  const status = mode === "every-third" && count % 3 === 0 ? 503 : 200;
  response.writeHead(status, { "content-type": "text/plain" });
  response.end("body-that-must-not-be-recorded\n");
});
server.listen(0, "127.0.0.1", () => fs.writeFileSync(portFile, String(server.address().port)));
'

st_result() {
  ST_CASES=$((ST_CASES + 1))
  if [ "$2" = "pass" ]; then
    echo "self_test $1 PASS"
  else
    echo "self_test $1 FAIL"
    ST_FAILED=$((ST_FAILED + 1))
  fi
}

st_expect() {
  local name="$1"
  shift
  if "$@"; then st_result "$name" pass; else st_result "$name" fail; fi
}

has() { case "$1" in *"$2"*) return 0 ;; *) return 1 ;; esac; }
lacks() { case "$1" in *"$2"*) return 1 ;; *) return 0 ;; esac; }
equals() { [ "$1" = "$2" ]; }
greater() { [ "$1" -gt "$2" ]; }

# The m of a summary line's non_2xx=<m>, or -1 when the line holds none.
st_non_2xx() {
  local value
  value="$(printf '%s\n' "$1" | sed -n 's/.*non_2xx=\([0-9][0-9]*\) .*/\1/p')"
  printf '%s' "${value:--1}"
}

st_requests() {
  local value
  value="$(printf '%s\n' "$1" | sed -n 's/^requests=\([0-9][0-9]*\) .*/\1/p')"
  printf '%s' "${value:--1}"
}

# Every line of the file is <utc>,<three digits>.
st_lines_well_formed() {
  [ -s "$1" ] && ! grep -qvE '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z,[0-9]{3}$' "$1"
}

# Starts a server of the given mode and sets ST_PORT.
st_start_server() {
  local port_file="$ST/port.$1" waited=0
  node -e "$ST_SERVER_JS" "$1" "$port_file" &
  ST_SERVER_PIDS="$ST_SERVER_PIDS $!"
  while [ ! -s "$port_file" ] && [ "$waited" -lt 50 ]; do
    sleep 0.1
    waited=$((waited + 1))
  done
  ST_PORT="$(cat "$port_file" 2> /dev/null || true)"
  [ -n "$ST_PORT" ]
}

st_cleanup() {
  local pid
  for pid in $ST_SERVER_PIDS; do kill "$pid" 2> /dev/null || true; done
  [ -z "$ST" ] || rm -rf "$ST"
}

self_test() {
  local out status started elapsed stopper pid ok_port

  ST="$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-request-loop-test.XXXXXX")"
  trap st_cleanup EXIT

  if ! command -v node > /dev/null 2>&1; then
    st_result "node-on-path" fail
    echo "self_test summary cases=$ST_CASES failed=$ST_FAILED"
    return 1
  fi

  st_expect "server-ok-starts" st_start_server ok
  ok_port="$ST_PORT"
  status=0
  out="$(bash "$SCRIPT_PATH" --url "http://127.0.0.1:$ok_port/" --out "$ST/ok.csv" --duration 3 --interval 0.25)" || status=$?
  st_expect "all-2xx-exits-0" equals "$status" "0"
  st_expect "all-2xx-counts-no-failure" equals "$(st_non_2xx "$out")" "0"
  st_expect "all-2xx-counts-requests" greater "$(st_requests "$out")" "3"
  st_expect "all-2xx-writes-one-line-per-request" equals "$(wc -l < "$ST/ok.csv" | tr -d ' ')" "$(st_requests "$out")"
  st_expect "all-2xx-lines-are-utc-and-status" st_lines_well_formed "$ST/ok.csv"
  st_expect "all-2xx-records-no-body" lacks "$(cat "$ST/ok.csv")$out" "body-that-must-not-be-recorded"
  st_expect "all-2xx-prints-times" has "$out" " first_utc=20"

  st_expect "server-every-third-starts" st_start_server every-third
  status=0
  out="$(bash "$SCRIPT_PATH" --url "http://127.0.0.1:$ST_PORT/" --out "$ST/third.csv" --duration 3 --interval 0.25)" || status=$?
  st_expect "every-third-503-exits-1" equals "$status" "1"
  st_expect "every-third-503-counts-failures" greater "$(st_non_2xx "$out")" "0"
  st_expect "every-third-503-records-503" has "$(cat "$ST/third.csv")" ",503"

  status=0
  started="$SECONDS"
  (sleep 2 && : > "$ST/stop") &
  stopper=$!
  out="$(bash "$SCRIPT_PATH" --url "http://127.0.0.1:$ok_port/" --out "$ST/until.csv" --until "$ST/stop" --interval 0.25)" || status=$?
  elapsed=$((SECONDS - started))
  wait "$stopper" 2> /dev/null || true
  st_expect "stop-file-ends-the-run" equals "$status" "0"
  st_expect "stop-file-ends-the-run-promptly" [ "$elapsed" -le 6 ]
  st_expect "stop-file-run-made-requests" greater "$(st_requests "$out")" "0"

  status=0
  bash "$SCRIPT_PATH" --url "http://127.0.0.1:$ok_port/" --out "$ST/stale.csv" --until "$ST/stop" > /dev/null 2>&1 || status=$?
  st_expect "stale-stop-file-is-a-usage-error" equals "$status" "2"

  status=0
  bash "$SCRIPT_PATH" --url "http://127.0.0.1:$ok_port/" --out "$ST/term.csv" --duration 60 --interval 0.25 > "$ST/term.out" 2>&1 &
  pid=$!
  sleep 1
  kill -TERM "$pid" 2> /dev/null || true
  wait "$pid" || status=$?
  st_expect "sigterm-ends-the-run" equals "$status" "0"
  st_expect "sigterm-prints-the-summary" has "$(cat "$ST/term.out")" "non_2xx=0 "

  # A port nothing listens on: the listener of the ok server is closed by killing it.
  for pid in $ST_SERVER_PIDS; do kill "$pid" 2> /dev/null || true; wait "$pid" 2> /dev/null || true; done
  ST_SERVER_PIDS=""
  status=0
  out="$(bash "$SCRIPT_PATH" --url "http://127.0.0.1:$ok_port/" --out "$ST/down.csv" --duration 1 --interval 0.25)" || status=$?
  st_expect "no-answer-exits-1" equals "$status" "1"
  st_expect "no-answer-records-000" has "$(cat "$ST/down.csv")" ",000"

  status=0
  bash "$SCRIPT_PATH" --url "http://127.0.0.1:$ok_port/" --out "$ST/usage.csv" > /dev/null 2>&1 || status=$?
  st_expect "no-end-condition-is-a-usage-error" equals "$status" "2"

  echo "self_test summary cases=$ST_CASES failed=$ST_FAILED"
  [ "$ST_FAILED" -eq 0 ]
}

# ---------------------------------------------------------------------------------------------------

main() {
  local seconds_re='^[1-9][0-9]*$' interval_re='^([0-9]+(\.[0-9]+)?)$' url_re='^https?://[^[:space:]]+$'

  case "${1:-}" in
    --self-test)
      [ "$#" -eq 1 ] || { usage_line; exit 2; }
      self_test || exit 1
      exit 0
      ;;
    -h | --help)
      print_header
      exit 0
      ;;
  esac

  while [ "$#" -gt 0 ]; do
    case "$1" in
      --url | --out | --until | --duration | --interval)
        [ "$#" -ge 2 ] || usage_error "$1 requires a value"
        case "$1" in
          --url) URL="$2" ;;
          --out) OUT="$2" ;;
          --until) UNTIL="$2" ;;
          --duration) DURATION="$2" ;;
          --interval) INTERVAL="$2" ;;
        esac
        shift 2
        ;;
      *)
        usage_error "unknown argument: $1"
        ;;
    esac
  done

  [ -n "$URL" ] || usage_error "--url is required"
  [[ "$URL" =~ $url_re ]] || usage_error "--url must begin with http:// or https://"
  [ -n "$OUT" ] || usage_error "--out is required"
  [ -d "$(dirname "$OUT")" ] || usage_error "the directory of --out does not exist"
  [ -n "$UNTIL" ] || [ -n "$DURATION" ] || usage_error "one of --until or --duration is required"
  if [ -n "$UNTIL" ] && [ -e "$UNTIL" ]; then usage_error "the stop file already exists; remove it first"; fi
  if [ -n "$DURATION" ] && ! [[ "$DURATION" =~ $seconds_re ]]; then
    usage_error "--duration must be a positive whole number of seconds"
  fi
  [[ "$INTERVAL" =~ $interval_re ]] || usage_error "--interval must be a positive number of seconds"
  case "$INTERVAL" in
    *[1-9]*) ;;
    *) usage_error "--interval must be a positive number of seconds" ;;
  esac
  command -v curl > /dev/null 2>&1 || usage_error "curl is not on the PATH"

  run_loop || exit 1
  exit 0
}

main "$@"
