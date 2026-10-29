#!/usr/bin/env bash
#
# e2e-run.sh -- Perform exactly ONE preflight-confirmed E2E run and leave behind a
#               complete, machine-readable evidence directory.
#
# Usage:
#   - tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/run-01
#   - tests/scripts/e2e-run.sh --run-dir /abs/path/run-01 --project eperm07-term-trigger
#   - FRONTEND_PORT=5273 tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/run-01
#   - tests/scripts/e2e-run.sh --self-test
#
#   --run-dir <path>   REQUIRED. Where every artifact for this run lands. A relative path is resolved against the REPO ROOT, never against $PWD, so the script behaves identically from any working directory.
#   --project <name>   OPTIONAL. Restrict the run to one Playwright project. With no
#                      --project the run is the full gate suite, invoked exactly as the root `test:e2e` script does (including --grep-invert @probe).
#   --no-db-reset      OPTIONAL. Skip the database reset; Supabase is still started (via `yarn db:start`) so the readiness poll below has something to poll. Use it to run against a database a previous run left behind -- the suite creates and owns its own project, so a reset is not a precondition of a correct run.
#   --no-watch         OPTIONAL. Start only the frontend dev server (`yarn dev:clean && yarn workspace @openvaa/frontend dev`), not `yarn _dev:concurrent`, which adds the shared-package watcher under `concurrently --kill-others-on-fail`. The Vite process is the same one either starts, so the preflight and the project scoping are unchanged. The packages must already be built (`yarn build`); CI passes it because its build step does that and nothing changes them during the run.
#   --self-test        Instead of an E2E run, exercise the host-suspend heartbeat on its own, in a scratch directory: it must stay silent on an awake host under CPU load, and under a hold shorter than its threshold, and it must end the run as void when it is held with SIGSTOP for longer than the threshold. Then the key server's bind decision: the loopback on macOS, the address a stubbed lookup answers on Linux, and a refusal on Linux when the lookup answers no address or the unspecified one. Then the mock issuer's stop, on two scratch listeners: the one whose command line holds the issuer's entry is stopped, the other is left running. Needs no database, no dev server and no --run-dir. HEARTBEAT_SELF_TEST_AWAKE_S (default 15) is the length of the loaded leg and HEARTBEAT_SELF_TEST_BUSY_LOOPS (default: one per CPU) the number of busy loops it runs; the leg prints the distribution of the wake-up lateness it observed, which is the measurement the threshold rests on.
#
# Prerequisites:
#   - `yarn install` has run and Playwright browsers are installed (`yarn playwright install`)
#   - Docker is running. This script starts Supabase itself, via `yarn db:reset` (or `yarn db:start` under --no-db-reset).
#   - NOTHING is already listening on $FRONTEND_PORT. This script SPAWNS AND OWNS its own dev server; a surviving listener would either trip Vite's `strictPort` or, worse, wildcard shadow-bind and serve a different checkout to the suite.
#   - Nothing is listening on port 8777 or 9443, and `python3` is on the PATH: it serves the identity provider's JWKS document. The stack's edge-runtime container is running, with `bash`, `timeout` and `getent` in it: on Linux the key server's address is looked up there, and on every host the wrapper probes the key server from there.
#
# The script automatically:
#   1. Neutralises the environment -- unsets the three EPERM07_ forcing knobs and CI -- and records the resulting retry/worker posture as evidence
#   2. Records provenance: UTC start timestamp, git HEAD, working-tree cleanliness
#   3. Holds a sleep assertion for the life of the run where `caffeinate` exists (macOS), so that an idle host is not put to sleep under the suite, and records in env-posture.txt whether it does. Then starts the host-suspend heartbeat: a background loop that sleeps a fixed interval and compares the wall-clock time that passed with that interval. A process that is not scheduled does not see time pass, so a gap far beyond the interval means the host was suspended (a laptop asleep, a paused virtual machine), and every deadline Playwright measures on the wall clock has been running through it. On such a gap the run ends as VOID: the marker file VOID-host-suspend.txt is written into the run directory, Playwright is stopped through the teardown of step 9, and the wrapper exits 8. Every beat is recorded in heartbeat.log, one line each: the wall clock in epoch milliseconds, then the milliseconds by which the beat was late
#   4. Prepares the database: `yarn db:reset` (which starts Supabase first) -- unless --no-db-reset is given, in which case it only runs `yarn db:start` and leaves the existing data in place. The command's output lands in the run directory as db-reset.log or db-start.log, without the stack's status and so without its keys
#   5. POLLS REST + Storage for readiness and asserts the `public-assets` bucket is listed -- `db:status` passing is NOT readiness -- then prepares the identity provider's test environment and serves `identity-callback` with it (see "The identity provider's environment" below)
#   6. ASSERTS $FRONTEND_PORT has no listener, then spawns the frontend dev server -- root `yarn dev` without its `yarn db:start`, so the stack's status and keys are never printed into the log -- with its stdout+stderr redirected into the run directory as devserver.log, and waits for the port to accept connections. It refuses to adopt a foreign listener, and at teardown it kills only processes in its own spawned process group. The dev server is given the identity provider's test environment and trusts the mock issuer's committed certificate through NODE_EXTRA_CA_CERTS
#   7. Runs Playwright, in a process group of its own, with per-run JSON and HTML reporter output
#   8. Captures the served-application preflight verdict by counting its fixed failure headline in the captured stdout
#   9. Tears down FROM A TRAP: stops the heartbeat, stops Playwright if it is still running, tears the dev server down, asserts the port has no listener, stops the function server and the JWKS server, stops this checkout's mock issuer when it still listens on 9443, restores the shared stack's edge runtime and releases the sleep assertion
#   10. Records the UTC end timestamp and the wrapper's own exit status (wrapper-exit)
#
# The identity provider's environment. The identity-provider specs are part of every run, so every run prepares what they need, from the committed test keys (tests/tests/utils/testKeys.ts) and the mock issuer's constants (tests/tests/support/mockOidcIssuer.ts), into a temporary directory OUTSIDE the repository that is removed on every exit:
#   - the Edge file for `identity-callback`: the mock's issuer and audience, the JWKS URI http://host.docker.internal:8777/jwks, the test decryption keys, the project the suite seeds as PUBLIC_PROJECT_ID, SITE_URL at this run's FRONTEND_PORT, and SMTP_HOST, SMTP_PORT and SMTP_FROM copied from the tracked functions template, so that `account-access` keeps mailing;
#   - the dev server's environment: the Idura provider pointing at the mock issuer on 127.0.0.1:9443, the test signing and decryption keys, the client id;
#   - IDENTITY_CALLBACK_SERVER_SECRET, one random value generated for this run alone: written into the Edge file and the dev server's environment, so that `identity-callback` answers the dev server, and into the environment Playwright runs in, so that the direct-call spec can call the function as the dev server does. It is never printed, never put on a command line and never written into the run directory;
#   - the JWKS document, served on port 8777 to the edge runtime, which cannot reach the host's 127.0.0.1:9443 nor trust its certificate. The key server listens on one address, IDP_JWKS_BIND, never on every interface: 127.0.0.1 on macOS, where Docker Desktop forwards `host.docker.internal` to the host's loopback; on Linux, the address `getent hosts host.docker.internal` answers inside the edge-runtime container, the bridge through which the stack reaches the host. A Linux lookup that answers no address, or the unspecified one, refuses the run with status 9. The address is recorded in idp-env.txt as jwks_bind and printed (`e2e-run.sh: key server bound to <address>`). Once `identity-callback` is served, the wrapper proves the edge runtime reaches the key server: from inside that container, bash's /dev/tcp asks host.docker.internal:8777 for /jwks, and the status line must hold 200. It is recorded as jwks_reachable_from_edge and printed (`e2e-run.sh: the edge runtime reached the key server: <status line>`); any other answer refuses the run with status 9, before Playwright starts.
# It refuses to start when port 8777 or 9443 is already held (Playwright's `webServer` entry spawns the mock issuer on 9443 itself). Playwright stops the issuer when it ends by itself, and not when the wrapper stops it, as it does on a void or interrupted run; so on every exit, before the stack is restored and its ports checked, the wrapper stops a listener on 9443 whose command line holds this checkout's absolute path to tests/tests/support/mockOidcIssuerEntry.ts, with its process group. A listener is never matched by the port alone, since another checkout's run may hold the port: one whose command line does not hold the path is left alone. Either is recorded at the top of restore.txt (`mock issuer: stopped <pid>`, `mock issuer: foreign listener left (pid <pid>)`, or `mock issuer: no listener on port 9443`). It runs `supabase functions serve --no-verify-jwt --env-file <the Edge file>`, which REPLACES the edge-runtime container of the shared local stack for every function, and waits until that container carries the file's issuer -- read back by that one name -- and `identity-callback` answers an OPTIONS request below 500. The issuer read back is recorded in idp-env.txt; the function server's output in idp-functions.log. No key, private JWK or value of the generated environment is printed or written into the run directory.
# The suite never reads the developer's untracked functions environment file (apps/supabase/supabase/functions/.env): what the edge runtime holds during a run is the generated file alone. Stopping the function server REMOVES the edge-runtime container, and `yarn db:start` alone does not bring it back (measured), so at its end, on every exit once the preparation began, an interrupt included, the wrapper restores the shared stack with `yarn db:stop` then `yarn db:start` (measured: about 30 s together on the development host), confirms that every function of the tree answers an OPTIONS request below 500 and that ports 8777 and 9443 are free, and writes each check into restore.txt, which ends with the line `restore: ok` only when every check held. The stack is shared with every other checkout of this project on the host, so a run restarts it once at its end.
# Certificate verification is never disabled: the dev server trusts the one committed certificate (tests/tests/support/mock-oidc-cert.pem) through NODE_EXTRA_CA_CERTS, and the browser contexts of the projects that navigate to the mock issuer set `ignoreHTTPSErrors`. A `yarn test:e2e` against a server started without this environment fails the identity-provider specs; it does not skip them.
#
# Style follows apps/supabase/benchmarks/scripts/run-benchmarks.sh (shebang form, header block, `set -euo pipefail`, script-location-relative paths, "${VAR:-default}" env defaults).
#
# `tests/scripts/determinism-batch.sh` LOOPS this script; it is deliberately a separate, independently testable unit that performs exactly one run.
#
# Exit codes -- the caller must be able to branch on the status alone:
#   0    the run completed and Playwright reported success; under --self-test, every case passed.
#   1    Playwright reported failures; under --self-test, a case failed.
#   2    usage error.
#   3    database preparation failed -- `yarn db:reset`, or `yarn db:start` under --no-db-reset.
#   4    the readiness poll timed out (or the service-role key it needs is unavailable).
#   5    the dev server never started listening, or the port was already occupied before the spawn (this wrapper SPAWNS AND OWNS its server; adopting a foreign one is not evidence).
#   6    the run produced one or more preflight failures, or produced no preflight SUCCESS line at all (an unconfirmed run is not evidence either way).
#   7    the wrapper's preflight literals do not match tests/tests/support/preflight.ts, so its preflight verdict cannot be trusted.
#   8    the run is VOID: the host was suspended while it ran. Neither a pass nor a test failure, whatever Playwright had reported by then, and it overrides every other status in this table. The run directory holds VOID-host-suspend.txt, which records the gap; the run is made again under a new run directory, not diagnosed.
#   9    the identity provider's environment could not be prepared -- the key server had no address to bind to, or the edge runtime did not reach it, among the rest -- or the shared stack could not be restored afterwards (restore.txt names the check that failed). It overrides 0 and 1: a run whose stack was not put back is not evidence of a green suite, and a preparation failure is not a test failure. Status 8 still overrides it.
#   130  the run was INTERRUPTED (SIGINT/SIGTERM). Never 0: a caller counting consecutive green runs must record an abort as an abort, not as a green.

