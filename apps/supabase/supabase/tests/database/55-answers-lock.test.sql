-- 55-answers-lock.test.sql: while a project's answers are locked, an entity's own editor writes nothing of its entity, and a project grant holder still does
--
-- The lock is the app setting `access.answersLocked`, stored in the project's `app_settings` row and read by `private.project_answers_locked`, the twin of `private.project_nominations_locked`. It binds the entity-scope write rules only:
--   - the self-update policies `entity_update_own_candidates`, `_organizations`, `_factions` and `_alliances`;
--   - the entity-scope nomination policies `entity_insert_nominations`, `entity_insert_parent_nominations`, `entity_update_nominations` and `entity_delete_nominations`;
--   - the entity-scope write of `storage_path_can`, which the `entity_*_assets` storage policies ask;
--   - `upsert_answers` and `set_entity_nominations`, which refuse an entity's editor with SQLSTATE 42501 and `<function>: answers are locked in this project`, so the lock is told apart from a row the caller may not write.
-- The project-scope policies do not read it, so a project editor and a project admin write the same rows, store the same objects and call the same functions while answers are locked.
--
-- Sections:
--   1. which stored values lock;
--   2. with answers locked, each entity's own editor is refused on every site of the entity's own row;
--   3. with answers locked, a project editor and a project admin are admitted on every site of the entity's own row;
--   4. with the lock off, each entity's own editor is admitted on every site of the entity's own row;
--   5. to 7. the same three for a candidate's nominations and stored files.
--
-- The lock is set and cleared on project A's settings row as the fixture owner between sections. A refused update is silent under row-level security, so an update is asserted by the number of rows it affected.
--
-- Three identities of this file's own, each an `auth.users` row and one `grants` row written as the fixture owner and rolled back with the file: a project editor of project A, and the editors of project A's faction and of its alliance. Their impersonations pass an empty grant array, so each claim is projected from the rows this file writes.
--
-- Depends on:
-- - 00-helpers.test.sql (create_test_data, test_id, test_user_id, test_user_grants, set_test_user, reset_role)
-- - 301-auth-functions.sql (private.project_answers_locked)
-- - 302-rls.sql (the entity self-update and nomination policies)
-- - 400-storage.sql (storage_path_can and the storage policies)
-- - 503-entity-rpcs.sql (upsert_answers, set_entity_nominations)
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (54);

SELECT
  create_test_data ();

-- =====================================================================
-- Instruments and identities
-- =====================================================================
-- The number of rows one statement affected, as the calling session ran it.
CREATE FUNCTION pg_temp.affected (p_sql text) RETURNS integer LANGUAGE plpgsql AS $fn$
DECLARE
  v_rows integer;
BEGIN
  EXECUTE p_sql;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows;
END;
$fn$;

-- The helper's answer for one project. A database without the helper answers NULL here, so each row of section 1 fails as an assertion of its own rather than ending the file.
CREATE FUNCTION pg_temp.answers_locked (p_project_id uuid) RETURNS boolean LANGUAGE plpgsql AS $fn$
BEGIN
  RETURN private.project_answers_locked(p_project_id);
EXCEPTION
  WHEN undefined_function THEN
    RETURN NULL;
END;
$fn$;

-- Stores its argument as project B's `access` member, or removes the member when the argument is NULL, and answers the helper for project B. Project B's settings row is read by no other section.
CREATE FUNCTION pg_temp.answers_locked_with_access (p_access jsonb) RETURNS boolean LANGUAGE plpgsql AS $fn$
BEGIN
  UPDATE public.app_settings
  SET settings = CASE
    WHEN p_access IS NULL THEN settings - 'access'
    ELSE jsonb_set(settings, '{access}', p_access)
  END
  WHERE project_id = public.test_id('project_b');
  RETURN pg_temp.answers_locked(public.test_id('project_b'));
END;
$fn$;

-- Sets project A's `access.answersLocked`, keeping every other member of the row.
CREATE FUNCTION pg_temp.set_answers_locked (p_locked boolean) RETURNS void LANGUAGE sql AS $fn$
  UPDATE public.app_settings
  SET settings = jsonb_recursive_merge(settings, jsonb_build_object('access', jsonb_build_object('answersLocked', p_locked)))
  WHERE project_id = public.test_id('project_a');
$fn$;

INSERT INTO
  auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    aud,
    role,
    email_confirmed_at,
    raw_user_meta_data,
    raw_app_meta_data,
    created_at,
    updated_at
  )
