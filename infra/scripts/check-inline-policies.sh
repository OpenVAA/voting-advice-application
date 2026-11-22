#!/usr/bin/env bash
#
# check-inline-policies.sh -- Judge, over the AWS account, the rule that no IAM identity carries an inline policy.
#
# Usage, from a shell signed in to the account with the AWS CLI on the PATH:
#
# ```sh
# infra/scripts/check-inline-policies.sh --assert-no-inline-user-policies    # exit 1 if any IAM user has an inline policy
# infra/scripts/check-inline-policies.sh --assert-no-inline-under /openvaa/  # exit 1 if a role or user under the path has one
# infra/scripts/check-inline-policies.sh --self-test                         # judge canned lines; needs no credentials
# ```
#
# - `--assert-no-inline-user-policies`: read every IAM user. Exit 0 when the user list was read and no user has an inline policy, also when the account has no IAM user.
# - `--assert-no-inline-under <path-prefix>`: read every IAM user and role. Exit 0 when at least one role or user lies under the path and none of them has an inline policy. A user is seen under a path only when it lies under /openvaa/. Attached policies are not judged: a role under the path with an AWS-managed policy attached, such as ReadOnlyAccess, passes.
# - `--self-test`: feed canned lines to the judge and canned values to the line formatting, and fail if a case is judged wrongly or if an address, a session name or a person's user name reaches the output.
# - `-h`, `--help`: print this header and exit 0.
#
# Each assert mode reads the caller first. It exits 1 without reading any list when the caller cannot be read or is not in OPENVAA_ACCOUNT_ID, so a PASS always describes that account.
#
# Environment: OPENVAA_ACCOUNT_ID (default 471112560111) is the account the caller is compared with.
#
# Exit codes:
#
# - 0: the assertion holds, or every self-test case passed.
# - 1: the caller cannot be read or is not in OPENVAA_ACCOUNT_ID, the assertion does not hold, a list the assertion needs could not be read, the assertion examined nothing, or a self-test case failed.
# - 2: usage error.
#
# Every AWS call this script makes is a read: get- and list- only. It changes nothing.
#
# It prints names and no credential, and it never echoes a value it was given; `set -x` must not be added, because tracing would print the raw caller identity and user names.
#
# The lines it prints are written to be pasted into a public record: the caller line, every user or role that carries an inline policy or whose inline policies could not be read, then a one-line verdict on standard error. It prints no e-mail address, no session name and no error message of a failed call: a failed call prints the error code alone (for example AccessDenied), because the message names the caller's session. An IAM user is printed by name only when it lies under the path /openvaa/, where this project creates its own service users; any other user is printed as user-<n>, n being its position in the order the user list gives, because a user name is often a person's name or address. Run aws iam list-users --query 'Users[].UserName' on your own machine to see which user a line means. A tag is printed by its key alone, except InvokedBy, whose value is one of AWS's own words, and except a key in the shape of an access key id, which the console sets as the key of an access key's description tag: it is printed as access-key-description. Any field that still holds an "@" is printed as "redacted", and any access key id that still reaches a line is printed as "redacted-key-id".

set -euo pipefail
set -f

export AWS_PAGER=""
export LC_ALL=C

ACCOUNT_ID="${OPENVAA_ACCOUNT_ID:-471112560111}"
OWN_PATH="/openvaa/"

SCRIPT_PATH="${BASH_SOURCE[0]}"
WORK=""
OUT=""
ERR_CODE=""
CALLER_FAILED=0
ST_CASES=0
ST_FAILED=0

