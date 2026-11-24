#!/usr/bin/env bash
#
# check-bootstrap-moves.sh -- Prove offline that the working tree's bootstrap root, planned against the state a base commit's bootstrap root leaves, deletes nothing, replaces nothing and creates only under the deployment keys it is told to expect.
#
# It runs one `terraform test` in a scratch directory that holds the base commit's `infra/bootstrap` and `infra/modules`, taken with `git archive`, beside a copy of the working tree's. The test has two runs that share one state: the first applies the base root under a mock AWS provider, and the second plans the working tree's root against that state under the real AWS provider with fake keys and refresh off. A mock provider never reports a replacement, so only the real provider's plan shows an attribute change that forces one. That plan is handed to check-bootstrap-plan.sh. The real provider reaches no account: its keys are fake, credential and account checks are skipped, nothing is refreshed, the one data source it would read is overridden, and no credential or profile of the calling shell reaches terraform. The repository is not written to; the scratch directory is removed at exit.
#
# The mocked state stores the mock's policy documents, so the plan shows updates even when the tree equals the base. The proof therefore covers delete, replace and unexpected create only, and check-bootstrap-plan.sh is not given --pure-move.
#
# It prints, and nothing of the plan beyond them:
#   bootstrap_moves_base_map=present|absent  whether the base commit holds infra/bootstrap/deployments.auto.tfvars.json, whose map the base run is given.
#   bootstrap_moves_note=undeclared_map_file_skipped  only when the tree holds that file but its variables.tf declares no `deployments`; the file is left out of the copy.
#   bootstrap_moves_base=<sha>               the full id of the base commit.
#   bootstrap_moves_failed=<step>            only when a step fails; the step's name.
#   bootstrap_moves_workdir=<path>           only under --keep.
#   the eight lines of check-bootstrap-plan.sh, unchanged.
#
# Usage:
#   infra/scripts/check-bootstrap-moves.sh --base <commit> [--new-key <key>]... [--keep]
#
#   --base <commit>    REQUIRED. The commit whose bootstrap root the state comes from.
#   --new-key <key>    OPTIONAL, repeatable. Passed to check-bootstrap-plan.sh: a deployment key under which the plan may create resources.
#   --keep             OPTIONAL. Leave the scratch directory in place and print its path, for diagnosis.
#   -h, --help         Print this header and exit 0.
#
# It needs `terraform` on the PATH whose `terraform version` first line is `Terraform v1.16.5`, `jq`, `git` and `tar`. The provider is downloaded by `terraform init`.
#
# For a caller: read the status directly, never through a pipe.
#
# Exit codes:
#   0:    the plan passes check-bootstrap-plan.sh
#   1:    the plan fails check-bootstrap-plan.sh, or no plan of the tree's run was found
#   2:    usage error: a missing flag or value, a malformed key, a base that is not a commit, or no terraform 1.16.5, jq, git or tar on the PATH
#   130:  interrupted
#   any other value: the failing step's own status, terraform's included
#
# `set -x` must not be added.

set -euo pipefail
set -f

export LC_ALL=C

SCRIPT_PATH="${BASH_SOURCE[0]}"
SCRIPT_NAME="check-bootstrap-moves.sh"
USAGE_LINE="--base <commit> [--new-key <key>]... [--keep] | -h | --help"
# shellcheck source=../../scripts/lib/cli.sh
. "$(dirname "$SCRIPT_PATH")/../../scripts/lib/cli.sh"

TERRAFORM_VERSION_LINE="Terraform v1.16.5"
KMS_KEY_ARN="arn:aws:kms:eu-north-1:471112560111:key/00000000-0000-0000-0000-000000000000"

BASE_REF=""
BASE=""
KEEP=0
NEW_KEY_FLAGS=()
WORK=""
REPO=""
TREE_ROOT=""

on_exit() {
  if [ "$KEEP" -eq 1 ]; then
    [ -z "$WORK" ] || echo "bootstrap_moves_workdir=$WORK"
    return
  fi
  [ -z "$WORK" ] || rm -rf "$WORK"
}

# $1 = step name, $2 = message, $3 = status. Prints the failed step and exits with the status.
fail_step() {
  echo "bootstrap_moves_failed=$1"
  note "$2"
  exit "$3"
}

# Runs terraform with no credential, profile or metadata source of the calling shell.
tf() {
  env -u AWS_ACCESS_KEY_ID -u AWS_SECRET_ACCESS_KEY -u AWS_SESSION_TOKEN -u AWS_SECURITY_TOKEN \
    -u AWS_PROFILE -u AWS_DEFAULT_PROFILE -u AWS_ROLE_ARN -u AWS_WEB_IDENTITY_TOKEN_FILE \
    -u AWS_CONTAINER_CREDENTIALS_FULL_URI -u AWS_CONTAINER_CREDENTIALS_RELATIVE_URI \
    AWS_CONFIG_FILE=/dev/null AWS_SHARED_CREDENTIALS_FILE=/dev/null AWS_EC2_METADATA_DISABLED=true \
    CHECKPOINT_DISABLE=1 TF_IN_AUTOMATION=1 TF_INPUT=0 \
    terraform "$@"
}