VALUES
  (
    'cccccccc-cccc-cccc-cccc-000000005501',
    '00000000-0000-0000-0000-000000000000',
    'alk_project_editor@test.com',
    crypt ('testpass', gen_salt ('bf')),
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    'cccccccc-cccc-cccc-cccc-000000005502',
    '00000000-0000-0000-0000-000000000000',
    'alk_faction_editor@test.com',
    crypt ('testpass', gen_salt ('bf')),
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    'cccccccc-cccc-cccc-cccc-000000005503',
    '00000000-0000-0000-0000-000000000000',
    'alk_alliance_editor@test.com',
    crypt ('testpass', gen_salt ('bf')),
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

INSERT INTO
  grants (user_id, scope, target_type, target_id, role)
VALUES
  (
    'cccccccc-cccc-cccc-cccc-000000005501',
    'project',
    NULL,
    test_id ('project_a'),
    'editor'
  ),
  (
    'cccccccc-cccc-cccc-cccc-000000005502',
    'entity',
    'faction',
    test_id ('faction_a'),
    'editor'
  ),
  (
    'cccccccc-cccc-cccc-cccc-000000005503',
    'entity',
    'alliance',
    test_id ('alliance_a'),
    'editor'
  );

-- =====================================================================
-- Section 1: which stored values lock
--
-- Locked for a project that does not exist and for the JSON boolean `true` at `access.answersLocked`; unlocked for everything else. The string is the case a text comparison would read as locked, and the nominations lock's key the case a helper reading the wrong key would.
-- =====================================================================
SELECT
  is (
    pg_temp.answers_locked ('0badc0de-0000-4000-8000-000000000055'::uuid),
    true,
    'ALK: an id that names no project reads as locked'
  );

SELECT
  is (
    pg_temp.answers_locked_with_access (NULL),
    false,
    'ALK: a settings row with no access member is unlocked'
  );

SELECT
  is (
    pg_temp.answers_locked_with_access ('{"answersLocked":true}'::jsonb),
    true,
    'ALK: the JSON boolean true locks'
  );

SELECT
  is (
    pg_temp.answers_locked_with_access ('{"answersLocked":"true"}'::jsonb),
    false,
    'ALK: the string "true" is unlocked'
  );

SELECT
  is (
    pg_temp.answers_locked_with_access ('{"answersLocked":false}'::jsonb),
    false,
    'ALK: the JSON boolean false is unlocked'
  );

SELECT
  is (
    pg_temp.answers_locked_with_access ('{"nominationsLocked":true}'::jsonb),
    false,
    'ALK: an access member without the key is unlocked, the nominations lock included'
  );

DELETE FROM app_settings
WHERE
  project_id = test_id ('project_b');

SELECT
  is (
    pg_temp.answers_locked (test_id ('project_b')),
    false,
    'ALK: a project with no settings row is unlocked'
  );

-- =====================================================================
-- Section 2: answers locked -- each entity's own editor is refused
-- =====================================================================
SELECT
  pg_temp.set_answers_locked (true);

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  is (
    pg_temp.affected (
      format(
        $$UPDATE public.candidates SET answers = answers WHERE id = '%s'$$,
        test_id ('candidate_a')
      )
    ),
    0,
    'ALK: with answers locked, a candidate''s own editor updates no answers of the candidate'
  );

SELECT
  is (
    pg_temp.affected (
      format(
        $$UPDATE public.candidates SET info = '{"en":"ALK locked"}'::jsonb WHERE id = '%s'$$,
        test_id ('candidate_a')
      )
    ),
    0,
    'ALK: with answers locked, a candidate''s own editor updates no profile field of the candidate'
  );

SELECT
  throws_ok (
    format(
      $$SELECT public.upsert_answers ('candidate', '%s', '{}'::jsonb)$$,
      test_id ('candidate_a')
    ),
    '42501',
    'upsert_answers: answers are locked in this project',
    'ALK: with answers locked, upsert_answers refuses a candidate''s own editor with the lock''s refusal'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('organization_a'),
    test_user_grants ('organization_a')
  );

SELECT
  is (
    pg_temp.affected (
      format(
        $$UPDATE public.organizations SET answers = answers, info = '{"en":"ALK locked"}'::jsonb WHERE id = '%s'$$,
        test_id ('org_a')
      )
    ),
    0,
    'ALK: with answers locked, an organization''s own editor updates no row of the organization'
  );

SELECT
  throws_ok (
    format(
      $$SELECT public.upsert_answers ('organization', '%s', '{}'::jsonb)$$,
      test_id ('org_a')
    ),
    '42501',
    'upsert_answers: answers are locked in this project',
    'ALK: with answers locked, upsert_answers refuses an organization''s own editor with the lock''s refusal'
  );

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-000000005502',
    '[]'::jsonb
  );

