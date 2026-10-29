#!/usr/bin/env bash
#
# account-inventory.sh -- Print a read-only inventory of the AWS account, or judge one rule over it.
#
# Usage (from a shell signed in to the account, with the AWS CLI on the PATH):
#   infra/scripts/account-inventory.sh                                     # the full inventory
#   infra/scripts/account-inventory.sh --assert-no-inline-user-policies    # exit 1 if any IAM user has an inline policy
#   infra/scripts/account-inventory.sh --assert-managed-only /openvaa/     # exit 1 if a role or user under the path has one
#   infra/scripts/account-inventory.sh --self-test                         # judge canned lines; needs no credentials
#
#   (no argument)                       Print, section by section: the caller as account id and role
#                                       name; whether the account belongs to an organisation; the
#                                       account summary counts; every IAM user, group and role that is
#                                       not service-linked, with its inline policy names; the OIDC
#                                       providers; the hosted zones; for four regions the SES account
#                                       state, the domain identities and a count of address identities;
#                                       the budgets; the image repositories; the bucket names.
#   --assert-no-inline-user-policies    Read every IAM user. Exit 0 when the user list was read and no
#                                       user has an inline policy, also when the account has no IAM user.
#   --assert-managed-only <path-prefix> Read every IAM user and role. Exit 0 when at least one role or
#                                       user lies under the path and none of them has an inline policy.
#                                       A user is seen under a path only when it lies under /openvaa/.
#   --self-test                         Feed canned lines to the judge and canned values to the line
#                                       formatting, and fail if a case is judged wrongly or if an address,
#                                       a session name or a person's user name reaches the output.
#   -h, --help                          Print this header and exit 0.
#
# Environment: OPENVAA_ACCOUNT_ID (default 471112560111) is the account the budgets are read for and
# that the caller is compared with; AWS_REGION (default eu-north-1) is the region of the repositories
# and the first SES region.
#
# Exit codes:
#   0:  the inventory was printed, the assertion holds, or every self-test case passed
#   1:  a call that must succeed failed (the caller, the user list or the role list), the assertion
#       does not hold, a list the assertion needs could not be read, the assertion examined nothing,
#       or a self-test case failed
#   2:  usage error
#
# Every AWS call this script makes is a read: get-, list- and describe- only. It changes nothing.
#
# It prints names and counts and no credential, and it never echoes a value it was given; `set -x`
# must not be added, because tracing would print the raw caller identity.
#
# Its output is written to be pasted into a public record. It prints no e-mail address, no session
# name and no error message of a failed call: a failed call prints the error code alone (for example
# AccessDenied), because the message names the caller's session. An IAM user is printed by name only
# when it lies under the path /openvaa/, where this project creates its own service users; any other
# user is printed as user-<n>, n being its position in the order the user list gives, because a user
# name is often a person's name or address. Run aws iam list-users --query 'Users[].UserName' on your
# own machine to see which user a line means. A tag is printed by its key alone, except InvokedBy,
# whose value is one of AWS's own words. Any field that still holds an "@" is printed as "redacted".

set -euo pipefail
set -f

export AWS_PAGER=""
export LC_ALL=C

ACCOUNT_ID="${OPENVAA_ACCOUNT_ID:-471112560111}"
REGION="${AWS_REGION:-eu-north-1}"
export AWS_REGION="$REGION"
OWN_PATH="/openvaa/"
SES_REGIONS="$REGION eu-west-1 eu-central-1 us-east-1"

SCRIPT_PATH="${BASH_SOURCE[0]}"
WORK=""
OUT=""
ERR_CODE=""
MUST_FAILED=0

usage_line() {
  echo "usage: account-inventory.sh [--assert-no-inline-user-policies | --assert-managed-only <path-prefix> | --self-test | -h | --help]" >&2
}

print_header() {
  awk 'NR == 1 { next } /^#/ { sub(/^# ?/, ""); print; next } { exit }' "$SCRIPT_PATH"
}

make_workdir() {
  WORK="$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-inventory.XXXXXX")"
  trap 'rm -rf "$WORK"' EXIT
}

# ---------------------------------------------------------------------------------------------------
# Formatting. These functions turn raw values into output lines. They are what the self-test feeds.
# ---------------------------------------------------------------------------------------------------

