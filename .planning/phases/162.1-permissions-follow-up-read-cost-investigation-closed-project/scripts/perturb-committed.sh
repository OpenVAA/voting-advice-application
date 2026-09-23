#!/usr/bin/env bash
# Phase 162.1 plan 01 (D-02): replay 162-17's two guard perturbations, G8A and G8B, on the COMMITTED schema.
#
# The committed schema already carries the variant-B disjunct order, so this is spike 028's perturb.sh with the
# reorder step removed: that script calls apply-reorder.sql first, which raises on B-ordered quals, and because it
# has no `set -e` it would carry on and perturb anyway. This copy applies ONLY the perturbation, verbatim from the
# spike, and is self-checking: it exits 0 only when each perturbation reddens exactly its recorded assertions and
# nothing else (including nothing in 29-authenticated-disjunct-order.test.sql), and the database is left reset.
#
#   G8A: drop project_open_for_voters from ONE policy (anon_select_factions)
#        expected red: 16-anon-visibility #32, #47 and 25-matrix-conformance #34, #38
#   G8B: drop `confirmed` from ALL FOUR authenticated entity assemblies at once
#        expected red: 25-matrix-conformance #36, #37
#
# Usage: bash .planning/phases/162.1-permissions-follow-up-read-cost-investigation-closed-project/scripts/perturb-committed.sh
# Logs:  evidence/162.1-01/perturb-G8A.txt and perturb-G8B.txt (".txt", not ".log": the repo .gitignore excludes *.log).
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../../../.." && pwd)"
EVIDENCE="$HERE/../evidence/162.1-01"
PG="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
FINGERPRINT_SQL="SELECT md5(string_agg(policyname || ':' || qual, '|' ORDER BY policyname)) FROM pg_policies WHERE schemaname = 'public' AND cmd = 'SELECT' AND tablename IN ('candidates','organizations','factions','alliances','nominations');"
EXPECTED_FINGERPRINT="b096e3bbcc51a0f572477e2b68bd3461"
cd "$ROOT" || exit 1
mkdir -p "$EVIDENCE"

G8A="DO \$\$ DECLARE q text; BEGIN SELECT qual INTO q FROM pg_policies WHERE policyname = 'anon_select_factions';
  q := replace(q, '( SELECT project_open_for_voters(factions.project_id) AS project_open_for_voters) AND ', '');
  EXECUTE format('ALTER POLICY anon_select_factions ON public.factions USING (%s)', q); END \$\$;"
G8B="DO \$\$ DECLARE r record; q text; BEGIN FOR r IN SELECT tablename, policyname, qual FROM pg_policies WHERE schemaname = 'public'
  AND policyname LIKE 'authenticated_select_%' AND tablename IN ('candidates','organizations','factions','alliances') LOOP
  q := replace(r.qual, ' AND confirmed AND ', ' AND ');
  IF q = r.qual THEN RAISE EXCEPTION 'confirmed not found in %', r.policyname; END IF;
  EXECUTE format('ALTER POLICY %I ON public.%I USING (%s)', r.policyname, r.tablename, q); END LOOP; END \$\$;"

EXPECTED_G8A="16-anon-visibility:32,47;25-matrix-conformance:34,38"
EXPECTED_G8B="25-matrix-conformance:36,37"

# Normalise a pg_prove "Test Summary Report" into `<file-stem>:<n,n,...>;...`, files sorted, ranges expanded.
# A file listed in the report without a `Failed tests:` line (a plan or parse failure) is recorded as `<stem>:?`,
# which can never equal an expected string.
normalise() {
  awk '
    /^Test Summary Report/ { in_report = 1; next }
    !in_report { next }
    /\.test\.sql[[:space:]]+\(Wstat:/ {
      path = $1; n = split(path, parts, "/"); stem = parts[n]; sub(/\.test\.sql$/, "", stem)
      current = stem; if (!(stem in list)) { list[stem] = "?"; order[++count] = stem }
      next
    }
    /^[[:space:]]+Failed tests?:/ && current != "" {
      line = $0; sub(/^[[:space:]]+Failed tests?:[[:space:]]*/, "", line); gsub(/[[:space:]]/, "", line)
      m = split(line, items, ","); out = ""
      for (i = 1; i <= m; i++) {
        if (items[i] ~ /-/) { split(items[i], r, "-"); for (k = r[1] + 0; k <= r[2] + 0; k++) out = out (out == "" ? "" : ",") k }
        else if (items[i] != "") out = out (out == "" ? "" : ",") items[i]
      }
      list[current] = (list[current] == "?" ? "" : list[current] ",") out
      next
    }
    END { for (i = 1; i <= count; i++) print order[i] ":" list[order[i]] }
  ' "$1" | sort | paste -sd ';' -
}

ok=1
for case_name in G8A G8B; do
  echo "=== $case_name"
  if ! yarn db:reset > /dev/null 2>&1; then echo "$case_name db:reset FAILED"; ok=0; continue; fi
  if [ "$case_name" = G8A ]; then perturbation="$G8A"; expected="$EXPECTED_G8A"; else perturbation="$G8B"; expected="$EXPECTED_G8B"; fi
  if ! psql "$PG" -X -q -v ON_ERROR_STOP=1 -c "$perturbation"; then echo "$case_name perturbation FAILED to apply"; ok=0; continue; fi
  echo "perturbation applied"
  log="$EVIDENCE/perturb-$case_name.txt"
  yarn workspace @openvaa/supabase test:db > "$log" 2>&1
  test_exit=$?
  echo "test:db exit $test_exit"
  grep -E '^Files=|^Result' "$log"
  if [ "$test_exit" -eq 0 ]; then echo "$case_name test:db exited 0 -- the guard did not redden"; ok=0; fi
  observed="$(normalise "$log")"
  if [ "$observed" = "$expected" ]; then verdict=MATCH; else verdict=MISMATCH; ok=0; fi
  echo "$case_name observed=$observed expected=$expected $verdict"
done

echo "=== final reset"
if ! yarn db:reset > /dev/null 2>&1; then echo "final db:reset FAILED"; ok=0; fi
final_fingerprint="$(psql "$PG" -X -At -c "$FINGERPRINT_SQL")"
echo "final fingerprint: $final_fingerprint"
[ "$final_fingerprint" = "$EXPECTED_FINGERPRINT" ] || ok=0

if [ "$ok" -eq 1 ]; then echo "RESULT: PASS"; exit 0; fi
echo "RESULT: FAIL"
exit 1
