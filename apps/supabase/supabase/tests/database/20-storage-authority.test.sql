-- 20-storage-authority.test.sql: the storage layer asks the table layer's question, per verb
--
-- ROADMAP criterion 6's missing half. The storage policies on `storage.objects` delegate their whole authority decision to `public.storage_path_can`, which maps a PATH SEGMENT to the permission that segment's own table policy asks and hands it to `user_can`. This file is the evidence that the two layers agree -- in BOTH directions, for BOTH verbs, at BOTH scopes.
--
-- WHY THE TABLE HALF OF EVERY PAIR IS A REAL TABLE OPERATION. "Storage agrees with tables" is satisfied by two policies that both say `true`, and it is satisfied by a pair whose two halves both call `user_can` -- which asserts that a function equals itself and passes against any policy set whatsoever, including two that both deny everything. So the table half here is always a SELECT whose row count is asserted or an UPDATE whose affected-row count is asserted, and NEVER a predicate call.
-- The verify gate for this plan greps this file for the tautological form and halts on a hit.
--
-- Depends on: 00-helpers.test.sql   (set_test_user, create_test_data, test_id, test_user_id) 400-storage.sql       (storage_path_can, storage_path_is_public, the 15 policies) 301-auth-functions.sql (user_can, project_open_for_voters, entity_has_confirmed_nomination)
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (46);

SELECT
  create_test_data ();

-- =====================================================================
-- Fixture storage objects, inserted as postgres inside this transaction
--
-- create_test_data() is NOT edited: this plan is prohibited from touching the shared helper, and every row below rolls back with this transaction exactly as 162-04's tracer's did.
-- =====================================================================
INSERT INTO
  storage.objects (id, bucket_id, name, owner)
VALUES
  -- An anon-visible candidate asset: project A is open for voters, candidate_a is confirmed and carries a confirmed nomination.
  (
    gen_random_uuid(),
    'public-assets',
    test_id ('project_a')::text || '/candidates/' || test_id ('candidate_a')::text || '/photo.jpg',
    test_user_id ('candidate_a')
  ),
  -- An anon-visible organization asset, same three conjuncts.
  (
    gen_random_uuid(),
    'public-assets',
    test_id ('project_a')::text || '/organizations/' || test_id ('org_a')::text || '/logo.png',
    NULL
  ),
  -- The project-level path, whose third segment is NOT a uuid. This is the shape that raises `invalid input syntax for type uuid` under a policy casting segment [3] directly -- reproduced on a live database before either helper was written -- and aborts the caller's whole statement rather than hiding one row.
  (
    gen_random_uuid(),
    'public-assets',
    test_id ('project_a')::text || '/project/settings/config.json',
    NULL
  ),
  -- Project-structure assets, for the project-scope half of the grid and for both separability identities. The public-bucket election banner and question diagram are what the project-scope read-but-not-write caller READS; the private-bucket briefs isolate the AUTHORITY path, because a public-bucket read would also be admitted by the visibility disjunct and would not measure authority at all.
  (
    gen_random_uuid(),
    'public-assets',
    test_id ('project_a')::text || '/elections/' || test_id ('election_a')::text || '/banner.png',
    NULL
  ),
  (
    gen_random_uuid(),
    'public-assets',
    test_id ('project_a')::text || '/questions/' || test_id ('question_a')::text || '/diagram.png',
    NULL
  ),
  (
    gen_random_uuid(),
    'private-assets',
    test_id ('project_a')::text || '/elections/' || test_id ('election_a')::text || '/brief.pdf',
    NULL
  ),
  (
    gen_random_uuid(),
    'private-assets',
    test_id ('project_b')::text || '/elections/' || test_id ('election_b')::text || '/brief.pdf',
    NULL
  ),
  (
    gen_random_uuid(),
    'private-assets',
    test_id ('project_b')::text || '/candidates/' || test_id ('candidate_b')::text || '/doc.pdf',
    test_user_id ('candidate_b')
  );

-- =====================================================================
-- tracer_affected_rows: run a real write and return its affected-row count
--
-- The table half of every pair in this file is a REAL table operation, and this is how its result is read. A data-modifying CTE cannot be used, because PostgreSQL requires one at the top level and the pgTAP form needs the count inside a scalar expression (measured: `WITH clause containing a data-modifying statement must be at the top level`, which aborts the transaction and makes the file emit NO TAP at all rather than a failure).
--
-- SECURITY INVOKER, so RLS and the column grants apply to the impersonated session exactly as they would to the application. A denial that is a PRIVILEGE error returns -1 rather than 0, so "RLS filtered this to zero rows" can never be confused with "permission denied for table" -- two different denials that a bare zero would render identical. Created inside this transaction and rolled back with it.
-- =====================================================================
SELECT
  reset_role ();

CREATE FUNCTION public.tracer_affected_rows (p_sql text) RETURNS integer LANGUAGE plpgsql SECURITY INVOKER AS $fn$
DECLARE
  n integer;
BEGIN
  EXECUTE p_sql;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
EXCEPTION
  WHEN OTHERS THEN
    RETURN -1;