# A field that holds an "@" is never printed.
redact() {
  case "$1" in
    *@*) printf 'redacted' ;;
    *) printf '%s' "$1" ;;
  esac
}

# Whitespace-separated names, as the CLI's text output gives them, joined into [a,b,c].
join_list() {
  local out="" item
  for item in $1; do
    [ "$item" = "None" ] && continue
    item="$(redact "$item")"
    out="${out:+$out,}$item"
  done
  printf '[%s]' "$out"
}

# Tag lines "Key<TAB>Value" printed as [Key,InvokedBy=Value]: keys only, except InvokedBy.
fmt_tags() {
  local out="" key value item
  while IFS=$'\t' read -r key value; do
    [ -n "$key" ] || continue
    [ "$key" = "None" ] && continue
    item="$(redact "$key")"
    item="${item// /_}"
    item="${item//,/_}"
    if [ "$key" = "InvokedBy" ]; then
      case "$value" in
        "" | *[!A-Za-z0-9]*) ;;
        *) item="InvokedBy=$value" ;;
      esac
    fi
    out="${out:+$out,}$item"
  done <<< "$1"
  printf '[%s]' "$out"
}

# The caller as account id and principal kind: an assumed role by its role name with the session name
# cut off, an IAM user as the word "user". The raw ARN is never printed.
fmt_caller() {
  local account="$1" arn="$2" principal rest match
  case "$arn" in
    arn:aws*:sts::*:assumed-role/*)
      rest="${arn#*:assumed-role/}"
      principal="assumed-role/${rest%%/*}"
      ;;
    arn:aws*:iam::*:user/*) principal="user" ;;
    arn:aws*:iam::*:root) principal="root" ;;
    arn:aws*:sts::*:federated-user/*) principal="federated-user" ;;
    *) principal="other" ;;
  esac
  if [ "$account" = "$ACCOUNT_ID" ]; then match="yes"; else match="no"; fi
  printf 'caller account=%s principal=%s expected-account=%s match=%s\n' \
    "$(redact "$account")" "$(redact "$principal")" "$ACCOUNT_ID" "$match"
}

# One IAM user. Arguments: position, path, name, and the inline, attached, groups and tags fields as
# already formatted ([..] or error(<code>)).
fmt_user() {
  local position="$1" path="$2" name="$3" label shown_path
  case "$path" in
    "$OWN_PATH"*)
      label="$(redact "$name")"
      shown_path="$(redact "$path")"
      ;;
    *)
      label="user-$position"
      shown_path="other"
      ;;
  esac
  printf 'user %s path=%s inline=%s attached=%s groups=%s tags=%s\n' \
    "$label" "$shown_path" "$4" "$5" "$6" "$7"
}

fmt_role() {
  printf 'role %s path=%s inline=%s\n' "$(redact "$2")" "$(redact "$1")" "$3"
}

fmt_group() {
  printf 'group %s inline=%s\n' "$(redact "$1")" "$2"
}

# SES identity lines "Type<TAB>Name<TAB>Status": a domain by name, address identities as a count.
fmt_ses_identities() {
  local region="$1" count=0 kind name status
  while IFS=$'\t' read -r kind name status; do
    [ -n "$name" ] || continue
    case "$kind" in
      EMAIL_ADDRESS) count=$((count + 1)) ;;
      *) printf 'ses-domain %s %s status=%s\n' "$region" "$(redact "$name")" "$(redact "$status")" ;;
    esac
  done <<< "$2"
  printf 'ses-address-identities %s count=%s\n' "$region" "$count"
}

# The error code of a failed call: the word in parentheses after "An error occurred", never the
# message, which names the caller's session.
err_code_of() {
  local code
  code="$(awk 'match($0, /An error occurred \([A-Za-z][A-Za-z0-9.]*\)/) { print substr($0, RSTART + 19, RLENGTH - 20); exit }' "$1")"
  if [ -z "$code" ] && grep -q 'Unable to locate credentials' "$1"; then
    code="NoCredentials"
  fi
  printf '%s' "${code:-Unknown}"
}

# Second barrier over every printed line: a token holding an "@" becomes "redacted", and anything after
# an assumed role's name is cut off.
scrub() {
  sed -E -e 's/[^[:space:]]*@[^[:space:]]*/redacted/g' -e 's#(assumed-role/[^/[:space:]]+)/[^[:space:]]*#\1#g'
}

