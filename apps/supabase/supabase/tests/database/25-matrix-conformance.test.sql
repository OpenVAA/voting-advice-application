-- 25-matrix-conformance.test.sql: the role x permission matrix as the policies enforce it, and the eight-assembly guard
--
-- WHAT NO SIBLING ASSERTS. 12-user-can.test.sql asserts the answer vectors of `user_can` itself, and each per-table suite asserts its own tables. Neither can see the two holes this file closes. The first is a permission no policy reads: a cell of the matrix that grants nothing, invisible to every per-table suite because each asserts only inside its own scope. The second is the eight entity SELECT assemblies, which repeat one conjunction pattern and so need a mechanical guard against divergence.
--
-- WHY THE GRID RUNS AGAINST A CLOSED PROJECT. The structure and entity read policies are disjunctions of an authority term and an open-for-voters term. Against an OPEN project a read cell passes for a caller holding no authority whatsoever, and this file would become a second, weaker copy of 16-anon-visibility.test.sql. Section 0 therefore closes the project and ASSERTS it closed, as a fact read back off the row rather than as a property of the fixture.
--
-- WHY THE VECTORS ARE MEASURED AT THE ARGUMENTS THE POLICIES PASS, and what that is not. Three properties of the policies make "one representative operation per member, run as nine identities" unable to express the matrix:
--   - (1) PERMISSIVE POLICIES ARE OR-ED. `nominations` carries both `admin_insert_nominations` and `entity_insert_nominations` on INSERT, so a real insert measures the disjunction of every policy on that command, never the one policy a derivation named.
--   - (2) MOST POLICIES NAME SEVERAL MEMBERS. `authenticated_select_alliances` names `project.read_entities` AND `entity.read_answers`; one outcome cannot answer for rows whose matrix cells differ.
--   - (3) SOME POLICIES CONJOIN ROW STATE. `entity_insert_parent_nominations` adds six conjuncts beyond the permission, so its outcome is a statement about the conjunction.
-- So the vector is measured as `user_can` answers, THROUGH EACH IDENTITY'S REAL SESSION CLAIM, at exactly the (scope, target) arguments the representative policy passes -- and the claim that the policy passes those arguments is asserted STRUCTURALLY from `pg_policies` in section 3. The composition is what carries the claim: the matrix answers this way for these arguments (behavioural, section 2) AND the policies ask the matrix exactly these arguments (structural, section 3). Neither half alone would do, and neither half is a call comparing a function with itself.
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
-- Without this every policy's public disjunct is true and a read cell passes for a caller with no authority at all.
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
-- The identities below are created here, inside this transaction, rather than in create_test_data(), so the shared fixture's eight grant-bearing identities stay unchanged for every other suite.
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

-- The three grant shapes the shared fixture lacks (project editor, faction editor, alliance editor), plus the UNMAPPED shape: an entity-scope grant carrying the admin role. The table's CHECK constraints admit it, the user-type mapping never produces it, and the matrix gives it the EMPTY set -- so it must open nothing.
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
-- Derived at run time, so a change that leaves a member unread reddens here, and so does one that starts enforcing a member the list below says no policy enforces.
--
-- The unenforced list, with the reason no policy reads each member:
--   - account.manage_admins: grant administration; public.grants carries no user-facing policy at all.
--   - project.manage_editors: the same.
--   - entity.invite_children: the same, at entity scope (000-enums.sql names it as project.manage_editors' entity-scope equivalent).
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
    'enforcement census: every permission member off the unenforced list is read by at least one policy'
  );

SELECT
  is_empty (
    $$SELECT m FROM m17_unenforced_ratified EXCEPT SELECT m FROM m17_unenforced_derived$$,
    'enforcement census: no permission member on the unenforced list is read by any policy'
  );

