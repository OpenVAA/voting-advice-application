#!/usr/bin/env bash
#
# check-schema-equivalence.sh -- Build one database from migrations/ and one from schema/, and report
#                                whether the two are the same database.
#
# migrations/ is what a database is built from. schema/ is the hand-edited view of the same schema, one file per concern. Where a change is written into both by hand, nothing that reads only the files can tell whether the two agree, because privileges, policies and role settings exist only in a built database. This script builds both databases and compares them.
#
# How it compares. Each side is built by isolated-instance.sh in an instance of its own, database only, with seeding off: side M (`eq-m`) from the migrations directory, side S (`eq-s`) from one migration file that is every .sql file of the schema directory joined in filename order, each ending in a newline. Each side is written to a snapshot file. A snapshot is a schema-only pg_dump of the whole database, less the schema supabase_migrations, taken inside that instance's database container so that the client always matches the server. It is followed by the results of four catalog queries for what such a dump leaves out: role settings (pg_db_role_setting), installed extensions (pg_extension), and the rows of storage.buckets and of private.deployment_settings. The two snapshots are compared with `diff -u`. The CLI's own schema diff is not used: it does not report column privileges, rows or role settings.
#
# The dump covers every schema of the database, the platform's own (auth, storage, realtime and others) included, so a migration that changes a platform object is compared as well.
#
# Two things are kept out of a snapshot on purpose. The daily partitions of realtime.messages are left out of the dump: the platform names them after the day an instance is created, so two sides built on either side of midnight, or a snapshot reused on a later day, would differ in them and in nothing else. A role setting whose name holds `secret`, `password`, `token` or `key` is written as a SHA-256 digest and not as its value: the local instance's JWT secret is such a setting, and it is compared without being written to a file or printed.
#
# The two sides are built one after the other, and each instance is stopped as soon as its snapshot is written, so the two never run at the same moment. Every instance this script starts is stopped on every way out, an interrupt included.
#
# Usage:
#   ```sh
#   apps/supabase/scripts/check-schema-equivalence.sh
#   apps/supabase/scripts/check-schema-equivalence.sh --out tmp/equivalence
#   apps/supabase/scripts/check-schema-equivalence.sh --schema-dir /tmp/schema-copy --reuse-m tmp/equivalence/migrations.snapshot.sql
#   ```
#
#   --schema-dir <dir>      OPTIONAL. Default: apps/supabase/supabase/schema.
#   --migrations-dir <dir>  OPTIONAL. Default: apps/supabase/supabase/migrations.
#   --out <dir>             OPTIONAL. Where migrations.snapshot.sql, schema.snapshot.sql and equivalence.diff are kept. Created when missing. Default: a temporary directory that is removed when the script exits.
#   --reuse-m <file>        OPTIONAL. A snapshot of side M that an earlier run wrote. Side M is then not built. The script checks only that the file passes the floor; that it is a snapshot of the migrations as they are now is the caller's to answer for. Mutually exclusive with --migrations-dir.
#   -h, --help              Print this header and exit 0.
#
#   A relative path is resolved against the REPO ROOT, never against $PWD, so the script behaves identically from any working directory.
#
# Output: on standard output, one census line for each side, then the verdict, and on a difference the objects that differ and the whole diff. In the diff a line starting `-` is in the database built from the migrations only, and a line starting `+` in the one built from schema/ only. Progress goes to standard error.
#
# The floor. An empty database compared with an empty database is equal and proves nothing, so a side is refused, with status 2, when its snapshot holds no line beginning `CREATE TABLE public.` or fewer tables, policies or functions than MIN_TABLES, MIN_POLICIES and MIN_FUNCTIONS below.
#
# What this check cannot see:
#   - A `--` comment outside a function body. It is in no database, so it can differ between schema/ and a migration with no finding.
#   - Sequence positions. The dump holds no data.
#   - Anything in a schema the dump could not read. The dump runs as supabase_admin, which reads every schema of a local instance, and the script fails when pg_dump writes a warning.
#   - Rows of any table other than the two named above.
#   - The daily partitions of realtime.messages, and the value of a secret role setting beyond whether it is equal.
#   - Whether either side is correct. A wrong policy written the same way into both passes.
#
# Two properties a developer meets, both real differences that the check is right to report:
#   - A column added by a migration lands last in its table, so schema/ must put that column last too.
#   - A function re-created by a migration must have the same body text as in schema/, comments inside the body included.
#
# Prerequisites. This script ASSERTS them; it never performs them:
#   1. `yarn install` has run: isolated-instance.sh uses the CLI in node_modules of the repository root.
#   2. Docker is running. Nothing is needed on the host beyond it: pg_dump and psql are the ones inside the database container.
#   3. No instance named `eq-m` or `eq-s` exists, and the ports 55400 to 55409 and 55500 to 55509 are free.
#
# Exit codes -- the caller must be able to branch on the status alone:
#   0:  the two databases are equal
#   1:  the two databases differ; the objects that differ and the diff are printed
#   2:  the check could not run: a usage error, Docker or the harness unavailable, an instance that already exists, a build, a dump or a query that failed, a snapshot under the floor, or an instance that could not be stopped
#   130:  interrupted (SIGINT/SIGTERM/SIGHUP). Never 0.