set -euo pipefail

# Auto-detect paths from script location -- cwd-independence is not optional here: the Playwright config documents the same spawn-cwd hazard at its `webServer` entry.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TESTS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$TESTS_DIR/.." && pwd)"

# FRONTEND_PORT defaults to 5273, NOT 5173: on the development host port 5173 is held by a Docker sibling's IPv6 wildcard bind. The port is passed as a shell PREFIX to both the dev server and the Playwright invocation -- never written into .env.
FRONTEND_PORT="${FRONTEND_PORT:-5273}"
SUPABASE_URL="${SUPABASE_URL:-http://127.0.0.1:54321}"
READINESS_TIMEOUT_S="${READINESS_TIMEOUT_S:-120}"
DEVSERVER_TIMEOUT_S="${DEVSERVER_TIMEOUT_S:-180}"

# The preflight's headlines are deliberately FIXED so they can be grepped, and both are EXPORTED CONSTANTS in tests/tests/support/preflight.ts so this wrapper can assert it is still grepping for strings that exist (see the drift guard below). Do not parse anything else out of human output.
#
# The SUCCESS headline is what makes the verdict a POSITIVE assertion. A pure absence check (`failures == 0`) cannot distinguish "the preflight passed" from "the preflight never ran" from "the literal was renamed" -- and a run counts as evidence only on a positive verdict.
PREFLIGHT_HEADLINE='E2E PREFLIGHT FAILED'
PREFLIGHT_OK_HEADLINE='E2E PREFLIGHT OK'

# The host-suspend heartbeat beats every HEARTBEAT_INTERVAL_S seconds. A beat that arrives SUSPEND_THRESHOLD_MS or more beyond the interval ends the run as void. The threshold sits between two measured quantities and is deliberately not configurable: the lateness of a beat on an awake host, which stays below a fifth of a second under a CPU load several times the core count, and the length of a system sleep, which is three seconds or more in all but a few cases and often minutes. `--self-test` prints the first for the host it runs on, and every run records its own in heartbeat.log.
HEARTBEAT_INTERVAL_S=2
SUSPEND_THRESHOLD_MS=3000
VOID_MARKER='VOID-host-suspend.txt'
HEARTBEAT_LOG='heartbeat.log'
# How long Playwright gets to shut down on SIGINT -- close its browsers, write its reports -- before its process group is killed.
PW_STOP_GRACE_S=15

RUN_DIR=""
PROJECT=""
DB_RESET=true
WATCH=true
SELF_TEST=false
DEV_PID=""
HEARTBEAT_PID=""
SLEEP_ASSERTION_PID=""
PW_PID=""
TEE_PID=""
PW_PIPE_DIR=""
INTERRUPTED=0
IDP_DIR=""
IDP_STARTED=false
IDP_JWKS_PID=""
IDP_JWKS_BIND=""
IDP_FN_PID=""
EDGE_CONTAINER=""
MOCK_ISSUER_STOP_REPORT=""

# The identity provider's test environment. The mock issuer listens on MOCK_OIDC_PORT, the port of MOCK_ISSUER in tests/tests/support/mockOidcIssuer.ts, which the preparation step checks against the generated issuer. The edge runtime fetches the JWKS document from the host on IDP_JWKS_PORT.
IDP_JWKS_PORT=8777
MOCK_OIDC_PORT=9443
IDP_READY_TIMEOUT_S=180
MOCK_CERT="$TESTS_DIR/tests/support/mock-oidc-cert.pem"
# The mock issuer's entry, which Playwright's `webServer` entry starts: its absolute path in a listener's command line marks this checkout's issuer.
MOCK_ISSUER_ENTRY="$TESTS_DIR/tests/support/mockOidcIssuerEntry.ts"
FUNCTIONS_DIR="$REPO_ROOT/apps/supabase/supabase/functions"

# The project the E2E harness owns, mirrored from the committed default in packages/dev-seed/src/supabaseAdminClient.ts. Only used when E2E_PROJECT_ID is not set; the harness resolves the same fallback itself, so the two agree with no configuration.
E2E_PROJECT_ID_DEFAULT="00000000-0000-0000-0000-0000000000e2"

usage() {
  # Delimit the header block rather than hardcoding a line range: a fixed `sed -n '2,Np'` truncates the exit-code table the header tells the caller to branch on as soon as the header grows.
  sed -n '2,/^set -euo pipefail/p' "${BASH_SOURCE[0]}" | sed '$d'
}

# A value-taking flag given as the LAST argument must be a USAGE error, not a silent death. `VAR="${2:-}"; shift 2` looks safe but is not: with one positional left, `shift 2` fails, and under `set -euo pipefail` the script dies with exit 1 -- no message, no usage. Exit 1 is "Playwright reported failures" in the table above, so a caller branching on the status alone (which the table says it must be able to do) reads a typo as a test failure.
#
# $1 = flag name, $2 = the caller's remaining argument count ($#).
require_value() {
  if [ "$2" -lt 2 ]; then
    echo "e2e-run.sh: $1 requires a value" >&2
    usage >&2
    exit 2
  fi
}

# --- host-suspend heartbeat ---------------------------------------------------------

# Wall-clock time in whole milliseconds. perl is the sub-second clock macOS and Linux both carry (bash 3.2, which macOS ships, has none of its own); whole seconds from `date` keep the heartbeat beating where perl is absent.
now_ms() {
  perl -MTime::HiRes=time -e 'printf "%d\n", time * 1000' 2> /dev/null || echo "$(date +%s)000"
}

# An epoch-milliseconds value as a UTC stamp, through whichever of the BSD and GNU `date` forms this host has.
utc_of_ms() {
  local seconds=$(($1 / 1000))
  date -u -r "$seconds" +%FT%TZ 2> /dev/null || date -u -d "@$seconds" +%FT%TZ
}

# True while process $1 is running. A child that has exited but is not yet reaped still answers `kill -0`, so the state is read from ps.
is_running() {
  case "$(ps -o stat= -p "$1" 2> /dev/null)" in
    '' | Z*) return 1 ;;
    *) return 0 ;;
  esac
}

# How far beyond one interval the wall clock has moved since the last beat.
heartbeat_measure() {
  HB_NOW_MS="$(now_ms)"
  HB_LATE_MS=$((HB_NOW_MS - HB_LAST_MS - HEARTBEAT_INTERVAL_S * 1000))
}

# Ends the run as void when the last measurement reaches the threshold: the marker first, written whole, then the signal. The owner's teardown decides on the marker, so a signal that arrives late or not at all changes nothing.
heartbeat_void_if_late() {
  if [ "$HB_LATE_MS" -lt "$SUSPEND_THRESHOLD_MS" ]; then
    return 0
  fi
  {
    echo "VOID -- the host was suspended during this run."
    echo "The run is evidence about the tree in neither direction. Do not diagnose it: make the run again under a new run directory."
    echo "last_beat_before_gap_utc=$(utc_of_ms "$HB_LAST_MS")"
    echo "first_beat_after_gap_utc=$(utc_of_ms "$HB_NOW_MS")"
    echo "gap_ms=$HB_LATE_MS"
    echo "heartbeat_interval_s=$HEARTBEAT_INTERVAL_S"
    echo "suspend_threshold_ms=$SUSPEND_THRESHOLD_MS"
  } > "$HB_DIR/.void-marker.tmp"
  mv -f "$HB_DIR/.void-marker.tmp" "$HB_DIR/$VOID_MARKER"
  kill -USR1 "$HB_OWNER" 2> /dev/null
  exit 0
}

# SIGTERM is how the owner stops the heartbeat. It takes one last measurement first, because a gap that opened after the last full beat is otherwise never compared: a run that ends within one interval of a wake would keep the status Playwright gave it.
heartbeat_stop() {
  kill "$HB_SLEEPER" 2> /dev/null
  heartbeat_measure
  heartbeat_void_if_late
  exit 0
}

# The heartbeat loop. Run it in a background subshell: `( suspend_heartbeat <owner pid> <directory> ) &`.
#
# $1 = the process that is signalled with SIGUSR1 on a suspend, and whose death ends the loop, so a wrapper that was killed outright leaves no heartbeat behind.
# $2 = the directory the marker and the lateness log are written into.
#
# The sleep runs in the background and is waited for, so that SIGTERM interrupts the wait at once instead of being held until the sleep returns.
suspend_heartbeat() {
  set +e
  HB_OWNER="$1"
  HB_DIR="$2"
  HB_SLEEPER=""
  HB_LAST_MS="$(now_ms)"
  trap heartbeat_stop TERM
  while kill -0 "$HB_OWNER" 2> /dev/null; do
    sleep "$HEARTBEAT_INTERVAL_S" &
    HB_SLEEPER=$!
    wait "$HB_SLEEPER"
    heartbeat_measure
    echo "$HB_NOW_MS $HB_LATE_MS" >> "$HB_DIR/$HEARTBEAT_LOG"
    heartbeat_void_if_late
    HB_LAST_MS="$HB_NOW_MS"
  done
}

# --- the key server's address ------------------------------------------------------------

# Defined before the self-test, which exercises the bind decision.

# What `host.docker.internal` resolves to inside the stack's edge-runtime container, as `getent hosts host.docker.internal` prints it there: the address first.
edge_bridge_lookup() {
  docker exec "$EDGE_CONTAINER" getent hosts host.docker.internal 2> /dev/null
}

# True when $1 is one IPv4 or IPv6 address that names an interface: not empty, nothing but address characters, and not the unspecified address, all of whose digits are zero and on which a server listens on every interface.
is_interface_address() {
  case "$1" in
    '' | *[!0-9A-Fa-f.:]*) return 1 ;;
    *[1-9A-Fa-f]*) return 0 ;;
    *) return 1 ;;
  esac
}

