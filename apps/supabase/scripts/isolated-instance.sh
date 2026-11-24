#!/usr/bin/env bash
#
# isolated-instance.sh -- Start, describe and stop a second Supabase CLI instance that shares
#                         no project id, port, container or volume with this checkout's local stack.
#
# The local stack's project id and ports are literals in supabase/config.toml, so every checkout of this repository drives one and the same instance. This script builds an instance of its own from a copy of that file -- another project id, every port moved -- and a migrations directory the caller names. Use it for a database observation that must not read or change the shared instance.
#
# An instance is Postgres alone: the platform's auth and storage schemas and the migrations are applied, seeding is off and no service runs, so nothing but the migrations can create a row.
#
# Usage:
#   ```sh
#   apps/supabase/scripts/isolated-instance.sh start --name probe --migrations apps/supabase/supabase/migrations
#   set -a; eval "$(apps/supabase/scripts/isolated-instance.sh env --name probe)"; set +a
#   psql -X -At -c 'select count(*) from storage.buckets'
#   apps/supabase/scripts/isolated-instance.sh stop --name probe
#   apps/supabase/scripts/isolated-instance.sh list
#   ```
#
#   start   Build the instance and wait until it is up.
#     --name <id>          REQUIRED. Lower-case letters, digits and hyphens. The project id becomes openvaa-iso-<id>.
#     --migrations <dir>   REQUIRED. Copied to the instance's supabase/migrations.
#     --port-base <n>      OPTIONAL. Default 55400. Each port key of the configuration, in file order, takes the next number from here. Give a second instance a base at least 20 away from the first.
#   env     Print KEY=value lines for a started instance: ISO_WORKDIR, ISO_PROJECT_ID, ISO_DB_CONTAINER and the libpq variables PGHOST, PGPORT, PGUSER, PGDATABASE and PGPASSWORD. It never prints an API key.
#     --name <id>          REQUIRED.
#   stop    Remove the instance's containers and volumes, then its state directory.
#     --name <id>          REQUIRED.
#   list    Print the name of every instance that has a state directory, one per line.
#   -h, --help             Print this header and exit 0.
#
#   A relative path is resolved against the REPO ROOT, never against $PWD, so the script behaves identically from any working directory.
#
# State: ${TMPDIR:-/tmp}/openvaa-isolated/<id>/ holds the copied supabase/ directory and the CLI's own output, start.log and stop.log. The script prints the CLI's output only when the CLI fails, and then with key-shaped strings removed.
#
# Prerequisites. This script ASSERTS them; it never performs them:
#   1. `yarn install` has run: the CLI is node_modules/.bin/supabase of the repository root.
#   2. Docker is running. Images that are not present locally are pulled by the CLI.
#
# Exit codes -- the caller must be able to branch on the status alone:
#   0:  done
#   2:  usage error
#   3:  Docker or the CLI is unavailable
#   4:  a precondition was refused before the CLI was asked to start or stop anything: the name, the project id, the work directory, a port that is in use or that the shared stack owns, an instance that already exists or does not exist
#   5:  the instance was not started or not stopped: the CLI failed, or the state directory could not be written or removed
#   130:  interrupted (SIGINT/SIGTERM). Never 0.

set -euo pipefail

# Auto-detect paths from the script's location, so the script behaves identically from any working directory.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd -P)"
# shellcheck source=lib/cli.sh
. "$SCRIPT_DIR/lib/cli.sh"
# shellcheck source=../../../scripts/lib/redact.sh
. "$REPO_ROOT/scripts/lib/redact.sh"
CLI="$REPO_ROOT/node_modules/.bin/supabase"
SOURCE_CONFIG="$REPO_ROOT/apps/supabase/supabase/config.toml"

TMP_BASE="${TMPDIR:-/tmp}"
TMP_BASE="${TMP_BASE%/}"
STATE_ROOT="$TMP_BASE/openvaa-isolated"

PROJECT_ID_PREFIX="openvaa-iso-"
DEFAULT_PORT_BASE=55400
# The Supabase CLI gives every local database this password. It is public, not a secret.
LOCAL_DB_PASSWORD="postgres"

NAME=""
MIGRATIONS=""
PORT_BASE="$DEFAULT_PORT_BASE"
PROJECT_ID=""
STATE_DIR=""
STATE_DIR_CREATED=0
CLI_INVOKED=0
IN_START=0

main() {
  trap on_interrupt INT TERM
  if [ $# -eq 0 ]; then
    usage_error "a subcommand is required: start, env, stop or list"
  fi

  local subcommand="$1"
  shift
  case "$subcommand" in
    start) cmd_start "$@" ;;
    env) cmd_env "$@" ;;
    stop) cmd_stop "$@" ;;
    list) cmd_list "$@" ;;
    -h | --help)
      usage
      exit 0
      ;;
    *) usage_error "unknown subcommand: $subcommand" ;;
  esac
}

