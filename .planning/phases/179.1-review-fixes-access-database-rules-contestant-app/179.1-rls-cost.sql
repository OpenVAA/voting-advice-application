-- 179.1-rls-cost.sql -- the cost of the RLS list reads for a project admin and an entity editor.
--
-- Run only through `node 179.1-rls-cost.mjs measure <label>`, which hands this file to
-- `docker exec -i supabase_db_openvaa-local psql -U postgres -d postgres -v ON_ERROR_STOP=1 -X -q -t` on standard input.
--
-- One transaction, ended by ROLLBACK: nothing it writes outlives it. Inside it, as the superuser, a fixture of its
-- own in the seed's default project 00000000-0000-0000-0000-000000000001, every row carrying an external id that
-- begins `rlscost-` where the table has one:
--   - one election, one constituency group and one constituency, linked through the two join tables;
--   - 1 000 candidates, each with one confirmed nomination at that election and constituency;
--   - 1 000 `storage.objects` rows in the `public-assets` bucket, one in each candidate's own folder;
--   - two users in `auth.users`, with no address: an admin holding a project `admin` grant on the project, and an
--     editor holding entity `editor` grants on two of the candidates.
-- The grants are rows of `public.grants`, and each user's claims are built from those rows by
-- `public.custom_access_token_hook`, the function that builds a real token's claims; so the claim and the table
-- agree, and the same fixture is right for a `user_can` that reads the claim and for one that reads the table.
--
-- Then, for each user in turn: the user's claims are set for the transaction, the role becomes `authenticated`, and
-- each of the three list reads -- `public.candidates`, `public.nominations` and the bucket's `storage.objects`, each
-- filtered to the project -- is run five times under `EXPLAIN (ANALYZE, FORMAT JSON)`. Each plan is preceded by a
-- marker line `rlscost-read <user> <read>` that the script reads. The role is reset between the two users.
--
-- Nothing else is printed: the claims are set inside DO blocks, and the user ids are generated inside the
-- transaction and never selected.

BEGIN;

CREATE TEMP TABLE rlscost_fixture ON COMMIT DROP AS
SELECT
  '00000000-0000-0000-0000-000000000001'::uuid AS project_id,
  gen_random_uuid() AS election_id,
  gen_random_uuid() AS constituency_group_id,
  gen_random_uuid() AS constituency_id,
  gen_random_uuid() AS admin_user_id,
  gen_random_uuid() AS editor_user_id;

INSERT INTO auth.users (id, aud, role)
SELECT admin_user_id, 'authenticated', 'authenticated' FROM rlscost_fixture
UNION ALL
SELECT editor_user_id, 'authenticated', 'authenticated' FROM rlscost_fixture;

INSERT INTO public.elections (id, project_id, name, external_id)
SELECT election_id, project_id, '{"en":"rlscost election"}'::jsonb, 'rlscost-election' FROM rlscost_fixture;

INSERT INTO public.constituency_groups (id, project_id, name, external_id)
SELECT constituency_group_id, project_id, '{"en":"rlscost constituency group"}'::jsonb, 'rlscost-constituency-group'
FROM rlscost_fixture;

INSERT INTO public.constituencies (id, project_id, name, external_id)
SELECT constituency_id, project_id, '{"en":"rlscost constituency"}'::jsonb, 'rlscost-constituency' FROM rlscost_fixture;

INSERT INTO public.constituency_group_constituencies (constituency_group_id, constituency_id)
SELECT constituency_group_id, constituency_id FROM rlscost_fixture;

INSERT INTO public.election_constituency_groups (election_id, constituency_group_id)
SELECT election_id, constituency_group_id FROM rlscost_fixture;

INSERT INTO public.candidates (id, project_id, first_name, last_name, external_id, confirmed)
SELECT gen_random_uuid(), f.project_id, 'Rlscost', 'Candidate ' || n, 'rlscost-candidate-' || lpad(n::text, 4, '0'), true
FROM rlscost_fixture f, generate_series(1, 1000) AS n;

INSERT INTO public.nominations (id, project_id, candidate_id, election_id, constituency_id, election_round, external_id, confirmed)
SELECT gen_random_uuid(), c.project_id, c.id, f.election_id, f.constituency_id, 1, 'rlscost-nomination-' || substr(c.external_id, 19), true
FROM public.candidates c, rlscost_fixture f
WHERE c.project_id = f.project_id AND c.external_id LIKE 'rlscost-candidate-%';

