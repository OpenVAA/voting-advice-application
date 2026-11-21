#!/usr/bin/env bash
#
# check-settings-types.sh -- Prove that the Supabase module encodes the hosted settings with their
#                            types intact, and that what it encodes is hosted-settings.json.
#
# Usage:
#   infra/scripts/check-settings-types.sh [DIR]
#
# DIR, if given, is a directory holding settings.tf, variables.tf and hosted-settings.json to check
# instead of infra/modules/supabase. Any other argument, or more than one, is a usage error.
#
# The script copies the three files into a fresh temporary directory, removed on exit, and evaluates
# the module's `local.auth` and `local.api` there with `terraform console`. It needs no credentials,
# no provider, no state and no network: the copied files hold only variables and locals. It runs
# four cases:
#
#   defaults      the keys of both hooks are present and each hook's enabled key is a bare true; the
#                 numbers are bare; the mail rate limit and every SMTP key are absent; every key of the
#                 JSON's api, auth and two hook groups is encoded with the JSON's value; the redirect
#                 allow list is the origin joined with each redirect path of the JSON
#   hook off      the two access-token hook keys are absent and the send-email hook keys are present
#   send-email hook off
#                 the two send-email hook keys are absent and the access-token hook keys are present
#   smtp given    the mail rate limit is the bare number 100, the SMTP keys are present, and the SMTP
#                 port is a string
#
# In every case a value that is a quoted true, false or digit string (other than the SMTP port), or
# an output that holds `tomap(`, is a finding. Both are the signature of a conditional whose other
# branch is an empty object: Terraform unifies the branches into a map of strings, `validate` still
# passes, and the hosted API would refuse or misread the value.
#
# Exit codes:
#   0  every case holds
#   1  a finding; each one is printed with the key it concerns
#   2  usage error, a missing tool (terraform, jq), a missing input file, or an expression that
#      could not be evaluated

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SRC_DIR="$REPO_ROOT/infra/modules/supabase"

usage() {
  echo "usage: infra/scripts/check-settings-types.sh [DIR]" >&2
  echo "  DIR: a directory holding settings.tf, variables.tf and hosted-settings.json" >&2
}

if [ "$#" -gt 1 ]; then
  usage
  exit 2
fi
if [ "$#" -eq 1 ]; then
  case "$1" in
    -*)
      usage
      exit 2
      ;;
  esac
  if [ ! -d "$1" ]; then
    echo "check-settings-types: not a directory: $1" >&2
    usage
    exit 2
  fi
  SRC_DIR="$(cd "$1" && pwd)"
fi

for tool in terraform jq; do
  if ! command -v "$tool" > /dev/null 2>&1; then
    echo "check-settings-types: $tool is required and was not found; nothing was checked" >&2
    exit 2
  fi
done

for f in settings.tf variables.tf hosted-settings.json; do
  if [ ! -f "$SRC_DIR/$f" ]; then
    echo "check-settings-types: missing input file $SRC_DIR/$f; nothing was checked" >&2
    exit 2
  fi
done

if ! HOSTED="$(jq -c . "$SRC_DIR/hosted-settings.json")"; then
  echo "check-settings-types: $SRC_DIR/hosted-settings.json is not valid JSON" >&2
  exit 2
fi

WORK="$(mktemp -d "${TMPDIR:-/tmp}/check-settings-types.XXXXXX")"
trap 'rm -rf "$WORK"' EXIT
cp "$SRC_DIR/settings.tf" "$SRC_DIR/variables.tf" "$SRC_DIR/hosted-settings.json" "$WORK/"

ORIGIN="https://staging.example.org"
BASE_VARS=(
  -var "organization_id=example-org"
  -var "project_name=example-project"
  -var "region=eu-north-1"
  -var "database_password=unused-placeholder"
  -var "public_origin=$ORIGIN"
)
SMTP_VALUE='{host="smtp.example.org",port="587",user="example-user",admin_email="noreply@example.org",sender_name="Example"}'
HOOK_KEYS=(hook_custom_access_token_enabled hook_custom_access_token_uri)
SEND_EMAIL_HOOK_KEYS=(hook_send_email_enabled hook_send_email_uri)
RATE_KEYS=(rate_limit_otp rate_limit_verify rate_limit_token_refresh rate_limit_anonymous_users rate_limit_sms_sent rate_limit_web3)
MAIL_RATE_KEY=rate_limit_email_sent
SMTP_KEYS=(smtp_host smtp_port smtp_user smtp_admin_email smtp_sender_name smtp_pass)

FINDINGS=0
finding() {
  echo "FINDING [$CASE] $*"
  FINDINGS=$((FINDINGS + 1))
}

# Evaluate one expression with `terraform console`; the expression arrives on standard input.
tf_eval() {
  local expr="$1"
  shift
  printf '%s\n' "$expr" | TF_IN_AUTOMATION=1 terraform -chdir="$WORK" console "$@"
}

# Evaluate local.<name> raw (for the `tomap(` check) and as JSON; leave the JSON object in ENC.
# Called directly, not in a command substitution, so that its findings are counted.
ENC=""
encode_local() {
  local name="$1"
  shift
  local raw json
  if ! raw="$(tf_eval "local.$name" "$@")"; then
    echo "check-settings-types: [$CASE] could not evaluate local.$name" >&2
    exit 2
  fi
  if grep -qF 'tomap(' <<< "$raw"; then
    finding "local.$name is a map of one element type (tomap), not an object: types were unified"
  fi
  if ! json="$(tf_eval "jsonencode(local.$name)" "$@")"; then
    echo "check-settings-types: [$CASE] could not evaluate jsonencode(local.$name)" >&2
    exit 2
  fi
  # The console prints a quoted string; decode it once to get the JSON object.
  if ! json="$(jq -r . <<< "$json")" || ! ENC="$(jq -c . <<< "$json")"; then
    echo "check-settings-types: [$CASE] the encoded local.$name is not JSON" >&2
    exit 2
  fi
}

