#!/usr/bin/env bash
#
# check-drift.sh -- Report whether a database is still what the repository's migrations describe.
#
# A database can leave the repository behind in two ways: its migration history is not the list the manifest records, or its schema was changed by a statement that no migration holds. This script checks both and sets its own exit status, because neither tool it uses has a status for "they differ": `supabase db diff` exits 0 with and without a difference.
#
# How it checks. Two parts, one status. Once the prerequisites below hold, both parts always run, so one report shows both.
#   History. The versions of the manifest are the five digits that begin each migrations[].file, in the manifest's order. They must equal, as an ordered list, the versions in supabase_migrations.schema_migrations (column `version`, in order), read with psql over the connection the PG* variables give. A version that is on one side only is named. A database without that table has no history, and every version of the manifest is then reported.
#   Schema. `supabase db diff` builds a shadow database from the work directory's supabase/migrations and compares the target with it. The script selects the CLI's text output, in which a database that equals its migrations gives no standard output at all. It writes that output to a file and tests the file's size: any byte is drift, and the file, the SQL that would turn the migrations' schema into the database's, is printed. An empty file counts as clean only when the CLI also says `No schema changes found`.
#
# The output format is selected because the CLI detects its caller. Called by an agent it answers in JSON, and standard output is then never empty; `--agent no --output-format text` gives every caller the same output.
#
# No schema list is given to the diff, so the CLI's default set is compared. On a local database that set covers `public`, `private`, the policies on storage.objects and a schema created by hand. `--schema public,private,storage` does not cover the last.
#
# What this check cannot see. The schema part is the CLI's diff with its default engine, and the diff stays empty for each of these:
#   - The rows of a table.
#   - Column privileges: a GRANT or REVOKE that names columns.
#   - A comment.
#   - Role settings: ALTER ROLE ... SET.
# A table privilege and a policy whose USING expression was changed are reported. The four above are compared between migrations/ and schema/ by apps/supabase/scripts/check-schema-equivalence.sh, in two built databases. On a deployed database only a probe that queries the catalog sees them, and this script is not that probe. The history part compares versions only: a migration whose file was edited after it was applied keeps its version, and the edit is found only as far as it changed something the diff sees.
#
# Usage:
#   ```sh
#   set -a; eval "$(apps/supabase/scripts/isolated-instance.sh env --name probe)"; set +a
#   infra/scripts/check-drift.sh --workdir "$ISO_WORKDIR" --manifest "$ISO_WORKDIR/migrations.manifest.json"
#   infra/scripts/check-drift.sh --target linked --out tmp/drift
#   ```
#
#   --manifest <path>      OPTIONAL. The migration manifest. Default: apps/supabase/supabase/migrations.manifest.json.
#   --workdir <dir>        OPTIONAL. The Supabase work directory: the directory that holds supabase/config.toml and supabase/migrations. Default: apps/supabase.
#   --target local|linked  OPTIONAL. Which database the diff compares, passed to the CLI as --local or --linked. Default: local.
#   --out <dir>            OPTIONAL. Where history.manifest.txt, history.database.txt, schema.diff.sql and schema.diff.log are kept. Created when missing. Default: a temporary directory that is removed when the script exits.
#   -h, --help             Print this header and exit 0.
#
#   A relative path is resolved against the REPO ROOT, never against $PWD, so the script behaves identically from any working directory.
#
#   There is no flag for a database address. An address on a command line holds the password, and a command line can be read by every process of the host. Shell tracing must stay off for the same reason.
#
# Output: on standard output, the two version lists, one line for each part, every finding, and the verdict. Progress and the tools' own errors go to standard error.
#
# Prerequisites. This script ASSERTS them; it never performs them:
#   1. `yarn install` has run: the CLI is node_modules/.bin/supabase of the repository root, and `node` is on PATH.
#   2. `psql` and `pgrep` are on PATH.
#   3. Docker is running. The diff starts a shadow database in it, published on the shadow_port of the work directory's config.toml and labelled with that file's project id, and removes it before it returns. With the default work directory those are the port and the project id of this checkout's local stack. On an interrupt the script stops the CLI and waits until the shadow database is gone. A script killed outright (SIGKILL) leaves it running, and the next diff fails until that container is removed.
#   4. The PG* variables (PGHOST, PGPORT, PGUSER, PGDATABASE, and PGPASSWORD or a password file) name the database the target names. For `--target local` the script refuses to run unless PGHOST is a loopback address and PGPORT is the [db] port of the work directory's config.toml, so that the two parts cannot judge two different databases. For `--target linked` it cannot tell, and the caller answers for it.
#   5. For `--target linked`: the work directory is linked to the project and the CLI can sign in to its database.
#
# Exit codes -- the caller must be able to branch on the status alone:
#   0:  both parts hold: the history equals the manifest and the diff is empty
#   1:  drift: the history differs from the manifest, or the diff is not empty, or both. Every finding is printed. A part that found drift decides the status even when the other part could not run
#   2:  the check could not run, and no part found drift: a usage error, a manifest that is missing or cannot be read, a missing tool, a connection that is not the target's, or psql or the CLI failing
#   130:  interrupted (SIGINT/SIGTERM/SIGHUP). Never 0.

