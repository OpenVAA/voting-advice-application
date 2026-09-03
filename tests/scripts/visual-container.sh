#!/usr/bin/env bash
#
# visual-container.sh -- Perform exactly ONE in-container visual run and leave behind a
#                        complete, machine-readable evidence directory.
#
# This is the executable form of the recipe that until now existed only as prose in the docblock of tests/tests/specs/visual/visual-regression.spec.ts and as a comment in .github/workflows/main.yaml -- with its port-forwarding step documented nowhere, and with a mount path that has aborted every run since the served-app preflight landed.
# A visual-noise campaign runs this recipe roughly twenty times; encoding it once is the difference between twenty reproducible runs and twenty transcriptions.
#
# Usage:
#   tests/scripts/visual-container.sh --run-dir tests/e2e-runs/visual-observe tests/scripts/visual-container.sh --run-dir tests/e2e-runs/visual-egress-ctl --block-egress tests/scripts/visual-container.sh --run-dir tests/e2e-runs/visual-rebaseline --update-snapshots-all tests/scripts/visual-container.sh --run-dir tests/e2e-runs/visual-det-ci --ci-literal FRONTEND_PORT=5273 tests/scripts/visual-container.sh --run-dir tests/e2e-runs/visual-noise-run01
#
#   --run-dir <path>        REQUIRED. Where every artifact for this run lands. A relative path is resolved against the REPO ROOT, never against $PWD, so the script behaves identically from any working directory. It MUST resolve inside the repo root, because that is the only thing mounted into the container -- a run dir outside it would be discarded when the --rm container exits, taking the run's entire evidence with it.
#   --config <path>         OPTIONAL. Playwright config to run. Default: tests/playwright.config.ts, the SHIPPED configuration, which is what every verdict-bearing run must use.
#                           Exists for MEASUREMENT-ONLY overlays (the zero-tolerance noise matrix and the height control), which live under tests/e2e-runs/ precisely so they are gitignored and can never be shipped. A relative path is resolved against the REPO ROOT and MUST stay inside it -- the repo root is the only thing mounted, so a config outside it does not exist in the container.
#                           Mutually exclusive with --ci-literal (which reproduces CI's invocation, and CI runs the shipped config) and with
#                           --egress-control-only (which runs no suite at all).
#                           NOTE: an overlay two directories down does NOT inherit the base config's relative `globalSetup` or relative project `testDir`s -- both resolve against the CONFIG FILE's own directory, so an overlay that merely spreads the base silently loses the served-application preflight and enumerates zero tests. Overlays must absolutise both, and prove it with --list before measuring.
#   --project <name>        OPTIONAL. Playwright project. Default: visual-regression.
#                           Mutually exclusive with --grep and with --ci-literal.
#   --grep <pattern>        OPTIONAL. Select by title tag instead of by project.
#                           Mutually exclusive with --project and with --ci-literal.
#   --update-snapshots-all  OPTIONAL. Appends the literal --update-snapshots=all. There is deliberately NO flag that produces the bare form: bare
#                           --update-snapshots is mode `changed`, which SKIPS images that are within tolerance (research N-4). A re-baseline whose whole purpose is to re-capture every image against new rendering must not silently leave the within-tolerance ones carrying old pixels.
#   --block-egress          OPTIONAL. Blackhole fonts.googleapis.com and fonts.gstatic.com at the container's own resolver, and run a curl control FIRST that MUST fail. A green suite behind an unproven block proves nothing, so the control runs BEFORE Playwright, not after.
#   --egress-control-only   OPTIONAL, and only meaningful with --block-egress (a usage error without it). Take the controls and STOP: run the step-2 curl control, then drive Chromium at the same URL, and exit WITHOUT starting the forwarder or Playwright. The block must be proven live BEFORE any suite runs behind it, and a control run that also runs the suite cannot be that proof -- it would already be the thing it is supposed to license. Writes curl-control.log and chromium-control.log beside provenance.txt in the run dir. Exit 0 means BOTH controls failed to connect, which is the passing outcome here; exit 6 means one of them reached Google.
#   --ci-literal            OPTIONAL. Reproduce CI's invocation exactly: CI=true and
#                           --grep "@visual" with no --project and no --workers/--retries override. Such a run yields SEVEN tests, not four, because dependency projects are exempt from --grep (research N-11).
#   -h, --help              Print this header and exit 0.
#
# Prerequisites -- HOST side. This script ASSERTS them; it never performs them. It runs INSIDE a container against a dev server on the HOST that it cannot own, so unlike tests/scripts/e2e-run.sh it neither spawns nor adopts a server, and it does not reset the database. Run these three, in this order, before invoking it:
#
#   1. yarn build (or at minimum `yarn build --filter=@openvaa/app-shared`)
#   2. yarn db:reset && yarn db:seed --template e2e/base
#   3. yarn workspace @openvaa/frontend dev --host 0.0.0.0
#
#   Step 1 is NOT optional. @openvaa/app-shared is ESM-only and the frontend resolves it to its built dist/, so editing staticSettings.ts without rebuilding changes nothing at runtime -- and a stale dist/ would re-baseline against Google-served Inter and pass every gate for the wrong reason (research N-7).
#
#   Step 3 must be the workspace script. `yarn dev --host 0.0.0.0` does NOT work: the root dev script chains through concurrently, so the appended argument lands on concurrently instead of on the bundler, which then binds 127.0.0.1 and is unreachable from the container (research N-10).
#
#   Also required: Docker is running, and the pinned image is ALREADY PRESENT locally.
#   This script refuses to pull -- see exit code 4.
#
# Exit codes -- the caller must be able to branch on the status alone:
#   0  Playwright reported success 1  Playwright reported failures 2  usage error 3  docker is unavailable (the daemon did not answer) 4  the pinned image digest is NOT present locally; this script REFUSES to pull 5  the TCP forwarder failed to bind inside the container 6  an egress control did NOT fail under --block-egress, so the block is unproven and the suite must not run behind it. Raised by the step-2 curl control on every
#      --block-egress run, and additionally by the Chromium control under
#      --egress-control-only: curl proves the RESOLVER is blackholed, Chromium proves the browser that actually takes the screenshots is subject to the same blackhole rather than resolving around /etc/hosts. Two claims, one code -- either one succeeding means the block is not applied.
#   7  the host dev server was not reachable through the forwarder 130  the run was INTERRUPTED (SIGINT/SIGTERM). Never 0: the determinism gate counts CONSECUTIVE runs, so an abort must be recorded as an abort by the caller, not silently counted as a green.
#
# Codes 0/1/2/130 keep the meanings tests/scripts/e2e-run.sh assigns them. Codes 2 and 5 are shared with tests/scripts/tcp-forward.mjs's own table and must stay in agreement with it.

