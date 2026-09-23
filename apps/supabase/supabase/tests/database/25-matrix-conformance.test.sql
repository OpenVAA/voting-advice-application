-- 25-matrix-conformance.test.sql: section 3.3's matrix as the estate enforces it, and the eight-assembly guard
--
-- WHAT NO SIBLING ASSERTS. 162-04 asserts the eight answer vectors of `user_can` itself, at the arguments that plan chose; every wave-4 plan asserts its own tables. Neither can see the two holes this file exists to close. The first is a permission the whole estate never reads: a cell of the matrix that grants nothing, invisible to every per-table plan because each of them asserts only inside its own scope, and a member nobody enforces is precisely the one nobody's scope contained. The second is the eight entity SELECT assemblies, which D-36 accepted as duplicated ONLY on the condition that divergence be mechanical.
--
-- THE ORDINAL. D-28's registry assigns 12..23 and its next free value is 24, but 24 is OCCUPIED: 162-15 created `24-legacy-removal.test.sql` under its own "lowest free two-digit prefix" rule, in the same plan that deleted `13-shim-parity.test.sql`. The registry's rule and 162-15's disagreed exactly as 162-17's flagged assumption predicted. This plan therefore took the four lowest free prefixes ABOVE the registry's maximum -- 25, 26, 27, 28 -- and did not take the free 13, because reusing a deleted file's ordinal is the collision the registry was created to stop.
--
-- WHY THE GRID RUNS AGAINST A CLOSED PROJECT. 162-09 and 162-11 wrote the structure read policies as two-term disjunctions: the authority term, or the open-for-voters term. Measured against an OPEN project a read cell passes for a caller holding no authority whatsoever, and this file would become a second, weaker copy of 16-anon-visibility.test.sql. Section 0 therefore closes the project and ASSERTS it closed, as a fact read back off the row rather than as a property of the fixture.
--
-- WHY THE VECTORS ARE MEASURED AT THE ARGUMENTS THE POLICIES PASS, and what that is not. Three properties of this estate, each measured rather than assumed, make "one representative operation per member, run as nine identities" unable to express section 3.3:
--   - (1) PERMISSIVE POLICIES ARE OR-ED. `nominations` carries both `admin_insert_nominations` and `entity_insert_nominations` on INSERT, so a real insert measures the disjunction of every policy on that command, never the one policy a derivation named.
--   - (2) MOST POLICIES NAME SEVERAL MEMBERS. `authenticated_select_alliances` names `project.read_entities` AND `entity.read_answers` (a third, `nomination.read`, until 162-REVIEW CR-02); one outcome cannot answer for rows whose section 3.3 cells differ.
--   - (3) SOME POLICIES CONJOIN ROW STATE. `entity_insert_parent_nominations` adds six conjuncts beyond the permission, so its outcome is a statement about the conjunction.
-- So the vector is measured as `user_can` answers, THROUGH EACH IDENTITY'S REAL SESSION CLAIM, at exactly the (scope, target) arguments the representative policy passes -- and the claim that the policy passes those arguments is asserted STRUCTURALLY from `pg_policies` in section 3. The composition is what carries the criterion: the matrix answers this way for these arguments (behavioural, section 2) AND the policies ask the matrix exactly these arguments (structural, section 3). Neither half alone would do, and neither half is a call comparing a function with itself.
--
-- Depends on: 00-helpers.test.sql (set_test_user, create_test_data, test_id, test_user_id,
--             test_seed_fixture_grants)
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (41);

SELECT
  create_test_data ();

-- The eight fixture identities hold their authority rows. Every session below passes an EMPTY array to set_test_user, deliberately: the claim is projected out of public.grants by test_grants_claim, which is the same table-to-claim path the access-token hook performs, so a caller's authority here comes from the grant table and from nowhere else.
SELECT
  test_seed_fixture_grants ();

-- =====================================================================
-- Section 0: the grid's own precondition -- the project is CLOSED
-- =====================================================================
-- Without this every policy's public disjunct is true and a read cell passes for a caller with no authority at all. Control M3 opens the project and records how many assertions flip, which is the measurement that proves this section load-bearing rather than decorative.
UPDATE projects
SET
  open_for_voters = false
WHERE
  id = test_id ('project_a');