INSERT INTO storage.objects (id, bucket_id, name)
SELECT gen_random_uuid(), 'public-assets', c.project_id::text || '/candidates/' || c.id::text || '/rlscost.jpg'
FROM public.candidates c, rlscost_fixture f
WHERE c.project_id = f.project_id AND c.external_id LIKE 'rlscost-candidate-%';

INSERT INTO public.grants (user_id, scope, target_type, target_id, role)
SELECT admin_user_id, 'project', NULL, project_id, 'admin' FROM rlscost_fixture;

INSERT INTO public.grants (user_id, scope, target_type, target_id, role)
SELECT f.editor_user_id, 'entity', 'candidate', c.id, 'editor'
FROM rlscost_fixture f
JOIN LATERAL (
  SELECT id FROM public.candidates
  WHERE project_id = f.project_id AND external_id IN ('rlscost-candidate-0001', 'rlscost-candidate-0002')
) c ON true;

-- The admin.
DO $$
DECLARE
  v_user uuid := (SELECT admin_user_id FROM rlscost_fixture);
  v_event jsonb;
BEGIN
  v_event := public.custom_access_token_hook(jsonb_build_object(
    'user_id', v_user,
    'claims', jsonb_build_object('sub', v_user::text, 'role', 'authenticated', 'aud', 'authenticated')
  ));
  PERFORM set_config('request.jwt.claims', (v_event -> 'claims')::text, true);
  PERFORM set_config('request.jwt.claim.sub', v_user::text, true);
END;
$$;

SET LOCAL ROLE authenticated;

\echo rlscost-read admin candidates
EXPLAIN (ANALYZE, FORMAT JSON) SELECT * FROM public.candidates WHERE project_id = '00000000-0000-0000-0000-000000000001';
\echo rlscost-read admin candidates
EXPLAIN (ANALYZE, FORMAT JSON) SELECT * FROM public.candidates WHERE project_id = '00000000-0000-0000-0000-000000000001';
\echo rlscost-read admin candidates
EXPLAIN (ANALYZE, FORMAT JSON) SELECT * FROM public.candidates WHERE project_id = '00000000-0000-0000-0000-000000000001';
\echo rlscost-read admin candidates
EXPLAIN (ANALYZE, FORMAT JSON) SELECT * FROM public.candidates WHERE project_id = '00000000-0000-0000-0000-000000000001';
\echo rlscost-read admin candidates
EXPLAIN (ANALYZE, FORMAT JSON) SELECT * FROM public.candidates WHERE project_id = '00000000-0000-0000-0000-000000000001';

\echo rlscost-read admin nominations
EXPLAIN (ANALYZE, FORMAT JSON) SELECT * FROM public.nominations WHERE project_id = '00000000-0000-0000-0000-000000000001';
\echo rlscost-read admin nominations
EXPLAIN (ANALYZE, FORMAT JSON) SELECT * FROM public.nominations WHERE project_id = '00000000-0000-0000-0000-000000000001';
\echo rlscost-read admin nominations
EXPLAIN (ANALYZE, FORMAT JSON) SELECT * FROM public.nominations WHERE project_id = '00000000-0000-0000-0000-000000000001';
\echo rlscost-read admin nominations
EXPLAIN (ANALYZE, FORMAT JSON) SELECT * FROM public.nominations WHERE project_id = '00000000-0000-0000-0000-000000000001';
\echo rlscost-read admin nominations
EXPLAIN (ANALYZE, FORMAT JSON) SELECT * FROM public.nominations WHERE project_id = '00000000-0000-0000-0000-000000000001';

\echo rlscost-read admin storage
EXPLAIN (ANALYZE, FORMAT JSON) SELECT * FROM storage.objects WHERE bucket_id = 'public-assets' AND name LIKE '00000000-0000-0000-0000-000000000001/%';
\echo rlscost-read admin storage
EXPLAIN (ANALYZE, FORMAT JSON) SELECT * FROM storage.objects WHERE bucket_id = 'public-assets' AND name LIKE '00000000-0000-0000-0000-000000000001/%';
\echo rlscost-read admin storage
EXPLAIN (ANALYZE, FORMAT JSON) SELECT * FROM storage.objects WHERE bucket_id = 'public-assets' AND name LIKE '00000000-0000-0000-0000-000000000001/%';
\echo rlscost-read admin storage
EXPLAIN (ANALYZE, FORMAT JSON) SELECT * FROM storage.objects WHERE bucket_id = 'public-assets' AND name LIKE '00000000-0000-0000-0000-000000000001/%';
\echo rlscost-read admin storage
EXPLAIN (ANALYZE, FORMAT JSON) SELECT * FROM storage.objects WHERE bucket_id = 'public-assets' AND name LIKE '00000000-0000-0000-0000-000000000001/%';

