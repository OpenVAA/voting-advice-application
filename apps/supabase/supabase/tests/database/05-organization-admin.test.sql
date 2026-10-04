-- 05-organization-admin.test.sql: Organization admin scope tests
--
-- Verifies that an organization admin (an `(entity, organization, org_a, editor)` grant) can read and update their own organization, see their organization's candidates, but cannot insert/delete organizations, modify candidates, or access admin-only tables.
--
-- Organization admin access patterns (from 302-rls.sql):
-- - organizations SELECT and candidates SELECT (`authenticated_select_*`): `user_can('project', project_id, 'project.read_entities')` OR the public disjunct `project_open_for_voters(project_id) AND confirmed AND entity_has_confirmed_nomination(<type>, id, project_id)`, assembled in the qual, OR `user_can('entity', id, 'entity.read_answers', <type>)`. The two predicates are one expression modulo the table name, the entity-type literal and the two terms-of-use conjuncts only `candidates` carries.
-- - A nominating parent reads its child's basic data through `get_entity_basic_data` (503-entity-rpcs.sql) and never through a row policy, because a row policy discloses the whole row, answers included. Section 5c asserts both halves.
-- - organizations UPDATE (`entity_update_own_organizations`): `user_can('entity', id, 'entity.edit_answers', 'organization')`.
-- - organizations INSERT/DELETE and all `admin_*` policies: `user_can('project', project_id, 'project.edit_entities')`, which an organization grantee does not hold.
-- - candidates UPDATE: only `entity_update_own_candidates` or `admin_update_candidates`; no organization UPDATE path reaches a candidate row.
--
-- Depends on: 00-helpers.test.sql (set_test_user, create_test_data, test_id, etc.)
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (22);

-- Create test fixture data
SELECT
  create_test_data ();

-- =====================================================================
-- Section 1: Organization admin can read own organization
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('organization_a'),
    test_user_grants ('organization_a')
  );

-- organization_a holds one grant, (entity, organization, org_a, editor); the organizations SELECT policy reaches it through user_can, whose entity-scope reach is equality with the granted entity
SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        organizations
      WHERE
        id = test_id ('org_a')
    )::integer,
    1,
    'organization_admin can SELECT own organization'
  );

-- Organization admin can also see the publicly visible organizations of its project. org_a is confirmed and nominated in a project open for voters, so verify it appears.
SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        organizations
    )::integer >= 1,
    'organization_admin can see publicly visible organizations'
  );

-- =====================================================================
-- Section 2: Organization admin can update own organization (allowed columns)
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('organization_a'),
    test_user_grants ('organization_a')
  );

-- Column-level GRANT on organizations allows: name, short_name, info, color, image, subtype, custom_data, answers and confirmed. See 303-column-grants.sql, and 09-column-restrictions.test.sql, which asserts the granted count.
SELECT
  lives_ok (
    format(
      $$UPDATE organizations SET short_name = '{"en":"Updated"}'::jsonb WHERE id = '%s'$$,
      test_id ('org_a')
    ),
    'organization_admin can UPDATE short_name on own organization'
  );

-- Verify the update took effect
SELECT
  is (
    (
      SELECT
        short_name ->> 'en'
      FROM
        organizations
      WHERE
        id = test_id ('org_a')
    ),
    'Updated',
    'organization_admin UPDATE on own organization actually changed data'
  );

-- =====================================================================
-- Section 3: Organization admin cannot update other organizations
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('organization_a'),
    test_user_grants ('organization_a')
  );

-- org_b is in project B, which is unpublished, and organization_a holds no grant on it, so the UPDATE affects 0 rows.
SELECT
  lives_ok (
    format(
      $$UPDATE organizations SET short_name = '{"en":"Hacked"}'::jsonb WHERE id = '%s'$$,
      test_id ('org_b')
    ),
    'organization_admin UPDATE on other org does not raise error'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        short_name
      FROM
        organizations
      WHERE
        id = test_id ('org_b')
    ),
    NULL,
    'organization_admin UPDATE on other org had no effect (short_name still NULL)'
  );

-- =====================================================================
-- Section 4: Organization admin cannot INSERT or DELETE organizations
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('organization_a'),
    test_user_grants ('organization_a')
  );

-- INSERT: the organizations INSERT policy requires project-level authority (admin-only) and organization_a holds an entity grant and no project, account or global one
SELECT
  throws_ok (
    format(
      $$INSERT INTO organizations (id, project_id, name) VALUES (gen_random_uuid(), '%s', '{"en":"Organization Admin Created Org"}')$$,
      test_id ('project_a')
    ),
    '42501',
    NULL,
    'organization_admin cannot INSERT organizations (admin-only INSERT policy)'
  );

-- DELETE: the organizations DELETE policy requires project-level authority (admin-only). Even though organization_a can see org_a, the DELETE affects 0 rows, because no DELETE policy admits an entity grantee.
SELECT
  lives_ok (
    format(
      $$DELETE FROM organizations WHERE id = '%s'$$,
      test_id ('org_a')
    ),
    'organization_admin DELETE on own org does not raise error'
  );

SELECT
  reset_role ();

SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        organizations
      WHERE
        id = test_id ('org_a')
    )::integer = 1,
    'organization_admin DELETE on own org had no effect (record still exists)'
  );

-- =====================================================================
-- Section 5: Organization admin can see their organization's candidates
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('organization_a'),
    test_user_grants ('organization_a')
  );

-- The organization admin sees the publicly visible candidates of its own project.
SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        candidates
      WHERE
        id IN (test_id ('candidate_a'), test_id ('candidate_a2'))
    )::integer >= 1,
    'organization_admin can see the publicly visible candidates of its own project'
  );

-- candidate_a is admitted by the public disjunct: project A is open for voters, and candidate_a and its nomination are confirmed. candidate_a2 has no nomination, so nothing admits it; 16-anon-visibility.test.sql asserts the same for anon (`anon CANNOT see candidate_a2`).
--
-- The assertion names which row is visible, so it fails both if candidate_a disappears and if the read widens into a project-wide one that admits candidate_a2.
SELECT
  is (
    (
      SELECT
        string_agg(
          first_name,
          ','
          ORDER BY
            first_name
        )
      FROM
        candidates
      WHERE
        id IN (test_id ('candidate_a'), test_id ('candidate_a2'))
    ),
    'Alice',
    'organization_admin sees candidate_a, its child nominee, and not candidate_a2, which has no nomination'
  );

-- =====================================================================
-- Section 5b: TEST A -- a non-public candidate outside the caller's nomination hierarchy is invisible
-- =====================================================================
-- TEST A. A candidate that is not publicly visible, is not the caller's own record and is not nominated under the caller's nomination has only the project disjunct left, and an organization grantee holds no project authority, so the row is invisible. Section 5c uses it as the control that bounds the nomination-hierarchy reach.
SELECT
  reset_role ();

INSERT INTO
  candidates (id, project_id, first_name, last_name, confirmed)
VALUES
  (
    'ffffffff-ffff-ffff-ffff-000000000001'::uuid,
    test_id ('project_a'),
    'Nadia',
    'Negative',
    false
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('organization_a'),
    test_user_grants ('organization_a')
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        candidates
      WHERE
        id = 'ffffffff-ffff-ffff-ffff-000000000001'::uuid
    )::integer,
    0,
    'TEST A: an organization-role caller cannot see a non-public candidate in its own project'
  );

-- =====================================================================
-- Section 5c: TEST C -- a nominating parent's reach to its child, and the control that bounds it
-- =====================================================================
-- TEST A above is the control. Nadia is in project A but nominated nowhere, so she is outside organization_a's nomination hierarchy and stays invisible, which proves the parent reach is not a project-wide read.
--
-- TEST C is the subject. Nora is unconfirmed and nominated under organization_a's own nomination, and her row is refused, because a row policy would return the whole row (answers, terms_of_use_accepted, custom_data) to her parent's editor. Her basic data is served by `get_entity_basic_data`, which asks the same `user_can` question and returns an allow-listed projection; the assertions below cover both halves and a non-parent control.
SELECT
  reset_role ();

INSERT INTO
  candidates (id, project_id, first_name, last_name, confirmed)
VALUES
  (
    'ffffffff-ffff-ffff-ffff-000000000002'::uuid,
    test_id ('project_a'),
    'Nora',
    'Nominee',
    false
  );

INSERT INTO
  nominations (
    id,
    project_id,
    candidate_id,
    election_id,
    constituency_id,
    election_round,
    parent_nomination_id
  )
VALUES
  (
    'ffffffff-ffff-ffff-ffff-000000000102'::uuid,
    test_id ('project_a'),
    'ffffffff-ffff-ffff-ffff-000000000002'::uuid,
    test_id ('election_a'),
    test_id ('constituency_a'),
    1,
    test_id ('nomination_org_a')
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('organization_a'),
    test_user_grants ('organization_a')
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        candidates
      WHERE
        id = 'ffffffff-ffff-ffff-ffff-000000000002'::uuid
    )::integer,
    0,
    'TEST C: an organization-role caller CANNOT SELECT the row of a non-public, unconfirmed candidate nominated under its own nomination -- a row policy would disclose the whole row, answers included'
  );

-- The reach itself survives, as a column projection: get_entity_basic_data answers the parent with the child's basic data and WITHOUT the answers, terms_of_use_accepted or custom_data keys.
SELECT
  ok (
    (
      SELECT
        r ->> 'first_name' = 'Nora'
        AND NOT (r ? 'answers')
        AND NOT (r ? 'terms_of_use_accepted')
        AND NOT (r ? 'custom_data')
      FROM
        get_entity_basic_data (
          'candidate',
          'ffffffff-ffff-ffff-ffff-000000000002'::uuid
        ) AS r
    ),
    'TEST C: the nominating parent reads the child''s BASIC data through get_entity_basic_data, and that projection carries no answers'
  );