# ---------------------------------------------------------------------------------------------------
# Collecting. Each AWS call goes through `call`, which keeps the output in OUT and the error code in
# ERR_CODE, and drops the error message.
# ---------------------------------------------------------------------------------------------------

call() {
  local status=0
  OUT="$("$@" 2> "$WORK/stderr" < /dev/null)" || status=$?
  if [ "$status" -eq 0 ]; then
    ERR_CODE=""
  else
    ERR_CODE="$(err_code_of "$WORK/stderr")"
  fi
  : > "$WORK/stderr"
  return "$status"
}

list_or_error() {
  if call "$@"; then
    join_list "$OUT"
  else
    printf 'error(%s)' "$ERR_CODE"
  fi
}

section() {
  printf '== %s\n' "$1"
}

collect_caller() {
  local account arn
  if call aws sts get-caller-identity --query '[Account,Arn]' --output text; then
    IFS=$'\t' read -r account arn <<< "$OUT"
    fmt_caller "$account" "$arn"
  else
    echo "error caller $ERR_CODE"
    MUST_FAILED=1
  fi
}

collect_organisation() {
  if call aws organizations describe-organization --query 'Organization.Id' --output text; then
    echo "organisation member=yes"
  elif [ "$ERR_CODE" = "AWSOrganizationsNotInUseException" ]; then
    echo "organisation member=no"
  else
    echo "error organisation $ERR_CODE"
  fi
}

collect_summary() {
  local users groups roles policies providers
  if call aws iam get-account-summary --query 'SummaryMap.[Users,Groups,Roles,Policies,Providers]' --output text; then
    IFS=$'\t' read -r users groups roles policies providers <<< "$OUT"
    echo "summary users=$users groups=$groups roles=$roles policies=$policies providers=$providers"
  else
    echo "error account-summary $ERR_CODE"
  fi
}

collect_users() {
  local list position=0 path name inline attached groups tags
  if ! call aws iam list-users --query 'Users[].[Path,UserName]' --output text; then
    echo "error users $ERR_CODE"
    MUST_FAILED=1
    return 0
  fi
  list="$OUT"
  while IFS=$'\t' read -r path name; do
    [ -n "$name" ] || continue
    position=$((position + 1))
    inline="$(list_or_error aws iam list-user-policies --user-name "$name" --query 'PolicyNames' --output text)"
    attached="$(list_or_error aws iam list-attached-user-policies --user-name "$name" --query 'AttachedPolicies[].PolicyName' --output text)"
    groups="$(list_or_error aws iam list-groups-for-user --user-name "$name" --query 'Groups[].GroupName' --output text)"
    if call aws iam list-user-tags --user-name "$name" --query 'Tags[].[Key,Value]' --output text; then
      tags="$(fmt_tags "$OUT")"
    else
      tags="error($ERR_CODE)"
    fi
    fmt_user "$position" "$path" "$name" "$inline" "$attached" "$groups" "$tags"
  done <<< "$list"
  echo "users examined=$position"
}

collect_groups() {
  local list count=0 group inline
  if ! call aws iam list-groups --query 'Groups[].GroupName' --output text; then
    echo "error groups $ERR_CODE"
    return 0
  fi
  list="$OUT"
  for group in $list; do
    [ "$group" = "None" ] && continue
    count=$((count + 1))
    inline="$(list_or_error aws iam list-group-policies --group-name "$group" --query 'PolicyNames' --output text)"
    fmt_group "$group" "$inline"
  done
  echo "groups examined=$count"
}

collect_roles() {
  local list count=0 path name inline
  if ! call aws iam list-roles --query 'Roles[?!starts_with(Path, `/aws-service-role/`)].[Path,RoleName]' --output text; then
    echo "error roles $ERR_CODE"
    MUST_FAILED=1
    return 0
  fi
  list="$OUT"
  while IFS=$'\t' read -r path name; do
    [ -n "$name" ] || continue
    count=$((count + 1))
    inline="$(list_or_error aws iam list-role-policies --role-name "$name" --query 'PolicyNames' --output text)"
    fmt_role "$path" "$name" "$inline"
  done <<< "$list"
  echo "roles examined=$count"
}

