#!/usr/bin/env bash
#
# terraform-checks.sh -- The Terraform checks of CI that need no credential: validate every root, test every module, plan the example roots and the bootstrap root against mock providers.
#
# The `infra-validate` job of `main.yaml` runs these checks, and this script holds the one list of the roots they must reach. Each check loops over a glob and then fails when a root it requires is not among those the loop reached, so an empty or short glob fails instead of passing on nothing.
#
# The checks, one per call:
#   validate       `init -backend=false -lockfile=readonly` and `validate` of infra/bootstrap and of every infra/envs/<env>/<root>. Requires every root of REQUIRED_ROOTS.
#   test-modules   `init -backend=false` and `terraform test` of every infra/modules/<module> that has a tests directory; the init of a module in LOCKED_MODULES reads its lock file read-only. Requires at least one module.
#   plan-examples  `init -backend=false -lockfile=readonly` and `terraform test -verbose` of every infra/envs/example/<root> that has a tests directory. Each of those test files plans its root against mock providers. Requires every example root of REQUIRED_ROOTS.
#   test-bootstrap  `init -backend=false -lockfile=readonly` and `terraform test -verbose` of infra/bootstrap, whose tests plan the root against a mock provider. Requires infra/bootstrap/tests.
#
# It runs from the repository root whatever the working directory. `init -backend=false` reads no state and none of the commands it runs calls a cloud API.
#
# Usage:
#   infra/scripts/terraform-checks.sh validate | test-modules | plan-examples | test-bootstrap | -h | --help
#
# Exit codes:
#   0:      every check passed
#   1:      a required root or module was not reached
#   2:      usage error
#   other:  the status of the Terraform command that failed

set -euo pipefail
shopt -s nullglob

SCRIPT_PATH="${BASH_SOURCE[0]}"
SCRIPT_NAME="terraform-checks.sh"
USAGE_LINE="validate | test-modules | plan-examples | test-bootstrap | -h | --help"
# shellcheck source=../../scripts/lib/cli.sh
. "$(dirname "$SCRIPT_PATH")/../../scripts/lib/cli.sh"

# The roots `validate` must reach. The ones under infra/envs/example/ are also the roots `plan-examples` must reach.
REQUIRED_ROOTS=(
  infra/bootstrap
  infra/envs/staging/dns-mail
  infra/envs/staging/supabase
  infra/envs/staging/aws
  infra/envs/example/dns-mail
  infra/envs/example/supabase
  infra/envs/example/aws
)

# The modules whose lock file is tracked, so their init must not change it.
LOCKED_MODULES=(
  infra/modules/supabase
)

# Fails naming the first of the required paths, $3 onwards, that is not in REACHED. $1 names what was reached, $2 says why a path may be missing.
require_reached() {
  local what="$1" why="$2" required root found
  shift 2
  for required in "$@"; do
    found=0
    for root in ${REACHED[@]+"${REACHED[@]}"}; do
      if [ "$root" = "$required" ]; then found=1; fi
    done
    if [ "$found" -ne 1 ]; then
      echo "::error::$required was not among the $what (${REACHED[*]-}). $why"
      exit 1
    fi
  done
}

is_locked_module() {
  local locked
  for locked in "${LOCKED_MODULES[@]}"; do
    if [ "$locked" = "$1" ]; then return 0; fi
  done
  return 1
}

validate() {
  local root
  REACHED=()
  for root in infra/bootstrap infra/envs/*/*/; do
    root="${root%/}"
    echo "::group::$root"
    terraform -chdir="$root" init -backend=false -input=false -lockfile=readonly
    terraform -chdir="$root" validate -no-color
    echo "::endgroup::"
    REACHED+=("$root")
  done
  require_reached "roots validated" "A required root is missing or the glob no longer reaches it." "${REQUIRED_ROOTS[@]}"
  echo "validated ${#REACHED[@]} roots: ${REACHED[*]}"
}

test_modules() {
  local tests module
  local -a init_flags
  REACHED=()
  for tests in infra/modules/*/tests/; do
    module="${tests%/tests/}"
    init_flags=(-backend=false -input=false)
    if is_locked_module "$module"; then init_flags+=(-lockfile=readonly); fi
    echo "::group::$module"
    terraform -chdir="$module" init "${init_flags[@]}"
    terraform -chdir="$module" test -no-color
    echo "::endgroup::"
    REACHED+=("$module")
  done
  if [ "${#REACHED[@]}" -eq 0 ]; then
    echo "::error::No module under infra/modules has a tests directory, so no module test ran."
    exit 1
  fi
  echo "tested ${#REACHED[@]} modules: ${REACHED[*]}"
}

plan_examples() {
  local tests root
  local -a required=()
  for root in "${REQUIRED_ROOTS[@]}"; do
    if [[ "$root" == infra/envs/example/* ]]; then required+=("$root"); fi
  done
  REACHED=()
  for tests in infra/envs/example/*/tests/; do
    root="${tests%/tests/}"
    echo "::group::$root"
    terraform -chdir="$root" init -backend=false -input=false -lockfile=readonly
    terraform -chdir="$root" test -verbose -no-color
    echo "::endgroup::"
    REACHED+=("$root")
  done
  require_reached "example roots planned" "Its tests directory is missing or the glob no longer reaches it." "${required[@]}"
  echo "planned ${#REACHED[@]} example roots: ${REACHED[*]}"
}

# The path names no glob character, so nullglob cannot drop it: the loop skips a root whose tests directory is missing, and require_reached then fails.
test_bootstrap() {
  local root
  REACHED=()
  for root in infra/bootstrap; do
    if [ ! -d "$root/tests" ]; then continue; fi
    echo "::group::$root"
    terraform -chdir="$root" init -backend=false -input=false -lockfile=readonly
    terraform -chdir="$root" test -verbose -no-color
    echo "::endgroup::"
    REACHED+=("$root")
  done
  require_reached "bootstrap roots tested" "Its tests directory is missing." infra/bootstrap
  echo "tested ${#REACHED[@]} bootstrap roots: ${REACHED[*]}"
}

if [ "$#" -ne 1 ]; then usage_error "expected exactly one check"; fi

case "$1" in
  -h | --help)
    print_header
    exit 0
    ;;
  validate | test-modules | plan-examples | test-bootstrap) ;;
  *) usage_error "unknown check: $1" ;;
esac

cd "$(dirname "$SCRIPT_PATH")/../.."

case "$1" in
  validate) validate ;;
  test-modules) test_modules ;;
  plan-examples) plan_examples ;;
  test-bootstrap) test_bootstrap ;;
esac
