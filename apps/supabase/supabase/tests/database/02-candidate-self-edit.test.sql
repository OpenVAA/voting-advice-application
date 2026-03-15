-- 02-candidate-self-edit.test.sql: QUAL-02 candidate own-record access
--
-- Verifies that a candidate can read and update their own record,
-- cannot read/update/insert/delete other candidates' records, and
-- can see published data from their own project.
--
-- Depends on: 00-helpers.test.sql (set_test_user, create_test_data, test_id, etc.)

BEGIN;

SET search_path = public, extensions;

-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;

SELECT plan(15);

-- Create test fixture data
SELECT create_test_data();

-- =====================================================================
-- Section 1: Candidate can SELECT own record
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('candidate_a'),
  test_user_roles('candidate_a')
);

SELECT is(
  (SELECT count(*) FROM candidates WHERE id = test_id('candidate_a'))::integer,
  1,
  'candidate_a can SELECT own record'
);

SELECT is(
  (SELECT count(*) FROM candidates WHERE id = test_id('candidate_b'))::integer,
  0,
  'candidate_a cannot see candidate_b (different project)'
);

-- =====================================================================
-- Section 2: Candidate can UPDATE own allowed columns
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('candidate_a'),
  test_user_roles('candidate_a')
);

SELECT lives_ok(
  format(
    $$UPDATE candidates SET first_name = 'Updated' WHERE id = '%s'$$,
    test_id('candidate_a')
  ),
  'candidate_a can UPDATE first_name on own record'
);

SELECT is(
  (SELECT first_name FROM candidates WHERE id = test_id('candidate_a')),
  'Updated',
  'candidate_a first_name was actually updated'
);

-- =====================================================================
-- Section 3: Candidate cannot UPDATE another candidate's record
-- (candidate_a2 is in the same project but different auth_user_id)
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('candidate_a'),
  test_user_roles('candidate_a')
);

-- candidate_a can see candidate_a2 (same project, published=true), but cannot update
SELECT lives_ok(
  format(
    $$UPDATE candidates SET first_name = 'Hijacked' WHERE id = '%s'$$,
    test_id('candidate_a2')
  ),
  'candidate_a UPDATE on candidate_a2 does not raise error (but affects 0 rows)'
);

-- Verify candidate_a2's name was not changed
SELECT reset_role();
SELECT is(
  (SELECT first_name FROM candidates WHERE id = test_id('candidate_a2')),
  'Carol',
  'candidate_a2 first_name unchanged after failed update attempt'
);

-- =====================================================================
-- Section 4: Candidate cannot INSERT new candidates
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('candidate_a'),
  test_user_roles('candidate_a')
);

SELECT throws_ok(
  format(
    $$INSERT INTO candidates (id, project_id, first_name, last_name) VALUES (gen_random_uuid(), '%s', 'New', 'Candidate')$$,
    test_id('project_a')
  ),
  '42501',
  NULL,
  'candidate_a cannot INSERT new candidates (no INSERT policy for candidate role)'
);

-- =====================================================================
-- Section 5: Candidate cannot DELETE own record
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('candidate_a'),
  test_user_roles('candidate_a')
);

SELECT lives_ok(
  format(
    $$DELETE FROM candidates WHERE id = '%s'$$,
    test_id('candidate_a')
  ),
  'candidate_a DELETE on own record does not raise error (but affects 0 rows)'
);

-- Verify the record still exists
SELECT reset_role();
SELECT ok(
  (SELECT count(*) FROM candidates WHERE id = test_id('candidate_a'))::integer = 1,
  'candidate_a record still exists after delete attempt'
);

-- =====================================================================
-- Section 6: Candidate can see published data from own project
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('candidate_a'),
  test_user_roles('candidate_a')
);

SELECT ok(
  (SELECT count(*) FROM elections WHERE published = true AND project_id = test_id('project_a'))::integer >= 1,
  'candidate_a can see published elections from own project'
);

SELECT ok(
  (SELECT count(*) FROM questions WHERE published = true AND project_id = test_id('project_a'))::integer >= 1,
  'candidate_a can see published questions from own project'
);

SELECT ok(
  (SELECT count(*) FROM organizations WHERE published = true AND project_id = test_id('project_a'))::integer >= 1,
  'candidate_a can see published organizations from own project'
);

SELECT is(
  (SELECT count(*) FROM elections WHERE project_id = test_id('project_b'))::integer,
  0,
  'candidate_a cannot see Project B elections (unpublished + different project)'
);

-- =====================================================================
-- Section 7: Candidate cannot UPDATE another candidate in different project
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('candidate_a'),
  test_user_roles('candidate_a')
);

SELECT lives_ok(
  format(
    $$UPDATE candidates SET first_name = 'Hijacked' WHERE id = '%s'$$,
    test_id('candidate_b')
  ),
  'candidate_a UPDATE on candidate_b does not raise error (but affects 0 rows)'
);

SELECT reset_role();
SELECT is(
  (SELECT first_name FROM candidates WHERE id = test_id('candidate_b')),
  'Bob',
  'candidate_b first_name unchanged after candidate_a update attempt'
);

-- Reset role for cleanup
SELECT reset_role();

SELECT * FROM finish();
ROLLBACK;
