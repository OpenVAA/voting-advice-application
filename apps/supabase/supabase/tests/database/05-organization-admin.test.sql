-- 05-organization-admin.test.sql: Organization admin scope tests
--
-- Verifies that an organization admin (role=organization, scope_type=organization, scope_id=org_id) can read and update their own organization, see their organization's candidates, but cannot insert/delete organizations, modify candidates, or access admin-only tables.
--
-- Organization admin access patterns (from 302-rls.sql):
--   organizations SELECT and candidates SELECT (authenticated_select_*): user_can('project', project_id, 'project.read_entities') OR user_can('entity', id, 'entity.read_answers') OR (project_open_for_voters(project_id) AND confirmed AND entity_has_confirmed_nomination(<type>, id, project_id)). The nomination-hierarchy reach 162-10 gave back as a `nomination.read` row disjunct was REMOVED by 162-REVIEW CR-02, because a row policy discloses the whole row, answers included; the parent's basic-data reach is `get_entity_basic_data` (503-entity-rpcs.sql), and section 5c asserts both halves. The last is the public disjunct, ASSEMBLED in the qual rather than composed into one function: D-36 (2026-09-17) removed `entity_is_anon_visible` because the nesting cost 271.9 ms anon against 39.4 for these direct calls. The two tables' predicates are therefore one expression modulo the table name, the type literal AND the two terms-of-use conjuncts `candidates` alone carries -- which is what the companion to TEST B now asserts. organizations UPDATE (entity_update_own_organizations): user_can('entity', id, 'entity.edit_answers') organizations INSERT/DELETE and all admin_* policies: user_can('project', project_id, 'project.edit_entities') -- the project-scope actor, which an organization grantee is not candidates UPDATE: only entity_update_own_candidates or admin_update_candidates; there is still no organization UPDATE path to a candidate row
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

-- Column-level GRANT on organizations allows: name, short_name, info, color, image, subtype, custom_data, answers (sort_order, created_at and updated_at were revoked in phase 156 criterion 7 - see 303-column-grants.sql, and 09-column-restrictions.test.sql which asserts the surviving count).
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

-- org_b is in Project B (unpublished) and has no auth_user_id link to organization_a UPDATE should affect 0 rows
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

-- DELETE: the organizations DELETE policy requires project-level authority (admin-only) Even though organization_a can see org_a, DELETE affects 0 rows (no DELETE policy for an entity grantee)
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

-- REKEYED BY 162-07b, AND M8 IS WHY THE REKEY COSTS NOTHING. These two assertions read as though they test the organization-role disjunct of `authenticated_select_candidates`. Measured: they never did. Both candidate_a and candidate_a2 carried the retired per-row publication flag set true, and the policy's now-retired publication disjunct admitted any such row to ANY authenticated caller -- so they were passing through that term the whole time, and the organization term they name in the comment carried no live assertion at all. They are therefore rekeyed onto candidate ids, which is what they were really measuring, and the assertion that DOES discriminate on the removed reach is added below as Test A.
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

