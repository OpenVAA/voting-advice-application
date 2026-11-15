-- 32-level1-confirmation-flow.test.sql: level 1 (the ProjectEditor) through the nomination and entity confirmation flows
--
-- What this file pins is criterion 7's level-1 half. `162-SPEC.md` section 6 defines the ProjectEditor as the ProjectAdmin minus three permissions -- `project.manage_editors`, `project.edit_project_settings` and `nomination.confirm` -- and the third of those only means anything through the flow it governs: `public.enforce_nomination_confirmation ()` turns an edit by a caller without `nomination.confirm` into an unconfirmation and refuses that caller's attempt to confirm. The trigger's own header records the ProjectEditor case (A PROJECT EDITOR'S EDIT ALSO TURNS CONFIRMATION OFF) and says nobody wrote it down before; until this file no assertion in the estate exercised a ProjectEditor through that trigger, since `23-nominations-write.test.sql` drives an entity user and a ProjectAdmin only. The entity confirmation flow the nomination flow depends on is pinned alongside it: section 5 gives the ProjectEditor `entity.confirm`, and `public.enforce_entity_immutability ()` is where that permission is read.
--
-- The ProjectEditor is built as a GRANT ROW, not as a claim. The token's grants claim is projected from `public.grants` (`set_test_user` asserts the two agree, `set_test_grants` merges the projection), so the only honest way to make a ProjectEditor is to insert a project-scope `editor` grant as postgres -- exactly the fixture `12-user-can.test.sql` builds for its ProjectEditor answer vector. The identity used is `admin_b`, whose fixture grant (ProjectAdmin of project B) is deliberately NOT seeded here, and the file asserts at both ends that the editor grant is the only grant that identity holds, so no assertion below can pass on a caller that is secretly an admin.
--
-- Every identity below is entered with an EMPTY grant array, because a non-empty array makes `set_test_user` seed the whole fixture's grants -- which would give `admin_b` its project B admin grant back.
--
-- Each refusal has a paired allowance. A refusal alone passes equally against a trigger that blocks every write; the ProjectAdmin's edit-and-confirm in one statement is what shows the ProjectEditor's refusal is the missing `nomination.confirm` and not a blanket block, and the ProjectEditor's accepted change of an entity's flag is what shows the entity user's refusal is the missing `entity.confirm`.
--
-- Reads that decide an assertion are made as postgres, so what is measured is the row and not what the caller's row-level security happens to let it see.
--
-- THE ORDINAL: 32, the lowest prefix above the maximum in use (the tree holds 00-12 and 14-31), per the ratified-registry rule (D-28) as 162-17 applied it.
--
-- Depends on: 00-helpers.test.sql (create_test_data, set_test_user, set_test_grants, reset_role, test_id, test_user_id, test_seed_identity_grants).
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (13);

SELECT
  create_test_data ();

-- `try_edit_nomination` reports how many rows an edit of one nomination actually affected, under whatever row-level security the CALLING session carries -- the same instrument `23-nominations-write.test.sql` uses, for the same reason.
--
-- ⚠ IT MUST NOT BE SECURITY DEFINER. Owner rights would make every caller's edit succeed, the trigger would see postgres rather than `authenticated`, and every assertion below would pass against any policy and any trigger. It is created as postgres before the first role switch and lives in `pg_temp`, so it is rolled back with the transaction.
CREATE FUNCTION pg_temp.try_edit_nomination (p_id uuid, p_note text) RETURNS integer LANGUAGE plpgsql AS $fn$
DECLARE
  v_rows integer;
BEGIN
  UPDATE public.nominations
  SET custom_data = jsonb_build_object('note', p_note)
  WHERE id = p_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows;
END;
$fn$;

-- =====================================================================
-- Fixture: the ProjectEditor, the ProjectAdmin and the entity user
-- =====================================================================
INSERT INTO
  grants (user_id, scope, target_type, target_id, role)
VALUES
  (
    test_user_id ('admin_b'),
    'project',
    NULL,
    test_id ('project_a'),
    'editor'
  );

SELECT
  test_seed_identity_grants ('admin_a');

SELECT
  test_seed_identity_grants ('candidate_a');

SELECT
  is (
    (
      SELECT
        count(*) FILTER (
          WHERE
            scope = 'project'
            AND target_id = test_id ('project_a')
            AND role = 'editor'
        ) || ' of ' || count(*)
      FROM
        grants
      WHERE
        user_id = test_user_id ('admin_b')
    ),
    '1 of 1',
    'the ProjectEditor holds exactly one grant, and it is the project-scope editor grant on project A -- no admin grant anywhere'
  );