-- =====================================================================
-- Section 2: the twenty-three outcome vectors
-- =====================================================================
-- Nine positions plus the unmapped shape, measured through each identity's real session claim:
--   - 1 RootAdmin, 2 AccountAdmin, 3 ProjectAdmin, 4 ProjectEditor, 5 Candidate, 6 OrganizationEditor, 7 FactionEditor, 8 AllianceEditor, 9 an authenticated caller holding no grant, X the unmapped shape.
-- Matrix cells that hold only on the caller's own entity are read as TRUE for the identity whose grant names the probe target and FALSE for the others; the no-grant element is always false.
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
  -- member, scope argument, probe target, and the probe target's entity type at entity scope (empty at every other scope, passed as NULL). Fourteen of these are the arguments the representative policy passes, which section 3 asserts structurally; the other nine have no discriminating policy and take the natural scope of their group. An entity-scope policy passes its row's own type, so each entity-scope probe names its target's type.
  ops text[][] := ARRAY[
    ARRAY['feedback.read', 'project', 'project_a', ''],
    ARRAY['feedback.manage', 'project', 'project_a', ''],
    ARRAY['account.edit_settings', 'account', 'account_a', ''],
    ARRAY['account.manage_projects', 'account', 'account_a', ''],
    ARRAY['account.manage_admins', 'account', 'account_a', ''],
    ARRAY['project.manage_editors', 'project', 'project_a', ''],
    ARRAY['project.edit_project_settings', 'project', 'project_a', ''],
    ARRAY['project.edit_app_settings', 'project', 'project_a', ''],
    ARRAY['project.edit_structure', 'project', 'project_a', ''],
    ARRAY['project.edit_questions', 'project', 'project_a', ''],
    ARRAY['project.read_structure', 'project', 'project_a', ''],
    ARRAY['project.edit_entities', 'project', 'project_a', ''],
    ARRAY['project.edit_nominations', 'project', 'project_a', ''],
    ARRAY['project.read_entities', 'project', 'project_a', ''],
    ARRAY['entity.edit_answers', 'entity', 'alliance_a', 'alliance'],
    ARRAY['entity.read_answers', 'entity', 'alliance_a', 'alliance'],
    ARRAY['entity.edit_immutable', 'entity', 'candidate_a', 'candidate'],
    ARRAY['entity.invite_children', 'entity', 'org_a', 'organization'],
    ARRAY['entity.confirm', 'entity', 'candidate_a', 'candidate'],
    ARRAY['nomination.edit', 'entity', 'alliance_a', 'alliance'],
    ARRAY['nomination.read', 'entity', 'alliance_a', 'alliance'],
    ARRAY['nomination.confirm', 'entity', 'candidate_a', 'candidate'],
    ARRAY['nomination.create_parent', 'entity', 'alliance_a', 'alliance']];
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
        'SELECT public.user_can(%L::public.grant_scope_type, %L::uuid, %L::public.grant_permission, %L::public.entity_type)',
        v_scope, v_target, v_member, NULLIF(ops[j][4], '')
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
-- The two members that occur ONLY inside the four `authenticated_select_<entity>` disjunctions -- project.read_entities and entity.read_answers -- have no discriminating policy, so no single operation can answer for one of them. (`nomination.read` is not among them: a row policy discloses the whole row, and the child-nominee reach is basic data only, served by get_entity_basic_data.) What IS measurable, and is the strongest policy-level statement available for them, is that the real SELECT outcome equals the OR of those cells for every identity. Against a CLOSED project the public disjunct is false, so the observed outcome is the authority decision alone.
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
    'disjunctive read: candidates visibility equals the authority disjunction on a closed project (position 6, the organization editor, does NOT get its child nominee''s ROW -- that reach is basic data only, served by get_entity_basic_data)'
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
    'disjunctive read: factions visibility equals the authority disjunction on a closed project (position 6, the organization editor, does NOT get its child nominee''s row; position 7 is the faction editor reaching its own)'
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
-- Section 5: THE EIGHT-ASSEMBLY GUARD
-- =====================================================================
-- `project_open_for_voters` and `entity_has_confirmed_nomination` are the single definition of each sub-rule, and each of the eight entity SELECT policies calls them DIRECTLY, because calling them through one composing helper, a SECURITY DEFINER call one level deeper, makes entity reads several times slower. What repeats is the ASSEMBLY, the conjunction pattern, and this section is the mechanical guard against the eight diverging.
--
-- A guard that compares the eight only TO EACH OTHER detects divergence and never a shared defect: dropping `confirmed` from all eight at once leaves them agreeing with each other while unconfirmed entities become visible. So this section is deliberately BOTH halves -- RELATIVE (the eight agree) and ABSOLUTE (each contains the required conjuncts by name).
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

-- The ABSOLUTE half. A uniform change to all eight is invisible to every assertion above.
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
    'eight-assembly guard, ABSOLUTE: all four authenticated assemblies name the two authority members by permission literal, and none carries the nomination.read row reach'
  );

SELECT
  *
FROM
  finish ();

ROLLBACK;