RESET ROLE;

-- The editor.
DO $$
DECLARE
  v_user uuid := (SELECT editor_user_id FROM rlscost_fixture);
  v_event jsonb;
BEGIN
  v_event := public.custom_access_token_hook(jsonb_build_object(
    'user_id', v_user,
    'claims', jsonb_build_object('sub', v_user::text, 'role', 'authenticated', 'aud', 'authenticated')
  ));
  PERFORM set_config('request.jwt.claims', (v_event -> 'claims')::text, true);
  PERFORM set_config('request.jwt.claim.sub', v_user::text, true);
END;
$$;

SET LOCAL ROLE authenticated;

\echo rlscost-read editor candidates
EXPLAIN (ANALYZE, FORMAT JSON) SELECT * FROM public.candidates WHERE project_id = '00000000-0000-0000-0000-000000000001';
\echo rlscost-read editor candidates
EXPLAIN (ANALYZE, FORMAT JSON) SELECT * FROM public.candidates WHERE project_id = '00000000-0000-0000-0000-000000000001';
\echo rlscost-read editor candidates
EXPLAIN (ANALYZE, FORMAT JSON) SELECT * FROM public.candidates WHERE project_id = '00000000-0000-0000-0000-000000000001';
\echo rlscost-read editor candidates
EXPLAIN (ANALYZE, FORMAT JSON) SELECT * FROM public.candidates WHERE project_id = '00000000-0000-0000-0000-000000000001';
\echo rlscost-read editor candidates
EXPLAIN (ANALYZE, FORMAT JSON) SELECT * FROM public.candidates WHERE project_id = '00000000-0000-0000-0000-000000000001';

\echo rlscost-read editor nominations
EXPLAIN (ANALYZE, FORMAT JSON) SELECT * FROM public.nominations WHERE project_id = '00000000-0000-0000-0000-000000000001';
\echo rlscost-read editor nominations
EXPLAIN (ANALYZE, FORMAT JSON) SELECT * FROM public.nominations WHERE project_id = '00000000-0000-0000-0000-000000000001';
\echo rlscost-read editor nominations
EXPLAIN (ANALYZE, FORMAT JSON) SELECT * FROM public.nominations WHERE project_id = '00000000-0000-0000-0000-000000000001';
\echo rlscost-read editor nominations
EXPLAIN (ANALYZE, FORMAT JSON) SELECT * FROM public.nominations WHERE project_id = '00000000-0000-0000-0000-000000000001';
\echo rlscost-read editor nominations
EXPLAIN (ANALYZE, FORMAT JSON) SELECT * FROM public.nominations WHERE project_id = '00000000-0000-0000-0000-000000000001';

\echo rlscost-read editor storage
EXPLAIN (ANALYZE, FORMAT JSON) SELECT * FROM storage.objects WHERE bucket_id = 'public-assets' AND name LIKE '00000000-0000-0000-0000-000000000001/%';
\echo rlscost-read editor storage
EXPLAIN (ANALYZE, FORMAT JSON) SELECT * FROM storage.objects WHERE bucket_id = 'public-assets' AND name LIKE '00000000-0000-0000-0000-000000000001/%';
\echo rlscost-read editor storage
EXPLAIN (ANALYZE, FORMAT JSON) SELECT * FROM storage.objects WHERE bucket_id = 'public-assets' AND name LIKE '00000000-0000-0000-0000-000000000001/%';
\echo rlscost-read editor storage
EXPLAIN (ANALYZE, FORMAT JSON) SELECT * FROM storage.objects WHERE bucket_id = 'public-assets' AND name LIKE '00000000-0000-0000-0000-000000000001/%';
\echo rlscost-read editor storage
EXPLAIN (ANALYZE, FORMAT JSON) SELECT * FROM storage.objects WHERE bucket_id = 'public-assets' AND name LIKE '00000000-0000-0000-0000-000000000001/%';

RESET ROLE;

ROLLBACK;
