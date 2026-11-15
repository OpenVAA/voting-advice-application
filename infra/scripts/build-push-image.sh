#!/usr/bin/env bash
#
# build-push-image.sh -- Build the frontend image of one pushed commit, tag it with that commit's id and push it.
#
# The image tag is the full commit id of HEAD, and the image's BUILD_SHA is the same string, so a tag in the registry
# always names a commit anyone can fetch from origin. The script refuses every tree for which that would not hold.
#
# What it checks, in this order. Each refusal prints one `refused=<reason>` line on standard output and exits 1, and
# every refusal but the last comes before any AWS call:
#   dirty-tree        `git status --porcelain`, untracked files included, is not empty.
#   not-a-commit-id   `git rev-parse HEAD` is not 40 lower-case hexadecimal characters, compared as a whole string.
#   planning-in-tree  HEAD's tree or the working tree holds `.planning/`. The commit is public once pushed, and the
#                     planning record is not published with it.
#   head-not-pushed   No line of `git ls-remote origin` carries HEAD's id. `failed=ls-remote` when origin cannot be read.
#   account           `aws sts get-caller-identity` fails or names another account than OPENVAA_ACCOUNT_ID. The line
#                     names the expected account only.
#
# What it does then:
#   1. Looks the tag up with `aws ecr describe-images`. When the registry holds it, prints `tag_exists=yes
#      image_digest=<digest>` and exits 3 without building: the repository's tags are immutable, and a second build
#      of one commit is not the image the tag already names.
#   2. Signs docker in to the registry. The password goes from `aws ecr get-login-password` straight to `docker login`
#      on standard input; it is never held in a variable, never on a command line and never written by this script.
#      Where docker keeps the login is docker's own credential store; the script signs docker out again on exit.
#   3. Builds apps/frontend/Dockerfile, target production, from the repository root, natively for the platform, with
#      BUILD_SHA=<id> and with the provenance and SBOM attestations turned off, so the pushed artifact is one image
#      manifest and not an index. The image is loaded into the local image store and tagged <url>:<id>.
#   4. Pushes <url>:<id>, reads its digest back from the registry and prints `image_tag=<id>` and `image_digest=<digest>`.
#   A step that fails prints `failed=<step>`, the step being describe-images, login, build, push or read-digest.
#
# What it does not check: that the commit's tests passed, that the commit is on any particular branch, or that the image
# starts. Those belong to the caller.
#
# Usage (from a shell signed in to the account, with the AWS CLI and docker with buildx on the PATH):
#   infra/scripts/build-push-image.sh --repository-url <url>
#   infra/scripts/build-push-image.sh --repository-url <url> --platform linux/amd64
#   infra/scripts/build-push-image.sh --self-test
#
#   --repository-url <url>  REQUIRED. The image repository, <account>.dkr.ecr.<region>.amazonaws.com/<name>, the
#                           bootstrap root's output registry_url. Its account must be OPENVAA_ACCOUNT_ID and its region
#                           AWS_REGION.
#   --platform <platform>   OPTIONAL. The platform to build for. Default: linux/arm64, the platform the service runs on.
#                           Built natively: on another host architecture the build is emulated and slow.
#   --self-test             Run the checks against throwaway local repositories with the AWS CLI and docker replaced by
#                           stubs. Needs no credential and no network. Each case prints `self_test <name> PASS|FAIL`.
#   -h, --help              Print this header and exit 0.
#
# The script judges the repository it lies in: the git checks and the build both use the top level of the working tree
# that holds this file, whatever the current directory is. Run it from a worktree of the commit to build that commit.
#
# Environment: OPENVAA_ACCOUNT_ID (default 471112560111) is the account the caller must be in; AWS_REGION (default
# eu-north-1) is the region of the registry.
#
# Exit codes:
#   0:  the image was built and pushed, or every self-test case passed
#   1:  refused, a step failed, or a self-test case failed
#   2:  usage error
#   3:  the tag is already in the registry; nothing was built
#   130:  interrupted (SIGINT/SIGTERM/SIGHUP)
#
# It prints no credential and no error message of a failed AWS call, because such a message names the caller's session.
# `set -x` must not be added.

set -euo pipefail
set -f

export AWS_PAGER=""
export LC_ALL=C

ACCOUNT_ID="${OPENVAA_ACCOUNT_ID:-471112560111}"
REGION="${AWS_REGION:-eu-north-1}"
export AWS_REGION="$REGION"

