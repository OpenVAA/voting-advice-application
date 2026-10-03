#!/usr/bin/env bash
#
# ci-write-local-keys.sh -- Write the running local Supabase stack's anon and service-role keys
#                           into the repo-root .env and export them to later CI steps.
#
# Usage (GitHub Actions only, after `supabase start`):
#   tests/scripts/ci-write-local-keys.sh
#
# `.env` is a copy of `.env.example`, whose anon and service-role keys are placeholders. The frontend and the E2E setup need the keys this runner's local stack generated, so they are read off the running instance, written over the placeholder lines and appended to $GITHUB_ENV. Each value is masked before use and never echoed; `set -x` must not be added.
#
# Linux only: it uses GNU `sed -i`, as on the Actions runner.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="$REPO_ROOT/.env"

: "${GITHUB_ENV:?ci-write-local-keys.sh runs only on GitHub Actions, which sets GITHUB_ENV}"

STATUS="$(cd "$REPO_ROOT/apps/supabase" && supabase status -o env)"
ANON_KEY="$(printf '%s\n' "$STATUS" | grep '^ANON_KEY=' | cut -d= -f2- | tr -d '"')"
SERVICE_ROLE_KEY="$(printf '%s\n' "$STATUS" | grep '^SERVICE_ROLE_KEY=' | cut -d= -f2- | tr -d '"')"
test -n "$ANON_KEY" || { echo "::error::ANON_KEY missing from supabase status"; exit 1; }
test -n "$SERVICE_ROLE_KEY" || { echo "::error::SERVICE_ROLE_KEY missing from supabase status"; exit 1; }
echo "::add-mask::$ANON_KEY"
echo "::add-mask::$SERVICE_ROLE_KEY"
sed -i \
  -e "s|^PUBLIC_SUPABASE_ANON_KEY=.*|PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY|" \
  -e "s|^SUPABASE_ANON_KEY=.*|SUPABASE_ANON_KEY=$ANON_KEY|" \
  -e "s|^SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY|" \
  "$ENV_FILE"
test "$(grep -c -E '^(PUBLIC_SUPABASE_ANON_KEY|SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY)=[^<]' "$ENV_FILE")" = "3" || { echo "::error::.env still lacks a local key line for PUBLIC_SUPABASE_ANON_KEY, SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY"; exit 1; }
{
  echo "SUPABASE_ANON_KEY=$ANON_KEY"
  echo "PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY"
  echo "SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY"
} >> "$GITHUB_ENV"
