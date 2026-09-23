#!/usr/bin/env bash
# Spike 028: move the public-visibility disjunct FIRST in the five authenticated_select_* policies
# (candidates, organizations, factions, alliances, nominations). Same boolean, different evaluation order:
# PostgreSQL evaluates an OR's arguments left to right and stops at the first TRUE, so a publicly
# visible row would no longer pay the three SECURITY DEFINER user_can calls.
# One transaction: grid + scale fixtures -> BEFORE (fingerprint, visible sets, truth grid, timings)
# -> ALTER POLICY x5 -> AFTER (same) -> EXCEPT ALL both directions -> ROLLBACK. Nothing persists.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
PG="${PG:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
RUNS="${1:-3}"
VARIANT="${VARIANT:-A_public_first}"   # A_public_first | B_project_public_entity
S026="$HERE/../026-election-scale-entity-read"
readers() { # name role claims-sql
cat <<'R'
anon|anon|'{"role":"anon"}'
auth_nogrant|authenticated|'{"role":"authenticated","sub":"11111111-1111-1111-1111-111111111111","grants":[]}'
cand_grid|authenticated|json_build_object('role','authenticated','sub','22222222-2222-2222-2222-222222222222','grants',json_build_array(json_build_object('scope','entity','role','editor','target_type','candidate','target_id',:'chaincand')))::text
org_grid|authenticated|json_build_object('role','authenticated','sub','44444444-4444-4444-4444-444444444444','grants',json_build_array(json_build_object('scope','entity','role','editor','target_type','organization','target_id',:'carrierorg')))::text
admin_grid|authenticated|json_build_object('role','authenticated','sub','33333333-3333-3333-3333-333333333333','grants',json_build_array(json_build_object('scope','project','role','admin','target_id',:'g2')))::text
R
}
timing_readers() {
cat <<'R'
auth_nogrant|authenticated|'{"role":"authenticated","sub":"11111111-1111-1111-1111-111111111111","grants":[]}'
candidate|authenticated|json_build_object('role','authenticated','sub','22222222-2222-2222-2222-222222222222','grants',json_build_array(json_build_object('scope','entity','role','editor','target_type','candidate','target_id',:'mycand')))::text
admin|authenticated|json_build_object('role','authenticated','sub','33333333-3333-3333-3333-333333333333','grants',json_build_array(json_build_object('scope','project','role','admin','target_id',:'m')))::text
R
}
capture() { # phase
  local phase=$1
  cat <<SQL
\\echo @@FP $phase
SELECT md5(string_agg(policyname || ':' || qual, '|' ORDER BY policyname)) FROM pg_policies
 WHERE schemaname = 'public' AND cmd = 'SELECT' AND tablename IN ('candidates','organizations','factions','alliances','nominations');
SQL
  while IFS='|' read -r name role claims; do
    cat <<SQL
SELECT set_config('request.jwt.claims', $claims, true) \\gset x_
SET LOCAL ROLE $role;
INSERT INTO vis SELECT '$phase', '$name', 'candidates', id FROM public.candidates WHERE project_id IN (:'g1', :'g2');
INSERT INTO vis SELECT '$phase', '$name', 'organizations', id FROM public.organizations WHERE project_id IN (:'g1', :'g2');
INSERT INTO vis SELECT '$phase', '$name', 'factions', id FROM public.factions WHERE project_id IN (:'g1', :'g2');
INSERT INTO vis SELECT '$phase', '$name', 'alliances', id FROM public.alliances WHERE project_id IN (:'g1', :'g2');
INSERT INTO vis SELECT '$phase', '$name', 'nominations', id FROM public.nominations WHERE project_id IN (:'g1', :'g2');
INSERT INTO truth SELECT '$phase', '$name', pr.id, t.tbl,
  CASE t.tbl WHEN 'candidates' THEN EXISTS (SELECT 1 FROM public.candidates x WHERE x.id = pr.id)
             WHEN 'organizations' THEN EXISTS (SELECT 1 FROM public.organizations x WHERE x.id = pr.id)
             WHEN 'factions' THEN EXISTS (SELECT 1 FROM public.factions x WHERE x.id = pr.id)
             ELSE EXISTS (SELECT 1 FROM public.alliances x WHERE x.id = pr.id) END
FROM probes pr, (VALUES ('candidates'),('organizations'),('factions'),('alliances')) t(tbl);
RESET ROLE;
SQL
  done < <(readers)
}
timings() { # phase
  local phase=$1
  while IFS='|' read -r name role claims; do
    printf "SELECT set_config('request.jwt.claims', %s, true) \\\\gset x_\nSET LOCAL ROLE %s;\n" "$claims" "$role"
    for q in Q1 Q2 Q3; do
      case $q in
        Q1) body="SELECT * FROM public.get_nominations(:'m', :'me', :'mc1')";;
        Q2) body="SELECT * FROM public.get_nominations(:'m', NULL, NULL)";;
        Q3) body="SELECT * FROM public.candidates WHERE project_id = :'m' ORDER BY sort_order";;
      esac
      w="SELECT coalesce(json_agg(_t), '[]') FROM ($body) _t"
      printf "\\\\echo @@ROWS %s %s %s\nSELECT json_array_length(coalesce(json_agg(_t), '[]')) FROM (%s) _t;\n" "$phase" "$name" "$q" "$body"
      for i in $(seq 1 "$RUNS"); do printf "\\\\echo @@T %s %s %s\nEXPLAIN (ANALYZE, TIMING OFF, COSTS OFF, SUMMARY) %s;\n" "$phase" "$name" "$q" "$w"; done
    done
    printf 'RESET ROLE;\n'
  done < <(timing_readers)
}
sql() {
  printf '%s\n' 'BEGIN;'
  cat "$HERE/grid.sql" "$S026/fixture.sql"
  cat <<'SQL'
SELECT (SELECT id FROM g_proj WHERE tag = 'G1') AS g1, (SELECT id FROM g_proj WHERE tag = 'G2') AS g2 \gset
SELECT cand AS chaincand FROM g_chain WHERE tag = 'G1' \gset
SELECT org AS carrierorg FROM g_carrier WHERE proj = 'G1' \gset
SELECT p.id AS m, p.election AS me FROM spk_proj p WHERE tag = 'M' \gset
SELECT c.id AS mc1 FROM spk_const c WHERE proj = 'M' AND idx = 1 \gset
SELECT ca.id AS mycand FROM spk_cand ca WHERE proj = 'M' AND const_idx = 1 AND k = 7 \gset
CREATE TEMP TABLE vis (phase text, reader text, tbl text, id uuid) ON COMMIT DROP;
CREATE TEMP TABLE truth (phase text, reader text, probe uuid, tbl text, visible boolean) ON COMMIT DROP;
CREATE TEMP TABLE probes ON COMMIT DROP AS
  SELECT id FROM g_ent UNION ALL SELECT gen_random_uuid() UNION ALL SELECT NULL::uuid;
GRANT ALL ON vis, truth, probes TO anon, authenticated;
\echo @@CENSUS
SELECT (SELECT count(*) FROM probes) || ' probe ids (' || (SELECT count(*) FROM g_ent) || ' grid entities + 1 absent + 1 NULL); '
    || (SELECT count(*) FROM public.nominations WHERE project_id IN (:'g1', :'g2')) || ' grid nominations';
SQL
  capture before
  timings before
  cat <<'SQL'
\echo @@REORDER
SELECT set_config('spike.variant', :'variant', true) \gset x_
DO $$
DECLARE r record; inner_q text; pos int; p1 int; newq text;
BEGIN
  FOR r IN SELECT tablename, policyname, qual FROM pg_policies
           WHERE schemaname = 'public' AND cmd = 'SELECT' AND policyname LIKE 'authenticated_select_%'
             AND tablename IN ('candidates','organizations','factions','alliances','nominations')
  LOOP
    inner_q := substr(r.qual, 2, length(r.qual) - 2);                       -- strip the outer parentheses
    pos := position(' OR (( SELECT project_open_for_voters' IN inner_q);  -- start of the public disjunct
    IF pos = 0 THEN RAISE EXCEPTION 'public disjunct not found in %', r.policyname; END IF;
    IF position(' OR ' IN substr(inner_q, pos + 4)) > 0 AND substr(inner_q, pos + 4) !~ '^\(\(.*\)\)$' THEN
      RAISE EXCEPTION 'public disjunct of % is not the last top-level disjunct', r.policyname;
    END IF;
    IF current_setting('spike.variant') = 'A_public_first' THEN
      newq := substr(inner_q, pos + 4) || ' OR ' || substr(inner_q, 1, pos - 1);
    ELSE  -- B_project_public_entity: keep the project-authority disjunct first (admins exit on it), then public, then the entity disjuncts
      p1 := position(' OR ( SELECT user_can(' IN inner_q);
      IF p1 = 0 OR p1 >= pos OR substr(inner_q, 1, p1 - 1) NOT LIKE '%user_can(''project''::grant_scope_type%' THEN
        RAISE EXCEPTION 'first disjunct of % is not the project-authority user_can', r.policyname;
      END IF;
      newq := substr(inner_q, 1, p1 - 1) || ' OR ' || substr(inner_q, pos + 4) || ' OR ' || substr(inner_q, p1 + 4, pos - p1 - 4);
    END IF;
    EXECUTE format('ALTER POLICY %I ON public.%I USING (%s)', r.policyname, r.tablename, newq);
    RAISE NOTICE 'reordered %', r.policyname;
  END LOOP;
END $$;
SELECT policyname || E'\n   ' || qual FROM pg_policies WHERE schemaname = 'public' AND policyname IN ('authenticated_select_candidates','authenticated_select_nominations');
SQL
  capture after
  timings after
  cat <<'SQL'
\echo @@VERDICT
SELECT 'census visible rows (before / after), per reader: ' || string_agg(reader || ' ' || b || '/' || a, ', ' ORDER BY reader)
FROM (SELECT reader, count(*) FILTER (WHERE phase = 'before') b, count(*) FILTER (WHERE phase = 'after') a FROM vis GROUP BY reader) s;
SELECT 'visible: before EXCEPT ALL after = ' || count(*) FROM (SELECT reader, tbl, id FROM vis WHERE phase = 'before' EXCEPT ALL SELECT reader, tbl, id FROM vis WHERE phase = 'after') x;
SELECT 'visible: after EXCEPT ALL before = ' || count(*) FROM (SELECT reader, tbl, id FROM vis WHERE phase = 'after' EXCEPT ALL SELECT reader, tbl, id FROM vis WHERE phase = 'before') x;
SELECT 'truth grid: ' || count(*) FILTER (WHERE phase = 'before') || ' probes per phase, ' || count(*) FILTER (WHERE phase = 'before' AND visible) || ' true / ' || count(*) FILTER (WHERE phase = 'before' AND NOT visible) || ' false' FROM truth;
SELECT 'truth: before EXCEPT ALL after = ' || count(*) FROM (SELECT reader, probe, tbl, visible FROM truth WHERE phase = 'before' EXCEPT ALL SELECT reader, probe, tbl, visible FROM truth WHERE phase = 'after') x;
SELECT 'truth: after EXCEPT ALL before = ' || count(*) FROM (SELECT reader, probe, tbl, visible FROM truth WHERE phase = 'after' EXCEPT ALL SELECT reader, probe, tbl, visible FROM truth WHERE phase = 'before') x;
SELECT 'per-reader visible counts before: ' || string_agg(reader || ':' || tbl || '=' || n, ' ' ORDER BY reader, tbl) FROM (SELECT reader, tbl, count(*) n FROM vis WHERE phase = 'before' GROUP BY 1, 2) s;
ROLLBACK;
SQL
}
export LC_NUMERIC=C
echo "# variant: $VARIANT"
sql | psql "$PG" -X -q -At -v ON_ERROR_STOP=1 -v variant="$VARIANT" 2>&1 | awk '
  /^@@FP/ {fp=$2; getline; print "# fingerprint (" fp ") entity+nomination SELECT quals: " $0; next}
  /^@@CENSUS/ {getline; print "# " $0; next}
  /^@@REORDER/ {sec="reorder"; next}
  /^@@VERDICT/ {sec="verdict"; next}
  /^@@ROWS/ {rk=$2" "$3" "$4; getline; rows[rk]=$0; next}
  /^@@T/ {k=$2" "$3" "$4; next}
  /^Execution Time/ && k!="" {tv=$3+0; t[k]=t[k]" "tv; k=""; next}
  /ERROR/ {print; err=1}
  sec=="reorder" && (/^NOTICE/ || /^authenticated_select|^   \(/) {print "# " $0}
  sec=="verdict" {print}
  END {
    printf "\nreader        q    rows   before_med_ms  after_med_ms  speedup\n"
    split("auth_nogrant candidate admin",R," "); split("Q1 Q2 Q3",Q," ")
    for(qi=1;qi<=3;qi++) for(ri=1;ri<=3;ri++){
      for(ph=1;ph<=2;ph++){ P=(ph==1)?"before":"after"; c=split(t[P" "R[ri]" "Q[qi]],v," ");
        for(a=1;a<=c;a++)for(b=a+1;b<=c;b++)if(v[b]+0<v[a]+0){x=v[a];v[a]=v[b];v[b]=x}
        med[ph]=(c%2)?v[(c+1)/2]:(v[c/2]+v[c/2+1])/2 }
      printf "%-13s %-3s %6s %14.1f %13.1f %7.2fx\n",R[ri],Q[qi],rows["before "R[ri]" "Q[qi]],med[1],med[2],(med[2]>0?med[1]/med[2]:0) }
    exit err
  }'