END;
$fn$;

-- =====================================================================
-- 1-4: the entity-scope WRITE pair, in both directions
--
-- Each direction is one table observation and one storage observation on the same entity, in this transaction, as the same session.
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

-- 1. TABLE half of the ALLOW pair. A real UPDATE, asserted by its affected-row count.
SELECT
  is (
    tracer_affected_rows (
      format(
        $$UPDATE public.candidates SET short_name = '{"en":"Tracer"}'::jsonb WHERE id = '%s'$$,
        test_id ('candidate_a')::text
      )
    ),
    1,
    'table: an entity grantee UPDATEs its own candidates row (entity.edit_answers, affected rows = 1)'
  );

-- 2. STORAGE half of the ALLOW pair, same session, same entity.
SELECT
  lives_ok (
    format(
      $$INSERT INTO storage.objects (id, bucket_id, name) VALUES (gen_random_uuid(), 'public-assets', '%s/candidates/%s/t2.jpg')$$,
      test_id ('project_a')::text,
      test_id ('candidate_a')::text
    ),
    'storage: the same grantee INSERTs under its own entity folder -- the storage half agrees with the table half'
  );

-- 3. TABLE half of the DENY pair. Another entity in the SAME project and of the SAME type, which is the case a predicate written at project scope instead of entity scope would wrongly admit.
SELECT
  is (
    tracer_affected_rows (
      format(
        $$UPDATE public.candidates SET short_name = '{"en":"Hijack"}'::jsonb WHERE id = '%s'$$,
        test_id ('candidate_a2')::text
      )
    ),
    0,
    'table: the same grantee is DENIED an UPDATE of another candidate in the same project (affected rows = 0)'
  );

-- 4. STORAGE half of the DENY pair.
SELECT
  throws_ok (
    format(
      $$INSERT INTO storage.objects (id, bucket_id, name) VALUES (gen_random_uuid(), 'public-assets', '%s/candidates/%s/t4.jpg')$$,
      test_id ('project_a')::text,
      test_id ('candidate_a2')::text
    ),
    '42501',
    NULL,
    'storage: the same grantee is DENIED a write under another candidate folder in the same project'
  );

-- =====================================================================
-- 5-8: the generalisation, and the three refusals that bound it
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('organization_a'),
    test_user_grants ('organization_a')
  );

-- 5. The coverage this conversion creates. No policy in 400-storage.sql has ever permitted it: the six entity-owner policies hardcoded the type segment to one entity table, so an organization grantee could not write into its own folder.
SELECT
  lives_ok (
    format(
      $$INSERT INTO storage.objects (id, bucket_id, name) VALUES (gen_random_uuid(), 'public-assets', '%s/organizations/%s/t5.png')$$,
      test_id ('project_a')::text,
      test_id ('org_a')::text
    ),
    'storage: an ORGANIZATION grantee INSERTs under its own entity folder -- the generalisation, which no policy in this file has ever permitted'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

-- 6. The refusal 06-storage-rls.test.sql already makes, surviving the generalisation with its REASON changed. It used to hold because the type segment was hardcoded to 'candidates'; it now holds because org_a is not this caller's entity. Same refusal, true reason.
SELECT
  throws_ok (
    format(
      $$INSERT INTO storage.objects (id, bucket_id, name) VALUES (gen_random_uuid(), 'public-assets', '%s/organizations/%s/t6.png')$$,
      test_id ('project_a')::text,
      test_id ('org_a')::text
    ),
    '42501',
    NULL,
    'storage: a candidate grantee is DENIED a write into an organization folder -- because org_a is not this caller entity, not because the type is hardcoded'
  );

-- 7. THE TYPE/ID PAIRING. The path claims `organizations` and carries this caller's OWN candidate id.
-- A conversion that asked `user_can ('entity', segment[3], ...)` on the bare uuid and ignored the type segment would ADMIT this write -- the caller does hold entity.edit_answers on that id. The retired publication helper provided the pairing implicitly through its dynamically named table lookup, and dropping it silently is the exact defect this assertion exists to catch.
SELECT
  throws_ok (
    format(
      $$INSERT INTO storage.objects (id, bucket_id, name) VALUES (gen_random_uuid(), 'public-assets', '%s/organizations/%s/t7.png')$$,
      test_id ('project_a')::text,
      test_id ('candidate_a')::text
    ),
    '42501',
    NULL,
    'storage: a path claiming one entity type while carrying another type id is REFUSED, even when the caller holds the write permission on that id'
  );

-- 8. The fall-through denies at entity scope. `project` is a project-scope-only segment; an entity grantee holds no project-scope write permission, so the project-level path is refused.
SELECT
  throws_ok (
    format(
      $$INSERT INTO storage.objects (id, bucket_id, name) VALUES (gen_random_uuid(), 'public-assets', '%s/project/settings/t8.json')$$,
      test_id ('project_a')::text
    ),
    '42501',
    NULL,
    'storage: an entity grantee is DENIED a write under the project-level path -- entity scope has no arm for it and the caller holds no project-scope write permission'
  );

-- =====================================================================
-- 9: a malformed path segment DENIES, it does not RAISE
--
-- Measured before the helpers were written: a policy casting segment [3] straight to uuid raises `invalid input syntax for type uuid: "settings"` on the project-level object above, which aborts the caller's whole statement and hides every legitimate row with it. The assertion is that a read over the bucket returns rather than raises.
-- =====================================================================
SELECT
  set_test_user ('anon');

SELECT
  lives_ok (
    $$SELECT count(*) FROM storage.objects WHERE bucket_id = 'public-assets'$$,
    'storage: a non-uuid path segment denies rather than raising -- a bucket read returns a row count'
  );

-- =====================================================================
-- 10-11: structural. Read from pg_policies, never from a file, so a source comment naming a retired predicate can neither satisfy nor invalidate either assertion.
-- =====================================================================
SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        pg_policies
      WHERE
        schemaname = 'storage'
        AND cmd = 'INSERT'
        AND COALESCE(with_check, '') LIKE '%public-assets%'
        AND with_check LIKE '%storage_path_can%'
        AND with_check NOT LIKE '%can_access_project%'
        AND with_check NOT LIKE '%has_role%'
        AND with_check NOT LIKE '%auth_user_id%'
        AND with_check NOT LIKE '%uid()%'
        AND with_check NOT LIKE '%is_storage_entity_published%'
        AND with_check NOT LIKE '%''candidates''%'
        AND with_check NOT LIKE '%''organizations''%'
    )::integer,
    2,
    'structural: the converted public-bucket INSERT pair reaches the authority helper and carries no legacy predicate, identity comparison or entity-type literal'
  );