set -euo pipefail

# Auto-detect paths from script location -- cwd-independence is not optional here: the Playwright config already had a spawn-cwd incident (playwright.config.ts:1135-1147).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TESTS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$TESTS_DIR/.." && pwd)"

# Prefer 5173: tests/tests/utils/supabaseAdminClient.ts hardcodes it by string substitution in two places, so a different port is a preference rather than a guarantee. FRONTEND_PORT is honoured by both the bundler and Playwright.
FRONTEND_PORT="${FRONTEND_PORT:-5173}"

# Pinned BY DIGEST, never by tag. Two reasons, both load-bearing:
#   (a) A tag reference can resolve to a different image later, and the whole comparability argument -- re-running the original injection to re-observe the same 19,484 px miss -- rests on "same image, same digest".
#   (b) On this machine Docker's `desktop` credential helper has previously wedged, so a pull triggered by a mistyped reference stalls before any network activity in a way that looks like a network problem. The digest guard below refuses to pull.
PW_IMAGE="${PW_IMAGE:-mcr.microsoft.com/playwright@sha256:6446946a1d9fd62d9ae501312a2d76a43ee688542b21622056a372959b65d63d}"

RUN_DIR=""
CONFIG_PATH=""
PROJECT=""
GREP_PATTERN=""
UPDATE_ALL=0
BLOCK_EGRESS=0
CONTROLS_ONLY=0
CI_LITERAL=0
INTERRUPTED=0

usage() {
  # Delimit the header block rather than hardcoding a line range: a `sed -n '2,Np'` form truncates the exit-code table the header tells the caller to branch on, and drifts further every time the header grows.
  sed -n '2,/^set -euo pipefail/p' "${BASH_SOURCE[0]}" | sed '$d'
}

