#!/usr/bin/env bash
#
# check-destroy-plan.sh -- Check that a saved destroy plan of the staging AWS root destroys that stack and nothing else.
#
# The staging AWS root holds one module, `module.frontend`, and every resource it manages lives under that address. A
# destroy of the root may therefore contain one kind of change only: a `delete` of a managed resource whose address
# starts with `module.frontend.`. The number of those deletes must equal the number of managed resources in the state,
# because a destroy that touches anything else, or misses part of the stack, is not the stack's destroy: the first
# reaches beyond the root, the second leaves resources behind that the next apply or the cost window does not expect.
#
# What it reads, and nothing else:
#   - the plan as `terraform show -json <plan>` prints it: of each `resource_changes` entry of mode `managed`, its
#     `address` and its `change.actions`. Entries of mode `data` are not resources and are not counted.
#   - the state as `terraform state list` prints it: one address per line. A line whose address names a data source,
#     `data.<type>.<name>` at the root or under any module path, is not counted.
#
# It prints five lines and nothing of the plan:
#   destroy_planned=<n>          managed changes whose actions are exactly ["delete"]
#   destroy_state_resources=<n>  managed resources in the state list
#   destroy_outside_module=<n>   managed changes, other than a no-op, whose address does not start with module.frontend.
#   destroy_other_actions=<n>    managed changes whose actions are anything but ["delete"] or ["no-op"]
#   destroy_guard=pass|fail      pass only when destroy_outside_module and destroy_other_actions are 0 and
#                                destroy_planned equals destroy_state_resources
# A plan file that is not a plan document prints `destroy_guard=fail` alone. jq's own message is not printed, so that
# no part of the plan reaches the log.
#
# Usage:
#   infra/scripts/check-destroy-plan.sh --plan-json <file> --state-list <file>
#
#   --plan-json <file>   REQUIRED. The output of `terraform show -json` of the saved destroy plan.
#   --state-list <file>  REQUIRED. The output of `terraform state list` of the same root, taken before the plan.
#   -h, --help           Print this header and exit 0.
#
# For a caller: read the status directly, never through a pipe.
#
# Exit codes:
#   0:  the plan is the stack's destroy
#   1:  the plan is not the stack's destroy, or the plan file is not a plan document
#   2:  usage error: a missing flag, a missing or unreadable file, or no jq on the PATH
#
# `set -x` must not be added.

set -euo pipefail
set -f

export LC_ALL=C

SCRIPT_PATH="${BASH_SOURCE[0]}"

PLAN_JSON=""
STATE_LIST=""

usage_line() {
  echo "usage: check-destroy-plan.sh --plan-json <file> --state-list <file> | -h | --help" >&2
}

print_header() {
  awk 'NR == 1 { next } /^#/ { sub(/^# ?/, ""); print; next } { exit }' "$SCRIPT_PATH"
}

usage_error() {
  echo "check-destroy-plan.sh: $1" >&2
  usage_line
  exit 2
}

# The three counts of the plan, space-separated: deletes, changes outside the module, changes of another action.
PLAN_COUNTS='
  if type != "object" then error("not a plan document") else . end
  | (.resource_changes // [])
  | if type != "array" then error("resource_changes is not a list") else . end
  | map(select(.mode == "managed"))
  | [
      (map(select(.change.actions == ["delete"])) | length),
      (map(select(.change.actions != ["no-op"] and ((.address | startswith("module.frontend.")) | not))) | length),
      (map(select(.change.actions != ["delete"] and .change.actions != ["no-op"])) | length)
    ]
  | map(tostring)
  | join(" ")
'

# The number of managed resources in a state list. An address names a data source when, its index keys removed, it
# continues with `data.` after any number of `module.<name>.` segments, so a `data.` inside a key does not count.
state_count() {
  awk '
    NF {
      address = $0
      gsub(/\[[^]]*\]/, "", address)
      if (address !~ /^(module\.[^.]+\.)*data\./) n++
    }
    END { print n + 0 }
  ' "$1"
}

check() {
  local counts rc planned outside other state guard

  rc=0
  counts="$(jq -r "$PLAN_COUNTS" "$PLAN_JSON" 2> /dev/null)" || rc=$?
  if [ "$rc" -ne 0 ]; then
    echo "check-destroy-plan.sh: the plan file is not a plan document (jq exited $rc)" >&2
    echo "destroy_guard=fail"
    exit 1
  fi
  read -r planned outside other <<< "$counts"

  rc=0
  state="$(state_count "$STATE_LIST")" || rc=$?
  if [ "$rc" -ne 0 ]; then
    echo "check-destroy-plan.sh: the state list could not be read (awk exited $rc)" >&2
    echo "destroy_guard=fail"
    exit 1
  fi

  if [ "$outside" -eq 0 ] && [ "$other" -eq 0 ] && [ "$planned" -eq "$state" ]; then
    guard=pass
  else
    guard=fail
  fi

  echo "destroy_planned=$planned"
  echo "destroy_state_resources=$state"
  echo "destroy_outside_module=$outside"
  echo "destroy_other_actions=$other"
  echo "destroy_guard=$guard"
  [ "$guard" = pass ] || exit 1
}

main() {
  case "${1:-}" in
    -h | --help)
      print_header
      exit 0
      ;;
  esac

  while [ "$#" -gt 0 ]; do
    case "$1" in
      --plan-json)
        [ "$#" -ge 2 ] || usage_error "--plan-json requires a value"
        PLAN_JSON="$2"
        shift 2
        ;;
      --state-list)
        [ "$#" -ge 2 ] || usage_error "--state-list requires a value"
        STATE_LIST="$2"
        shift 2
        ;;
      *)
        usage_error "unknown argument: $1"
        ;;
    esac
  done
  [ -n "$PLAN_JSON" ] || usage_error "--plan-json is required"
  [ -n "$STATE_LIST" ] || usage_error "--state-list is required"
  [ -f "$PLAN_JSON" ] && [ -r "$PLAN_JSON" ] || usage_error "the plan file $PLAN_JSON is missing or unreadable"
  [ -f "$STATE_LIST" ] && [ -r "$STATE_LIST" ] || usage_error "the state list $STATE_LIST is missing or unreadable"
  command -v jq > /dev/null || usage_error "jq is not on the PATH"

  check
  exit 0
}

main "$@"