-- The tracer converts ONE pair, so a global "no storage policy name carries an entity type" cannot yet be true -- five `candidate_*` policies are still Task 4's. This asserts the stronger, narrower claim the tracer can actually make: the pair carries EXACTLY its two ratified names and NEITHER retired name survives. Task 4 adds the global form beside it; neither replaces the other.
SELECT
  is (
    (
      SELECT
        string_agg(
          policyname,
          ','
          ORDER BY
            policyname
        )
      FROM
        pg_policies
      WHERE
        schemaname = 'storage'
        AND cmd = 'INSERT'
        AND COALESCE(with_check, '') LIKE '%public-assets%'
    ),
    'entity_insert_public_assets,project_insert_public_assets',
    'naming (D-21, Q4 = A): the converted public-bucket INSERT pair carries its two ratified names, and neither retired name survives'
  );

-- =====================================================================
-- 12: the project-scope twin of the converted pair
--
-- The entity-scope policy and the project-scope policy are two policies asking two different questions of one helper; PostgreSQL ORs them. This is the half that makes the scope argument observable.
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    test_user_grants ('admin_a')
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO storage.objects (id, bucket_id, name) VALUES (gen_random_uuid(), 'public-assets', '%s/candidates/%s/t12.jpg')$$,
      test_id ('project_a')::text,
      test_id ('candidate_a')::text
    ),
    'storage: a project grantee INSERTs into an entity folder in its own project -- the project-scope twin (project.edit_entities)'
  );

-- =====================================================================
-- 13-18: THE ANON EXPOSURE SET
--
-- The failure direction of the anon policy is EXPOSURE, and a read test cannot tell "correctly visible" from "should have been hidden" -- a passing read reports nothing either way. So the set is one positive and five negatives, each negative FLIPPING ONE CONJUNCT ALONE against an otherwise visible row, and all five were observed RED against a visibility helper returning true unconditionally before the real one was accepted. The flips are made as postgres and reverted immediately; `enforce_entity_immutability` returns early for any caller that is not `authenticated`, so the fixture is not fighting the trigger.
-- =====================================================================
SELECT
  reset_role ();

-- 13. ALLOW. Project A is open for voters, candidate_a is confirmed, its terms of use are accepted in the past, and nomination_cand_a confirms it in this project. All four conjuncts hold.
SELECT
  set_test_user ('anon');

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        storage.objects
      WHERE
        bucket_id = 'public-assets'
        AND name LIKE '%/candidates/' || test_id ('candidate_a')::text || '/photo.jpg'
    )::integer,
    1,
    'anon: an asset of a confirmed entity carrying a confirmed nomination in an open project IS readable'
  );

-- 14. DENY, project conjunct flipped alone. Same row, same asset; only open_for_voters moves.
SELECT
  reset_role ();

UPDATE projects
SET
  open_for_voters = false
WHERE
  id = test_id ('project_a');

SELECT
  set_test_user ('anon');

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        storage.objects
      WHERE
        bucket_id = 'public-assets'
        AND name LIKE '%/candidates/' || test_id ('candidate_a')::text || '/photo.jpg'
    )::integer,
    0,
    'anon: the same asset is NOT readable once its project is closed to voters -- the project conjunct, flipped alone'
  );