SCRIPT_PATH="${BASH_SOURCE[0]}"
SCRIPT_DIR="$(cd "$(dirname "$SCRIPT_PATH")" && pwd -P)"

DEFAULT_PLATFORM="linux/arm64"
DOCKERFILE="apps/frontend/Dockerfile"
BUILD_TARGET="production"

# The commands the script runs. The self-test replaces the two that reach outside the host with stubs, and wraps the
# third so that it can make an extraction fail.
AWS="aws"
DOCKER="docker"
TAR="tar"

REPO=""
URL=""
PLATFORM="$DEFAULT_PLATFORM"
REGISTRY_HOST=""
REPOSITORY_NAME=""
SHA=""
WORK=""
LOGGED_IN=0

usage_line() {
  echo "usage: build-push-image.sh --repository-url <url> [--platform <platform>] | --self-test | -h | --help" >&2
}

print_header() {
  awk 'NR == 1 { next } /^#/ { sub(/^# ?/, ""); print; next } { exit }' "$SCRIPT_PATH"
}

usage_error() {
  echo "build-push-image.sh: $1" >&2
  usage_line
  exit 2
}

note() {
  echo "build-push-image.sh: $1" >&2
}

refuse() {
  echo "refused=$1"
  note "$2"
  exit 1
}

fail_step() {
  echo "failed=$1"
  [ -z "${2:-}" ] || note "$2"
  exit 1
}

is_commit_id() {
  local re='^[0-9a-f]{40}$'
  [[ "$1" =~ $re ]]
}

is_digest() {
  local re='^sha256:[0-9a-f]{64}$'
  [[ "$1" =~ $re ]]
}

# The error code of a failed AWS call, read from its standard error, or "unknown".
error_code() {
  local code
  code="$(awk 'match($0, /An error occurred \([A-Za-z][A-Za-z0-9.]*\)/) { print substr($0, RSTART + 19, RLENGTH - 20); exit }' "$1")"
  printf '%s' "${code:-unknown}"
}

# Splits the repository URL into the registry host and the repository name. Refuses, as a usage error, a URL that is
# not an image repository of OPENVAA_ACCOUNT_ID in AWS_REGION.
parse_url() {
  local host_re='^([0-9]{12})\.dkr\.ecr\.([a-z0-9-]+)\.amazonaws\.com$'
  local name_re='^[a-z0-9]([a-z0-9._/-]*[a-z0-9])?$'
  case "$URL" in
    */*) ;;
    *) usage_error "--repository-url must be <account>.dkr.ecr.<region>.amazonaws.com/<name>" ;;
  esac
  REGISTRY_HOST="${URL%%/*}"
  REPOSITORY_NAME="${URL#*/}"
  [[ "$REGISTRY_HOST" =~ $host_re ]] || usage_error "--repository-url must be <account>.dkr.ecr.<region>.amazonaws.com/<name>"
  [ "${BASH_REMATCH[1]}" = "$ACCOUNT_ID" ] || usage_error "--repository-url is not a repository of account $ACCOUNT_ID"
  [ "${BASH_REMATCH[2]}" = "$REGION" ] || usage_error "--repository-url is not in region $REGION"
  [[ "$REPOSITORY_NAME" =~ $name_re ]] || usage_error "--repository-url names no valid repository"
}

make_workdir() {
  WORK="$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-build-push.XXXXXX")"
}

on_exit() {
  if [ "$LOGGED_IN" -eq 1 ]; then
    "$DOCKER" logout "$REGISTRY_HOST" > /dev/null 2>&1 || true
    LOGGED_IN=0
  fi
  [ -z "$WORK" ] || rm -rf "$WORK"
}

# ---------------------------------------------------------------------------------------------------
# The checks and the build. Every status is read directly; nothing relies on `set -e`, because the self-test runs this
# in a subshell whose status it reads.
# ---------------------------------------------------------------------------------------------------