SELECT
  is (
    (
      SELECT
        open_for_voters
      FROM
        projects
      WHERE
        id = test_id ('project_a')
    ),
    false,
    'precondition: the grid project is closed for voters, so every observed outcome is the authority decision alone'
  );

-- =====================================================================
-- Extra identities, local to this transaction
-- =====================================================================
-- create_test_data() is NOT widened. 162-06 asserts the fixture produces exactly eight grant rows and a second backfill call inserts zero, and 162-15 asserts the rewritten fixture's grant set equals its pre-rewrite image, so a ninth identity there would redden both against a correct implementation. The identities below are created here and roll back with this transaction, exactly as 162-04's tracer and 162-09's project editor were.
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
    'cccccccc-cccc-cccc-cccc-0000000000a1',
    '00000000-0000-0000-0000-000000000000',
    'm17_project_editor@test.com',
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
    'cccccccc-cccc-cccc-cccc-0000000000a2',
    '00000000-0000-0000-0000-000000000000',
    'm17_faction_editor@test.com',
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
    'cccccccc-cccc-cccc-cccc-0000000000a3',
    '00000000-0000-0000-0000-000000000000',
    'm17_alliance_editor@test.com',
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
    'cccccccc-cccc-cccc-cccc-0000000000a4',
    '00000000-0000-0000-0000-000000000000',
    'm17_no_grant@test.com',
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
    'cccccccc-cccc-cccc-cccc-0000000000a5',
    '00000000-0000-0000-0000-000000000000',
    'm17_unmapped_shape@test.com',
    crypt ('testpass', gen_salt ('bf')),
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

-- The three grant shapes section 3.1 names that the shared fixture has no room for, plus the UNMAPPED shape: an entity-scope grant carrying the admin role. The table's CHECK constraints admit it, the user-type mapping never produces it, and the matrix gives it the EMPTY set -- so it must open nothing.
-- `m17_no_grant` deliberately receives no row at all.
INSERT INTO
  public.grants (user_id, scope, target_type, target_id, role)
VALUES
  (
    'cccccccc-cccc-cccc-cccc-0000000000a1',
    'project',
    NULL,
    test_id ('project_a'),
    'editor'
  ),
  (
    'cccccccc-cccc-cccc-cccc-0000000000a2',
    'entity',
    'faction',
    test_id ('faction_a'),
    'editor'
  ),
  (
    'cccccccc-cccc-cccc-cccc-0000000000a3',
    'entity',
    'alliance',
    test_id ('alliance_a'),
    'editor'
  ),
  (
    'cccccccc-cccc-cccc-cccc-0000000000a5',
    'entity',
    'candidate',
    test_id ('candidate_a'),
    'admin'
  );

-- =====================================================================
-- Section 1: the enforcement census, as a STANDING two-directional assertion
-- =====================================================================
-- Derived in this file rather than read from a record, which is what makes it a standing assertion instead of a one-time observation: a later change that leaves a member unread reddens here, and so does one that quietly starts enforcing a member the ratified list says nothing enforces.
--
-- The ratified unenforced list and the reason for each entry (162-17 Task 2, Q2 list 2):
--   - account.manage_admins: grant administration; public.grants carries no user-facing policy at all.
--   - project.manage_editors: the same.
--   - entity.invite_children: the same, at entity scope (000-enums.sql:28 names it as the equivalent).
--   - entity.edit_immutable: enforced by the trigger enforce_entity_immutability (OLD vs NEW).
--   - entity.confirm: the same trigger, plus 303-column-grants.sql.
--   - nomination.confirm: enforced by the trigger enforce_nomination_confirmation.
CREATE TEMP TABLE m17_unenforced_ratified (m text) ON
COMMIT
DROP;

INSERT INTO
  m17_unenforced_ratified
VALUES
  ('account.manage_admins'),
  ('project.manage_editors'),
  ('entity.invite_children'),
  ('entity.edit_immutable'),
  ('entity.confirm'),
  ('nomination.confirm');

CREATE TEMP VIEW m17_unenforced_derived AS
SELECT
  e.enumlabel::text AS m
FROM
  pg_enum e
  JOIN pg_type t ON t.oid = e.enumtypid