-- 15. DENY, THE TIGHTENING. The project-level path was answered `true` unconditionally before this wave, so a CLOSED project's assets were world-readable. This assertion passes against no policy that existed before this commit.
SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        storage.objects
      WHERE
        bucket_id = 'public-assets'
        AND name LIKE '%/project/settings/config.json'
    )::integer,
    0,
    'anon: the project-level asset path is NOT readable while the project is closed -- the tightening, which no earlier policy made'
  );

SELECT
  reset_role ();

UPDATE projects
SET
  open_for_voters = true
WHERE
  id = test_id ('project_a');

-- 16. ALLOW, the other half of the tightening: it did not become a blanket denial.
SELECT
  set_test_user ('anon');

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        storage.objects
      WHERE
        bucket_id = 'public-assets'
        AND name LIKE '%/project/settings/config.json'
    )::integer,
    1,
    'anon: the project-level asset path IS readable while the project is open for voters'
  );

-- 17. DENY, entity confirmation flag flipped alone. Project open, nomination confirmed, terms accepted.
SELECT
  reset_role ();

UPDATE candidates
SET
  confirmed = false
WHERE
  id = test_id ('candidate_a');

SELECT
  set_test_user ('anon');

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        storage.objects
      WHERE
        bucket_id = 'public-assets'
        AND name LIKE '%/candidates/' || test_id ('candidate_a')::text || '/photo.jpg'
    )::integer,
    0,
    'anon: the same asset is NOT readable once the entity own confirmation flag is false -- the entity conjunct, flipped alone'
  );

SELECT
  reset_role ();

UPDATE candidates
SET
  confirmed = true
WHERE
  id = test_id ('candidate_a');

-- 18. DENY, nomination conjunct flipped alone. candidate_a2 is the fixture's own negative control: it is confirmed, its terms are accepted, its project is open, and it carries NO nomination at all.
INSERT INTO
  storage.objects (id, bucket_id, name, owner)
VALUES
  (
    gen_random_uuid(),
    'public-assets',
    test_id ('project_a')::text || '/candidates/' || test_id ('candidate_a2')::text || '/photo.jpg',
    NULL
  );

SELECT
  set_test_user ('anon');

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        storage.objects
      WHERE
        bucket_id = 'public-assets'
        AND name LIKE '%/candidates/' || test_id ('candidate_a2')::text || '/photo.jpg'
    )::integer,
    0,
    'anon: an asset of a confirmed entity with NO confirming nomination is NOT readable -- the nomination conjunct, flipped alone'
  );

-- 19. DENY, terms-of-use conjunct flipped alone. This is the conjunct that ONLY `candidates` carries, and the one a composition of the three visibility helpers alone would silently drop: the candidate ROW would stay hidden from anon while its PHOTO stayed fetchable -- storage disagreeing with tables, in the one direction a passing read test cannot report. `anon_select_candidates` carries both guards and so does storage_path_is_public's candidate branch.
SELECT
  reset_role ();

UPDATE candidates
SET
  terms_of_use_accepted = NULL
WHERE
  id = test_id ('candidate_a');

SELECT
  set_test_user ('anon');

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        storage.objects
      WHERE
        bucket_id = 'public-assets'
        AND name LIKE '%/candidates/' || test_id ('candidate_a')::text || '/photo.jpg'
    )::integer,
    0,
    'anon: an asset of an otherwise visible candidate whose terms of use are not accepted is NOT readable -- the terms-of-use conjunct, flipped alone'
  );

SELECT
  reset_role ();

UPDATE candidates
SET
  terms_of_use_accepted = now() - interval '1 day'
WHERE
  id = test_id ('candidate_a');

-- =====================================================================
-- 19-22: the private bucket, and anon writes
--
-- The private-bucket SELECT carries NO visibility disjunct at all, by design, so a path that would be anon-visible in the public bucket confers nothing here. There is no anon policy on that bucket and no anon write policy on either.
-- =====================================================================
SELECT
  reset_role ();

INSERT INTO
  storage.objects (id, bucket_id, name, owner)
VALUES
  (
    gen_random_uuid(),
    'private-assets',
    test_id ('project_a')::text || '/candidates/' || test_id ('candidate_a')::text || '/doc.pdf',
    test_user_id ('candidate_a')
  ),
  (
    gen_random_uuid(),
    'private-assets',
    test_id ('project_a')::text || '/project/settings/secret.json',
    NULL
  );

SELECT
  set_test_user ('anon');

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        storage.objects
      WHERE
        bucket_id = 'private-assets'
    )::integer,
    0,
    'anon: reads zero objects from the private bucket, for every path shape in the fixture'
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO storage.objects (id, bucket_id, name) VALUES (gen_random_uuid(), 'public-assets', '%s/candidates/%s/anon.jpg')$$,
      test_id ('project_a')::text,
      test_id ('candidate_a')::text
    ),
    '42501',
    NULL,
    'anon: cannot INSERT into either bucket -- no anon write policy exists'
  );

SELECT
  is (
    tracer_affected_rows (
      $$UPDATE storage.objects SET name = name WHERE bucket_id = 'public-assets'$$
    ),
    0,
    'anon: cannot UPDATE any storage object'
  );

