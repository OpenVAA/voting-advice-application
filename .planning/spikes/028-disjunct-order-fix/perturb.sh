#!/usr/bin/env bash
# Criterion 4: 162-17's eight-assembly guard must still go RED on its two perturbations with each reorder applied.
#   G8A: drop project_open_for_voters from ONE policy (anon_select_factions)
#   G8B: drop `confirmed` from ALL FOUR authenticated entity assemblies at once
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$HERE/../../.."
PG="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
cd "$ROOT"
G8A="DO \$\$ DECLARE q text; BEGIN SELECT qual INTO q FROM pg_policies WHERE policyname = 'anon_select_factions';
  q := replace(q, '( SELECT project_open_for_voters(factions.project_id) AS project_open_for_voters) AND ', '');
  EXECUTE format('ALTER POLICY anon_select_factions ON public.factions USING (%s)', q); END \$\$;"
G8B="DO \$\$ DECLARE r record; q text; BEGIN FOR r IN SELECT tablename, policyname, qual FROM pg_policies WHERE schemaname = 'public'
  AND policyname LIKE 'authenticated_select_%' AND tablename IN ('candidates','organizations','factions','alliances') LOOP
  q := replace(r.qual, ' AND confirmed AND ', ' AND ');
  IF q = r.qual THEN RAISE EXCEPTION 'confirmed not found in %', r.policyname; END IF;
  EXECUTE format('ALTER POLICY %I ON public.%I USING (%s)', r.policyname, r.tablename, q); END LOOP; END \$\$;"
for v in A_public_first B_project_public_entity; do
  for p in G8A G8B; do
    echo "=== $v + $p"
    yarn db:reset > /dev/null 2>&1
    psql "$PG" -X -q -At -v ON_ERROR_STOP=1 -v variant="$v" -f "$HERE/apply-reorder.sql" 2>&1 | grep -v NOTICE
    if [ $p = G8A ]; then psql "$PG" -X -q -v ON_ERROR_STOP=1 -c "$G8A"; else psql "$PG" -X -q -v ON_ERROR_STOP=1 -c "$G8B"; fi
    echo "perturbation applied: exit $?"
    yarn workspace @openvaa/supabase test:db > "$HERE/perturb-$v-$p.log" 2>&1; echo "test:db exit $?"
    grep -E '^Files=|^Result' "$HERE/perturb-$v-$p.log"
    grep -E '^(not ok|#\s+Failed test)' "$HERE/perturb-$v-$p.log" | head -8
    grep -B1 -E 'Failed tests?:' "$HERE/perturb-$v-$p.log" | grep -v '^--' | head -8
  done
done
yarn db:reset > /dev/null 2>&1; echo "final db:reset exit $?"