SELECT
  is (
    pg_temp.affected (
      format(
        $$UPDATE public.factions SET info = '{"en":"ALK locked"}'::jsonb WHERE id = '%s'$$,
        test_id ('faction_a')
      )
    ),
    0,
    'ALK: with answers locked, a faction''s own editor updates no row of the faction'
  );

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-000000005503',
    '[]'::jsonb
  );

SELECT
  is (
    pg_temp.affected (
      format(
        $$UPDATE public.alliances SET info = '{"en":"ALK locked"}'::jsonb WHERE id = '%s'$$,
        test_id ('alliance_a')
      )
    ),
    0,
    'ALK: with answers locked, an alliance''s own editor updates no row of the alliance'
  );

-- =====================================================================
-- Section 3: answers locked -- a project editor and a project admin are admitted
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-000000005501',
    '[]'::jsonb
  );

SELECT
  is (
    pg_temp.affected (
      format(
        $$UPDATE public.candidates SET answers = answers, info = '{"en":"ALK editor"}'::jsonb WHERE id = '%s'$$,
        test_id ('candidate_a')
      )
    ),
    1,
    'ALK: with answers locked, a project editor updates the candidate'
  );

SELECT
  is (
    pg_temp.affected (
      format(
        $$UPDATE public.organizations SET info = '{"en":"ALK editor"}'::jsonb WHERE id = '%s'$$,
        test_id ('org_a')
      )
    ),
    1,
    'ALK: with answers locked, a project editor updates the organization'
  );

SELECT
  is (
    pg_temp.affected (
      format(
        $$UPDATE public.factions SET info = '{"en":"ALK editor"}'::jsonb WHERE id = '%s'$$,
        test_id ('faction_a')
      )
    ),
    1,
    'ALK: with answers locked, a project editor updates the faction'
  );

SELECT
  is (
    pg_temp.affected (
      format(
        $$UPDATE public.alliances SET info = '{"en":"ALK editor"}'::jsonb WHERE id = '%s'$$,
        test_id ('alliance_a')
      )
    ),
    1,
    'ALK: with answers locked, a project editor updates the alliance'
  );

SELECT
  lives_ok (
    format(
      $$SELECT public.upsert_answers ('candidate', '%s', '{}'::jsonb)$$,
      test_id ('candidate_a')
    ),
    'ALK: with answers locked, a project editor calls upsert_answers for the candidate'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    test_user_grants ('admin_a')
  );

SELECT
  is (
    pg_temp.affected (
      format(
        $$UPDATE public.candidates SET info = '{"en":"ALK admin"}'::jsonb WHERE id = '%s'$$,
        test_id ('candidate_a')
      )
    ),
    1,
    'ALK: with answers locked, a project admin updates the candidate'
  );

SELECT
  is (
    pg_temp.affected (
      format(
        $$UPDATE public.organizations SET answers = answers, info = '{"en":"ALK admin"}'::jsonb WHERE id = '%s'$$,
        test_id ('org_a')
      )
    ),
    1,
    'ALK: with answers locked, a project admin updates the organization'
  );

SELECT
  is (
    pg_temp.affected (
      format(
        $$UPDATE public.factions SET info = '{"en":"ALK admin"}'::jsonb WHERE id = '%s'$$,
        test_id ('faction_a')
      )
    ),
    1,
    'ALK: with answers locked, a project admin updates the faction'
  );

SELECT
  is (
    pg_temp.affected (
      format(
        $$UPDATE public.alliances SET info = '{"en":"ALK admin"}'::jsonb WHERE id = '%s'$$,
        test_id ('alliance_a')
      )
    ),
    1,
    'ALK: with answers locked, a project admin updates the alliance'
  );

SELECT
  lives_ok (
    format(
      $$SELECT public.upsert_answers ('organization', '%s', '{}'::jsonb)$$,
      test_id ('org_a')
    ),
    'ALK: with answers locked, a project admin calls upsert_answers for the organization'
  );

-- =====================================================================
-- Section 4: the lock off -- each entity's own editor is admitted
-- =====================================================================
SELECT
  reset_role ();

