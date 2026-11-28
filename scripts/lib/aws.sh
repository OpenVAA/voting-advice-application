# shellcheck shell=bash
#
# aws.sh -- The helpers that shell scripts of this repository which call the AWS CLI share. Sourced after cli.sh, never run.

# $1 = the failed step, $2 = an optional note. Prints `failed=<step>` on standard output and exits 1.
fail_step() {
  echo "failed=$1"
  [ -z "${2:-}" ] || note "$2"
  exit 1
}

# Whether $1 is an image digest: sha256: and 64 lower-case hex digits.
is_digest() {
  local re='^sha256:[0-9a-f]{64}$'
  [[ "$1" =~ $re ]]
}

# The error code of a failed AWS call, read from its standard error in the file $1, or "unknown".
error_code() {
  local code
  code="$(awk 'match($0, /An error occurred \([A-Za-z][A-Za-z0-9.]*\)/) { print substr($0, RSTART + 19, RLENGTH - 20); exit }' "$1")"
  printf '%s' "${code:-unknown}"
}
