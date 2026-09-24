#!/usr/bin/env bash
# Run the full pgTAP estate against: the shipped schema, variant A, variant B. db:reset between each.
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$HERE/../../.."
PG="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
cd "$ROOT"
for v in shipped A_public_first B_project_public_entity; do
  echo "=== $v"
  yarn db:reset > /dev/null 2>&1; echo "db:reset exit $?"
  if [ "$v" != shipped ]; then psql "$PG" -X -q -At -v ON_ERROR_STOP=1 -v variant="$v" -f "$HERE/apply-reorder.sql" 2>&1 | grep -v NOTICE; fi
  yarn workspace @openvaa/supabase test:db > "$HERE/estate-$v.log" 2>&1; ec=$?
  echo "test:db exit $ec"; grep -E '^Files=|^Result|Failed test|not ok' "$HERE/estate-$v.log" | head -20
done
yarn db:reset > /dev/null 2>&1; echo "final db:reset exit $?"
