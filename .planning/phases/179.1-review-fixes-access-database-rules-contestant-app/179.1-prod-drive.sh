#!/usr/bin/env bash
#
# 179.1-prod-drive.sh -- one production build, served and driven, for Phase 179.1. It is not an E2E run: see
# 179.1-prod.playwright.config.ts. No E2E verdict reads its output; 179.1-prod.mts `judge` does.
#
# Usage (PD = .planning/phases/179.1-review-fixes-access-database-rules-contestant-app):
#   bash PD/179.1-prod-drive.sh <label> [<playwright argument>...]
# Never in the foreground: start it in the background and poll the marker, as the plans' <long_gates> block says.
#
# Steps:
#   (a) guards: Node at or above the engines floor; a plain label that holds no earlier run; port 5274 free;
#   (b) records head, worktree-status.txt and the power source;
#   (c) removes apps/frontend/build, because a cache hit overlays a build on an old one and leaves two client files;
#       `yarn build` into build.log, a non-zero status exits 4;
#   (d) `179.1-prod.mts manifest` into manifest.txt, its status in manifest.exit; a red manifest is evidence and does
#       not stop the run;
#   (e) reads the API URL and the anon key into variables, never printed, and no other key;
#   (f) starts `node apps/frontend/build/index.js` in a process group of its own, its log in prodserver.log; waits up
#       to 60 s for the port; writes the data-project-id the login page serves into served.txt;
#   (g) the driven run, into stdout.log, its report in results.json;
#   (h) stops the server by its group and confirms the port free;
#   (i) exits 6 when any file of the run holds the anon key, tested without printing it.
# Its last acts on every path, once the run directory is claimed, are writing <run-dir>/exit and <run-dir>/done.
#
# Exit: Playwright's status when nothing else stopped it. 2 usage or precondition, 3 the stack's address or key could
# not be read, 4 build failed, 5 port held or the server never listened, 6 a file of the run holds the key,
# 7 the server's port stayed held after it was stopped.
#
# It never deletes anything under tests/e2e-runs/.

set -u

SELF="179.1-prod-drive.sh"
PORT=5274
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$REPO_ROOT" || exit 2
PD="${SCRIPT_DIR#"$REPO_ROOT"/}"

