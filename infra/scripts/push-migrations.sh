#!/usr/bin/env bash
#
# push-migrations.sh -- Apply the repository's migrations to one hosted Supabase project, then check it for drift.
#
# A migration applied to a hosted database is never revised by a later push, so this script refuses every wrong target before it calls the Supabase CLI at all, shows what would be applied, and pushes only after the person at the terminal types the project ref.
#
# How it works. Five steps, in this order:
#   1. Refusals. The ref, a confirmed ref and its deployment, the work directory, its link, the password and the PG* address are checked as listed under Prerequisites. A refusal exits 2, and the CLI has not run.
#   2. Dry run. `supabase db push --db-url <address> --dry-run --skip-vault --debug` lists the migrations the project lacks. One `push_pending=<version>` line is printed for each. The address is built from PGUSER, PGHOST, PGPORT and PGDATABASE and holds no password, sslmode or sslrootcert, so the CLI reads PGPASSWORD, PGSSLMODE and PGSSLROOTCERT as psql does and verifies the server exactly as the drift check's psql does. The CLI is never given `--linked`: on it, the CLI connects to the project's direct host whenever that host accepts a TCP connection, and that connection verifies no certificate whatever PGSSLMODE says. The path the address takes is printed as `push_connection=direct` (PGHOST is db.<ref>.supabase.co) or `pooler` (a session pooler host).
#   3. Up to date. When the dry run says the database `is up to date.`, `push_up_to_date=yes` is printed, nothing is pushed, and the script goes on to the drift check. A second run after a push is this case. Otherwise `push_up_to_date=no` is printed.
#   4. Confirmed push. The pending versions and the question `Type the project ref to push to it:` are written to the terminal (/dev/tty, never standard output), and the answer is read from it. Anything but the ref exits 2 and pushes nothing; so does a run with no terminal. A correct answer prints `push_confirmation=terminal`. In the confirmed form, `--confirmed-ref <ref>`, the approval of the GitHub Environment the job runs in stands in for the typed ref: nothing is asked, `push_confirmation=environment` is printed, and the push goes ahead without a terminal. That approval is given when the job starts, before the dry run has listed anything, so unlike the typed ref it is not given with the pending versions in view. The confirmed form is accepted for the deployment `--deployment <key>` names, and only when its value equals `--ref`, infra/envs/<key>/supabase/terraform.tfvars exists and its `project_ref` equals `--ref`, GITHUB_ACTIONS is `true`, OPENVAA_DEPLOY_ENVIRONMENT is the key and GITHUB_REF is `refs/heads/deploy/<key>` or a `refs/heads/deploy-evidence/` branch; otherwise step 1 refuses it. These conditions guard against using the confirmed form by mistake, and prove nothing: each is an environment variable or a file that any process can set, and a repository or organisation variable named DEPLOY_ENVIRONMENT would satisfy the environment condition in any job. For a deployment whose jobs run in its own GitHub Environment, what keeps a push out of every other job's reach is the database password, SUPABASE_DB_PASSWORD, a secret of that environment alone, released only on its approval and given to this script as PGPASSWORD. For a deployment whose jobs name no environment, the trigger branch is the only gate and SUPABASE_DB_PASSWORD is a repository secret: an accepted risk, listed among the accepted risks of infra/README.md. Then `supabase db push --db-url <address> --yes --skip-vault` applies the migrations. The CLI's own question is answered by `--yes`, because without a terminal it applies by itself. The push's status is read directly, never through a pipe, and printed as `push_status=<n>`. No seed is pushed, and no migration older than the project's last one is applied out of order.
#   5. Drift check. infra/scripts/check-drift.sh --target linked --workdir <dir> runs against the same project, and its status decides this script's status. It is printed as `drift_status=<n>`. The drift check reads the history over the PG* variables and refuses to run unless they name the linked project.
#
# Every CLI call passes `--agent no --output-format text`. Called by an agent the CLI answers in JSON, and the text it prints for an up-to-date database is then absent.
#
# The CLI runs in a work directory of its own, linked to the project beforehand, and never in apps/supabase. A link writes the project's service versions into supabase/.temp, and the CLI then starts those versions' images for the work directory's local stack; in apps/supabase that is the stack every worktree of this checkout shares. This script never links.
#
# Usage:
#   ```sh
#   read -rs PGPASSWORD; export PGPASSWORD
#   export PGHOST=db.<ref>.supabase.co PGPORT=5432 PGUSER=postgres PGDATABASE=postgres
#   infra/scripts/push-migrations.sh --ref <ref> --workdir <linked work directory>
#   ```
#
#   In the deploy workflow's job of a deployment's GitHub Environment, which sets the environment variable DEPLOY_ENVIRONMENT to the deployment's key, the same variables come from the environment's secrets and the job sets `OPENVAA_DEPLOY_ENVIRONMENT: ${{ vars.DEPLOY_ENVIRONMENT }}`:
#   ```sh
#   infra/scripts/push-migrations.sh --ref <ref> --workdir <linked work directory> --confirmed-ref <ref> --deployment <key>
#   ```
#
#   --ref <ref>            REQUIRED. The project ref: 20 lower-case letters. The work directory must be linked to this project.
#   --workdir <dir>        REQUIRED. The linked work directory: it holds supabase/config.toml, supabase/migrations and supabase/.temp/project-ref.
#   --manifest <path>      OPTIONAL. The migration manifest, passed to the drift check. Default: the drift check's default.
#   --log-dir <dir>        OPTIONAL. Where the CLI's raw output and the drift check's files are kept. Created when missing. Default: a temporary directory that is kept and named on standard error.
#   --confirmed-ref <ref>  OPTIONAL. Push without asking on the terminal, the environment's approval standing in for the typed ref. Requires --deployment, and is accepted only under the conditions of step 4, which guard against a mistake and are not the boundary; GitHub sets no GITHUB_ENVIRONMENT, so the environment is read from OPENVAA_DEPLOY_ENVIRONMENT.
#   --deployment <key>     REQUIRED with --confirmed-ref. The deployment the confirmed form pushes for: lower-case letters, digits and hyphens, starting with a letter, at most 15 characters, with a file infra/envs/<key>/supabase/terraform.tfvars. Without --confirmed-ref the key and its file are checked and nothing else.
#   -h, --help             Print this header and exit 0.
#
#   A relative path is resolved against the REPO ROOT, never against $PWD, so the script behaves identically from any working directory.
#
#   There is no flag for a database address: the address comes from the PG* variables alone. A command line can be read by every process of the host, so the address the CLI is given holds no password; the CLI and the drift check's psql both read it from PGPASSWORD. Shell tracing must stay off for the same reason.
#
#   The log directory holds the CLI's unredacted debug output, which names the database's address. It is created readable by its owner only; keep it out of the repository.
#
# Output: on standard output, the named result lines `push_connection=`, `push_pending=` (one per pending migration), `push_up_to_date=`, `push_confirmation=environment` or `terminal` and `push_status=` (both only when a push ran) and `drift_status=`, followed by the drift check's report. Progress and the tools' errors go to standard error, the confirmation to the terminal.
#
# Prerequisites. This script ASSERTS them; it never performs them:
#   1. `--ref` is 20 lower-case letters. A `--deployment` key is well formed and has a supabase/terraform.tfvars under infra/envs/<key>. A `--confirmed-ref` equals `--ref`, comes with a `--deployment` whose tfvars `project_ref` equals `--ref`, and is given only with GITHUB_ACTIONS=true, OPENVAA_DEPLOY_ENVIRONMENT set to the key and a GITHUB_REF of `refs/heads/deploy/<key>` or `refs/heads/deploy-evidence/<name>`.
#   2. The work directory is not apps/supabase, and it holds supabase/migrations.
#   3. The work directory is linked: supabase/.temp/project-ref exists and holds the ref given by `--ref`. This, the shared-stack refusal of prerequisite 2 and the PG* host, user, port and variable rules of prerequisite 4 are the project-identity rule of scripts/lib/hosted-target.sh, which the drift check applies too; the owner role, the port's form and PGDATABASE are this script's own.
#   4. PGPASSWORD is set and not empty, and PGHOSTADDR and PGSERVICE are unset. PGHOST names the project: either the direct host db.<ref>.supabase.co with PGUSER `postgres`, or one session pooler host <name>.pooler.supabase.com with PGUSER `postgres.<ref>`. PGPORT (default 5432) is not 6543, the transaction pooler, and PGDATABASE (default `postgres`) is a plain name. The TLS mode is not asserted: PGSSLMODE and PGSSLROOTCERT apply to the CLI and psql alike, and the deploy workflow sets `verify-full` with the committed Supabase root.
#   5. `yarn install` has run: the CLI is node_modules/.bin/supabase of the repository root.
#   6. The drift check's own prerequisites: Docker is running, and the PG* variables of prerequisite 4 name the linked project, which it asserts again itself, after the push.
#
# Exit codes -- the caller must be able to branch on the status alone:
#   0:  the migrations were applied, or the database was already up to date, and the drift check found no drift
#   1:  the drift check found drift after the push
#   2:  refused, and nothing was pushed: a usage error, a wrong or unlinked target, no password, no CLI, no terminal, a typed answer that is not the ref, a malformed `--deployment` or one with no supabase tfvars, or a `--confirmed-ref` that is not `--ref`, given without `--deployment`, for a deployment whose `project_ref` is not `--ref`, outside a GitHub Actions job (GITHUB_ACTIONS is not `true`), outside a job of the deployment's environment (OPENVAA_DEPLOY_ENVIRONMENT is not the key) or on a ref the deployment admits no deploy from (GITHUB_REF is neither `refs/heads/deploy/<key>` nor a `refs/heads/deploy-evidence/` branch)
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
SCRIPT_NAME="push-migrations.sh"
# shellcheck source=../../scripts/lib/cli.sh
. "$REPO_ROOT/scripts/lib/cli.sh"
# shellcheck source=../../scripts/lib/redact.sh
. "$REPO_ROOT/scripts/lib/redact.sh"
# shellcheck source=../../scripts/lib/hosted-target.sh
. "$REPO_ROOT/scripts/lib/hosted-target.sh"

