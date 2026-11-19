#!/usr/bin/env bash
#
# posthog-read.sh -- Ask the PostHog EU project one of four fixed questions and print the answer as named counts.
#
# The relay's absence checks are reads of what PostHog stored. This script makes each read one repeatable command whose
# output is a few `ph_<name>=<value>` lines, so a read can be recorded as evidence without an event, a property value
# or the key ever being shown.
#
# What it does. One HTTPS request to the EU app host, https://eu.posthog.com, with the personal API key as a Bearer
# token:
#   settings      GET  /api/projects/<id>/         prints ph_anonymize_ips=true|false
#   probe-count   POST /api/projects/<id>/query/   prints ph_probe_events=<n>: events whose `questionId` property
#                                                  equals the probe id, in the window
#   window-count  POST /api/projects/<id>/query/   prints ph_window_events=<n>: events carrying `openvaa.app`, in the
#                                                  window
#   privacy       POST /api/projects/<id>/query/   prints, over the events carrying `openvaa.app` in the window:
#                   ph_events                       all of them
#                   ph_ip_present                   with `$ip`
#                   ph_geoip_present                with any of the `$geoip_` properties PostHog's GeoIP step sets
#                   ph_user_agent_present           with `$user_agent` or `$raw_user_agent`
#                   ph_url_present                  with `$current_url`, `$pathname` or `url`
#                   ph_referrer_present             with `$referrer` or `$referring_domain`
#                   ph_host_present                 with `$host` or `host`
#                   ph_person_profile_events        whose `$process_person_profile` is not false
#                   ph_persons                      persons linked to the window's distinct ids
#                   ph_pageviews                    named `pageview`
#                   ph_pageview_session_id_present  named `pageview` and with `$session_id`
#                   ph_other_events                 not named `pageview`
#                   ph_other_session_id_present     not named `pageview` and with `$session_id`
# Each query is a `HogQLQuery`. The window is [--since, --until), compared in UTC. The answer is parsed with `jq` into
# those lines only, and an answer of another shape prints `ph_result=unexpected_shape`.
#
# The property names and the HogQL of the three event modes, the `persons` link included, are checked against the
# project's SQL editor before first use: PostHog's naming of a property can differ from what this script assumes, and a
# query that errors there is fixed here before any capture is read with it.
#
# What it does not record: no event, no property value, no response body and no response header is printed or written
# outside a private temporary directory, which is removed on exit. A non-2xx answer prints `ph_query_status=<n>` and
# nothing of the body. The key is read from POSTHOG_PERSONAL_API_KEY and written only to a header file in that
# directory, created with umask 077, so it is on no command line and in no output.
#
# Usage:
#   POSTHOG_PERSONAL_API_KEY=... infra/scripts/posthog-read.sh --project 12345 --mode settings
#   POSTHOG_PERSONAL_API_KEY=... infra/scripts/posthog-read.sh --project 12345 --mode probe-count \
#     --probe capture-20261118T120000Z --since 2026-11-18T12:00:00Z --until 2026-11-18T12:30:00Z
#   POSTHOG_PERSONAL_API_KEY=... infra/scripts/posthog-read.sh --project 12345 --mode privacy \
#     --since 2026-11-18T12:00:00Z --until 2026-11-18T12:30:00Z
#   infra/scripts/posthog-read.sh --self-test
#
#   --project <digits>      REQUIRED. The numeric project id.
#   --mode <mode>           REQUIRED. settings, probe-count, window-count or privacy.
#   --since <utc>           REQUIRED for the three event modes. YYYY-MM-DDTHH:MM:SSZ, inclusive.
#   --until <utc>           REQUIRED for the three event modes. YYYY-MM-DDTHH:MM:SSZ, exclusive, after --since.
#   --probe <id>            REQUIRED for probe-count. 1 to 64 letters, digits, `_` or `-`.
#   --host <origin>         OPTIONAL. Only https://eu.posthog.com is accepted; the self-test alone points it at
#                           its loopback stand-in.
#   --self-test             Run every mode against a loopback stand-in for the EU endpoints, started with node, with a
#                           fake key. Needs no credential and no network beyond 127.0.0.1. Each case prints
#                           `self_test <name> PASS|FAIL`.
#   -h, --help              Print this header and exit 0.
#
# Environment:
#   POSTHOG_PERSONAL_API_KEY  REQUIRED except for --self-test and --help. A read-only personal API key scoped to the
#                             project. Never printed.
#
# Exit codes:
#   0:  the read succeeded and its lines were printed, or every self-test case passed
#   1:  PostHog answered non-2xx or not at all, the answer had another shape, or a self-test case failed
#   2:  usage error

