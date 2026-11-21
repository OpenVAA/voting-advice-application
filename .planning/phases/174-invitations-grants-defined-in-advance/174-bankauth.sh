#!/usr/bin/env bash
#
# 174-bankauth.sh -- the two opt-in bank-auth E2E projects, one run each, then the stack restored and probed.
#
# Usage: bash .planning/phases/174-invitations-grants-defined-in-advance/174-bankauth.sh <label-stem> [before|after]
#   <label-stem>    plain name; the runs land in tests/e2e-runs/174-e2e/<label-stem>-bank-auth and
#                   tests/e2e-runs/174-e2e/<label-stem>-bank-auth-journey
#   before | after  the mode 174-stack-probe.sh is run in after the restore (default: after)
#
# It is Phase 171's driver (171-bankauth.sh) pointed at this phase's runner: the same generated files, the
# same waits, the same restore. It encodes tests/IDURA-TEST-RUNBOOK.md, section "Deterministic E2E run" (E-1 to
# E-4) and section "Full-browser journey" (B-1 to B-3), once. Start it in the background with an exit marker;
# every wait below is a loop with its own timeout that exits non-zero naming what it waited for.
#
# Five differences from 171-bankauth.sh. Both Edge files also carry SMTP_HOST, SMTP_PORT and SMTP_FROM, read from
# the tracked template: `supabase functions serve --env-file` replaces the environment of EVERY function, and the
# chain behind bank-auth-journey holds contestant-journey and perm-localisation-positive, which register through
# account-access; without the three, that function creates the user, cannot mail, and the journey is red in its
# registration step. The restore check takes the list of functions from the directories
# under apps/supabase/supabase/functions/ that hold an index.ts, read at run time, so it follows the tree as
# this phase adds one function and deletes another. The issuer is read back from the serving container by
# name, that one variable alone. After the restore it runs 170-allowlist-probe.sh after and
# 174-stack-probe.sh <mode>, and writes both outputs and both statuses into the restore evidence. And its exit
# status is 0 only when both runs, every restore check and both probes passed.
#
# Why the two projects cannot share one run. One served function has one IDENTITY_PROVIDER_ISSUER. The
# synthetic `bank-auth` token is issued by DEFAULT_TOKEN_OPTS.issuer; the journey's token is minted by the mock
# issuer as https://127.0.0.1:9443 with the audience test-client-id. A single run with PLAYWRIGHT_BANK_AUTH set
# puts both projects in the graph under one Edge environment, and one of them is then refused by the function.
# So each project runs alone, with `--project <name> --require-project <name>`, under its own generated file.
#
# What it does, in order:
#   1. Refuses to start when a process listens on port 5273 (the wrapper's dev server), 8777 (the test JWKS
#      server) or 9443 (the mock OIDC issuer Playwright spawns).
#   2. Creates a scratch directory OUTSIDE the repository with mktemp (under BANKAUTH_SCRATCH_BASE when that
#      is set, else TMPDIR, else /tmp), removed on exit. Nothing generated here is written anywhere in the
#      repository, and no environment file inside the repository is opened.
#   3. Generates from tests/tests/utils/testKeys.ts and DEFAULT_TOKEN_OPTS of buildTestIdToken.ts: the Edge
#      file for `bank-auth`; a second Edge file for the journey; the sourceable journey file for the dev
#      server and the Playwright shell; the static JWKS document.
#   4. Serves the JWKS document on port 8777 and waits for http://127.0.0.1:8777/jwks to answer 200.
#   5. For `bank-auth`, then for `bank-auth-journey`: serves `identity-callback` with that project's Edge
#      file, waits until the serving container carries that file's issuer and the function answers an
#      OPTIONS request below 500, records the issuer (that one key, nothing else), runs
#      `PLAYWRIGHT_BANK_AUTH=1 174-e2e.sh <label> --project <project> --require-project <project>` once,
#      stops the function server.
#   6. Always, from the exit trap, once anything was started: stops the function server and the JWKS server,
#      restores the default edge runtime with `yarn db:stop` then `yarn db:start`, confirms the project's
#      edge-runtime container is running and that an OPTIONS request to each function of the tree answers
#      below 500, confirms ports 5273, 8777 and 9443 are free, then runs the two probes.
#
# Why the readiness wait reads the issuer back. `supabase functions serve --env-file` REPLACES the project's
# edge-runtime container, and the default container answers OPTIONS with 200 until it is replaced. Polling
# the HTTP status alone would report "ready" against the container that is about to go away.
#
# Why the stack is restarted afterwards. Stopping the function server REMOVES the edge-runtime container, so
# every function is gone until the stack is restarted. `yarn db:stop` then `yarn db:start` only: never
# `supabase stop --all`, never `--no-backup`, never a Docker restart. The restart also recreates the auth
# container, which is why the two probes follow it.
#
# Why SITE_URL names port 5273. `identity-callback` redirects to `${SITE_URL}/contestant`, and the wrapper's
# dev server listens on FRONTEND_PORT, default 5273.
#
# The scoped TLS bypass (NODE_TLS_REJECT_UNAUTHORIZED=0) is exported only inside the journey's subshell.
#
# Evidence, under tests/e2e-runs/174-e2e/_drivers/ so that it never sits beside the run directories under a
# name a run-directory glob would match: <label-stem>.bankauth.edge-env.txt (the issuer read back per
# project), <label-stem>.bankauth.restore.txt (the restore checks, then both probes' outputs and statuses),
# <label-stem>.bankauth.functions-<project>.log (the function server's output) and the two db logs. Each run
# directory also gets 174-edge-env.txt, written after its run (the wrapper refuses a run directory that is
# not empty).
#
# Expected noise at exit: bash reports `Terminated: 15 ... python3 -m http.server 8777`. That is this
# driver stopping its own JWKS server.
#
# The verdict for each run is 174-e2e.sh's own exit status (wrapper status, counts, required project).
# Status 8 from it means the wrapper ended that run as VOID because the host was suspended: such a run is
# neither counted as passed nor as failed, and the stack is restored and probed as after any other run.
#
# Exit codes:
#   0  both runs exited 0, every restore check passed and both probes exited 0
#   1  a run failed, a wait timed out, a restore check failed or a probe did not exit 0
#   2  usage or precondition error (nothing was started, nothing was restarted)
#   3  a run was VOID (the host was suspended during it) and nothing failed: no run is red, the restore and
#      both probes passed; make the pair again under a new label stem