-- REKEYED AGAIN BY 162-10, AND THE COUNT MOVED FROM 2 TO 1 FOR A RATIFIED REASON. The publication term is gone from `authenticated_select_candidates` (D-11b -- 162-16 deletes the columns, and there is nothing left in the policy for it to strip), and it was that term, not the organization's authority, that admitted both rows. What admits candidate_a is the PUBLIC disjunct -- project A is open and candidate_a and its nomination are confirmed (since 162-REVIEW CR-02 the `nomination.read` row reach is gone, so the hierarchy no longer admits a row); candidate_a2 has no nomination at all, so nothing admits it and it is invisible -- exactly as 162-08 already made it invisible to anon, and asserted at 16-anon-visibility.test.sql's `anon CANNOT see candidate_a2`.
--
-- STRONGER THAN THE ASSERTION IT REPLACES, which counted two rows admitted by a term that had nothing to do with the caller. This one names WHICH row and WHY, and it discriminates: it fails if the hierarchy reach regresses (candidate_a disappears) AND it fails if the reach widens into a blanket project-wide read (candidate_a2 reappears).
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
-- Section 5b: TEST A and TEST B -- the reach 162-07b removed, made observable
-- =====================================================================
-- TEST A. This is the assertion that makes the removal observable, and it had to be CONSTRUCTED rather than found, because M8 measured that every existing assertion on this policy passed through the now-retired publication term. A candidate that is NOT publicly visible and is NOT the caller's own record has only the project disjunct left, and an organization-role user holds no project access -- so it is invisible. Observed RED against the base SHA with `have: 1  want: 0`: the removed has_role disjunct admitted exactly this row.
--
-- ⚠ THE WINDOW THIS PINS. Until 162-10 restores the organization's read of its own candidates THROUGH THE NOMINATION HIERARCHY, this green is a NARROWING and not an end state. Read it as the record of a deliberate, fail-closed, two-plan gap, not as a property the system should keep.
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
    'TEST A: an organization-role caller cannot see a non-public candidate in its own project -- 162-10 owes this reach back through the nomination hierarchy'
  );

-- =====================================================================
-- Section 5c: TEST C -- the reach 162-10 gave back, and the control that bounds it
-- =====================================================================
-- ⚠ WINDOWS.md ROW 267, CLOSED HERE, AND TEST A ABOVE IS NOW ITS CONTROL RATHER THAN ITS SUBJECT.
--
-- TEST A is byte-identical and still green, and that is not the debt going unpaid -- it is the bound on what was paid. Its row, Nadia, is in project A and is nominated NOWHERE, so under the restored rule she is not "of its own organization" at all: the reach 162-07b removed read a COLUMN (`candidates.organization_id`), and the reach that replaces it reads the NOMINATION HIERARCHY. A row outside that hierarchy is correctly still invisible, and TEST A is what proves the restoration did not become a blanket project-wide read.
--
-- TEST C is the subject. Nora is unpublished AND unconfirmed -- the exact population the window named -- and she IS nominated under organization_a's own nomination. Measured on this fixture with this caller: 0 rows before the conversion, 1 row after. That 0 -> 1 is the window closing, expressed as the same number 162-07b used to express it opening.
--
-- ⚠ REWRITTEN BY 162-REVIEW CR-02. The reach used to be a `user_can ('entity', id, 'nomination.read')` disjunct of the candidates SELECT policy, and that returned Nora's WHOLE ROW -- answers, auth_user_id, terms_of_use_accepted, custom_data -- to her parent's editor, contradicting option (D): the child hop grants the parent the child's nomination and BASIC data, never the child's answers. The row is now refused (0) and the basic data is served by `get_entity_basic_data`, which asks the same `user_can` question and returns an allow-listed projection; the assertions below cover both halves and the non-parent control.
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
    'TEST C: an organization-role caller CANNOT SELECT the row of a non-public, unconfirmed candidate nominated under its own nomination -- a row policy would disclose the whole row, answers included (162-REVIEW CR-02)'
  );

-- The reach itself survives, as a column projection: get_entity_basic_data answers the parent with the child's basic data and WITHOUT the answers, auth_user_id, terms_of_use_accepted or custom_data keys.
SELECT
  ok (
    (
      SELECT
        r ->> 'first_name' = 'Nora'
        AND NOT (r ? 'answers')
        AND NOT (r ? 'auth_user_id')
        AND NOT (r ? 'terms_of_use_accepted')
        AND NOT (r ? 'custom_data')
      FROM
        get_entity_basic_data ('ffffffff-ffff-ffff-ffff-000000000002'::uuid) AS r
    ),
    'TEST C: the nominating parent reads the child''s BASIC data through get_entity_basic_data, and that projection carries no answers (SPEC section 7 row 3, CR-02)'
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
    get_entity_basic_data ('ffffffff-ffff-ffff-ffff-000000000002'::uuid) IS NULL,
    'TEST C paired opposite: get_entity_basic_data answers NULL to an entity grantee that is NOT this candidate''s nominating parent'
  );

