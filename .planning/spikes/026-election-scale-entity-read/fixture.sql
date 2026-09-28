-- Spike 026 fixture. Runs INSIDE the caller's transaction; the driver rolls it back.
-- Three projects, shaped from real Finnish elections (Statistics Finland):
--   M  municipal   : 36,056 candidates (2021 = 35,627; 2025 = 29,950), 293 constituencies,
--                    largest constituency 1,500 (Helsinki-sized), second 800, the rest 116 each
--   R  parliamentary: 2,424 candidates (2023 exact), 13 constituencies, largest 430 (Uusimaa-sized)
--   N  noise tenant: 10,000 candidates in one constituency - another project's rows in the same tables
-- Every project has 10 parties; each constituency carries one confirmed party nomination per party and
-- every candidate nomination hangs under its party's nomination (parent_nomination_id), as real data does.
-- All candidates confirmed with accepted terms of use, all nominations confirmed.
SET LOCAL session_replication_role = replica;  -- skip per-row validation triggers while bulk loading (constraints still apply)

CREATE TEMP TABLE spk_proj (tag text PRIMARY KEY, id uuid, election uuid, n_const int) ON COMMIT DROP;
INSERT INTO spk_proj VALUES ('M', gen_random_uuid(), gen_random_uuid(), 293),
                            ('R', gen_random_uuid(), gen_random_uuid(), 13),
                            ('N', gen_random_uuid(), gen_random_uuid(), 1);

INSERT INTO public.projects (id, account_id, name, open_for_voters)
SELECT p.id, (SELECT account_id FROM public.projects WHERE id = '00000000-0000-0000-0000-000000000001'), 'spike026-' || p.tag, true
FROM spk_proj p;
INSERT INTO public.elections (id, project_id) SELECT election, id FROM spk_proj;

CREATE TEMP TABLE spk_const (proj text, idx int, id uuid, size int) ON COMMIT DROP;
INSERT INTO spk_const
SELECT p.tag, g, gen_random_uuid(),
  CASE p.tag
    WHEN 'M' THEN CASE g WHEN 1 THEN 1500 WHEN 2 THEN 800 ELSE 116 END
    WHEN 'R' THEN CASE g WHEN 1 THEN 430 ELSE 166 END
    ELSE 10000 END
FROM spk_proj p, generate_series(1, p.n_const) g;
INSERT INTO public.constituencies (id, project_id) SELECT c.id, p.id FROM spk_const c JOIN spk_proj p ON p.tag = c.proj;

CREATE TEMP TABLE spk_org (proj text, idx int, id uuid) ON COMMIT DROP;
INSERT INTO spk_org SELECT p.tag, g, gen_random_uuid() FROM spk_proj p, generate_series(0, 9) g;
INSERT INTO public.organizations (id, project_id, confirmed, name)
SELECT o.id, p.id, true, jsonb_build_object('en', 'Party ' || o.idx) FROM spk_org o JOIN spk_proj p ON p.tag = o.proj;

CREATE TEMP TABLE spk_orgnom (proj text, const_idx int, org_idx int, id uuid) ON COMMIT DROP;
INSERT INTO spk_orgnom SELECT c.proj, c.idx, o.idx, gen_random_uuid() FROM spk_const c JOIN spk_org o ON o.proj = c.proj;
INSERT INTO public.nominations (id, project_id, organization_id, election_id, constituency_id, confirmed)
SELECT n.id, p.id, o.id, p.election, c.id, true
FROM spk_orgnom n JOIN spk_proj p ON p.tag = n.proj
JOIN spk_org o ON o.proj = n.proj AND o.idx = n.org_idx
JOIN spk_const c ON c.proj = n.proj AND c.idx = n.const_idx;

CREATE TEMP TABLE spk_cand (proj text, const_idx int, k int, id uuid) ON COMMIT DROP;
INSERT INTO spk_cand SELECT c.proj, c.idx, k, gen_random_uuid() FROM spk_const c, generate_series(1, c.size) k;
INSERT INTO public.candidates (id, project_id, first_name, last_name, confirmed, terms_of_use_accepted, sort_order,
                               answers)
SELECT ca.id, p.id, 'First' || ca.k, 'Last' || ca.const_idx, true, now() - interval '1 day', ca.k,
       jsonb_build_object('q1', jsonb_build_object('value', ca.k % 5 + 1))
FROM spk_cand ca JOIN spk_proj p ON p.tag = ca.proj;
INSERT INTO public.nominations (project_id, candidate_id, election_id, constituency_id, parent_nomination_id, confirmed, sort_order)
SELECT p.id, ca.id, p.election, c.id, onm.id, true, ca.k
FROM spk_cand ca JOIN spk_proj p ON p.tag = ca.proj
JOIN spk_const c ON c.proj = ca.proj AND c.idx = ca.const_idx
JOIN spk_orgnom onm ON onm.proj = ca.proj AND onm.const_idx = ca.const_idx AND onm.org_idx = ca.k % 10;

SET LOCAL session_replication_role = origin;
ANALYZE public.projects; ANALYZE public.candidates; ANALYZE public.organizations; ANALYZE public.nominations;
ANALYZE public.constituencies; ANALYZE public.elections;
