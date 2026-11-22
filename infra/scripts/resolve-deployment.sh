#!/usr/bin/env bash
#
# resolve-deployment.sh -- Name the deployment a workflow run acts on, and print the names derived from it.
#
# The first job of `deploy.yml`, `destroy.yml` and `infra-plan.yml` runs this script, without credentials, before any job names an environment or assumes a role. It reads two committed files and nothing else: the deployment map `infra/bootstrap/deployments.auto.tfvars.json`, and the account-level values `aws_account_id`, `aws_region`, `name_prefix`, `iam_path` and `state_bucket_name` of `infra/bootstrap/terraform.tfvars`, each written there once as `name = "value"`. A repository owns the entries of the map whose `github_repository_id` equals its own id, so an entry another repository owns is inert here.
#
# Modes:
#   deploy   the owned entry one of whose `deploy_branches` matches --ref. A ref that starts with `deploy-evidence/destroy-` never matches.
#   destroy  on a push, the owned entry whose destroy branch is --ref; on a dispatch, the owned entry that deploy mode resolves for --ref.
#   plan     every owned entry whose AWS root exists.
#
# Branch rule: an item of `deploy_branches` matches a ref equal to it, or, when it ends in `/*`, a ref made of its prefix and one more non-empty path segment holding no `/`, as a GitHub Environment branch policy matches.
#
# Derived names, for the key K of the entry, with `name_prefix`, `iam_path`, the account and the region from the tfvars, and P the entry's `iam_name_prefix` (default `<name_prefix>-K`):
#   aws_root            infra/envs/K/aws.
#   supabase_root       infra/envs/K/supabase.
#   state_key           pipeline/K/aws/terraform.tfstate.
#   supabase_state_key  hand/K/supabase/terraform.tfstate.
#   deploy_role_arn     arn:aws:iam::<account>:role<iam_path><name_prefix>-K-deploy.
#   plan_role_arn       arn:aws:iam::<account>:role<iam_path>P-plan.
#   topic_arn           arn:aws:sns:<region>:<account>:<name_prefix>-K-frontend-deployments.
#   cluster_name        <name_prefix>-K.
#   service_name        <name_prefix>-K-frontend.
#   destroy_branch      deploy-evidence/destroy-K.
#   destroy_confirm     destroy K aws.
# A key must match ^[a-z][a-z0-9-]*$ and be at most 15 characters long, and a resolved key's AWS and Supabase roots must exist.
#
# Usage:
#   infra/scripts/resolve-deployment.sh --mode deploy|destroy|plan --repository-id <id> [--ref <ref>] [--event push|workflow_dispatch] [--github-output <file>]
#
#   --mode <mode>           REQUIRED. deploy, destroy or plan.
#   --repository-id <id>    REQUIRED. The run's numeric repository id, github.repository_id.
#   --ref <ref>             The run's branch name, github.ref_name. Required in deploy and destroy mode, refused in plan mode.
#   --event <event>         The run's event, push or workflow_dispatch. Required in destroy mode, refused otherwise.
#   --github-output <file>  Also append the printed lines to this file, the step's GITHUB_OUTPUT.
#   -h, --help              Print this header and exit 0.
#
# For a caller: read the status directly, never through a pipe. In deploy and destroy mode status 0 prints nineteen lines, in this order: `key=`, `github_environment=`, `github_destroy_environment=`, `domain=`, `smoke=`, `aws_account_id=`, `aws_region=`, `state_bucket=`, `aws_root=`, `supabase_root=`, `state_key=`, `supabase_state_key=`, `deploy_role_arn=`, `plan_role_arn=`, `topic_arn=`, `cluster_name=`, `service_name=`, `destroy_branch=`, `destroy_confirm=`. The GitHub Environments are the entry's `github_environment` and `github_destroy_environment`, empty when it names none, and `smoke=` is `true` only when the entry sets `smoke` to true. In plan mode status 0 prints one line, `deployments=` and a compact JSON array, sorted by key, of objects with the fields key, aws_root, plan_role_arn, deploy_role_arn, cluster_name and service_name. Status 1 prints one `failed=<reason>` line and writes nothing to the output file. Every value is public, but the text of a map that does not parse is never printed.
#
# Exit codes:
#   0:  resolved
#   1:  refused: bad_map (a map or tfvars value that cannot be read), no_owned_entry, no_branch_match, ambiguous, bad_key or missing_root
#   2:  usage error, or no jq on the PATH
#
# `set -x` must not be added.

