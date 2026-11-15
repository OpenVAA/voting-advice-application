#!/usr/bin/env bash
#
# push-migrations.sh -- Apply the repository's migrations to one hosted Supabase project, then check it for drift.
#
# A migration applied to a hosted database is never revised by a later push, so this script refuses every wrong target before it calls the Supabase CLI at all, shows what would be applied, and pushes only after the person at the terminal types the project ref.
#
# How it works. Five steps, in this order:
#   1. Refusals. The ref, the work directory, its link and the password are checked as listed under Prerequisites. A refusal exits 2, and the CLI has not run.
#   2. Dry run. `supabase db push --linked --dry-run --skip-vault --debug` lists the migrations the project lacks. One `push_pending=<version>` line is printed for each. The debug log tells which path the CLI took to the database, printed as `push_connection=direct`, `pooler` or `unknown`.
#   3. Up to date. When the dry run says the database `is up to date.`, `push_up_to_date=yes` is printed, nothing is pushed, and the script goes on to the drift check. A second run after a push is this case. Otherwise `push_up_to_date=no` is printed.
#   4. Confirmed push. The pending versions and the question `Type the project ref to push to it:` are written to the terminal (/dev/tty, never standard output), and the answer is read from it. Anything but the ref exits 2 and pushes nothing; so does a run with no terminal. Then `supabase db push --linked --yes --skip-vault` applies the migrations. The CLI's own question is answered by `--yes`, because without a terminal it applies by itself. The push's status is read directly, never through a pipe, and printed as `push_status=<n>`. No seed is pushed, and no migration older than the project's last one is applied out of order.
#   5. Drift check. infra/scripts/check-drift.sh --target linked --workdir <dir> runs against the same project, and its status decides this script's status. It is printed as `drift_status=<n>`. The drift check reads the history over the PG* variables and refuses to run unless they name the linked project.
#
# Every CLI call passes `--agent no --output-format text`. Called by an agent the CLI answers in JSON, and the text it prints for an up-to-date database is then absent.
#
# The CLI runs in a work directory of its own, linked to the project beforehand, and never in apps/supabase. A link writes the project's service versions into supabase/.temp, and the CLI then starts those versions' images for the work directory's local stack; in apps/supabase that is the stack every worktree of this checkout shares. This script never links.
#
# Usage:
#   ```sh
#   read -rs SUPABASE_DB_PASSWORD; export SUPABASE_DB_PASSWORD PGPASSWORD="$SUPABASE_DB_PASSWORD"
#   export PGHOST=db.<ref>.supabase.co PGPORT=5432 PGUSER=postgres PGDATABASE=postgres
#   infra/scripts/push-migrations.sh --ref <ref> --workdir <linked work directory>
#   ```
#
#   --ref <ref>            REQUIRED. The project ref: 20 lower-case letters. The work directory must be linked to this project.
#   --workdir <dir>        REQUIRED. The linked work directory: it holds supabase/config.toml, supabase/migrations and supabase/.temp/project-ref.
#   --manifest <path>      OPTIONAL. The migration manifest, passed to the drift check. Default: the drift check's default.
#   --log-dir <dir>        OPTIONAL. Where the CLI's raw output and the drift check's files are kept. Created when missing. Default: a temporary directory that is kept and named on standard error.
#   -h, --help             Print this header and exit 0.
#
#   A relative path is resolved against the REPO ROOT, never against $PWD, so the script behaves identically from any working directory.
#
#   There is no flag for a database address. An address on a command line holds the password, and a command line can be read by every process of the host. The password comes from SUPABASE_DB_PASSWORD, for the CLI, and from PGPASSWORD or a password file, for the drift check's psql. Shell tracing must stay off for the same reason.
#
#   The log directory holds the CLI's unredacted debug output, which names the database's address. It is created readable by its owner only; keep it out of the repository.
#
# Output: on standard output, the named result lines `push_connection=`, `push_pending=` (one per pending migration), `push_up_to_date=`, `push_status=` (only when a push ran) and `drift_status=`, followed by the drift check's report. Progress and the tools' errors go to standard error, the confirmation to the terminal.
#
# Prerequisites. This script ASSERTS them; it never performs them:
#   1. `--ref` is 20 lower-case letters.
#   2. The work directory is not apps/supabase, and it holds supabase/migrations.
#   3. The work directory is linked: supabase/.temp/project-ref exists and holds the ref given by `--ref`.
#   4. SUPABASE_DB_PASSWORD is set and not empty. Without it the CLI signs in through a temporary login role it creates, instead of as `postgres`.
#   5. `yarn install` has run: the CLI is node_modules/.bin/supabase of the repository root.
#   6. The drift check's own prerequisites: its PG* variables name the linked project, and Docker is running. It asserts them itself, after the push.
#
# Exit codes -- the caller must be able to branch on the status alone:
#   0:  the migrations were applied, or the database was already up to date, and the drift check found no drift
#   1:  the drift check found drift after the push
#   2:  refused, and nothing was pushed: a usage error, a wrong or unlinked target, no password, no CLI, no terminal, or a typed answer that is not the ref
#   3:  the dry run or the push failed. After a failed push the database may hold some of the pending migrations; run the script again to see which
#   4:  pushed or already up to date, and the drift check could not run
#   130:  interrupted (SIGINT/SIGTERM/SIGHUP). Never 0. A CLI call still running 10 seconds after the interrupt is killed outright; the drift check is waited for, so that it removes its shadow database; after an interrupted push, run the script again to see what the database lacks