set -euo pipefail

# Version strings sort byte by byte, here and in the query.
export LC_ALL=C

# Auto-detect paths from the script's location, so the script behaves identically from any working directory.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd -P)"
CLI="$REPO_ROOT/node_modules/.bin/supabase"

DEFAULT_MANIFEST="apps/supabase/supabase/migrations.manifest.json"
DEFAULT_WORKDIR="apps/supabase"

HISTORY_TABLE="supabase_migrations.schema_migrations"
# What the CLI writes to standard error when the diff is empty.
NO_CHANGE_LINE="No schema changes found"
# A connection attempt that gets no answer must end, or the check never returns a status.
DEFAULT_CONNECT_TIMEOUT=15

MANIFEST=""
WORKDIR=""
TARGET="local"
OUT_DIR=""
TEMP_OUT=""
CLI_PID=""

usage() {
  # Delimit the header block rather than hardcoding a line range, so the exit-code table is never truncated when the header grows.
  sed -n '2,/^set -euo pipefail/p' "${BASH_SOURCE[0]}" | sed '$d'
}

fatal() {
  echo "check-drift.sh: FATAL -- $1" >&2
  exit "$2"
}

usage_error() {
  usage >&2
  fatal "$1" 2
}

note() {
  echo "check-drift.sh: $1" >&2
}

say() {
  echo "check-drift.sh: $1"
}

# A value-taking flag given as the LAST argument must be a usage error. `shift 2` with one positional left fails, and under `set -e` the script would die with status 1, which the table above gives to drift.
#
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

# Prints the value of one key of a configuration file. $1 = file, $2 = section header without spaces, $3 = key.
toml_value() {
  awk -v want="$2" -v key="$3" '
    BEGIN { section = "" }
    /^[[:space:]]*\[/ { section = $0; gsub(/[[:space:]]/, "", section); next }
    section == want {
      line = $0
      if (line ~ ("^[[:space:]]*" key "[[:space:]]*=")) {
        sub(/^[^=]*=[[:space:]]*/, "", line)
        sub(/[[:space:]]*(#.*)?$/, "", line)
        gsub(/"/, "", line)
        print line
        exit
      }
    }
  ' "$1"
}

# Prints a tool's output without credentials. A line that names a key or a secret, or that holds an address with a user part, is dropped whole; anything shaped like a JWT or a Supabase API key is removed from the lines that remain. The word `password` alone drops nothing: psql's commonest error is "password authentication failed", and it holds no password. $1 = file.
print_redacted() {
  sed -E \
    -e '/[Ss][Ee][Cc][Rr][Ee][Tt]|_KEY/s/.*/<a line naming a key or a secret was removed>/' \
    -e '/:\/\/[^[:space:]]*@/s/.*/<a line holding an address with a user part was removed>/' \
    -e 's/eyJ[A-Za-z0-9_-]{10,}(\.[A-Za-z0-9_-]+)*/<redacted>/g' \
    -e 's/sb_(secret|publishable)_[A-Za-z0-9_-]+/<redacted>/g' \
    "$1"
}

on_exit() {
  local status=$?
  trap - EXIT
  if [ -n "$TEMP_OUT" ]; then
    rm -rf -- "$TEMP_OUT" || true
  fi
  exit "$status"
}

# Prints the id of every process below $1.
descendants() {
  local child
  for child in $(pgrep -P "$1" 2>/dev/null || true); do
    echo "$child"
    descendants "$child"
  done
}

# The CLI is a wrapper around a binary, and only the binary removes the shadow database. A signal sent to the wrapper alone ends both and leaves the shadow database running, so SIGTERM goes to every process below the wrapper as well, and the wrapper is waited for. SIGTERM is sent whatever the signal was: the binary does not clean up on SIGHUP.
on_interrupt() {
  local pid
  trap '' INT TERM HUP
  if [ -n "$CLI_PID" ]; then
    for pid in $(descendants "$CLI_PID") "$CLI_PID"; do
      kill -TERM "$pid" 2>/dev/null || true
    done
    wait "$CLI_PID" 2>/dev/null || true
  fi
  echo "check-drift.sh: FATAL -- interrupted" >&2
  exit 130
}

trap on_exit EXIT
trap on_interrupt INT TERM HUP

# --- argument parsing --------------------------------------------------------------

while [ $# -gt 0 ]; do
  case "$1" in
    --manifest)
      require_value --manifest $#
      MANIFEST="$2"
      shift 2
      ;;
    --workdir)
      require_value --workdir $#
      WORKDIR="$2"
      shift 2
      ;;
    --target)
      require_value --target $#
      TARGET="$2"
      shift 2
      ;;
    --out)
      require_value --out $#
      OUT_DIR="$2"
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

case "$TARGET" in
  local | linked) ;;
  *) usage_error "--target must be local or linked, got: $TARGET" ;;