SELECT
  pg_temp.set_answers_locked (false);

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  is (
    pg_temp.affected (
      format(
        $$UPDATE public.candidates SET answers = answers, info = '{"en":"ALK open"}'::jsonb WHERE id = '%s'$$,
        test_id ('candidate_a')
      )
    ),
    1,
    'ALK: with the lock off, a candidate''s own editor updates the candidate'
  );

SELECT
  lives_ok (
    format(
      $$SELECT public.upsert_answers ('candidate', '%s', '{}'::jsonb)$$,
      test_id ('candidate_a')
    ),
    'ALK: with the lock off, a candidate''s own editor calls upsert_answers'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('organization_a'),
    test_user_grants ('organization_a')
  );

SELECT
  is (
    pg_temp.affected (
      format(
        $$UPDATE public.organizations SET answers = answers, info = '{"en":"ALK open"}'::jsonb WHERE id = '%s'$$,
        test_id ('org_a')
      )
    ),
    1,
    'ALK: with the lock off, an organization''s own editor updates the organization'
  );

SELECT
  lives_ok (
    format(
      $$SELECT public.upsert_answers ('organization', '%s', '{}'::jsonb)$$,
      test_id ('org_a')
    ),
    'ALK: with the lock off, an organization''s own editor calls upsert_answers'
  );

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-000000005502',
    '[]'::jsonb
  );

SELECT
  is (
    pg_temp.affected (
      format(
        $$UPDATE public.factions SET info = '{"en":"ALK open"}'::jsonb WHERE id = '%s'$$,
        test_id ('faction_a')
      )
    ),
    1,
    'ALK: with the lock off, a faction''s own editor updates the faction'
  );

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-000000005503',
    '[]'::jsonb
  );

SELECT
  is (
    pg_temp.affected (
      format(
        $$UPDATE public.alliances SET info = '{"en":"ALK open"}'::jsonb WHERE id = '%s'$$,
        test_id ('alliance_a')
      )
    ),
    1,
    'ALK: with the lock off, an alliance''s own editor updates the alliance'
  );

-- =====================================================================
-- Sections 5 to 7: nominations and stored images
--
-- The contests are election A's constituency A at rounds outside the election's current round, so no row of them is in `set_entity_nominations`' reach and every row stands at a contest of its own:
--   - rounds 61 and 62: candidate A holds a nomination, where it may create its party's nomination (the parent insert);
--   - round 63: candidate A's nomination that is updated;
--   - rounds 66 and 67: candidate A's nominations that are deleted, one in each direction of the lock;
--   - rounds 64 and 68: where candidate A inserts its own nomination, one in each direction of the lock;
--   - round 65: where a project editor inserts and deletes candidate A's nomination.
-- `set_entity_nominations` is called with the set as the calling session reads it, every row kept, so a call that lives writes nothing.
-- =====================================================================
SELECT
  reset_role ();

INSERT INTO
  nominations (
    project_id,
    candidate_id,
    election_id,
    constituency_id,
    election_round
  )
SELECT
  test_id ('project_a'),
  test_id ('candidate_a'),
  test_id ('election_a'),
  test_id ('constituency_a'),
  r
FROM
  unnest(ARRAY[61, 62, 63, 66, 67]) AS r;

INSERT INTO
  storage.objects (id, bucket_id, name)
VALUES
  (
    gen_random_uuid(),
    'private-assets',
    format(
      '%s/candidates/%s/alk-read.jpg',
      test_id ('project_a'),
      test_id ('candidate_a')
    )
  );

-- The id of candidate A's nomination at one round of election A.
CREATE FUNCTION pg_temp.nomination_at (p_round integer) RETURNS uuid LANGUAGE sql STABLE AS $fn$
  SELECT n.id
  FROM public.nominations n
  WHERE n.candidate_id = public.test_id('candidate_a')
    AND n.election_id = public.test_id('election_a')
    AND n.election_round = p_round;
$fn$;

-- Candidate A's nominations in `set_entity_nominations`' reach as the calling session reads them, as the set of the stored rows, each kept as it is, and as the expectation of a caller that has just read them.
CREATE FUNCTION pg_temp.kept_set () RETURNS jsonb LANGUAGE sql AS $fn$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', n.id,
      'election_id', n.election_id,
      'constituency_id', n.constituency_id,
      'election_symbol', n.election_symbol,
      'parent', '{"kind":"keep"}'::jsonb)), '[]'::jsonb)
  FROM public.nominations n
  JOIN public.elections e ON e.id = n.election_id
  WHERE n.candidate_id = public.test_id('candidate_a')
    AND COALESCE(n.election_round, 1) = COALESCE(e.current_round, 1);