set -u

SELF="174-bankauth.sh"
STEM="${1:-}"
PROBE_MODE="${2:-after}"
case "$STEM" in
  '' | */* | .* | -*) echo "usage: $SELF <label-stem> [before|after]" >&2; exit 2 ;;
esac
case "$PROBE_MODE" in
  before | after) ;;
  *) echo "usage: $SELF <label-stem> [before|after]" >&2; exit 2 ;;
esac
if [ $# -gt 2 ]; then echo "usage: $SELF <label-stem> [before|after]" >&2; exit 2; fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$REPO_ROOT" || exit 2
PD=".planning/phases/174-invitations-grants-defined-in-advance"
ALLOWLIST_PROBE=".planning/phases/170-contestant-app-rename-symbols-routes/170-allowlist-probe.sh"

NVM_NODE_DIR="$HOME/.nvm/versions/node"
if [ -x "$NVM_NODE_DIR/v24.21.0/bin/node" ]; then export PATH="$NVM_NODE_DIR/v24.21.0/bin:$PATH"; fi
if ! node -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit(a>24||(a===24&&b>=15)?0:1)'; then
  echo "$SELF: node $(node -v) is below the engines floor 24.15.0" >&2
  exit 2
fi

API="http://127.0.0.1:54321"
E2E_PROJECT_ID="00000000-0000-0000-0000-0000000000e2"
EDGE_CONTAINER="supabase_edge_runtime_openvaa-local"
FUNCTIONS_DIR="apps/supabase/supabase/functions"
PORTS="5273 8777 9443"
OUT_DIR="tests/e2e-runs/174-e2e"
EV_DIR="$OUT_DIR/_drivers"
EDGE_EVIDENCE="$EV_DIR/$STEM.bankauth.edge-env.txt"
RESTORE_EVIDENCE="$EV_DIR/$STEM.bankauth.restore.txt"

log() { echo "$SELF [$(date -u +%H:%M:%SZ)] $*"; }

port_held() { lsof -nP -iTCP:"$1" -sTCP:LISTEN > /dev/null 2>&1; }

# 1. Refuse on a held port. Nothing has been started, so nothing is restored.
for p in $PORTS; do
  if port_held "$p"; then
    echo "$SELF: a process already listens on port $p:" >&2
    lsof -nP -iTCP:"$p" -sTCP:LISTEN >&2
    exit 2
  fi
done
for label in "$STEM-bank-auth" "$STEM-bank-auth-journey"; do
  if [ -d "$OUT_DIR/$label" ] && [ -n "$(ls -A "$OUT_DIR/$label" 2> /dev/null)" ]; then
    echo "$SELF: $OUT_DIR/$label already holds a run; use a new label stem so evidence is never overwritten" >&2
    exit 2
  fi
done
if [ -e "$EDGE_EVIDENCE" ] || [ -e "$RESTORE_EVIDENCE" ]; then
  echo "$SELF: evidence for the stem '$STEM' already exists under $EV_DIR; use a new label stem" >&2
  exit 2
fi
mkdir -p "$EV_DIR"

SCRATCH=""
JWKS_PID=""
FN_PID=""
STARTED=0
FAILED=0
VOID=0

stop_group() {
  # $1: the pid of a job started under `set -m`, which is also its process-group id.
  local pid="$1" i=0
  [ -n "$pid" ] || return 0
  kill -TERM -"$pid" 2> /dev/null || kill -TERM "$pid" 2> /dev/null
  while kill -0 "$pid" 2> /dev/null && [ "$i" -lt 30 ]; do
    sleep 1
    i=$((i + 1))
  done
  if kill -0 "$pid" 2> /dev/null; then kill -KILL -"$pid" 2> /dev/null || kill -KILL "$pid" 2> /dev/null; fi
  wait "$pid" 2> /dev/null
  return 0
}

stop_function_server() {
  if [ -n "$FN_PID" ]; then
    log "stopping the function server (pid $FN_PID)"
    stop_group "$FN_PID"
    FN_PID=""
  fi
}

options_status() { curl -s -o /dev/null -w '%{http_code}' --max-time 10 -X OPTIONS "$API/functions/v1/$1" 2> /dev/null; }

# The functions of the tree: every directory under the functions directory that holds an index.ts.
function_names() {
  local d
  for d in "$FUNCTIONS_DIR"/*/; do
    [ -f "${d}index.ts" ] || continue
    basename "$d"
  done
}