set -euo pipefail

export LC_ALL=C

# Auto-detect paths from the script's location, so the script behaves identically from any working directory.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd -P)"
CLI="$REPO_ROOT/node_modules/.bin/supabase"
DRIFT_CHECK="$SCRIPT_DIR/check-drift.sh"

SHARED_STACK_WORKDIR="$REPO_ROOT/apps/supabase"
CONFIRM_PROMPT="Type the project ref to push to it:"
UP_TO_DATE_TEXT="is up to date."
CONFIRMING_ENVIRONMENT="staging"
INTERRUPT_GRACE_SECONDS=10

REF=""
WORKDIR=""
MANIFEST=""
LOG_DIR=""
CONFIRMED_REF=""
CHILD_PID=""
CHILD_IS_CLI=0

usage() {
  # Delimit the header block rather than hardcoding a line range, so the exit-code table is never truncated when the header grows.
  sed -n '2,/^set -euo pipefail/p' "${BASH_SOURCE[0]}" | sed '$d'
}

fatal() {
  echo "push-migrations.sh: FATAL -- $1" >&2
  exit "$2"
}

usage_error() {
  usage >&2
  fatal "$1" 2
}

note() {
  echo "push-migrations.sh: $1" >&2
}

# $1 = flag name, $2 = the caller's remaining argument count ($#).
require_value() {
  if [ "$2" -lt 2 ]; then
    usage_error "$1 requires a value"
  fi
}

resolve_path() {
  case "$1" in
    /*) printf '%s\n' "$1" ;;
    *) printf '%s\n' "$REPO_ROOT/$1" ;;
  esac
}

# Prints a directory's physical path, or the path unchanged when it is not a directory.
physical_path() {
  if [ -d "$1" ]; then
    (cd "$1" && pwd -P)
  else
    printf '%s\n' "$1"
  fi
}

# Prints a tool's output without credentials, as check-drift.sh does. $1 = file.
print_redacted() {
  sed -E \
    -e '/[Ss][Ee][Cc][Rr][Ee][Tt]|_KEY|[Pp][Aa][Ss][Ss][Ww][Oo][Rr][Dd]=/s/.*/<a line naming a key, a secret or a password value was removed>/' \
    -e '/:\/\/[^[:space:]]*@/s/.*/<a line holding an address with a user part was removed>/' \
    -e 's/eyJ[A-Za-z0-9_-]{10,}(\.[A-Za-z0-9_-]+)*/<redacted>/g' \
    -e 's/sb_(secret|publishable)_[A-Za-z0-9_-]+/<redacted>/g' \
    "$1"
}

# Prints the id of every process below $1.
descendants() {
  local child
  for child in $(pgrep -P "$1" 2>/dev/null || true); do
    echo "$child"
    descendants "$child"
  done
}

# The CLI is a wrapper around a binary, so SIGTERM goes to every process below the child as well. The binary can ignore SIGTERM while it waits on the network, so a CLI call still running after the grace period is killed outright. The drift check is only sent SIGTERM and waited for: it removes its shadow database before it exits.
on_interrupt() {
  local pid pids waited=0
  trap '' INT TERM HUP
  if [ -n "$CHILD_PID" ]; then
    pids="$(descendants "$CHILD_PID") $CHILD_PID"
    if [ "$CHILD_IS_CLI" -eq 1 ]; then
      for pid in $pids; do
        kill -TERM "$pid" 2>/dev/null || true
      done
      while kill -0 "$CHILD_PID" 2>/dev/null && [ "$waited" -lt "$INTERRUPT_GRACE_SECONDS" ]; do
        sleep 1
        waited=$((waited + 1))
      done
      for pid in $pids; do
        kill -KILL "$pid" 2>/dev/null || true
      done
    else
      kill -TERM "$CHILD_PID" 2>/dev/null || true
    fi
    wait "$CHILD_PID" 2>/dev/null || true
  fi
  echo "push-migrations.sh: FATAL -- interrupted" >&2
  exit 130
}