check_tree() {
  local porcelain head remote planning id ref found=0

  if ! porcelain="$(git -C "$REPO" status --porcelain --untracked-files=all)"; then
    refuse dirty-tree "git status could not be read in $REPO"
  fi
  [ -z "$porcelain" ] || refuse dirty-tree "the working tree has changes or untracked files; commit or remove them first"

  head="$(git -C "$REPO" rev-parse --verify --quiet HEAD 2> /dev/null)" || head=""
  is_commit_id "$head" || refuse not-a-commit-id "HEAD is not a 40-character lower-case hexadecimal commit id"
  SHA="$head"

  if ! planning="$(git -C "$REPO" ls-tree -r --name-only "$SHA" -- .planning)"; then
    refuse planning-in-tree "HEAD's tree could not be read"
  fi
  [ -z "$planning" ] || refuse planning-in-tree "HEAD's tree holds .planning/; build from a commit without it"
  [ ! -e "$REPO/.planning" ] || refuse planning-in-tree "the working tree holds .planning/; build from a worktree without it"

  if ! remote="$(git -C "$REPO" ls-remote origin)"; then
    fail_step ls-remote "origin could not be read"
  fi
  while IFS=$'\t' read -r id ref; do
    if [ "$id" = "$SHA" ]; then found=1; fi
  done <<< "$remote"
  [ "$found" -eq 1 ] || refuse head-not-pushed "no ref of origin points at HEAD; push the commit first"
}

check_account() {
  local caller
  if ! caller="$("$AWS" sts get-caller-identity --query Account --output text 2> /dev/null)"; then
    echo "refused=account expected_account=$ACCOUNT_ID"
    note "the caller could not be read"
    exit 1
  fi
  if [ "$caller" != "$ACCOUNT_ID" ]; then
    echo "refused=account expected_account=$ACCOUNT_ID"
    note "the caller is not in account $ACCOUNT_ID"
    exit 1
  fi
}

# Prints the tag's digest and returns 0 when the registry holds the tag; returns 4 when it does not; 1 otherwise.
lookup_digest() {
  local out rc=0
  out="$("$AWS" ecr describe-images --region "$REGION" --repository-name "$REPOSITORY_NAME" \
    --image-ids "imageTag=$SHA" --query 'imageDetails[0].imageDigest' --output text 2> "$WORK/describe.err")" || rc=$?
  if [ "$rc" -eq 0 ]; then
    is_digest "$out" || return 1
    printf '%s' "$out"
    return 0
  fi
  [ "$(error_code "$WORK/describe.err")" = "ImageNotFoundException" ] && return 4
  return 1
}

# Writes the commit's tree into WORK/context: `git archive` of the commit into a file, then extracted from that file.
# The context holds the commit's tracked files and nothing else, whatever the working tree holds beside them.
make_context() {
  if ! mkdir "$WORK/context"; then
    fail_step context "the build context directory could not be created"
  fi
  if ! git -C "$REPO" archive --format=tar -o "$WORK/context.tar" "$SHA" 2> /dev/null; then
    fail_step context "the commit could not be archived"
  fi
  if ! "$TAR" -x -f "$WORK/context.tar" -C "$WORK/context" 2> /dev/null; then
    fail_step context "the commit's archive could not be extracted"
  fi
  rm -f "$WORK/context.tar"
}

build_and_push() {
  local digest rc=0 image

  digest="$(lookup_digest)" || rc=$?
  case "$rc" in
    0)
      echo "tag_exists=yes image_digest=$digest"
      note "the registry already holds the tag $SHA; nothing was built"
      exit 3
      ;;
    4) ;;
    *) fail_step describe-images "the registry could not be read ($(error_code "$WORK/describe.err"))" ;;
  esac

  if ! "$AWS" ecr get-login-password --region "$REGION" 2> /dev/null \
    | "$DOCKER" login --username AWS --password-stdin "$REGISTRY_HOST" > /dev/null 2>&1; then
    fail_step login "docker could not sign in to the registry"
  fi
  LOGGED_IN=1

  make_context

  image="$URL:$SHA"
  if ! "$DOCKER" buildx build --platform "$PLATFORM" --target "$BUILD_TARGET" \
    --build-arg "BUILD_SHA=$SHA" --provenance=false --sbom=false -f "$WORK/context/$DOCKERFILE" -t "$image" \
    --load "$WORK/context" >&2; then
    fail_step build
  fi
  "$DOCKER" push "$image" >&2 || fail_step push

  rc=0
  digest="$(lookup_digest)" || rc=$?
  [ "$rc" -eq 0 ] || fail_step read-digest "the pushed tag could not be read back from the registry"
  echo "image_tag=$SHA"
  echo "image_digest=$digest"
}

deploy() {
  check_tree
  check_account
  build_and_push
  exit 0
}

