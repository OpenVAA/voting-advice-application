#!/usr/bin/env bash
#
# relay-refusals.sh -- Send the relay's refusal cases to one deployment and name the status each one got.
#
# The relay at `/api/usage` refuses a request that is not same-origin, one whose body is over 32768 bytes and one whose
# envelope carries a key it does not admit, and it drops, silently and with 204, an event that carries an attribute it
# does not admit. This script sends one request per case and compares the status with the one expected. The refusals
# can be seen only while a provider is active: with provider `none` the relay answers 204 before it reads anything.
#
# What it does. Nine POSTs to `<base>/api/usage`, one `curl` each with a 10-second limit, all with
# `Content-Type: application/json` and, except in the two origin cases, `Sec-Fetch-Site: same-origin`. Every body is a
# valid batch envelope (route `/(voters)`, locale `en`) holding one `answer` event whose question id is the probe id
# with a one-letter suffix naming the case, unless the case is about the body itself:
#   cross_site            Sec-Fetch-Site: cross-site                                       expected 403
#   foreign_origin        no Sec-Fetch-Site, Origin: https://evil.example                   expected 403
#   declared_33k          a 33792-byte body with its Content-Length                         expected 413
#   chunked_33k           the same body, Transfer-Encoding: chunked, over HTTP/1.1          expected 413
#   envelope_destination  a valid envelope plus the key `destination`                       expected 400
#   envelope_host         a valid envelope plus the key `host`                              expected 400
#   event_url             a valid envelope whose event carries `url`, question id <probe>u  expected 204
#   event_host            a valid envelope whose event carries `host`, question id <probe>h expected 204
#   control               one valid event, question id <probe>, `ago` 0 so its time is now  expected 204
# Each case prints one line
#   c01_<case> status=<n> expected=<n> result=PASS|FAIL
# with the three-digit status, or 000 when no answer came, and the last line is
#   c01_summary cases=9 failed=<m>
# The two `event_` cases answer 204 whether or not the event was kept; that the provider received the control event
# and neither of them is read from the provider's side, by the question ids.
#
# What it does not record: no response body and no response header is printed or written. A redirect is not followed.
# The request bodies are written to a private temporary directory and removed on exit.
#
# The base URL is limited to https://staging.openvaa.org and a loopback origin, so the requests cannot be aimed at
# anything else. A CDN in front of the relay may buffer a chunked body and forward it with a Content-Length; the
# chunked case's 413 then comes from the declared-length check, and the line cannot tell the two apart.
#
# Usage:
#   infra/scripts/relay-refusals.sh --base-url https://staging.openvaa.org --probe refusals-s-20261118T120000Z
#   infra/scripts/relay-refusals.sh --base-url http://localhost:5274 --probe refusals-l-20261118T120000Z
#   infra/scripts/relay-refusals.sh --self-test
#
#   --base-url <origin>     REQUIRED. https://staging.openvaa.org, or http://localhost:<port> or
#                           http://127.0.0.1:<port>. No path and no trailing slash.
#   --probe <id>            REQUIRED. 1 to 40 letters, digits, `_` or `-`. The question id of the control event and the
#                           stem of the others' ids, so the run's events can be found at the provider.
#   --self-test             Run the cases against loopback servers started with node. Needs no credential and no
#                           network beyond 127.0.0.1. Each case prints `self_test <name> PASS|FAIL`.
#   -h, --help              Print this header and exit 0.
#
# Exit codes:
#   0:  every case got the status expected, or every self-test case passed
#   1:  a case got another status or no answer, or a self-test case failed
#   2:  usage error

set -euo pipefail
set -f

export LC_ALL=C

SCRIPT_PATH="${BASH_SOURCE[0]}"

BASE_URL=""
PROBE=""
L=""

# The relay's cap is 32768 bytes; 33 KiB is over it by a margin no rounding can absorb.
BIG_BODY_BYTES=33792

usage_line() {
  echo "usage: relay-refusals.sh --base-url <origin> --probe <id> | --self-test | -h | --help" >&2
}

print_header() {
  awk 'NR == 1 { next } /^#/ { sub(/^# ?/, ""); print; next } { exit }' "$SCRIPT_PATH"
}

usage_error() {
  echo "relay-refusals.sh: $1" >&2
  usage_line
  exit 2
}

cleanup() {
  [ -z "$L" ] || rm -rf "$L"
}

# One answer event, with the question id given and an optional extra attribute member such as `,"url":"..."`.
answer_event() {
  printf '{"name":"answer","ago":0,"attributes":{"questionId":"%s","value":1%s}}' "$1" "${2:-}"
}