# The issuer the serving container carries: that one variable, read by name.
edge_issuer() { docker exec "$EDGE_CONTAINER" printenv IDENTITY_PROVIDER_ISSUER 2> /dev/null | head -n 1; }

restore_stack() {
  local ok=1 s fn code p i names
  {
    echo "restore started: $(date -u +%FT%TZ)"
    yarn db:stop > "$EV_DIR/$STEM.bankauth.db-stop.log" 2>&1
    s=$?
    echo "yarn db:stop: exit $s"
    [ "$s" -eq 0 ] || ok=0
    yarn db:start > "$EV_DIR/$STEM.bankauth.db-start.log" 2>&1
    s=$?
    echo "yarn db:start: exit $s"
    [ "$s" -eq 0 ] || ok=0
    if docker ps --format '{{.Names}}' | grep -q -x "$EDGE_CONTAINER"; then
      echo "edge-runtime container: running"
    else
      echo "edge-runtime container: NOT running"
      ok=0
    fi
    names="$(function_names)"
    echo "functions of the tree: $(printf '%s' "$names" | tr '\n' ' ')"
    if [ -z "$names" ]; then
      echo "no function directory with an index.ts was found under $FUNCTIONS_DIR"
      ok=0
    fi
    for fn in $names; do
      code=000
      i=0
      while [ "$i" -lt 30 ]; do
        code="$(options_status "$fn")"
        case "$code" in
          2?? | 3?? | 4??) break ;;
        esac
        sleep 2
        i=$((i + 1))
      done
      echo "OPTIONS $fn: $code"
      case "$code" in
        2?? | 3?? | 4??) ;;
        *) ok=0 ;;
      esac
    done
    echo "IDENTITY_PROVIDER_ISSUER in the restored container: $(edge_issuer)"
    for p in $PORTS; do
      if port_held "$p"; then
        echo "port $p: STILL HELD"
        ok=0
      else
        echo "port $p: free"
      fi
    done
    echo "restore ended: $(date -u +%FT%TZ)"
    if [ "$ok" -eq 1 ]; then echo "restore: OK"; else echo "restore: FAILED"; fi

    echo
    echo "---- bash $ALLOWLIST_PROBE after"
    bash "$ALLOWLIST_PROBE" after 2>&1
    s=$?
    echo "170-allowlist-probe.sh after: exit $s"
    [ "$s" -eq 0 ] || ok=0
    echo
    echo "---- bash $PD/174-stack-probe.sh $PROBE_MODE"
    bash "$PD/174-stack-probe.sh" "$PROBE_MODE" 2>&1
    s=$?
    echo "174-stack-probe.sh $PROBE_MODE: exit $s"
    [ "$s" -eq 0 ] || ok=0
    if [ "$ok" -eq 1 ]; then echo "restore and probes: OK"; else echo "restore and probes: FAILED"; fi
  } > "$RESTORE_EVIDENCE" 2>&1
  cat "$RESTORE_EVIDENCE"
  [ "$ok" -eq 1 ]
}