-- 22. The anon DELETE. MEASURED: `storage.objects` carries a Supabase-supplied guard that refuses direct deletion from EVERY role -- `Direct deletion from storage tables is not allowed. Use the Storage API instead.` -- so a DELETE-policy denial cannot be observed as an affected-row count of zero the way the UPDATE above can. Asserting `0` here would have reddened against a correct policy set for a reason that has nothing to do with authority. What is asserted instead is the property that actually matters, and it holds whichever mechanism does the refusing: the objects SURVIVE the attempt, counted as postgres on both sides of it.
SELECT
  reset_role ();

CREATE TABLE public.tracer_counts (label text PRIMARY KEY, n bigint);

INSERT INTO
  public.tracer_counts
SELECT
  'before',
  count(*)
FROM
  storage.objects
WHERE
  bucket_id = 'public-assets';

SELECT
  set_test_user ('anon');

DO $do$
BEGIN
  PERFORM public.tracer_affected_rows($d$DELETE FROM storage.objects WHERE bucket_id = 'public-assets'$d$);
END
$do$;

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        storage.objects
      WHERE
        bucket_id = 'public-assets'
    ),
    (
      SELECT
        n
      FROM
        public.tracer_counts
      WHERE
        label = 'before'
    ),
    'anon: cannot DELETE any storage object -- every public-bucket object survives the attempt'
  );

-- =====================================================================
-- 23-26: structural, read from the catalogue and never from a file
-- =====================================================================
SELECT
  reset_role ();

-- 23. D-21 MADE STRUCTURAL ON THE BUCKET DIMENSION, by the technique 162-10 used on the table dimension: replace the bucket literal with a placeholder and the expressions of each write verb collapse to exactly ONE string per scope. Six families (three verbs x two scopes), each of which must be one distinct normalised expression across its two buckets.
SELECT
  is (
    (
      SELECT
        count(DISTINCT normalised)
      FROM
        (
          SELECT
            cmd,
            CASE
              WHEN COALESCE(qual, '') || COALESCE(with_check, '') LIKE '%''project''%' THEN 'project'
              ELSE 'entity'
            END AS scope,
            replace(
              replace(
                regexp_replace(
                  COALESCE(qual, '-') || '~' || COALESCE(with_check, '-'),
                  '\s+',
                  ' ',
                  'g'
                ),
                '''public-assets''',
                'BUCKET'
              ),
              '''private-assets''',
              'BUCKET'
            ) AS normalised
          FROM
            pg_policies
          WHERE
            schemaname = 'storage'
            AND cmd IN ('INSERT', 'UPDATE', 'DELETE')
        ) s
    )::integer,
    6,
    'D-21 structural: the twelve write policies are SIX distinct expressions modulo the bucket literal -- one per verb per scope, across both buckets'
  );

-- 24. The absence set. Read from pg_policies, so a source comment can neither satisfy nor invalidate it.
SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        pg_policies
      WHERE
        schemaname = 'storage'
        AND (
          COALESCE(qual, '') || COALESCE(with_check, '') LIKE '%can_access_project%'
          OR COALESCE(qual, '') || COALESCE(with_check, '') LIKE '%has_role%'
          OR COALESCE(qual, '') || COALESCE(with_check, '') LIKE '%auth_user_id%'
          OR COALESCE(qual, '') || COALESCE(with_check, '') LIKE '%uid()%'
          OR COALESCE(qual, '') || COALESCE(with_check, '') LIKE '%published%'
          OR COALESCE(qual, '') || COALESCE(with_check, '') LIKE '%''candidates''%'
          OR COALESCE(qual, '') || COALESCE(with_check, '') LIKE '%''organizations''%'
          OR COALESCE(qual, '') || COALESCE(with_check, '') LIKE '%''factions''%'
          OR COALESCE(qual, '') || COALESCE(with_check, '') LIKE '%''alliances''%'
        )
    )::integer,
    0,
    'absence: no storage policy expression carries the legacy project predicate, the retired role predicate, an identity comparison, a publication flag or an entity-type literal'
  );

-- 25. Every one of the fifteen reaches one of the two helpers. Criterion 6's structural half.
SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        pg_policies
      WHERE
        schemaname = 'storage'
        AND COALESCE(qual, '') || COALESCE(with_check, '') NOT LIKE '%storage_path_%'
    )::integer,
    0,
    'routing: every storage policy reaches storage_path_can or storage_path_is_public, and none answers the authority question its own way'
  );

-- 26. D-11b: the storage layer's copy of the retired visibility mechanism is ABSENT from pg_proc, not merely unused -- so 162-16 finds nothing left to strip in 400-storage.sql. The GLOBAL form of the naming assertion sits beside it; test 11 makes the narrower claim about the tracer's own pair.
SELECT
  is (
    ARRAY[
      (
        SELECT
          count(*)
        FROM
          pg_proc p
          JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE
          n.nspname = 'public'
          AND p.proname = 'is_storage_entity_published'
      ),
      (
        SELECT
          count(*)
        FROM
          pg_policies
        WHERE
          schemaname = 'storage'
          AND (
            policyname LIKE 'candidate\_%'
            OR policyname LIKE 'organization\_%'
            OR policyname LIKE 'faction\_%'
            OR policyname LIKE 'alliance\_%'
          )
      )
    ],
    ARRAY[0::bigint, 0::bigint],
    'D-11b and D-21: the storage-local publication helper is absent from pg_proc, and NO storage policy name carries an entity type'
  );