LABEL="${1:-}"
shift || true
case "$LABEL" in
  '' | */* | .* | -*)
    echo "usage: $SELF <label> [<playwright argument>...] -- a plain <label> is required" >&2
    exit 2
    ;;
esac

NVM_NODE_DIR="$HOME/.nvm/versions/node"
if [ -x "$NVM_NODE_DIR/v24.21.0/bin/node" ]; then
  export PATH="$NVM_NODE_DIR/v24.21.0/bin:$PATH"
fi
if ! node -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit(a>24||(a===24&&b>=15)?0:1)' 2> /dev/null; then
  echo "$SELF: node $(node -v 2> /dev/null || echo '(none)') is below the engines floor 24.15.0" >&2
  exit 2
fi

RUN_DIR="tests/e2e-runs/179.1-prod/$LABEL"
if [ -d "$RUN_DIR" ] && [ -n "$(ls -A "$RUN_DIR" 2> /dev/null)" ]; then
  echo "$SELF: $RUN_DIR already holds a run; use a new label so evidence is never overwritten" >&2
  exit 2
fi

port_is_held() { lsof -nP -iTCP:"$PORT" -sTCP:LISTEN > /dev/null 2>&1; }

if port_is_held; then
  echo "$SELF: a process already listens on port $PORT:" >&2
  lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >&2
  exit 5
fi

mkdir -p "$RUN_DIR" || exit 2

SERVER_PID=""
stop_server() {
  [ -n "$SERVER_PID" ] || return 0
  kill -TERM -- "-$SERVER_PID" 2> /dev/null
  local waited=0
  while kill -0 "$SERVER_PID" 2> /dev/null && [ "$waited" -lt 20 ]; do
    sleep 0.5
    waited=$((waited + 1))
  done
  kill -KILL -- "-$SERVER_PID" 2> /dev/null
  wait "$SERVER_PID" 2> /dev/null
  SERVER_PID=""
}

on_exit() {
  local s=$?
  trap - EXIT
  stop_server
  printf '%s\n' "$s" > "$RUN_DIR/exit"
  printf '%s\n' "$s" > "$RUN_DIR/done"
  exit "$s"
}
trap on_exit EXIT
trap 'exit 130' INT TERM

# (b)
git rev-parse HEAD > "$RUN_DIR/head"
git status --porcelain > "$RUN_DIR/worktree-status.txt"
START_LOCAL="$(date '+%F %T')"
{
  echo "started_local: $START_LOCAL"
  echo "--- pmset -g batt (start)"
  pmset -g batt 2>&1 || echo "(pmset unavailable)"
} > "$RUN_DIR/power.txt"

# (c)
echo "$SELF [$LABEL] yarn build"
rm -rf apps/frontend/build
yarn build > "$RUN_DIR/build.log" 2>&1
build_status=$?
echo "$SELF [$LABEL] build exit $build_status"
if [ "$build_status" -ne 0 ]; then exit 4; fi

# (d)
npx tsx "$PD/179.1-prod.mts" manifest > "$RUN_DIR/manifest.txt" 2>&1
manifest_status=$?
printf '%s\n' "$manifest_status" > "$RUN_DIR/manifest.exit"
echo "$SELF [$LABEL] manifest exit $manifest_status"

# (e)
status_field() { sed -n "s/^$1=\"\{0,1\}\([^\"]*\)\"\{0,1\}\$/\1/p" | head -n 1; }
status_env="$(cd apps/supabase && yarn supabase status -o env 2> /dev/null | grep -E '^(API_URL|ANON_KEY)=')"
api="$(printf '%s\n' "$status_env" | status_field API_URL)"
anon="$(printf '%s\n' "$status_env" | status_field ANON_KEY)"
status_env=""
if [ -z "$api" ] || [ -z "$anon" ]; then
  echo "$SELF: could not read the API URL and the anon key from 'supabase status -o env' -- is the stack up?" >&2
  exit 3
fi
project_id="$(sed -n 's/^E2E_PROJECT_ID_DEFAULT="\([^"]*\)"$/\1/p' tests/scripts/e2e-run.sh | head -n 1)"
if [ -z "$project_id" ]; then
  echo "$SELF: could not read E2E_PROJECT_ID_DEFAULT from tests/scripts/e2e-run.sh" >&2
  exit 2
fi

# (f)
if port_is_held; then
  echo "$SELF: a process took port $PORT during the build" >&2
  exit 5
fi
echo "$SELF [$LABEL] starting the production server on port $PORT (project $project_id)"
set -m
ORIGIN="http://localhost:$PORT" PORT="$PORT" PUBLIC_SUPABASE_URL="$api" PUBLIC_SUPABASE_ANON_KEY="$anon" PUBLIC_PROJECT_ID="$project_id" \
  node apps/frontend/build/index.js > "$RUN_DIR/prodserver.log" 2>&1 &
SERVER_PID=$!
set +m

listening=0
for _ in $(seq 1 120); do
  if port_is_held; then
    listening=1
    break
  fi
  if ! kill -0 "$SERVER_PID" 2> /dev/null; then break; fi
  sleep 0.5
done
if [ "$listening" -ne 1 ]; then
  echo "$SELF: the production server never listened on port $PORT; see $RUN_DIR/prodserver.log" >&2
  exit 5
fi
curl -sS -L --max-time 30 "http://localhost:$PORT/en/contestant/login" 2> /dev/null | grep -o 'data-project-id="[^"]*"' | head -n 1 > "$RUN_DIR/served.txt"
echo "$SELF [$LABEL] served: $(cat "$RUN_DIR/served.txt")"

# (g)
echo "$SELF [$LABEL] npx playwright test -c $PD/179.1-prod.playwright.config.ts $*"
PLAYWRIGHT_JSON_OUTPUT_FILE="$RUN_DIR/results.json" FRONTEND_PORT="$PORT" \
  npx playwright test -c "$PD/179.1-prod.playwright.config.ts" --output="$RUN_DIR/playwright-results" "$@" > "$RUN_DIR/stdout.log" 2>&1
playwright_status=$?
echo "$SELF [$LABEL] playwright exit $playwright_status"

# (h)
stop_server
if port_is_held; then
  echo "$SELF: port $PORT is still held after the server was stopped" >&2
  exit 7
fi

{
  echo "ended_local: $(date '+%F %T')"
  echo "--- pmset -g batt (end)"
  pmset -g batt 2>&1 || echo "(pmset unavailable)"
  echo "--- pmset -g log, Sleep / Wake / DarkWake entries inside the run window"
  END_LOCAL="$(date '+%F %T')"
  pmset -g log 2> /dev/null | grep -E "^.{26}(Sleep|Wake|DarkWake) " |
    awk -v a="$START_LOCAL" -v b="$END_LOCAL" '{ t = substr($0, 1, 19); if (t >= a && t <= b) print }'
} >> "$RUN_DIR/power.txt"

# (i) The pattern reaches grep through a descriptor, from a shell builtin, so it is on no command line.
holding="$(grep -rlF -f <(printf '%s\n' "$anon") "$RUN_DIR" 2> /dev/null)"
anon=""
if [ -n "$holding" ]; then
  echo "$SELF: these files of the run hold the anon key:" >&2
  printf '%s\n' "$holding" >&2
  exit 6
fi

exit "$playwright_status"
