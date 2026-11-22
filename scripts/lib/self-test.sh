# shellcheck shell=bash
#
# self-test.sh -- The helpers of the self-tests that shell scripts of this repository carry. Sourced, never run.
#
# The sourcing script sets ST_CASES and ST_FAILED to 0 before its first case, and prints its own summary line from them. st_start_server also reads ST, the self-test's temporary directory, and ST_SERVER_JS, the Node.js server it starts, and adds each server's id to ST_SERVER_PIDS.

# $1 = case name, $2 = pass or fail. Prints the case's line and counts it.
st_result() {
  ST_CASES=$((ST_CASES + 1))
  if [ "$2" = "pass" ]; then
    echo "self_test $1 PASS"
  else
    echo "self_test $1 FAIL"
    ST_FAILED=$((ST_FAILED + 1))
  fi
}

# st_expect <case> <condition...>: the case passes when the condition holds.
st_expect() {
  local name="$1"
  shift
  if "$@"; then st_result "$name" pass; else st_result "$name" fail; fi
}

has() { case "$1" in *"$2"*) return 0 ;; *) return 1 ;; esac; }
lacks() { case "$1" in *"$2"*) return 1 ;; *) return 0 ;; esac; }
equals() { [ "$1" = "$2" ]; }

# Starts a server of the given mode and sets ST_PORT. The server writes the port it listens on to the file named by its second argument.
st_start_server() {
  local port_file="$ST/port.$1" waited=0
  node -e "$ST_SERVER_JS" "$1" "$port_file" &
  ST_SERVER_PIDS="$ST_SERVER_PIDS $!"
  while [ ! -s "$port_file" ] && [ "$waited" -lt 50 ]; do
    sleep 0.1
    waited=$((waited + 1))
  done
  ST_PORT="$(cat "$port_file" 2> /dev/null || true)"
  [ -n "$ST_PORT" ]
}