collect_oidc() {
  local arn count=0
  if ! call aws iam list-open-id-connect-providers --query 'OpenIDConnectProviderList[].Arn' --output text; then
    echo "error oidc-providers $ERR_CODE"
    return 0
  fi
  for arn in $OUT; do
    [ "$arn" = "None" ] && continue
    count=$((count + 1))
    echo "oidc-provider $(redact "$arn")"
  done
  echo "oidc-providers count=$count"
}

collect_zones() {
  local list count=0 name id private records
  if ! call aws route53 list-hosted-zones --query 'HostedZones[].[Name,Id,Config.PrivateZone,ResourceRecordSetCount]' --output text; then
    echo "error hosted-zones $ERR_CODE"
    return 0
  fi
  list="$OUT"
  while IFS=$'\t' read -r name id private records; do
    [ -n "$name" ] || continue
    [ "$name" = "None" ] && continue
    count=$((count + 1))
    echo "zone $(redact "$name") id=$(redact "$id") private=$private records=$records"
  done <<< "$list"
  echo "hosted-zones count=$count"
}

collect_ses() {
  local region="$1" production sending max24h suppression
  if call aws sesv2 get-account --region "$region" --query '[ProductionAccessEnabled,SendingEnabled,SendQuota.Max24HourSend]' --output text; then
    IFS=$'\t' read -r production sending max24h <<< "$OUT"
    suppression="$(list_or_error aws sesv2 get-account --region "$region" --query 'SuppressionAttributes.SuppressedReasons' --output text)"
    echo "ses $region production=$production sending=$sending max24h=$max24h suppression=$suppression"
  else
    echo "error ses-$region $ERR_CODE"
  fi
  if call aws sesv2 list-email-identities --region "$region" --query 'EmailIdentities[].[IdentityType,IdentityName,VerificationStatus]' --output text; then
    fmt_ses_identities "$region" "$OUT"
  else
    echo "error ses-identities-$region $ERR_CODE"
  fi
}

collect_budgets() {
  local list count=0 name limit actual
  if ! call aws budgets describe-budgets --account-id "$ACCOUNT_ID" --query 'Budgets[].[BudgetName,BudgetLimit.Amount,CalculatedSpend.ActualSpend.Amount]' --output text; then
    echo "error budgets $ERR_CODE"
    return 0
  fi
  list="$OUT"
  while IFS=$'\t' read -r name limit actual; do
    [ -n "$name" ] || continue
    [ "$name" = "None" ] && continue
    count=$((count + 1))
    name="$(redact "$name")"
    echo "budget ${name// /_} limit=$limit actual=$actual"
  done <<< "$list"
  echo "budgets count=$count"
}

collect_repositories() {
  local list count=0 name mutability
  if ! call aws ecr describe-repositories --region "$REGION" --query 'repositories[].[repositoryName,imageTagMutability]' --output text; then
    echo "error repositories $ERR_CODE"
    return 0
  fi
  list="$OUT"
  while IFS=$'\t' read -r name mutability; do
    [ -n "$name" ] || continue
    [ "$name" = "None" ] && continue
    count=$((count + 1))
    echo "repository $(redact "$name") tags=$mutability"
  done <<< "$list"
  echo "repositories $REGION count=$count"
}

collect_buckets() {
  local bucket count=0
  if ! call aws s3api list-buckets --query 'Buckets[].Name' --output text; then
    echo "error buckets $ERR_CODE"
    return 0
  fi
  for bucket in $OUT; do
    [ "$bucket" = "None" ] && continue
    count=$((count + 1))
    echo "bucket $(redact "$bucket")"
  done
  echo "buckets count=$count"
}

collect_all() {
  local region seen=" "
  section caller
  collect_caller
  section organisation
  collect_organisation
  section account-summary
  collect_summary
  section iam-users
  collect_users
  section iam-groups
  collect_groups
  section iam-roles
  collect_roles
  section oidc-providers
  collect_oidc
  section hosted-zones
  collect_zones
  for region in $SES_REGIONS; do
    case "$seen" in *" $region "*) continue ;; esac
    seen="$seen$region "
    section "ses $region"
    collect_ses "$region"
  done
  section budgets
  collect_budgets
  section "repositories $REGION"
  collect_repositories
  section buckets
  collect_buckets
}