esac
MANIFEST="$(resolve_path "${MANIFEST:-$DEFAULT_MANIFEST}")"
WORKDIR="$(resolve_path "${WORKDIR:-$DEFAULT_WORKDIR}")"

# --- preconditions: nothing is started and no database is asked before all of them hold ---

if [ ! -f "$MANIFEST" ] || [ ! -r "$MANIFEST" ]; then
  fatal "the manifest is not a readable file: $MANIFEST" 2
fi
CONFIG="$WORKDIR/supabase/config.toml"
if [ ! -f "$CONFIG" ] || [ ! -d "$WORKDIR/supabase/migrations" ]; then
  fatal "the work directory holds no supabase/config.toml or no supabase/migrations: $WORKDIR" 2
fi
if [ ! -x "$CLI" ]; then
  fatal "the Supabase CLI is not at $CLI; run yarn install" 2
fi
for tool in node psql docker pgrep; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    fatal "$tool is not on PATH" 2
  fi
done
if ! docker info >/dev/null 2>&1; then
  fatal "docker is unavailable (the daemon did not answer), and the diff needs a shadow database" 2
fi
# Without a host psql would try a local socket and whichever database answers there.
if [ -z "${PGHOST:-}" ] && [ -z "${PGSERVICE:-}" ]; then
  fatal "neither PGHOST nor PGSERVICE is set, so the history query has no database to ask" 2
fi
if [ "$TARGET" = "local" ]; then
  LOCAL_PORT="$(toml_value "$CONFIG" "[db]" port)"
  if [ -z "$LOCAL_PORT" ]; then
    fatal "no [db] port could be read from $CONFIG" 2
  fi
  case "${PGHOST:-}" in
    127.0.0.1 | localhost | ::1) ;;
    *) fatal "--target local compares the work directory's local database, and PGHOST is not a loopback address; the two parts would judge two different databases" 2 ;;
  esac
  if [ "${PGPORT:-}" != "$LOCAL_PORT" ]; then
    fatal "--target local compares the database on port $LOCAL_PORT (the [db] port of $CONFIG), and PGPORT is '${PGPORT:-}'; the two parts would judge two different databases" 2
  fi
fi
export PGCONNECT_TIMEOUT="${PGCONNECT_TIMEOUT:-$DEFAULT_CONNECT_TIMEOUT}"

if [ -n "$OUT_DIR" ]; then
  OUT_DIR="$(resolve_path "$OUT_DIR")"
  mkdir -p "$OUT_DIR" || fatal "could not create $OUT_DIR" 2
else
  TMP_BASE="${TMPDIR:-/tmp}"
  TEMP_OUT="$(mktemp -d "${TMP_BASE%/}/check-drift.XXXXXX")" || fatal "could not create a temporary directory" 2
  OUT_DIR="$TEMP_OUT"
fi
MANIFEST_VERSIONS="$OUT_DIR/history.manifest.txt"
DATABASE_VERSIONS="$OUT_DIR/history.database.txt"
DIFF_SQL="$OUT_DIR/schema.diff.sql"
DIFF_LOG="$OUT_DIR/schema.diff.log"
WORK_ERR="$OUT_DIR/history.stderr"

# One line for each entry of the manifest: the version, a space, the file name.
manifest_status=0
node -e '
  const fs = require("fs");
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
  } catch (error) {
    console.error("it is not valid JSON");
    process.exit(1);
  }
  const entries = manifest && manifest.migrations;
  if (!Array.isArray(entries) || entries.length === 0) {
    console.error("it does not give migrations as a non-empty array");
    process.exit(1);
  }
  const lines = [];
  for (const entry of entries) {
    const file = entry && entry.file;
    if (typeof file !== "string" || !/^[0-9]{5}_[A-Za-z0-9_.-]+$/.test(file)) {
      console.error("an entry of migrations has no file name that begins with five digits and an underscore");
      process.exit(1);
    }
    lines.push(file.slice(0, 5) + " " + file);
  }
  process.stdout.write(lines.join("\n") + "\n");
' "$MANIFEST" >"$MANIFEST_VERSIONS.files" 2>"$WORK_ERR" || manifest_status=$?
if [ "$manifest_status" -ne 0 ]; then
  fatal "the manifest $MANIFEST cannot be read: $(head -n 1 "$WORK_ERR")" 2