WHERE
  t.typname = 'grant_permission'
  AND NOT EXISTS (
    SELECT
      1
    FROM
      pg_policies p
    WHERE
      p.schemaname IN ('public', 'storage')
      AND (
        COALESCE(p.qual, '') || ' ' || COALESCE(p.with_check, '')
      ) LIKE '%''' || e.enumlabel::text || '''::grant_permission%'
  );

SELECT
  is_empty (
    $$SELECT m FROM m17_unenforced_derived EXCEPT SELECT m FROM m17_unenforced_ratified$$,
    'enforcement census: no permission member has quietly stopped being enforced by any policy'
  );

SELECT
  is_empty (
    $$SELECT m FROM m17_unenforced_ratified EXCEPT SELECT m FROM m17_unenforced_derived$$,
    'enforcement census: no permission member on the ratified unenforced list has quietly started being enforced'
  );

-- =====================================================================
-- Section 2: the twenty-three outcome vectors
-- =====================================================================
-- Nine grant-bearing positions plus the unmapped shape, in section 3.1's order, measured through each identity's real session claim:
--   - 1 RootAdmin, 2 AccountAdmin, 3 ProjectAdmin, 4 ProjectEditor, 5 Candidate, 6 OrganizationEditor, 7 FactionEditor, 8 AllianceEditor, 9 an authenticated caller holding no grant, X the unmapped shape.
-- `own`-qualified cells of section 3.3 are read as TRUE for the identity whose grant names the probe target and FALSE for the others; the no-grant element is always false.
CREATE TEMP TABLE m17_grid (member text, ident text, val boolean) ON
COMMIT
DROP;

DO $$
DECLARE
  v_uid uuid; v_member text; v_scope text; v_target uuid; v_res boolean;
  idents text[][] := ARRAY[
    ARRAY['1', 'cccccccc-cccc-cccc-cccc-000000000006'],
    ARRAY['2', 'cccccccc-cccc-cccc-cccc-000000000007'],
    ARRAY['3', 'cccccccc-cccc-cccc-cccc-000000000001'],
    ARRAY['4', 'cccccccc-cccc-cccc-cccc-0000000000a1'],
    ARRAY['5', 'cccccccc-cccc-cccc-cccc-000000000003'],
    ARRAY['6', 'cccccccc-cccc-cccc-cccc-000000000005'],
    ARRAY['7', 'cccccccc-cccc-cccc-cccc-0000000000a2'],
    ARRAY['8', 'cccccccc-cccc-cccc-cccc-0000000000a3'],
    ARRAY['9', 'cccccccc-cccc-cccc-cccc-0000000000a4'],
    ARRAY['X', 'cccccccc-cccc-cccc-cccc-0000000000a5']];
  -- member, scope argument, probe target. The first fourteen are the arguments the representative policy passes and section 3 asserts that structurally; the last nine have no discriminating policy and take the natural scope of their group, which section 1 has already accounted for.
  ops text[][] := ARRAY[
    ARRAY['feedback.read', 'project', 'project_a'],
    ARRAY['feedback.manage', 'project', 'project_a'],
    ARRAY['account.edit_settings', 'account', 'account_a'],
    ARRAY['account.manage_projects', 'account', 'account_a'],
    ARRAY['account.manage_admins', 'account', 'account_a'],
    ARRAY['project.manage_editors', 'project', 'project_a'],
    ARRAY['project.edit_project_settings', 'project', 'project_a'],
    ARRAY['project.edit_app_settings', 'project', 'project_a'],
    ARRAY['project.edit_structure', 'project', 'project_a'],
    ARRAY['project.edit_questions', 'project', 'project_a'],
    ARRAY['project.read_structure', 'project', 'project_a'],
    ARRAY['project.edit_entities', 'project', 'project_a'],
    ARRAY['project.edit_nominations', 'project', 'project_a'],
    ARRAY['project.read_entities', 'project', 'project_a'],
    ARRAY['entity.edit_answers', 'entity', 'alliance_a'],
    ARRAY['entity.read_answers', 'entity', 'alliance_a'],
    ARRAY['entity.edit_immutable', 'entity', 'candidate_a'],
    ARRAY['entity.invite_children', 'entity', 'org_a'],
    ARRAY['entity.confirm', 'entity', 'candidate_a'],
    ARRAY['nomination.edit', 'entity', 'alliance_a'],
    ARRAY['nomination.read', 'entity', 'alliance_a'],
    ARRAY['nomination.confirm', 'entity', 'candidate_a'],
    ARRAY['nomination.create_parent', 'entity', 'alliance_a']];
  i int; j int;
BEGIN
  FOR i IN 1..array_length(idents, 1) LOOP
    v_uid := idents[i][2]::uuid;
    PERFORM set_test_user('authenticated', v_uid, '[]'::jsonb);
    FOR j IN 1..array_length(ops, 1) LOOP
      v_member := ops[j][1];
      v_scope := ops[j][2];
      v_target := test_id(ops[j][3]);
      EXECUTE format(
        'SELECT public.user_can(%L::public.grant_scope_type, %L::uuid, %L::public.grant_permission)',
        v_scope, v_target, v_member
      ) INTO v_res;
      PERFORM set_config('role', 'postgres', true);
      INSERT INTO m17_grid VALUES (v_member, idents[i][1], v_res);
      PERFORM set_config('role', 'authenticated', true);
    END LOOP;
  END LOOP;
  PERFORM set_config('role', 'postgres', true);
END $$;

SELECT
  is (
    (
      SELECT
        string_agg(
          CASE
            WHEN val THEN 'T'
            ELSE 'f'
          END,
          ''
          ORDER BY
            ident
        )
      FROM
        m17_grid
      WHERE
        member = 'feedback.read'
    ),
    'TTTTffffff',
    'matrix row feedback.read'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          CASE
            WHEN val THEN 'T'
            ELSE 'f'
          END,
          ''
          ORDER BY
            ident
        )
      FROM
        m17_grid
      WHERE
        member = 'feedback.manage'
    ),
    'TTTTffffff',
    'matrix row feedback.manage'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          CASE
            WHEN val THEN 'T'
            ELSE 'f'
          END,
          ''
          ORDER BY
            ident
        )
      FROM
        m17_grid
      WHERE
        member = 'account.edit_settings'
    ),
    'TTffffffff',
    'matrix row account.edit_settings'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          CASE
            WHEN val THEN 'T'
            ELSE 'f'
          END,
          ''
          ORDER BY
            ident
        )
      FROM
        m17_grid
      WHERE
        member = 'account.manage_projects'
    ),
    'TTffffffff',
    'matrix row account.manage_projects'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          CASE
            WHEN val THEN 'T'
            ELSE 'f'
          END,
          ''
          ORDER BY
            ident
        )
      FROM
        m17_grid
      WHERE
        member = 'account.manage_admins'
    ),
    'TTffffffff',
    'matrix row account.manage_admins'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          CASE
            WHEN val THEN 'T'
            ELSE 'f'
          END,
          ''
          ORDER BY
            ident
        )
      FROM
        m17_grid
      WHERE
        member = 'project.manage_editors'
    ),
    'TTTfffffff',
    'matrix row project.manage_editors'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          CASE
            WHEN val THEN 'T'
            ELSE 'f'
          END,
          ''
          ORDER BY
            ident
        )
      FROM
        m17_grid
      WHERE
        member = 'project.edit_project_settings'
    ),
    'TTTfffffff',
    'matrix row project.edit_project_settings'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          CASE
            WHEN val THEN 'T'
            ELSE 'f'
          END,
          ''
          ORDER BY
            ident
        )
      FROM
        m17_grid
      WHERE
        member = 'project.edit_app_settings'
    ),
    'TTTTffffff',
    'matrix row project.edit_app_settings'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          CASE
            WHEN val THEN 'T'
            ELSE 'f'
          END,
          ''
          ORDER BY
            ident
        )
      FROM
        m17_grid
      WHERE
        member = 'project.edit_structure'
    ),
    'TTTTffffff',
    'matrix row project.edit_structure'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          CASE
            WHEN val THEN 'T'
            ELSE 'f'
          END,
          ''
          ORDER BY
            ident
        )
      FROM
        m17_grid
      WHERE
        member = 'project.edit_questions'
    ),
    'TTTTffffff',
    'matrix row project.edit_questions'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          CASE
            WHEN val THEN 'T'
            ELSE 'f'
          END,
          ''
          ORDER BY
            ident
        )
      FROM
        m17_grid
      WHERE
        member = 'project.read_structure'
    ),
    'TTTTTTTTff',
    'matrix row project.read_structure'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          CASE
            WHEN val THEN 'T'
            ELSE 'f'
          END,
          ''
          ORDER BY
            ident
        )
      FROM
        m17_grid
      WHERE
        member = 'project.edit_entities'
    ),
    'TTTTffffff',
    'matrix row project.edit_entities'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          CASE
            WHEN val THEN 'T'
            ELSE 'f'
          END,
          ''
          ORDER BY
            ident
        )
      FROM
        m17_grid
      WHERE
        member = 'project.edit_nominations'
    ),
    'TTTTffffff',
    'matrix row project.edit_nominations'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          CASE
            WHEN val THEN 'T'
            ELSE 'f'
          END,
          ''
          ORDER BY
            ident
        )
      FROM
        m17_grid
      WHERE
        member = 'project.read_entities'
    ),
    'TTTTffffff',
    'matrix row project.read_entities'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          CASE
            WHEN val THEN 'T'
            ELSE 'f'
          END,
          ''
          ORDER BY
            ident
        )
      FROM
        m17_grid
      WHERE
        member = 'entity.edit_answers'
    ),
    'TTTTfffTff',
    'matrix row entity.edit_answers'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          CASE
            WHEN val THEN 'T'
            ELSE 'f'
          END,
          ''
          ORDER BY
            ident
        )
      FROM
        m17_grid
      WHERE
        member = 'entity.read_answers'
    ),
    'TTTTfffTff',
    'matrix row entity.read_answers'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          CASE
            WHEN val THEN 'T'
            ELSE 'f'
          END,
          ''
          ORDER BY
            ident
        )
      FROM
        m17_grid
      WHERE
        member = 'entity.edit_immutable'
    ),
    'TTTTffffff',
    'matrix row entity.edit_immutable'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          CASE
            WHEN val THEN 'T'
            ELSE 'f'
          END,
          ''
          ORDER BY
            ident
        )
      FROM
        m17_grid
      WHERE
        member = 'entity.invite_children'
    ),
    'TTTTfTffff',
    'matrix row entity.invite_children'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          CASE
            WHEN val THEN 'T'
            ELSE 'f'
          END,
          ''
          ORDER BY
            ident
        )
      FROM
        m17_grid
      WHERE
        member = 'entity.confirm'
    ),
    'TTTTffffff',
    'matrix row entity.confirm'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          CASE
            WHEN val THEN 'T'
            ELSE 'f'
          END,
          ''
          ORDER BY
            ident
        )
      FROM
        m17_grid
      WHERE
        member = 'nomination.edit'
    ),
    'TTTTfffTff',
    'matrix row nomination.edit'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          CASE
            WHEN val THEN 'T'
            ELSE 'f'
          END,
          ''
          ORDER BY
            ident
        )
      FROM
        m17_grid
      WHERE
        member = 'nomination.read'
    ),
    'TTTTfffTff',
    'matrix row nomination.read'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          CASE
            WHEN val THEN 'T'
            ELSE 'f'
          END,
          ''
          ORDER BY
            ident
        )
      FROM
        m17_grid
      WHERE
        member = 'nomination.confirm'
    ),
    'TTTfffffff',
    'matrix row nomination.confirm'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          CASE
            WHEN val THEN 'T'
            ELSE 'f'
          END,
          ''
          ORDER BY
            ident
        )
      FROM
        m17_grid
      WHERE
        member = 'nomination.create_parent'
    ),
    'TTTTfffTff',
    'matrix row nomination.create_parent'
  );

-- The unmapped grant shape, read across the whole grid at once: an entity-scope grant carrying the admin role opens NOTHING, for any of the 23 members.
SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        m17_grid
      WHERE
        ident = 'X'
        AND val
    ),
    0,
    'the unmapped grant shape (entity scope, admin role) is denied every one of the 23 permissions'
  );

-- =====================================================================
-- Section 3: the structural half -- the policies ask the matrix EXACTLY these arguments
-- =====================================================================
-- This is what stops section 2 from being a statement about `user_can` alone. For each member that has a DISCRIMINATING policy -- one naming exactly that member and no other -- the deterministically first such policy, preferring the narrowest scope, must pass the scope argument section 2 probed at. Derived from pg_policies; the expected set is written out so a drift names the member.
SELECT
  is_empty (
    $$
    WITH pol AS (
      SELECT schemaname sch, tablename tbl, policyname pol, cmd,
             COALESCE(qual, '') || ' ' || COALESCE(with_check, '') expr
      FROM pg_policies WHERE schemaname IN ('public', 'storage')
    ), mem AS (
      SELECT enumlabel::text m FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'grant_permission'
    ), pm AS (
      SELECT p.*, m.m FROM pol p JOIN mem m ON p.expr LIKE '%''' || m.m || '''::grant_permission%'
    ), cnt AS (
      SELECT sch, tbl, pol, cmd, count(*) nm FROM pm GROUP BY 1, 2, 3, 4
    ), disc AS (
      SELECT pm.*, CASE
        WHEN pm.expr LIKE '%''entity''::grant_scope_type%' THEN 1
        WHEN pm.expr LIKE '%''project''::grant_scope_type%' THEN 2
        WHEN pm.expr LIKE '%''account''::grant_scope_type%' THEN 3
        ELSE 4 END AS breadth
      FROM pm JOIN cnt c USING (sch, tbl, pol, cmd) WHERE c.nm = 1
    ), first_disc AS (
      SELECT DISTINCT ON (m) m, breadth, sch, tbl, cmd, pol FROM disc
      ORDER BY m, breadth, sch, tbl,
        CASE cmd WHEN 'SELECT' THEN 1 WHEN 'INSERT' THEN 2 WHEN 'UPDATE' THEN 3 WHEN 'DELETE' THEN 4 ELSE 5 END,
        pol
    ), expected(m, scope_arg) AS (VALUES
      ('feedback.read', 'project'), ('feedback.manage', 'project'),
      ('account.edit_settings', 'account'), ('account.manage_projects', 'account'),
      ('project.edit_project_settings', 'project'), ('project.edit_app_settings', 'project'),
      ('project.edit_structure', 'project'), ('project.edit_questions', 'project'),
      ('project.read_structure', 'project'), ('project.edit_entities', 'project'),
      ('project.edit_nominations', 'project'), ('entity.edit_answers', 'entity'),
      ('nomination.edit', 'entity'), ('nomination.create_parent', 'entity')
    ), derived(m, scope_arg) AS (
      SELECT m, CASE breadth WHEN 1 THEN 'entity' WHEN 2 THEN 'project' WHEN 3 THEN 'account' ELSE 'entity' END
      FROM first_disc
    )
    SELECT m || ' expected ' || scope_arg FROM expected
    EXCEPT
    SELECT m || ' expected ' || scope_arg FROM derived
    $$,
    'delegation: every member with a discriminating policy is asked at the scope the grid probed it at'
  );

-- =====================================================================
-- Section 4: the behavioural half -- the disjunctive read policies
-- =====================================================================
-- The two members that occur ONLY inside the four `authenticated_select_<entity>` disjunctions -- project.read_entities and entity.read_answers -- have no discriminating policy, so no single operation can answer for one of them. (`nomination.read` was a third until 162-REVIEW CR-02 removed it from these policies: a row policy discloses the whole row, and the child-nominee reach is basic data only, now served by get_entity_basic_data.) What IS measurable, and is the strongest policy-level statement available for them, is that the real SELECT outcome equals the OR of those cells for every identity. Against a CLOSED project the public disjunct is false, so the observed outcome is the authority decision alone; control M3 opens the project and records how many of these flip.
CREATE TEMP TABLE m17_visible (tbl text, ident text, val boolean) ON
COMMIT
DROP;

DO $$
DECLARE
  v_uid uuid; v_tbl text; v_row text; v_cnt integer;
  idents text[][] := ARRAY[
    ARRAY['1', 'cccccccc-cccc-cccc-cccc-000000000006'],
    ARRAY['2', 'cccccccc-cccc-cccc-cccc-000000000007'],
    ARRAY['3', 'cccccccc-cccc-cccc-cccc-000000000001'],
    ARRAY['4', 'cccccccc-cccc-cccc-cccc-0000000000a1'],
    ARRAY['5', 'cccccccc-cccc-cccc-cccc-000000000003'],
    ARRAY['6', 'cccccccc-cccc-cccc-cccc-000000000005'],
    ARRAY['7', 'cccccccc-cccc-cccc-cccc-0000000000a2'],
    ARRAY['8', 'cccccccc-cccc-cccc-cccc-0000000000a3'],
    ARRAY['9', 'cccccccc-cccc-cccc-cccc-0000000000a4'],
    ARRAY['X', 'cccccccc-cccc-cccc-cccc-0000000000a5']];
  tbls text[][] := ARRAY[
    ARRAY['candidates', 'candidate_a'],
    ARRAY['organizations', 'org_a'],
    ARRAY['factions', 'faction_a'],
    ARRAY['alliances', 'alliance_a']];
  i int; j int;
BEGIN
  FOR i IN 1..array_length(idents, 1) LOOP
    v_uid := idents[i][2]::uuid;
    PERFORM set_test_user('authenticated', v_uid, '[]'::jsonb);
    FOR j IN 1..array_length(tbls, 1) LOOP
      v_tbl := tbls[j][1];
      v_row := tbls[j][2];
      EXECUTE format('SELECT count(*)::integer FROM public.%I WHERE id = public.test_id(%L)', v_tbl, v_row) INTO v_cnt;
      PERFORM set_config('role', 'postgres', true);
      INSERT INTO m17_visible VALUES (v_tbl, idents[i][1], v_cnt > 0);
      PERFORM set_config('role', 'authenticated', true);
    END LOOP;
  END LOOP;
  PERFORM set_config('role', 'postgres', true);
END $$;

SELECT
  is (
    (
      SELECT
        string_agg(
          CASE
            WHEN val THEN 'T'
            ELSE 'f'
          END,
          ''
          ORDER BY
            ident
        )
      FROM
        m17_visible
      WHERE
        tbl = 'candidates'
    ),
    'TTTTTfffff',
    'disjunctive read: candidates visibility equals the authority disjunction on a closed project (position 6, the organization editor, does NOT get its child nominee''s ROW -- that reach is basic data only, served by get_entity_basic_data, 162-REVIEW CR-02)'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          CASE
            WHEN val THEN 'T'
            ELSE 'f'
          END,
          ''
          ORDER BY
            ident
        )
      FROM
        m17_visible
      WHERE
        tbl = 'organizations'
    ),
    'TTTTfTffff',
    'disjunctive read: organizations visibility equals the authority disjunction on a closed project (only the organization editor, whose grant names the row)'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          CASE
            WHEN val THEN 'T'
            ELSE 'f'
          END,
          ''
          ORDER BY
            ident
        )
      FROM
        m17_visible
      WHERE
        tbl = 'factions'
    ),
    'TTTTffTfff',
    'disjunctive read: factions visibility equals the authority disjunction on a closed project (position 6, the organization editor, does NOT get its child nominee''s row since CR-02; position 7 is the faction editor reaching its own)'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          CASE
            WHEN val THEN 'T'
            ELSE 'f'
          END,
          ''
          ORDER BY
            ident
        )
      FROM
        m17_visible
      WHERE
        tbl = 'alliances'
    ),
    'TTTTfffTff',
    'disjunctive read: alliances visibility equals the authority disjunction on a closed project (the alliance nomination has NO parent, so the organization editor does NOT reach it -- the control that makes the two rows above discriminating)'
  );

-- =====================================================================
-- Section 5: D-36's EIGHT-ASSEMBLY GUARD
-- =====================================================================
-- D-36 reverted 162-10's composition to the pre-162-10 shape, because the cause of the 6.37x/7.31x read regression was DEPTH: two SECURITY DEFINER helpers at depth 1 cost 39.4 ms anon / 30.0 ms auth, while one composition calling those same two at depth 2 cost 271.9 / 351.9. `project_open_for_voters` and `entity_has_confirmed_nomination` remain the single definition of each sub-rule and are now called DIRECTLY from each of the eight entity SELECT policies. What repeats is the ASSEMBLY -- the conjunction pattern -- and D-36 accepted that duplication ONLY on the condition that divergence be made mechanical.
-- These assertions are that condition. Without them the eight assemblies ship unguarded and D-36's basis does not hold.
--
-- THE HOLE THIS SECTION CLOSES, measured 2026-09-17 by the D-36 revert and not predicted:
--   - dropping `open_for_voters` from ONE policy (anon_select_factions) left the estate at exit 1 -- but 162-10's older assertion 46 would have MISSED it, naming only anon_select_candidates and anon_select_nominations.
--   - dropping `confirmed` from ALL FOUR authenticated assemblies at once left the estate PASSING, exit 0, all 923 assertions green, while the authenticated no-grant visible set DOUBLED on every entity table.
-- The second is the live gap. A guard that compares the eight only TO EACH OTHER reproduces it exactly: the surviving D-21 assertions detect divergence and never a shared defect. So this section is deliberately BOTH halves -- RELATIVE (the eight agree) and ABSOLUTE (each contains the required conjuncts by name).
--
-- D-21's normalised-identity assertion no longer covers the SELECT family under D-36. That is an accepted cost of the ruling, recorded here rather than silently re-derived.
CREATE TEMP VIEW m17_assembly AS
SELECT
  tablename,
  policyname,
  roles::text AS roleset,
  qual AS raw,
  regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(qual, '\s+', ' ', 'g'),
        '''(candidate|organization|faction|alliance)''::entity_type',
        '''ETYPE''::entity_type',
        'g'
      ),
      '\m(candidates|organizations|factions|alliances)\M',
      'ENT',
      'g'
    ),
    ' AND \(terms_of_use_accepted IS NOT NULL\) AND \(terms_of_use_accepted < now\(\)\)',
    '',
    'g'
  ) AS norm
FROM
  pg_policies
WHERE
  schemaname = 'public'
  AND cmd = 'SELECT'
  AND tablename IN (
    'candidates',
    'organizations',
    'factions',
    'alliances'
  );

-- Derived, never named: a ninth entity SELECT policy cannot appear un-guarded.
SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        m17_assembly
    ),
    8,
    'eight-assembly guard: exactly eight entity SELECT policies exist, four anon and four authenticated'
  );

SELECT
  is (
    (
      SELECT
        count(DISTINCT norm)::integer
      FROM
        m17_assembly
      WHERE
        roleset = '{anon}'
    ),
    1,
    'eight-assembly guard, RELATIVE: the four anon assemblies are identical once the table and entity type are normalised away'
  );

SELECT
  is (
    (
      SELECT
        count(DISTINCT norm)::integer
      FROM
        m17_assembly
      WHERE
        roleset = '{authenticated}'
    ),
    1,
    'eight-assembly guard, RELATIVE: the four authenticated assemblies are identical once the table and entity type are normalised away'
  );

-- The authenticated assembly's public disjunct is the anon assembly of the SAME table, character for character. This is what keeps the two families from drifting apart as families.
SELECT
  is_empty (
    $$
    SELECT a.tablename
    FROM m17_assembly a
    JOIN m17_assembly n ON n.tablename = a.tablename AND n.roleset = '{anon}'
    WHERE a.roleset = '{authenticated}'
      AND position(regexp_replace(n.raw, '^\((.*)\)$', '\1') IN a.raw) = 0
    $$,
    'eight-assembly guard, RELATIVE: each authenticated assembly carries its own table''s anon assembly verbatim as its public disjunct'
  );

-- The ABSOLUTE half. A uniform change to all eight is invisible to every assertion above, which is exactly the perturbation the estate passed before this file existed.
SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        m17_assembly
      WHERE
        raw ~ '\mconfirmed\M'
    ),
    8,
    'eight-assembly guard, ABSOLUTE: all eight assemblies name the `confirmed` column'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        m17_assembly
      WHERE
        raw LIKE '%project_open_for_voters(%'
    ),
    8,
    'eight-assembly guard, ABSOLUTE: all eight assemblies call project_open_for_voters'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        m17_assembly
      WHERE
        raw LIKE '%entity_has_confirmed_nomination(%'
    ),
    8,
    'eight-assembly guard, ABSOLUTE: all eight assemblies call entity_has_confirmed_nomination'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        m17_assembly
      WHERE
        tablename = 'candidates'
        AND raw LIKE '%terms_of_use_accepted IS NOT NULL%'
        AND raw LIKE '%terms_of_use_accepted < now()%'
    ),
    2,
    'eight-assembly guard, ABSOLUTE: both candidates assemblies carry the two terms-of-use terms'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        m17_assembly
      WHERE
        roleset = '{authenticated}'
        AND raw LIKE '%''project.read_entities''::grant_permission%'
        AND raw LIKE '%''entity.read_answers''::grant_permission%'
        AND raw NOT LIKE '%''nomination.read''%'
    ),
    4,
    'eight-assembly guard, ABSOLUTE: all four authenticated assemblies name the two authority members by permission literal, and none carries the nomination.read row reach (162-REVIEW CR-02)'
  );

SELECT
  *
FROM
  finish ();

ROLLBACK;
