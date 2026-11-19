#!/usr/bin/env bash
#
# load-check.sh -- Run the voter-journey load check with k6 and print the capacity figure of the run.
#
# What it does. It checks the target, the journey and the steps, then runs k6 2.4.0 from the official `grafana/k6`
# image, pinned by digest, with `infra/scripts/load-check/voter-journey.js`. Each step is one arrival rate in journeys
# per minute, held for --step-seconds; the steps run one after the other. k6 writes its summary to <out>/summary.json,
# and the script then prints:
#   k6_exit=<n>
#   step=<i> rate_per_min=<r> page_p95_ms=<x> relay_p95_ms=<y> error_rate=<e> dropped=<n> met=yes|no   (one per step)
#   figure_journeys_per_minute=<rate of the highest step that met every threshold with every step below it, or 0>
#   figure_step=<i or none>
# k6 exits 99 when a threshold was crossed, which is expected at a step above the capacity, and also when the run was
# aborted at errors above 5 % for a minute. The method is written in `infra/scripts/load-check/README.md`.
#
# What it refuses, each with exit 2 before anything is run:
#   - a base URL that is neither https://staging.openvaa.org nor http://host.docker.internal:<port>;
#   - the staging URL without --confirm-target, or with a --confirm-target that is not the base URL;
#   - steps that do not rise strictly, or a step above --max-rate;
#   - a journey whose base is not the base URL, or that holds a request to any host but the base host and one
#     <ref>.supabase.co host, a page request off the base host, a data request off the Supabase host, or a request to
#     /auth/v1/, /functions/v1/, /api/usage or /_app/immutable/;
#   - a journey with a data request when SUPABASE_ANON_KEY is empty;
#   - an --out that already exists.
#
# What it does not record: the anon key reaches k6 through the environment, `-e SUPABASE_ANON_KEY` with no value on the
# command line, and is never printed or written. No response body and no header is written anywhere.
#
# Usage:
#   infra/scripts/load-check.sh --base-url http://host.docker.internal:5275 \
#     --journey infra/scripts/load-check/local-journey.json --steps 1 --step-seconds 60 --max-rate 5 --out tmp/run
#   SUPABASE_ANON_KEY=... infra/scripts/load-check.sh --base-url https://staging.openvaa.org \
#     --confirm-target https://staging.openvaa.org --journey <journey.json> --steps 5,10,20 --max-rate 20 --out <dir>
#   infra/scripts/load-check.sh --self-test
#
#   --base-url <url>        REQUIRED. https://staging.openvaa.org or http://host.docker.internal:<port>.
#   --journey <file>        REQUIRED. The journey file: { base, routeId, locale, requests: [{ method, url, kind, body? }] }.
#   --steps <list>          REQUIRED. Comma-separated arrival rates in journeys per minute, e.g. 5,10,20.
#   --step-seconds <n>      OPTIONAL. The length of each step in seconds. Default: 300.
#   --max-rate <n>          REQUIRED. The highest rate a step may have.
#   --confirm-target <url>  REQUIRED for staging. Must equal --base-url.
#   --out <dir>             REQUIRED. A directory that does not exist yet; its parent must. k6 writes summary.json there.
#   --self-test             Run the refusal cases against a stand-in docker. Needs no Docker and no network.
#                           Each case prints `self_test <name> PASS|FAIL`.
#   -h, --help              Print this header and exit 0.
#
# Exit codes:
#   0:  k6 exited 0 or 99 and the figure was printed, or every self-test case passed
#   1:  k6 exited otherwise, no summary was written, or a self-test case failed
#   2:  usage error, or a refusal above

set -euo pipefail
set -f

export LC_ALL=C

SCRIPT_PATH="${BASH_SOURCE[0]}"
SCRIPT_DIR="$(cd "$(dirname "$SCRIPT_PATH")" && pwd -P)"
K6_DIR="$SCRIPT_DIR/load-check"
K6_IMAGE="grafana/k6:2.4.0@sha256:d41bb79cd8de5a7ad619b53570e3712633e8bff0937010a5c6c57a4747e7a276"
STAGING_URL="https://staging.openvaa.org"

BASE_URL=""
JOURNEY=""
STEPS=""
STEP_SECONDS="300"
MAX_RATE=""
CONFIRM_TARGET=""
OUT=""

