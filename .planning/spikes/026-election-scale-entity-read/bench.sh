#!/usr/bin/env bash
# Spike 026 driver (SQL half). Measures the FULL, uncapped result - no PostgREST max_rows, no role
# statement_timeout (SET LOCAL ROLE does not apply a role's login config) - i.e. the database work the
# voter app would cost once the 1000-row cap is dealt with. One psql session, one transaction: build fixture -> fingerprint -> time every
# (reader x query) cell with EXPLAIN ANALYZE (server-side execution time, no network) -> ROLLBACK.
# Usage: bench.sh [runs=10]   Output: raw log on stderr-free stdout, parsed table at the end.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
PG="${PG:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
RUNS="${1:-10}"
export QLIST="${QUERIES_OVERRIDE:-Q1 Q2 Q3 Q4 Q5}"
READERS=(anon auth_nogrant candidate admin)
QUERIES=(${QUERIES_OVERRIDE:-Q1 Q2 Q3 Q4 Q5})
sql() {
  printf '%s\n' 'BEGIN;'
  cat "$HERE/fixture.sql"
  cat <<'SQL'
SELECT p.id AS m, p.election AS me FROM spk_proj p WHERE tag = 'M' \gset
SELECT p.id AS r, p.election AS re FROM spk_proj p WHERE tag = 'R' \gset
SELECT c.id AS mc1 FROM spk_const c WHERE proj = 'M' AND idx = 1 \gset
SELECT c.id AS rc1 FROM spk_const c WHERE proj = 'R' AND idx = 1 \gset
SELECT ca.id AS mycand FROM spk_cand ca WHERE proj = 'M' AND const_idx = 1 AND k = 7 \gset
\echo @@FP entity_select_quals
SELECT md5(string_agg(policyname || ':' || qual, '|' ORDER BY policyname)) FROM pg_policies
 WHERE schemaname = 'public' AND cmd = 'SELECT' AND tablename IN ('candidates','organizations','factions','alliances','nominations');
\echo @@FP helper_bodies
SELECT string_agg(proname || '=' || left(md5(prosrc), 8), ' ' ORDER BY proname) FROM pg_proc
 WHERE proname IN ('user_can','project_open_for_voters','entity_has_confirmed_nomination','nomination_entities_confirmed','get_nominations','is_child_nominee');
SQL
  for rd in "${READERS[@]}"; do
    case $rd in
      anon)         role=anon;          claims="'{\"role\":\"anon\"}'";;
      auth_nogrant) role=authenticated; claims="'{\"role\":\"authenticated\",\"sub\":\"11111111-1111-1111-1111-111111111111\",\"grants\":[]}'";;
      candidate)    role=authenticated; claims="json_build_object('role','authenticated','sub','22222222-2222-2222-2222-222222222222','grants',json_build_array(json_build_object('scope','entity','role','editor','target_type','candidate','target_id',:'mycand')))::text";;
      admin)        role=authenticated; claims="json_build_object('role','authenticated','sub','33333333-3333-3333-3333-333333333333','grants',json_build_array(json_build_object('scope','project','role','admin','target_id',:'m')))::text";;
    esac
    printf "SELECT set_config('request.jwt.claims', %s, true) \\\\gset spk_\n" "$claims"
    printf 'SET LOCAL ROLE %s;\n' "$role"
    for q in "${QUERIES[@]}"; do
      case $q in
        Q1) body="SELECT * FROM public.get_nominations(:'m', :'me', :'mc1')";;          # voter, largest municipal constituency
        Q2) body="SELECT * FROM public.get_nominations(:'m', NULL, NULL)";;             # /nominations page, whole municipal project
        Q3) body="SELECT * FROM public.candidates WHERE project_id = :'m' ORDER BY sort_order";;  # getEntityData, whole project
        Q4) body="SELECT * FROM public.get_nominations(:'r', :'re', :'rc1')";;          # voter, largest parliamentary constituency
        Q5) body="SELECT * FROM public.get_nominations(:'r', NULL, NULL)";;             # whole parliamentary project
      esac
      printf '\\echo @@ROWS %s %s\n' "$rd" "$q"
      # PostgREST's own shape (json_agg over a subquery). NOT count(*): a bare count(*) wrapper flips the planner
      # to a nested loop that re-scans organizations per row (measured > 80 s) - an instrument artefact.
      wrapped="SELECT coalesce(json_agg(_t), '[]') FROM ($body) _t"
      printf "SELECT json_array_length(coalesce(json_agg(_t), '[]')) FROM (%s) _t;\n" "$body"
      printf 'EXPLAIN (ANALYZE, TIMING OFF, COSTS OFF, SUMMARY) %s;\n' "$wrapped"   # warm-up, discarded
      for i in $(seq 1 "$RUNS"); do
        printf '\\echo @@T %s %s %s\n' "$rd" "$q" "$i"
        printf 'EXPLAIN (ANALYZE, TIMING OFF, COSTS OFF, SUMMARY) %s;\n' "$wrapped"
      done
    done
    printf 'RESET ROLE;\n'
  done
  printf '%s\n' 'ROLLBACK;'
}
echo "# load average at start: $(sysctl -n vm.loadavg 2>/dev/null || uptime)"
sql | psql "$PG" -X -q -v ON_ERROR_STOP=1 -At 2>&1 | awk '
  /^@@FP/ {fp=$2; next}
  fp!="" {print "# fingerprint " fp ": " $0; fp=""; next}
  /^@@ROWS/ {rk=$2" "$3; getline; rows[rk]=$0; next}
  /^@@T/ {k=$2" "$3; next}
  /^Execution Time/ && k!="" {gsub(/[^0-9.]/,"",$3); t[k]=t[k]" "$3; k=""; next}
  /ERROR/ {print; exit 1}
  END {
    printf "%-13s %-3s %7s %9s %9s %9s\n","reader","q","rows","min_ms","median_ms","max_ms"
    n=split("anon auth_nogrant candidate admin",R," "); m=split(ENVIRON["QLIST"],Q," ")
    for(qi=1;qi<=m;qi++) for(ri=1;ri<=n;ri++){ key=R[ri]" "Q[qi]; c=split(t[key],v," ");
      for(a=1;a<=c;a++)for(b=a+1;b<=c;b++)if(v[b]+0<v[a]+0){x=v[a];v[a]=v[b];v[b]=x}
      med=(c%2)?v[(c+1)/2]:(v[c/2]+v[c/2+1])/2
      printf "%-13s %-3s %7s %9.1f %9.1f %9.1f\n",R[ri],Q[qi],rows[key],v[1],med,v[c] }
  }'
echo "# load average at end: $(sysctl -n vm.loadavg 2>/dev/null || uptime)"