CONFIRM_PROMPT="Type the project ref to push to it:"
UP_TO_DATE_TEXT="is up to date."
DEPLOYMENT_KEY_MAX_LENGTH=15
INTERRUPT_GRACE_SECONDS=10

REF=""
WORKDIR=""
MANIFEST=""
LOG_DIR=""
CONFIRMED_REF=""
DEPLOYMENT=""
CHILD_PID=""
CHILD_IS_CLI=0

# Prints a directory's physical path, or the path unchanged when it is not a directory.
physical_path() {
  if [ -d "$1" ]; then
    (cd "$1" && pwd -P)
  else
    printf '%s\n' "$1"
  fi
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
    --deployment)
      require_value --deployment $#
      if [ -z "$2" ]; then
        usage_error "--deployment requires a value"
      fi
      DEPLOYMENT="$2"
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
DEPLOYMENT_TFVARS=""
if [ -n "$DEPLOYMENT" ]; then
  # The pattern admits no `/` and no `.`, so the key cannot leave infra/envs.
  if ! [[ "$DEPLOYMENT" =~ ^[a-z][a-z0-9-]*$ ]]; then
    fatal "--deployment must be a deployment key of lower-case letters, digits and hyphens, starting with a letter; got '$DEPLOYMENT'; nothing was pushed" 2
  fi
  if [ "${#DEPLOYMENT}" -gt "$DEPLOYMENT_KEY_MAX_LENGTH" ]; then
    fatal "--deployment must be at most $DEPLOYMENT_KEY_MAX_LENGTH characters; got '$DEPLOYMENT' (${#DEPLOYMENT}); nothing was pushed" 2
  fi
  DEPLOYMENT_TFVARS="infra/envs/$DEPLOYMENT/supabase/terraform.tfvars"
  if [ ! -f "$REPO_ROOT/$DEPLOYMENT_TFVARS" ] || [ ! -r "$REPO_ROOT/$DEPLOYMENT_TFVARS" ]; then
    fatal "--deployment '$DEPLOYMENT' has no readable $DEPLOYMENT_TFVARS; nothing was pushed" 2
  fi