# A value-taking flag given as the LAST argument must be a USAGE error, not a silent death. `VAR="${2:-}"; shift 2` looks safe but is not: with one positional left, `shift 2` fails, and under `set -euo pipefail` the script dies with exit 1 -- no message, no usage. Exit 1 is "Playwright reported failures" in the table above, so a caller branching on the status alone (which the table says it must be able to do) reads a typo as a test failure.
#
# $1 = flag name, $2 = the caller's remaining argument count ($#).
require_value() {
  if [ "$2" -lt 2 ]; then
    echo "visual-container.sh: $1 requires a value" >&2
    usage >&2
    exit 2
  fi
}

fatal() {
  echo "visual-container.sh: FATAL -- $1" >&2
  exit "$2"
}

# --- argument parsing -------------------------------------------------------------

while [ $# -gt 0 ]; do
  case "$1" in
    --run-dir)
      require_value --run-dir $#
      RUN_DIR="$2"
      shift 2
      ;;
    --config)
      require_value --config $#
      CONFIG_PATH="$2"
      shift 2
      ;;
    --project)
      require_value --project $#
      PROJECT="$2"
      shift 2
      ;;
    --grep)
      require_value --grep $#
      GREP_PATTERN="$2"
      shift 2
      ;;
    --update-snapshots-all)
      UPDATE_ALL=1
      shift
      ;;
    --block-egress)
      BLOCK_EGRESS=1
      shift
      ;;
    --egress-control-only)
      CONTROLS_ONLY=1
      shift
      ;;
    --ci-literal)
      CI_LITERAL=1
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      echo "visual-container.sh: unknown argument '$1'" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [ -z "$RUN_DIR" ]; then
  echo "visual-container.sh: --run-dir is required" >&2
  usage >&2
  exit 2
fi

if [ -n "$PROJECT" ] && [ -n "$GREP_PATTERN" ]; then
  echo "visual-container.sh: --project and --grep are mutually exclusive" >&2
  exit 2
fi

if [ "$CONTROLS_ONLY" = "1" ] && [ "$BLOCK_EGRESS" != "1" ]; then
  echo "visual-container.sh: --egress-control-only requires --block-egress; without the block the controls would" >&2
  echo "visual-container.sh: succeed by design and would measure nothing" >&2
  exit 2
fi

if [ "$CONTROLS_ONLY" = "1" ] &&
  { [ -n "$PROJECT" ] || [ -n "$GREP_PATTERN" ] || [ "$UPDATE_ALL" = "1" ] || [ "$CI_LITERAL" = "1" ]; }; then
  echo "visual-container.sh: --egress-control-only runs no suite, so a selection or snapshot flag alongside it" >&2
  echo "visual-container.sh: describes a run that will not happen. Drop the flag or drop --egress-control-only." >&2
  exit 2
fi

if [ "$CI_LITERAL" = "1" ] && { [ -n "$PROJECT" ] || [ -n "$GREP_PATTERN" ]; }; then
  echo "visual-container.sh: --ci-literal reproduces CI's selection exactly and cannot be combined with --project or --grep" >&2
  exit 2
fi

if [ -n "$CONFIG_PATH" ] && [ "$CI_LITERAL" = "1" ]; then
  echo "visual-container.sh: --ci-literal reproduces CI's invocation, and CI runs the SHIPPED config; an overlay" >&2
  echo "visual-container.sh: alongside it describes a run CI never performs." >&2
  exit 2
fi

if [ -n "$CONFIG_PATH" ] && [ "$CONTROLS_ONLY" = "1" ]; then
  echo "visual-container.sh: --egress-control-only runs no suite, so the config it would have run is not used." >&2
  exit 2
fi