# A batch envelope holding the given event, with an optional extra envelope member.
envelope() {
  printf '{"routeId":"/(voters)","locale":"en","events":[%s]%s}' "$1" "${2:-}"
}

# Writes the body files of every case into $L.
write_bodies() {
  envelope "$(answer_event "${PROBE}c")" > "$L/cross_site.json"
  envelope "$(answer_event "${PROBE}o")" > "$L/foreign_origin.json"
  head -c "$BIG_BODY_BYTES" /dev/zero | tr '\0' 'a' > "$L/big.txt"
  envelope "$(answer_event "${PROBE}d")" ',"destination":"https://evil.example/"' > "$L/envelope_destination.json"
  envelope "$(answer_event "${PROBE}e")" ',"host":"evil.example"' > "$L/envelope_host.json"
  envelope "$(answer_event "${PROBE}u" ',"url":"https://evil.example/"')" > "$L/event_url.json"
  envelope "$(answer_event "${PROBE}h" ',"host":"evil.example"')" > "$L/event_host.json"
  envelope "$(answer_event "$PROBE")" > "$L/control.json"
}

FAILED=0
CASES=0

# Sends one case and prints its line. Arguments: case name, expected status, body file, then extra curl arguments.
send_case() {
  local name="$1" expected="$2" body="$3" code result status_re='^[0-9]{3}$'
  shift 3
  code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 10 --proto '=http,https' -X POST \
    -H 'Content-Type: application/json' -H 'Expect:' "$@" --data-binary @"$body" "$BASE_URL/api/usage" 2> /dev/null)" || true
  [[ "$code" =~ $status_re ]] || code="000"
  CASES=$((CASES + 1))
  if [ "$code" = "$expected" ]; then
    result="PASS"
  else
    result="FAIL"
    FAILED=$((FAILED + 1))
  fi
  echo "c01_${name} status=${code} expected=${expected} result=${result}"
}

run_cases() {
  local same='Sec-Fetch-Site: same-origin'

  L="$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-relay-refusals.XXXXXX")"
  trap cleanup EXIT
  (umask 077; write_bodies)

  send_case cross_site 403 "$L/cross_site.json" -H 'Sec-Fetch-Site: cross-site'
  send_case foreign_origin 403 "$L/foreign_origin.json" -H 'Origin: https://evil.example'
  send_case declared_33k 413 "$L/big.txt" -H "$same"
  # HTTP/2 has no chunked transfer encoding, so the request is held to HTTP/1.1.
  send_case chunked_33k 413 "$L/big.txt" -H "$same" -H 'Transfer-Encoding: chunked' --http1.1
  send_case envelope_destination 400 "$L/envelope_destination.json" -H "$same"
  send_case envelope_host 400 "$L/envelope_host.json" -H "$same"
  send_case event_url 204 "$L/event_url.json" -H "$same"
  send_case event_host 204 "$L/event_host.json" -H "$same"
  send_case control 204 "$L/control.json" -H "$same"

  echo "c01_summary cases=${CASES} failed=${FAILED}"
  [ "$FAILED" -eq 0 ]
}

# ---------------------------------------------------------------------------------------------------
# Self-test. Loopback servers only.
# ---------------------------------------------------------------------------------------------------

ST_CASES=0
ST_FAILED=0
ST=""
ST_SERVER_PIDS=""
ST_PORT=""