fi
if [ -n "$CONFIRMED_REF" ]; then
  if [ "$CONFIRMED_REF" != "$REF" ]; then
    fatal "--confirmed-ref '$CONFIRMED_REF' is not --ref '$REF'; nothing was pushed" 2
  fi
  if [ -z "$DEPLOYMENT" ]; then
    fatal "--confirmed-ref requires --deployment, the key of the deployment it pushes for; nothing was pushed" 2
  fi
  DEPLOYMENT_REF="$(tfvar_value "$REPO_ROOT/$DEPLOYMENT_TFVARS" project_ref)" ||
    fatal "$DEPLOYMENT_TFVARS does not assign project_ref exactly once as a quoted string; nothing was pushed" 2
  if [ "$DEPLOYMENT_REF" != "$REF" ]; then
    fatal "--ref '$REF' is not the project_ref '$DEPLOYMENT_REF' of $DEPLOYMENT_TFVARS; nothing was pushed" 2
  fi
  if [ "${GITHUB_ACTIONS:-}" != "true" ]; then
    fatal "--confirmed-ref is accepted only in a GitHub Actions job, and GITHUB_ACTIONS is not true; nothing was pushed" 2
  fi
  if [ "${OPENVAA_DEPLOY_ENVIRONMENT:-}" != "$DEPLOYMENT" ]; then
    fatal "--confirmed-ref is accepted only in a job of the $DEPLOYMENT environment, which sets DEPLOY_ENVIRONMENT, passed by the workflow as OPENVAA_DEPLOY_ENVIRONMENT; OPENVAA_DEPLOY_ENVIRONMENT is '${OPENVAA_DEPLOY_ENVIRONMENT:-}'; nothing was pushed" 2
  fi
  if [ "${GITHUB_REF:-}" != "refs/heads/deploy/$DEPLOYMENT" ]; then
    case "${GITHUB_REF:-}" in
      refs/heads/deploy-evidence/?*) ;;
      *)
        fatal "--confirmed-ref is accepted only on refs/heads/deploy/$DEPLOYMENT or a refs/heads/deploy-evidence/ branch; GITHUB_REF is '${GITHUB_REF:-}'; nothing was pushed" 2
        ;;
    esac
  fi