fi
cut -d' ' -f1 "$MANIFEST_VERSIONS.files" >"$MANIFEST_VERSIONS"

# --- part 1: history ---------------------------------------------------------------

# 0 = holds, 1 = drift, 2 = could not run.
history_result=0
history_table=""
psql_status=0

note "history: reading $HISTORY_TABLE"
psql -X -At -v ON_ERROR_STOP=1 -c "SELECT to_regclass('$HISTORY_TABLE') IS NOT NULL" </dev/null >"$OUT_DIR/history.table.txt" 2>"$WORK_ERR" || psql_status=$?
if [ "$psql_status" -eq 0 ]; then
  history_table="$(cat "$OUT_DIR/history.table.txt")"
  if [ "$history_table" = "t" ]; then
    psql -X -At -v ON_ERROR_STOP=1 -c "SELECT version FROM $HISTORY_TABLE ORDER BY version COLLATE \"C\"" </dev/null >"$DATABASE_VERSIONS" 2>"$WORK_ERR" || psql_status=$?
  else
    : >"$DATABASE_VERSIONS"
  fi
fi

if [ "$psql_status" -ne 0 ]; then
  history_result=2
  say "history: COULD NOT RUN -- psql exited $psql_status"
  print_redacted "$WORK_ERR" >&2 || true
else
  say "history: manifest: $(tr '\n' ' ' <"$MANIFEST_VERSIONS")"
  say "history: database: $(tr '\n' ' ' <"$DATABASE_VERSIONS")"
  if [ "$history_table" != "t" ]; then
    history_result=1
    say "HISTORY DRIFT: the database has no table $HISTORY_TABLE, so no migration is recorded in it."
  fi
  if ! cmp -s "$MANIFEST_VERSIONS" "$DATABASE_VERSIONS"; then
    history_result=1
    one_sided=0
    while read -r version file; do
      if ! grep -q -x -F -- "$version" "$DATABASE_VERSIONS"; then
        one_sided=1
        say "HISTORY DRIFT: version $version ($file) is in the manifest and is not recorded in the database."
      fi
    done <"$MANIFEST_VERSIONS.files"
    while read -r version; do
      if ! grep -q -x -F -- "$version" "$MANIFEST_VERSIONS"; then
        one_sided=1
        say "HISTORY DRIFT: version $version is recorded in the database and has no entry in the manifest."
      fi
    done <"$DATABASE_VERSIONS"
    if [ "$one_sided" -eq 0 ]; then
      say "HISTORY DRIFT: the manifest and the database hold the same versions, in another order or another number of times."
    fi
  fi
  if [ "$history_result" -eq 0 ]; then
    say "history: holds"
  fi
fi

# --- part 2: schema ----------------------------------------------------------------

schema_result=0
cli_status=0

note "schema: running supabase db diff --$TARGET; this starts a shadow database and can take a minute"
# Started in the background and waited for, so that a signal reaches the trap while the CLI runs.
"$CLI" db diff "--$TARGET" --workdir "$WORKDIR" --agent no --output-format text </dev/null >"$DIFF_SQL" 2>"$DIFF_LOG" &
CLI_PID=$!
wait "$CLI_PID" || cli_status=$?
CLI_PID=""

if [ "$cli_status" -ne 0 ]; then
  schema_result=2
  say "schema: COULD NOT RUN -- supabase db diff exited $cli_status"
  print_redacted "$DIFF_LOG" >&2 || true
elif [ -s "$DIFF_SQL" ]; then
  if [ "$(head -c 1 "$DIFF_SQL")" = "{" ]; then
    schema_result=2
    say "schema: COULD NOT RUN -- supabase db diff answered in JSON, not in SQL, so the size of its output says nothing"
  else
    schema_result=1
    say "SCHEMA DRIFT: the database differs from a database built from the migrations. The statements that would turn the migrations' schema into the database's:"
    cat "$DIFF_SQL"
  fi
elif ! grep -q -F -- "$NO_CHANGE_LINE" "$DIFF_LOG"; then
  schema_result=2
  say "schema: COULD NOT RUN -- supabase db diff wrote nothing to standard output and did not say '$NO_CHANGE_LINE'"
  print_redacted "$DIFF_LOG" >&2 || true
else
  say "schema: holds"
fi

# --- verdict -----------------------------------------------------------------------

if [ "$history_result" -eq 1 ] || [ "$schema_result" -eq 1 ]; then
  say "DRIFT"
  exit 1
fi
if [ "$history_result" -eq 2 ] || [ "$schema_result" -eq 2 ]; then
  say "COULD NOT RUN -- a part of the check did not run, so finding no drift is not a clean result"
  exit 2
fi
say "CLEAN -- the history equals the manifest and the diff is empty"
exit 0
