# shellcheck shell=bash
#
# cli.sh -- The command-line helpers that shell scripts of this repository share. Sourced, never run.
#
# The sourcing script sets SCRIPT_NAME, the name its messages carry, and REPO_ROOT before it sources this file. Its header, from the second line to `set -euo pipefail`, is its usage text.

# Prints the sourcing script's header. Delimiting the header block rather than hardcoding a line range keeps the exit-code table from being truncated when the header grows.
usage() {
  sed -n '2,/^set -euo pipefail/p' "${BASH_SOURCE[${#BASH_SOURCE[@]} - 1]}" | sed '$d'
}

# $1 = message, $2 = exit code.
fatal() {
  echo "$SCRIPT_NAME: FATAL -- $1" >&2
  exit "$2"
}

# $1 = message. Prints the usage and exits 2.
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

# A TCP connection that opens on either loopback address means something listens there.
port_has_listener() {
  (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null && return 0
  (exec 3<>"/dev/tcp/::1/$1") 2>/dev/null && return 0
  return 1
}
