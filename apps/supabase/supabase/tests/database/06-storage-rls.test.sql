-- 06-storage-rls.test.sql: Storage bucket RLS policy tests
--
-- Verifies that storage.objects RLS policies enforce: - Anon can only SELECT from public-assets for anon-visible entities - Anon cannot SELECT from private-assets - Anon cannot INSERT/UPDATE/DELETE storage objects - Entity grantees can SELECT own files in both buckets - Entity grantees can INSERT into their OWN entity folder only, whatever the entity type - Project grantees can access all project files but not cross-project
--
-- ⚠ 162-14 CONVERTED EVERY POLICY THIS FILE EXERCISES, and two of the assertions below kept their green while losing their REASON. Both reasons are re-expressed in place; neither assertion's claim or direction moved, and none was deleted.
--   - the organizations-folder refusal used to hold because the type path segment was hardcoded to `candidates`. It now holds because org_a is not that caller's entity -- so it is PAIRED with the positive the generalisation creates, an organization grantee writing into that same folder and succeeding, which no policy in this file has ever permitted.
--   - the project-level file used to be "always accessible". It is now gated on the project being open for voters, which project A is. 20-storage-authority.test.sql asserts the closed direction.
--
-- Depends on: 00-helpers.test.sql (set_test_user, create_test_data, test_id, etc.)
--             400-storage.sql (RLS policies, storage_path_can, storage_path_is_public)
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (19);

-- Create test fixture data
SELECT
  create_test_data ();

-- =====================================================================
-- Insert test storage objects as postgres (bypasses RLS)
-- =====================================================================
-- Published candidate_a file in public-assets
INSERT INTO
  storage.objects (id, bucket_id, name, owner)
VALUES
  (
    gen_random_uuid(),
    'public-assets',
    test_id ('project_a')::text || '/candidates/' || test_id ('candidate_a')::text || '/photo.jpg',
    test_user_id ('candidate_a')
  );

-- Published candidate_a file in private-assets
INSERT INTO
  storage.objects (id, bucket_id, name, owner)
VALUES
  (
    gen_random_uuid(),
    'private-assets',
    test_id ('project_a')::text || '/candidates/' || test_id ('candidate_a')::text || '/doc.pdf',
    test_user_id ('candidate_a')
  );

-- Hidden candidate_b file in public-assets (project B: unconfirmed candidate, project closed to voters)
INSERT INTO
  storage.objects (id, bucket_id, name, owner)
VALUES
  (
    gen_random_uuid(),
    'public-assets',
    test_id ('project_b')::text || '/candidates/' || test_id ('candidate_b')::text || '/photo.jpg',
    test_user_id ('candidate_b')
  );

-- Organization file in public-assets (org_a, project A: open for voters, confirmed, nominated)
INSERT INTO
  storage.objects (id, bucket_id, name, owner)
VALUES
  (
    gen_random_uuid(),
    'public-assets',
    test_id ('project_a')::text || '/organizations/' || test_id ('org_a')::text || '/logo.png',
    NULL
  );

-- Project-level file in public-assets (anon-readable while project A is open for voters)
INSERT INTO
  storage.objects (id, bucket_id, name, owner)
VALUES
  (
    gen_random_uuid(),
    'public-assets',
    test_id ('project_a')::text || '/project/settings/config.json',
    NULL
  );

-- Added by 162-14: the two entity types this file never covered, and one project-structure path.
-- The six entity-owner policies hardcoded `candidates`, so factions, alliances and every structure family were reachable at project scope only; the conversion makes the type segment an argument and these rows are what makes that observable rather than merely claimed. faction_a and alliance_a are confirmed and carry confirmed nominations in project A, which is open for voters.
INSERT INTO
  storage.objects (id, bucket_id, name, owner)
VALUES
  (
    gen_random_uuid(),
    'public-assets',
    test_id ('project_a')::text || '/factions/' || test_id ('faction_a')::text || '/logo.png',
    NULL
  ),
  (
    gen_random_uuid(),
    'public-assets',
    test_id ('project_a')::text || '/alliances/' || test_id ('alliance_a')::text || '/logo.png',
    NULL
  ),
  (
    gen_random_uuid(),
    'public-assets',
    test_id ('project_a')::text || '/elections/' || test_id ('election_a')::text || '/banner.png',
    NULL
  );

-- =====================================================================
-- Section 1: Anon SELECT on public-assets
-- =====================================================================
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
        AND name LIKE '%/candidates/' || test_id ('candidate_a')::text || '/%'
    )::integer,
    1,
    'Anon can see the publicly visible candidate_a file in public-assets'
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
        AND name LIKE '%/candidates/' || test_id ('candidate_b')::text || '/%'
    )::integer,
    0,
    'Anon cannot see the hidden candidate_b file in public-assets'
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
        AND name LIKE '%/organizations/' || test_id ('org_a')::text || '/%'
    )::integer,
    1,
    'Anon can see the publicly visible org_a file in public-assets'
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
        AND name LIKE '%/project/settings/%'
    )::integer,
    1,
    'Anon can see project-level file in public-assets (project A is open for voters)'
  );

-- =====================================================================
-- Section 2: Anon cannot SELECT private-assets
-- =====================================================================
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
    'Anon cannot see any files in private-assets'
  );