check_tools() {
  local out first
  command -v jq > /dev/null || usage_error "jq is not on the PATH"
  command -v git > /dev/null || usage_error "git is not on the PATH"
  command -v tar > /dev/null || usage_error "tar is not on the PATH"
  command -v terraform > /dev/null || usage_error "terraform is not on the PATH"
  out="$(CHECKPOINT_DISABLE=1 terraform version 2> /dev/null)" || usage_error "terraform version could not be read"
  first="${out%%$'\n'*}"
  [ "$first" = "$TERRAFORM_VERSION_LINE" ] || usage_error "terraform on the PATH is '$first', not '$TERRAFORM_VERSION_LINE'"
}

resolve_base() {
  REPO="$(git -C "$(dirname "$SCRIPT_PATH")" rev-parse --show-toplevel 2> /dev/null)" \
    || usage_error "the script is not inside a git working tree"
  BASE="$(git -C "$REPO" rev-parse --verify --quiet "${BASE_REF}^{commit}" 2> /dev/null)" \
    || usage_error "--base is not a commit: $BASE_REF"
}

make_workdir() {
  WORK="$(
    umask 077
    mktemp -d "${TMPDIR:-/tmp}/openvaa-bootstrap-moves.XXXXXX"
  )" || fail_step workdir "the scratch directory could not be created" 1
}

extract_base() {
  mkdir -p "$WORK/base" || fail_step base "the base directory could not be created" 1
  git -C "$REPO" archive --format=tar -o "$WORK/base.tar" "$BASE" infra/bootstrap infra/modules 2> /dev/null \
    || fail_step base "the base commit's infra/bootstrap and infra/modules could not be archived" 1
  tar -x -f "$WORK/base.tar" -C "$WORK/base" 2> /dev/null \
    || fail_step base "the base commit's archive could not be extracted" 1
  rm -f "$WORK/base.tar"
}

copy_tree() {
  local excludes=(--exclude=.terraform --exclude='*.tfstate' --exclude='*.tfstate.*' --exclude=.terraform.tfstate.lock.info)
  if [ -f "$REPO/infra/bootstrap/deployments.auto.tfvars.json" ] \
    && ! find "$REPO/infra/bootstrap" -maxdepth 1 -name '*.tf' -type f \
      -exec grep -Eq '^[[:space:]]*variable[[:space:]]+"deployments"' {} + 2> /dev/null; then
    excludes+=(--exclude=infra/bootstrap/deployments.auto.tfvars.json)
    echo "bootstrap_moves_note=undeclared_map_file_skipped"
  fi
  mkdir -p "$WORK/tree" || fail_step tree "the tree directory could not be created" 1
  tar -C "$REPO" "${excludes[@]}" -c -f "$WORK/tree.tar" infra/bootstrap infra/modules 2> /dev/null \
    || fail_step tree "the working tree's infra/bootstrap and infra/modules could not be archived" 1
  tar -x -f "$WORK/tree.tar" -C "$WORK/tree" 2> /dev/null \
    || fail_step tree "the working tree's archive could not be extracted" 1
  rm -f "$WORK/tree.tar"
  TREE_ROOT="$WORK/tree/infra/bootstrap"
}

# Prints the body of the base run's variables block: the base commit's terraform.tfvars without its comment lines, then the base commit's deployment map when it has one.
base_variables() {
  local map_file="$WORK/base/infra/bootstrap/deployments.auto.tfvars.json" map
  if [ -f "$WORK/base/infra/bootstrap/terraform.tfvars" ]; then
    grep -Ev '^[[:space:]]*#' "$WORK/base/infra/bootstrap/terraform.tfvars" | sed 's/^/    /'
  fi
  if [ -f "$map_file" ]; then
    map="$(jq -c '.deployments' "$map_file" 2> /dev/null)" || return 1
    [ -n "$map" ] && [ "$map" != null ] || return 1
    printf '    deployments = %s\n' "$map"
  fi
}