# ---------------------------------------------------------------------------------------------------
# Judging. Reads inventory lines on standard input. Offending lines go to standard output and the
# one-line verdict to standard error.
#   evaluate users            no IAM user has an inline policy, and the user list was read
#   evaluate managed <prefix> no role or user under the prefix has one, and at least one exists
# An inline list that could not be read counts as offending: a check that examined nothing does not
# report success.
# ---------------------------------------------------------------------------------------------------

evaluate() {
  local mode="$1" prefix="${2:-}"
  awk -v mode="$mode" -v prefix="$prefix" '
    function field(name,   i) {
      for (i = 3; i <= NF; i++) if (index($i, name "=") == 1) return substr($i, length(name) + 2)
      return "\001missing"
    }
    $1 == "error" && $2 == "users" { unread = unread " user" }
    $1 == "error" && $2 == "roles" && mode == "managed" { unread = unread " role" }
    $1 == "users" && $2 ~ /^examined=/ { users_read = 1 }
    $1 == "roles" && $2 ~ /^examined=/ { roles_read = 1 }
    $1 == "user" || ($1 == "role" && mode == "managed") {
      if (mode == "managed" && index(field("path"), prefix) != 1) next
      examined++
      if (field("inline") != "[]") { print; offending++ }
    }
    END {
      if (unread != "") {
        printf "assert: FAIL: the%s list could not be read, so nothing was judged\n", unread > "/dev/stderr"
        exit 1
      }
      if (!users_read || (mode == "managed" && !roles_read)) {
        print "assert: FAIL: nothing examined: the input holds no complete user or role list" > "/dev/stderr"
        exit 1
      }
      if (mode == "managed" && examined == 0) {
        printf "assert: FAIL: nothing examined: no role or user lies under %s\n", prefix > "/dev/stderr"
        exit 1
      }
      if (offending > 0) {
        if (mode == "managed") printf "assert: FAIL: %d of %d roles and users under %s carry an inline policy or could not be read\n", offending, examined, prefix > "/dev/stderr"
        else printf "assert: FAIL: %d of %d IAM users carry an inline policy or could not be read\n", offending, examined > "/dev/stderr"
        exit 1
      }
      if (mode == "managed") printf "assert: PASS: %d roles and users under %s, none with an inline policy\n", examined, prefix > "/dev/stderr"
      else printf "assert: PASS: %d IAM users, none with an inline policy\n", examined > "/dev/stderr"
      exit 0
    }'
}

# ---------------------------------------------------------------------------------------------------
# Self-test. No credentials, no AWS call.
# ---------------------------------------------------------------------------------------------------

ST_CASES=0
ST_FAILED=0

st_result() {
  ST_CASES=$((ST_CASES + 1))
  if [ "$2" = "pass" ]; then
    echo "self-test: PASS $1"
  else
    echo "self-test: FAIL $1"
    ST_FAILED=$((ST_FAILED + 1))
  fi
}

# st_judge <case> <expected status> <mode> <prefix> <input lines>
st_judge() {
  local got=0
  printf '%s\n' "$5" | evaluate "$3" "$4" > /dev/null 2>&1 || got=$?
  if [ "$got" -eq "$2" ]; then st_result "$1" pass; else st_result "$1 (status $got, expected $2)" fail; fi
}

# st_absent <case> <haystack> <needle>
st_absent() {
  case "$2" in
    *"$3"*) st_result "$1" fail ;;
    *) st_result "$1" pass ;;
  esac
}

# st_present <case> <haystack> <needle>
st_present() {
  case "$2" in
    *"$3"*) st_result "$1" pass ;;
    *) st_result "$1" fail ;;
  esac
}