usage_line() {
  echo "usage: load-check.sh --base-url <url> --journey <file> --steps <list> --max-rate <n> --out <new dir> [--step-seconds <n>] [--confirm-target <url>] | --self-test | -h | --help" >&2
}

print_header() {
  awk 'NR == 1 { next } /^#/ { sub(/^# ?/, ""); print; next } { exit }' "$SCRIPT_PATH"
}

usage_error() {
  echo "load-check.sh: $1" >&2
  usage_line
  exit 2
}

# Checks the journey file against the base URL. Prints nothing on success and one reason on failure, exit 1.
# The journey reaches node as a path, never as text on the command line.
JOURNEY_CHECK_JS='
const fs = require("node:fs");
const [file, baseUrl, keyPresent] = process.argv.slice(1);
const refused = ["/auth/v1/", "/functions/v1/", "/api/usage", "/_app/immutable/"];
const supabaseHost = /^[a-z0-9]+\.supabase\.co$/;
function stop(reason) { process.stderr.write(reason + "\n"); process.exit(1); }
let journey;
try { journey = JSON.parse(fs.readFileSync(file, "utf8")); } catch { stop("the journey is not readable JSON"); }
if (journey === null || typeof journey !== "object" || Array.isArray(journey)) stop("the journey is not an object");
if (journey.base !== baseUrl) stop("the journey base is not the base URL");
if (typeof journey.routeId !== "string" || typeof journey.locale !== "string") stop("the journey lacks routeId or locale");
if (!Array.isArray(journey.requests) || journey.requests.length === 0) stop("the journey holds no request");
const base = new URL(baseUrl);
const supabaseOrigins = new Set();
journey.requests.forEach((entry, index) => {
  let url;
  try { url = new URL(entry.url); } catch { stop(`request ${index} has no absolute URL`); }
  if (refused.some((path) => url.pathname.startsWith(path))) stop(`request ${index} asks a refused path`);
  if (!["GET", "HEAD", "POST"].includes(entry.method)) stop(`request ${index} has method ${entry.method}`);
  const onBase = url.origin === base.origin;
  const onSupabase = url.protocol === "https:" && url.port === "" && supabaseHost.test(url.hostname);
  if (!onBase && !onSupabase) stop(`request ${index} is to a host that is neither the base host nor a Supabase host`);
  if (onSupabase) supabaseOrigins.add(url.origin);
  if (entry.kind === "page" && !onBase) stop(`page request ${index} is not on the base host`);
  if (entry.kind === "data" && !onSupabase) stop(`data request ${index} is not on the Supabase host`);
  if (entry.kind !== "page" && entry.kind !== "data") stop(`request ${index} has kind ${entry.kind}`);
  if (entry.kind === "data" && keyPresent !== "yes") stop("the journey holds a data request and SUPABASE_ANON_KEY is empty");
});
if (supabaseOrigins.size > 1) stop("the journey holds requests to more than one Supabase host");
'