-- The reach is the parent's and not everyone's. The same row, asked of a caller holding an entity grant on a DIFFERENT organization in a different project: is_child_nominee answers false, nothing else admits the row, and without this an `is_child_nominee` that ignored its parent argument would satisfy TEST C.
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_b'),
    test_user_grants ('candidate_b')
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        candidates
      WHERE
        id = 'ffffffff-ffff-ffff-ffff-000000000002'::uuid
    )::integer,
    0,
    'TEST C paired opposite: an entity grantee that is NOT this candidate''s nominating parent cannot see the same row'
  );

SELECT
  ok (
    get_entity_basic_data (
      'candidate',
      'ffffffff-ffff-ffff-ffff-000000000002'::uuid
    ) IS NULL,
    'TEST C paired opposite: get_entity_basic_data answers NULL to an entity grantee that is NOT this candidate''s nominating parent'
  );

SELECT
  reset_role ();

-- TEST B. The candidates SELECT qual delegates authority to `user_can`, carries no `nomination.read` row reach, and names both public-visibility helpers (`project_open_for_voters`, `entity_has_confirmed_nomination`) directly.
--
-- It also names none of the four predicates the policy must not re-derive (`has_role`, `organization_id`, `can_access_project`, `published`) and no `entity_is_anon_visible` composition, so it fails both if the reach regresses and if one of those mechanisms appears in it.
SELECT
  ok (
    (
      SELECT
        qual LIKE '%user_can%'
        AND qual NOT LIKE '%nomination.read%'
        AND qual LIKE '%project_open_for_voters%'
        AND qual LIKE '%entity_has_confirmed_nomination%'
        AND qual NOT LIKE '%entity_is_anon_visible%'
        AND qual NOT LIKE '%has_role%'
        AND qual NOT LIKE '%organization_id%'
        AND qual NOT LIKE '%can_access_project%'
        AND qual NOT LIKE '%published%'
      FROM
        pg_policies
      WHERE
        tablename = 'candidates'
        AND policyname = 'authenticated_select_candidates'
    ),
    'TEST B: the candidates SELECT qual delegates to user_can, does NOT carry the nomination.read row reach, calls BOTH public-visibility helpers directly, and re-derives none of the four predicates the policy must not name -- nor the entity_is_anon_visible composition'
  );

-- The companion that keeps TEST B from being satisfiable by a policy that simply removed everything: the organizations and candidates SELECT predicates are the same expression modulo the table name, the entity-type literal and the two terms-of-use conjuncts only `candidates` carries.
--
-- The strip cannot be vacuous. The next assertion counts the entity-table SELECT policies whose qual carries the stripped term and pins it at two, `anon_select_candidates` and `authenticated_select_candidates`, so a strip that matched nothing, or a terms-of-use conjunct on another table, fails there.
SELECT
  is (
    (
      SELECT
        replace(
          replace(qual, 'organizations.', 'TBL.'),
          '''organization''',
          'ENT'
        )
      FROM
        pg_policies
      WHERE
        tablename = 'organizations'
        AND policyname = 'authenticated_select_organizations'
    ),
    (
      SELECT
        replace(
          replace(
            replace(qual, 'candidates.', 'TBL.'),
            '''candidate''',
            'ENT'
          ),
          ' AND (terms_of_use_accepted IS NOT NULL) AND (terms_of_use_accepted < now())',
          ''
        )
      FROM
        pg_policies
      WHERE
        tablename = 'candidates'
        AND policyname = 'authenticated_select_candidates'
    ),
    'the organizations and candidates SELECT policies are ONE expression modulo the table name, the entity-type literal and the two terms-of-use conjuncts candidates alone carries'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        pg_policies
      WHERE
        schemaname = 'public'
        AND tablename IN (
          'organizations',
          'candidates',
          'factions',
          'alliances'
        )
        AND cmd = 'SELECT'
        AND COALESCE(qual, '') LIKE '% AND (terms_of_use_accepted IS NOT NULL) AND (terms_of_use_accepted < now())%'
    ),
    2,
    'the term the assertion above strips is carried by EXACTLY the two candidates SELECT policies -- so the strip removed something real, and no other entity table acquired a terms-of-use conjunct'
  );

-- =====================================================================
-- Section 6: Organization admin cannot modify candidates
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('organization_a'),
    test_user_grants ('organization_a')
  );

-- candidates UPDATE admits only `entity_update_own_candidates` and `admin_update_candidates`, and neither admits an organization grantee, so the UPDATE affects 0 rows.
SELECT
  lives_ok (
    format(
      $$UPDATE candidates SET first_name = 'Hacked' WHERE project_id = '%s'$$,
      test_id ('project_a')
    ),
    'organization_admin UPDATE on own org candidates does not raise error'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        first_name
      FROM
        candidates
      WHERE
        id = test_id ('candidate_a')
    ),
    'Alice',
    'organization_admin UPDATE on candidates had no effect (first_name unchanged)'
  );

-- =====================================================================
-- Section 7: Organization admin cannot access admin-only tables
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('organization_a'),
    test_user_grants ('organization_a')
  );

-- accounts: requires an account-scope or global admin grant
SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        accounts
    )::integer,
    0,
    'organization_admin cannot SELECT accounts (admin-only)'
  );

-- Reset role for cleanup
SELECT
  reset_role ();

SELECT
  *
FROM
  finish ();

ROLLBACK;