$fn$;

CREATE FUNCTION pg_temp.reach_now () RETURNS jsonb LANGUAGE sql AS $fn$
  SELECT COALESCE(jsonb_object_agg(n.id, n.updated_at), '{}'::jsonb)
  FROM public.nominations n
  JOIN public.elections e ON e.id = n.election_id
  WHERE n.candidate_id = public.test_id('candidate_a')
    AND COALESCE(n.election_round, 1) = COALESCE(e.current_round, 1);
$fn$;

-- The statement that saves candidate A's set as it is, as text, so a database without the refusal fails each assertion of its own.
CREATE FUNCTION pg_temp.save_kept_set () RETURNS text LANGUAGE sql IMMUTABLE AS $fn$
  SELECT format(
    'SELECT public.set_entity_nominations(%L::public.entity_type, %L::uuid, pg_temp.kept_set(), pg_temp.reach_now())',
    'candidate', public.test_id('candidate_a'));
$fn$;

-- An insert of one object into a bucket, under candidate A's own folder.
CREATE FUNCTION pg_temp.store_object (p_bucket text, p_file text) RETURNS text LANGUAGE sql IMMUTABLE AS $fn$
  SELECT format(
    $$INSERT INTO storage.objects (id, bucket_id, name) VALUES (gen_random_uuid(), %L, %L)$$,
    p_bucket,
    format('%s/candidates/%s/%s', public.test_id('project_a'), public.test_id('candidate_a'), p_file));
$fn$;

-- An insert of candidate A's own nomination, or of its party's, at one round of election A's constituency A.
CREATE FUNCTION pg_temp.insert_nomination (p_column text, p_entity_id uuid, p_round integer) RETURNS text LANGUAGE sql IMMUTABLE AS $fn$
  SELECT format(
    $$INSERT INTO public.nominations (project_id, %I, election_id, constituency_id, election_round) VALUES (%L, %L, %L, %L, %s)$$,
    p_column,
    public.test_id('project_a'),
    p_entity_id,
    public.test_id('election_a'),
    public.test_id('constituency_a'),
    p_round);
$fn$;

-- =====================================================================
-- Section 5: answers locked -- the entity's own editor changes no nomination and stores no image
-- =====================================================================
SELECT
  pg_temp.set_answers_locked (true);

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  throws_ok (
    pg_temp.insert_nomination ('candidate_id', test_id ('candidate_a'), 64),
    '42501',
    NULL,
    'ALK: with answers locked, a candidate''s own editor cannot insert a nomination of the candidate'
  );

SELECT
  throws_ok (
    pg_temp.insert_nomination ('organization_id', test_id ('org_a'), 61),
    '42501',
    NULL,
    'ALK: with answers locked, a candidate''s own editor cannot insert its party''s nomination at its contest'
  );

SELECT
  is (
    pg_temp.affected (
      format(
        $$UPDATE public.nominations SET election_symbol = 'ALK' WHERE id = '%s'$$,
        pg_temp.nomination_at (63)
      )
    ),
    0,
    'ALK: with answers locked, a candidate''s own editor updates no nomination of the candidate'
  );

SELECT
  is (
    pg_temp.affected (
      format(
        $$DELETE FROM public.nominations WHERE id = '%s'$$,
        pg_temp.nomination_at (66)
      )
    ),
    0,
    'ALK: with answers locked, a candidate''s own editor deletes no nomination of the candidate'
  );

SELECT
  throws_ok (
    pg_temp.save_kept_set (),
    '42501',
    'set_entity_nominations: answers are locked in this project',
    'ALK: with answers locked, set_entity_nominations refuses a candidate''s own editor with the lock''s refusal'
  );

SELECT
  throws_ok (
    pg_temp.store_object ('public-assets', 'alk-locked.jpg'),
    '42501',
    NULL,
    'ALK: with answers locked, a candidate''s own editor cannot store an image in its folder of the public bucket'
  );

SELECT
  throws_ok (
    pg_temp.store_object ('private-assets', 'alk-locked.jpg'),
    '42501',
    NULL,
    'ALK: with answers locked, a candidate''s own editor cannot store a file in its folder of the private bucket'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        storage.objects
      WHERE
        bucket_id = 'private-assets'
        AND name = format(
          '%s/candidates/%s/alk-read.jpg',
          test_id ('project_a'),
          test_id ('candidate_a')
        )
    ),
    1,
    'ALK: with answers locked, a candidate''s own editor still reads the file in its folder of the private bucket'
  );