# A server on a free loopback port. Mode rules applies the relay's rules in its order: Sec-Fetch-Site other than
# same-origin 403; no Sec-Fetch-Site and an Origin other than its own 403; a declared or a received body over 32768
# bytes 413; a body that is not a JSON object with routeId, locale and events and no other key 400; otherwise 204.
# Mode always-204 answers 204 to every request. A refusal carries a body the script must not record.
ST_SERVER_JS='
const http = require("node:http");
const fs = require("node:fs");
const [mode, portFile] = process.argv.slice(1);
const CAP = 32768;
const ENVELOPE_KEYS = ["routeId", "locale", "events"];
function judge(request, body, own) {
  const site = request.headers["sec-fetch-site"];
  if (site !== undefined ? site !== "same-origin" : request.headers.origin !== own) return 403;
  if (Number(request.headers["content-length"] ?? 0) > CAP || body.length > CAP) return 413;
  let json;
  try { json = JSON.parse(body.toString("utf8")); } catch { return 400; }
  if (json === null || typeof json !== "object" || Array.isArray(json)) return 400;
  const keys = Object.keys(json);
  if (keys.length !== ENVELOPE_KEYS.length || !keys.every((key) => ENVELOPE_KEYS.includes(key))) return 400;
  return 204;
}
const server = http.createServer((request, response) => {
  const chunks = [];
  request.on("data", (chunk) => chunks.push(chunk));
  request.on("end", () => {
    const own = `http://127.0.0.1:${server.address().port}`;
    const status = mode === "always-204" ? 204 : judge(request, Buffer.concat(chunks), own);
    response.writeHead(status, { "content-type": "text/plain" });
    response.end(status === 204 ? undefined : "body-that-must-not-be-recorded\n");
  });
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

# Whether the output holds the line of the case with the given status and result.
st_case_line() {
  local out="$1" name="$2" status="$3" expected="$4" result="$5"
  printf '%s\n' "$out" | grep -qxF "c01_${name} status=${status} expected=${expected} result=${result}"
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
  local out status pid rules_port name expected
  local expectations="cross_site:403 foreign_origin:403 declared_33k:413 chunked_33k:413 envelope_destination:400 envelope_host:400 event_url:204 event_host:204 control:204"

  ST="$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-relay-refusals-test.XXXXXX")"
  trap st_cleanup EXIT

  if ! command -v node > /dev/null 2>&1; then
    st_result "node-on-path" fail
    echo "self_test summary cases=$ST_CASES failed=$ST_FAILED"
    return 1
  fi

  st_expect "server-rules-starts" st_start_server rules
  rules_port="$ST_PORT"
  status=0
  out="$(bash "$SCRIPT_PATH" --base-url "http://127.0.0.1:$rules_port" --probe st-probe_1 2>&1)" || status=$?
  for pair in $expectations; do
    name="${pair%%:*}"
    expected="${pair##*:}"
    st_expect "rules-$name" st_case_line "$out" "$name" "$expected" "$expected" PASS
  done
  st_expect "rules-exits-0" equals "$status" "0"
  st_expect "rules-summary-has-no-failure" has "$out" "c01_summary cases=9 failed=0"
  st_expect "rules-records-no-body" lacks "$out" "body-that-must-not-be-recorded"

  st_expect "server-always-204-starts" st_start_server always-204
  status=0
  out="$(bash "$SCRIPT_PATH" --base-url "http://localhost:$ST_PORT" --probe st2 2>&1)" || status=$?
  st_expect "always-204-cross_site-fails" st_case_line "$out" cross_site 204 403 FAIL
  st_expect "always-204-control-passes" st_case_line "$out" control 204 204 PASS
  st_expect "always-204-exits-1" equals "$status" "1"
  st_expect "always-204-summary-counts-failures" has "$out" "c01_summary cases=9 failed=6"

  # A port nothing listens on: the listener of the rules server is closed by killing it.
  for pid in $ST_SERVER_PIDS; do kill "$pid" 2> /dev/null || true; wait "$pid" 2> /dev/null || true; done
  ST_SERVER_PIDS=""
  status=0
  out="$(bash "$SCRIPT_PATH" --base-url "http://127.0.0.1:$rules_port" --probe st3 2>&1)" || status=$?
  st_expect "no-answer-records-000" st_case_line "$out" control 000 204 FAIL
  st_expect "no-answer-exits-1" equals "$status" "1"

  status=0
  bash "$SCRIPT_PATH" --base-url "https://example.org" --probe st4 > /dev/null 2>&1 || status=$?
  st_expect "foreign-base-url-is-a-usage-error" equals "$status" "2"

  echo "self_test summary cases=$ST_CASES failed=$ST_FAILED"
  [ "$ST_FAILED" -eq 0 ]
}

# ---------------------------------------------------------------------------------------------------

main() {
  local probe_re='^[A-Za-z0-9_-]{1,40}$' loopback_re='^http://(localhost|127\.0\.0\.1):[0-9]{1,5}$'

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
      --base-url | --probe)
        [ "$#" -ge 2 ] || usage_error "$1 requires a value"
        case "$1" in
          --base-url) BASE_URL="$2" ;;
          --probe) PROBE="$2" ;;
        esac
        shift 2
        ;;
      *)
        usage_error "unknown argument: $1"
        ;;
    esac
  done

  [ -n "$BASE_URL" ] || usage_error "--base-url is required"
  if [ "$BASE_URL" != "https://staging.openvaa.org" ] && ! [[ "$BASE_URL" =~ $loopback_re ]]; then
    usage_error "--base-url must be https://staging.openvaa.org or a loopback origin http://localhost:<port> or http://127.0.0.1:<port>"
  fi
  [ -n "$PROBE" ] || usage_error "--probe is required"
  [[ "$PROBE" =~ $probe_re ]] || usage_error "--probe must be 1 to 40 letters, digits, _ or -"
  command -v curl > /dev/null 2>&1 || usage_error "curl is not on the PATH"

  run_cases || exit 1
  exit 0
}

main "$@"