# Prints the address the key server binds to, IDP_JWKS_BIND: 127.0.0.1 on macOS; on Linux, the first field of what `host.docker.internal` resolves to inside the edge-runtime container. Fails, printing nothing, when that answer is no interface address, or on any other kernel, so that the server is never bound to every interface.
# $1 is the kernel name (default `uname -s`) and $2 the command that prints the lookup (default edge_bridge_lookup); the self-test passes both.
idp_jwks_bind_address() {
  local kernel="${1:-$(uname -s)}" lookup="${2:-edge_bridge_lookup}" address=""
  case "$kernel" in
    Darwin) address=127.0.0.1 ;;
    Linux) address="$("$lookup" | awk 'NR == 1 { print $1 }')" || address="" ;;
  esac
  is_interface_address "$address" || return 1
  printf '%s' "$address"
}

# The host of a URL for the address $1: an IPv6 address in brackets.
url_host() {
  case "$1" in
    *:*) printf '[%s]' "$1" ;;
    *) printf '%s' "$1" ;;
  esac
}

# The status line the key server answers to the edge runtime: from inside the edge-runtime container, bash's /dev/tcp opens host.docker.internal on IDP_JWKS_PORT and asks for /jwks, within 10 s. HTTP/1.1, so that the server keeps the connection open and the probe closes it first, as the edge runtime's own fetch does (see the server's note on TIME_WAIT). Empty when nothing answers.
edge_jwks_probe() {
  docker exec "$EDGE_CONTAINER" timeout 10 bash -c 'exec 3<> "/dev/tcp/host.docker.internal/$1" && printf "GET /jwks HTTP/1.1\r\nHost: host.docker.internal\r\n\r\n" >&3 && head -n 1 <&3' probe "$IDP_JWKS_PORT" 2> /dev/null | tr -d '\r' || true
}

# --- the mock issuer's stop -----------------------------------------------------------------

# Stops this checkout's mock issuer while it still listens on port $1 (MOCK_OIDC_PORT by default): each listener whose command line holds MOCK_ISSUER_ENTRY is sent SIGTERM with its process group, as stop_group stops the wrapper's own jobs, and SIGKILL after 30 s. A listener whose command line does not hold it belongs to someone else and is left alone. Prints one line for each listener, or one saying there is none.
stop_own_mock_issuer() {
  local port="${1:-$MOCK_OIDC_PORT}" holders pid command pgid own_pgid target waited
  holders="$(lsof -nP -tiTCP:"$port" -sTCP:LISTEN 2> /dev/null)" || holders=""
  if [ -z "$holders" ]; then
    echo "mock issuer: no listener on port $port"
    return 0
  fi
  own_pgid="$(ps -o pgid= -p "$$" 2> /dev/null | tr -d ' ')" || own_pgid=""
  for pid in $holders; do
    command="$(ps -o command= -p "$pid" 2> /dev/null)" || command=""
    case "$command" in
      *"$MOCK_ISSUER_ENTRY"*) ;;
      *)
        echo "mock issuer: foreign listener left (pid $pid)"
        continue
        ;;
    esac
    pgid="$(ps -o pgid= -p "$pid" 2> /dev/null | tr -d ' ')" || pgid=""
    # The group is signalled only when it is not the wrapper's own.
    if [ -n "$pgid" ] && [ "$pgid" != "$own_pgid" ]; then target="-$pgid"; else target="$pid"; fi
    kill -TERM -- "$target" 2> /dev/null || kill -TERM "$pid" 2> /dev/null
    waited=0
    while is_running "$pid" && [ "$waited" -lt 30 ]; do
      sleep 1
      waited=$((waited + 1))
    done
    if is_running "$pid"; then kill -KILL -- "$target" 2> /dev/null || kill -KILL "$pid" 2> /dev/null; fi
    echo "mock issuer: stopped $pid"
  done
  return 0
}

# --- heartbeat self-test --------------------------------------------------------------

ST_SIGNALS=0
ST_FAILED=0
ST_CASES=0
ST_PIDS=""
ST_SCRATCH=""
ST_HB=""
ST_DIR=""

st_case() {
  # $1 = pass | FAIL, $2 = the case, $3 = what was observed
  ST_CASES=$((ST_CASES + 1))
  if [ "$1" != pass ]; then
    ST_FAILED=$((ST_FAILED + 1))
  fi
  echo "self-test: $1  $2: $3"
}

st_start() {
  # $1 = case directory name. Starts one heartbeat owned by this shell.
  ST_DIR="$ST_SCRATCH/$1"
  mkdir -p "$ST_DIR"
  ST_SIGNALS=0
  (suspend_heartbeat "$$" "$ST_DIR") &
  ST_HB=$!
  ST_PIDS="$ST_PIDS $ST_HB"
}

st_marker() {
  if [ -f "$ST_DIR/$VOID_MARKER" ]; then echo present; else echo absent; fi
}

st_max_late() {
  LC_ALL=C awk 'BEGIN { max = "none" } { if (max == "none" || $2 > max) max = $2 } END { print max }' "$ST_DIR/$HEARTBEAT_LOG" 2> /dev/null
}

