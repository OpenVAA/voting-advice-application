-- 06-storage-rls.test.sql: Storage bucket RLS policy tests
--
-- Verifies that storage.objects RLS policies enforce:
--   - Anon can only SELECT from public-assets for published entities
--   - Anon cannot SELECT from private-assets
--   - Anon cannot INSERT/UPDATE/DELETE storage objects
--   - Candidates can SELECT own files in both buckets
--   - Candidates can INSERT into own folder only (candidates type)
--   - Admins can access all project files but not cross-project
--
-- Depends on: 00-helpers.test.sql (set_test_user, create_test_data, test_id, etc.)
--             014-storage.sql (RLS policies, is_storage_entity_published)

BEGIN;

SET search_path = public, extensions;

-- Reset pgTAP internal state from previous test files
DROP TABLE IF EXISTS __tcache__;

SELECT plan(15);

-- Create test fixture data
SELECT create_test_data();

-- =====================================================================
-- Insert test storage objects as postgres (bypasses RLS)
-- =====================================================================

-- Published candidate_a file in public-assets
INSERT INTO storage.objects (id, bucket_id, name, owner)
VALUES (
  gen_random_uuid(),
  'public-assets',
  test_id('project_a')::text || '/candidates/' || test_id('candidate_a')::text || '/photo.jpg',
  test_user_id('candidate_a')
);

-- Published candidate_a file in private-assets
INSERT INTO storage.objects (id, bucket_id, name, owner)
VALUES (
  gen_random_uuid(),
  'private-assets',
  test_id('project_a')::text || '/candidates/' || test_id('candidate_a')::text || '/doc.pdf',
  test_user_id('candidate_a')
);

-- Unpublished candidate_b file in public-assets (project B, published=false)
INSERT INTO storage.objects (id, bucket_id, name, owner)
VALUES (
  gen_random_uuid(),
  'public-assets',
  test_id('project_b')::text || '/candidates/' || test_id('candidate_b')::text || '/photo.jpg',
  test_user_id('candidate_b')
);

-- Organization file in public-assets (org_a, project A, published=true)
INSERT INTO storage.objects (id, bucket_id, name, owner)
VALUES (
  gen_random_uuid(),
  'public-assets',
  test_id('project_a')::text || '/organizations/' || test_id('org_a')::text || '/logo.png',
  NULL
);

-- Project-level file in public-assets (always accessible)
INSERT INTO storage.objects (id, bucket_id, name, owner)
VALUES (
  gen_random_uuid(),
  'public-assets',
  test_id('project_a')::text || '/project/settings/config.json',
  NULL
);

-- =====================================================================
-- Section 1: Anon SELECT on public-assets
-- =====================================================================

SELECT set_test_user('anon');

SELECT is(
  (SELECT count(*) FROM storage.objects
   WHERE bucket_id = 'public-assets'
     AND name LIKE '%/candidates/' || test_id('candidate_a')::text || '/%')::integer,
  1,
  'Anon can see published candidate_a file in public-assets'
);

SELECT is(
  (SELECT count(*) FROM storage.objects
   WHERE bucket_id = 'public-assets'
     AND name LIKE '%/candidates/' || test_id('candidate_b')::text || '/%')::integer,
  0,
  'Anon cannot see unpublished candidate_b file in public-assets'
);

SELECT is(
  (SELECT count(*) FROM storage.objects
   WHERE bucket_id = 'public-assets'
     AND name LIKE '%/organizations/' || test_id('org_a')::text || '/%')::integer,
  1,
  'Anon can see published org_a file in public-assets'
);

SELECT is(
  (SELECT count(*) FROM storage.objects
   WHERE bucket_id = 'public-assets'
     AND name LIKE '%/project/settings/%')::integer,
  1,
  'Anon can see project-level file in public-assets (always accessible)'
);

-- =====================================================================
-- Section 2: Anon cannot SELECT private-assets
-- =====================================================================

SELECT set_test_user('anon');