fi

WORKDIR="$(physical_path "$(resolve_path "$WORKDIR")")"
if [ ! -d "$WORKDIR/supabase/migrations" ]; then
  fatal "the work directory holds no supabase/migrations: $WORKDIR" 2
fi
if [ -z "${PGPASSWORD:-}" ]; then
  fatal "PGPASSWORD is unset or empty; the CLI and the drift check both read the database password from it" 2
fi
PGPORT="${PGPORT:-5432}"
PGDATABASE="${PGDATABASE:-postgres}"
assert_linked_project_target "$WORKDIR" "$REF"
PUSH_CONNECTION="$LINKED_CONNECTION"
if [ "$PUSH_CONNECTION" = direct ] && [ "${PGUSER:-}" != "postgres" ]; then
  fatal "PGHOST is the direct host, and PGUSER '${PGUSER:-}' is not postgres; nothing was pushed" 2
fi
if [ "$PUSH_CONNECTION" = pooler ] && [ "${PGUSER:-}" != "postgres.$REF" ]; then
  fatal "PGHOST is a session pooler host, and PGUSER '${PGUSER:-}' is not postgres.$REF; nothing was pushed" 2
fi
if ! [[ "$PGPORT" =~ ^[0-9]+$ ]]; then
  fatal "PGPORT '$PGPORT' is not a port; nothing was pushed" 2
fi
if ! [[ "$PGDATABASE" =~ ^[A-Za-z0-9_]+$ ]]; then
  fatal "PGDATABASE '$PGDATABASE' is not a plain database name; nothing was pushed" 2
fi
export PGPORT PGDATABASE
# The CLI is given this address and never --linked: on --linked it connects to the direct host whenever that host accepts a TCP connection, and that connection verifies no certificate whatever PGSSLMODE says. Given an address with no sslmode, sslrootcert or password in it, the CLI reads PGSSLMODE, PGSSLROOTCERT and PGPASSWORD as psql does, so the push and the drift check meet the same verification.
DB_URL="postgresql://$PGUSER@$PGHOST:$PGPORT/$PGDATABASE"
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

# Runs one command in the background and waits for it, so that a signal reaches the trap while it runs. $1 = 1 for a CLI call, 0 for the drift check; $2 and $3 = the files for its standard output and standard error, or both - for this script's own; the rest is the command. With both -, the command writes through the descriptors it inherits and no stream is reopened by path, because reopening a socket through the descriptor directory fails on Linux. With two files, the redirections are the command's alone, so that the trap's message still reaches this script's standard error. A single - beside a file is refused. Standard input is the null device either way. The status is the command's.
run_child() {
  local status=0 out="$2" err="$3"
  CHILD_IS_CLI="$1"
  shift 3
  if [ "$out" = "-" ] && [ "$err" = "-" ]; then
    "$@" </dev/null &
  elif [ "$out" = "-" ] || [ "$err" = "-" ]; then
    fatal "run_child takes two files or two -, not one of each" 2
  else
    "$@" </dev/null >"$out" 2>"$err" &
  fi
  CHILD_PID=$!
  wait "$CHILD_PID" || status=$?
  CHILD_PID=""
  return "$status"
}

# --- step 2: dry run ---------------------------------------------------------------

DRY_OUT="$LOG_DIR/dry-run.stdout"
DRY_LOG="$LOG_DIR/dry-run.stderr"
dry_status=0
note "dry run: supabase db push --db-url <the PG* address> --dry-run"
run_child 1 "$DRY_OUT" "$DRY_LOG" "$CLI" db push --db-url "$DB_URL" --dry-run --skip-vault --debug --workdir "$WORKDIR" --agent no --output-format text || dry_status=$?

echo "push_connection=$PUSH_CONNECTION"

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
  note "push: supabase db push --db-url"
  run_child 1 "$LOG_DIR/push.stdout" "$LOG_DIR/push.stderr" "$CLI" db push --db-url "$DB_URL" --yes --skip-vault --workdir "$WORKDIR" --agent no --output-format text || push_status=$?
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