set -euo pipefail

# File names sort and compare byte by byte, as the generator of the baseline migration sorts them.
export LC_ALL=C

# Auto-detect paths from the script's location, so the script behaves identically from any working directory.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd -P)"
HARNESS="$SCRIPT_DIR/isolated-instance.sh"

DEFAULT_SCHEMA_DIR="apps/supabase/supabase/schema"
DEFAULT_MIGRATIONS_DIR="apps/supabase/supabase/migrations"

# The non-vacuity floor. Absolute thresholds, counted over a whole-database snapshot; raise them as the schema grows. A database with no migration applied already holds the platform's own tables and functions (46 and 47 on the pinned image) and no policy, so MIN_TABLES alone does not refuse it: the `CREATE TABLE public.` test and MIN_POLICIES do.
MIN_TABLES=20
MIN_POLICIES=50
MIN_FUNCTIONS=50

INSTANCE_M="eq-m"
INSTANCE_S="eq-s"
PORT_BASE_M=55400
PORT_BASE_S=55500
# isolated-instance.sh names an instance's database container with this prefix and the instance's name.
CONTAINER_PREFIX="supabase_db_openvaa-iso-"

DUMP_ROLE="supabase_admin"
DUMP_DATABASE="postgres"
# Holds the migration history, which differs between the two sides by construction.
EXCLUDED_SCHEMA="supabase_migrations"
# The daily partitions of realtime.messages, as a pg_dump table pattern and as an expression for the lines of a dump. Their names hold the day the instance was created.
VOLATILE_TABLES='realtime.messages_[0-9][0-9][0-9][0-9]_[0-9][0-9]_[0-9][0-9]'
VOLATILE_LINES='messages_[0-9]{4}_[0-9]{2}_[0-9]{2}'
# pg_dump writes a random key into every dump unless it is given one, and two dumps would then never compare equal.
RESTRICT_KEY="openvaaSchemaEquivalence0"
# One header line for each catalog query of a snapshot.
QUERY_COUNT=4

SCHEMA_DIR=""
MIGRATIONS_DIR=""
OUT_DIR=""
REUSE_M=""
WORK_DIR=""
OWNS_M=0
OWNS_S=0

usage() {
  # Delimit the header block rather than hardcoding a line range, so the exit-code table is never truncated when the header grows.
  sed -n '2,/^set -euo pipefail/p' "${BASH_SOURCE[0]}" | sed '$d'
}

fatal() {
  echo "check-schema-equivalence.sh: FATAL -- $1" >&2
  exit "$2"
}

usage_error() {
  usage >&2
  fatal "$1" 2
}

note() {
  echo "check-schema-equivalence.sh: $1" >&2
}

# A value-taking flag given as the LAST argument must be a usage error. `shift 2` with one positional left fails, and under `set -e` the script would die with status 1, which the table above gives to a difference.
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

# --- instances ---------------------------------------------------------------------

# Status 0 when the harness lists an instance named $1, 1 when it does not, 2 when the harness could not say.
instance_exists() {
  local listed name
  listed="$(bash "$HARNESS" list </dev/null)" || return 2
  for name in $listed; do
    if [ "$name" = "$1" ]; then
      return 0
    fi
  done
  return 1
}

# $1 = instance name. Succeeds when no such instance is left. A start that failed has removed its own instance, and that is not an error here.
stop_instance() {
  local exists=0
  instance_exists "$1" || exists=$?
  case "$exists" in
    0) ;;
    1) return 0 ;;
    *) return 1 ;;
  esac
  bash "$HARNESS" stop --name "$1" </dev/null >&2
}