write_test() {
  local target body
  if [ -f "$WORK/base/infra/bootstrap/deployments.auto.tfvars.json" ]; then
    echo "bootstrap_moves_base_map=present"
  else
    echo "bootstrap_moves_base_map=absent"
  fi
  body="$(base_variables)" || fail_step test-file "the base commit's deployment map could not be read" 1

  if grep -q 'for_each' "$TREE_ROOT/main.tf"; then
    target='module.frontend_task_role["staging"].data.aws_kms_alias.ssm'
  else
    target='module.frontend_task_role.data.aws_kms_alias.ssm'
  fi

  mkdir -p "$TREE_ROOT/tests" || fail_step test-file "the tests directory could not be created" 1
  cat > "$TREE_ROOT/tests/move.tftest.hcl" << EOF || fail_step test-file "the test file could not be written" 1
mock_provider "aws" {
  alias = "mock"

  mock_data "aws_kms_alias" {
    defaults = { target_key_arn = "$KMS_KEY_ARN" }
  }

  mock_data "aws_iam_policy_document" {
    defaults = { json = "{\"Version\":\"2012-10-17\",\"Statement\":[]}" }
  }

  mock_resource "aws_iam_policy" {
    defaults = { arn = "arn:aws:iam::471112560111:policy/openvaa/mock" }
  }

  mock_resource "aws_iam_role" {
    defaults = { arn = "arn:aws:iam::471112560111:role/openvaa/openvaa-staging-frontend-execution" }
  }

  mock_resource "aws_iam_openid_connect_provider" {
    defaults = { arn = "arn:aws:iam::471112560111:oidc-provider/token.actions.githubusercontent.com" }
  }

  mock_resource "aws_s3_bucket" {
    defaults = { arn = "arn:aws:s3:::openvaa-tfstate-471112560111" }
  }

  mock_resource "aws_ecr_repository" {
    defaults = { arn = "arn:aws:ecr:eu-north-1:471112560111:repository/openvaa-frontend" }
  }
}

provider "aws" {
  region                      = "eu-north-1"
  access_key                  = "AKIAFAKEFAKEFAKEFAKE"
  secret_key                  = "fake"
  skip_credentials_validation = true
  skip_requesting_account_id  = true
  skip_metadata_api_check     = true
  skip_region_validation      = true
}

variables {
  alert_email = "ops@example.org"
}

run "pre_map" {
  state_key = "bootstrap"
  providers = { aws = aws.mock }

  module {
    source = "../../../base/infra/bootstrap"
  }

  variables {
$body
  }
}

run "map" {
  command   = plan
  state_key = "bootstrap"

  plan_options {
    refresh = false
  }

  override_data {
    target = $target
    values = { target_key_arn = "$KMS_KEY_ARN" }
  }
}
EOF
}

# Prints the last 40 diagnostics of the test run, summary and detail, to standard error.
print_diagnostics() {
  jq -r 'select(.type == "diagnostic") | .diagnostic.summary + ": " + (.diagnostic.detail // "")' \
    "$WORK/test.jsonl" 2> /dev/null | tail -n 40 >&2 || true
}

run_test() {
  local rc=0
  tf -chdir="$TREE_ROOT" init -backend=false -input=false -lockfile=readonly > "$WORK/init.log" 2>&1 || rc=$?
  if [ "$rc" -ne 0 ]; then
    tail -n 40 "$WORK/init.log" >&2 || true
    fail_step init "terraform init of the tree's bootstrap root failed" "$rc"
  fi

  rc=0
  tf -chdir="$TREE_ROOT" test -json -verbose -filter=tests/move.tftest.hcl > "$WORK/test.jsonl" 2> "$WORK/test.err" || rc=$?
  if [ "$rc" -ne 0 ]; then
    print_diagnostics
    tail -n 20 "$WORK/test.err" >&2 || true
    fail_step test "terraform test of the move failed" "$rc"
  fi
}

extract_plan() {
  jq -c 'select(.type == "test_plan" and ."@testrun" == "map") | .test_plan' "$WORK/test.jsonl" \
    > "$WORK/map-plan.json" 2> /dev/null || fail_step plan "the test output could not be read" 1
  [ -s "$WORK/map-plan.json" ] || fail_step plan "the test output holds no plan of the run named map" 1
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
      --base)
        require_value "$1" "$#"
        BASE_REF="$2"
        shift 2
        ;;
      --new-key)
        require_value "$1" "$#"
        [[ "$2" =~ ^[a-z][a-z0-9-]*$ ]] || usage_error "--new-key must match ^[a-z][a-z0-9-]*\$: $2"
        NEW_KEY_FLAGS+=(--new-key "$2")
        shift 2
        ;;
      --keep)
        KEEP=1
        shift
        ;;
      *)
        usage_error "unknown argument: $1"
        ;;
    esac
  done
  [ -n "$BASE_REF" ] || usage_error "--base is required"

  check_tools
  resolve_base

  trap on_exit EXIT
  trap 'exit 130' INT TERM HUP

  make_workdir
  extract_base
  copy_tree
  write_test
  run_test
  extract_plan

  echo "bootstrap_moves_base=$BASE"
  local rc=0
  bash "$(dirname "$SCRIPT_PATH")/check-bootstrap-plan.sh" --plan-json "$WORK/map-plan.json" \
    "${NEW_KEY_FLAGS[@]+"${NEW_KEY_FLAGS[@]}"}" || rc=$?
  exit "$rc"
}

main "$@"