# --- subcommands ------------------------------------------------------------------

cmd_start() {
  local source_ports instance_ports port source_port port_count=0 cli_status=0 start_log running

  parse_flags start "$@"
  if [ -z "$MIGRATIONS" ]; then
    usage_error "start requires --migrations"
  fi
  MIGRATIONS="$(resolve_path "$MIGRATIONS")"
  if [ ! -d "$MIGRATIONS" ]; then
    usage_error "--migrations is not a directory: $MIGRATIONS"
  fi
  case "$PORT_BASE" in
    '' | *[!0123456789]*) usage_error "--port-base must be a number, got: $PORT_BASE" ;;
  esac
  if [ ! -f "$SOURCE_CONFIG" ]; then
    refuse "the configuration to copy is not at $SOURCE_CONFIG"
  fi
  source_ports="$(port_values "$SOURCE_CONFIG")"
  for source_port in $source_ports; do
    port_count=$((port_count + 1))
  done
  if [ "$PORT_BASE" -lt 1024 ] || [ $((PORT_BASE + port_count - 1)) -gt 65535 ]; then
    usage_error "--port-base $PORT_BASE leaves no room for $port_count ports between 1024 and 65535"
  fi

  validate_name "$NAME"
  PROJECT_ID="$PROJECT_ID_PREFIX$NAME"
  STATE_DIR="$STATE_ROOT/$NAME"
  if [ "$port_count" -eq 0 ]; then
    refuse "no port key was found in $SOURCE_CONFIG, so the ports of the shared stack are unknown"
  fi
  require_tools
  if [ ! -d "$TMP_BASE" ]; then
    refuse "the temporary directory $TMP_BASE does not exist"
  fi
  assert_outside_repo "$TMP_BASE"
  if [ -e "$STATE_DIR" ]; then
    refuse "an instance named '$NAME' already has a state directory at $STATE_DIR; run: stop --name $NAME"
  fi
  running="$(containers_of "$PROJECT_ID")" || fatal "docker did not list the containers" 3
  if [ -n "$running" ]; then
    refuse "containers of $PROJECT_ID exist with no state directory: $(echo $running)"
  fi

  IN_START=1
  mkdir -p "$STATE_DIR/supabase" || fatal "could not create $STATE_DIR" 5
  STATE_DIR_CREATED=1
  assert_outside_repo "$STATE_DIR"

  write_config "$SOURCE_CONFIG" "$STATE_DIR/supabase/config.toml" "$PROJECT_ID" "$PORT_BASE" || fail_start "could not write the instance's configuration" 5
  if [ "$(toml_value "$STATE_DIR/supabase/config.toml" "[db.seed]" enabled)" != "false" ]; then
    refuse "seeding could not be switched off in the instance's configuration"
  fi
  assert_isolated_project_id "$STATE_DIR/supabase/config.toml"

  instance_ports="$(port_values "$STATE_DIR/supabase/config.toml")"
  if [ "$(echo $instance_ports)" = "$(echo $source_ports)" ] || [ -z "$instance_ports" ]; then
    refuse "the ports of the instance were not moved"
  fi
  for port in $instance_ports; do
    for source_port in $source_ports; do
      if [ "$port" -eq "$source_port" ]; then
        refuse "port $port belongs to the shared stack; choose another --port-base"
      fi
    done
    if port_has_listener "$port"; then
      refuse "port $port is in use; choose another --port-base"
    fi
  done

  mkdir "$STATE_DIR/supabase/migrations" || fail_start "could not create the migrations directory" 5
  cp -R "$MIGRATIONS"/. "$STATE_DIR/supabase/migrations/" || fail_start "could not copy the migrations" 5

  start_log="$STATE_DIR/start.log"
  echo "isolated-instance.sh: starting $PROJECT_ID on ports $(echo $instance_ports); this can take several minutes" >&2
  CLI_INVOKED=1
  "$CLI" db start --workdir "$STATE_DIR" </dev/null >"$start_log" 2>&1 || cli_status=$?
  if [ "$cli_status" -ne 0 ]; then
    print_redacted "$start_log" >&2 || true
    fail_start "the CLI exited $cli_status while starting $PROJECT_ID" 5
  fi
  if [ "$(docker inspect --format '{{.State.Running}}' "supabase_db_$PROJECT_ID" 2>/dev/null || true)" != "true" ]; then
    fail_start "the CLI exited 0 but the container supabase_db_$PROJECT_ID is not running" 5
  fi
  IN_START=0
  echo "isolated-instance.sh: started $NAME. CLI output: $start_log" >&2
}