main() {
  local status=0
  case "${1:-}" in
    --assert-no-inline-user-policies)
      [ "$#" -eq 1 ] || { usage_line; exit 2; }
      make_workdir
      collect_in_account collect_users > "$WORK/collected.txt"
      scrub < "$WORK/collected.txt" > "$WORK/scrubbed.txt"
      evaluate users < "$WORK/scrubbed.txt" || status=$?
      exit "$status"
      ;;
    --assert-no-inline-under)
      [ "$#" -eq 2 ] || { usage_line; exit 2; }
      case "$2" in
        /*/ | /) ;;
        *) echo "check-inline-policies.sh: the path prefix must begin and end with /" >&2; exit 2 ;;
      esac
      make_workdir
      collect_in_account collect_users_and_roles > "$WORK/collected.txt"
      scrub < "$WORK/collected.txt" > "$WORK/scrubbed.txt"
      evaluate under "$2" < "$WORK/scrubbed.txt" || status=$?
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

usage_line() {
  echo "usage: check-inline-policies.sh [--assert-no-inline-user-policies | --assert-no-inline-under <path-prefix> | --self-test | -h | --help]" >&2
}

make_workdir() {
  WORK="$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-inline-policies.XXXXXX")"
  trap 'rm -rf "$WORK"' EXIT
}

# ---------------------------------------------------------------------------------------------------
# Collecting. Each AWS call goes through `call`, which keeps the output in OUT and the error code in ERR_CODE, and drops the error message.
# ---------------------------------------------------------------------------------------------------

# The caller line, then the given collector only when the caller is in ACCOUNT_ID, so no list of another account is read.
collect_in_account() {
  collect_caller
  [ "$CALLER_FAILED" -eq 0 ] || return 0
  "$@"
}

# Sets CALLER_FAILED when the caller cannot be read or is not in ACCOUNT_ID.
collect_caller() {
  local account arn
  if call aws sts get-caller-identity --query '[Account,Arn]' --output text; then
    IFS=$'\t' read -r account arn <<< "$OUT"
    fmt_caller "$account" "$arn"
    [ "$account" = "$ACCOUNT_ID" ] || CALLER_FAILED=1
  else
    echo "error caller $ERR_CODE"
    CALLER_FAILED=1
  fi
}

collect_users() {
  local list position=0 path name inline attached groups tags
  if ! call aws iam list-users --query 'Users[].[Path,UserName]' --output text; then
    echo "error users $ERR_CODE"
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

collect_users_and_roles() {
  collect_users
  collect_roles
}

collect_roles() {
  local list count=0 path name inline
  if ! call aws iam list-roles --query 'Roles[?!starts_with(Path, `/aws-service-role/`)].[Path,RoleName]' --output text; then
    echo "error roles $ERR_CODE"
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

# The error code of a failed call: the word in parentheses after "An error occurred", never the message, which names the caller's session.
err_code_of() {
  local code
  code="$(awk 'match($0, /An error occurred \([A-Za-z][A-Za-z0-9.]*\)/) { print substr($0, RSTART + 19, RLENGTH - 20); exit }' "$1")"
  if [ -z "$code" ] && grep -q 'Unable to locate credentials' "$1"; then
    code="NoCredentials"
  fi
  printf '%s' "${code:-Unknown}"
}

# ---------------------------------------------------------------------------------------------------
# Formatting. These functions turn raw values into output lines. They are what the self-test feeds.
# ---------------------------------------------------------------------------------------------------

# The caller as account id and principal kind: an assumed role by its role name with the session name cut off, an IAM user as the word "user". The raw ARN is never printed.
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

# Tag lines "Key<TAB>Value" printed as [Key,InvokedBy=Value]: keys only, except InvokedBy. A key that is an access key id is printed as access-key-description.
fmt_tags() {
  local out="" key value item
  while IFS=$'\t' read -r key value; do
    [ -n "$key" ] || continue
    [ "$key" = "None" ] && continue
    item="$(redact "$key")"
    item="${item// /_}"
    item="${item//,/_}"
    if is_access_key_id "$key"; then
      item="access-key-description"
    fi
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

# True when the argument is an access key id: AKIA (long-lived) or ASIA (temporary) and 16 more.
is_access_key_id() {
  [[ "$1" =~ ^(AKIA|ASIA)[A-Z0-9]{16}$ ]]
}

# One IAM user. Arguments: position, path, name, and the inline, attached, groups and tags fields as already formatted ([..] or error(<code>)).
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

# A field that holds an "@" is never printed.
redact() {
  case "$1" in
    *@*) printf 'redacted' ;;
    *) printf '%s' "$1" ;;
  esac
}

# Second barrier over every printed line: a token holding an "@" becomes "redacted", an access key id becomes "redacted-key-id", and anything after an assumed role's name is cut off.
scrub() {
  sed -E -e 's/[^[:space:]]*@[^[:space:]]*/redacted/g' \
    -e 's/(AKIA|ASIA)[A-Z0-9]{16}/redacted-key-id/g' \
    -e 's#(assumed-role/[^/[:space:]]+)/[^[:space:]]*#\1#g'
}