# Resolve a relative --run-dir against the REPO ROOT (not $PWD) so the script is cwd-independent for relative and absolute paths alike.
case "$RUN_DIR" in
  /*) : ;;
  *) RUN_DIR="$REPO_ROOT/$RUN_DIR" ;;
esac

# The repo root is the ONLY thing mounted into the container. A run dir outside it is written to the container's ephemeral filesystem and vanishes with --rm, so the run would report an exit code and leave no evidence at all. Refuse rather than lose it.
case "$RUN_DIR" in
  "$REPO_ROOT"/*) : ;;
  *)
    echo "visual-container.sh: --run-dir must resolve inside $REPO_ROOT (the mounted tree); got '$RUN_DIR'" >&2
    exit 2
    ;;
esac

# The config crosses the container boundary the same way the run dir does: resolved against the REPO ROOT, and required to stay inside it. The repo root is the ONLY thing mounted, so a config outside it simply does not exist in the container -- and Playwright's failure for a missing config is a generic non-zero exit that would be indistinguishable from a test failure to a caller branching on the status alone.
if [ -n "$CONFIG_PATH" ]; then
  case "$CONFIG_PATH" in
    /*) : ;;
    *) CONFIG_PATH="$REPO_ROOT/$CONFIG_PATH" ;;
  esac
  case "$CONFIG_PATH" in
    "$REPO_ROOT"/*) : ;;
    *)
      echo "visual-container.sh: --config must resolve inside $REPO_ROOT (the mounted tree); got '$CONFIG_PATH'" >&2
      exit 2
      ;;
  esac
  if [ ! -f "$CONFIG_PATH" ]; then
    echo "visual-container.sh: --config '$CONFIG_PATH' does not exist" >&2
    exit 2
  fi
  # Emitted to Playwright as a REPO-ROOT-RELATIVE path: the container's workdir is the repo root (the identical-path mount), so the relative form is stable and the recorded pw-args.txt reads the same on both sides of the boundary.
  CONFIG_PATH="${CONFIG_PATH#"$REPO_ROOT"/}"
fi

# `install -d` rather than `mkdir` with a parents flag: this script must contain no standalone short flag that a reader (or a grep) could mistake for a docker port publication, which threat T-146-03's mitigation forbids outright.
install -d "$RUN_DIR"

trap 'INTERRUPTED=1' INT TERM

# --- pre-flight guards, before any docker run ---------------------------------------

if ! docker version > "$RUN_DIR/docker-version.txt" 2>&1; then
  cat "$RUN_DIR/docker-version.txt" >&2
  fatal "the docker daemon did not answer. Start Docker and retry." 3
fi
echo "visual-container.sh: docker daemon OK"

if ! docker image inspect "$PW_IMAGE" > "$RUN_DIR/image-inspect.json" 2> "$RUN_DIR/image-inspect.err"; then
  cat "$RUN_DIR/image-inspect.err" >&2
  echo "visual-container.sh: the pinned image is not present locally:" >&2
  echo "visual-container.sh:   $PW_IMAGE" >&2
  echo "visual-container.sh: this script REFUSES to pull. On this host Docker's credential" >&2
  echo "visual-container.sh: helper has previously wedged, and a pull triggered by a mistyped" >&2
  echo "visual-container.sh: reference stalls before any network activity in a way that reads" >&2
  echo "visual-container.sh: as a network problem. Fetch the image deliberately, then retry." >&2
  fatal "pinned image digest not present locally" 4
fi
echo "visual-container.sh: pinned image present locally"

# --- assemble the Playwright arguments ----------------------------------------------

# Written one per line into the run dir and read back inside the container with `mapfile`, so a selection pattern containing spaces survives the container boundary without a quoting round-trip -- and so the run's own evidence directory records the exact argument vector it was invoked with.
PW_ARGS_FILE="$RUN_DIR/pw-args.txt"
: > "$PW_ARGS_FILE"

{
  echo "test"
  echo "-c"
  echo "${CONFIG_PATH:-tests/playwright.config.ts}"
  if [ "$CI_LITERAL" = "1" ]; then
    # CI selects by grep and passes no --project and no worker/retry override; CI=true alone gives workers: 1, retries: 3 (playwright.config.ts). Reproducing that literally is the point of this mode -- do not "improve" it toward the strict runs.
    echo "--grep"
    echo "@visual"
  elif [ -n "$GREP_PATTERN" ]; then
    echo "--grep"
    echo "$GREP_PATTERN"
    echo "--workers=1"
    echo "--retries=0"
  else
    echo "--project=${PROJECT:-visual-regression}"
    echo "--workers=1"
    echo "--retries=0"
  fi
  if [ "$UPDATE_ALL" = "1" ]; then
    echo "--update-snapshots=all"
  fi
  echo "--reporter=html,json"
} >> "$PW_ARGS_FILE"

# --- the in-container entrypoint ------------------------------------------------------

# Quoted heredoc: nothing is interpolated on the host. Every value the entrypoint needs crosses the boundary as an environment variable, so there is no second layer of quoting to get wrong.
#
# It is written INTO the run directory rather than passed as a `bash -c` string, for two reasons. The mount is identical-path, so this exact absolute path resolves inside the container as well as outside it -- and the run's evidence directory then contains the byte-exact program that produced its results, which is the same "evidence over restatement" rule the read-back at the bottom of this file follows.
ENTRYPOINT_FILE="$RUN_DIR/entrypoint.sh"

cat > "$ENTRYPOINT_FILE" << 'ENTRYPOINT'
#!/usr/bin/env bash
set -uo pipefail

SELF="visual-container.sh(in-container)"

# --- 1. provenance --------------------------------------------------------------------
{
  echo "uname_m=$(uname -m)"
  echo "node_version=$(node -v)"
  head -n 2 /etc/os-release
  echo "pwd=$(pwd)"
} > "$VC_RUN_DIR/provenance.txt"
echo "$SELF: provenance -> $VC_RUN_DIR/provenance.txt"
cat "$VC_RUN_DIR/provenance.txt"

# --- 2. egress control, BEFORE Playwright ---------------------------------------------- A green suite behind an unproven block proves nothing, so the control that shows the block is live runs first and aborts the whole run if it succeeds.
if [ "${VC_BLOCK_EGRESS:-0}" = "1" ]; then
  # The blackhole lines themselves, recorded next to the control they explain: a reader re-deriving this needs to see the two /etc/hosts entries that ARE the mechanism.
  {
    echo "--- /etc/hosts (the blackhole lines) ---"
    grep -E 'fonts\.(googleapis|gstatic)\.com' /etc/hosts || echo "(NO blackhole lines present)"
  } >> "$VC_RUN_DIR/provenance.txt"

  set +e
  curl -sS --max-time 8 "https://fonts.googleapis.com/css2?family=Inter" \
    > "$VC_RUN_DIR/egress-curl.out" 2> "$VC_RUN_DIR/egress-curl.err"
  CURL_STATUS=$?
  set -e
  echo "$CURL_STATUS" > "$VC_RUN_DIR/egress-curl.exit"
  echo "$SELF: egress control curl exit $CURL_STATUS"
  cat "$VC_RUN_DIR/egress-curl.err" || true

  # A single transcript carrying the command, the status and the verbatim error, so the ledger's E1-CURL row can cite ONE log file rather than three fragments that a reader has to reassemble in the right order.
  {
    echo "--- command ---"
    echo 'curl -sS --max-time 8 "https://fonts.googleapis.com/css2?family=Inter"'
    echo "--- stderr (verbatim) ---"
    cat "$VC_RUN_DIR/egress-curl.err"
    echo "--- stdout (verbatim) ---"
    cat "$VC_RUN_DIR/egress-curl.out"
    echo "--- status ---"
    echo "exit=$CURL_STATUS"
  } > "$VC_RUN_DIR/curl-control.log"

  if [ "$CURL_STATUS" = "0" ]; then
    echo "$SELF: FATAL -- the egress control SUCCEEDED under --block-egress." >&2
    echo "$SELF: fonts.googleapis.com is still reachable, so the block is unproven and" >&2
    echo "$SELF: any green suite behind it would prove nothing. Refusing to run." >&2
    exit 6
  fi
fi

# --- 2b. the BROWSER-level control, and the stop -------------------------------------- curl proves the RESOLVER is blackholed. It does not prove the browser is: Chromium has its own resolver path and could in principle route around /etc/hosts, in which case every claim about a font-egress-blocked capture would be vacuous. That is a different claim, so it is measured separately -- and it is measured with the image's own bundled Playwright rather than through a spec file, because a committed spec would make a one-off control part of the permanent suite.
if [ "${VC_CONTROLS_ONLY:-0}" = "1" ]; then
  set +e
  node -e '
    const { chromium } = require("@playwright/test");
    // NOT named `URL`: a top-level `const URL` shadows the global URL class, and node
    // undici dereferences that global while loading `fetch` -- observed here as
    // `ReferenceError: URL is not defined` from inside undici, several frames away from
    // anything this probe wrote.
    const TARGET = "https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap";
    (async () => {
      const browser = await chromium.launch();
      console.info("playwright_version=" + require("@playwright/test/package.json").version);
      console.info("chromium_version=" + browser.version());
      console.info("navigating to " + TARGET);
      const page = await browser.newPage();
      let failure = null;
      try {
        const res = await page.goto(TARGET, { timeout: 20000 });
        console.info("navigation SUCCEEDED with HTTP " + (res && res.status()));
      } catch (e) {
        failure = e.message.split("\n")[0];
        console.info("navigation FAILED: " + failure);
      }
      await browser.close();
      // Exit 6 on a SUCCESSFUL navigation: same meaning as the curl control above.
      process.exit(failure ? 0 : 6);
    })().catch((e) => {
      console.error("probe itself failed: " + e.message);
      process.exit(1);
    });
  ' > "$VC_RUN_DIR/chromium-control.log" 2>&1
  CHROMIUM_STATUS=$?
  set -e
  echo "exit=$CHROMIUM_STATUS" >> "$VC_RUN_DIR/chromium-control.log"
  cat "$VC_RUN_DIR/chromium-control.log"
  # NOT `exit`: that filename means "Playwright's status" everywhere else in this phase, and a controls-only run never reaches Playwright. Overloading it would let a later reader mistake a control for a suite result.
  echo "$CHROMIUM_STATUS" > "$VC_RUN_DIR/controls-exit"

  if [ "$CHROMIUM_STATUS" != "0" ]; then
    echo "$SELF: FATAL -- the Chromium egress control did not fail as required (exit $CHROMIUM_STATUS)." >&2
    exit "$CHROMIUM_STATUS"
  fi
  echo "$SELF: both egress controls failed to connect, which is the passing outcome. Stopping"
  echo "$SELF: before the forwarder and before Playwright: D-11 requires the block to be proven"
  echo "$SELF: BEFORE a suite runs behind it, so this run must not be that suite."
  exit 0
fi

# --- 3. the TCP relay ------------------------------------------------------------------ The suite's endpoint literals hardcode `localhost` (baseURL and SUPABASE_URL alike) and the candidate storageState cookie is minted for that origin, so the host's services must appear on the container's OWN loopback under the same names and ports.
node tests/scripts/tcp-forward.mjs \
  "$FRONTEND_PORT:host.docker.internal:$FRONTEND_PORT" \
  "54321:host.docker.internal:54321" \
  "54324:host.docker.internal:54324" \
  > "$VC_RUN_DIR/forwarder.log" 2>&1 &
FWD_PID=$!

FWD_DEADLINE=$(( $(date +%s) + 30 ))
FWD_READY=0
while [ "$(date +%s)" -lt "$FWD_DEADLINE" ]; do
  if ! kill -0 "$FWD_PID" 2>/dev/null; then
    break
  fi
  if grep -q "ALL READY" "$VC_RUN_DIR/forwarder.log" 2>/dev/null; then
    FWD_READY=1
    break
  fi
  sleep 1
done

if [ "$FWD_READY" != "1" ]; then
  cat "$VC_RUN_DIR/forwarder.log" >&2 || true
  echo "$SELF: FATAL -- the TCP forwarder never reported ALL READY; see forwarder.log" >&2
  exit 5
fi
echo "$SELF: forwarder ready (pid $FWD_PID)"

DEV_DEADLINE=$(( $(date +%s) + 60 ))
DEV_UP=0
while [ "$(date +%s)" -lt "$DEV_DEADLINE" ]; do
  if node -e 'const net=require("node:net");const s=net.connect({host:"localhost",port:Number(process.env.FRONTEND_PORT)});s.on("connect",()=>{s.end();process.exit(0)});s.on("error",()=>process.exit(1));' 2>/dev/null; then
    DEV_UP=1
    break
  fi
  sleep 2
done

if [ "$DEV_UP" != "1" ]; then
  cat "$VC_RUN_DIR/forwarder.log" >&2 || true
  echo "$SELF: FATAL -- nothing accepted on localhost:$FRONTEND_PORT through the forwarder." >&2
  echo "$SELF: The host dev server is almost certainly bound to loopback only. It must be" >&2
  echo "$SELF: started as: yarn workspace @openvaa/frontend dev --host 0.0.0.0" >&2
  kill -TERM "$FWD_PID" 2>/dev/null || true
  exit 7
fi
echo "$SELF: host dev server reachable on localhost:$FRONTEND_PORT"

# --- 4. Playwright ---------------------------------------------------------------------
mapfile -t PW_ARGS < "$VC_RUN_DIR/pw-args.txt"
echo "$SELF: npx playwright ${PW_ARGS[*]}"

set +e
PLAYWRIGHT_JSON_OUTPUT_FILE="$VC_RUN_DIR/results.json" \
  PLAYWRIGHT_HTML_OUTPUT_DIR="$VC_RUN_DIR/html" \
  PLAYWRIGHT_HTML_OPEN=never \
  npx playwright "${PW_ARGS[@]}" 2>&1 | tee "$VC_RUN_DIR/stdout.log"
# The PLAYWRIGHT status, not tee's.
PW_STATUS="${PIPESTATUS[0]}"
set -e
echo "$PW_STATUS" > "$VC_RUN_DIR/exit"
echo "$SELF: playwright exit $PW_STATUS"

# --- 5. tear the relay down and propagate PLAYWRIGHT's status ---------------------------
kill -TERM "$FWD_PID" 2>/dev/null || true
wait "$FWD_PID" 2>/dev/null || true

exit "$PW_STATUS"
ENTRYPOINT

# --- the docker run --------------------------------------------------------------------

DOCKER_ARGS=(run --rm --platform linux/amd64)

# The forwarder's upstream. Present in the original recipe; on macOS Docker Desktop `--network host` maps to the Linux VM rather than to the macOS host, so the gateway alias plus a relay is the reliable shape.
DOCKER_ARGS+=(--add-host host.docker.internal:host-gateway)

if [ "$BLOCK_EGRESS" = "1" ]; then
  # The block is NAME-SCOPED on purpose, and exactly two names. Hardening it to `--network none` or to a broad DNS sink would sever the host stack the suite needs and would surface as a Playwright failure rather than as a configuration mistake.
  # Verified at both curl and Chromium level in the pinned image (research N-8).
  DOCKER_ARGS+=(--add-host fonts.googleapis.com:127.0.0.1 --add-host fonts.gstatic.com:127.0.0.1)
fi

# LOAD-BEARING, and the single reason an in-container run is possible at all: `-v "$PWD":"$PWD" -w "$PWD"` makes the container's pwd EQUAL the host's pwd, so tests/global-setup.ts derives the same repoRoot and tests/tests/support/preflight.ts's strict absolute-path equality against what the host dev server echoes back holds. The older `-v "$PWD":/work -w /work` form aborts EVERY run with exit 1 before any spec body, reporting a DIFFERENT checkout -- which reads like a wrong-server problem rather than a mount problem. The mount moves; not one byte of the preflight does.
DOCKER_ARGS+=(-v "$PWD":"$PWD" -w "$PWD")
DOCKER_ARGS+=(-e FRONTEND_PORT -e PLAYWRIGHT_VISUAL=1)
DOCKER_ARGS+=(-e "VC_RUN_DIR=$RUN_DIR" -e "VC_BLOCK_EGRESS=$BLOCK_EGRESS")
DOCKER_ARGS+=(-e "VC_CONTROLS_ONLY=$CONTROLS_ONLY")

if [ "$CI_LITERAL" = "1" ]; then
  DOCKER_ARGS+=(-e CI=true)
fi

DOCKER_ARGS+=("$PW_IMAGE" bash "$ENTRYPOINT_FILE")

export FRONTEND_PORT

# `$PWD` is the mount and the workdir, so it must be the repo root regardless of where the caller invoked this script from.
cd "$REPO_ROOT"

echo "visual-container.sh: run dir $RUN_DIR"
echo "visual-container.sh: image   $PW_IMAGE"
echo "visual-container.sh: docker ${DOCKER_ARGS[*]:0:12} ... (full argv in $RUN_DIR/docker-argv.txt)"
printf '%s\n' "${DOCKER_ARGS[@]}" > "$RUN_DIR/docker-argv.txt"

set +e
docker "${DOCKER_ARGS[@]}"
RUN_STATUS=$?
set -e

if [ "$INTERRUPTED" = "1" ]; then
  echo "visual-container.sh: INTERRUPTED -- reporting 130 rather than $RUN_STATUS" >&2
  exit 130
fi

echo "$RUN_STATUS" > "$RUN_DIR/status"
echo "visual-container.sh: container exit $RUN_STATUS"

# --- read-back, not restatement ---------------------------------------------------------

# Append the OBSERVED posture, read back out of the machine-readable report rather than restated from the invocation -- so the ledger's worker/retry claim can be audited, not taken on trust. Mirrors tests/scripts/e2e-run.sh's own read-back and its stated reason.
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
  ' "$RUN_DIR/results.json" "$RUN_DIR/observed.txt"
  echo "visual-container.sh: observed posture -> $RUN_DIR/observed.txt"
  cat "$RUN_DIR/observed.txt"
else
  echo "visual-container.sh: no results.json produced -- nothing to read back" >&2
fi

exit "$RUN_STATUS"