# ---------------------------------------------------------------------------------------------------
# Self-test. No credential, no network: origin is a bare repository in a temporary directory, and the AWS CLI and docker
# are shell functions that record each call.
# ---------------------------------------------------------------------------------------------------

ST_CASES=0
ST_FAILED=0
ST=""
ST_PASSWORD="stub-registry-password-do-not-print-5e81"
ST_DIGEST="sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
ST_STATUS=0
ST_OUT=""
ST_TRACKED=""

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

# The AWS CLI stub. The caller's account is ST_ACCOUNT; describe-images answers from the files ST/describe.<n>, n being
# the count of earlier describe-images calls: a file holding a digest answers with it, a file holding an error code
# fails with that code.
st_aws() {
  printf '%s\n' "$*" >> "$ST/aws.log"
  case "$1 $2" in
    "sts get-caller-identity")
      printf '%s\n' "$ST_ACCOUNT"
      ;;
    "ecr describe-images")
      local n answer
      n="$(grep -c 'describe-images' "$ST/aws.log")"
      answer="$(cat "$ST/describe.$n" 2> /dev/null || echo AccessDeniedException)"
      if is_digest "$answer"; then
        printf '%s\n' "$answer"
      else
        echo "An error occurred ($answer) when calling the DescribeImages operation: stub" >&2
        return 254
      fi
      ;;
    "ecr get-login-password")
      printf '%s\n' "$ST_PASSWORD"
      ;;
    *)
      return 1
      ;;
  esac
}

# The docker stub. A build records the context it was given (its last argument), the script's temporary directory, and
# what the context holds: whether the ignored file the self-test plants is in it, and whether the tracked file holds
# ST_TRACKED. A build fails when the file ST/build-fails exists.
st_docker() {
  printf '%s\n' "$*" >> "$ST/docker.log"
  case "$1" in
    login)
      local given
      given="$(cat)"
      if [ "$given" = "$ST_PASSWORD" ]; then echo "login-stdin=password" >> "$ST/docker.log"; fi
      ;;
    buildx)
      local context="${!#}" ignored=no tracked=no
      [ ! -e "$context/planted-ignored.txt" ] || ignored=yes
      [ "$(cat "$context/file.txt" 2> /dev/null)" != "$ST_TRACKED" ] || tracked=yes
      printf 'context=%s\nwork=%s\ncontext-holds-ignored=%s\ncontext-holds-tracked=%s\n' \
        "$context" "$WORK" "$ignored" "$tracked" >> "$ST/docker.log"
      [ ! -e "$ST/build-fails" ] || return 1
      ;;
  esac
  return 0
}

# The tar stub: the real tar, except that an extraction fails when the file ST/extract-fails exists.
st_tar() {
  [ ! -e "$ST/extract-fails" ] || return 1
  tar "$@"
}

st_git() {
  git -C "$ST/clone" -c user.name=self-test -c user.email=self-test@example.invalid -c commit.gpgsign=false "$@"
}

# Runs the deployment against the clone, with the stubs, in a subshell, and keeps its status and output.
st_run() {
  : > "$ST/aws.log"
  : > "$ST/docker.log"
  ST_STATUS=0
  ST_OUT="$(
    exec 2> "$ST/stderr.log"
    REPO="$ST/clone"
    URL="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/openvaa-frontend"
    AWS=st_aws
    DOCKER=st_docker
    TAR=st_tar
    parse_url
    make_workdir
    trap on_exit EXIT
    deploy
  )" || ST_STATUS=$?
}

self_test() {
  local sha aws_calls docker_calls context work
  ST="$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-build-push-test.XXXXXX")"
  trap 'rm -rf "$ST"' EXIT
  export GIT_CONFIG_NOSYSTEM=1
  export GIT_CONFIG_GLOBAL=/dev/null
  export AWS_CONFIG_FILE=/dev/null
  export AWS_SHARED_CREDENTIALS_FILE=/dev/null

  st_expect "commit-id-accepts-40-hex" is_commit_id "0123456789abcdef0123456789abcdef01234567"
  st_expect "commit-id-refuses-upper-case" eval '! is_commit_id "0123456789ABCDEF0123456789ABCDEF01234567"'
  st_expect "commit-id-refuses-39" eval '! is_commit_id "0123456789abcdef0123456789abcdef0123456"'
  st_expect "commit-id-refuses-64" eval '! is_commit_id "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"'
  st_expect "commit-id-refuses-trailing-newline" eval '! is_commit_id "0123456789abcdef0123456789abcdef01234567
