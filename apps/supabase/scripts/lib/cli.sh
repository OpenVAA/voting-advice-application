# shellcheck shell=bash
#
# cli.sh -- The command-line helpers the scripts of apps/supabase/scripts share. Sourced, never run.
#
# The sourcing script sets REPO_ROOT before it sources this file and defines its own `usage`, which prints its header. Messages carry the sourcing script's file name.

CLI_SCRIPT_NAME="$(basename "$0")"

# $1 = message, $2 = exit code.
fatal() {
  echo "$CLI_SCRIPT_NAME: FATAL -- $1" >&2
  exit "$2"
}

# $1 = message. Prints the caller's usage and exits 2.
usage_error() {
  usage >&2
  fatal "$1" 2
}

# A value-taking flag given as the LAST argument must be a usage error. `shift 2` with one positional left fails, and under `set -e` the script would die with status 1, which is not the status of a usage error.
#
# $1 = flag name, $2 = the caller's remaining argument count ($#).
require_value() {
  if [ "$2" -lt 2 ]; then
    usage_error "$1 requires a value"
  fi
}

# Prints $1 as an absolute path. A relative path is resolved against REPO_ROOT, never against $PWD.
resolve_path() {
  case "$1" in
    /*) printf '%s\n' "$1" ;;
    *) printf '%s\n' "$REPO_ROOT/$1" ;;
  esac
}
