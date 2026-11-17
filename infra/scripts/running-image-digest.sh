#!/usr/bin/env bash
#
# running-image-digest.sh -- Print the digest of the image an ECS service runs now.
#
# A plan of the staging AWS root needs `image_digest`, which no variable file holds. The deploy job of the pipeline
# passes the digest it has just pushed. Every other plan, a pull request's, a destroy's or one made by hand, passes the
# digest the service runs now, so that its diff shows the infrastructure change alone and no change of image. This
# script reads that digest, and changes nothing.
#
# What it does, in this order:
#   1. Reads the task definition the service names, with `aws ecs describe-services`, and prints
#      `running_task_definition=<arn>`.
#   2. Reads the image of that definition's first container, with `aws ecs describe-task-definition` and a `--query`
#      that selects the image field alone. No other field of the definition is read, so the task's environment never
#      leaves the CLI call.
#   3. When the image ends in `@sha256:<digest>`, prints `running_image_reference=digest` and takes that digest. A
#      service whose definition was registered before the switch to digests names `<host>/<repository>:<tag>`: then it
#      prints `running_image_reference=tag` and reads the tag's digest from the registry with
#      `aws ecr describe-images`.
#   4. Checks the digest's form, `sha256:` and 64 lower-case hexadecimal characters, and prints
#      `running_image_digest=<digest>`.
#   A step that fails prints one `failed=<step>` line, the step being describe-services, describe-task-definition,
#   image-form, describe-images or digest-form, and exits 1. A service that does not exist, or names no task
#   definition, fails at describe-services; a tag the registry does not hold fails at describe-images.
#
# Usage (from a shell signed in to the account, with the AWS CLI on the PATH):
#   infra/scripts/running-image-digest.sh --cluster <name> --service <name>
#
#   --cluster <name>  REQUIRED. The ECS cluster, the staging AWS root's output cluster_name.
#   --service <name>  REQUIRED. The ECS service, the staging AWS root's output service_name.
#   -h, --help        Print this header and exit 0.
#
# For a caller: read the status directly, never through a pipe. Status 0 prints three lines,
# `running_task_definition=`, `running_image_reference=digest|tag` and `running_image_digest=`. Status 1 prints the
# lines of the steps that passed and one `failed=` line. Progress and the error code of a failed AWS call go to
# standard error; the error's message does not, because it can name the caller's session.
#
# Environment: AWS_REGION (default eu-north-1) is the region of the service and of the registry.
#
# Exit codes:
#   0:  the digest was read and printed
#   1:  a step failed
#   2:  usage error
#   130:  interrupted (SIGINT/SIGTERM/SIGHUP)
#
# `set -x` must not be added.

set -euo pipefail
set -f

export AWS_PAGER=""
export LC_ALL=C

REGION="${AWS_REGION:-eu-north-1}"
export AWS_REGION="$REGION"

SCRIPT_PATH="${BASH_SOURCE[0]}"

CLUSTER=""
SERVICE=""
WORK=""

usage_line() {
  echo "usage: running-image-digest.sh --cluster <name> --service <name> | -h | --help" >&2
}

print_header() {
  awk 'NR == 1 { next } /^#/ { sub(/^# ?/, ""); print; next } { exit }' "$SCRIPT_PATH"
}

usage_error() {
  echo "running-image-digest.sh: $1" >&2
  usage_line
  exit 2
}

note() {
  echo "running-image-digest.sh: $1" >&2
}

fail_step() {
  echo "failed=$1"
  [ -z "${2:-}" ] || note "$2"
  exit 1
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

on_exit() {
  [ -z "$WORK" ] || rm -rf "$WORK"
}

read_digest() {
  local arn image rest repository tag digest rc

  rc=0
  arn="$(aws ecs describe-services --region "$REGION" --cluster "$CLUSTER" --services "$SERVICE" \
    --query 'services[0].taskDefinition' --output text 2> "$WORK/services.err")" || rc=$?
  [ "$rc" -eq 0 ] || fail_step describe-services "the service could not be read ($(error_code "$WORK/services.err"))"
  case "$arn" in
    "" | None) fail_step describe-services "the service $SERVICE in $CLUSTER names no task definition" ;;
  esac
  echo "running_task_definition=$arn"

  rc=0
  image="$(aws ecs describe-task-definition --region "$REGION" --task-definition "$arn" \
    --query 'taskDefinition.containerDefinitions[0].image' --output text 2> "$WORK/definition.err")" || rc=$?
  [ "$rc" -eq 0 ] || fail_step describe-task-definition \
    "the task definition could not be read ($(error_code "$WORK/definition.err"))"
  case "$image" in
    "" | None) fail_step describe-task-definition "the task definition names no image" ;;
  esac

  case "$image" in
    *@*)
      echo "running_image_reference=digest"
      digest="${image##*@}"
      ;;
    */*:*)
      rest="${image#*/}"
      repository="${rest%:*}"
      tag="${rest##*:}"
      case "$repository" in
        "" | *@* | *:*) fail_step image-form "the image names no repository and tag" ;;
      esac
      [ -n "$tag" ] || fail_step image-form "the image names no tag"
      echo "running_image_reference=tag"
      note "the image is named by its tag; reading the tag's digest from the registry"
      rc=0
      digest="$(aws ecr describe-images --region "$REGION" --repository-name "$repository" \
        --image-ids "imageTag=$tag" --query 'imageDetails[0].imageDigest' --output text \
        2> "$WORK/images.err")" || rc=$?
      [ "$rc" -eq 0 ] || fail_step describe-images \
        "the registry could not be read ($(error_code "$WORK/images.err"))"
      case "$digest" in
        "" | None) fail_step describe-images "the registry does not hold the tag" ;;
      esac
      ;;
    *)
      fail_step image-form "the image names neither a digest nor a tag"
      ;;
  esac

  is_digest "$digest" || fail_step digest-form "the digest is not sha256: and 64 lower-case hexadecimal characters"
  echo "running_image_digest=$digest"
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
      --cluster)
        [ "$#" -ge 2 ] || usage_error "--cluster requires a value"
        CLUSTER="$2"
        shift 2
        ;;
      --service)
        [ "$#" -ge 2 ] || usage_error "--service requires a value"
        SERVICE="$2"
        shift 2
        ;;
      *)
        usage_error "unknown argument: $1"
        ;;
    esac
  done
  [ -n "$CLUSTER" ] || usage_error "--cluster is required"
  [ -n "$SERVICE" ] || usage_error "--service is required"

  WORK="$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-running-digest.XXXXXX")"
  trap on_exit EXIT
  trap 'exit 130' INT TERM HUP
  read_digest
  exit 0
}

main "$@"