set -euo pipefail
set -f

export LC_ALL=C

SCRIPT_PATH="${BASH_SOURCE[0]}"
SCRIPT_NAME="resolve-deployment.sh"
USAGE_LINE="--mode deploy|destroy|plan --repository-id <id> [--ref <ref>] [--event push|workflow_dispatch] [--github-output <file>] | -h | --help"
# shellcheck source=../../scripts/lib/cli.sh
. "$(dirname "$SCRIPT_PATH")/../../scripts/lib/cli.sh"

REPO_ROOT="$(cd "$(dirname "$SCRIPT_PATH")/../.." && pwd)"
MAP="$REPO_ROOT/infra/bootstrap/deployments.auto.tfvars.json"
TFVARS="$REPO_ROOT/infra/bootstrap/terraform.tfvars"

MODE=""
REPOSITORY_ID=""
REF=""
REF_SET=0
EVENT=""
GITHUB_OUTPUT_FILE=""

ACCOUNT_ID=""
REGION=""
NAME_PREFIX=""
IAM_PATH=""
STATE_BUCKET=""

# The owned keys, one JSON string per line, so that a key holding a newline stays one line.
OWNED_KEYS='
  if (.deployments | type) != "object" then error("no deployments object") else . end
  | .deployments
  | to_entries[]
  | select((.value.github_repository_id | tostring) == $id)
  | .key
  | @json
'