check_arguments() {
  local rate_re='^[1-9][0-9]*$' local_re='^http://host\.docker\.internal:[1-9][0-9]{0,4}$' step previous="" reason key_present=no

  [ -n "$BASE_URL" ] || usage_error "--base-url is required"
  if [ "$BASE_URL" = "$STAGING_URL" ]; then
    [ -n "$CONFIRM_TARGET" ] || usage_error "a staging run needs --confirm-target $STAGING_URL"
    [ "$CONFIRM_TARGET" = "$BASE_URL" ] || usage_error "--confirm-target is not the base URL"
  elif [[ "$BASE_URL" =~ $local_re ]]; then
    if [ -n "$CONFIRM_TARGET" ] && [ "$CONFIRM_TARGET" != "$BASE_URL" ]; then
      usage_error "--confirm-target is not the base URL"
    fi
  else
    usage_error "--base-url must be $STAGING_URL or http://host.docker.internal:<port>"
  fi

  [ -n "$MAX_RATE" ] || usage_error "--max-rate is required"
  [[ "$MAX_RATE" =~ $rate_re ]] || usage_error "--max-rate must be a positive whole number"
  [[ "$STEP_SECONDS" =~ $rate_re ]] || usage_error "--step-seconds must be a positive whole number"
  [ -n "$STEPS" ] || usage_error "--steps is required"
  [[ "$STEPS" =~ ^[0-9]+(,[0-9]+)*$ ]] || usage_error "--steps must be comma-separated whole numbers"
  for step in ${STEPS//,/ }; do
    [[ "$step" =~ $rate_re ]] || usage_error "--steps holds $step, not a positive whole number"
    [ "$step" -le "$MAX_RATE" ] || usage_error "--steps holds $step, above --max-rate $MAX_RATE"
    [ -z "$previous" ] || [ "$step" -gt "$previous" ] || usage_error "--steps must rise strictly; $step follows $previous"
    previous="$step"
  done

  [ -n "$OUT" ] || usage_error "--out is required"
  [ ! -e "$OUT" ] || usage_error "--out already exists; give a new directory"
  [ -d "$(dirname "$OUT")" ] || usage_error "the parent directory of --out does not exist"

  [ -n "$JOURNEY" ] || usage_error "--journey is required"
  [ -f "$JOURNEY" ] || usage_error "--journey is not a file"
  command -v node > /dev/null 2>&1 || usage_error "node is not on the PATH"
  [ -z "${SUPABASE_ANON_KEY:-}" ] || key_present=yes
  reason="$(node -e "$JOURNEY_CHECK_JS" "$JOURNEY" "$BASE_URL" "$key_present" 2>&1)" || usage_error "journey refused: $reason"
}

run_check() {
  local out_abs journey_abs k6_exit=0

  command -v docker > /dev/null 2>&1 || usage_error "docker is not on the PATH"
  mkdir "$OUT"
  out_abs="$(cd "$OUT" && pwd -P)"
  journey_abs="$(cd "$(dirname "$JOURNEY")" && pwd -P)/$(basename "$JOURNEY")"

  # The key is named without a value, so docker reads it from this environment and it never appears in a process list.
  SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-}" docker run --rm -i \
    --user "$(id -u):$(id -g)" \
    -v "$K6_DIR:/scripts:ro" \
    -v "$journey_abs:/journey/journey.json:ro" \
    -v "$out_abs:/out" \
    -e STEPS="$STEPS" \
    -e STEP_SECONDS="$STEP_SECONDS" \
    -e BASE_URL="$BASE_URL" \
    -e JOURNEY=/journey/journey.json \
    -e SUPABASE_ANON_KEY \
    -e K6_NO_USAGE_REPORT=true \
    "$K6_IMAGE" run /scripts/voter-journey.js < /dev/null || k6_exit=$?

  echo "k6_exit=$k6_exit"
  [ -s "$out_abs/summary.json" ] || { echo "load-check.sh: no summary was written" >&2; return 1; }
  node "$K6_DIR/figure.mjs" "$out_abs/summary.json" || return 1
  case "$k6_exit" in
    0 | 99) return 0 ;;
    *) return 1 ;;
  esac
}

# ---------------------------------------------------------------------------------------------------
# Self-test. A stand-in docker on the PATH records whether it was called; no container runs.
# ---------------------------------------------------------------------------------------------------

ST_CASES=0
ST_FAILED=0
ST=""

st_result() {
  ST_CASES=$((ST_CASES + 1))
  if [ "$2" = "pass" ]; then
    echo "self_test $1 PASS"
  else
    echo "self_test $1 FAIL"
    ST_FAILED=$((ST_FAILED + 1))
  fi
}

st_cleanup() {
  [ -z "$ST" ] || rm -rf "$ST"
}

# Runs the script with the stand-in docker first on the PATH; sets ST_STATUS and ST_CALLED (yes when docker was run).
st_run() {
  ST_STATUS=0
  rm -f "$ST/docker-called" "$ST/docker-args"
  PATH="$ST/bin:$PATH" bash "$SCRIPT_PATH" "$@" > "$ST/run.out" 2>&1 || ST_STATUS=$?
  if [ -e "$ST/docker-called" ]; then ST_CALLED=yes; else ST_CALLED=no; fi
}

# A refusal: exit 2, the expected reason in the output, and docker never called.
st_refused() {
  local name="$1" reason="$2"
  shift 2
  st_run "$@"
  if [ "$ST_STATUS" -eq 2 ] && [ "$ST_CALLED" = "no" ] && grep -qF -- "$reason" "$ST/run.out"; then
    st_result "$name" pass
  else
    st_result "$name" fail
  fi
}