set -euo pipefail
set -f

export LC_ALL=C

SCRIPT_PATH="${BASH_SOURCE[0]}"

EU_HOST="https://eu.posthog.com"

# Set by the self-test only. Assigned here so that no value from the environment can widen the host allowlist.
ST_LOOPBACK_ORIGIN=""

PRIVACY_NAMES="ph_events ph_ip_present ph_geoip_present ph_user_agent_present ph_url_present ph_referrer_present ph_host_present ph_person_profile_events ph_persons ph_pageviews ph_pageview_session_id_present ph_other_events ph_other_session_id_present"

usage_line() {
  echo "usage: posthog-read.sh --project <digits> --mode settings|probe-count|window-count|privacy [--since <utc> --until <utc>] [--probe <id>] [--host https://eu.posthog.com] | --self-test | -h | --help" >&2
}

print_header() {
  awk 'NR == 1 { next } /^#/ { sub(/^# ?/, ""); print; next } { exit }' "$SCRIPT_PATH"
}

usage_error() {
  echo "posthog-read.sh: $1" >&2
  usage_line
  exit 2
}

# ---------------------------------------------------------------------------------------------------
# The read. Every step checks its own status: the self-test runs it in a subshell whose status is tested, where bash
# does not apply errexit.
# ---------------------------------------------------------------------------------------------------

L=""

cleanup() {
  [ -z "$L" ] || rm -rf "$L"
}

# `YYYY-MM-DDTHH:MM:SSZ` as a HogQL UTC datetime.
hogql_time() {
  local value="${1%Z}"
  printf "toDateTime('%s', 'UTC')" "${value/T/ }"
}

# The events of the window. Both bounds are validated before they reach this text.
window_clause() {
  printf 'timestamp >= %s AND timestamp < %s' "$(hogql_time "$SINCE")" "$(hogql_time "$UNTIL")"
}

APP_CLAUSE="properties['openvaa.app'] IS NOT NULL"

# The HogQL text of an event mode. Every value in it has passed a pattern that admits no quote.
query_text() {
  local window
  window="$(window_clause)"
  case "$MODE" in
    probe-count)
      printf "SELECT count() FROM events WHERE %s AND properties.questionId = '%s'" "$window" "$PROBE"
      ;;
    window-count)
      printf 'SELECT count() FROM events WHERE %s AND %s' "$window" "$APP_CLAUSE"
      ;;
    privacy)
      printf '%s' "SELECT count(), \
countIf(properties.\$ip IS NOT NULL), \
countIf(properties.\$geoip_country_code IS NOT NULL OR properties.\$geoip_country_name IS NOT NULL OR properties.\$geoip_city_name IS NOT NULL OR properties.\$geoip_continent_code IS NOT NULL OR properties.\$geoip_subdivision_1_code IS NOT NULL OR properties.\$geoip_postal_code IS NOT NULL OR properties.\$geoip_latitude IS NOT NULL OR properties.\$geoip_longitude IS NOT NULL OR properties.\$geoip_time_zone IS NOT NULL), \
countIf(properties.\$user_agent IS NOT NULL OR properties.\$raw_user_agent IS NOT NULL), \
countIf(properties.\$current_url IS NOT NULL OR properties.\$pathname IS NOT NULL OR properties.url IS NOT NULL), \
countIf(properties.\$referrer IS NOT NULL OR properties.\$referring_domain IS NOT NULL), \
countIf(properties.\$host IS NOT NULL OR properties.host IS NOT NULL), \
countIf(ifNull(toString(properties.\$process_person_profile), '') != 'false'), \
(SELECT count(DISTINCT person_id) FROM person_distinct_ids WHERE distinct_id IN (SELECT distinct_id FROM events WHERE $window AND $APP_CLAUSE)), \
countIf(event = 'pageview'), \
countIf(event = 'pageview' AND properties.\$session_id IS NOT NULL), \
countIf(event != 'pageview'), \
countIf(event != 'pageview' AND properties.\$session_id IS NOT NULL) \
FROM events WHERE $window AND $APP_CLAUSE"
      ;;
  esac
}