st_cleanup() {
  local status=$?
  set +e
  # shellcheck disable=SC2086 # a list of pids, split on purpose
  kill -KILL $ST_PIDS 2> /dev/null
  # The scratch directory holds one directory per case and, in each, only the files a heartbeat writes. They are removed by name and the directories with rmdir, so nothing is ever deleted recursively.
  local dir
  if [ -n "$ST_SCRATCH" ] && [ -d "$ST_SCRATCH" ]; then
    for dir in "$ST_SCRATCH"/*/; do
      [ -d "$dir" ] || continue
      rm -f "$dir$HEARTBEAT_LOG" "$dir$VOID_MARKER" "$dir.void-marker.tmp" "${dir}own.port" "${dir}foreign.port"
      rmdir "$dir"
    done
    rmdir "$ST_SCRATCH"
  fi
  exit "$status"
}

self_test() {
  set +e
  local awake_s busy hold_short_s hold_long_s settle_s i loops beats waited gap children child alive kernel bind s
  local own_pid own_port foreign_pid foreign_port own_report foreign_report
  awake_s="${HEARTBEAT_SELF_TEST_AWAKE_S:-15}"
  busy="${HEARTBEAT_SELF_TEST_BUSY_LOOPS:-$(getconf _NPROCESSORS_ONLN 2> /dev/null || echo 4)}"
  for i in "$awake_s" "$busy"; do
    case "$i" in
      '' | *[!0-9]*)
        echo "e2e-run.sh: HEARTBEAT_SELF_TEST_AWAKE_S and HEARTBEAT_SELF_TEST_BUSY_LOOPS must be whole numbers" >&2
        exit 2
        ;;
    esac
  done
  # Whole seconds throughout. A hold delays one beat by at most its own length, so a hold one second short of the threshold stays below it whatever the phase of the beat; a hold of threshold + interval + 1 s delays a beat by more than the threshold whatever the phase.
  hold_short_s=$((SUSPEND_THRESHOLD_MS / 1000 - 1))
  if [ "$hold_short_s" -lt 1 ]; then hold_short_s=1; fi
  hold_long_s=$(((SUSPEND_THRESHOLD_MS + 999) / 1000 + HEARTBEAT_INTERVAL_S + 1))
  settle_s=$((HEARTBEAT_INTERVAL_S + 1))

  ST_SCRATCH="$(mktemp -d "${TMPDIR:-/tmp}/e2e-run-self-test.XXXXXX")" || exit 1
  trap st_cleanup EXIT
  trap 'exit 130' INT TERM
  trap 'ST_SIGNALS=$((ST_SIGNALS + 1))' USR1
  echo "self-test: interval ${HEARTBEAT_INTERVAL_S} s, threshold ${SUSPEND_THRESHOLD_MS} ms; loaded leg ${awake_s} s with ${busy} busy loop(s)"

  # 1. Awake under CPU load: no marker, no signal, and the loop kept beating.
  st_start awake-loaded
  loops=""
  i=0
  while [ "$i" -lt "$busy" ]; do
    (
      trap 'exit 0' TERM
      while :; do :; done
    ) &
    loops="$loops $!"
    i=$((i + 1))
  done
  ST_PIDS="$ST_PIDS$loops"
  sleep "$awake_s"
  # shellcheck disable=SC2086 # a list of pids, split on purpose
  kill -TERM $loops 2> /dev/null
  # shellcheck disable=SC2086
  wait $loops 2> /dev/null
  kill -TERM "$ST_HB" 2> /dev/null
  wait "$ST_HB" 2> /dev/null
  beats="$(wc -l < "$ST_DIR/$HEARTBEAT_LOG" 2> /dev/null | tr -d ' ')"
  echo "self-test: wake-up lateness under load, ms beyond the interval: $(sort -n -k2,2 "$ST_DIR/$HEARTBEAT_LOG" 2> /dev/null | LC_ALL=C awk '
    { v[NR] = $2 }
    END {
      if (NR == 0) { print "no beat recorded"; exit }
      p95 = int(NR * 0.95); if (p95 < NR * 0.95) p95 += 1
      p99 = int(NR * 0.99); if (p99 < NR * 0.99) p99 += 1
      printf "%d beat(s), min %d, median %d, p95 %d, p99 %d, max %d", NR, v[1], v[int((NR + 1) / 2)], v[p95], v[p99], v[NR]
    }')"
  if [ "$(st_marker)" = absent ] && [ "$ST_SIGNALS" = 0 ] && [ "${beats:-0}" -ge 1 ]; then
    st_case pass "awake under load for ${awake_s} s" "no marker, no signal, ${beats} beat(s), largest lateness $(st_max_late) ms"
  else
    st_case FAIL "awake under load for ${awake_s} s" "marker $(st_marker), signals $ST_SIGNALS, ${beats:-0} beat(s), largest lateness $(st_max_late) ms"
  fi

  # 2. Held for less than the threshold: still silent.
  st_start held-short
  sleep "$settle_s"
  kill -STOP "$ST_HB"
  sleep "$hold_short_s"
  kill -CONT "$ST_HB"
  sleep "$settle_s"
  if [ "$(st_marker)" = absent ] && [ "$ST_SIGNALS" = 0 ]; then
    st_case pass "held with SIGSTOP for ${hold_short_s} s, below the threshold" "no marker, no signal, largest lateness $(st_max_late) ms"
  else
    st_case FAIL "held with SIGSTOP for ${hold_short_s} s, below the threshold" "marker $(st_marker), signals $ST_SIGNALS, largest lateness $(st_max_late) ms"
  fi
  kill -TERM "$ST_HB" 2> /dev/null
  wait "$ST_HB" 2> /dev/null

  # 3. Held for longer than the threshold, which is what a suspend looks like from inside: the marker, one signal, and the loop ends itself.
  st_start held-long
  sleep "$settle_s"
  kill -STOP "$ST_HB"
  sleep "$hold_long_s"
  kill -CONT "$ST_HB"
  waited=0
  while [ "$(st_marker)" = absent ] && [ "$waited" -lt $((settle_s + 2)) ]; do
    sleep 1
    waited=$((waited + 1))
  done
  sleep 1
  gap="$(sed -n 's/^gap_ms=//p' "$ST_DIR/$VOID_MARKER" 2> /dev/null)"
  if [ "$(st_marker)" = present ] && [ "$ST_SIGNALS" = 1 ] && [ "${gap:-0}" -ge "$SUSPEND_THRESHOLD_MS" ] && ! is_running "$ST_HB"; then
    st_case pass "held with SIGSTOP for ${hold_long_s} s, above the threshold" "marker written with gap_ms=${gap}, one signal, the loop ended itself"
  else
    st_case FAIL "held with SIGSTOP for ${hold_long_s} s, above the threshold" "marker $(st_marker), gap_ms=${gap:-none}, signals $ST_SIGNALS, loop $(is_running "$ST_HB" && echo still running || echo ended)"
  fi
  kill -KILL "$ST_HB" 2> /dev/null
  wait "$ST_HB" 2> /dev/null

  # 4. Stopped by its owner: the loop and the sleep it was waiting for are both gone, and nothing is reported.
  st_start stopped
  sleep 1
  children="$(pgrep -P "$ST_HB" 2> /dev/null | tr '\n' ' ')"
  kill -TERM "$ST_HB" 2> /dev/null
  wait "$ST_HB" 2> /dev/null
  sleep 1
  alive=""
  for child in $children; do
    if is_running "$child"; then alive="$alive $child"; fi
  done
  if [ -n "$children" ] && [ -z "$alive" ] && ! is_running "$ST_HB" && [ "$(st_marker)" = absent ] && [ "$ST_SIGNALS" = 0 ]; then
    st_case pass "stopped by its owner mid-interval" "the loop and its sleep (pid ${children% }) are gone, no marker, no signal"
  else
    st_case FAIL "stopped by its owner mid-interval" "children '${children% }', still running '${alive# }', marker $(st_marker), signals $ST_SIGNALS"
  fi

  # 5. Held for longer than the threshold and stopped by its owner before its next beat: the last measurement still reports the gap.
  st_start held-then-stopped
  sleep "$settle_s"
  kill -STOP "$ST_HB"
  sleep "$hold_long_s"
  kill -TERM "$ST_HB"
  kill -CONT "$ST_HB"
  wait "$ST_HB" 2> /dev/null
  sleep 1
  gap="$(sed -n 's/^gap_ms=//p' "$ST_DIR/$VOID_MARKER" 2> /dev/null)"
  if [ "$(st_marker)" = present ] && [ "$ST_SIGNALS" = 1 ] && [ "${gap:-0}" -ge "$SUSPEND_THRESHOLD_MS" ]; then
    st_case pass "held for ${hold_long_s} s, then stopped by its owner before the next beat" "marker written with gap_ms=${gap}, one signal"
  else
    st_case FAIL "held for ${hold_long_s} s, then stopped by its owner before the next beat" "marker $(st_marker), gap_ms=${gap:-none}, signals $ST_SIGNALS"
  fi

  # 6. The key server's bind address on macOS: the loopback, decided on this host when it is one, where Docker Desktop forwards `host.docker.internal` to it.
  kernel="$(uname -s)"
  if [ "$kernel" = Darwin ]; then
    bind="$(idp_jwks_bind_address)"
  else
    bind="$(idp_jwks_bind_address Darwin)"
  fi
  s=$?
  if [ "$s" = 0 ] && [ "$bind" = 127.0.0.1 ]; then
    st_case pass "the key server's bind address on macOS (this host: $kernel)" "127.0.0.1"
  else
    st_case FAIL "the key server's bind address on macOS (this host: $kernel)" "status $s, address '${bind}'"
  fi

  # 7. On Linux, the address `host.docker.internal` resolves to inside the edge-runtime container, its first field.
  st_lookup_bridge() { printf '172.17.0.1      host.docker.internal\n'; }
  bind="$(idp_jwks_bind_address Linux st_lookup_bridge)"
  s=$?
  if [ "$s" = 0 ] && [ "$bind" = 172.17.0.1 ]; then
    st_case pass "the key server's bind address on Linux" "the address the lookup answers, 172.17.0.1"
  else
    st_case FAIL "the key server's bind address on Linux" "status $s, address '${bind}'"
  fi

  # 8. On Linux, a lookup that answers no address refuses with status 1, rather than binding to every interface.
  st_lookup_none() { return 2; }
  bind="$(idp_jwks_bind_address Linux st_lookup_none)"
  s=$?
  if [ "$s" = 1 ] && [ -z "$bind" ]; then
    st_case pass "the key server's bind address on Linux, with no address for host.docker.internal" "refused (status $s), no address"
  else
    st_case FAIL "the key server's bind address on Linux, with no address for host.docker.internal" "status $s, address '${bind}'"
  fi

  # 9. On Linux, a lookup that answers the unspecified address refuses with status 1 too: it would listen on every interface.
  st_lookup_unspecified() { printf '%s.%s.%s.%s host.docker.internal\n' 0 0 0 0; }
  bind="$(idp_jwks_bind_address Linux st_lookup_unspecified)"
  s=$?
  if [ "$s" = 1 ] && [ -z "$bind" ]; then
    st_case pass "the key server's bind address on Linux, with the unspecified address for host.docker.internal" "refused (status $s), no address"
  else
    st_case FAIL "the key server's bind address on Linux, with the unspecified address for host.docker.internal" "status $s, address '${bind}'"
  fi

  # 10. The mock issuer's stop: a listener whose command line holds this checkout's issuer entry is stopped; one whose command line does not is left running, and then stopped here. Each listens on a scratch port, given to the stop as its parameter.
  ST_DIR="$ST_SCRATCH/issuer-stop"
  mkdir -p "$ST_DIR"
  set -m
  python3 -c '
import socket, sys, time
server = socket.socket()
server.bind(("127.0.0.1", 0))
server.listen()
with open(sys.argv[1], "w") as port:
    port.write(str(server.getsockname()[1]))
time.sleep(600)
' "$ST_DIR/own.port" "$MOCK_ISSUER_ENTRY" < /dev/null > /dev/null 2>&1 &
  own_pid=$!
  python3 -c '
import socket, sys, time
server = socket.socket()
server.bind(("127.0.0.1", 0))
server.listen()
with open(sys.argv[1], "w") as port:
    port.write(str(server.getsockname()[1]))
time.sleep(600)
' "$ST_DIR/foreign.port" "$TESTS_DIR/tests/support/anotherEntry.ts" < /dev/null > /dev/null 2>&1 &
  foreign_pid=$!
  set +m
  ST_PIDS="$ST_PIDS $own_pid $foreign_pid"
  waited=0
  while { [ ! -s "$ST_DIR/own.port" ] || [ ! -s "$ST_DIR/foreign.port" ]; } && [ "$waited" -lt 20 ]; do
    sleep 1
    waited=$((waited + 1))
  done
  own_port="$(cat "$ST_DIR/own.port" 2> /dev/null)"
  foreign_port="$(cat "$ST_DIR/foreign.port" 2> /dev/null)"
  own_report="$(stop_own_mock_issuer "$own_port")"
  foreign_report="$(stop_own_mock_issuer "$foreign_port")"
  sleep 1
  if [ -n "$own_port" ] && [ -n "$foreign_port" ] && ! is_running "$own_pid" && is_running "$foreign_pid" &&
    [ "$own_report" = "mock issuer: stopped $own_pid" ] && [ "$foreign_report" = "mock issuer: foreign listener left (pid $foreign_pid)" ]; then
    st_case pass "the mock issuer's stop, matched by command line" "this checkout's listener stopped, a foreign one on another port left running"
  else
    st_case FAIL "the mock issuer's stop, matched by command line" "ports '${own_port}' '${foreign_port}'; own $(is_running "$own_pid" && echo still running || echo ended), foreign $(is_running "$foreign_pid" && echo running || echo ended); reports '${own_report}' / '${foreign_report}'"
  fi
  kill -TERM "$own_pid" "$foreign_pid" 2> /dev/null
  wait "$own_pid" "$foreign_pid" 2> /dev/null

  if [ "$ST_FAILED" = 0 ]; then
    echo "e2e-run.sh: self-test passed: $ST_CASES case(s)." >&2
    exit 0
  fi
  echo "e2e-run.sh: self-test FAILED: $ST_FAILED of $ST_CASES case(s)." >&2
  exit 1
}

# --- argument parsing -------------------------------------------------------------

while [ $# -gt 0 ]; do
  case "$1" in
    --run-dir)
      require_value --run-dir $#
      RUN_DIR="$2"
      shift 2
      ;;
    --project)
      require_value --project $#
      PROJECT="$2"
      shift 2
      ;;
    --no-db-reset)
      # Boolean: no require_value call, one shift.
      DB_RESET=false
      shift
      ;;
    --no-watch)
      WATCH=false
      shift
      ;;
    --self-test)
      SELF_TEST=true
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      echo "e2e-run.sh: unknown argument '$1'" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [ "$SELF_TEST" = true ]; then
  if [ -n "$RUN_DIR" ] || [ -n "$PROJECT" ] || [ "$DB_RESET" != true ] || [ "$WATCH" != true ]; then
    echo "e2e-run.sh: --self-test takes no other argument" >&2
    exit 2
  fi
  self_test
fi

if [ -z "$RUN_DIR" ]; then
  echo "e2e-run.sh: --run-dir is required" >&2
  exit 2
fi

# Resolve a relative --run-dir against the REPO ROOT (not $PWD) so the script is cwd-independent for relative and absolute paths alike.
case "$RUN_DIR" in
  /*) : ;;
  *) RUN_DIR="$REPO_ROOT/$RUN_DIR" ;;
esac

mkdir -p "$RUN_DIR"

# --- preflight literal drift guard ---------------------------------------------------

# Both greps below are only as good as the strings they look for. Bind them to the source of truth HERE, loudly, rather than through a comment: a rename in preflight.ts with a stale copy here would otherwise agree on "0 preflight failures" forever, which is precisely the false confirmation this wrapper exists to prevent.
PREFLIGHT_SRC="$TESTS_DIR/tests/support/preflight.ts"
for literal in "$PREFLIGHT_HEADLINE" "$PREFLIGHT_OK_HEADLINE"; do
  if ! grep -qF "$literal" "$PREFLIGHT_SRC" 2> /dev/null; then
    echo "e2e-run.sh: FATAL -- the literal '$literal' is not present in $PREFLIGHT_SRC." >&2
    echo "            This wrapper's preflight verdict is derived by grepping for it, so it" >&2
    echo "            would silently report a confirmed run. Re-sync the constants." >&2
    exit 7
  fi
done

# --- identity provider environment ------------------------------------------------------

# True while a process listens on TCP port $1.
port_held() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN > /dev/null 2>&1
}

# The HTTP status of an OPTIONS request to the function $1, or 000 when nothing answers.
function_options_status() {
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 -X OPTIONS "$SUPABASE_URL/functions/v1/$1" 2> /dev/null)" || true
  printf '%s' "${code:-000}"
}

# True when an HTTP status is below 500 and something answered.
answered_below_500() {
  case "$1" in
    2?? | 3?? | 4??) return 0 ;;
    *) return 1 ;;
  esac
}

# The functions of the tree: every directory under the functions directory that holds an index.ts.
function_names() {
  local d
  for d in "$FUNCTIONS_DIR"/*/; do
    if [ -f "${d}index.ts" ]; then basename "$d"; fi
  done
  return 0
}