st_journey() {
  local file="$1" base="$2"
  shift 2
  {
    printf '{ "base": "%s", "routeId": "/(voters)", "locale": "en", "requests": [' "$base"
    local first=1 entry
    for entry in "$@"; do
      [ "$first" -eq 1 ] || printf ', '
      first=0
      printf '%s' "$entry"
    done
    printf '] }\n'
  } > "$file"
}

self_test() {
  local local_url="http://host.docker.internal:5275" supabase="https://abcdefghijklmnop.supabase.co" args

  ST="$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-load-check-test.XXXXXX")"
  trap st_cleanup EXIT
  mkdir "$ST/bin" "$ST/runs"

  if ! command -v node > /dev/null 2>&1; then
    st_result "node-on-path" fail
    echo "self_test summary cases=$ST_CASES failed=$ST_FAILED"
    return 1
  fi

  # The stand-in docker records that it ran and its arguments, and writes a one-step summary where /out is mounted.
  cat > "$ST/bin/docker" << 'STUB'
#!/usr/bin/env bash
here="$(dirname "$0")/.."
: > "$here/docker-called"
printf '%s\n' "$@" > "$here/docker-args"
for arg in "$@"; do
  case "$arg" in
    *:/out) out="${arg%:/out}" ;;
  esac
done
cat > "$out/summary.json" << 'JSON'
{ "load_check": { "steps": [1], "step_seconds": 60 }, "metrics": {} }
JSON
exit 0
STUB
  chmod +x "$ST/bin/docker"

  st_journey "$ST/staging.json" "$STAGING_URL" '{ "method": "GET", "url": "https://staging.openvaa.org/", "kind": "page" }'
  st_journey "$ST/local.json" "$local_url" '{ "method": "GET", "url": "http://host.docker.internal:5275/", "kind": "page" }'
  st_journey "$ST/foreign.json" "$local_url" \
    '{ "method": "GET", "url": "http://host.docker.internal:5275/", "kind": "page" }' \
    '{ "method": "GET", "url": "https://example.org/", "kind": "page" }'
  st_journey "$ST/auth.json" "$local_url" \
    '{ "method": "GET", "url": "http://host.docker.internal:5275/", "kind": "page" }' \
    "{ \"method\": \"POST\", \"url\": \"$supabase/auth/v1/token\", \"kind\": \"data\" }"
  st_journey "$ST/function.json" "$local_url" \
    "{ \"method\": \"POST\", \"url\": \"$supabase/functions/v1/account-access\", \"kind\": \"data\" }"
  st_journey "$ST/two-supabase.json" "$local_url" \
    "{ \"method\": \"GET\", \"url\": \"$supabase/rest/v1/elections\", \"kind\": \"data\" }" \
    '{ "method": "GET", "url": "https://qrstuvwxyzabcdef.supabase.co/rest/v1/elections", "kind": "data" }'
  st_journey "$ST/data.json" "$local_url" \
    "{ \"method\": \"GET\", \"url\": \"$supabase/rest/v1/elections\", \"kind\": \"data\" }"

  st_refused "staging-without-confirm-target-is-refused" "needs --confirm-target" \
    --base-url "$STAGING_URL" --journey "$ST/staging.json" --steps 1 --max-rate 5 --out "$ST/runs/a"
  st_refused "confirm-target-that-differs-is-refused" "--confirm-target is not the base URL" \
    --base-url "$STAGING_URL" --confirm-target "https://staging.openvaa.org/" --journey "$ST/staging.json" \
    --steps 1 --max-rate 5 --out "$ST/runs/b"
  st_refused "step-above-max-rate-is-refused" "above --max-rate" \
    --base-url "$local_url" --journey "$ST/local.json" --steps 1,6 --max-rate 5 --out "$ST/runs/c"
  st_refused "steps-that-fall-are-refused" "--steps must rise strictly" \
    --base-url "$local_url" --journey "$ST/local.json" --steps 20,10 --max-rate 50 --out "$ST/runs/c2"
  st_refused "repeated-step-is-refused" "--steps must rise strictly" \
    --base-url "$local_url" --journey "$ST/local.json" --steps 5,10,10 --max-rate 50 --out "$ST/runs/c3"
  st_refused "foreign-host-in-journey-is-refused" "neither the base host nor a Supabase host" \
    --base-url "$local_url" --journey "$ST/foreign.json" --steps 1 --max-rate 5 --out "$ST/runs/d"
  mkdir "$ST/runs/existing"
  st_refused "existing-out-is-refused" "--out already exists" \
    --base-url "$local_url" --journey "$ST/local.json" --steps 1 --max-rate 5 --out "$ST/runs/existing"
  st_refused "base-url-outside-allowlist-is-refused" "--base-url must be" \
    --base-url "https://example.org" --journey "$ST/local.json" --steps 1 --max-rate 5 --out "$ST/runs/e"
  st_refused "loopback-base-url-is-refused" "--base-url must be" \
    --base-url "http://127.0.0.1:5275" --journey "$ST/local.json" --steps 1 --max-rate 5 --out "$ST/runs/f"
  st_refused "journey-base-that-differs-is-refused" "the journey base is not the base URL" \
    --base-url "http://host.docker.internal:5276" --journey "$ST/local.json" --steps 1 --max-rate 5 --out "$ST/runs/g"
  SUPABASE_ANON_KEY=st-fake-key st_refused "auth-path-in-journey-is-refused" "asks a refused path" \
    --base-url "$local_url" --journey "$ST/auth.json" --steps 1 --max-rate 5 --out "$ST/runs/h"
  SUPABASE_ANON_KEY=st-fake-key st_refused "function-path-in-journey-is-refused" "asks a refused path" \
    --base-url "$local_url" --journey "$ST/function.json" --steps 1 --max-rate 5 --out "$ST/runs/i"
  SUPABASE_ANON_KEY=st-fake-key st_refused "second-supabase-host-is-refused" "more than one Supabase host" \
    --base-url "$local_url" --journey "$ST/two-supabase.json" --steps 1 --max-rate 5 --out "$ST/runs/j"
  SUPABASE_ANON_KEY="" st_refused "data-request-without-key-is-refused" "SUPABASE_ANON_KEY is empty" \
    --base-url "$local_url" --journey "$ST/data.json" --steps 1 --max-rate 5 --out "$ST/runs/k"

  SUPABASE_ANON_KEY=st-fake-key-value st_run \
    --base-url "$local_url" --journey "$ST/data.json" --steps 1 --step-seconds 60 --max-rate 5 --out "$ST/runs/ok"
  args="$(cat "$ST/docker-args" 2> /dev/null || true)"
  if [ "$ST_STATUS" -eq 0 ] && [ "$ST_CALLED" = "yes" ]; then st_result "valid-run-calls-docker" pass; else st_result "valid-run-calls-docker" fail; fi
  if printf '%s\n' "$args" | grep -qx "$K6_IMAGE"; then st_result "valid-run-uses-pinned-image" pass; else st_result "valid-run-uses-pinned-image" fail; fi
  if printf '%s\n' "$args" | grep -qx 'SUPABASE_ANON_KEY'; then st_result "valid-run-names-key-without-value" pass; else st_result "valid-run-names-key-without-value" fail; fi
  case "$args$(cat "$ST/run.out")" in
    *st-fake-key-value*) st_result "valid-run-keeps-key-off-command-line-and-output" fail ;;
    *) st_result "valid-run-keeps-key-off-command-line-and-output" pass ;;
  esac
  if grep -qx 'k6_exit=0' "$ST/run.out" && grep -qx 'figure_journeys_per_minute=0' "$ST/run.out"; then
    st_result "valid-run-prints-exit-and-figure" pass
  else
    st_result "valid-run-prints-exit-and-figure" fail
  fi

  echo "self_test summary cases=$ST_CASES failed=$ST_FAILED"
  [ "$ST_FAILED" -eq 0 ]
}

# ---------------------------------------------------------------------------------------------------

main() {
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
      --base-url | --journey | --steps | --step-seconds | --max-rate | --confirm-target | --out)
        [ "$#" -ge 2 ] || usage_error "$1 requires a value"
        case "$1" in
          --base-url) BASE_URL="$2" ;;
          --journey) JOURNEY="$2" ;;
          --steps) STEPS="$2" ;;
          --step-seconds) STEP_SECONDS="$2" ;;
          --max-rate) MAX_RATE="$2" ;;
          --confirm-target) CONFIRM_TARGET="$2" ;;
          --out) OUT="$2" ;;
        esac
        shift 2
        ;;
      *)
        usage_error "unknown argument: $1"
        ;;
    esac
  done

  check_arguments
  run_check || exit 1
  exit 0
}

main "$@"