trap on_interrupt INT TERM HUP

# --- argument parsing --------------------------------------------------------------

while [ $# -gt 0 ]; do
  case "$1" in
    --ref)
      require_value --ref $#
      REF="$2"
      shift 2
      ;;
    --workdir)
      require_value --workdir $#
      WORKDIR="$2"
      shift 2
      ;;
    --manifest)
      require_value --manifest $#
      MANIFEST="$2"
      shift 2
      ;;
    --log-dir)
      require_value --log-dir $#
      LOG_DIR="$2"
      shift 2
      ;;
    --confirmed-ref)
      require_value --confirmed-ref $#
      if [ -z "$2" ]; then
        usage_error "--confirmed-ref requires a value"
      fi
      CONFIRMED_REF="$2"
      shift 2
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

# --- refusals: nothing is called and nothing is written before all of them hold ------

if [ -z "$REF" ]; then
  usage_error "--ref is required"
fi
if [ -z "$WORKDIR" ]; then
  usage_error "--workdir is required"
fi
if ! [[ "$REF" =~ ^[a-z]{20}$ ]]; then
  fatal "--ref must be a project ref, 20 lower-case letters; got '$REF'" 2
fi
if [ -n "$CONFIRMED_REF" ]; then
  if [ "$CONFIRMED_REF" != "$REF" ]; then
    fatal "--confirmed-ref '$CONFIRMED_REF' is not --ref '$REF'; nothing was pushed" 2
  fi
  if [ "${GITHUB_ACTIONS:-}" != "true" ]; then
    fatal "--confirmed-ref is accepted only in a GitHub Actions job, and GITHUB_ACTIONS is not true; nothing was pushed" 2
  fi
  if [ "${OPENVAA_DEPLOY_ENVIRONMENT:-}" != "$CONFIRMING_ENVIRONMENT" ]; then
    fatal "--confirmed-ref is accepted only in a job of the $CONFIRMING_ENVIRONMENT environment, which sets DEPLOY_ENVIRONMENT, passed by the workflow as OPENVAA_DEPLOY_ENVIRONMENT; OPENVAA_DEPLOY_ENVIRONMENT is '${OPENVAA_DEPLOY_ENVIRONMENT:-}'; nothing was pushed" 2
  fi
fi

WORKDIR="$(physical_path "$(resolve_path "$WORKDIR")")"
if [ "$WORKDIR" = "$(physical_path "$SHARED_STACK_WORKDIR")" ]; then
  fatal "the work directory is apps/supabase, the shared local stack's work directory; a link there changes the images that stack starts. Link and push from a work directory of its own" 2
fi
if [ ! -d "$WORKDIR/supabase/migrations" ]; then
  fatal "the work directory holds no supabase/migrations: $WORKDIR" 2
fi
REF_FILE="$WORKDIR/supabase/.temp/project-ref"
if [ ! -f "$REF_FILE" ]; then
  fatal "the work directory is not linked: it holds no supabase/.temp/project-ref: $WORKDIR" 2
fi
LINKED_REF=""
IFS= read -r LINKED_REF <"$REF_FILE" || true
if [ "$LINKED_REF" != "$REF" ]; then
  fatal "the work directory is linked to the project '$LINKED_REF', and --ref is '$REF'; nothing was pushed" 2
fi
if [ -z "${SUPABASE_DB_PASSWORD:-}" ]; then
  fatal "SUPABASE_DB_PASSWORD is unset or empty; without it the CLI signs in through a temporary login role instead of as postgres" 2
fi
if [ -n "$MANIFEST" ]; then
  MANIFEST="$(resolve_path "$MANIFEST")"
  if [ ! -f "$MANIFEST" ] || [ ! -r "$MANIFEST" ]; then
    fatal "the manifest is not a readable file: $MANIFEST" 2
  fi
fi
if [ ! -x "$CLI" ]; then
  fatal "the Supabase CLI is not at $CLI; run yarn install" 2
fi
if [ ! -f "$DRIFT_CHECK" ]; then
  fatal "the drift check is not at $DRIFT_CHECK" 2
fi
if ! command -v pgrep >/dev/null 2>&1; then
  fatal "pgrep is not on PATH" 2
fi

# The log directory holds the CLI's debug output, which names the database's address.
umask 077
if [ -n "$LOG_DIR" ]; then
  LOG_DIR="$(resolve_path "$LOG_DIR")"
  mkdir -p "$LOG_DIR" || fatal "could not create $LOG_DIR" 2
else
  TMP_BASE="${TMPDIR:-/tmp}"
  LOG_DIR="$(mktemp -d "${TMP_BASE%/}/push-migrations.XXXXXX")" || fatal "could not create a temporary directory" 2
