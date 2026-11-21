#!/usr/bin/env bash
#
# check-inline-policies.sh -- Judge, over the AWS account, the rule that no IAM identity carries an
# inline policy.
#
# Usage (from a shell signed in to the account, with the AWS CLI on the PATH):
#   infra/scripts/check-inline-policies.sh --assert-no-inline-user-policies    # exit 1 if any IAM user has an inline policy
#   infra/scripts/check-inline-policies.sh --assert-managed-only /openvaa/     # exit 1 if a role or user under the path has one
#   infra/scripts/check-inline-policies.sh --self-test                         # judge canned lines; needs no credentials
#
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
# Exit codes:
#   0:  the assertion holds, or every self-test case passed
#   1:  the assertion does not hold, a list the assertion needs could not be read, the assertion
#       examined nothing, or a self-test case failed
#   2:  usage error
#
# Every AWS call this script makes is a read: list- only. It changes nothing.
#
# It prints names and no credential, and it never echoes a value it was given; `set -x` must not be
# added, because tracing would print the raw user names.
#
# The lines it prints are written to be pasted into a public record: every user or role that carries
# an inline policy or whose inline policies could not be read, then a one-line verdict on standard
# error. It prints no e-mail address, no session name and no error message of a failed call: a failed
# call prints the error code alone (for example AccessDenied), because the message names the caller's
# session. An IAM user is printed by name only when it lies under the path /openvaa/, where this
# project creates its own service users; any other user is printed as user-<n>, n being its position
# in the order the user list gives, because a user name is often a person's name or address. Run
# aws iam list-users --query 'Users[].UserName' on your own machine to see which user a line means. A
# tag is printed by its key alone, except InvokedBy, whose value is one of AWS's own words. Any field
# that still holds an "@" is printed as "redacted".

set -euo pipefail
set -f

export AWS_PAGER=""
export LC_ALL=C

OWN_PATH="/openvaa/"

SCRIPT_PATH="${BASH_SOURCE[0]}"
WORK=""
OUT=""
ERR_CODE=""
ST_CASES=0
ST_FAILED=0

main() {
  local status=0
  case "${1:-}" in
    --assert-no-inline-user-policies)
      [ "$#" -eq 1 ] || { usage_line; exit 2; }
      make_workdir
      collect_users > "$WORK/collected.txt"
      scrub < "$WORK/collected.txt" > "$WORK/scrubbed.txt"
      evaluate users < "$WORK/scrubbed.txt" || status=$?
      exit "$status"
      ;;
    --assert-managed-only)
      [ "$#" -eq 2 ] || { usage_line; exit 2; }
      case "$2" in
        /*/ | /) ;;
        *) echo "check-inline-policies.sh: the path prefix must begin and end with /" >&2; exit 2 ;;
      esac
      make_workdir
      { collect_users; collect_roles; } > "$WORK/collected.txt"
      scrub < "$WORK/collected.txt" > "$WORK/scrubbed.txt"
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

usage_line() {
  echo "usage: check-inline-policies.sh [--assert-no-inline-user-policies | --assert-managed-only <path-prefix> | --self-test | -h | --help]" >&2
}

make_workdir() {
  WORK="$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-inline-policies.XXXXXX")"
  trap 'rm -rf "$WORK"' EXIT
}

# ---------------------------------------------------------------------------------------------------
# Collecting. Each AWS call goes through `call`, which keeps the output in OUT and the error code in
# ERR_CODE, and drops the error message.
# ---------------------------------------------------------------------------------------------------

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

# ---------------------------------------------------------------------------------------------------
# Formatting. These functions turn raw values into output lines. They are what the self-test feeds.
# ---------------------------------------------------------------------------------------------------

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

# Second barrier over every printed line: a token holding an "@" becomes "redacted", and anything after
# an assumed role's name is cut off.
scrub() {
  sed -E -e 's/[^[:space:]]*@[^[:space:]]*/redacted/g' -e 's#(assumed-role/[^/[:space:]]+)/[^[:space:]]*#\1#g'
}

# ---------------------------------------------------------------------------------------------------
# Judging. Reads the collected lines on standard input. Offending lines go to standard output and the
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
    fmt_user 1 / "pekka.example@example.org" "[]" "[AdministratorAccess]" "[admins]" "$(fmt_tags "Owner${tab}someone@example.org")"
    fmt_user 2 / "Teppo.Testaaja" "[AmazonSesSendingAccess]" "[]" "[]" "$(fmt_tags "InvokedBy${tab}SESConsole
Contact${tab}teppo@example.org
cost center${tab}42")"
    fmt_user 3 /openvaa/ "openvaa-staging-smtp" "[]" "[openvaa-ses-send]" "[]" "$(fmt_tags "Project${tab}openvaa")"
    fmt_user 4 /openvaa/ "svc@example.org" "$(join_list "Inline@example.org")" "[]" "[]" "[]"
    fmt_role /openvaa/ "openvaa-plan" "[]"
  )"

  st_absent "format: no @ reaches the output" "$formatted" "@"
  st_absent "format: a user outside /openvaa/ named by address is not printed" "$formatted" "pekka"
  st_absent "format: a user outside /openvaa/ named like a person is not printed" "$formatted" "Teppo"
  st_absent "format: a tag value other than InvokedBy is not printed" "$formatted" "someone"
  st_present "format: a user outside /openvaa/ prints as user-<n>" "$formatted" "user user-2 path=other inline=[AmazonSesSendingAccess]"
  st_present "format: InvokedBy keeps its value, other tags their key" "$formatted" "tags=[InvokedBy=SESConsole,Contact,cost_center]"
  st_present "format: a user under /openvaa/ prints by name" "$formatted" "user openvaa-staging-smtp path=/openvaa/"
  st_present "format: a name with an @ under /openvaa/ is redacted" "$formatted" "user redacted path=/openvaa/ inline=[redacted]"

  st_judge "format: the formatted lines, users with an inline policy among them, fail the judge" 1 users "" "$formatted
users examined=4"

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