# ---------------------------------------------------------------------------------------------------
# Judging. Reads the collected lines on standard input. Offending lines go to standard output and the one-line verdict to standard error.
#
# - `evaluate users`: no IAM user has an inline policy, and the user list was read.
# - `evaluate under <prefix>`: no role or user under the prefix has one, and at least one exists.
#
# Both also need a caller line in ACCOUNT_ID, and no caller line in any other account. An inline list that could not be read counts as offending: a check that examined nothing does not report success.
# ---------------------------------------------------------------------------------------------------

evaluate() {
  local mode="$1" prefix="${2:-}"
  awk -v mode="$mode" -v prefix="$prefix" -v account="$ACCOUNT_ID" '
    function field_from(start, name,   i) {
      for (i = start; i <= NF; i++) if (index($i, name "=") == 1) return substr($i, length(name) + 2)
      return "\001missing"
    }
    function field(name) { return field_from(3, name) }
    $1 == "error" && $2 == "caller" { caller_unread = 1 }
    $1 == "caller" {
      callers++
      if (field_from(2, "account") != account || field_from(2, "match") != "yes") caller_elsewhere = 1
    }
    $1 == "error" && $2 == "users" { unread = unread " user" }
    $1 == "error" && $2 == "roles" && mode == "under" { unread = unread " role" }
    $1 == "users" && $2 ~ /^examined=/ { users_read = 1 }
    $1 == "roles" && $2 ~ /^examined=/ { roles_read = 1 }
    $1 == "user" || ($1 == "role" && mode == "under") {
      if (mode == "under" && index(field("path"), prefix) != 1) next
      examined++
      if (field("inline") != "[]") { print; offending++ }
    }
    END {
      if (caller_unread) {
        print "assert: FAIL: the caller could not be read, so the account is unknown and nothing was judged" > "/dev/stderr"
        exit 1
      }
      if (callers == 0) {
        print "assert: FAIL: the input holds no caller line, so the account is unknown and nothing was judged" > "/dev/stderr"
        exit 1
      }
      if (caller_elsewhere) {
        printf "assert: FAIL: the caller is not in account %s, so nothing was judged\n", account > "/dev/stderr"
        exit 1
      }
      if (unread != "") {
        printf "assert: FAIL: the%s list could not be read, so nothing was judged\n", unread > "/dev/stderr"
        exit 1
      }
      if (!users_read || (mode == "under" && !roles_read)) {
        print "assert: FAIL: nothing examined: the input holds no complete user or role list" > "/dev/stderr"
        exit 1
      }
      if (mode == "under" && examined == 0) {
        printf "assert: FAIL: nothing examined: no role or user lies under %s\n", prefix > "/dev/stderr"
        exit 1
      }
      if (offending > 0) {
        if (mode == "under") printf "assert: FAIL: %d of %d roles and users under %s carry an inline policy or could not be read\n", offending, examined, prefix > "/dev/stderr"
        else printf "assert: FAIL: %d of %d IAM users carry an inline policy or could not be read\n", offending, examined > "/dev/stderr"
        exit 1
      }
      if (mode == "under") printf "assert: PASS: %d roles and users under %s, none with an inline policy\n", examined, prefix > "/dev/stderr"
      else printf "assert: PASS: %d IAM users, none with an inline policy\n", examined > "/dev/stderr"
      exit 0
    }'
}

# ---------------------------------------------------------------------------------------------------
# Self-test. No credentials, no AWS call.
# ---------------------------------------------------------------------------------------------------