"'

  git init -q --bare "$ST/origin.git"
  git clone -q "$ST/origin.git" "$ST/clone" 2> /dev/null
  printf 'one\n' > "$ST/clone/file.txt"
  st_git add file.txt
  st_git commit -q -m one
  st_git push -q origin HEAD:refs/heads/main 2> /dev/null

  ST_ACCOUNT="000000000000"
  printf 'two\n' > "$ST/clone/untracked.txt"
  st_run
  st_expect "dirty-untracked-refused" equals "$ST_STATUS $ST_OUT" "1 refused=dirty-tree"
  st_expect "dirty-untracked-makes-no-aws-call" equals "$(cat "$ST/aws.log")" ""
  rm -f "$ST/clone/untracked.txt"
  printf 'changed\n' > "$ST/clone/file.txt"
  st_run
  st_expect "dirty-modified-refused" equals "$ST_STATUS $ST_OUT" "1 refused=dirty-tree"
  st_git checkout -q -- file.txt

  printf 'three\n' > "$ST/clone/file.txt"
  st_git commit -q -am three
  st_run
  st_expect "unpushed-refused" equals "$ST_STATUS $ST_OUT" "1 refused=head-not-pushed"
  st_expect "unpushed-makes-no-aws-call" equals "$(cat "$ST/aws.log")" ""

  mkdir "$ST/clone/.planning"
  printf 'plan\n' > "$ST/clone/.planning/PLAN.md"
  st_git add .planning/PLAN.md
  st_git commit -q -m planning
  st_git push -q origin HEAD:refs/heads/main 2> /dev/null
  st_run
  st_expect "planning-in-tree-refused" equals "$ST_STATUS $ST_OUT" "1 refused=planning-in-tree"
  st_expect "planning-in-tree-makes-no-aws-call" equals "$(cat "$ST/aws.log")" ""
  st_git rm -q -r .planning
  st_git commit -q -m "no planning"
  printf 'planted-ignored.txt\n' > "$ST/clone/.gitignore"
  st_git add .gitignore
  st_git commit -q -m ignore
  st_git push -q origin HEAD:refs/heads/main 2> /dev/null
  sha="$(st_git rev-parse HEAD)"
  ST_TRACKED="three"
  # Ignored, so the tree is still clean and every check passes with it in the working tree.
  printf 'local secret\n' > "$ST/clone/planted-ignored.txt"

  st_run
  aws_calls="$(cat "$ST/aws.log")"
  st_expect "pushed-other-account-refused" equals "$ST_STATUS $ST_OUT" "1 refused=account expected_account=$ACCOUNT_ID"
  st_expect "pushed-other-account-stops-at-the-caller" equals "$aws_calls" "sts get-caller-identity --query Account --output text"
  st_expect "pushed-other-account-names-no-other-account" lacks "$ST_OUT" "000000000000"
  st_expect "pushed-other-account-runs-no-docker" equals "$(cat "$ST/docker.log")" ""

  ST_ACCOUNT="$ACCOUNT_ID"
  printf '%s\n' "$ST_DIGEST" > "$ST/describe.1"
  st_run
  st_expect "tag-exists-exits-3" equals "$ST_STATUS" "3"
  st_expect "tag-exists-prints-digest" equals "$ST_OUT" "tag_exists=yes image_digest=$ST_DIGEST"
  st_expect "tag-exists-runs-no-docker" equals "$(cat "$ST/docker.log")" ""
  st_expect "tag-exists-looks-up-the-commit" has "$(cat "$ST/aws.log")" "--image-ids imageTag=$sha "

  printf 'AccessDeniedException\n' > "$ST/describe.1"
  st_run
  st_expect "registry-unreadable-fails" equals "$ST_STATUS $ST_OUT" "1 failed=describe-images"
  st_expect "registry-unreadable-runs-no-docker" equals "$(cat "$ST/docker.log")" ""

  printf 'ImageNotFoundException\n' > "$ST/describe.1"
  printf '%s\n' "$ST_DIGEST" > "$ST/describe.2"
  : > "$ST/build-fails"
  st_run
  docker_calls="$(cat "$ST/docker.log")"
  st_expect "build-failure-fails" equals "$ST_STATUS $ST_OUT" "1 failed=build"
  st_expect "build-failure-pushes-nothing" lacks "$docker_calls" "push "
  st_expect "build-failure-signs-out" has "$docker_calls" "logout $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"
  rm -f "$ST/build-fails"

  : > "$ST/extract-fails"
  st_run
  docker_calls="$(cat "$ST/docker.log")"
  st_expect "context-failure-fails" equals "$ST_STATUS $ST_OUT" "1 failed=context"
  st_expect "context-failure-builds-nothing" lacks "$docker_calls" "buildx "
  st_expect "context-failure-pushes-nothing" lacks "$docker_calls" "push "
  rm -f "$ST/extract-fails"

  st_run
  aws_calls="$(cat "$ST/aws.log")"
  docker_calls="$(cat "$ST/docker.log")"
  st_expect "push-exits-0" equals "$ST_STATUS" "0"
  st_expect "push-prints-tag-and-digest" equals "$ST_OUT" "image_tag=$sha
