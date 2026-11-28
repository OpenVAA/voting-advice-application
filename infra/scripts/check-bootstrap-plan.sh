#!/usr/bin/env bash
#
# check-bootstrap-plan.sh -- Check that a plan of the bootstrap root deletes nothing, replaces nothing, keeps every moved address and creates only under the deployment keys it is told to expect.
#
# The bootstrap root holds the account-wide identity, the state bucket and one set of per-deployment resources for each key of its deployment map. A plan of it that deletes or replaces a resource would remove a role, a policy or the image registry that a running deployment depends on, and a create outside a new deployment's key is a resource the change did not mean to add. A moved address that is planned as anything but a no-op or an in-place update did not survive its move.
#
# What it reads, and nothing else:
#   - one plan as `terraform show -json <plan>` prints it, or the `test_plan` object of one run of `terraform test -json`: of each `resource_changes` entry of mode `managed`, its `address`, its `previous_address`, its `change.actions` and its `change.replace_paths`. Entries of mode `data` are not resources and are not counted. A plan with no change has no `resource_changes` list and is read as an empty one; a document that is not an object, or whose `resource_changes` is not a list, is not a plan document.
#
# It prints eight lines and nothing of the plan:
#   bootstrap_plan_delete=<n>             managed changes that delete and do not create.
#   bootstrap_plan_replace=<n>            managed changes that both delete and create, or that carry a non-empty replace_paths.
#   bootstrap_plan_moved=<n>              managed changes whose previous_address differs from their address.
#   bootstrap_plan_failed_move=<n>        moved changes whose actions are anything but ["no-op"] or ["update"].
#   bootstrap_plan_update=<n>             managed changes whose actions are exactly ["update"].
#   bootstrap_plan_create=<n>             managed changes whose actions are exactly ["create"].
#   bootstrap_plan_unexpected_create=<n>  creates whose address holds no ["<key>"] index of a key named by --new-key.
#   bootstrap_plan_guard=pass|fail        pass only when delete, replace, failed_move and unexpected_create are 0, and, under --pure-move, update and create are 0 too.
# A plan file that is not a plan document prints `bootstrap_plan_guard=fail` alone. jq's own message is not printed, so that no part of the plan reaches the log.
#
# Usage:
#   infra/scripts/check-bootstrap-plan.sh --plan-json <file> [--new-key <key>]... [--pure-move]
#
#   --plan-json <file>  REQUIRED. The plan document to check.
#   --new-key <key>     OPTIONAL, repeatable. A deployment key under which this plan may create resources. A key starts with a lower-case letter and holds only lower-case letters, digits and hyphens.
#   --pure-move         OPTIONAL. Also refuse every update and every create: the plan may only move addresses.
#   -h, --help          Print this header and exit 0.
#
# For a caller: read the status directly, never through a pipe.
#
# Exit codes:
#   0:  the plan passes the guard
#   1:  the plan fails the guard, or the plan file is not a plan document
#   2:  usage error: a missing flag or value, a missing or unreadable file, a malformed key, or no jq on the PATH
#
# `set -x` must not be added.

set -euo pipefail
set -f

export LC_ALL=C

SCRIPT_PATH="${BASH_SOURCE[0]}"
SCRIPT_NAME="check-bootstrap-plan.sh"
USAGE_LINE="--plan-json <file> [--new-key <key>]... [--pure-move] | -h | --help"
# shellcheck source=../../scripts/lib/cli.sh
. "$(dirname "$SCRIPT_PATH")/../../scripts/lib/cli.sh"

PLAN_JSON=""
PURE_MOVE=0
NEW_KEYS=()

# The seven counts of the plan, space-separated, in the order of the result lines. $keys is the JSON list of the keys named by --new-key.
PLAN_COUNTS='
  if type != "object" then error("not a plan document") else . end
  | (if has("resource_changes") then .resource_changes else [] end) as $changes
  | if ($changes | type) != "array" then error("resource_changes is not a list") else . end
  | ($changes | map(select(.mode == "managed"))) as $managed
  | def acts: (.change.actions // []);
    def replaces: ((acts | index("delete")) != null and (acts | index("create")) != null)
      or (((.change.replace_paths // []) | length) > 0);
    def keyed: .address as $address | any($keys[]; . as $key | $address | contains("[\"" + $key + "\"]"));
    ($managed | map(select(.previous_address != null and .previous_address != .address))) as $moved
  | ($managed | map(select(acts == ["create"]))) as $created
  | [
      ($managed | map(select((acts | index("delete")) != null and (acts | index("create")) == null)) | length),
      ($managed | map(select(replaces)) | length),
      ($moved | length),
      ($moved | map(select(acts != ["no-op"] and acts != ["update"])) | length),
      ($managed | map(select(acts == ["update"])) | length),
      ($created | length),
      ($created | map(select(keyed | not)) | length)
    ]
  | map(tostring)
  | join(" ")
'

check() {
  local counts rc keys_json delete replace moved failed_move update create unexpected guard

  keys_json="$(printf '%s\n' "${NEW_KEYS[@]+"${NEW_KEYS[@]}"}" | jq -R -s -c 'split("\n") | map(select(length > 0))')"

  rc=0
  counts="$(jq -r --argjson keys "$keys_json" "$PLAN_COUNTS" "$PLAN_JSON" 2> /dev/null)" || rc=$?
  if [ "$rc" -ne 0 ]; then
    echo "check-bootstrap-plan.sh: the plan file $PLAN_JSON is not a plan document (jq exited $rc)" >&2
    echo "bootstrap_plan_guard=fail"
    exit 1
  fi
  read -r delete replace moved failed_move update create unexpected <<< "$counts"

  guard=pass
  if [ "$delete" -ne 0 ] || [ "$replace" -ne 0 ] || [ "$failed_move" -ne 0 ] || [ "$unexpected" -ne 0 ]; then
    guard=fail
  fi
  if [ "$PURE_MOVE" -eq 1 ] && { [ "$update" -ne 0 ] || [ "$create" -ne 0 ]; }; then
    guard=fail
  fi

  echo "bootstrap_plan_delete=$delete"
  echo "bootstrap_plan_replace=$replace"
  echo "bootstrap_plan_moved=$moved"
  echo "bootstrap_plan_failed_move=$failed_move"
  echo "bootstrap_plan_update=$update"
  echo "bootstrap_plan_create=$create"
  echo "bootstrap_plan_unexpected_create=$unexpected"
  echo "bootstrap_plan_guard=$guard"
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
        require_value "$1" "$#"
        PLAN_JSON="$2"
        shift 2
        ;;
      --new-key)
        require_value "$1" "$#"
        [[ "$2" =~ ^[a-z][a-z0-9-]*$ ]] || usage_error "--new-key must match ^[a-z][a-z0-9-]*\$: $2"
        NEW_KEYS+=("$2")
        shift 2
        ;;
      --pure-move)
        PURE_MOVE=1
        shift
        ;;
      *)
        usage_error "unknown argument: $1"
        ;;
    esac
  done
  [ -n "$PLAN_JSON" ] || usage_error "--plan-json is required"
  [ -f "$PLAN_JSON" ] && [ -r "$PLAN_JSON" ] || usage_error "the plan file $PLAN_JSON is missing or unreadable"
  command -v jq > /dev/null || usage_error "jq is not on the PATH"

  check
  exit 0
}

main "$@"