SELECT
  reset_role ();

-- TEST B, RE-POINTED BY 162-10 AT THE END STATE. It was written against the three disjuncts 162-07b left behind -- `can_access_project`, the `auth_user_id` comparison and `published` -- and all three are gone: the first two because the whole authority decision is now one predicate, the third because D-11b takes the publication term out of the policies in this plan and the columns out in 162-16. Pinning their PRESENCE would now be pinning the pre-conversion shape.
--
-- STRONGER THAN THE PIN IT REPLACES. The old one could be satisfied by any policy naming those three strings; this one requires that the qual name `user_can`, that it name the entity-scope reach that CLOSES the window TEST A and TEST C bound, and that it name NONE of the five predicates a converted policy must not re-derive -- so it reddens both if the reach regresses and if any of the retired mechanisms comes back.
--
-- RE-POINTED AGAIN BY D-36 (2026-09-17), AND STRENGTHENED RATHER THAN RELAXED. 162-10 had this clause read `qual LIKE '%entity_is_anon_visible%'`, i.e. the public disjunct is DELEGATED to the one composition. That composition is gone, so the clause now requires the qual to name BOTH sub-rule helpers DIRECTLY -- two positive terms where there was one -- and adds `entity_is_anon_visible` to the list of names the qual must NOT carry, so the composition cannot come back silently.
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
        AND qual NOT LIKE '%auth_user_id%'
        AND qual NOT LIKE '%published%'
      FROM
        pg_policies
      WHERE
        tablename = 'candidates'
        AND policyname = 'authenticated_select_candidates'
    ),
    'TEST B: the candidates SELECT qual delegates to user_can, does NOT carry the nomination.read row reach (CR-02) and calls BOTH public-visibility helpers called directly, and re-derives none of the five predicates a converted policy must not name -- nor the withdrawn composition'
  );

-- The companion that keeps TEST B from being satisfiable by a policy that simply removed everything. It was written as "the organizations SELECT policy KEEPS its role predicate", scoping 162-07b's removal to the one site; 162-10 converts that policy too, so the scoping claim now has to be made against what the two policies SHARE rather than against a mechanism both have left behind.
--
-- STRONGER THAN THE PIN IT REPLACES: it asserts that the two tables' SELECT predicates are the SAME EXPRESSION modulo the table name and the entity-type literal, which is D-21's generalisation stated at the one place a reader of this file would look for it -- and which the old assertion, satisfied by the mere presence of a substring, could not express at all.
--
-- ⚠ D-36 NARROWS WHAT THIS CAN CLAIM, AND THE NARROWING IS THE RULING'S OWN RECORDED COST. With the public disjunct assembled in each qual rather than composed into one call, `candidates` carries two conjuncts `organizations` cannot: the terms-of-use guards, which are a property of that table and of no other. The two predicates are therefore one expression modulo the table name, the entity-type literal AND those two conjuncts -- and the assertion says exactly that rather than pretending the older, stronger claim survived.
--
-- THE STRIP CANNOT BE VACUOUS, which is the whole difficulty with an assertion that removes text before comparing. The clause below the equality counts the policies across all four entity tables whose SELECT qual carries the stripped term and pins it at TWO -- `anon_select_candidates` and `authenticated_select_candidates`, and no others. A strip that matched nothing, or a terms-of-use conjunct that leaked onto a second table, reddens there rather than passing silently here.
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
    'the organizations and candidates SELECT policies are ONE expression modulo the table name, the entity-type literal and the two terms-of-use conjuncts candidates alone carries -- D-21 made structural, narrowed by D-36 to what the eight-assembly shape leaves true'
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

-- candidates UPDATE: only candidate_update_own (auth_user_id match) and admin_update organization role has no UPDATE policy on candidates
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