-- =====================================================================
-- 28-39: CRITERION 6'S PAIRED ASSERTION -- four observations per verb per scope, TWO-DIRECTIONAL
--
-- For each cell: an identity ALLOWED the operation at the TABLE level is allowed it at the STORAGE level, and an identity DENIED it at the table level is denied it at storage. The table half is always a real SELECT whose row count is asserted or a real UPDATE whose affected-row count is asserted -- NEVER a `user_can` or `storage_path_can` call. A pair whose two halves both call one function asserts that the function equals itself; it passes against any policy set at all, including two that both deny everything and two that both allow everything, and it cannot detect the single condition criterion 6 names. This is the easiest thing in this plan to get wrong and it is silently worthless, which is why the plan's verify gate greps this file for the tautological form.
--
-- The ENTITY-SCOPE WRITE cell is tests 1-4 above; it is not repeated here.
--
-- The private bucket is used for the authority reads. A public-bucket read would also be admitted by the visibility disjunct, so it would not measure authority at all -- the allow half would pass against a policy with no authority call in it.
-- =====================================================================
SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

-- 28-31: entity scope, READ.
SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        candidates
      WHERE
        id = test_id ('candidate_a')
    )::integer,
    1,
    'PAIR entity/read ALLOW, table half: an entity grantee SELECTs its own candidates row (1 row)'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        storage.objects
      WHERE
        bucket_id = 'private-assets'
        AND name LIKE '%/candidates/' || test_id ('candidate_a')::text || '/%'
    )::integer,
    1,
    'PAIR entity/read ALLOW, storage half: the same grantee reads its own private-bucket folder'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        candidates
      WHERE
        id = test_id ('candidate_b')
    )::integer,
    0,
    'PAIR entity/read DENY, table half: the same caller is DENIED the row of an entity it holds no grant on (0 rows)'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        storage.objects
      WHERE
        bucket_id = 'private-assets'
        AND name LIKE '%/candidates/' || test_id ('candidate_b')::text || '/%'
    )::integer,
    0,
    'PAIR entity/read DENY, storage half: the same caller is DENIED that entity private-bucket folder'
  );

-- 32-35: project scope, READ.
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    test_user_grants ('admin_a')
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        elections
      WHERE
        project_id = test_id ('project_a')
    )::integer,
    1,
    'PAIR project/read ALLOW, table half: a project grantee SELECTs a project-structure row in its own project (1 row)'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        storage.objects
      WHERE
        bucket_id = 'private-assets'
        AND name LIKE '%/elections/' || test_id ('election_a')::text || '/%'
    )::integer,
    1,
    'PAIR project/read ALLOW, storage half: the same grantee reads that row private-bucket folder'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        elections
      WHERE
        project_id = test_id ('project_b')
    )::integer,
    0,
    'PAIR project/read DENY, table half: the same grantee is DENIED the other project structure rows (0 rows)'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        storage.objects
      WHERE
        bucket_id = 'private-assets'
        AND name LIKE '%/elections/' || test_id ('election_b')::text || '/%'
    )::integer,
    0,
    'PAIR project/read DENY, storage half: the same grantee is DENIED the other project structure folder'
  );

-- 36-39: project scope, WRITE.
SELECT
  is (
    tracer_affected_rows (
      format(
        $$UPDATE public.elections SET name = '{"en":"Grid"}'::jsonb WHERE id = '%s'$$,
        test_id ('election_a')::text
      )
    ),
    1,
    'PAIR project/write ALLOW, table half: a project grantee UPDATEs a structure row in its own project (project.edit_structure, affected rows = 1)'
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO storage.objects (id, bucket_id, name) VALUES (gen_random_uuid(), 'private-assets', '%s/elections/%s/t37.pdf')$$,
      test_id ('project_a')::text,
      test_id ('election_a')::text
    ),
    'PAIR project/write ALLOW, storage half: the same grantee writes under that row folder'
  );

SELECT
  is (
    tracer_affected_rows (
      format(
        $$UPDATE public.elections SET name = '{"en":"Grid"}'::jsonb WHERE id = '%s'$$,
        test_id ('election_b')::text
      )
    ),
    0,
    'PAIR project/write DENY, table half: the same grantee is DENIED the UPDATE of the other project structure row (affected rows = 0)'
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO storage.objects (id, bucket_id, name) VALUES (gen_random_uuid(), 'private-assets', '%s/elections/%s/t39.pdf')$$,
      test_id ('project_b')::text,
      test_id ('election_b')::text
    ),
    '42501',
    NULL,
    'PAIR project/write DENY, storage half: the same grantee is DENIED a write under the other project structure folder'
  );