cmd_env() {
  local config db_port

  parse_flags env "$@"
  load_instance
  config="$STATE_DIR/supabase/config.toml"
  if [ ! -f "$config" ]; then
    refuse "the instance '$NAME' was never started"
  fi
  assert_isolated_project_id "$config"
  db_port="$(toml_value "$config" "[db]" port)"
  if [ -z "$db_port" ]; then
    refuse "the database port of '$NAME' could not be read from $config"
  fi
  echo "ISO_WORKDIR=$STATE_DIR"
  echo "ISO_PROJECT_ID=$PROJECT_ID"
  echo "ISO_DB_CONTAINER=supabase_db_$PROJECT_ID"
  echo "PGHOST=127.0.0.1"
  echo "PGPORT=$db_port"
  echo "PGUSER=postgres"
  echo "PGDATABASE=postgres"
  echo "PGPASSWORD=$LOCAL_DB_PASSWORD"
}

cmd_stop() {
  local cli_status=0 left

  parse_flags stop "$@"
  load_instance
  if [ ! -f "$STATE_DIR/supabase/config.toml" ]; then
    # The configuration is written before the CLI is first called, so nothing was started from this directory.
    rm -rf -- "$STATE_DIR" || fatal "could not remove $STATE_DIR" 5
    return 0
  fi
  assert_isolated_project_id "$STATE_DIR/supabase/config.toml"
  require_tools
  "$CLI" stop --workdir "$STATE_DIR" --no-backup </dev/null >"$STATE_DIR/stop.log" 2>&1 || cli_status=$?
  if [ "$cli_status" -ne 0 ]; then
    print_redacted "$STATE_DIR/stop.log" >&2 || true
    fatal "the CLI exited $cli_status while stopping $PROJECT_ID; its state directory is kept" 5
  fi
  left="$(containers_of "$PROJECT_ID")" || fatal "docker did not list the containers" 3
  if [ -n "$left" ]; then
    fatal "the CLI exited 0 but containers of $PROJECT_ID remain: $(echo $left)" 5
  fi
  left="$(volumes_of "$PROJECT_ID")" || fatal "docker did not list the volumes" 3
  if [ -n "$left" ]; then
    fatal "the CLI exited 0 but volumes of $PROJECT_ID remain: $(echo $left)" 5
  fi
  rm -rf -- "$STATE_DIR" || fatal "could not remove $STATE_DIR" 5
  echo "isolated-instance.sh: stopped $NAME" >&2
}

cmd_list() {
  local entry
  if [ $# -gt 0 ]; then
    usage_error "list takes no argument"
  fi
  if [ ! -d "$STATE_ROOT" ]; then
    return 0
  fi
  for entry in "$STATE_ROOT"/*; do
    if [ -d "$entry" ]; then
      basename "$entry"
    fi
  done
}

# --- command-line helpers ---------------------------------------------------------

usage() {
  # Delimit the header block rather than hardcoding a line range, so the exit-code table is never truncated when the header grows.
  sed -n '2,/^set -euo pipefail/p' "${BASH_SOURCE[0]}" | sed '$d'
}

parse_flags() {
  local subcommand="$1"
  shift
  while [ $# -gt 0 ]; do
    case "$1" in
      --name)
        require_value --name $#
        NAME="$2"
        shift 2
        ;;
      --migrations)
        require_value --migrations $#
        MIGRATIONS="$2"
        shift 2
        ;;
      --port-base)
        require_value --port-base $#
        PORT_BASE="$2"
        shift 2
        ;;
      -h | --help)
        usage
        exit 0
        ;;
      *)
        usage_error "unknown argument for $subcommand: $1"
        ;;
    esac
  done
  if [ "$subcommand" != "start" ]; then
    if [ -n "$MIGRATIONS" ] || [ "$PORT_BASE" != "$DEFAULT_PORT_BASE" ]; then
      usage_error "$subcommand takes --name only"
    fi
  fi
  if [ -z "$NAME" ]; then
    usage_error "$subcommand requires --name"
  fi
}

# Shared by `env` and `stop`: the named instance must exist, and its configuration must still carry this script's project id.
load_instance() {
  validate_name "$NAME"
  PROJECT_ID="$PROJECT_ID_PREFIX$NAME"
  STATE_DIR="$STATE_ROOT/$NAME"
  if [ ! -d "$STATE_DIR" ]; then
    refuse "no instance named '$NAME' has a state directory under $STATE_ROOT"
  fi
}

# --- teardown helpers -------------------------------------------------------------

discard_state_dir() {
  if [ "$STATE_DIR_CREATED" -eq 1 ] && [ -n "$STATE_DIR" ]; then
    rm -rf -- "$STATE_DIR" || true
  fi
}

# Leaves nothing behind when it can: containers and volumes go first, and the state directory only once they are gone, because `stop` needs it to find them.
abandon_start() {
  if [ "$CLI_INVOKED" -eq 1 ]; then
    if ! "$CLI" stop --workdir "$STATE_DIR" --no-backup </dev/null >/dev/null 2>&1; then
      echo "isolated-instance.sh: could not remove what $PROJECT_ID started; its state directory is kept. Run: stop --name $NAME" >&2
      return 0
    fi
  fi
  discard_state_dir
}

# $1 = message, $2 = exit code. For every failure of `start` after the state directory exists.
fail_start() {
  abandon_start
  fatal "$1" "$2"
}

on_interrupt() {
  trap - INT TERM
  if [ "$IN_START" -eq 1 ]; then
    abandon_start
  fi
  fatal "interrupted" 130
}

# --- configuration helpers --------------------------------------------------------

# Prints the value of one key. $1 = file, $2 = section header without spaces ("" for the top level), $3 = key.
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

# Prints the number of every uncommented key named `port` or ending in `_port`, in file order.
port_values() {
  awk '
    /^[[:space:]]*([a-z0-9_]+_)?port[[:space:]]*=[[:space:]]*[0-9]+[[:space:]]*(#.*)?$/ {
      value = $0
      sub(/^[^=]*=[[:space:]]*/, "", value)
      sub(/[^0-9].*$/, "", value)
      print value
    }
  ' "$1"
}