SELECT
  is (
    (
      SELECT
        confirmed
      FROM
        nominations
      WHERE
        id = test_id ('nomination_cand_a')
    ),
    true,
    'the nomination the flow is driven through starts CONFIRMED -- so an unconfirmation below is something the edit did'
  );

-- =====================================================================
-- L0: the caller IS level 1
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_b'),
    '[]'::jsonb
  );

SELECT
  set_test_grants (test_user_id ('admin_b'));

SELECT
  ok (
    user_can (
      'project',
      test_id ('project_a'),
      'project.edit_nominations'
    ),
    'L0: the ProjectEditor holds project.edit_nominations on project A -- it is an editor of this project'
  );

SELECT
  ok (
    NOT user_can (
      'project',
      test_id ('project_a'),
      'nomination.confirm'
    ),
    'L0: the ProjectEditor does NOT hold nomination.confirm on project A -- the section 6 subtraction, so the caller below is level 1 and not an admin'
  );

-- =====================================================================
-- L1, L2: the ProjectEditor through enforce_nomination_confirmation
-- =====================================================================
SELECT
  is (
    pg_temp.try_edit_nomination (
      test_id ('nomination_cand_a'),
      'edited by the project editor'
    ),
    1,
    'L1: the ProjectEditor edits a confirmed nomination in its project and exactly one row is affected -- nomination.edit is held'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        confirmed
      FROM
        nominations
      WHERE
        id = test_id ('nomination_cand_a')
    ),
    false,
    'L1: the ProjectEditor''s edit leaves the nomination UNCONFIRMED -- rule 2 of enforce_nomination_confirmation applies to level 1, so only a confirm-holder can restore it'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_b'),
    '[]'::jsonb
  );

SELECT
  set_test_grants (test_user_id ('admin_b'));

SELECT
  throws_like (
    format(
      $$UPDATE nominations SET confirmed = true WHERE id = '%s'$$,
      test_id ('nomination_cand_a')
    ),
    '%nomination.confirm%',
    'L2: the ProjectEditor turning confirmation ON is REFUSED, naming nomination.confirm -- the level-1 subtraction exercised through the flow it governs'
  );

-- =====================================================================
-- L3: the paired control -- a ProjectAdmin edits and confirms in one statement
-- =====================================================================
SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

SELECT
  set_test_grants (test_user_id ('admin_a'));

UPDATE nominations
SET
  custom_data = '{"note":"edited and confirmed by the project admin"}'::jsonb,
  confirmed = true
WHERE
  id = test_id ('nomination_cand_a');

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        confirmed
      FROM
        nominations
      WHERE
        id = test_id ('nomination_cand_a')
    ),
    true,
    'L3: the ProjectAdmin edits and confirms the same nomination in ONE statement -- so L2''s refusal is the missing nomination.confirm and not a blanket block'
  );

-- =====================================================================
-- L4, L5: the entity confirmation flow, through enforce_entity_immutability
-- =====================================================================
SELECT
  is (
    (
      SELECT
        confirmed
      FROM
        candidates
      WHERE
        id = test_id ('candidate_a')
    ),
    true,
    'the candidate the entity flow is driven through starts CONFIRMED -- so the ProjectEditor''s write below changes the flag rather than restating it'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_b'),
    '[]'::jsonb
  );

SELECT
  set_test_grants (test_user_id ('admin_b'));

SELECT
  lives_ok (
    format(
      $$UPDATE candidates SET confirmed = false WHERE id = '%s'$$,
      test_id ('candidate_a')
    ),
    'L4: the ProjectEditor may change an entity''s confirmed flag -- entity.confirm is held at level 1'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        confirmed
      FROM
        candidates
      WHERE
        id = test_id ('candidate_a')
    ),
    false,
    'L4: the ProjectEditor''s change of the entity flag LANDED -- the statement did not merely survive while affecting nothing'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    '[]'::jsonb
  );

SELECT
  set_test_grants (test_user_id ('candidate_a'));

SELECT
  throws_like (
    format(
      $$UPDATE candidates SET confirmed = true WHERE id = '%s'$$,
      test_id ('candidate_a')
    ),
    'Entity confirmation requires the entity.confirm permission:%',
    'L5: the entity user changing its own confirmed flag is REFUSED by name -- the paired contrast to L4, entity.confirm withheld from entity users'
  );

-- =====================================================================
-- Closing: the ProjectEditor stayed level 1 throughout
-- =====================================================================
SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        grants
      WHERE
        user_id = test_user_id ('admin_b')
    ),
    1,
    'the ProjectEditor still holds exactly one grant at the end -- no identity switch above re-seeded its admin grant'
  );

SELECT
  *
FROM
  finish ();

ROLLBACK;