-- =====================================================================
-- 40-44: K2's SEPARABILITY -- two independent read-but-not-write identities, at two different scopes
--
-- A policy that honours `read` and `write` identically passes any grid that exercises only one of them. These are the assertions that fail if the verb argument is accepted and then discarded, and each names the 162-IMPLEMENTATION-BRIEF.md section 3.3 cell it is read from, so a later matrix change that invalidates the identity reddens a test that says which cell it came from.
--
-- ENTITY SCOPE (40-41). Section 3.3 gives an entity grant `entity.read_answers` and `entity.edit_answers` as `own` and neither for another entity, so the identity that separates is one reading ANOTHER entity's publicly visible asset -- admitted through the visibility path -- and writing it, which no permission admits.
--
-- PROJECT SCOPE (42-44). Section 3.3's Candidate, OrgEditor and Faction/Alliance columns grant `project.read_structure` and withhold `project.edit_structure` and `project.edit_questions` -- user_can's named branch 1, which pins that one permission as a literal. So an entity grantee reads an election's banner and a question's diagram and may write neither. This identity exists ONLY because the type segment maps to a PERMISSION rather than to a boolean, and the two refusals are two DIFFERENT withheld permissions -- which exists only because Q2 (A) maps elections and questions to different write permissions, as their own table policies do.
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        storage.objects
      WHERE
        bucket_id = 'public-assets'
        AND name LIKE '%/organizations/' || test_id ('org_a')::text || '/logo.png'
    )::integer,
    1,
    'SEPARABILITY entity scope (3.3 Candidate / entity.read_answers = own): the grantee READS another entity publicly visible asset'
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO storage.objects (id, bucket_id, name) VALUES (gen_random_uuid(), 'public-assets', '%s/organizations/%s/logo.png')$$,
      test_id ('project_a')::text,
      test_id ('org_a')::text
    ),
    '42501',
    NULL,
    'SEPARABILITY entity scope (3.3 Candidate / entity.edit_answers = own): and is REFUSED a write to that same object, in the same transaction'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        storage.objects
      WHERE
        bucket_id = 'public-assets'
        AND name LIKE '%/elections/' || test_id ('election_a')::text || '/banner.png'
    )::integer,
    1,
    'SEPARABILITY project scope (3.3 Candidate / project.read_structure = granted): the grantee READS a project-structure asset'
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO storage.objects (id, bucket_id, name) VALUES (gen_random_uuid(), 'public-assets', '%s/elections/%s/banner.png')$$,
      test_id ('project_a')::text,
      test_id ('election_a')::text
    ),
    '42501',
    NULL,
    'SEPARABILITY project scope (3.3 Candidate / project.edit_structure = withheld): and is REFUSED a write to that same object, in the same transaction'
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO storage.objects (id, bucket_id, name) VALUES (gen_random_uuid(), 'public-assets', '%s/questions/%s/diagram.png')$$,
      test_id ('project_a')::text,
      test_id ('question_a')::text
    ),
    '42501',
    NULL,
    'SEPARABILITY project scope (3.3 Candidate / project.edit_questions = withheld): the same caller is REFUSED a write to a QUESTION asset, which asks a different permission from the election asset it also cannot write'
  );

-- =====================================================================
-- 45: the two separability callers' TABLE answers equal their STORAGE answers, as the same four booleans on both sides. Both sides are measured by real operations; neither calls a predicate.
-- =====================================================================
SELECT
  reset_role ();

CREATE TABLE public.tracer_booleans (label text PRIMARY KEY, v boolean);

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

INSERT INTO
  public.tracer_booleans
SELECT
  'table_read_org',
  (
    SELECT
      count(*)
    FROM
      organizations
    WHERE
      id = test_id ('org_a')
  ) > 0;

INSERT INTO
  public.tracer_booleans
SELECT
  'table_write_org',
  tracer_affected_rows (
    format(
      $$UPDATE public.organizations SET short_name = '{"en":"N"}'::jsonb WHERE id = '%s'$$,
      test_id ('org_a')::text
    )
  ) > 0;

INSERT INTO
  public.tracer_booleans
SELECT
  'table_read_election',
  (
    SELECT
      count(*)
    FROM
      elections
    WHERE
      id = test_id ('election_a')
  ) > 0;

INSERT INTO
  public.tracer_booleans
SELECT
  'table_write_election',
  tracer_affected_rows (
    format(
      $$UPDATE public.elections SET name = '{"en":"N"}'::jsonb WHERE id = '%s'$$,
      test_id ('election_a')::text
    )
  ) > 0;

INSERT INTO
  public.tracer_booleans
SELECT
  'storage_read_org',
  (
    SELECT
      count(*)
    FROM
      storage.objects
    WHERE
      bucket_id = 'public-assets'
      AND name LIKE '%/organizations/' || test_id ('org_a')::text || '/logo.png'
  ) > 0;

INSERT INTO
  public.tracer_booleans
SELECT
  'storage_write_org',
  tracer_affected_rows (
    format(
      $$INSERT INTO storage.objects (id, bucket_id, name) VALUES (gen_random_uuid(), 'public-assets', '%s/organizations/%s/t45.png')$$,
      test_id ('project_a')::text,
      test_id ('org_a')::text
    )
  ) > 0;