# The name of the stack's edge-runtime container, from the project id in config.toml; empty when it cannot be read.
edge_container_name() {
  local id
  id="$(sed -n 's/^project_id = "\([^"]*\)"$/\1/p' "$REPO_ROOT/apps/supabase/supabase/config.toml" 2> /dev/null | head -n 1)" || true
  if [ -n "$id" ]; then printf 'supabase_edge_runtime_%s' "$id"; fi
}

# The issuer the edge-runtime container carries: that one variable, read by name, and nothing else of its environment.
edge_issuer() {
  docker exec "$EDGE_CONTAINER" printenv IDENTITY_PROVIDER_ISSUER 2> /dev/null | head -n 1 || true
}

# Stops a job started under `set -m`, whose pid is also its process-group id: SIGTERM to the group, then SIGKILL after 30 s.
stop_group() {
  local pid="$1" waited=0
  [ -n "$pid" ] || return 0
  kill -TERM -"$pid" 2> /dev/null || kill -TERM "$pid" 2> /dev/null
  while is_running "$pid" && [ "$waited" -lt 30 ]; do
    sleep 1
    waited=$((waited + 1))
  done
  if is_running "$pid"; then kill -KILL -"$pid" 2> /dev/null || kill -KILL "$pid" 2> /dev/null; fi
  wait "$pid" 2> /dev/null
  return 0
}

# Ends the run with status 9: the identity provider's environment could not be prepared. The teardown stops what was started and restores the stack.
idp_fail() {
  echo "e2e-run.sh: FATAL -- the identity provider's environment could not be prepared: $*" >&2
  echo "prepare: FAILED -- $*" >> "$RUN_DIR/idp-env.txt"
  exit 9
}

# Writes the Edge file, the dev server's environment and the JWKS document into $IDP_DIR, from the committed test keys and the mock issuer's constants. Prints nothing of what it writes.
generate_identity_provider_files() {
  (
    cd "$REPO_ROOT" &&
      IDP_OUT="$IDP_DIR" IDP_PROJECT_ID="$E2E_PROJECT_ID_RESOLVED" IDP_SITE_URL="http://127.0.0.1:$FRONTEND_PORT" \
        IDP_JWKS_URI="http://host.docker.internal:$IDP_JWKS_PORT/jwks" npx --no-install tsx -e '
import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { decryptionJwks, sigPrivJwk, sigPubJwk } from "./tests/tests/utils/testKeys";
import { MOCK_AUDIENCE, MOCK_ISSUER } from "./tests/tests/support/mockOidcIssuer";
const out = process.env.IDP_OUT;
const template = readFileSync("apps/supabase/supabase/functions/.env.example", "utf8").split("\n");
const fromTemplate = (name) => {
  const line = template.find((l) => l.startsWith(name + "="));
  if (!line || line.trim().length === name.length + 1) throw new Error("the tracked functions template sets no " + name);
  return line.trim();
};
const shellQuoted = (value) => "\x27" + value.replace(/\x27/g, "\x27\\\x27\x27") + "\x27";
const serverSecret = randomBytes(32).toString("hex");
writeFileSync(
  join(out, "edge.env"),
  [
    "IDENTITY_PROVIDER_TYPE=idura-ftn",
    "IDENTITY_PROVIDER_DECRYPTION_JWKS=" + JSON.stringify(decryptionJwks),
    "IDENTITY_PROVIDER_JWKS_URI=" + process.env.IDP_JWKS_URI,
    "IDENTITY_PROVIDER_CLIENT_ID=" + MOCK_AUDIENCE,
    "IDENTITY_PROVIDER_ISSUER=" + MOCK_ISSUER,
    "IDENTITY_CALLBACK_SERVER_SECRET=" + serverSecret,
    "PUBLIC_PROJECT_ID=" + process.env.IDP_PROJECT_ID,
    "SITE_URL=" + process.env.IDP_SITE_URL,
    fromTemplate("SMTP_HOST"),
    fromTemplate("SMTP_PORT"),
    fromTemplate("SMTP_FROM")
  ].join("\n") + "\n",
  { mode: 0o600 }
);
const frontend = {
  PUBLIC_IDENTITY_PROVIDER_TYPE: "idura-ftn",
  IDURA_DOMAIN: new URL(MOCK_ISSUER).host,
  IDURA_SIGNING_JWKS: JSON.stringify([sigPrivJwk]),
  IDURA_SIGNING_KEY_KID: String(sigPrivJwk.kid),
  IDENTITY_PROVIDER_DECRYPTION_JWKS: JSON.stringify(decryptionJwks),
  IDENTITY_PROVIDER_JWKS_URI: MOCK_ISSUER + "/.well-known/openid-configuration/jwks",
  IDENTITY_PROVIDER_ISSUER: MOCK_ISSUER,
  PUBLIC_IDENTITY_PROVIDER_CLIENT_ID: MOCK_AUDIENCE,
  IDENTITY_CALLBACK_SERVER_SECRET: serverSecret
};
writeFileSync(
  join(out, "frontend.env"),
  Object.entries(frontend).map(([name, value]) => "export " + name + "=" + shellQuoted(value)).join("\n") + "\n",
  { mode: 0o600 }
);
writeFileSync(join(out, "playwright.env"), "export IDENTITY_CALLBACK_SERVER_SECRET=" + shellQuoted(serverSecret) + "\n", {
  mode: 0o600
});
writeFileSync(join(out, "expected-issuer"), MOCK_ISSUER + "\n");
mkdirSync(join(out, "jwks"));
writeFileSync(join(out, "jwks", "jwks"), JSON.stringify({ keys: [sigPubJwk] }));
'
  )
}

# Step 5b: prepare the environment, serve the JWKS document and `identity-callback`, and wait until the edge runtime carries the generated issuer.
prepare_identity_provider() {
  local p f expected observed code waited holders probe
  for p in "$IDP_JWKS_PORT" "$MOCK_OIDC_PORT"; do
    if port_held "$p"; then
      holders="$(lsof -nP -tiTCP:"$p" -sTCP:LISTEN 2> /dev/null | tr '\n' ' ')" || true
      idp_fail "port $p already has a listener (pids: ${holders% })"
    fi
  done
  if [ ! -f "$MOCK_CERT" ]; then idp_fail "the mock issuer's certificate $MOCK_CERT is missing"; fi
  if ! command -v python3 > /dev/null 2>&1; then idp_fail "python3 is not on the PATH; it serves the JWKS document"; fi
  EDGE_CONTAINER="$(edge_container_name)"
  if [ -z "$EDGE_CONTAINER" ]; then idp_fail "the project id could not be read from apps/supabase/supabase/config.toml"; fi
  echo "edge_container=$EDGE_CONTAINER" >> "$RUN_DIR/idp-env.txt"

  IDP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/e2e-run-idp.XXXXXX")" || idp_fail "no temporary directory could be made"
  case "$IDP_DIR" in
    "$REPO_ROOT" | "$REPO_ROOT"/*) idp_fail "the temporary directory is inside the repository" ;;
  esac
  chmod 700 "$IDP_DIR"
  if ! generate_identity_provider_files; then idp_fail "the files could not be generated from the committed test keys"; fi
  for f in edge.env frontend.env playwright.env expected-issuer jwks/jwks; do
    if [ ! -s "$IDP_DIR/$f" ]; then idp_fail "the generated file $f is missing or empty"; fi
  done
  expected="$(tr -d '\n' < "$IDP_DIR/expected-issuer")"
  case "$expected" in
    *":$MOCK_OIDC_PORT") ;;
    *) idp_fail "the mock issuer's issuer does not name port $MOCK_OIDC_PORT" ;;
  esac

  if ! IDP_JWKS_BIND="$(idp_jwks_bind_address)"; then
    IDP_JWKS_BIND=""
    idp_fail "the JWKS server has no address to bind to: on $(uname -s), host.docker.internal resolves to no interface address inside $EDGE_CONTAINER (getent hosts host.docker.internal), and the server is never bound to every interface"
  fi
  echo "jwks_bind=$IDP_JWKS_BIND" >> "$RUN_DIR/idp-env.txt"

  echo "e2e-run.sh: serving the JWKS document on $IDP_JWKS_BIND port $IDP_JWKS_PORT ..."
  set -m
  # A threaded static server bound to the one address given, as `python3 -m http.server --bind` is, but speaking HTTP/1.1 with keep-alive, so the edge runtime pools its connection and closes it itself.
  # When the server closes first, Docker Desktop's network stack holds that connection's TIME_WAIT for about a minute and silently drops a new connection that reuses its port, and the JWKS fetch in identity-callback times out.
  python3 -c '
import argparse, functools, http.server, socket
arguments = argparse.ArgumentParser()
arguments.add_argument("--bind", required=True)
arguments.add_argument("port", type=int)
arguments.add_argument("directory")
options = arguments.parse_args()
class Handler(http.server.SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
class Server(http.server.ThreadingHTTPServer):
    address_family = socket.AF_INET6 if ":" in options.bind else socket.AF_INET
Server((options.bind, options.port), functools.partial(Handler, directory=options.directory)).serve_forever()
' --bind "$IDP_JWKS_BIND" "$IDP_JWKS_PORT" "$IDP_DIR/jwks" > "$RUN_DIR/idp-jwks-server.log" 2>&1 < /dev/null &
  IDP_JWKS_PID=$!
  set +m
  waited=0
  while :; do
    code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "http://$(url_host "$IDP_JWKS_BIND"):$IDP_JWKS_PORT/jwks" 2> /dev/null)" || true
    if [ "$code" = 200 ]; then break; fi
    if ! is_running "$IDP_JWKS_PID"; then idp_fail "the JWKS server exited before answering; see $RUN_DIR/idp-jwks-server.log"; fi
    if [ "$waited" -ge 30 ]; then idp_fail "the JWKS server did not answer 200 within 30 s (last status ${code:-none})"; fi
    sleep 1
    waited=$((waited + 1))
  done
  echo "jwks_server=http://$(url_host "$IDP_JWKS_BIND"):$IDP_JWKS_PORT/jwks answered 200" >> "$RUN_DIR/idp-env.txt"
  echo "e2e-run.sh: key server bound to $IDP_JWKS_BIND"

  echo "e2e-run.sh: serving identity-callback with the generated Edge file ..."
  # From here on the shared stack's edge runtime is being replaced: every exit restores it.
  IDP_STARTED=true
  set -m
  (
    cd "$REPO_ROOT/apps/supabase/supabase" &&
      exec npx --no-install supabase functions serve identity-callback --no-verify-jwt --env-file "$IDP_DIR/edge.env"
  ) > "$RUN_DIR/idp-functions.log" 2>&1 < /dev/null &
  IDP_FN_PID=$!
  set +m
  # The default container answers OPTIONS until it is replaced, so readiness is the generated issuer read back from the container, not the status alone.
  waited=0
  while :; do
    if ! is_running "$IDP_FN_PID"; then idp_fail "the function server exited before it was ready; see $RUN_DIR/idp-functions.log"; fi
    observed="$(edge_issuer)"
    code="$(function_options_status identity-callback)"
    if [ "$observed" = "$expected" ] && answered_below_500 "$code"; then break; fi
    if [ "$waited" -ge "$IDP_READY_TIMEOUT_S" ]; then
      idp_fail "identity-callback did not carry the generated issuer and answer OPTIONS below 500 within ${IDP_READY_TIMEOUT_S} s (OPTIONS $code)"
    fi
    sleep 2
    waited=$((waited + 2))
  done
  # The edge runtime that now carries the issuer must reach the key server, or every identity-provider test fails on a JWKS fetch that times out.
  probe="$(edge_jwks_probe)"
  echo "jwks_reachable_from_edge=${probe:-none}" >> "$RUN_DIR/idp-env.txt"
  case "$probe" in
    *" 200"*) echo "e2e-run.sh: the edge runtime reached the key server: $probe" ;;
    *) idp_fail "the edge runtime did not reach the key server: the probe from inside $EDGE_CONTAINER to host.docker.internal:$IDP_JWKS_PORT/jwks answered '${probe:-nothing}', not 200" ;;
  esac
  {
    echo "IDENTITY_PROVIDER_ISSUER=$observed"
    echo "identity_callback_options=$code"
    echo "ready_after_s=$waited"
    echo "node_extra_ca_certs=${MOCK_CERT#"$REPO_ROOT"/}"
    echo "prepare: ok"
  } >> "$RUN_DIR/idp-env.txt"
  echo "e2e-run.sh: identity-callback ready after ${waited} s (OPTIONS $code, the generated issuer read back)"
}

# Removes the generated files by name and their directories with rmdir, so nothing is ever deleted recursively.
remove_identity_provider_files() {
  [ -n "$IDP_DIR" ] && [ -d "$IDP_DIR" ] || return 0
  rm -f "$IDP_DIR/edge.env" "$IDP_DIR/frontend.env" "$IDP_DIR/playwright.env" "$IDP_DIR/expected-issuer" "$IDP_DIR/jwks/jwks"
  rmdir "$IDP_DIR/jwks" 2> /dev/null
  if ! rmdir "$IDP_DIR" 2> /dev/null; then
    echo "e2e-run.sh: WARNING -- the temporary directory $IDP_DIR holds a file this wrapper did not write; it was left in place" >&2
  fi
  return 0
}

# Restores the shared stack after the function server: `yarn db:stop` then `yarn db:start`, because stopping the function server removes the edge-runtime container and `yarn db:start` alone does not bring it back. Writes every check into restore.txt; true only when every check held.
restore_stack() {
  local ok=true s started_s stop_s fn code tries names p
  {
    if [ -n "$MOCK_ISSUER_STOP_REPORT" ]; then printf '%s\n' "$MOCK_ISSUER_STOP_REPORT"; fi
    echo "restore started: $(date -u +%FT%TZ)"
    if ! cd "$REPO_ROOT"; then
      echo "cd to the repository root: FAILED"
      ok=false
    fi
    started_s=$(date +%s)
    yarn db:stop 2>&1 | node "$SCRIPT_DIR/withhold-stack-keys.mjs" > "$RUN_DIR/restore-db-stop.log"
    s=${PIPESTATUS[0]}
    stop_s=$(($(date +%s) - started_s))
    echo "yarn db:stop: exit $s after ${stop_s} s"
    [ "$s" -eq 0 ] || ok=false
    started_s=$(date +%s)
    yarn db:start 2>&1 | node "$SCRIPT_DIR/withhold-stack-keys.mjs" > "$RUN_DIR/restore-db-start.log"
    s=${PIPESTATUS[0]}
    echo "yarn db:start: exit $s after $(($(date +%s) - started_s)) s"
    [ "$s" -eq 0 ] || ok=false
    if docker ps --format '{{.Names}}' 2> /dev/null | grep -q -x "$EDGE_CONTAINER"; then
      echo "edge-runtime container $EDGE_CONTAINER: running"
    else
      echo "edge-runtime container $EDGE_CONTAINER: NOT running"
      ok=false
    fi
    names="$(function_names)"
    if [ -z "$names" ]; then
      echo "no directory with an index.ts under apps/supabase/supabase/functions/"
      ok=false
    fi
    for fn in $names; do
      tries=0
      code="$(function_options_status "$fn")"
      while ! answered_below_500 "$code" && [ "$tries" -lt 30 ]; do
        sleep 2
        tries=$((tries + 1))
        code="$(function_options_status "$fn")"
      done
      echo "OPTIONS $fn: $code"
      answered_below_500 "$code" || ok=false
    done
    for p in "$IDP_JWKS_PORT" "$MOCK_OIDC_PORT"; do
      if port_held "$p"; then
        echo "port $p: STILL HELD"
        ok=false
      else
        echo "port $p: free"
      fi
    done
    echo "restore ended: $(date -u +%FT%TZ)"
    if [ "$ok" = true ]; then echo "restore: ok"; else echo "restore: FAILED"; fi
  } > "$RUN_DIR/restore.txt" 2>&1
  sed 's/^/e2e-run.sh: restore -- /' "$RUN_DIR/restore.txt"
  [ "$ok" = true ]
}

# --- teardown ---------------------------------------------------------------------

# Deterministic teardown from a TRAP: an interrupted run must not leave a listener behind to poison the next iteration of the batch.
cleanup() {
  local status=$?
  set +e
  # From here on the marker decides, not the signal: a beat that lands during teardown must not cut the teardown short.
  trap '' USR1
  # The heartbeat first. SIGTERM makes it take one last measurement, so a suspend it has not reported yet still leaves its marker before the status is settled below.
  if [ -n "$HEARTBEAT_PID" ]; then
    kill -TERM "$HEARTBEAT_PID" 2> /dev/null
    wait "$HEARTBEAT_PID" 2> /dev/null
  fi
  # An interrupted run must NEVER report success. `$?` at trap entry is whatever the last command returned, which is routinely 0 mid-run -- so a caller looping this script would count an aborted run as a green, and a count of consecutive green runs would be silently wrong. Force the conventional 128+SIGINT status instead.
  if [ "$INTERRUPTED" = "1" ] && [ "$status" = "0" ]; then
    status=130
  fi
  # Playwright is still running only when the wait in step 7 was cut short, by an interrupt or by the heartbeat. SIGINT to its process group is what a terminal Ctrl-C delivers: Playwright closes its browsers and writes its reports. Whatever outlives the grace period is killed.
  local waited
  if [ -n "$PW_PID" ]; then
    kill -INT -"$PW_PID" 2> /dev/null
    waited=0
    while is_running "$PW_PID" && [ "$waited" -lt "$PW_STOP_GRACE_S" ]; do
      sleep 1
      waited=$((waited + 1))
    done
    kill -KILL -"$PW_PID" 2> /dev/null
    wait "$PW_PID" 2> /dev/null
    echo "$?" > "$RUN_DIR/exit"
  fi
  # tee ends by itself once every writer of the pipe is gone; it is not left behind if one is not.
  if [ -n "$TEE_PID" ]; then
    waited=0
    while is_running "$TEE_PID" && [ "$waited" -lt 5 ]; do
      sleep 1
      waited=$((waited + 1))
    done
    kill -TERM "$TEE_PID" 2> /dev/null
    wait "$TEE_PID" 2> /dev/null
  fi
  if [ -n "$PW_PIPE_DIR" ]; then
    rm -f "$PW_PIPE_DIR/stdout"
    rmdir "$PW_PIPE_DIR" 2> /dev/null
  fi
  if [ -n "$DEV_PID" ]; then
    # Kill the whole process group -- `yarn _dev:concurrent` fans out into concurrently + watch:shared + vite, and killing only the parent orphans the listener.
    kill -TERM -"$DEV_PID" 2>/dev/null || kill -TERM "$DEV_PID" 2>/dev/null
    wait "$DEV_PID" 2>/dev/null
  fi
  # Belt and braces: kill whatever still holds the port -- but ONLY processes in OUR OWN process group. The unscoped form `kill -9 $holders` would SIGKILL an operator's own `yarn dev`, or any unrelated process that happens to hold this port, on a run this wrapper did not start it for. `set -m` above puts the spawned job in its own group whose pgid equals $DEV_PID, so pgid membership is exactly "we spawned it".
  local holders pid pgid foreign
  holders="$(lsof -nP -tiTCP:"$FRONTEND_PORT" -sTCP:LISTEN 2>/dev/null || true)"
  foreign=""
  if [ -n "$holders" ] && [ -n "$DEV_PID" ]; then
    for pid in $holders; do
      pgid="$(ps -o pgid= -p "$pid" 2>/dev/null | tr -d ' ')"
      if [ "$pgid" = "$DEV_PID" ]; then
        kill -9 "$pid" 2>/dev/null
      else
        foreign="$foreign $pid"
      fi
    done
    sleep 1
  elif [ -n "$holders" ]; then
    foreign="$holders"
  fi
  if [ -n "$foreign" ]; then
    echo "e2e-run.sh: WARNING -- port $FRONTEND_PORT is held by process(es) this wrapper did" >&2
    echo "            not spawn; leaving them alone:$foreign" >&2
  fi
  holders="$(lsof -nP -tiTCP:"$FRONTEND_PORT" -sTCP:LISTEN 2>/dev/null || true)"
  if [ -n "$holders" ]; then
    echo "e2e-run.sh: WARNING -- port $FRONTEND_PORT still has a listener after teardown: $holders" >&2
  fi
  # The identity provider's servers, then the shared stack. Interrupts are ignored from here, by this shell and by the commands it starts, so that a second Ctrl-C cannot leave the stack without its edge runtime.
  if [ -n "$IDP_FN_PID" ]; then
    stop_group "$IDP_FN_PID"
    IDP_FN_PID=""
  fi
  if [ -n "$IDP_JWKS_PID" ]; then
    stop_group "$IDP_JWKS_PID"
    IDP_JWKS_PID=""
  fi
  remove_identity_provider_files
  # Playwright's `webServer` issuer outlives a Playwright the teardown stopped, and would hold its port into the next run.
  MOCK_ISSUER_STOP_REPORT="$(stop_own_mock_issuer)"
  printf '%s\n' "$MOCK_ISSUER_STOP_REPORT" | sed 's/^/e2e-run.sh: /'
  if [ "$IDP_STARTED" = true ]; then
    trap '' INT TERM
    echo "e2e-run.sh: restoring the shared stack's edge runtime: yarn db:stop, then yarn db:start ..."
    if ! restore_stack; then
      echo "e2e-run.sh: FATAL -- the shared stack was not restored; see $RUN_DIR/restore.txt" >&2
      case "$status" in
        0 | 1) status=9 ;;
      esac
    fi
  fi
  if [ -s "$RUN_DIR/$HEARTBEAT_LOG" ] && [ -f "$RUN_DIR/env-posture.txt" ]; then
    LC_ALL=C awk '{ if ($2 > max) max = $2 } END { printf "heartbeat_beats=%d\nheartbeat_max_late_ms=%d\n", NR, max }' "$RUN_DIR/$HEARTBEAT_LOG" >> "$RUN_DIR/env-posture.txt"
  fi
  # A suspended host voids the run whatever else happened to it: the status is 8 if and only if the marker exists.
  if [ -f "$RUN_DIR/$VOID_MARKER" ]; then
    status=8
    local gap_ms gap_from gap_until
    gap_ms="$(sed -n 's/^gap_ms=//p' "$RUN_DIR/$VOID_MARKER")"
    gap_from="$(sed -n 's/^last_beat_before_gap_utc=//p' "$RUN_DIR/$VOID_MARKER")"
    gap_until="$(sed -n 's/^first_beat_after_gap_utc=//p' "$RUN_DIR/$VOID_MARKER")"
    echo "e2e-run.sh: VOID -- the host did not run for about $(((gap_ms + 500) / 1000)) s between $gap_from and $gap_until." >&2
    echo "            It was suspended, so this run is evidence about the tree in neither direction:" >&2
    echo "            do not diagnose it, make it again under a new run directory." >&2
    echo "            Marker: $RUN_DIR/$VOID_MARKER" >&2
    # On a GitHub Actions runner the failed step carries the name too, so the job is not read as a red tree.
    if [ -n "${GITHUB_ACTIONS:-}" ]; then
      echo "::error title=E2E run VOID (host suspended)::The runner did not run for about $(((gap_ms + 500) / 1000)) s during the E2E run. The run is void, not a test failure: re-run the job."
    fi
  fi
  # The assertion is released last, so that it covers the teardown too.
  if [ -n "$SLEEP_ASSERTION_PID" ]; then
    kill -TERM "$SLEEP_ASSERTION_PID" 2> /dev/null
    wait "$SLEEP_ASSERTION_PID" 2> /dev/null
  fi
  echo "$status" > "$RUN_DIR/wrapper-exit"
  date -u +%FT%TZ > "$RUN_DIR/ended"
  exit "$status"
}
on_signal() {
  INTERRUPTED=1
  exit 130
}
# The heartbeat's signal. The marker is already written when it arrives; the exit runs the teardown above, which stops Playwright and settles the status. A SIGUSR1 with no marker behind it did not come from the heartbeat, and ends the run as any other interrupt does.
on_suspend() {
  if [ -f "$RUN_DIR/$VOID_MARKER" ]; then
    exit 8
  fi
  INTERRUPTED=1
  exit 130
}
trap on_signal INT TERM
trap on_suspend USR1
trap cleanup EXIT

# --- 1. neutralise the environment, and record that it was neutralised --------------

# The forcing knobs must never leak into a run used as evidence.
unset EPERM07_FORCE_BUDGET_MS EPERM07_FORCE_CPU_RATE EPERM07_NO_VT || true
# CI matters TWICE over: with it set the config buys `retries: 3` and collapses to a single worker (`retries` and `workers` in playwright.config.ts), changing both the retry posture and the contention environment the failure actually lives in. A green produced that way proves nothing, and would itself be the "retried-until-green" the cardinal rule forbids.
unset CI || true

{
  echo "# Environment posture for this run."
  echo "# Written BEFORE the run; the observed_* lines are appended from results.json AFTER it,"
  echo "# so the posture is auditable rather than asserted. The heartbeat_beats and"
  echo "# heartbeat_max_late_ms lines are appended at teardown, from heartbeat.log."
  echo "ci_env=unset"
  echo "eperm07_knobs=unset"
  echo "frontend_port=$FRONTEND_PORT"
  echo "db_reset=$DB_RESET"
  echo "package_watcher=$WATCH"
  echo "expected_retries=0"
  echo "expected_workers=6"
  echo "heartbeat_interval_s=$HEARTBEAT_INTERVAL_S"
  echo "suspend_threshold_ms=$SUSPEND_THRESHOLD_MS"
  # Machine capacity at run start. Recorded, never enforced: a run is not refused for a busy machine, but an outlier can then be attributed from the run directory instead of reconstructed from outside it. A run with identical code, worker count and dev-server log signatures can still take 1069s against a 627-651s baseline when the machine is loaded.
  # Separators first, decimals second: Linux prints `load average: 1.20, 1.30, 1.40`, so the `, ` separators become spaces before any remaining comma -- a decimal comma under a comma-decimal locale, as macOS prints `1,20 1,30 1,40` -- is turned into a point. Translating every comma blindly left Linux values with trailing dots.
  echo "load_at_start=$(uptime | sed 's/.*load averages*:[[:space:]]*//' | sed -E 's/,[[:space:]]+/ /g' | tr -s ' ' | tr ',' '.' | awk '{print $1"/"$2"/"$3}')"
  echo "cpu_count=$(getconf _NPROCESSORS_ONLN 2>/dev/null || echo unknown)"
  echo "containers_running=$(docker ps -q 2>/dev/null | wc -l | tr -d ' ')"
} > "$RUN_DIR/env-posture.txt"

# --- 2. provenance ------------------------------------------------------------------

date -u +%FT%TZ > "$RUN_DIR/started"
git -C "$REPO_ROOT" rev-parse HEAD > "$RUN_DIR/head"
# A dirty tree is RECORDED, not rejected -- this wrapper is also run on work in progress.
git -C "$REPO_ROOT" status --porcelain > "$RUN_DIR/worktree-status.txt"
{
  echo "dirty_files=$(wc -l < "$RUN_DIR/worktree-status.txt" | tr -d ' ')"
} >> "$RUN_DIR/env-posture.txt"

echo "e2e-run.sh: run dir $RUN_DIR"
echo "e2e-run.sh: HEAD    $(cat "$RUN_DIR/head")"

# --- 3. sleep assertion and host-suspend heartbeat ---------------------------------------

# An idle host is put to sleep by the operating system, and the start of that transition spoils a run even when the CPU never stops and the heartbeat below sees no gap: the page's socket to the dev server closes, and the dev server's client answers a closed socket by reloading the page under the test. `caffeinate` holds the display, idle, disk and system sleep assertions until this wrapper exits (`-w`), and `-u` turns the display on when it is off. An assertion prevents an idle sleep; it does not prevent the sleep a closed lid forces. Whether one is held is recorded, so a run made where the command does not exist says so.
if command -v caffeinate > /dev/null 2>&1; then
  caffeinate -dimsu -w "$$" &
  SLEEP_ASSERTION_PID=$!
  echo "sleep_assertion=caffeinate -dimsu" >> "$RUN_DIR/env-posture.txt"
else
  echo "sleep_assertion=none" >> "$RUN_DIR/env-posture.txt"
fi

# The heartbeat is started before anything that takes time, so that a suspend during database preparation or the dev server's start voids the run as one during the suite does. A marker or a log an earlier run left in this directory would speak for this run, so both are cleared first.
rm -f "$RUN_DIR/$VOID_MARKER" "$RUN_DIR/.void-marker.tmp"
: > "$RUN_DIR/$HEARTBEAT_LOG"
(suspend_heartbeat "$$" "$RUN_DIR") &
HEARTBEAT_PID=$!

# --- 4. database preparation -----------------------------------------------------------

# `yarn db:reset` is `yarn db:start && ... reset`, so it is ALSO what starts Supabase. A --no-db-reset that merely skipped this block would leave nothing to poll in step 5, turning a clean exit 3 into an exit 4 readiness timeout that names the wrong cause. The no-reset branch therefore still starts Supabase, and keeps exit 3 for a database-preparation failure.
#
# Starting Supabase ends with the stack's status, keys included, and the run directory is evidence that gets attached to a report or uploaded from CI. Both commands are therefore written through withhold-stack-keys.mjs, which copies everything else unchanged. The pipeline's status is the first failing command's (`pipefail`, set above), so a failed filter fails this step exactly as a failed start does, and nothing unfiltered is written in either case.
if [ "$DB_RESET" = true ]; then
  echo "e2e-run.sh: yarn db:reset (starts Supabase first) ..."
  if ! (cd "$REPO_ROOT" && yarn db:reset 2>&1 | node "$SCRIPT_DIR/withhold-stack-keys.mjs" > "$RUN_DIR/db-reset.log"); then
    echo "e2e-run.sh: FATAL -- yarn db:reset failed; see $RUN_DIR/db-reset.log" >&2
    exit 3
  fi
else
  echo "e2e-run.sh: --no-db-reset -- yarn db:start only, existing data left in place ..."
  if ! (cd "$REPO_ROOT" && yarn db:start 2>&1 | node "$SCRIPT_DIR/withhold-stack-keys.mjs" > "$RUN_DIR/db-start.log"); then
    echo "e2e-run.sh: FATAL -- yarn db:start failed; see $RUN_DIR/db-start.log" >&2
    exit 3
  fi
fi

# --- 5. readiness poll (NOT a status check) -------------------------------------------

# Read a variable from the environment, falling back to the root .env. Never hardcode a key into a committed script (CLAUDE.md: never commit secrets).
read_env_var() {
  local name="$1"
  local value="${!name:-}"
  if [ -z "$value" ] && [ -f "$REPO_ROOT/.env" ]; then
    # Strip surrounding quotes and any CR; octal escapes avoid quoting ambiguity.
    value="$(grep -E "^${name}=" "$REPO_ROOT/.env" | head -1 | cut -d= -f2- | tr -d '\042\047\r')"
  fi
  printf '%s' "$value"
}

SERVICE_ROLE_KEY="$(read_env_var SUPABASE_SERVICE_ROLE_KEY)"
if [ -z "$SERVICE_ROLE_KEY" ]; then
  echo "e2e-run.sh: FATAL -- SUPABASE_SERVICE_ROLE_KEY not in the environment or $REPO_ROOT/.env;" >&2
  echo "            the public-assets readiness assertion cannot run, and skipping it silently" >&2
  echo "            is what wedges an unattended batch." >&2
  exit 4
fi

echo "e2e-run.sh: polling REST + Storage readiness (deadline ${READINESS_TIMEOUT_S}s) ..."
# `db:status` passing is NOT readiness: a db:reset can leave Storage briefly 502-ing, and in an unattended batch that difference is one wedged run versus a wasted night.
readiness_deadline=$(( $(date +%s) + READINESS_TIMEOUT_S ))
ready=false
while [ "$(date +%s)" -lt "$readiness_deadline" ]; do
  rest_code="$(curl -s -o /dev/null -w '%{http_code}' "$SUPABASE_URL/rest/v1/" || echo 000)"
  buckets="$(curl -s -H "apikey: $SERVICE_ROLE_KEY" -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    "$SUPABASE_URL/storage/v1/bucket" || true)"
  # 2xx OR 4xx both prove the endpoint is answering (a 401/404 is a live service).
  if [[ "$rest_code" =~ ^[24] ]] && printf '%s' "$buckets" | grep -qF 'public-assets'; then
    ready=true
    break
  fi
  sleep 2
done

if [ "$ready" != true ]; then
  echo "e2e-run.sh: FATAL -- readiness poll timed out after ${READINESS_TIMEOUT_S}s" >&2
  echo "            last REST status: ${rest_code:-none}; public-assets listed: no" >&2
  exit 4
fi
echo "e2e-run.sh: Supabase ready (REST $rest_code, public-assets bucket present)"

# The served application must query the SAME project the harness seeds, and `identity-callback` must create its accounts in it. The dev server reads its public environment once, at process start, so the value has to be on the spawn -- a shell prefix there wins over the repo-root .env, which deliberately carries the DEFAULT project so a plain `yarn dev` still shows a locally seeded app. Reuses read_env_var rather than adding a second reader.
E2E_PROJECT_ID_RESOLVED="$(read_env_var E2E_PROJECT_ID)"
if [ -z "$E2E_PROJECT_ID_RESOLVED" ]; then
  E2E_PROJECT_ID_RESOLVED="$E2E_PROJECT_ID_DEFAULT"
fi
echo "e2e_project_id=$E2E_PROJECT_ID_RESOLVED" >> "$RUN_DIR/env-posture.txt"

# --- 5b. the identity provider's environment ---------------------------------------------

echo "e2e-run.sh: preparing the identity provider's test environment ..."
prepare_identity_provider

# --- 6. spawn the dev server, with its output redirected ------------------------

# This redirection is the ONLY available mechanism. Playwright does not manage the frontend dev server in this repo, and making it do so -- by adding a Playwright-managed frontend server entry to the config -- is FORBIDDEN: it would replace the preflight's trust model (a gate that VERIFIES an operator-started server) with one that trusts a Playwright-started one, and reusing an already-running server would reintroduce exactly the "something answered on the port" ambiguity the preflight eliminated. The wrapper owns the server; the harness is not made to.
# The header lists "NOTHING is already listening on $FRONTEND_PORT" as a prerequisite; ASSERT it rather than assume it. Without this check the wait loop below tests the port FIRST and so breaks on its very first poll against a PRE-EXISTING listener -- the `kill -0 "$DEV_PID"` liveness probe never runs, our own dev server can already have died on Vite's `strictPort`, and the wrapper reports "dev server listening" for a server it does not own. That is the "something answered on the port" ambiguity this design exists to eliminate; the served-application preflight catches wrong-checkout, not right-checkout-wrong-owner.
pre_holders="$(lsof -nP -tiTCP:"$FRONTEND_PORT" -sTCP:LISTEN 2>/dev/null || true)"
if [ -n "$pre_holders" ]; then
  echo "e2e-run.sh: FATAL -- port $FRONTEND_PORT already has a listener (pids: $pre_holders)." >&2
  echo "            This wrapper SPAWNS AND OWNS its dev server; adopting a foreign one is" >&2
  echo "            not evidence. Stop it, or re-run with FRONTEND_PORT=<a free port>." >&2
  exit 5
fi

echo "e2e-run.sh: starting dev server on port $FRONTEND_PORT (project $E2E_PROJECT_ID_RESOLVED) -> $RUN_DIR/devserver.log"
set -m # job control: the background job gets its own process group, so the trap can kill the tree
(
  cd "$REPO_ROOT"
  export FRONTEND_PORT PUBLIC_PROJECT_ID="$E2E_PROJECT_ID_RESOLVED"
  # The identity provider's test environment, for this process tree alone, and trust in the mock issuer's one committed certificate.
  # shellcheck source=/dev/null
  . "$IDP_DIR/frontend.env"
  export NODE_EXTRA_CA_CERTS="$MOCK_CERT"
  # The stack is already up (step 4) and root `yarn dev` would start it again, printing its keys into devserver.log; `_dev:concurrent` is that script without the start.
  if [ "$WATCH" = true ]; then
    yarn _dev:concurrent
  else
    yarn dev:clean && yarn workspace @openvaa/frontend dev
  fi
) > "$RUN_DIR/devserver.log" 2>&1 &
DEV_PID=$!
set +m

devserver_deadline=$(( $(date +%s) + DEVSERVER_TIMEOUT_S ))
listening=false
while [ "$(date +%s)" -lt "$devserver_deadline" ]; do
  # Liveness FIRST: with the port asserted free above, any listener that appears is ours, but a dev server that died before binding must still be reported as a dead dev server rather than as a timeout.
  if ! kill -0 "$DEV_PID" 2>/dev/null; then
    echo "e2e-run.sh: FATAL -- dev server exited before listening; see $RUN_DIR/devserver.log" >&2
    exit 5
  fi
  if lsof -nP -iTCP:"$FRONTEND_PORT" -sTCP:LISTEN > /dev/null 2>&1; then
    listening=true
    break
  fi
  sleep 2
done

if [ "$listening" != true ]; then
  echo "e2e-run.sh: FATAL -- dev server did not listen on $FRONTEND_PORT within ${DEVSERVER_TIMEOUT_S}s" >&2
  exit 5
fi
echo "e2e-run.sh: dev server listening on $FRONTEND_PORT"

# --- 7. run Playwright ----------------------------------------------------------------

# PLAYWRIGHT_JSON_OUTPUT_FILE / PLAYWRIGHT_HTML_OUTPUT_DIR are honoured by the installed Playwright's reporter-output resolver, so per-run isolation needs NO config change. The config's HTML outputFolder is a single fixed path that repeated runs would overwrite.
# PLAYWRIGHT_HTML_OPEN=never keeps an unattended batch from blocking on a served report.
PW_ARGS=(test -c "$TESTS_DIR/playwright.config.ts")
if [ -n "$PROJECT" ]; then
  PW_ARGS+=(--project="$PROJECT")
else
  # No --project: the FULL gate suite, invoked exactly as the root `test:e2e` does.
  PW_ARGS+=("$TESTS_DIR" --grep-invert @probe)
fi
PW_ARGS+=(--reporter=html,json)

echo "e2e-run.sh: npx playwright ${PW_ARGS[*]}"
# Playwright runs as a background job in a process group of its own, and the wrapper waits for it. A shell handles a trapped signal only between foreground commands, but it interrupts `wait` at once: this is what lets the heartbeat's signal, or an interrupt, end the run while the suite is still going, and the group is what the teardown signals to stop it. Its output reaches tee through a named pipe, so tee stays outside that group and still writes the last lines of a suite that was stopped. Playwright's stdin is /dev/null: a background process group must not read the terminal.
PW_PIPE_DIR="$(mktemp -d "${TMPDIR:-/tmp}/e2e-run.XXXXXX")"
mkfifo "$PW_PIPE_DIR/stdout"
tee "$RUN_DIR/stdout.log" < "$PW_PIPE_DIR/stdout" &
TEE_PID=$!
set -m
(
  # The server's secret of this run, for the specs that call `identity-callback` as the dev server does.
  # shellcheck source=/dev/null
  . "$IDP_DIR/playwright.env"
  cd "$REPO_ROOT" &&
    PLAYWRIGHT_JSON_OUTPUT_FILE="$RUN_DIR/results.json" \
      PLAYWRIGHT_HTML_OUTPUT_DIR="$RUN_DIR/html" \
      PLAYWRIGHT_HTML_OPEN=never \
      FRONTEND_PORT="$FRONTEND_PORT" \
      npx playwright "${PW_ARGS[@]}"
) > "$PW_PIPE_DIR/stdout" 2>&1 < /dev/null &
PW_PID=$!
set +m
set +e
wait "$PW_PID"
PW_STATUS=$?
# Reaped: the teardown has nothing left to stop.
PW_PID=""
wait "$TEE_PID"
TEE_PID=""
set -e
echo "$PW_STATUS" > "$RUN_DIR/exit"
echo "e2e-run.sh: playwright exit $PW_STATUS"

# Append the OBSERVED posture, read back out of the machine-readable report rather than restated from the config -- so the retry/worker claim can be audited, not taken on trust.
if [ -s "$RUN_DIR/results.json" ]; then
  node -e '
    const fs = require("fs");
    const r = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const retries = [...new Set((r.config.projects || []).map((p) => p.retries))].join(",");
    const out = [
      `observed_workers=${r.config.workers}`,
      `observed_retries=${retries}`,
      `observed_expected=${r.stats.expected}`,
      `observed_unexpected=${r.stats.unexpected}`,
      `observed_flaky=${r.stats.flaky}`,
      `observed_skipped=${r.stats.skipped}`,
      `observed_duration_ms=${Math.round(r.stats.duration)}`
    ].join("\n");
    fs.appendFileSync(process.argv[2], out + "\n");
  ' "$RUN_DIR/results.json" "$RUN_DIR/env-posture.txt"
fi

# --- 8. preflight verdict --------------------------------------------------------------

PREFLIGHT_FAILURES="$(grep -c "$PREFLIGHT_HEADLINE" "$RUN_DIR/stdout.log" || true)"
PREFLIGHT_FAILURES="${PREFLIGHT_FAILURES:-0}"
echo "$PREFLIGHT_FAILURES" > "$RUN_DIR/preflight-failures"
PREFLIGHT_SUCCESSES="$(grep -c "$PREFLIGHT_OK_HEADLINE" "$RUN_DIR/stdout.log" || true)"
PREFLIGHT_SUCCESSES="${PREFLIGHT_SUCCESSES:-0}"
echo "$PREFLIGHT_SUCCESSES" > "$RUN_DIR/preflight-successes"
echo "e2e-run.sh: preflight failures $PREFLIGHT_FAILURES, successes $PREFLIGHT_SUCCESSES"

# --- 9/10. teardown + end timestamp happen in the trap -----------------------------------

if [ "$PREFLIGHT_FAILURES" != "0" ]; then
  echo "e2e-run.sh: FATAL -- the run was not preflight-confirmed; it is not evidence" >&2
  exit 6
fi

# POSITIVE assertion, not merely the absence of a failure: globalSetup runs the preflight exactly once per invocation, so a confirmed run prints this line exactly once. Zero means the gate did not execute -- which is NOT the same fact as "the gate passed", and must not be recorded as one.
if [ "$PREFLIGHT_SUCCESSES" -lt 1 ]; then
  echo "e2e-run.sh: FATAL -- no preflight SUCCESS line ('$PREFLIGHT_OK_HEADLINE') in the run" >&2
  echo "            output, and no failure either. The served-application gate did not run," >&2
  echo "            so this run is unconfirmed and is not evidence." >&2
  exit 6
fi

exit "$PW_STATUS"