self_test() {
  local clean inline_user formatted errfile scrubbed tab
  tab="$(printf '\t')"

  clean="users examined=2
user user-1 path=other inline=[] attached=[AdministratorAccess] groups=[] tags=[]
user openvaa-staging-smtp path=/openvaa/ inline=[] attached=[openvaa-ses-send] groups=[] tags=[Project]"
  inline_user="users examined=2
user user-1 path=other inline=[] attached=[] groups=[] tags=[]
user user-2 path=other inline=[AmazonSesSendingAccess] attached=[] groups=[] tags=[InvokedBy=SESConsole]"

  st_judge "users: a clean set passes" 0 users "" "$clean"
  st_judge "users: a user with an inline policy fails" 1 users "" "$inline_user"
  st_judge "users: an account with no IAM user passes once the list was read" 0 users "" "users examined=0"
  st_judge "users: empty input is nothing examined and fails" 1 users "" ""
  st_judge "users: an unreadable user list fails" 1 users "" "error users AccessDenied"
  st_judge "users: an unreadable inline list fails" 1 users "" "users examined=1
user user-1 path=other inline=error(AccessDenied) attached=[] groups=[] tags=[]"

  st_judge "managed: clean roles under the path pass" 0 managed /openvaa/ "users examined=0
role openvaa-plan path=/openvaa/ inline=[]
role openvaa-staging-deploy path=/openvaa/ inline=[]
role AWSReservedSSO_AdministratorAccess_0a1b path=/aws-reserved/sso.amazonaws.com/ inline=[Legacy]
roles examined=3"
  st_judge "managed: a role under the path with an inline policy fails" 1 managed /openvaa/ "users examined=0
role openvaa-plan path=/openvaa/ inline=[Leftover]
roles examined=1"
  st_judge "managed: a user under the path with an inline policy fails" 1 managed /openvaa/ "users examined=1
user openvaa-staging-smtp path=/openvaa/ inline=[ses] attached=[] groups=[] tags=[]
role openvaa-plan path=/openvaa/ inline=[]
roles examined=1"
  st_judge "managed: nothing under the path is nothing examined and fails" 1 managed /openvaa/ "users examined=1
user user-1 path=other inline=[] attached=[] groups=[] tags=[]
role SomeRole path=/ inline=[]
roles examined=1"
  st_judge "managed: empty input is nothing examined and fails" 1 managed /openvaa/ ""
  st_judge "managed: an unreadable role list fails" 1 managed /openvaa/ "users examined=0
error roles AccessDenied"

  formatted="$(
    fmt_caller 471112560111 "arn:aws:sts::471112560111:assumed-role/AWSReservedSSO_AdministratorAccess_0a1b/matti.meikalainen@example.org"
    fmt_caller 471112560111 "arn:aws:sts::471112560111:assumed-role/openvaa-admin/botocore-session-1712345678"
    fmt_caller 471112560111 "arn:aws:iam::471112560111:user/maija.virtanen@example.org"
    fmt_user 1 / "pekka.example@example.org" "[]" "[AdministratorAccess]" "[admins]" "$(fmt_tags "Owner${tab}someone@example.org")"
    fmt_user 2 / "Teppo.Testaaja" "[AmazonSesSendingAccess]" "[]" "[]" "$(fmt_tags "InvokedBy${tab}SESConsole
Contact${tab}teppo@example.org
cost center${tab}42")"
    fmt_user 3 /openvaa/ "openvaa-staging-smtp" "[]" "[openvaa-ses-send]" "[]" "$(fmt_tags "Project${tab}openvaa")"
    fmt_user 4 /openvaa/ "svc@example.org" "$(join_list "Inline@example.org")" "[]" "[]" "[]"
    fmt_role /openvaa/ "openvaa-plan" "[]"
    fmt_group "admins" "[]"
    fmt_ses_identities eu-north-1 "DOMAIN${tab}staging.openvaa.org${tab}SUCCESS
EMAIL_ADDRESS${tab}someone.else@example.org${tab}SUCCESS
EMAIL_ADDRESS${tab}third@example.org${tab}PENDING"
  )"

  st_absent "format: no @ reaches the output" "$formatted" "@"
  st_absent "format: no address session name reaches the output" "$formatted" "matti"
  st_absent "format: no plain session name reaches the output" "$formatted" "botocore-session"
  st_absent "format: an IAM user's own name is not printed for the caller" "$formatted" "maija"
  st_absent "format: a user outside /openvaa/ named by address is not printed" "$formatted" "pekka"
  st_absent "format: a user outside /openvaa/ named like a person is not printed" "$formatted" "Teppo"
  st_absent "format: a tag value other than InvokedBy is not printed" "$formatted" "someone"
  st_absent "format: an address identity is not printed" "$formatted" "someone.else"
  st_present "format: an assumed role prints its role name" "$formatted" "principal=assumed-role/AWSReservedSSO_AdministratorAccess_0a1b "
  st_present "format: an IAM user caller prints the word user" "$formatted" "principal=user "
  st_present "format: a user outside /openvaa/ prints as user-<n>" "$formatted" "user user-2 path=other inline=[AmazonSesSendingAccess]"
  st_present "format: InvokedBy keeps its value, other tags their key" "$formatted" "tags=[InvokedBy=SESConsole,Contact,cost_center]"
  st_present "format: a user under /openvaa/ prints by name" "$formatted" "user openvaa-staging-smtp path=/openvaa/"
  st_present "format: a name with an @ under /openvaa/ is redacted" "$formatted" "user redacted path=/openvaa/ inline=[redacted]"
  st_present "format: a domain identity prints by name" "$formatted" "ses-domain eu-north-1 staging.openvaa.org status=SUCCESS"
  st_present "format: address identities print as a count" "$formatted" "ses-address-identities eu-north-1 count=2"

  st_judge "format: the formatted lines, users with an inline policy among them, fail the judge" 1 users "" "$formatted