# The owned keys that match the ref, one per line. In destroy mode a push matches the destroy branch alone, and a dispatch matches as deploy mode does.
MATCHED_KEYS='
  def matches($ref):
    . as $item
    | if ($item | endswith("/*")) then
        ($item[:-1]) as $prefix
        | ($ref | startswith($prefix))
          and ($ref[($prefix | length):] | length > 0 and (contains("/") | not))
      else
        $item == $ref
      end;
  .deployments
  | to_entries[]
  | select((.value.github_repository_id | tostring) == $id)
  | select(
      if $mode == "destroy" and $event == "push" then
        $ref == ("deploy-evidence/destroy-" + .key)
      else
        ($ref | startswith("deploy-evidence/destroy-") | not)
        and any((.value.deploy_branches // [])[]; type == "string" and matches($ref))
      end
    )
  | .key
'

# The entry fields the derivations need, one per line, in this order: github_environment, github_destroy_environment, domain, iam_name_prefix, smoke (`true` or `false`).
ENTRY_FIELDS='
  .deployments[$key]
  | [
      .github_environment // "",
      .github_destroy_environment // "",
      .domain // "",
      .iam_name_prefix // ($np + "-" + $key),
      ((.smoke // false) | if type == "boolean" then tostring else error("bad field") end)
    ]
  | if any(.[]; type != "string" or test("[\n\r]")) then error("bad field") else .[] end
'

# The plan-mode list, for the keys given as positional arguments.
PLAN_LIST='
  .deployments as $d
  | [
      $ARGS.positional[] as $k
      | ($d[$k].iam_name_prefix // ($np + "-" + $k)) as $p
      | if ($p | type) != "string" or ($p | test("[\n\r]")) then error("bad field") else . end
      | {
          key: $k,
          aws_root: ("infra/envs/" + $k + "/aws"),
          plan_role_arn: ("arn:aws:iam::" + $account + ":role" + $iam_path + $p + "-plan"),
          deploy_role_arn: ("arn:aws:iam::" + $account + ":role" + $iam_path + $np + "-" + $k + "-deploy"),
          cluster_name: ($np + "-" + $k),
          service_name: ($np + "-" + $k + "-frontend")
        }
    ]
  | sort_by(.key)
'

# Descriptor 3 is the script's standard output, so that a refusal inside a command substitution still reaches it.
exec 3>&1

# $1 = reason, $2 = optional note for standard error. Inside a command substitution the exit ends the subshell, and the failed assignment then ends the script with the same status.
refuse() {
  [ -z "${2:-}" ] || note "$2"
  echo "failed=$1" >&3
  exit 1
}

# $1 = the tfvars name. Prints its value, which must be written exactly once, as a quoted string.
tfvar() {
  tfvar_value "$TFVARS" "$1" || refuse bad_map "$1 is not written exactly once as a quoted string in infra/bootstrap/terraform.tfvars"
}

read_account() {
  [ -f "$TFVARS" ] && [ -r "$TFVARS" ] || refuse bad_map "infra/bootstrap/terraform.tfvars is missing or unreadable"
  ACCOUNT_ID="$(tfvar aws_account_id)"
  REGION="$(tfvar aws_region)"
  NAME_PREFIX="$(tfvar name_prefix)"
  IAM_PATH="$(tfvar iam_path)"
  STATE_BUCKET="$(tfvar state_bucket_name)"
}

# Prints the owned keys, each checked for its form.
owned_keys() {
  local raw rc line key
  [ -f "$MAP" ] && [ -r "$MAP" ] || refuse bad_map "infra/bootstrap/deployments.auto.tfvars.json is missing or unreadable"
  rc=0
  jq -e '(.deployments | type) == "object" and all(.deployments[]; type == "object")' "$MAP" > /dev/null 2>&1 || rc=$?
  [ "$rc" -eq 0 ] || refuse bad_map "the deployment map is not JSON holding a deployments object of entries (jq exited $rc)"
  raw="$(jq -r --arg id "$REPOSITORY_ID" "$OWNED_KEYS" "$MAP" 2> /dev/null)" || refuse bad_map "the deployment map could not be read"
  [ -n "$raw" ] || refuse no_owned_entry "no entry of the deployment map has github_repository_id $REPOSITORY_ID"
  while IFS= read -r line; do
    if ! [[ "$line" =~ ^\"[a-z][a-z0-9-]*\"$ ]] || [ "${#line}" -gt 17 ]; then
      refuse bad_key "an owned key is not lower-case letters, digits and hyphens starting with a letter, at most 15 characters"
    fi
    key="${line#\"}"
    printf '%s\n' "${key%\"}"
  done <<< "$raw"
}

# $1 = the output lines. Prints them, and appends them to the output file when one is given.
emit() {
  printf '%s\n' "$1"
  [ -z "$GITHUB_OUTPUT_FILE" ] || printf '%s\n' "$1" >> "$GITHUB_OUTPUT_FILE"
}

resolve_one() {
  local matched count key fields out line
  local -a field
  owned_keys > /dev/null
  matched="$(jq -r --arg id "$REPOSITORY_ID" --arg ref "$REF" --arg mode "$MODE" --arg event "$EVENT" \
    "$MATCHED_KEYS" "$MAP" 2> /dev/null)" || refuse bad_map "the deployment map could not be read"
  count=0
  [ -z "$matched" ] || count="$(printf '%s\n' "$matched" | wc -l | tr -d ' ')"
  [ "$count" -gt 0 ] || refuse no_branch_match "no owned deployment admits the ref $REF in $MODE mode"
  [ "$count" -eq 1 ] || refuse ambiguous "the ref $REF matches more than one deployment: $(printf '%s\n' "$matched" | paste -sd ',' - | sed 's/,/, /g')"
  key="$matched"

  [ -d "$REPO_ROOT/infra/envs/$key/aws" ] || refuse missing_root "infra/envs/$key/aws does not exist"
  [ -d "$REPO_ROOT/infra/envs/$key/supabase" ] || refuse missing_root "infra/envs/$key/supabase does not exist"

  fields="$(jq -r --arg key "$key" --arg np "$NAME_PREFIX" "$ENTRY_FIELDS" "$MAP" 2> /dev/null)" \
    || refuse bad_map "an entry field of $key is not a single-line string"
  field=()
  while IFS= read -r line; do field+=("$line"); done <<< "$fields"
  [ "${#field[@]}" -eq 5 ] || refuse bad_map "the entry $key could not be read"

  out="key=$key
github_environment=${field[0]}
github_destroy_environment=${field[1]}
domain=${field[2]}
smoke=${field[4]}
aws_account_id=$ACCOUNT_ID
aws_region=$REGION
state_bucket=$STATE_BUCKET
aws_root=infra/envs/$key/aws
supabase_root=infra/envs/$key/supabase
state_key=pipeline/$key/aws/terraform.tfstate
supabase_state_key=hand/$key/supabase/terraform.tfstate
deploy_role_arn=arn:aws:iam::$ACCOUNT_ID:role$IAM_PATH$NAME_PREFIX-$key-deploy
plan_role_arn=arn:aws:iam::$ACCOUNT_ID:role$IAM_PATH${field[3]}-plan
topic_arn=arn:aws:sns:$REGION:$ACCOUNT_ID:$NAME_PREFIX-$key-frontend-deployments
cluster_name=$NAME_PREFIX-$key
service_name=$NAME_PREFIX-$key-frontend
destroy_branch=deploy-evidence/destroy-$key
destroy_confirm=destroy $key aws"
  emit "$out"
}

resolve_plan() {
  local keys key list
  local -a present=()
  keys="$(owned_keys)"
  while IFS= read -r key; do
    [ ! -d "$REPO_ROOT/infra/envs/$key/aws" ] || present+=("$key")
  done <<< "$keys"
  [ "${#present[@]}" -gt 0 ] || refuse no_owned_entry "no owned deployment has an AWS root under infra/envs"
  list="$(jq -c --arg np "$NAME_PREFIX" --arg account "$ACCOUNT_ID" --arg iam_path "$IAM_PATH" \
    "$PLAN_LIST" "$MAP" --args "${present[@]}" 2> /dev/null)" || refuse bad_map "an owned entry could not be read"
  emit "deployments=$list"
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
      --mode)
        require_value "$1" "$#"
        MODE="$2"
        shift 2
        ;;
      --repository-id)
        require_value "$1" "$#"
        REPOSITORY_ID="$2"
        shift 2
        ;;
      --ref)
        require_value "$1" "$#"
        REF="$2"
        REF_SET=1
        shift 2
        ;;
      --event)
        require_value "$1" "$#"
        EVENT="$2"
        shift 2
        ;;
      --github-output)
        require_value "$1" "$#"
        GITHUB_OUTPUT_FILE="$2"
        shift 2
        ;;
      *)
        usage_error "unknown argument: $1"
        ;;
    esac
  done

  case "$MODE" in
    deploy | destroy | plan) ;;
    "") usage_error "--mode is required" ;;
    *) usage_error "--mode must be deploy, destroy or plan" ;;
  esac
  [ -n "$REPOSITORY_ID" ] || usage_error "--repository-id is required"
  [[ "$REPOSITORY_ID" =~ ^[0-9]+$ ]] || usage_error "--repository-id must be digits"
  if [ "$MODE" = plan ]; then
    [ "$REF_SET" -eq 0 ] || usage_error "--ref is not taken in plan mode"
    [ -z "$EVENT" ] || usage_error "--event is not taken in plan mode"
  else
    [ -n "$REF" ] || usage_error "--ref is required in $MODE mode"
  fi
  if [ "$MODE" = destroy ]; then
    case "$EVENT" in
      push | workflow_dispatch) ;;
      "") usage_error "--event is required in destroy mode" ;;
      *) usage_error "--event must be push or workflow_dispatch" ;;
    esac
  elif [ "$MODE" = deploy ]; then
    [ -z "$EVENT" ] || usage_error "--event is not taken in deploy mode"
  fi
  command -v jq > /dev/null || usage_error "jq is not on the PATH"

  read_account
  if [ "$MODE" = plan ]; then
    resolve_plan
  else
    resolve_one
  fi
  exit 0
}

main "$@"
