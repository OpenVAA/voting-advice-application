#!/usr/bin/env bash
#
# build-push-image.sh -- Build the frontend image of one pushed commit, tag it with that commit's id and push it.
#
# The image tag is the full commit id of HEAD, and the image's BUILD_SHA is the same string, so a tag in the registry always names a commit anyone can fetch from origin. The script refuses every tree for which that would not hold.
#
# What it checks, in this order. Each refusal prints one `refused=<reason>` line on standard output and exits 1, and every refusal but the last comes before any AWS call:
#   dirty-tree        `git status --porcelain`, untracked files included, is not empty.
#   not-a-commit-id   `git rev-parse HEAD` is not 40 lower-case hexadecimal characters, compared as a whole string.
#   planning-in-tree  HEAD's tree or the working tree holds `.planning/`. The commit is public once pushed, and the planning record is not published with it.
#   head-not-pushed   No line of `git ls-remote origin` carries HEAD's id. `failed=ls-remote` when origin cannot be read.
#   account           `aws sts get-caller-identity` fails or names another account than OPENVAA_ACCOUNT_ID. The line names the expected account only.
#
# What it does then:
#   1. Looks the tag up with `aws ecr describe-images`. When the registry holds it, prints `tag_exists=yes image_digest=<digest>` and exits 3 without building: the repository's tags are immutable, and a second build of one commit is not the image the tag already names.
#   2. Signs docker in to the registry. The password goes from `aws ecr get-login-password` straight to `docker login` on standard input; it is never held in a variable, never on a command line and never written by this script. Where docker keeps the login is docker's own credential store; the script signs docker out again on exit.
#   3. Builds apps/frontend/Dockerfile, target production, natively for the platform, with BUILD_SHA=<id> and with the provenance and SBOM attestations turned off, so the pushed artifact is one image manifest and not an index. The build runs from a copy of the commit's tree, never from the working tree: `git archive` of the commit is written to a file in the script's temporary directory and extracted there, so the context holds the commit's tracked files and nothing else, and no ignored or untracked file can reach the image. `.dockerignore` then applies to that copy. The image is loaded into the local image store and tagged <url>:<id>.
#   4. Pushes <url>:<id>, reads its digest back from the registry and prints `image_tag=<id>` and `image_digest=<digest>`.
#   A step that fails prints `failed=<step>`, the step being describe-images, login, context, build, push or read-digest.
#   `failed=context` means the commit's archive could not be written or extracted; nothing is built or pushed.
#
# What it does not check: that the commit's tests passed, that the commit is on any particular branch, or that the image starts. Those belong to the caller.
#
# Usage (from a shell signed in to the account, with the AWS CLI and docker with buildx on the PATH):
#   ```sh
#   infra/scripts/build-push-image.sh --repository-url <url>
#   infra/scripts/build-push-image.sh --repository-url <url> --platform linux/amd64
#   ```
#
#   --repository-url <url>  REQUIRED. The image repository, <account>.dkr.ecr.<region>.amazonaws.com/<name>, the bootstrap root's output registry_url. Its account must be OPENVAA_ACCOUNT_ID and its region AWS_REGION.
#   --platform <platform>   OPTIONAL. The platform to build for. Default: linux/arm64, the platform the service runs on. Built natively: on another host architecture the build is emulated and slow.
#   -h, --help              Print this header and exit 0.
#
# For a workflow caller: read the status directly, never through a pipe. Status 0 prints two lines, `image_tag=<id>` and `image_digest=<digest>`. Status 3 prints one line, `tag_exists=yes image_digest=<digest>`, and means the registry already holds this commit's image, which the caller deploys as it is. Any other status comes with a `refused=` or `failed=` line on standard output naming the reason.
#
# The script judges the repository it lies in: the git checks and the build both use the top level of the working tree that holds this file, whatever the current directory is. Run it from a worktree of the commit to build that commit.
#
# Environment: OPENVAA_ACCOUNT_ID (default 471112560111) is the account the caller must be in; AWS_REGION (default eu-north-1) is the region of the registry.
#
# Exit codes:
#   0:  the image was built and pushed
#   1:  refused, or a step failed
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
SCRIPT_NAME="build-push-image.sh"
USAGE_LINE="--repository-url <url> [--platform <platform>] | -h | --help"
# shellcheck source=../../scripts/lib/cli.sh
. "$SCRIPT_DIR/../../scripts/lib/cli.sh"
# shellcheck source=../../scripts/lib/aws.sh
. "$SCRIPT_DIR/../../scripts/lib/aws.sh"

DEFAULT_PLATFORM="linux/arm64"
DOCKERFILE="apps/frontend/Dockerfile"
BUILD_TARGET="production"

REPO=""
URL=""
PLATFORM="$DEFAULT_PLATFORM"
REGISTRY_HOST=""
REPOSITORY_NAME=""
SHA=""
WORK=""
LOGGED_IN=0

refuse() {
  echo "refused=$1"
  note "$2"
  exit 1
}

is_commit_id() {
  local re='^[0-9a-f]{40}$'
  [[ "$1" =~ $re ]]
}

# Splits the repository URL into the registry host and the repository name. Refuses, as a usage error, a URL that is not an image repository of OPENVAA_ACCOUNT_ID in AWS_REGION.
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
    docker logout "$REGISTRY_HOST" > /dev/null 2>&1 || true
    LOGGED_IN=0
  fi
  [ -z "$WORK" ] || rm -rf "$WORK"
}

# ---------------------------------------------------------------------------------------------------
# The checks and the build. Every status is read directly; nothing relies on `set -e`.
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
  if ! caller="$(aws sts get-caller-identity --query Account --output text 2> /dev/null)"; then
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
  out="$(aws ecr describe-images --region "$REGION" --repository-name "$REPOSITORY_NAME" \
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
  if ! tar -x -f "$WORK/context.tar" -C "$WORK/context" 2> /dev/null; then
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

  if ! aws ecr get-login-password --region "$REGION" 2> /dev/null \
    | docker login --username AWS --password-stdin "$REGISTRY_HOST" > /dev/null 2>&1; then
    fail_step login "docker could not sign in to the registry"
  fi
  LOGGED_IN=1

  make_context

  image="$URL:$SHA"
  if ! docker buildx build --platform "$PLATFORM" --target "$BUILD_TARGET" \
    --build-arg "BUILD_SHA=$SHA" --provenance=false --sbom=false -f "$WORK/context/$DOCKERFILE" -t "$image" \
    --load "$WORK/context" >&2; then
    fail_step build
  fi
  docker push "$image" >&2 || fail_step push

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

main() {
  case "${1:-}" in
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