users examined=4"

  errfile="${TMPDIR:-/tmp}/openvaa-inventory-selftest.$$"
  printf '%s\n' "An error occurred (AccessDenied) when calling the ListUsers operation: User: arn:aws:sts::471112560111:assumed-role/Admin/matti@example.org is not authorized" > "$errfile"
  st_present "error: the code is taken from the parentheses" "$(err_code_of "$errfile")" "AccessDenied"
  st_absent "error: the message is not passed on" "$(err_code_of "$errfile")" "matti"
  printf '%s\n' "Unable to locate credentials. You can configure credentials elsewhere." > "$errfile"
  st_present "error: missing credentials have a code of their own" "$(err_code_of "$errfile")" "NoCredentials"
  printf '%s\n' "something else went wrong for matti@example.org" > "$errfile"
  st_present "error: an unknown failure prints Unknown" "$(err_code_of "$errfile")" "Unknown"
  rm -f "$errfile"

  scrubbed="$(printf '%s\n' "caller principal=assumed-role/Admin/matti@example.org owner=a@b.example" | scrub)"
  st_absent "scrub: no @ survives the second barrier" "$scrubbed" "@"
  st_absent "scrub: no session name survives the second barrier" "$scrubbed" "matti"

  echo "self-test: $ST_CASES cases, $ST_FAILED failed"
  [ "$ST_FAILED" -eq 0 ]
}

# ---------------------------------------------------------------------------------------------------

main() {
  local status=0
  case "${1:-}" in
    "")
      [ "$#" -eq 0 ] || { usage_line; exit 2; }
      make_workdir
      collect_all > "$WORK/inventory.txt"
      scrub < "$WORK/inventory.txt"
      [ "$MUST_FAILED" -eq 0 ] || exit 1
      exit 0
      ;;
    --assert-no-inline-user-policies)
      [ "$#" -eq 1 ] || { usage_line; exit 2; }
      make_workdir
      collect_users > "$WORK/inventory.txt"
      scrub < "$WORK/inventory.txt" > "$WORK/scrubbed.txt"
      evaluate users < "$WORK/scrubbed.txt" || status=$?
      exit "$status"
      ;;
    --assert-managed-only)
      [ "$#" -eq 2 ] || { usage_line; exit 2; }
      case "$2" in
        /*/ | /) ;;
        *) echo "account-inventory.sh: the path prefix must begin and end with /" >&2; exit 2 ;;
      esac
      make_workdir
      { collect_users; collect_roles; } > "$WORK/inventory.txt"
      scrub < "$WORK/inventory.txt" > "$WORK/scrubbed.txt"
      evaluate managed "$2" < "$WORK/scrubbed.txt" || status=$?
      exit "$status"
      ;;
    --self-test)
      [ "$#" -eq 1 ] || { usage_line; exit 2; }
      self_test || exit 1
      exit 0
      ;;
    -h | --help)
      print_header
      exit 0
      ;;
    *)
      usage_line
      exit 2
      ;;
  esac
}

main "$@"