# Makes one request and leaves the answer in $L/response.json. Prints `ph_query_status=<n>` and returns 1 on a non-2xx
# answer or none. Arguments: the URL, then `post` to send $L/query.json.
request() {
  local url="$1" method="${2:-get}" code status_re='^[0-9]{3}$'
  if [ "$method" = "post" ]; then
    code="$(curl -sS -o "$L/response.json" -w '%{http_code}' --max-time 30 --proto '=https,http' \
      -H @"$L/auth.header" -H 'Content-Type: application/json' --data-binary @"$L/query.json" "$url" 2> /dev/null)" || true
  else
    code="$(curl -sS -o "$L/response.json" -w '%{http_code}' --max-time 30 --proto '=https,http' \
      -H @"$L/auth.header" "$url" 2> /dev/null)" || true
  fi
  [[ "$code" =~ $status_re ]] || code="000"
  case "$code" in
    2??) return 0 ;;
    *)
      echo "ph_query_status=$code"
      return 1
      ;;
  esac
}

# Prints the named lines from $L/response.json, or `ph_result=unexpected_shape` and returns 1. Nothing is printed until
# the whole answer has parsed.
print_counts() {
  local names_json="$1"
  if jq -r --argjson names "$names_json" '
      if (.results | type) == "array" and (.results | length) == 1
        and (.results[0] | type) == "array" and (.results[0] | length) == ($names | length)
        and all(.results[0][]; type == "number" and . >= 0 and . == floor)
      then [$names, .results[0]] | transpose | .[] | "\(.[0])=\(.[1])"
      else error("unexpected shape") end' "$L/response.json" > "$L/lines.txt" 2> /dev/null; then
    cat "$L/lines.txt"
    return 0
  fi
  echo "ph_result=unexpected_shape"
  return 1
}

print_settings() {
  if jq -r 'if (.anonymize_ips | type) == "boolean" then "ph_anonymize_ips=\(.anonymize_ips)" else error("unexpected shape") end' \
    "$L/response.json" > "$L/lines.txt" 2> /dev/null; then
    cat "$L/lines.txt"
    return 0
  fi
  echo "ph_result=unexpected_shape"
  return 1
}

# A JSON array of the names, for jq.
names_json() {
  local name json="" separator=""
  for name in $1; do
    json="$json$separator\"$name\""
    separator=","
  done
  printf '[%s]' "$json"
}

run_read() {
  L="$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-posthog-read.XXXXXX")" || {
    echo "posthog-read.sh: could not create a temporary directory" >&2
    exit 1
  }
  trap cleanup EXIT
  (umask 077; printf 'Authorization: Bearer %s\n' "$POSTHOG_PERSONAL_API_KEY" > "$L/auth.header") || exit 1

  if [ "$MODE" = "settings" ]; then
    request "$HOST/api/projects/$PROJECT/" || exit 1
    print_settings || exit 1
    exit 0
  fi

  jq -n --arg query "$(query_text)" --arg name "openvaa-posthog-read-$MODE" \
    '{query: {kind: "HogQLQuery", query: $query}, name: $name}' > "$L/query.json" || exit 1
  request "$HOST/api/projects/$PROJECT/query/" post || exit 1
  case "$MODE" in
    probe-count) print_counts '["ph_probe_events"]' || exit 1 ;;
    window-count) print_counts '["ph_window_events"]' || exit 1 ;;
    privacy) print_counts "$(names_json "$PRIVACY_NAMES")" || exit 1 ;;
  esac
  exit 0
}

# ---------------------------------------------------------------------------------------------------
# Self-test. A loopback stand-in only, and a fake key.
# ---------------------------------------------------------------------------------------------------

ST_CASES=0
ST_FAILED=0
ST=""
ST_SERVER_PID=""
# Assembled from two parts so that no key-shaped literal appears in the source for a secret scanner to match.
ST_FAKE_KEY="phx_""fake0000000000000000000000000000000000000000"