# Writes the instance's configuration, with seeding off. $1 = source, $2 = destination, $3 = project id, $4 = port base.
write_config() {
  awk -v pid="$3" -v base="$4" '
    BEGIN { taken = 0; section = "" }
    /^[[:space:]]*\[/ { section = $0; gsub(/[[:space:]]/, "", section) }
    section == "" && /^project_id[[:space:]]*=/ { print "project_id = \"" pid "\""; next }
    /^[[:space:]]*([a-z0-9_]+_)?port[[:space:]]*=[[:space:]]*[0-9]+[[:space:]]*(#.*)?$/ {
      key = $0
      sub(/[[:space:]]*=.*$/, "", key)
      print key " = " (base + taken)
      taken++
      next
    }
    section == "[db.seed]" && /^[[:space:]]*enabled[[:space:]]*=/ { print "enabled = false"; next }
    { print }
  ' "$1" > "$2"
}

# --- precondition helpers ---------------------------------------------------------

# $1 = message. A refusal made before the CLI was asked for anything.
refuse() {
  discard_state_dir
  fatal "$1" 4
}

validate_name() {
  # The characters are listed one by one: a range such as a-z admits upper-case letters in some locales.
  case "$1" in
    '' | *[!abcdefghijklmnopqrstuvwxyz0123456789-]*)
      refuse "the name '$1' is refused: use lower-case letters, digits and hyphens only"
      ;;
  esac
}

# $1 = an existing directory.
assert_outside_repo() {
  local physical
  physical="$(cd "$1" 2>/dev/null && pwd -P)" || refuse "the directory $1 cannot be entered"
  case "$physical/" in
    "$REPO_ROOT"/*) refuse "the work directory $physical is inside the repository" ;;
  esac
}

# The id the CLI would act on must be this script's own and never the shared stack's. $1 = a configuration file.
assert_isolated_project_id() {
  local found source_id
  found="$(toml_value "$1" "" project_id)"
  source_id="$(toml_value "$SOURCE_CONFIG" "" project_id)"
  if [ -z "$source_id" ]; then
    refuse "no project_id could be read from $SOURCE_CONFIG, so the instance cannot be shown to differ from the shared stack"
  fi
  if [ "$found" != "$PROJECT_ID" ] || [ "$found" = "openvaa-local" ] || [ "$found" = "$source_id" ]; then
    refuse "the project id in $1 is '$found', expected '$PROJECT_ID' and never the shared stack's '$source_id'"
  fi
}

require_tools() {
  if [ ! -x "$CLI" ]; then
    fatal "the Supabase CLI is not at $CLI; run yarn install" 3
  fi
  if ! command -v docker >/dev/null 2>&1; then
    fatal "docker is not on PATH" 3
  fi
  if ! docker info >/dev/null 2>&1; then
    fatal "docker is unavailable (the daemon did not answer)" 3
  fi
}

# A TCP connection that opens on either loopback address means something listens there.
port_has_listener() {
  (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null && return 0
  (exec 3<>"/dev/tcp/::1/$1") 2>/dev/null && return 0
  return 1
}

# Prints the names of the containers the CLI labelled with a project id. $1 = project id.
containers_of() {
  docker ps -a --filter "label=com.supabase.cli.project=$1" --format '{{.Names}}'
}

volumes_of() {
  docker volume ls --filter "label=com.supabase.cli.project=$1" --format '{{.Name}}'
}

main "$@"