INSERT INTO
  public.tracer_booleans
SELECT
  'storage_read_election',
  (
    SELECT
      count(*)
    FROM
      storage.objects
    WHERE
      bucket_id = 'public-assets'
      AND name LIKE '%/elections/' || test_id ('election_a')::text || '/banner.png'
  ) > 0;

INSERT INTO
  public.tracer_booleans
SELECT
  'storage_write_election',
  tracer_affected_rows (
    format(
      $$INSERT INTO storage.objects (id, bucket_id, name) VALUES (gen_random_uuid(), 'public-assets', '%s/elections/%s/t45.png')$$,
      test_id ('project_a')::text,
      test_id ('election_a')::text
    )
  ) > 0;

SELECT
  reset_role ();

SELECT
  is (
    ARRAY[
      (
        SELECT
          v
        FROM
          public.tracer_booleans
        WHERE
          label = 'table_read_org'
      ),
      (
        SELECT
          v
        FROM
          public.tracer_booleans
        WHERE
          label = 'table_write_org'
      ),
      (
        SELECT
          v
        FROM
          public.tracer_booleans
        WHERE
          label = 'table_read_election'
      ),
      (
        SELECT
          v
        FROM
          public.tracer_booleans
        WHERE
          label = 'table_write_election'
      )
    ],
    ARRAY[
      (
        SELECT
          v
        FROM
          public.tracer_booleans
        WHERE
          label = 'storage_read_org'
      ),
      (
        SELECT
          v
        FROM
          public.tracer_booleans
        WHERE
          label = 'storage_write_org'
      ),
      (
        SELECT
          v
        FROM
          public.tracer_booleans
        WHERE
          label = 'storage_read_election'
      ),
      (
        SELECT
          v
        FROM
          public.tracer_booleans
        WHERE
          label = 'storage_write_election'
      )
    ],
    'AGREEMENT: the two separability callers table-level answers equal their storage-level answers, as the same four booleans -- read yes / write no, at both scopes'
  );

-- =====================================================================
-- 46: structural. The verb argument is referenced AND resolves DISJOINT permission sets.
--
-- A helper that accepted the verb and discarded it -- the exact defect K2's amendment forbids -- would reference p_verb nowhere, or would resolve one set for both verbs. The counts are falsifiable: three read permissions (entity.read_answers, project.read_entities, project.read_structure), six write permissions (entity.edit_answers, project.edit_entities, project.edit_structure, project.edit_questions, project.edit_nominations, project.edit_app_settings), and an empty intersection. A collapse in either direction moves at least one of the four numbers.
-- =====================================================================
SELECT
  is (
    ARRAY[
      (
        SELECT
          count(*)
        FROM
          pg_proc p
          JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE
          n.nspname = 'public'
          AND p.proname = 'storage_path_can'
          AND p.prosrc LIKE '%p_verb%'
      ),
      (
        SELECT
          count(DISTINCT m[1])
        FROM
          pg_proc p
          JOIN pg_namespace n ON n.oid = p.pronamespace,
          LATERAL regexp_matches(
            p.prosrc,
            '''((?:entity|project|nomination)\.read_[a-z_]+)''',
            'g'
          ) m
        WHERE
          n.nspname = 'public'
          AND p.proname = 'storage_path_can'
      ),
      (
        SELECT
          count(DISTINCT m[1])
        FROM
          pg_proc p
          JOIN pg_namespace n ON n.oid = p.pronamespace,
          LATERAL regexp_matches(
            p.prosrc,
            '''((?:entity|project|nomination)\.edit_[a-z_]+)''',
            'g'
          ) m
        WHERE
          n.nspname = 'public'
          AND p.proname = 'storage_path_can'
      ),
      (
        SELECT
          count(*)
        FROM
          (
            SELECT
              m[1] AS perm
            FROM
              pg_proc p
              JOIN pg_namespace n ON n.oid = p.pronamespace,
              LATERAL regexp_matches(
                p.prosrc,
                '''((?:entity|project|nomination)\.read_[a-z_]+)''',
                'g'
              ) m
            WHERE
              n.nspname = 'public'
              AND p.proname = 'storage_path_can'
            INTERSECT
            SELECT
              m[1]
            FROM
              pg_proc p
              JOIN pg_namespace n ON n.oid = p.pronamespace,
              LATERAL regexp_matches(
                p.prosrc,
                '''((?:entity|project|nomination)\.edit_[a-z_]+)''',
                'g'
              ) m
            WHERE
              n.nspname = 'public'
              AND p.proname = 'storage_path_can'
          ) x
      )
    ],
    ARRAY[1::bigint, 3::bigint, 6::bigint, 0::bigint],
    'K2 structural: storage_path_can references its verb argument and resolves 3 read permissions and 6 write permissions with an EMPTY intersection -- the verb changes which question is asked'
  );

SELECT
  reset_role ();

SELECT
  *
FROM
  finish ();

ROLLBACK;