cleanup() {
  local status=$?
  trap - EXIT INT TERM
  stop_function_server
  if [ -n "$JWKS_PID" ]; then
    stop_group "$JWKS_PID"
    JWKS_PID=""
  fi
  if [ "$STARTED" -eq 1 ]; then
    log "restoring the default edge runtime: yarn db:stop, then yarn db:start, then the two probes"
    if ! restore_stack; then
      log "RESTORE OR PROBE FAILED -- see $RESTORE_EVIDENCE"
      status=1
    fi
  fi
  if [ -n "$SCRATCH" ] && [ -d "$SCRATCH" ]; then rm -rf "$SCRATCH"; fi
  if [ "$FAILED" -ne 0 ] && [ "$status" -eq 0 ]; then status=1; fi
  log "exit $status"
  exit "$status"
}
trap cleanup EXIT
trap 'FAILED=1; exit 130' INT TERM

die() {
  log "FAILED: $*"
  FAILED=1
  exit 1
}

# 2. Scratch directory outside the repository.
SCRATCH_BASE="${BANKAUTH_SCRATCH_BASE:-${TMPDIR:-/tmp}}"
SCRATCH="$(mktemp -d "${SCRATCH_BASE%/}/174-bankauth.XXXXXX")" || exit 2
case "$SCRATCH" in
  "$REPO_ROOT"/*) echo "$SELF: the scratch directory $SCRATCH is inside the repository" >&2; exit 2 ;;
esac
chmod 700 "$SCRATCH"

# 3. Generate the four artefacts from the committed test keys. No key is typed here.
log "generating the two Edge files, the journey file and the JWKS document"
BANKAUTH_SCRATCH="$SCRATCH" BANKAUTH_PROJECT_ID="$E2E_PROJECT_ID" npx --no-install tsx -e '
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { decryptionJwks, sigPrivJwk, sigPubJwk } from "./tests/tests/utils/testKeys";
import { DEFAULT_TOKEN_OPTS } from "./tests/tests/utils/buildTestIdToken";
const out = process.env.BANKAUTH_SCRATCH;
const MOCK_ISSUER = "https://127.0.0.1:9443";
const MOCK_AUDIENCE = "test-client-id";
// The served Edge file REPLACES the edge runtime environment for every function, account-access included, and the
// chain behind bank-auth-journey registers a candidate through account-access. Its three SMTP variables are taken
// from the tracked template, line for line, so the mail leaves as it does on the default stack.
const template = readFileSync("apps/supabase/supabase/functions/.env.example", "utf8").split("\n");
const fromTemplate = (name) => {
  const line = template.find((l) => l.startsWith(name + "="));
  if (!line || line.trim().length === name.length + 1) throw new Error("the tracked template sets no " + name);
  return line.trim();
};
const edge = (issuer, audience) =>
  [
    "IDENTITY_PROVIDER_TYPE=idura-ftn",
    "IDENTITY_PROVIDER_DECRYPTION_JWKS=" + JSON.stringify(decryptionJwks),
    "IDENTITY_PROVIDER_JWKS_URI=http://host.docker.internal:8777/jwks",
    "IDENTITY_PROVIDER_CLIENT_ID=" + audience,
    "IDENTITY_PROVIDER_ISSUER=" + issuer,
    "PUBLIC_PROJECT_ID=" + process.env.BANKAUTH_PROJECT_ID,
    "SITE_URL=http://127.0.0.1:5273",
    fromTemplate("SMTP_HOST"),
    fromTemplate("SMTP_PORT"),
    fromTemplate("SMTP_FROM")
  ].join("\n") + "\n";
writeFileSync(join(out, "edge-bank-auth.env"), edge(DEFAULT_TOKEN_OPTS.issuer, DEFAULT_TOKEN_OPTS.audience));
writeFileSync(join(out, "edge-bank-auth-journey.env"), edge(MOCK_ISSUER, MOCK_AUDIENCE));
writeFileSync(join(out, "expected-issuer-bank-auth"), DEFAULT_TOKEN_OPTS.issuer + "\n");
writeFileSync(join(out, "expected-issuer-bank-auth-journey"), MOCK_ISSUER + "\n");
writeFileSync(
  join(out, "journey.env"),
  [
    "export PUBLIC_IDENTITY_PROVIDER_TYPE=idura-ftn",
    "export IDURA_DOMAIN=127.0.0.1:9443",
    "export IDURA_SIGNING_JWKS=" + JSON.stringify(JSON.stringify([sigPrivJwk])),
    "export IDURA_SIGNING_KEY_KID=test-sig-1",
    "export IDENTITY_PROVIDER_DECRYPTION_JWKS=" + JSON.stringify(JSON.stringify(decryptionJwks)),
    "export IDENTITY_PROVIDER_JWKS_URI=" + MOCK_ISSUER + "/.well-known/openid-configuration/jwks",
    "export IDENTITY_PROVIDER_ISSUER=" + MOCK_ISSUER,
    "export PUBLIC_IDENTITY_PROVIDER_CLIENT_ID=" + MOCK_AUDIENCE,
    "export NODE_TLS_REJECT_UNAUTHORIZED=0"
  ].join("\n") + "\n"
);
mkdirSync(join(out, "jwks"), { recursive: true });
writeFileSync(join(out, "jwks", "jwks"), JSON.stringify({ keys: [sigPubJwk] }));
'
gen_status=$?
if [ "$gen_status" -ne 0 ]; then die "generating the files from testKeys.ts (npx tsx exit $gen_status)"; fi
for f in edge-bank-auth.env edge-bank-auth-journey.env journey.env jwks/jwks expected-issuer-bank-auth expected-issuer-bank-auth-journey; do
  [ -s "$SCRATCH/$f" ] || die "the generated file $f is missing or empty"
done

# 4. The static JWKS server. It binds every interface: the edge runtime reaches it as host.docker.internal.
STARTED=1
set -m
python3 -m http.server 8777 --directory "$SCRATCH/jwks" > "$SCRATCH/jwks-server.log" 2>&1 &
JWKS_PID=$!
set +m
i=0
while :; do
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://127.0.0.1:8777/jwks 2> /dev/null)"
  [ "$code" = 200 ] && break
  kill -0 "$JWKS_PID" 2> /dev/null || die "the JWKS server on port 8777 exited before answering: $(tail -n 3 "$SCRATCH/jwks-server.log" | tr '\n' ' ')"
  i=$((i + 1))
  [ "$i" -lt 30 ] || die "waited 30 s for http://127.0.0.1:8777/jwks to answer 200 (last status $code)"
  sleep 1
done
log "JWKS server answers 200 on port 8777"

# Run one command with a deadline. $1 seconds, $2 what is being waited for, then the command.
run_with_deadline() {
  local seconds="$1" what="$2" pid deadline
  shift 2
  set -m
  "$@" &
  pid=$!
  set +m
  deadline=$(($(date +%s) + seconds))
  while kill -0 "$pid" 2> /dev/null; do
    if [ "$(date +%s)" -ge "$deadline" ]; then
      log "TIMEOUT after ${seconds}s waiting for $what -- terminating it"
      stop_group "$pid"
      return 124
    fi
    sleep 5
  done
  wait "$pid"
}

# 5. One project: serve the function with its Edge file, wait, record the issuer, run, stop.
run_project() {
  local project="$1" label="$2" deadline_s="$3"
  local edge_file="$SCRATCH/edge-$project.env" expected fn_log observed code i s
  expected="$(tr -d '\n' < "$SCRATCH/expected-issuer-$project")"
  fn_log="$EV_DIR/$STEM.bankauth.functions-$project.log"

  log "[$project] serving identity-callback with its Edge file"
  set -m
  (cd apps/supabase/supabase && exec npx --no-install supabase functions serve identity-callback --no-verify-jwt --env-file "$edge_file") > "$fn_log" 2>&1 < /dev/null &
  FN_PID=$!
  set +m

  i=0
  while :; do
    kill -0 "$FN_PID" 2> /dev/null || die "[$project] the function server exited before it was ready; last lines of $fn_log: $(tail -n 5 "$fn_log" | tr '\n' ' ')"
    observed="$(edge_issuer)"
    code="$(options_status identity-callback)"
    if [ "$observed" = "$expected" ]; then
      case "$code" in
        2?? | 3?? | 4??) break ;;
      esac
    fi
    i=$((i + 1))
    [ "$i" -lt 90 ] || die "[$project] waited 180 s for the served identity-callback to carry issuer $expected and answer OPTIONS below 500 (issuer now '${observed:-none}', OPTIONS $code)"
    sleep 2
  done
  log "[$project] identity-callback ready: OPTIONS $code, IDENTITY_PROVIDER_ISSUER=$observed"
  printf '%s\tIDENTITY_PROVIDER_ISSUER=%s\tOPTIONS %s\t%s\n' "$project" "$observed" "$code" "$(date -u +%FT%TZ)" >> "$EDGE_EVIDENCE"

  log "[$project] 174-e2e.sh $label --project $project --require-project $project"
  if [ "$project" = bank-auth-journey ]; then
    # The journey's IdP variables and the scoped TLS bypass exist only inside this subshell, so the
    # wrapper's dev server and the mock issuer Playwright spawns both inherit them and nothing else does.
    run_with_deadline "$deadline_s" "the $label wrapper run" bash -c '. "$1"; PLAYWRIGHT_BANK_AUTH=1 exec bash "$2" "$3" --project "$4" --require-project "$4"' _ "$SCRATCH/journey.env" "$PD/174-e2e.sh" "$label" "$project"
  else
    run_with_deadline "$deadline_s" "the $label wrapper run" env PLAYWRIGHT_BANK_AUTH=1 bash "$PD/174-e2e.sh" "$label" --project "$project" --require-project "$project"
  fi
  s=$?
  log "[$project] 174-e2e.sh exit $s"
  if [ -d "$OUT_DIR/$label" ]; then
    printf 'project: %s\nIDENTITY_PROVIDER_ISSUER=%s\n' "$project" "$observed" > "$OUT_DIR/$label/174-edge-env.txt"
  fi
  if [ "$s" -eq 8 ]; then
    VOID=1
    log "[$project] VOID -- the host was suspended during this run (see $OUT_DIR/$label/VOID-host-suspend.txt); it is not counted as a failure"
  elif [ "$s" -ne 0 ]; then
    FAILED=1
  fi

  stop_function_server
}

run_project bank-auth "$STEM-bank-auth" 600
run_project bank-auth-journey "$STEM-bank-auth-journey" 1200

if [ "$FAILED" -ne 0 ]; then
  log "at least one run did not exit 0"
  exit 1
fi
if [ "$VOID" -ne 0 ]; then
  log "at least one run is VOID (the host was suspended) and none failed -- make the pair again under a new label stem"
  exit 3
fi
log "every run exited 0"
exit 0