image_digest=$ST_DIGEST"
  st_expect "push-password-on-stdin" has "$docker_calls" "login-stdin=password"
  st_expect "push-password-on-no-command-line" lacks "$aws_calls
$docker_calls" "$ST_PASSWORD"
  st_expect "push-password-not-printed" lacks "$ST_OUT" "$ST_PASSWORD"
  st_expect "push-builds-the-target" has "$docker_calls" "buildx build --platform $DEFAULT_PLATFORM --target $BUILD_TARGET "
  st_expect "push-build-sha-is-the-tag" has "$docker_calls" "--build-arg BUILD_SHA=$sha "
  # The flag needles are built from parts, so that each flag is written once in this file, on the build line.
  st_expect "push-turns-provenance-off" has "$docker_calls" " --""provenance=false "
  st_expect "push-turns-sbom-off" has "$docker_calls" " --""sbom=false "
  st_expect "push-tags-the-commit" has "$docker_calls" "-t $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/openvaa-frontend:$sha --load /"
  context="$(sed -n 's/^context=//p' "$ST/docker.log")"
  work="$(sed -n 's/^work=//p' "$ST/docker.log")"
  st_expect "ignored-file-absent-from-context" has "$docker_calls" "context-holds-ignored=no"
  st_expect "context-holds-the-commit" has "$docker_calls" "context-holds-tracked=yes"
  st_expect "context-is-not-the-working-tree" eval '[ -n "$work" ] && [ "$context" = "$work/context" ] && lacks "$context/" "$ST/clone/"'
  st_expect "push-builds-the-commit-dockerfile" has "$docker_calls" "-f $work/context/$DOCKERFILE "
  st_expect "push-pushes-the-tag" has "$docker_calls" "push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/openvaa-frontend:$sha"
  st_expect "push-signs-out" has "$docker_calls" "logout $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"
  rm -f "$ST/clone/planted-ignored.txt"

  echo "self_test summary cases=$ST_CASES failed=$ST_FAILED"
  [ "$ST_FAILED" -eq 0 ]
}

# ---------------------------------------------------------------------------------------------------

main() {
  case "${1:-}" in
    --self-test)
      [ "$#" -eq 1 ] || { usage_line; exit 2; }
      self_test || exit 1
      exit 0
      ;;
    -h | --help)
      print_header
      exit 0
      ;;
  esac

  while [ "$#" -gt 0 ]; do
    case "$1" in
      --repository-url)
        [ "$#" -ge 2 ] || usage_error "--repository-url requires a value"
        URL="$2"
        shift 2
        ;;
      --platform)
        [ "$#" -ge 2 ] || usage_error "--platform requires a value"
        PLATFORM="$2"
        shift 2
        ;;
      *)
        usage_error "unknown argument: $1"
        ;;
    esac
  done
  [ -n "$URL" ] || usage_error "--repository-url is required"
  local platform_re='^linux/[a-z0-9]+(/v[0-9]+)?$'
  [[ "$PLATFORM" =~ $platform_re ]] || usage_error "--platform must be linux/<architecture>"
  local account_re='^[0-9]{12}$'
  [[ "$ACCOUNT_ID" =~ $account_re ]] || usage_error "OPENVAA_ACCOUNT_ID must be a 12-digit account id"
  parse_url

  if ! REPO="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2> /dev/null)"; then
    note "the script does not lie in a git working tree"
    exit 1
  fi
  make_workdir
  trap on_exit EXIT
  trap 'exit 130' INT TERM HUP
  deploy
}

main "$@"