-- =====================================================================
-- Section 3: Candidate can SELECT own files
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        storage.objects
      WHERE
        name LIKE '%/candidates/' || test_id ('candidate_a')::text || '/%'
    )::integer >= 2,
    'candidate_a can see own files across both buckets'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        storage.objects
      WHERE
        name LIKE '%/candidates/' || test_id ('candidate_b')::text || '/%'
    )::integer,
    0,
    'candidate_a cannot see candidate_b files (different project, closed to voters)'
  );

-- =====================================================================
-- Section 4: Candidate INSERT into own folder
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO storage.objects (id, bucket_id, name) VALUES (gen_random_uuid(), 'public-assets', '%s/candidates/%s/new-upload.jpg')$$,
      test_id ('project_a')::text,
      test_id ('candidate_a')::text
    ),
    'candidate_a can INSERT into own folder in public-assets'
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO storage.objects (id, bucket_id, name) VALUES (gen_random_uuid(), 'public-assets', '%s/candidates/%s/hijack.jpg')$$,
      test_id ('project_b')::text,
      test_id ('candidate_b')::text
    ),
    '42501',
    NULL,
    'candidate_a cannot INSERT into candidate_b folder'
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO storage.objects (id, bucket_id, name) VALUES (gen_random_uuid(), 'public-assets', '%s/organizations/%s/hijack.png')$$,
      test_id ('project_a')::text,
      test_id ('org_a')::text
    ),
    '42501',
    NULL,
    'candidate_a cannot INSERT into organizations folder (org_a is not this caller entity)'
  );

-- THE POSITIVE THE REFUSAL ABOVE IS NOW PAIRED WITH. Under the old predicate the organizations folder was closed to EVERYONE holding an entity grant, its own grantee included, because the type segment was hardcoded. The refusal above and this allow are the same folder with two different callers, which is what turns "candidates only" into "this caller's own entity, whatever its type".
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('organization_a'),
    test_user_grants ('organization_a')
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO storage.objects (id, bucket_id, name) VALUES (gen_random_uuid(), 'public-assets', '%s/organizations/%s/org-upload.png')$$,
      test_id ('project_a')::text,
      test_id ('org_a')::text
    ),
    'organization_a CAN INSERT into its own organizations folder (the positive the generalisation creates)'
  );

-- =====================================================================
-- Section 5: Admin can access all project files
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    test_user_grants ('admin_a')
  );

SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        storage.objects
      WHERE
        name LIKE test_id ('project_a')::text || '/%'
    )::integer >= 4,
    'admin_a can see all Project A storage files'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        storage.objects
      WHERE
        name LIKE test_id ('project_b')::text || '/%'
        AND bucket_id = 'private-assets'
    )::integer,
    0,
    'admin_a cannot see Project B private-assets files'
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO storage.objects (id, bucket_id, name) VALUES (gen_random_uuid(), 'public-assets', '%s/candidates/%s/admin-upload.jpg')$$,
      test_id ('project_a')::text,
      test_id ('candidate_a')::text
    ),
    'admin_a can INSERT files for Project A'
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO storage.objects (id, bucket_id, name) VALUES (gen_random_uuid(), 'public-assets', '%s/candidates/%s/cross-project.jpg')$$,
      test_id ('project_b')::text,
      test_id ('candidate_b')::text
    ),
    '42501',
    NULL,
    'admin_a cannot INSERT files for Project B'
  );

-- =====================================================================
-- Section 6: Anon cannot write to storage
-- =====================================================================
SELECT
  set_test_user ('anon');

SELECT
  throws_ok (
    format(
      $$INSERT INTO storage.objects (id, bucket_id, name) VALUES (gen_random_uuid(), 'public-assets', '%s/candidates/%s/anon.jpg')$$,
      test_id ('project_a')::text,
      test_id ('candidate_a')::text
    ),
    '42501',
    NULL,
    'Anon cannot INSERT into storage (no INSERT policy for anon)'
  );

-- =====================================================================
-- Section 7: the path families this file never covered (162-14)
--
-- Anon coverage for the two entity types with no fixture user and for one project-structure family.
-- The behavioural half of the entity-scope grid is asserted on candidates and organizations, which are the only types create_test_data() gives users; factions and alliances are covered here on the READ side and structurally in 20-storage-authority.test.sql, whose normalised-identity assertion proves their policies are the same expression as the two that are exercised.
-- =====================================================================
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
        AND name LIKE '%/factions/' || test_id ('faction_a')::text || '/%'
    )::integer,
    1,
    'Anon can see faction_a file in public-assets (confirmed, confirmed nomination, open project)'
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
        AND name LIKE '%/alliances/' || test_id ('alliance_a')::text || '/%'
    )::integer,
    1,
    'Anon can see alliance_a file in public-assets (confirmed, confirmed nomination, open project)'
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
        AND name LIKE '%/elections/' || test_id ('election_a')::text || '/%'
    )::integer,
    1,
    'Anon can see a project-structure asset while its project is open for voters'
  );

-- =====================================================================
-- Cleanup
-- =====================================================================
SELECT
  reset_role ();

SELECT
  *
FROM
  finish ();

ROLLBACK;
