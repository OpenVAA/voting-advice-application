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
#     PROXY_CHECK_PROJECT_ID=<project id> PROXY_CHECK_LOGIN_EMAIL=<address> PROXY_CHECK_LOGIN_PASSWORD=<password> \
#     infra/local/check-proxy-topology.sh --out /tmp/proxy-check --with-login
#   ```
#
#   --out <dir>     REQUIRED. Receives summary.txt, one file per observation, and the logs of the builds and of each variant. A relative path is resolved against the REPO ROOT, never against $PWD.
#   --with-login    OPTIONAL. Also post a real login through the proxy and follow its redirect. Needs PROXY_CHECK_SUPABASE_URL, PROXY_CHECK_SUPABASE_ANON_KEY, PROXY_CHECK_PROJECT_ID, PROXY_CHECK_LOGIN_EMAIL and PROXY_CHECK_LOGIN_PASSWORD in the environment. The URL must be one the CONTAINER can reach, so a Supabase on this host is http://host.docker.internal:<port>.
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
#   The stop signal, whether the server drains a request in flight on SIGTERM, is checked by check-proxy-sigterm.sh.
#
# Environment:
#   BUILD_SHA                      The id given to the image build. Default: the commit the checkout is on.
#   PROXY_CHECK_PORT               The host port of the proxy, on 127.0.0.1. Default 8181. The public origin is http://vaa.example.test:<this port>.
#   PROXY_CHECK_ADDRESS_HEADER     Passed to the container as ADDRESS_HEADER. Default x-forwarded-for.
#   PROXY_CHECK_XFF_DEPTH          Passed as XFF_DEPTH: the number of proxies in front of the server. Default 1. The spoof control runs with one more.
#   PROXY_CHECK_SUPABASE_URL, PROXY_CHECK_SUPABASE_ANON_KEY, PROXY_CHECK_PROJECT_ID
#                                  Passed as the three PUBLIC_ variables. Unset, the URL names a closed port, so the server starts and every read of the backend fails, which the observations other than the login do not need; an unset project id defaults to the seed project 00000000-0000-0000-0000-000000000001.
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
#   3:  the check could not run: Docker is unavailable, the proxy image is not present, a build failed or outlasted its bound, the port is in use, or the server did not come up
#   130:  interrupted (SIGINT/SIGTERM). Never 0.

set -euo pipefail

# Auto-detect paths from the script's location, so the script behaves identically from any working directory.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_NAME="check-proxy-topology.sh"
# shellcheck source=proxy-check-lib.sh
. "$SCRIPT_DIR/proxy-check-lib.sh"

CONTROL_IMAGE="$FRONTEND_IMAGE:no-build-arg"
OTHER_HOST="other-origin.example.test"
FOREIGN_ORIGIN="http://attacker.example"
SPOOFED_ADDRESS="203.0.113.99"
FORBIDDEN_TEXT="Cross-site POST form submissions are forbidden"
# The Accept header of a browser's native form submission. Kit answers a form action as JSON, with status 200 whatever the action's result, when Accept prefers application/json, and curl's default */* does.
FORM_ACCEPT="Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"

WITH_LOGIN=0

# --- helpers ----------------------------------------------------------------------

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

# $1 = label, $2 = the observed value.
expect_digits() {
  if is_digits "$2"; then
    record "$1" "a string of digits" "$2" PASS
  else
    record "$1" "a string of digits" "${2:-<nothing>}" FAIL
  fi
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
CONTROL_DEPTH=$((BASE_DEPTH + 1))
OTHER_ORIGIN="http://$OTHER_HOST:$PORT"

if [ "$WITH_LOGIN" -eq 1 ]; then
  for required in PROXY_CHECK_SUPABASE_URL PROXY_CHECK_SUPABASE_ANON_KEY PROXY_CHECK_PROJECT_ID PROXY_CHECK_LOGIN_EMAIL PROXY_CHECK_LOGIN_PASSWORD; do
    if [ -z "${!required:-}" ]; then
      usage_error "--with-login needs $required in the environment"
    fi
  done
fi

# --- pre-flight guards, before anything is built or started -------------------------

preflight

# --- 1. build id ------------------------------------------------------------------

FILE="$OUT_DIR/01-build-id.txt"
{
  echo "BUILD_SHA given to the second build: $SHA"
  echo "tracked changes in the checkout at build time: $(git -C "$REPO_ROOT" status --porcelain --untracked-files=no 2> /dev/null | wc -l | tr -d ' ')"
} > "$FILE"

echo "$SCRIPT_NAME: building the control image, with no build argument (the long part)"
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
TAGGED_IMAGE="$CONTROL_IMAGE"

echo "$SCRIPT_NAME: building the image with BUILD_SHA=$SHA"
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
LOGIN_PAGE_VERDICT=PASS
resolve_login_path || LOGIN_PAGE_VERDICT=FAIL
{
  echo "the login page:"
  echo "  GET $LOGIN_ROUTE -> $CODE, Location: $(header_value "$PRIVATE_DIR/login-page.headers" location)"
  echo "  followed -> ${LOGIN_FOLLOWED%% *} at $LOGIN_URL"
} > "$FILE"
if [ "$LOGIN_PAGE_VERDICT" = "PASS" ]; then
  record "form-post.login-page" "on the public origin" "$LOGIN_PATH (HTTP ${LOGIN_FOLLOWED%% *})" PASS
else
  record "form-post.login-page" "on the public origin" "$LOGIN_URL (HTTP ${LOGIN_FOLLOWED%% *})" FAIL
fi

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
