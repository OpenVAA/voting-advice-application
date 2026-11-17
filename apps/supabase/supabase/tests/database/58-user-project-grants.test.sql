-- 58-user-project-grants.test.sql: which of the caller's grants count in a project
--
-- `get_user_project_grants (p_project_id)` answers the caller's own rows of public.grants that reach the project by `private.grant_reaches_project`: a project-scope grant on it, an entity-scope grant on one of its entities, any global-scope grant and an account-scope grant on its account, whatever the role. Each entry carries `scope`, `target_type`, `target_id` and `role`. A grant on another project, on another project's entity or on another account is left out; a null project, a caller with no grant and a deleted grant answer the empty array. `anon` may not execute it.
--
-- Every assertion's description begins with `UPG: `. The fixture's whole authority map is written once, and every identity is impersonated with no rows of its own, so each answer is read from the table alone.
--
-- Depends on:
-- - 00-helpers.test.sql (create_test_data, test_id, test_user_id, test_user_grants, test_seed_fixture_grants, set_test_user, reset_role)
-- - 301-auth-functions.sql (the function and private.grant_reaches_project)
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (17);

-- Create test fixture data
SELECT
  create_test_data ();

SELECT
  test_seed_fixture_grants ();

-- admin_a also edits organization B, in project B. admin_b also holds a global editor grant, which opens no app and carries no permission.
INSERT INTO
  public.grants (user_id, scope, target_type, target_id, role)
VALUES
  (
    test_user_id ('admin_a'),
    'entity',
    'organization',
    test_id ('org_b'),
    'editor'
  ),
  (
    test_user_id ('admin_b'),
    'global',
    NULL,
    NULL,
    'editor'
  );

-- A project admin.
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

SELECT
  is (
    get_user_project_grants (test_id ('project_a')),
    test_user_grants ('admin_a'),
    'UPG: a project admin holds its project grant in its own project, and not its editor grant on another project''s organization'
  );

SELECT
  is (
    get_user_project_grants (test_id ('project_b')),
    jsonb_build_array(
      jsonb_build_object(
        'scope',
        'entity',
        'target_type',
        'organization',
        'target_id',
        test_id ('org_b'),
        'role',
        'editor'
      )
    ),
    'UPG: in the other project the same user holds only the editor grant on that project''s organization'
  );

SELECT
  is (
    get_user_project_grants (NULL),
    '[]'::jsonb,
    'UPG: a null project answers the empty array'
  );

SELECT
  is (
    get_user_project_grants (gen_random_uuid()),
    '[]'::jsonb,
    'UPG: a project that does not exist answers the empty array for a caller with no global grant'
  );

-- A global admin, and the project B admin who also holds a global editor grant.
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('super_admin'),
    '[]'::jsonb
  );

SELECT
  is (
    get_user_project_grants (test_id ('project_b')),
    test_user_grants ('super_admin'),
    'UPG: a global admin''s grant counts in every project'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_b'),
    '[]'::jsonb
  );

SELECT
  is (
    get_user_project_grants (test_id ('project_a')),
    jsonb_build_array(
      jsonb_build_object(
        'scope',
        'global',
        'target_type',
        NULL,
        'target_id',
        NULL,
        'role',
        'editor'
      )
    ),
    'UPG: a global editor grant counts in a project whatever its role, and a project grant on another project does not'
  );

SELECT
  is (
    jsonb_array_length(get_user_project_grants (test_id ('project_b'))),
    2,
    'UPG: in its own project the same user holds both its project grant and its global grant'
  );

-- An account admin.
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('account_admin_a'),
    '[]'::jsonb
  );

SELECT
  is (
    get_user_project_grants (test_id ('project_a')),
    test_user_grants ('account_admin_a'),
    'UPG: an account grant counts in a project of that account'
  );

SELECT
  is (
    get_user_project_grants (test_id ('project_b')),
    '[]'::jsonb,
    'UPG: an account grant does not count in a project of another account'
  );

-- Entity editors.
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    '[]'::jsonb
  );

SELECT
  is (
    get_user_project_grants (test_id ('project_a')),
    test_user_grants ('candidate_a'),
    'UPG: a candidate''s editor grant counts in the candidate''s project'
  );

SELECT
  is (
    get_user_project_grants (test_id ('project_b')),
    '[]'::jsonb,
    'UPG: a candidate''s editor grant does not count in another project'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('organization_a'),
    '[]'::jsonb
  );

SELECT
  is (
    get_user_project_grants (test_id ('project_a')),
    test_user_grants ('organization_a'),
    'UPG: an organization''s editor grant counts in the organization''s project'
  );

-- A grant counts while it is in the table, and stops counting once it is deleted.
SELECT
  reset_role ();

INSERT INTO
  public.grants (user_id, scope, target_type, target_id, role)
VALUES
  (
    test_user_id ('candidate_b'),
    'account',
    NULL,
    test_id ('account_a'),
    'editor'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_b'),
    '[]'::jsonb
  );

SELECT
  is (
    get_user_project_grants (test_id ('project_a')),
    jsonb_build_array(
      jsonb_build_object(
        'scope',
        'account',
        'target_type',
        NULL,
        'target_id',
        test_id ('account_a'),
        'role',
        'editor'
      )
    ),
    'UPG: a grant written after the session began counts at once, and an account editor grant counts whatever its role'
  );

SELECT
  reset_role ();

DELETE FROM public.grants
WHERE
  user_id = test_user_id ('candidate_b')
  AND scope = 'account';

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_b'),
    '[]'::jsonb
  );

SELECT
  is (
    get_user_project_grants (test_id ('project_a')),
    '[]'::jsonb,
    'UPG: a deleted grant stops counting at once'
  );

-- No caller, and the privileges.
SELECT
  reset_role ();

SELECT
  ok (
    NOT has_function_privilege(
      'anon',
      'public.get_user_project_grants(uuid)',
      'EXECUTE'
    ),
    'UPG: anon may not execute the function'
  );

SELECT
  ok (
    has_function_privilege(
      'authenticated',
      'public.get_user_project_grants(uuid)',
      'EXECUTE'
    ),
    'UPG: authenticated may execute the function'
  );

SELECT
  ok (
    NOT has_function_privilege(
      'authenticated',
      'private.grant_reaches_project(public.grant_scope_type, public.entity_type, uuid, uuid)',
      'EXECUTE'
    ),
    'UPG: no API role may execute the reach rule itself'
  );

SELECT
  *
FROM
  finish ();

ROLLBACK;