-- =====================================================================
-- Section 6: answers locked -- a project editor and a project admin change nominations and store images
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-000000005501',
    '[]'::jsonb
  );

SELECT
  lives_ok (
    pg_temp.insert_nomination ('candidate_id', test_id ('candidate_a'), 65),
    'ALK: with answers locked, a project editor inserts a nomination of the candidate'
  );

SELECT
  is (
    pg_temp.affected (
      format(
        $$UPDATE public.nominations SET election_symbol = 'ALK editor' WHERE id = '%s'$$,
        pg_temp.nomination_at (63)
      )
    ),
    1,
    'ALK: with answers locked, a project editor updates a nomination of the candidate'
  );

SELECT
  is (
    pg_temp.affected (
      format(
        $$DELETE FROM public.nominations WHERE id = '%s'$$,
        pg_temp.nomination_at (65)
      )
    ),
    1,
    'ALK: with answers locked, a project editor deletes a nomination of the candidate'
  );

SELECT
  lives_ok (
    pg_temp.save_kept_set (),
    'ALK: with answers locked, a project editor calls set_entity_nominations for the candidate'
  );

SELECT
  lives_ok (
    pg_temp.store_object ('public-assets', 'alk-editor.jpg'),
    'ALK: with answers locked, a project editor stores an image in the candidate''s folder of the public bucket'
  );

SELECT
  lives_ok (
    pg_temp.store_object ('private-assets', 'alk-editor.jpg'),
    'ALK: with answers locked, a project editor stores a file in the candidate''s folder of the private bucket'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    test_user_grants ('admin_a')
  );

SELECT
  is (
    pg_temp.affected (
      format(
        $$UPDATE public.nominations SET election_symbol = 'ALK admin' WHERE id = '%s'$$,
        pg_temp.nomination_at (63)
      )
    ),
    1,
    'ALK: with answers locked, a project admin updates a nomination of the candidate'
  );

SELECT
  lives_ok (
    pg_temp.save_kept_set (),
    'ALK: with answers locked, a project admin calls set_entity_nominations for the candidate'
  );

SELECT
  lives_ok (
    pg_temp.store_object ('public-assets', 'alk-admin.jpg'),
    'ALK: with answers locked, a project admin stores an image in the candidate''s folder of the public bucket'
  );

-- =====================================================================
-- Section 7: the lock off -- the entity's own editor changes its nominations and stores images
-- =====================================================================
SELECT
  reset_role ();

SELECT
  pg_temp.set_answers_locked (false);

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  lives_ok (
    pg_temp.insert_nomination ('candidate_id', test_id ('candidate_a'), 68),
    'ALK: with the lock off, a candidate''s own editor inserts a nomination of the candidate'
  );

SELECT
  lives_ok (
    pg_temp.insert_nomination ('organization_id', test_id ('org_a'), 62),
    'ALK: with the lock off, a candidate''s own editor inserts its party''s nomination at its contest'
  );

SELECT
  is (
    pg_temp.affected (
      format(
        $$UPDATE public.nominations SET election_symbol = 'ALK open' WHERE id = '%s'$$,
        pg_temp.nomination_at (63)
      )
    ),
    1,
    'ALK: with the lock off, a candidate''s own editor updates a nomination of the candidate'
  );

SELECT
  is (
    pg_temp.affected (
      format(
        $$DELETE FROM public.nominations WHERE id = '%s'$$,
        pg_temp.nomination_at (67)
      )
    ),
    1,
    'ALK: with the lock off, a candidate''s own editor deletes a nomination of the candidate'
  );

SELECT
  lives_ok (
    pg_temp.save_kept_set (),
    'ALK: with the lock off, a candidate''s own editor calls set_entity_nominations'
  );

SELECT
  lives_ok (
    pg_temp.store_object ('public-assets', 'alk-open.jpg'),
    'ALK: with the lock off, a candidate''s own editor stores an image in its folder of the public bucket'
  );

SELECT
  lives_ok (
    pg_temp.store_object ('private-assets', 'alk-open.jpg'),
    'ALK: with the lock off, a candidate''s own editor stores a file in its folder of the private bucket'
  );

SELECT
  *
FROM
  finish ();

ROLLBACK;