# The stand-in. GET /api/projects/<id>/ answers the project with anonymize_ips true. POST /api/projects/<id>/query/
# answers a HogQLQuery by its text: one count for the probe and window questions, thirteen for the privacy question.
# Project 401 answers 401 and project 402 a result of another shape. Every answer body carries the key it was sent and a
# marker, which the script must print neither of. Each request appends one line to the request log: method, kind,
# whether the Bearer key matched, whether the window and the probe are in the query text.
ST_SERVER_JS='
const http = require("node:http");
const fs = require("node:fs");
const [portFile, requestLog] = process.argv.slice(1);
const expectedAuth = `Bearer ${process.env.ST_FAKE_KEY}`;
const server = http.createServer((request, response) => {
  const chunks = [];
  request.on("data", (chunk) => chunks.push(chunk));
  request.on("end", () => {
    const auth = request.headers.authorization === expectedAuth ? "ok" : "bad";
    const echoed = `body-that-must-not-be-recorded ${request.headers.authorization ?? ""}`;
    const send = (status, body) => {
      response.writeHead(status, { "content-type": "application/json" });
      response.end(JSON.stringify({ ...body, echoed }));
    };
    const match = /^\/api\/projects\/(\d+)\/(query\/)?$/.exec(request.url ?? "");
    if (!match) return send(404, {});
    const [, project, isQuery] = match;
    if (auth !== "ok") return send(403, {});
    if (project === "401") return send(401, { type: "authentication_error", code: "invalid_api_key" });
    if (!isQuery && request.method === "GET") {
      fs.appendFileSync(requestLog, `GET project auth=${auth}\n`);
      return send(200, { id: Number(project), anonymize_ips: true, api_token: echoed });
    }
    if (!isQuery || request.method !== "POST") return send(405, {});
    let body;
    try { body = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { return send(400, {}); }
    const kind = body?.query?.kind ?? "none";
    const text = String(body?.query?.query ?? "");
    const windowed = text.includes("2026-11-18 12:00:00") && text.includes("2026-11-18 12:30:00") ? "yes" : "no";
    const probed = text.includes("st-probe_1") ? "yes" : "no";
    fs.appendFileSync(requestLog, `POST ${kind} auth=${auth} window=${windowed} probe=${probed}\n`);
    if (kind !== "HogQLQuery") return send(400, {});
    if (project === "402") return send(200, { results: [["body-that-must-not-be-recorded"]] });
    let row;
    if (text.includes("questionId")) row = [3];
    else if (text.includes("$ip")) row = [5, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 4, 4];
    else row = [7];
    return send(200, { results: [row], columns: [], hogql: echoed });
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

equals() { [ "$1" = "$2" ]; }

# Whether the file holds no match of the fixed string.
file_lacks() { ! grep -qF -- "$2" "$1"; }

# Whether every line of the file is `ph_<name>=<value>`, and there is at least one.
st_named_lines_only() {
  [ -s "$1" ] && ! grep -qvE '^ph_[a-z0-9_]+=(true|false|[0-9]+|unexpected_shape)$' "$1"
}

# Whether every POST line of the request log is a HogQLQuery with the Bearer key and the window, and there are three.
st_posts_well_formed() {
  local log="$ST/requests.log"
  [ "$(grep -c '^POST ' "$log")" -ge 3 ] && ! grep '^POST ' "$log" | grep -qvE '^POST HogQLQuery auth=ok window=yes '
}

# Runs one read against the stand-in, in a subshell, with the fake key. Arguments: an output stem, then the flags.
st_run() {
  local stem="$1"
  shift
  (
    export POSTHOG_PERSONAL_API_KEY="$ST_FAKE_KEY"
    main --host "$ST_LOOPBACK_ORIGIN" "$@"
  ) > "$ST/$stem.out" 2> "$ST/$stem.err"
}

st_cleanup() {
  [ -z "$ST_SERVER_PID" ] || kill "$ST_SERVER_PID" 2> /dev/null || true
  [ -z "$ST" ] || rm -rf "$ST"
}

self_test() {
  local status port waited=0 expected_privacy name
  local window="--since 2026-11-18T12:00:00Z --until 2026-11-18T12:30:00Z"

  ST="$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-posthog-read-test.XXXXXX")"
  trap st_cleanup EXIT

  if ! command -v node > /dev/null 2>&1 || ! command -v jq > /dev/null 2>&1; then
    st_result "node-and-jq-on-path" fail
    echo "self_test summary cases=$ST_CASES failed=$ST_FAILED"
    return 1
  fi

  : > "$ST/requests.log"
  ST_FAKE_KEY="$ST_FAKE_KEY" node -e "$ST_SERVER_JS" "$ST/port" "$ST/requests.log" &
  ST_SERVER_PID=$!
  while [ ! -s "$ST/port" ] && [ "$waited" -lt 50 ]; do
    sleep 0.1
    waited=$((waited + 1))
  done
  port="$(cat "$ST/port" 2> /dev/null || true)"
  st_expect "stand-in-starts" [ -n "$port" ]
  ST_LOOPBACK_ORIGIN="http://127.0.0.1:$port"

  status=0
  st_run settings --project 1 --mode settings || status=$?
  st_expect "settings-prints-anonymize-ips" equals "$status:$(cat "$ST/settings.out")" "0:ph_anonymize_ips=true"

  status=0
  # shellcheck disable=SC2086 # the window is two flag pairs, split on purpose
  st_run probe --project 1 --mode probe-count --probe st-probe_1 $window || status=$?
  st_expect "probe-count-prints-count" equals "$status:$(cat "$ST/probe.out")" "0:ph_probe_events=3"
  st_expect "probe-count-sends-the-probe" grep -qF 'probe=yes' "$ST/requests.log"

  status=0
  # shellcheck disable=SC2086
  st_run window --project 1 --mode window-count $window || status=$?
  st_expect "window-count-prints-count" equals "$status:$(cat "$ST/window.out")" "0:ph_window_events=7"

  status=0
  # shellcheck disable=SC2086
  st_run privacy --project 1 --mode privacy $window || status=$?
  expected_privacy="$(
    set -- 5 0 0 0 0 0 0 0 0 1 0 4 4
    for name in $PRIVACY_NAMES; do
      echo "$name=$1"
      shift
    done
  )"
  st_expect "privacy-prints-every-line" equals "$status:$(cat "$ST/privacy.out")" "0:$expected_privacy"

  st_expect "every-mode-prints-named-lines-only" eval \
    'st_named_lines_only "$ST/settings.out" && st_named_lines_only "$ST/probe.out" && st_named_lines_only "$ST/window.out" && st_named_lines_only "$ST/privacy.out"'
  st_expect "every-query-is-a-hogql-post-with-the-bearer-key" st_posts_well_formed

  status=0
  # shellcheck disable=SC2086
  st_run status401 --project 401 --mode window-count $window || status=$?
  st_expect "status-401-prints-the-status" equals "$(cat "$ST/status401.out")" "ph_query_status=401"
  st_expect "status-401-exits-1" equals "$status" "1"

  status=0
  st_run settings401 --project 401 --mode settings || status=$?
  st_expect "settings-401-exits-1-with-the-status" equals "$status:$(cat "$ST/settings401.out")" "1:ph_query_status=401"

  status=0
  # shellcheck disable=SC2086
  st_run shape --project 402 --mode privacy $window || status=$?
  st_expect "unexpected-shape-exits-1" equals "$status" "1"
  st_expect "unexpected-shape-prints-no-count" equals "$(cat "$ST/shape.out")" "ph_result=unexpected_shape"

  # Globbing is off, so the streams are named one by one.
  : > "$ST/all-streams.txt"
  for name in settings probe window privacy status401 settings401 shape; do
    cat "$ST/$name.out" "$ST/$name.err" >> "$ST/all-streams.txt"
  done
  st_expect "streams-collected" grep -qxF "ph_anonymize_ips=true" "$ST/all-streams.txt"
  st_expect "key-in-neither-stream" file_lacks "$ST/all-streams.txt" "$ST_FAKE_KEY"
  st_expect "no-body-printed" file_lacks "$ST/all-streams.txt" "body-that-must-not-be-recorded"
  st_expect "no-stderr-on-a-read" eval '! [ -s "$ST/settings.err" ] && ! [ -s "$ST/privacy.err" ] && ! [ -s "$ST/status401.err" ]'

  # The control of the two cases above: the stand-in's answers do carry the key and the marker.
  printf 'Authorization: Bearer %s\n' "$ST_FAKE_KEY" > "$ST/control.header"
  curl -sS -o "$ST/control-body.json" --max-time 10 -H @"$ST/control.header" "$ST_LOOPBACK_ORIGIN/api/projects/401/query/" \
    -X POST --data-binary '{}' 2> /dev/null || true
  st_expect "stand-in-answers-carry-the-key-and-the-marker" eval \
    'grep -qF "$ST_FAKE_KEY" "$ST/control-body.json" && grep -qF "body-that-must-not-be-recorded" "$ST/control-body.json"'

  kill "$ST_SERVER_PID" 2> /dev/null || true
  wait "$ST_SERVER_PID" 2> /dev/null || true
  ST_SERVER_PID=""
  status=0
  st_run down --project 1 --mode settings || status=$?
  st_expect "no-answer-prints-000-and-exits-1" equals "$status:$(cat "$ST/down.out")" "1:ph_query_status=000"

  echo "self_test summary cases=$ST_CASES failed=$ST_FAILED"
  [ "$ST_FAILED" -eq 0 ]
}

# ---------------------------------------------------------------------------------------------------

PROJECT=""
MODE=""
SINCE=""
UNTIL=""
PROBE=""
HOST="$EU_HOST"

main() {
  local project_re='^[0-9]{1,15}$' time_re='^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$'
  local probe_re='^[A-Za-z0-9_-]{1,64}$' line_break

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
      --project | --mode | --since | --until | --probe | --host)
        [ "$#" -ge 2 ] || usage_error "$1 requires a value"
        case "$1" in
          --project) PROJECT="$2" ;;
          --mode) MODE="$2" ;;
          --since) SINCE="$2" ;;
          --until) UNTIL="$2" ;;
          --probe) PROBE="$2" ;;
          --host) HOST="$2" ;;
        esac
        shift 2
        ;;
      *)
        usage_error "unknown argument: $1"
        ;;
    esac
  done

  if [ "$HOST" != "$EU_HOST" ] && { [ -z "$ST_LOOPBACK_ORIGIN" ] || [ "$HOST" != "$ST_LOOPBACK_ORIGIN" ]; }; then
    usage_error "--host must be $EU_HOST"
  fi
  [ -n "${POSTHOG_PERSONAL_API_KEY:-}" ] || usage_error "POSTHOG_PERSONAL_API_KEY is not set"
  line_break=$'[\r\n]'
  if [[ "$POSTHOG_PERSONAL_API_KEY" =~ $line_break ]]; then
    usage_error "POSTHOG_PERSONAL_API_KEY holds a line break"
  fi
  [ -n "$PROJECT" ] || usage_error "--project is required"
  [[ "$PROJECT" =~ $project_re ]] || usage_error "--project must be the numeric project id"
  case "$MODE" in
    settings | probe-count | window-count | privacy) ;;
    "") usage_error "--mode is required" ;;
    *) usage_error "--mode must be settings, probe-count, window-count or privacy" ;;
  esac
  if [ "$MODE" != "settings" ]; then
    [ -n "$SINCE" ] || usage_error "--since is required for --mode $MODE"
    [ -n "$UNTIL" ] || usage_error "--until is required for --mode $MODE"
    [[ "$SINCE" =~ $time_re ]] || usage_error "--since must be YYYY-MM-DDTHH:MM:SSZ"
    [[ "$UNTIL" =~ $time_re ]] || usage_error "--until must be YYYY-MM-DDTHH:MM:SSZ"
    [[ "$SINCE" < "$UNTIL" ]] || usage_error "--since must be before --until"
  fi
  if [ "$MODE" = "probe-count" ]; then
    [ -n "$PROBE" ] || usage_error "--probe is required for --mode probe-count"
    [[ "$PROBE" =~ $probe_re ]] || usage_error "--probe must be 1 to 64 letters, digits, _ or -"
  fi
  command -v curl > /dev/null 2>&1 || usage_error "curl is not on the PATH"
  command -v jq > /dev/null 2>&1 || usage_error "jq is not on the PATH"

  run_read
}

main "$@"