fi
note "the CLI's output is kept in $LOG_DIR"

# Runs one command in the background and waits for it, so that a signal reaches the trap while it runs. $1 = 1 for a CLI call, 0 for the drift check; $2 and $3 = the files for its standard output and standard error, or - for this script's own; the rest is the command. The redirections are the command's alone, so that the trap's message still reaches this script's standard error. The status is the command's.
run_child() {
  local status=0 out="$2" err="$3"
  CHILD_IS_CLI="$1"
  shift 3
  [ "$out" = "-" ] && out=/dev/fd/1
  [ "$err" = "-" ] && err=/dev/fd/2
  "$@" </dev/null >"$out" 2>"$err" &
  CHILD_PID=$!
  wait "$CHILD_PID" || status=$?
  CHILD_PID=""
  return "$status"
}

# --- step 2: dry run ---------------------------------------------------------------

DRY_OUT="$LOG_DIR/dry-run.stdout"
DRY_LOG="$LOG_DIR/dry-run.stderr"
dry_status=0
note "dry run: supabase db push --linked --dry-run"
run_child 1 "$DRY_OUT" "$DRY_LOG" "$CLI" db push --linked --dry-run --skip-vault --debug --workdir "$WORKDIR" --agent no --output-format text || dry_status=$?

if grep -q -F -- "Resolved DNS" "$DRY_LOG" "$DRY_OUT"; then
  echo "push_connection=direct"
elif grep -q -F -- "Using connection pooler" "$DRY_LOG" "$DRY_OUT"; then
  echo "push_connection=pooler"
else
  echo "push_connection=unknown"
fi

if [ "$dry_status" -ne 0 ]; then
  print_redacted "$DRY_LOG" >&2 || true
  fatal "the dry run exited $dry_status; nothing was pushed" 3
fi

# The listed migrations are lines that hold one file name and at most a bullet; colour codes are removed first.
PENDING="$LOG_DIR/pending.txt"
cat "$DRY_OUT" "$DRY_LOG" |
  sed -E $'s/\x1b\\[[0-9;]*m//g' |
  sed -n -E 's/^[[:space:]]*([^[:alnum:][:space:]]+[[:space:]]*)?([0-9]{5})_[A-Za-z0-9_.-]+\.sql[[:space:]]*$/\2/p' |
  awk '!seen[$0]++' >"$PENDING"
while IFS= read -r version; do
  echo "push_pending=$version"
done <"$PENDING"

# --- step 3 and 4: up to date, or a confirmed push ---------------------------------

if grep -q -F -- "$UP_TO_DATE_TEXT" "$DRY_OUT" "$DRY_LOG"; then
  echo "push_up_to_date=yes"
else
  echo "push_up_to_date=no"
  if [ ! -s "$PENDING" ]; then
    print_redacted "$DRY_OUT" >&2 || true
    fatal "the dry run neither said the database is up to date nor listed a migration; nothing was pushed. Its output is in $LOG_DIR" 2
  fi
  if [ -n "$CONFIRMED_REF" ]; then
    echo "push_confirmation=environment"
  else
    if ! (: <>/dev/tty) 2>/dev/null; then
      fatal "there is no terminal to confirm the push on; nothing was pushed" 2
    fi
    {
      echo "The project $REF lacks these migrations:"
      sed 's/^/  /' "$PENDING"
      printf '%s ' "$CONFIRM_PROMPT"
    } >/dev/tty
    answer=""
    IFS= read -r answer </dev/tty || true
    if [ "$answer" != "$REF" ]; then
      fatal "the answer is not the project ref; nothing was pushed" 2
    fi
    echo "push_confirmation=terminal"
  fi

  push_status=0
  note "push: supabase db push --linked"
  run_child 1 "$LOG_DIR/push.stdout" "$LOG_DIR/push.stderr" "$CLI" db push --linked --yes --skip-vault --workdir "$WORKDIR" --agent no --output-format text || push_status=$?
  echo "push_status=$push_status"
  if [ "$push_status" -ne 0 ]; then
    print_redacted "$LOG_DIR/push.stderr" >&2 || true
    fatal "the push exited $push_status; run the script again to see what the database lacks" 3
  fi
fi

# --- step 5: drift check -----------------------------------------------------------

drift_args=(--target linked --workdir "$WORKDIR" --out "$LOG_DIR/drift")
if [ -n "$MANIFEST" ]; then
  drift_args+=(--manifest "$MANIFEST")
fi
drift_status=0
run_child 0 - - bash "$DRIFT_CHECK" "${drift_args[@]}" || drift_status=$?
echo "drift_status=$drift_status"

case "$drift_status" in
  0) exit 0 ;;
  1) exit 1 ;;
  130) exit 130 ;;
  *) exit 4 ;;
esac