# Stops what this run started and removes its working directory. Fails when an instance is left.
cleanup() {
  local failed=0
  # A signal during the teardown must not leave an instance half removed. An ignored signal stays ignored in the harness too.
  trap '' INT TERM HUP
  if [ "$OWNS_M" -eq 1 ]; then
    if stop_instance "$INSTANCE_M"; then OWNS_M=0; else failed=1; fi
  fi
  if [ "$OWNS_S" -eq 1 ]; then
    if stop_instance "$INSTANCE_S"; then OWNS_S=0; else failed=1; fi
  fi
  if [ -n "$WORK_DIR" ]; then
    rm -rf -- "$WORK_DIR" || true
  fi
  return "$failed"
}

on_exit() {
  local status=$?
  trap - EXIT
  if ! cleanup; then
    echo "check-schema-equivalence.sh: FATAL -- an instance this run started could not be stopped. Run: bash $HARNESS stop --name $INSTANCE_M (or $INSTANCE_S)" >&2
    if [ "$status" -ne 130 ]; then
      status=2
    fi
  fi
  exit "$status"
}

# The teardown itself runs in on_exit, which every exit passes through.
on_interrupt() {
  trap - INT TERM HUP
  echo "check-schema-equivalence.sh: FATAL -- interrupted" >&2
  exit 130
}

# $1 = instance name, $2 = port base, $3 = migrations directory, $4 = what the side is built from, for messages.
start_instance() {
  local exists=0 status=0
  instance_exists "$1" || exists=$?
  if [ "$exists" -eq 0 ]; then
    fatal "an instance named '$1' already exists. Another run of this check may be in progress; if none is, run: bash $HARNESS stop --name $1" 2
  fi
  if [ "$exists" -ne 1 ]; then
    fatal "the harness could not list its instances" 2
  fi
  # Claimed before the start, so that a start cut short by a signal is torn down as well.
  if [ "$1" = "$INSTANCE_M" ]; then OWNS_M=1; else OWNS_S=1; fi
  bash "$HARNESS" start --name "$1" --mode db --port-base "$2" --migrations "$3" </dev/null >&2 || status=$?
  if [ "$status" -eq 4 ]; then
    # The harness refused before it started anything, so nothing here is this run's to stop.
    if [ "$1" = "$INSTANCE_M" ]; then OWNS_M=0; else OWNS_S=0; fi
  fi
  if [ "$status" -eq 130 ]; then
    exit 130
  fi
  if [ "$status" -ne 0 ]; then
    fatal "the database of $4 could not be built: the harness exited $status and its output is above. A statement that does not apply is the usual cause." 2
  fi
}

# $1 = instance name. Stops it now, so that the two sides never run together.
finish_instance() {
  if ! stop_instance "$1"; then
    fatal "the instance '$1' could not be stopped" 2
  fi
  if [ "$1" = "$INSTANCE_M" ]; then OWNS_M=0; else OWNS_S=0; fi
}

# --- the two sides -----------------------------------------------------------------

