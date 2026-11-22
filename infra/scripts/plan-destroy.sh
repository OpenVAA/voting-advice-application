#!/usr/bin/env bash
#
# plan-destroy.sh -- Plan the destroy of a deployment's AWS root and check the plan destroys that stack and nothing else.
#
# Both jobs of the destroy workflow run this, the first to show the plan before its approval and the second to plan again before it applies, because no plan file crosses jobs. It needs an initialised root and credentials that read its state.
#
# What it does, in this order, each step only when the one before passed:
#   1. `terraform state list` of the root into `<dir>/state.txt`, printing `state_list_exit=<status>`.
#   2. `terraform plan -destroy` into `<dir>/destroy.tfplan`, its output into `<dir>/destroy-plan.log`, printing `plan_exit=<status>`. A destroy applies no variable value, so the digest and the alert address are placeholders that pass the variables' checks and reach no resource; no running service is read for the digest, so a destroy that stopped after the service was deleted can be run again. The log is printed only when the plan fails, so nothing of a plan is printed before the guard.
#   3. `terraform show -json` of the saved plan into `<dir>/destroy.json`, under umask 077 because the JSON form holds sensitive values in the clear, printing `export_exit=<status>`. It is never printed.
#   4. `infra/scripts/check-destroy-plan.sh --plan-json --state-list` on those two files, printing its own lines and `guard_exit=<status>`.
#   5. On a pass of the guard only, `terraform show -no-color` of the saved plan into `<dir>/destroy-plan.txt`, printing `show_exit=<status>`.
#
# Usage (from the repository root):
#
#   ```sh
#   infra/scripts/plan-destroy.sh --root <aws root> --out-dir <dir>
#   ```
#
#   --root <dir>     REQUIRED. The AWS root, such as infra/envs/staging/aws, initialised with its backend.
#   --out-dir <dir>  REQUIRED. Where the files above are written; created when absent. The caller removes it.
#   -h, --help       Print this header and exit 0.
#
# For a caller: read the status directly, never through a pipe. The plan to apply is `<dir>/destroy.tfplan`, and the plan to show is `<dir>/destroy-plan.txt`.
#
# Exit codes:
#   0:  the plan is the stack's destroy, and `destroy-plan.txt` holds it
#   1:  a step failed; the last `*_exit=` line printed names it
#   2:  usage error
#
# `set -x` must not be added.

set -euo pipefail
set -f

export LC_ALL=C

SCRIPT_PATH="${BASH_SOURCE[0]}"
SCRIPT_NAME="plan-destroy.sh"
USAGE_LINE="--root <aws root> --out-dir <dir> | -h | --help"
# shellcheck source=../../scripts/lib/cli.sh
. "$(dirname "$SCRIPT_PATH")/../../scripts/lib/cli.sh"

# The placeholders a destroy plan passes for the two variables it applies to no resource.
PLACEHOLDER_DIGEST="sha256:0000000000000000000000000000000000000000000000000000000000000000"
PLACEHOLDER_ALERT_EMAIL="destroy-plan@example.invalid"

AWS_ROOT=""
OUT=""

plan_destroy() {
  local rc

  rc=0
  terraform -chdir="$AWS_ROOT" state list > "$OUT/state.txt" || rc=$?
  echo "state_list_exit=$rc"
  [ "$rc" -eq 0 ] || return 1

  rc=0
  TF_VAR_alert_email="$PLACEHOLDER_ALERT_EMAIL" terraform -chdir="$AWS_ROOT" plan -destroy -input=false -no-color \
    -var "image_digest=$PLACEHOLDER_DIGEST" -out="$OUT/destroy.tfplan" > "$OUT/destroy-plan.log" 2>&1 || rc=$?
  echo "plan_exit=$rc"
  if [ "$rc" -ne 0 ]; then
    cat "$OUT/destroy-plan.log"
    return 1
  fi

  rc=0
  (umask 077 && terraform -chdir="$AWS_ROOT" show -json "$OUT/destroy.tfplan" > "$OUT/destroy.json") || rc=$?
  echo "export_exit=$rc"
  [ "$rc" -eq 0 ] || return 1

  rc=0
  "$(dirname "$SCRIPT_PATH")/check-destroy-plan.sh" --plan-json "$OUT/destroy.json" --state-list "$OUT/state.txt" || rc=$?
  echo "guard_exit=$rc"
  [ "$rc" -eq 0 ] || return 1

  rc=0
  terraform -chdir="$AWS_ROOT" show -no-color "$OUT/destroy.tfplan" > "$OUT/destroy-plan.txt" || rc=$?
  echo "show_exit=$rc"
  [ "$rc" -eq 0 ] || return 1
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
      --root)
        require_value --root "$#"
        AWS_ROOT="$2"
        shift 2
        ;;
      --out-dir)
        require_value --out-dir "$#"
        OUT="$2"
        shift 2
        ;;
      *)
        usage_error "unknown argument: $1"
        ;;
    esac
  done
  [ -n "$AWS_ROOT" ] || usage_error "--root is required"
  [ -n "$OUT" ] || usage_error "--out-dir is required"
  [ -d "$AWS_ROOT" ] || usage_error "--root $AWS_ROOT is not a directory"

  (umask 077 && mkdir -p "$OUT")
  plan_destroy || exit 1
  exit 0
}

main "$@"