self_test() {
  local clean inline_user formatted errfile scrubbed tab key_id temp_key_id caller_ok caller_other
  local stub_status
  tab="$(printf '\t')"
  # Built from parts so that the source holds no access-key-shaped literal.
  key_id="AKIA""IOSFODNN7EXAMPLE"
  temp_key_id="ASIA""IOSFODNN7EXAMPLE"

  caller_ok="caller account=$ACCOUNT_ID principal=assumed-role/openvaa-admin expected-account=$ACCOUNT_ID match=yes"
  caller_other="caller account=111122223333 principal=assumed-role/openvaa-admin expected-account=$ACCOUNT_ID match=no"
  clean="$caller_ok
users examined=2
user user-1 path=other inline=[] attached=[AdministratorAccess] groups=[] tags=[]
user openvaa-staging-smtp path=/openvaa/ inline=[] attached=[openvaa-ses-send] groups=[] tags=[Project]"
  inline_user="$caller_ok
users examined=2
user user-1 path=other inline=[] attached=[] groups=[] tags=[]
user user-2 path=other inline=[AmazonSesSendingAccess] attached=[] groups=[] tags=[InvokedBy=SESConsole]"

  st_judge "users: a clean set passes" 0 users "" "$clean"
  st_judge "users: a user with an inline policy fails" 1 users "" "$inline_user"
  st_judge "users: an account with no IAM user passes once the list was read" 0 users "" "$caller_ok
users examined=0"
  st_judge "users: empty input is nothing examined and fails" 1 users "" ""
  st_judge "users: an unreadable user list fails" 1 users "" "$caller_ok
error users AccessDenied"
  st_judge "users: an unreadable inline list fails" 1 users "" "$caller_ok
users examined=1
user user-1 path=other inline=error(AccessDenied) attached=[] groups=[] tags=[]"
  st_judge "users: a clean set with no caller line fails" 1 users "" "${clean#*$'\n'}"
  st_judge "users: a clean set read in another account fails" 1 users "" "$caller_other
${clean#*$'\n'}"
  st_judge "users: a caller line naming another account fails even when it claims a match" 1 users "" "caller account=111122223333 principal=user expected-account=111122223333 match=yes
${clean#*$'\n'}"
  st_judge "users: an unreadable caller fails" 1 users "" "error caller AccessDenied
${clean#*$'\n'}"

  st_judge "under: clean roles under the path pass" 0 under /openvaa/ "$caller_ok
users examined=0
role openvaa-plan path=/openvaa/ inline=[]
role openvaa-staging-deploy path=/openvaa/ inline=[]
role AWSReservedSSO_AdministratorAccess_0a1b path=/aws-reserved/sso.amazonaws.com/ inline=[Legacy]
roles examined=3"
  st_judge "under: a role under the path with an inline policy fails" 1 under /openvaa/ "$caller_ok
users examined=0
role openvaa-plan path=/openvaa/ inline=[Leftover]
roles examined=1"
  st_judge "under: a user under the path with an inline policy fails" 1 under /openvaa/ "$caller_ok
users examined=1
user openvaa-staging-smtp path=/openvaa/ inline=[ses] attached=[] groups=[] tags=[]
role openvaa-plan path=/openvaa/ inline=[]
roles examined=1"
  st_judge "under: nothing under the path is nothing examined and fails" 1 under /openvaa/ "$caller_ok
users examined=1
user user-1 path=other inline=[] attached=[] groups=[] tags=[]
role SomeRole path=/ inline=[]
roles examined=1"
  st_judge "under: empty input is nothing examined and fails" 1 under /openvaa/ ""
  st_judge "under: an unreadable role list fails" 1 under /openvaa/ "$caller_ok
users examined=0
error roles AccessDenied"
  st_judge "under: clean roles read in another account fail" 1 under /openvaa/ "$caller_other
users examined=0
role openvaa-plan path=/openvaa/ inline=[]
roles examined=1"

  # The collection path, with the AWS CLI replaced by a stub that records each list it is asked for.
  make_workdir
  aws() {
    case "$1 $2" in
      "sts get-caller-identity") printf '%s\t%s\n' "$ST_STUB_ACCOUNT" "arn:aws:sts::$ST_STUB_ACCOUNT:assumed-role/openvaa-admin/session" ;;
      *) printf '%s %s\n' "$1" "$2" >> "$WORK/stub-calls" ;;
    esac
  }
  ST_STUB_ACCOUNT=111122223333
  CALLER_FAILED=0
  : > "$WORK/stub-calls"
  collect_in_account collect_users_and_roles > "$WORK/stub-collected.txt"
  st_present "collect: a caller in another account sets the caller-failed status" "$CALLER_FAILED" "1"
  st_absent "collect: a caller in another account reads no list" "$(cat "$WORK/stub-calls")" "list-"
  stub_status=0
  evaluate under /openvaa/ < "$WORK/stub-collected.txt" > /dev/null 2>&1 || stub_status=$?
  st_present "collect: an assertion in another account exits 1" "$stub_status" "1"
  ST_STUB_ACCOUNT="$ACCOUNT_ID"
  CALLER_FAILED=0
  : > "$WORK/stub-calls"
  collect_in_account collect_users > "$WORK/stub-collected.txt"
  st_present "collect: a caller in the account reads the user list" "$(cat "$WORK/stub-calls")" "iam list-users"
  stub_status=0
  evaluate users < "$WORK/stub-collected.txt" > /dev/null 2>&1 || stub_status=$?
  st_present "collect: an assertion in the account over no user passes" "$stub_status" "0"
  unset -f aws
  CALLER_FAILED=0

  formatted="$(
    fmt_caller 471112560111 "arn:aws:sts::471112560111:assumed-role/AWSReservedSSO_AdministratorAccess_0a1b/matti.meikalainen@example.org"
    fmt_caller 471112560111 "arn:aws:sts::471112560111:assumed-role/openvaa-admin/botocore-session-1712345678"
    fmt_caller 471112560111 "arn:aws:iam::471112560111:user/maija.virtanen@example.org"
    fmt_user 1 / "pekka.example@example.org" "[]" "[AdministratorAccess]" "[admins]" "$(fmt_tags "Owner${tab}someone@example.org")"
    fmt_user 2 / "Teppo.Testaaja" "[AmazonSesSendingAccess]" "[]" "[]" "$(fmt_tags "InvokedBy${tab}SESConsole
Contact${tab}teppo@example.org
cost center${tab}42")"
    fmt_user 3 /openvaa/ "openvaa-staging-smtp" "[]" "[openvaa-ses-send]" "[]" "$(fmt_tags "Project${tab}openvaa")"
    fmt_user 5 / "media-uploader" "[s3-static-media-access]" "[]" "[]" "$(fmt_tags "${key_id}${tab}media upload key
${temp_key_id}${tab}session")"
    fmt_user 4 /openvaa/ "svc@example.org" "$(join_list "Inline@example.org")" "[]" "[]" "[]"
    fmt_role /openvaa/ "openvaa-plan" "[]"
  )"

  st_absent "format: no @ reaches the output" "$formatted" "@"
  st_absent "format: no address session name reaches the output" "$formatted" "matti"
  st_absent "format: no plain session name reaches the output" "$formatted" "botocore-session"
  st_absent "format: an IAM user's own name is not printed for the caller" "$formatted" "maija"
  st_absent "format: a user outside /openvaa/ named by address is not printed" "$formatted" "pekka"
  st_absent "format: a user outside /openvaa/ named like a person is not printed" "$formatted" "Teppo"
  st_absent "format: a tag value other than InvokedBy is not printed" "$formatted" "someone"
  st_present "format: an assumed role prints its role name" "$formatted" "principal=assumed-role/AWSReservedSSO_AdministratorAccess_0a1b "
  st_present "format: an IAM user caller prints the word user" "$formatted" "principal=user "
  st_present "format: a user outside /openvaa/ prints as user-<n>" "$formatted" "user user-2 path=other inline=[AmazonSesSendingAccess]"
  st_present "format: InvokedBy keeps its value, other tags their key" "$formatted" "tags=[InvokedBy=SESConsole,Contact,cost_center]"
  st_present "format: a user under /openvaa/ prints by name" "$formatted" "user openvaa-staging-smtp path=/openvaa/"
  st_present "format: a name with an @ under /openvaa/ is redacted" "$formatted" "user redacted path=/openvaa/ inline=[redacted]"
  st_absent "format: no long-lived access key id reaches the output" "$formatted" "AKIA"
  st_absent "format: no temporary access key id reaches the output" "$formatted" "ASIA"
  st_absent "format: an access key's description tag value is not printed" "$formatted" "media upload"
  st_present "format: a tag keyed by an access key id prints as access-key-description" "$formatted" "user user-5 path=other inline=[s3-static-media-access] attached=[] groups=[] tags=[access-key-description,access-key-description]"

  st_judge "format: the formatted lines, users with an inline policy among them, fail the judge" 1 users "" "$formatted
users examined=5"

  errfile="${TMPDIR:-/tmp}/openvaa-inline-policies-selftest.$$"
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
  scrubbed="$(printf '%s\n' "user user-2 path=other inline=[] attached=[] groups=[] tags=[${key_id},${temp_key_id}]" | scrub)"
  st_absent "scrub: no access key id survives the second barrier" "$scrubbed" "IOSFODNN7EXAMPLE"
  st_present "scrub: an access key id becomes redacted-key-id" "$scrubbed" "tags=[redacted-key-id,redacted-key-id]"

  echo "self-test: $ST_CASES cases, $ST_FAILED failed"
  [ "$ST_FAILED" -eq 0 ]
}

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

# ---------------------------------------------------------------------------------------------------

print_header() {
  awk 'NR == 1 { next } /^#/ { sub(/^# ?/, ""); print; next } { exit }' "$SCRIPT_PATH"
}

main "$@"