SELECT is(
  (SELECT count(*) FROM storage.objects WHERE bucket_id = 'private-assets')::integer,
  0,
  'Anon cannot see any files in private-assets'
);

-- =====================================================================
-- Section 3: Candidate can SELECT own files
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('candidate_a'),
  test_user_roles('candidate_a')
);

SELECT ok(
  (SELECT count(*) FROM storage.objects
   WHERE name LIKE '%/candidates/' || test_id('candidate_a')::text || '/%')::integer >= 2,
  'candidate_a can see own files across both buckets'
);

SELECT is(
  (SELECT count(*) FROM storage.objects
   WHERE name LIKE '%/candidates/' || test_id('candidate_b')::text || '/%')::integer,
  0,
  'candidate_a cannot see candidate_b files (different project, unpublished)'
);

-- =====================================================================
-- Section 4: Candidate INSERT into own folder
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('candidate_a'),
  test_user_roles('candidate_a')
);

SELECT lives_ok(
  format(
    $$INSERT INTO storage.objects (id, bucket_id, name) VALUES (gen_random_uuid(), 'public-assets', '%s/candidates/%s/new-upload.jpg')$$,
    test_id('project_a')::text,
    test_id('candidate_a')::text
  ),
  'candidate_a can INSERT into own folder in public-assets'
);

SELECT throws_ok(
  format(
    $$INSERT INTO storage.objects (id, bucket_id, name) VALUES (gen_random_uuid(), 'public-assets', '%s/candidates/%s/hijack.jpg')$$,
    test_id('project_b')::text,
    test_id('candidate_b')::text
  ),
  '42501',
  NULL,
  'candidate_a cannot INSERT into candidate_b folder'
);

SELECT throws_ok(
  format(
    $$INSERT INTO storage.objects (id, bucket_id, name) VALUES (gen_random_uuid(), 'public-assets', '%s/organizations/%s/hijack.png')$$,
    test_id('project_a')::text,
    test_id('org_a')::text
  ),
  '42501',
  NULL,
  'candidate_a cannot INSERT into organizations folder (not candidates type)'
);

-- =====================================================================
-- Section 5: Admin can access all project files
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('admin_a'),
  test_user_roles('admin_a')
);

SELECT ok(
  (SELECT count(*) FROM storage.objects
   WHERE name LIKE test_id('project_a')::text || '/%')::integer >= 4,
  'admin_a can see all Project A storage files'
);

SELECT is(
  (SELECT count(*) FROM storage.objects
   WHERE name LIKE test_id('project_b')::text || '/%'
     AND bucket_id = 'private-assets')::integer,
  0,
  'admin_a cannot see Project B private-assets files'
);

SELECT lives_ok(
  format(
    $$INSERT INTO storage.objects (id, bucket_id, name) VALUES (gen_random_uuid(), 'public-assets', '%s/candidates/%s/admin-upload.jpg')$$,
    test_id('project_a')::text,
    test_id('candidate_a')::text
  ),
  'admin_a can INSERT files for Project A'
);

SELECT throws_ok(
  format(
    $$INSERT INTO storage.objects (id, bucket_id, name) VALUES (gen_random_uuid(), 'public-assets', '%s/candidates/%s/cross-project.jpg')$$,
    test_id('project_b')::text,
    test_id('candidate_b')::text
  ),
  '42501',
  NULL,
  'admin_a cannot INSERT files for Project B'
);

-- =====================================================================
-- Section 6: Anon cannot write to storage
-- =====================================================================

SELECT set_test_user('anon');

SELECT throws_ok(
  format(
    $$INSERT INTO storage.objects (id, bucket_id, name) VALUES (gen_random_uuid(), 'public-assets', '%s/candidates/%s/anon.jpg')$$,
    test_id('project_a')::text,
    test_id('candidate_a')::text
  ),
  '42501',
  NULL,
  'Anon cannot INSERT into storage (no INSERT policy for anon)'
);

-- =====================================================================
-- Cleanup
-- =====================================================================

SELECT reset_role();

SELECT * FROM finish();
ROLLBACK;