# Writes the schema directory as one migration file: every .sql file in filename order, each ending in a newline. $1 = schema directory, $2 = the file to write.
write_schema_migration() {
  local file found=0
  : >"$2" || fatal "could not write $2" 2
  for file in "$1"/*.sql; do
    if [ ! -f "$file" ]; then
      continue
    fi
    found=1
    cat "$file" >>"$2" || fatal "could not read $file" 2
    # Command substitution drops a final newline, so the result is empty when the file ends in one. An empty file gets a newline too.
    if [ ! -s "$file" ] || [ -n "$(tail -c 1 "$file")" ]; then
      printf '\n' >>"$2"
    fi
  done
  if [ "$found" -eq 0 ]; then
    fatal "the schema directory $1 holds no .sql file" 2
  fi
}

# Writes the snapshot of a running instance. $1 = instance name, $2 = the file to write, $3 = what the side is built from, for messages.
write_snapshot() {
  local container status=0 headers=0 volatile=0
  local dump="$WORK_DIR/$1.dump.sql" rows="$WORK_DIR/$1.rows.txt" errors="$WORK_DIR/$1.stderr"

  # Only the container's name is taken from the harness's `env` output; the rest of it holds the local database password.
  container="$(bash "$HARNESS" env --name "$1" </dev/null | sed -n 's/^ISO_DB_CONTAINER=//p')" || fatal "the harness could not describe the instance '$1'" 2
  if [ "$container" != "$CONTAINER_PREFIX$1" ]; then
    fatal "the harness names the database container of '$1' as '$container', expected '$CONTAINER_PREFIX$1'" 2
  fi

  docker exec "$container" pg_dump -U "$DUMP_ROLE" -d "$DUMP_DATABASE" --schema-only --exclude-schema="$EXCLUDED_SCHEMA" --exclude-table="$VOLATILE_TABLES" --restrict-key="$RESTRICT_KEY" </dev/null >"$dump" 2>"$errors" || status=$?
  if [ "$status" -ne 0 ]; then
    cat "$errors" >&2 || true
    fatal "pg_dump exited $status on the database of $3" 2
  fi
  if [ -s "$errors" ]; then
    cat "$errors" >&2 || true
    fatal "pg_dump wrote a warning on the database of $3, and a dump with a warning may be incomplete" 2
  fi
  volatile="$(count_lines "$VOLATILE_LINES" "$dump")"
  if [ "$volatile" -ne 0 ]; then
    fatal "the dump of the database of $3 still holds $volatile line(s) that name a daily partition of realtime.messages, so it depends on the day it was taken" 2
  fi

  # Every row carries the name of what it belongs to, so a diff line names it without its neighbours. A named table that does not exist is printed as such, which makes a table missing on one side a difference and not a failed query. A secret setting is printed as a digest of its name and value.
  docker exec -i "$container" psql -U "$DUMP_ROLE" -d "$DUMP_DATABASE" -X -q -At -v ON_ERROR_STOP=1 -f - >"$rows" 2>"$errors" <<'SQL' || status=$?
\pset null '<null>'
SELECT '-- Query: role settings (pg_db_role_setting), as role|database|setting';
SELECT line FROM (
  SELECT 'role setting|' || coalesce(r.rolname, '<every role>') || '|' || coalesce(d.datname, '<every database>') || '|' ||
    CASE
      WHEN split_part(s.setting, '=', 1) ~* '(secret|password|token|key)'
        THEN split_part(s.setting, '=', 1) || '=<sha256 ' || encode(sha256(convert_to(s.setting, 'UTF8')), 'hex') || '>'
      ELSE s.setting
    END AS line
  FROM (SELECT setrole, setdatabase, unnest(setconfig) AS setting FROM pg_catalog.pg_db_role_setting) AS s
  LEFT JOIN pg_catalog.pg_roles AS r ON r.oid = s.setrole
  LEFT JOIN pg_catalog.pg_database AS d ON d.oid = s.setdatabase
) AS settings ORDER BY line COLLATE "C";
SELECT '-- Query: installed extensions (pg_extension), as name|version|schema';
SELECT line FROM (
  SELECT 'extension|' || e.extname || '|' || e.extversion || '|' || n.nspname AS line
  FROM pg_catalog.pg_extension AS e
  JOIN pg_catalog.pg_namespace AS n ON n.oid = e.extnamespace
) AS extensions ORDER BY line COLLATE "C";
SELECT '-- Query: rows of storage.buckets, as id|name|public|file_size_limit|allowed_mime_types';
SELECT to_regclass('storage.buckets') IS NOT NULL AS table_exists \gset
\if :table_exists
SELECT 'storage.buckets', id, name, public, file_size_limit, allowed_mime_types FROM storage.buckets ORDER BY id COLLATE "C";
\else
SELECT 'storage.buckets|<no such table>';
\endif
SELECT '-- Query: rows of private.deployment_settings, one JSON object for each row';
SELECT to_regclass('private.deployment_settings') IS NOT NULL AS table_exists \gset
\if :table_exists
SELECT line FROM (
  SELECT 'private.deployment_settings|' || to_jsonb(t)::text AS line FROM private.deployment_settings AS t
) AS settings ORDER BY line COLLATE "C";
\else
SELECT 'private.deployment_settings|<no such table>';
\endif
SQL
  if [ "$status" -ne 0 ]; then
    cat "$errors" >&2 || true
    fatal "a catalog query exited $status on the database of $3" 2
  fi
  headers="$(count_lines '^-- Query: ' "$rows")"
  if [ "$headers" -ne "$QUERY_COUNT" ]; then
    fatal "the catalog queries on the database of $3 printed $headers of their $QUERY_COUNT headers" 2
  fi

  cat "$dump" "$rows" >"$2" || fatal "could not write $2" 2
}

# --- census, floor and verdict -----------------------------------------------------

# Prints the number of lines of a file that match. $1 = extended regular expression, $2 = file.
count_lines() {
  local count
  # grep exits 1 when nothing matches and still prints the count.
  count="$(grep -c -E -- "$1" "$2")" || true
  printf '%s\n' "${count:-0}"
}

# Prints the census of one snapshot and refuses it when it is under the floor. $1 = what the side is built from, $2 = snapshot file.
census_and_floor() {
  local tables public_tables policies functions grants triggers
  if [ ! -s "$2" ]; then
    fatal "FLOOR: the snapshot of $1 is empty or missing: $2" 2
  fi
  tables="$(count_lines '^CREATE TABLE ' "$2")"
  public_tables="$(count_lines '^CREATE TABLE public\.' "$2")"
  policies="$(count_lines '^CREATE POLICY ' "$2")"
  functions="$(count_lines '^CREATE (OR REPLACE )?FUNCTION ' "$2")"
  grants="$(count_lines '^GRANT ' "$2")"
  triggers="$(count_lines '^CREATE TRIGGER ' "$2")"
  echo "check-schema-equivalence.sh: census of $1: CREATE TABLE $tables (in public: $public_tables), CREATE POLICY $policies, CREATE FUNCTION $functions, GRANT $grants, CREATE TRIGGER $triggers"
  if [ "$public_tables" -eq 0 ]; then
    fatal "FLOOR: the snapshot of $1 holds no line beginning \`CREATE TABLE public.\`. The database is empty or is not this schema, and comparing it proves nothing." 2
  fi
  if [ "$tables" -lt "$MIN_TABLES" ] || [ "$policies" -lt "$MIN_POLICIES" ] || [ "$functions" -lt "$MIN_FUNCTIONS" ]; then
    fatal "FLOOR: the snapshot of $1 holds $tables table(s), $policies polic(ies) and $functions function(s), under the floor of $MIN_TABLES, $MIN_POLICIES and $MIN_FUNCTIONS. A comparison of two nearly empty databases proves nothing." 2
  fi
}

# Prints, once each, the object every changed line of a unified diff belongs to: the nearest pg_dump object header or query header above the line, in the snapshot the line comes from. $1 = snapshot of side M, $2 = snapshot of side S, $3 = the diff. None of the three is empty when this is called.
differing_objects() {
  awk '
    function report(name) {
      if (!(name in seen)) {
        seen[name] = 1
        order[++total] = name
      }
    }
    FNR == 1 {
      file++
      current = "(above the first object)"
    }
    file < 3 {
      if ($0 ~ /^-- (Name|Query): /) current = substr($0, 4)
      if (file == 1) in_m[FNR] = current
      else in_s[FNR] = current
      next
    }
    /^@@ / {
      split($2, range_m, ",")
      split($3, range_s, ",")
      line_m = substr(range_m[1], 2) + 0
      line_s = substr(range_s[1], 2) + 0
      in_hunk = 1
      next
    }
    !in_hunk { next }
    { mark = substr($0, 1, 1) }
    mark == " " { line_m++; line_s++; next }
    mark == "-" { report(in_m[line_m]); line_m++; next }
    mark == "+" { report(in_s[line_s]); line_s++; next }
    END {
      for (i = 1; i <= total; i++) print "  " order[i]
    }
  ' "$1" "$2" "$3"
}

# --- argument parsing --------------------------------------------------------------

while [ $# -gt 0 ]; do
  case "$1" in
    --schema-dir)
      require_value --schema-dir $#
      SCHEMA_DIR="$2"
      shift 2
      ;;
    --migrations-dir)
      require_value --migrations-dir $#
      MIGRATIONS_DIR="$2"
      shift 2
      ;;
    --out)
      require_value --out $#
      OUT_DIR="$2"
      shift 2
      ;;
    --reuse-m)
      require_value --reuse-m $#
      REUSE_M="$2"
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

if [ -n "$REUSE_M" ] && [ -n "$MIGRATIONS_DIR" ]; then
  usage_error "--reuse-m and --migrations-dir are mutually exclusive: a reused snapshot is not built from a directory"
fi
SCHEMA_DIR="$(resolve_path "${SCHEMA_DIR:-$DEFAULT_SCHEMA_DIR}")"
MIGRATIONS_DIR="$(resolve_path "${MIGRATIONS_DIR:-$DEFAULT_MIGRATIONS_DIR}")"
if [ ! -d "$SCHEMA_DIR" ]; then
  usage_error "--schema-dir is not a directory: $SCHEMA_DIR"
fi
if [ -n "$REUSE_M" ]; then
  REUSE_M="$(resolve_path "$REUSE_M")"
  if [ ! -f "$REUSE_M" ]; then
    usage_error "--reuse-m is not a file: $REUSE_M"
  fi
elif [ ! -d "$MIGRATIONS_DIR" ]; then
  usage_error "--migrations-dir is not a directory: $MIGRATIONS_DIR"
fi
if [ ! -f "$HARNESS" ]; then
  fatal "the instance harness is not at $HARNESS" 2
fi
if ! command -v docker >/dev/null 2>&1; then
  fatal "docker is not on PATH" 2
fi

# --- run ---------------------------------------------------------------------------

trap on_exit EXIT
trap on_interrupt INT TERM HUP

TMP_BASE="${TMPDIR:-/tmp}"
WORK_DIR="$(mktemp -d "${TMP_BASE%/}/openvaa-equivalence.XXXXXX")" || fatal "could not create a working directory under $TMP_BASE" 2

if [ -n "$OUT_DIR" ]; then
  OUT_DIR="$(resolve_path "$OUT_DIR")"
  mkdir -p "$OUT_DIR" || fatal "could not create $OUT_DIR" 2
else
  OUT_DIR="$WORK_DIR/out"
  mkdir "$OUT_DIR" || fatal "could not create $OUT_DIR" 2
fi
M_SNAPSHOT="$OUT_DIR/migrations.snapshot.sql"
S_SNAPSHOT="$OUT_DIR/schema.snapshot.sql"
DIFF_FILE="$OUT_DIR/equivalence.diff"

if [ -n "$REUSE_M" ]; then
  if [ "$REUSE_M" -ef "$S_SNAPSHOT" ] || [ "$REUSE_M" -ef "$DIFF_FILE" ]; then
    usage_error "--reuse-m names a file this run writes: $REUSE_M"
  fi
  M_SOURCE="the reused snapshot $REUSE_M"
  M_SNAPSHOT="$REUSE_M"
else
  M_SOURCE="the migrations in $MIGRATIONS_DIR"
  rm -f -- "$M_SNAPSHOT" || fatal "could not remove the earlier $M_SNAPSHOT" 2
fi
S_SOURCE="the schema files in $SCHEMA_DIR"
# A file left by an earlier run must not be read as this run's.
rm -f -- "$S_SNAPSHOT" "$DIFF_FILE" || fatal "could not remove the files of an earlier run in $OUT_DIR" 2

# Written before any instance is started: an unreadable schema directory then costs no build.
mkdir "$WORK_DIR/schema-as-migration" || fatal "could not create a directory under $WORK_DIR" 2
write_schema_migration "$SCHEMA_DIR" "$WORK_DIR/schema-as-migration/00001_schema.sql"

if [ -z "$REUSE_M" ]; then
  start_instance "$INSTANCE_M" "$PORT_BASE_M" "$MIGRATIONS_DIR" "$M_SOURCE"
  write_snapshot "$INSTANCE_M" "$M_SNAPSHOT" "$M_SOURCE"
  finish_instance "$INSTANCE_M"
fi
census_and_floor "$M_SOURCE" "$M_SNAPSHOT"

start_instance "$INSTANCE_S" "$PORT_BASE_S" "$WORK_DIR/schema-as-migration" "$S_SOURCE"
write_snapshot "$INSTANCE_S" "$S_SNAPSHOT" "$S_SOURCE"
finish_instance "$INSTANCE_S"
census_and_floor "$S_SOURCE" "$S_SNAPSHOT"

DIFF_STATUS=0
diff -u --label "the database built from migrations" --label "the database built from schema" "$M_SNAPSHOT" "$S_SNAPSHOT" >"$DIFF_FILE" || DIFF_STATUS=$?

if [ "$DIFF_STATUS" -eq 0 ] && [ ! -s "$DIFF_FILE" ]; then
  echo "check-schema-equivalence.sh: EQUAL -- the database built from $S_SOURCE is the database built from $M_SOURCE (${SECONDS} s)"
  exit 0
fi
if [ "$DIFF_STATUS" -eq 1 ] && [ -s "$DIFF_FILE" ]; then
  echo "check-schema-equivalence.sh: DIFFERENT -- the database built from $S_SOURCE is not the database built from $M_SOURCE (${SECONDS} s). The objects that differ:"
  differing_objects "$M_SNAPSHOT" "$S_SNAPSHOT" "$DIFF_FILE" || fatal "the objects that differ could not be listed" 2
  echo "The diff. A line starting \`-\` is in the database built from the migrations only, a line starting \`+\` in the one built from schema/ only:"
  cat "$DIFF_FILE"
  exit 1
fi
fatal "diff exited $DIFF_STATUS and could not compare the two snapshots" 2