# A quoted true, false or digit string, except the SMTP port, is a finding.
check_types() {
  local json="$1" key
  while IFS= read -r key; do
    if [ -n "$key" ]; then finding "$key holds a quoted boolean or number"; fi
  done < <(jq -r 'to_entries[] | select(.key != "smtp_port") | select((.value | type) == "string")
    | select(.value | test("^(true|false|-?[0-9]+(\\.[0-9]+)?)$")) | .key' <<< "$json")
}

expect_present() {
  local json="$1" key
  shift
  for key in "$@"; do
    jq -e --arg k "$key" 'has($k)' <<< "$json" > /dev/null || finding "$key is missing"
  done
}

expect_absent() {
  local json="$1" key
  shift
  for key in "$@"; do
    if jq -e --arg k "$key" 'has($k)' <<< "$json" > /dev/null; then
      finding "$key is present"
    fi
  done
}

expect_type() {
  local json="$1" key="$2" type="$3"
  jq -e --arg k "$key" --arg t "$type" 'has($k) and ((.[$k] | type) == $t)' <<< "$json" > /dev/null ||
    finding "$key is not a bare $type"
}

# Every key of a group of the JSON is encoded with the JSON's value.
expect_group() {
  local json="$1" group="$2" key
  while IFS= read -r key; do
    if [ -z "$key" ]; then continue; fi
    if ! jq -e --arg k "$key" 'has($k)' <<< "$json" > /dev/null; then
      finding "$key of the JSON's $group group is missing from the encoded settings"
    elif ! jq -e --arg k "$key" --arg g "$group" --argjson h "$HOSTED" '.[$k] == $h[$g][$k]' <<< "$json" > /dev/null; then
      finding "$key of the JSON's $group group is encoded with another value"
    fi
  done < <(jq -r --arg g "$group" '.[$g] | keys[]' <<< "$HOSTED")
}

# --- defaults ---------------------------------------------------------------------------------
CASE=defaults
encode_local auth "${BASE_VARS[@]}"
AUTH="$ENC"
encode_local api "${BASE_VARS[@]}"
API="$ENC"
check_types "$AUTH"
check_types "$API"
expect_type "$AUTH" hook_custom_access_token_enabled boolean
expect_type "$AUTH" hook_send_email_enabled boolean
expect_type "$AUTH" jwt_exp number
for key in "${RATE_KEYS[@]}"; do expect_type "$AUTH" "$key" number; done
expect_absent "$AUTH" "$MAIL_RATE_KEY" "${SMTP_KEYS[@]}"
expect_group "$API" api
expect_group "$AUTH" auth
expect_group "$AUTH" auth_hook
expect_group "$AUTH" auth_send_email_hook
jq -e --arg o "$ORIGIN" '.site_url == $o' <<< "$AUTH" > /dev/null || finding "site_url is not the origin"
WANT_ALLOW="$(jq -r --arg o "$ORIGIN" '[.redirect_callback_paths[] | $o + .] | join(",")' <<< "$HOSTED")"
jq -e --arg w "$WANT_ALLOW" '.uri_allow_list == $w' <<< "$AUTH" > /dev/null ||
  finding "uri_allow_list is not the origin joined with each redirect path of the JSON"
if [ -z "$WANT_ALLOW" ]; then finding "the JSON holds no redirect path"; fi

# --- hook switched off ------------------------------------------------------------------------
CASE=hook-off
encode_local auth "${BASE_VARS[@]}" -var "enable_access_token_hook=false"
AUTH="$ENC"
check_types "$AUTH"
expect_absent "$AUTH" "${HOOK_KEYS[@]}"
expect_present "$AUTH" "${SEND_EMAIL_HOOK_KEYS[@]}"

# --- send-email hook switched off -------------------------------------------------------------
CASE=send-email-hook-off
encode_local auth "${BASE_VARS[@]}" -var "enable_send_email_hook=false"
AUTH="$ENC"
check_types "$AUTH"
expect_absent "$AUTH" "${SEND_EMAIL_HOOK_KEYS[@]}"
expect_present "$AUTH" "${HOOK_KEYS[@]}"

# --- smtp given -------------------------------------------------------------------------------
CASE=smtp
encode_local auth "${BASE_VARS[@]}" -var "smtp=$SMTP_VALUE"
AUTH="$ENC"
check_types "$AUTH"
jq -e --arg k "$MAIL_RATE_KEY" '.[$k] == 100' <<< "$AUTH" > /dev/null || finding "$MAIL_RATE_KEY is not the bare number 100"
expect_type "$AUTH" "$MAIL_RATE_KEY" number
expect_present "$AUTH" smtp_host smtp_port smtp_user smtp_admin_email smtp_sender_name
expect_type "$AUTH" smtp_port string
expect_absent "$AUTH" smtp_pass

if [ "$FINDINGS" -gt 0 ]; then
  echo "check-settings-types: $FINDINGS finding(s) in $SRC_DIR" >&2
  exit 1
fi
echo "check-settings-types: four cases hold in $SRC_DIR (types kept, JSON groups encoded)" >&2
