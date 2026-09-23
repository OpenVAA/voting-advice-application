-- 19-entity-immutability.test.sql: the conditional identity freeze and the confirmation gate (162-13)
--
-- THE ORDINAL IS DERIVED, NOT REGISTRY-ASSIGNED. The phase registry assigns `19-entity-policies` to 162-10 and `18-entity-immutability` here, but 162-10 actually shipped `18-entity-policies.test.sql`, so the assigned prefix would COLLIDE. The on-disk ordinals were 00-18, 21, 22 and 23 when this file was written; 19 is the lowest free two-digit prefix and that is what governs.
--
-- WHAT THIS FILE IS FOR, AND THE FAILURE IT IS SHAPED AGAINST. `enforce_entity_immutability()` refuses two things and permits a third, and the characteristic failure of a rule like it is SILENCE: a trigger attached to the wrong verb, or carrying an `UPDATE OF` list that omits the column it was written to protect, does not error -- it permits, and permitting is what the tree did before. A file full of refusals would pass just as well against a trigger that refused EVERYTHING. So every deny here has a paired allow and every allow has a paired deny, and the grid is THREE-CELLED rather than two:
--
--   cell 1  entity grantee, CONFIRMED row               -> refused, naming the column
--   cell 2  entity grantee, UNCONFIRMED row             -> ALLOWED, and the new value is read back
--   cell 3  entity.edit_immutable holder, CONFIRMED row -> allowed, and the new value is read back
--
-- Cell 1 alone is satisfied by a rule that simply denies the entity user, which is section 8.7(c) -- the option the operator did not take. Cell 3 alone is satisfied by a rule that denies nobody. CELL 2 IS THE ONLY ONE THAT OBSERVES CONDITIONALITY, and it is the cell a file in a hurry drops. It carries its own negative control: a variant of the trigger body with the OLD-flag guard removed -- an absolute freeze -- is run against this whole file and the count of reddened assertions is recorded in 162-13's SUMMARY.
--
-- THE FIXTURE GIVES ONLY ONE POLARITY, so this file makes the other one, per table, inside its own transaction. `create_test_data ()` confirms every project A entity, so the middle cell has no unconfirmed row to stand on. Each grid section therefore runs cells 1 and 3 on the confirmed row, then unconfirms that same row AS THE OWNER, runs cell 2, and re-confirms. The polarity guard in section 0 asserts the pre-state is real, because a middle cell run against a row that was confirmed all along would be asserting cell 1 twice under two names.
--
-- THE FACTION AND ALLIANCE GRANTEES ARE BUILT HERE. `create_test_data ()` gives entity grants to a candidate and an organization only, so this file inserts two auth users and two entity-scope grant rows directly, following 162-04's precedent, and lets `set_test_user` project them into the session claims through `test_grants_claim`. `set_test_user` is NOT given a fourth parameter (162-04's M6): a `CREATE OR REPLACE` cannot change an argument list, and a fourth would overload the 66 three-argument call sites across this estate.
--
-- Depends on: 00-helpers.test.sql (set_test_user, create_test_data, test_id, test_user_id, test_user_grants, reset_role) 011-validation-functions.sql (enforce_entity_immutability) 102-entities.sql (the four registrations) 303-column-grants.sql (the four UPDATE allow-lists)
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (70);

SELECT
  create_test_data ();

-- Runs a statement and returns its refusal message, or the literal '(no exception)' when the statement succeeds. Needed because pgTAP here has no `throws_unlike`: a NEGATIVE claim about WHICH refusal was raised cannot be made with `throws_like` alone, and section 6's rule-order assertion is exactly such a claim.
CREATE OR REPLACE FUNCTION pg_temp.capture_refusal (p_sql text) RETURNS text LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE p_sql;
  RETURN '(no exception)';
EXCEPTION
  WHEN OTHERS THEN
    RETURN SQLERRM;
END;
$$;

-- =====================================================================
-- Section 0: the fixture this file adds, and the polarity the grid stands on
-- =====================================================================
SELECT
  reset_role ();

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
    'cccccccc-cccc-cccc-cccc-000000000f01'::uuid,
    '00000000-0000-0000-0000-000000000000',
    'faction_editor_a@test.com',
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
    'cccccccc-cccc-cccc-cccc-000000000f02'::uuid,
    '00000000-0000-0000-0000-000000000000',
    'alliance_editor_a@test.com',
    crypt ('testpass', gen_salt ('bf')),
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

INSERT INTO
  public.grants (user_id, scope, target_type, target_id, role)
VALUES
  (
    'cccccccc-cccc-cccc-cccc-000000000f01'::uuid,
    'entity',
    'faction',
    test_id ('faction_a'),
    'editor'
  ),
  (
    'cccccccc-cccc-cccc-cccc-000000000f02'::uuid,
    'entity',
    'alliance',
    test_id ('alliance_a'),
    'editor'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        (
          SELECT
            confirmed
          FROM
            organizations
          WHERE
            id = test_id ('org_a')
          UNION ALL
          SELECT
            confirmed
          FROM
            candidates
          WHERE
            id = test_id ('candidate_a')
          UNION ALL
          SELECT
            confirmed
          FROM
            factions
          WHERE
            id = test_id ('faction_a')
          UNION ALL
          SELECT
            confirmed
          FROM
            alliances
          WHERE
            id = test_id ('alliance_a')
        ) p
      WHERE
        confirmed
    )::integer,
    4,
    'the pre-state is real: one CONFIRMED row on each of the four entity tables, so every cell 1 and cell 3 below observes the rule firing rather than the row being in the other state'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        public.grants
      WHERE
        user_id IN (
          'cccccccc-cccc-cccc-cccc-000000000f01'::uuid,
          'cccccccc-cccc-cccc-cccc-000000000f02'::uuid
        )
    )::integer,
    2,
    'the two entity grants this file adds exist as ROWS, so the faction and alliance callers below are grantees rather than grantless sessions that would be refused for the wrong reason'
  );

SELECT
  ok (
    (
      SELECT
        NOT bool_or(
          public.user_can ('entity', t.id, 'entity.edit_immutable')
        )
      FROM
        (
          SELECT
            test_id ('candidate_a') AS id
        ) t
    ),
    'the grantee this file impersonates first holds NO entity.edit_immutable, checked through user_can rather than assumed, so cell 1''s refusal is the rule and not a missing grant'
  );

-- =====================================================================
-- Section 1: the grid on candidates -- the only entity table whose protected set has TWO members
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  throws_like (
    format(
      $$UPDATE candidates SET first_name = 'Renamed' WHERE id = '%s'$$,
      test_id ('candidate_a')
    ),
    'Entity name is immutable once confirmed:%',
    'candidates cell 1 (first_name): an entity grantee renaming a CONFIRMED entity is refused, and the refusal carries the immutability prefix'
  );

SELECT
  throws_like (
    format(
      $$UPDATE candidates SET last_name = 'Renamed' WHERE id = '%s'$$,
      test_id ('candidate_a')
    ),
    'Entity name is immutable once confirmed:%',
    'candidates cell 1 (last_name): the second protected column on this table is refused too, so the rule is per column rather than per table'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    test_user_grants ('admin_a')
  );

SELECT
  lives_ok (
    format(
      $$UPDATE candidates SET first_name = 'Corrected' WHERE id = '%s'$$,
      test_id ('candidate_a')
    ),
    'candidates cell 3 (first_name): a holder of entity.edit_immutable renames the CONFIRMED entity the grantee was just refused'
  );

SELECT
  lives_ok (
    format(
      $$UPDATE candidates SET last_name = 'Corrected' WHERE id = '%s'$$,
      test_id ('candidate_a')
    ),
    'candidates cell 3 (last_name): the same holder corrects the second protected column'
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
    'Corrected',
    'candidates cell 3 (first_name): the administrator''s correction is what is stored'
  );

SELECT
  is (
    (
      SELECT
        last_name
      FROM
        candidates
      WHERE
        id = test_id ('candidate_a')
    ),
    'Corrected',
    'candidates cell 3 (last_name): the administrator''s correction is what is stored'
  );

UPDATE candidates
SET
  confirmed = false
WHERE
  id = test_id ('candidate_a');

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  lives_ok (
    format(
      $$UPDATE candidates SET first_name = 'SignedUp' WHERE id = '%s'$$,
      test_id ('candidate_a')
    ),
    'candidates cell 2 (first_name): the SAME grantee renaming the SAME row once it is UNCONFIRMED is allowed -- this is the sign-up flow, and an absolute freeze would make it impossible'
  );

SELECT
  lives_ok (
    format(
      $$UPDATE candidates SET last_name = 'SignedUp' WHERE id = '%s'$$,
      test_id ('candidate_a')
    ),
    'candidates cell 2 (last_name): the second protected column is likewise editable while unconfirmed'
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
    'SignedUp',
    'candidates cell 2 (first_name): the value the grantee wrote to the unconfirmed row is what is stored, so the allow is a write rather than a silently dropped one'
  );

SELECT
  is (
    (
      SELECT
        last_name
      FROM
        candidates
      WHERE
        id = test_id ('candidate_a')
    ),
    'SignedUp',
    'candidates cell 2 (last_name): the value the grantee wrote to the unconfirmed row is what is stored'
  );

UPDATE candidates
SET
  confirmed = true
WHERE
  id = test_id ('candidate_a');

-- =====================================================================
-- Section 2: the grid on organizations
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('organization_a'),
    test_user_grants ('organization_a')
  );

SELECT
  throws_like (
    format(
      $$UPDATE organizations SET name = '{"en":"Renamed"}'::jsonb WHERE id = '%s'$$,
      test_id ('org_a')
    ),
    'Entity name is immutable once confirmed:%',
    'organizations cell 1: an entity grantee renaming a CONFIRMED entity is refused'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    test_user_grants ('admin_a')
  );

SELECT
  lives_ok (
    format(
      $$UPDATE organizations SET name = '{"en":"Corrected"}'::jsonb WHERE id = '%s'$$,
      test_id ('org_a')
    ),
    'organizations cell 3: a holder of entity.edit_immutable renames the CONFIRMED entity'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        name ->> 'en'
      FROM
        organizations
      WHERE
        id = test_id ('org_a')
    ),
    'Corrected',
    'organizations cell 3: the administrator''s correction is what is stored'
  );

UPDATE organizations
SET
  confirmed = false
WHERE
  id = test_id ('org_a');

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('organization_a'),
    test_user_grants ('organization_a')
  );

SELECT
  lives_ok (
    format(
      $$UPDATE organizations SET name = '{"en":"SignedUp"}'::jsonb WHERE id = '%s'$$,
      test_id ('org_a')
    ),
    'organizations cell 2: the same grantee renaming the same row once it is UNCONFIRMED is allowed'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        name ->> 'en'
      FROM
        organizations
      WHERE
        id = test_id ('org_a')
    ),
    'SignedUp',
    'organizations cell 2: the value the grantee wrote to the unconfirmed row is what is stored'
  );

UPDATE organizations
SET
  confirmed = true
WHERE
  id = test_id ('org_a');

-- =====================================================================
-- Section 3: the grid on factions
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-000000000f01'::uuid,
    '[]'::jsonb
  );

SELECT
  throws_like (
    format(
      $$UPDATE factions SET name = '{"en":"Renamed"}'::jsonb WHERE id = '%s'$$,
      test_id ('faction_a')
    ),
    'Entity name is immutable once confirmed:%',
    'factions cell 1: an entity grantee renaming a CONFIRMED entity is refused -- on a table that had no non-admin write path at all before 162-10'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    test_user_grants ('admin_a')
  );

SELECT
  lives_ok (
    format(
      $$UPDATE factions SET name = '{"en":"Corrected"}'::jsonb WHERE id = '%s'$$,
      test_id ('faction_a')
    ),
    'factions cell 3: a holder of entity.edit_immutable renames the CONFIRMED entity'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        name ->> 'en'
      FROM
        factions
      WHERE
        id = test_id ('faction_a')
    ),
    'Corrected',
    'factions cell 3: the administrator''s correction is what is stored'
  );

UPDATE factions
SET
  confirmed = false
WHERE
  id = test_id ('faction_a');

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-000000000f01'::uuid,
    '[]'::jsonb
  );

SELECT
  lives_ok (
    format(
      $$UPDATE factions SET name = '{"en":"SignedUp"}'::jsonb WHERE id = '%s'$$,
      test_id ('faction_a')
    ),
    'factions cell 2: the same grantee renaming the same row once it is UNCONFIRMED is allowed'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        name ->> 'en'
      FROM
        factions
      WHERE
        id = test_id ('faction_a')
    ),
    'SignedUp',
    'factions cell 2: the value the grantee wrote to the unconfirmed row is what is stored'
  );

UPDATE factions
SET
  confirmed = true
WHERE
  id = test_id ('faction_a');

-- =====================================================================
-- Section 4: the grid on alliances
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-000000000f02'::uuid,
    '[]'::jsonb
  );

SELECT
  throws_like (
    format(
      $$UPDATE alliances SET name = '{"en":"Renamed"}'::jsonb WHERE id = '%s'$$,
      test_id ('alliance_a')
    ),
    'Entity name is immutable once confirmed:%',
    'alliances cell 1: an entity grantee renaming a CONFIRMED entity is refused'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    test_user_grants ('admin_a')
  );

SELECT
  lives_ok (
    format(
      $$UPDATE alliances SET name = '{"en":"Corrected"}'::jsonb WHERE id = '%s'$$,
      test_id ('alliance_a')
    ),
    'alliances cell 3: a holder of entity.edit_immutable renames the CONFIRMED entity'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        name ->> 'en'
      FROM
        alliances
      WHERE
        id = test_id ('alliance_a')
    ),
    'Corrected',
    'alliances cell 3: the administrator''s correction is what is stored'
  );

UPDATE alliances
SET
  confirmed = false
WHERE
  id = test_id ('alliance_a');

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-000000000f02'::uuid,
    '[]'::jsonb
  );

SELECT
  lives_ok (
    format(
      $$UPDATE alliances SET name = '{"en":"SignedUp"}'::jsonb WHERE id = '%s'$$,
      test_id ('alliance_a')
    ),
    'alliances cell 2: the same grantee renaming the same row once it is UNCONFIRMED is allowed'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        name ->> 'en'
      FROM
        alliances
      WHERE
        id = test_id ('alliance_a')
    ),
    'SignedUp',
    'alliances cell 2: the value the grantee wrote to the unconfirmed row is what is stored'
  );

UPDATE alliances
SET
  confirmed = true
WHERE
  id = test_id ('alliance_a');

-- =====================================================================
-- Section 5: the confirmation gate, in BOTH directions, on each of the four entity tables
-- =====================================================================
-- The direction that looks harmless is the load-bearing one. An entity user who can turn the flag OFF can unfreeze their own name and every assertion above becomes decorative, so false-to-true and true-to-false are BOTH refused and both are asserted -- four times over, because a registration that never fired on one table would otherwise hide behind three that did.
--
-- THE VALUE WRITTEN IS ALWAYS THE OPPOSITE OF THE ROW'S. Rule 1 compares old to new with `IS DISTINCT FROM`, so writing `true` to an already-confirmed row is a no-op the trigger correctly permits -- MEASURED while writing this file, as a refusal that did not come.
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  throws_like (
    format(
      $$UPDATE candidates SET confirmed = false WHERE id = '%s'$$,
      test_id ('candidate_a')
    ),
    'Entity confirmation requires the entity.confirm permission:%',
    'candidates: an entity grantee cannot UNCONFIRM its own entity -- the direction that would unfreeze the name'
  );

SELECT
  throws_ok (
    format(
      $$UPDATE candidates SET confirmed = false WHERE id = '%s'$$,
      test_id ('candidate_a')
    ),
    'P0001',
    NULL,
    'candidates: the confirmation refusal is a raised trigger exception (P0001) and no longer a privilege error (42501), so the column really did enter the allow-list'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    test_user_grants ('admin_a')
  );

SELECT
  lives_ok (
    format(
      $$UPDATE candidates SET confirmed = false WHERE id = '%s'$$,
      test_id ('candidate_a')
    ),
    'candidates: a holder of entity.confirm may turn the flag off -- the permission the retired privilege bar made unexercisable through this role'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  throws_like (
    format(
      $$UPDATE candidates SET confirmed = true WHERE id = '%s'$$,
      test_id ('candidate_a')
    ),
    'Entity confirmation requires the entity.confirm permission:%',
    'candidates: an entity grantee cannot confirm its own entity either'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    test_user_grants ('admin_a')
  );

SELECT
  lives_ok (
    format(
      $$UPDATE candidates SET confirmed = true WHERE id = '%s'$$,
      test_id ('candidate_a')
    ),
    'candidates: the same holder may turn the flag back on'
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
    true,
    'candidates: the holder''s two flag moves are what is stored, so the allows are writes rather than silently dropped ones'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('organization_a'),
    test_user_grants ('organization_a')
  );

SELECT
  throws_like (
    format(
      $$UPDATE organizations SET confirmed = false WHERE id = '%s'$$,
      test_id ('org_a')
    ),
    'Entity confirmation requires the entity.confirm permission:%',
    'organizations: an entity grantee cannot UNCONFIRM its own entity'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    test_user_grants ('admin_a')
  );

SELECT
  lives_ok (
    format(
      $$UPDATE organizations SET confirmed = false WHERE id = '%s'$$,
      test_id ('org_a')
    ),
    'organizations: a holder of entity.confirm may turn the flag off'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('organization_a'),
    test_user_grants ('organization_a')
  );

SELECT
  throws_like (
    format(
      $$UPDATE organizations SET confirmed = true WHERE id = '%s'$$,
      test_id ('org_a')
    ),
    'Entity confirmation requires the entity.confirm permission:%',
    'organizations: an entity grantee cannot confirm its own entity'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    test_user_grants ('admin_a')
  );

SELECT
  lives_ok (
    format(
      $$UPDATE organizations SET confirmed = true WHERE id = '%s'$$,
      test_id ('org_a')
    ),
    'organizations: the same holder may turn the flag back on'
  );

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-000000000f01'::uuid,
    '[]'::jsonb
  );

SELECT
  throws_like (
    format(
      $$UPDATE factions SET confirmed = false WHERE id = '%s'$$,
      test_id ('faction_a')
    ),
    'Entity confirmation requires the entity.confirm permission:%',
    'factions: an entity grantee cannot UNCONFIRM its own entity'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    test_user_grants ('admin_a')
  );

SELECT
  lives_ok (
    format(
      $$UPDATE factions SET confirmed = false WHERE id = '%s'$$,
      test_id ('faction_a')
    ),
    'factions: a holder of entity.confirm may turn the flag off'
  );

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-000000000f01'::uuid,
    '[]'::jsonb
  );

SELECT
  throws_like (
    format(
      $$UPDATE factions SET confirmed = true WHERE id = '%s'$$,
      test_id ('faction_a')
    ),
    'Entity confirmation requires the entity.confirm permission:%',
    'factions: an entity grantee cannot confirm its own entity'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    test_user_grants ('admin_a')
  );

SELECT
  lives_ok (
    format(
      $$UPDATE factions SET confirmed = true WHERE id = '%s'$$,
      test_id ('faction_a')
    ),
    'factions: the same holder may turn the flag back on'
  );

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-000000000f02'::uuid,
    '[]'::jsonb
  );

SELECT
  throws_like (
    format(
      $$UPDATE alliances SET confirmed = false WHERE id = '%s'$$,
      test_id ('alliance_a')
    ),
    'Entity confirmation requires the entity.confirm permission:%',
    'alliances: an entity grantee cannot UNCONFIRM its own entity'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    test_user_grants ('admin_a')
  );

SELECT
  lives_ok (
    format(
      $$UPDATE alliances SET confirmed = false WHERE id = '%s'$$,
      test_id ('alliance_a')
    ),
    'alliances: a holder of entity.confirm may turn the flag off'
  );

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-000000000f02'::uuid,
    '[]'::jsonb
  );

SELECT
  throws_like (
    format(
      $$UPDATE alliances SET confirmed = true WHERE id = '%s'$$,
      test_id ('alliance_a')
    ),
    'Entity confirmation requires the entity.confirm permission:%',
    'alliances: an entity grantee cannot confirm its own entity'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    test_user_grants ('admin_a')
  );

SELECT
  lives_ok (
    format(
      $$UPDATE alliances SET confirmed = true WHERE id = '%s'$$,
      test_id ('alliance_a')
    ),
    'alliances: the same holder may turn the flag back on'
  );

-- =====================================================================
-- Section 6: the rule ORDER, and the OLD flag rule 2 reads
-- =====================================================================
-- ⚠ THE PLAN'S PRESCRIBED CASE FOR THIS SECTION IS UNREACHABLE, AND THE SUBSTITUTE BELOW IS WHY. 162-13's plan asks for a caller holding `entity.confirm` and NOT `entity.edit_immutable`, "reachable only from a hand-built claim". MEASURED: it is reachable from no claim at all. `user_can` does not read a permission list out of the token -- it reads a SCOPE, a ROLE and a TARGET and asks `grant_role_permissions` for the verbs -- and in that matrix the two permissions appear in exactly the same four rows (global admin, account admin, project admin, project editor). No claim, hand-built or otherwise, can separate them.
--
-- What IS observable is the ORDER of the two rules, and it is observable exactly where it matters: a caller who tries to unfreeze AND rename in ONE statement. Rule 1 runs first, so that caller is stopped at the confirmation gate and the refusal carries the CONFIRMATION prefix. Were the freeze evaluated first, the same statement would be refused with the IMMUTABILITY prefix instead. Both possibilities are asserted -- one positively, one negatively -- so the assertion distinguishes them rather than merely passing.
--
-- The OLD-versus-NEW reading is then pinned structurally, on `pg_proc.prosrc`, because that substitution has no behavioural consequence the matrix can expose. A rewrite of the guard to `NEW.confirmed` reddens the last assertion in this section.
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  throws_like (
    format(
      $$UPDATE candidates SET confirmed = false, first_name = 'Unfrozen' WHERE id = '%s'$$,
      test_id ('candidate_a')
    ),
    'Entity confirmation requires the entity.confirm permission:%',
    'rule order: a caller trying to unfreeze AND rename in one statement is stopped at the CONFIRMATION gate, so rule 1 runs before rule 2'
  );

-- pgTAP on this tree carries `throws_like` but NO `throws_unlike` -- MEASURED, as a `function throws_unlike(text, unknown, unknown) does not exist` that ABORTED the transaction and produced no `not ok` line at all, which is exactly the instrument failure D-37 describes. The negative half is therefore expressed as `unalike` over a captured message. The helper is created in the session-temporary schema and dies with this transaction; it is SECURITY INVOKER by default, so the statement runs as whichever caller the session currently is.
SELECT
  unalike (
    pg_temp.capture_refusal (
      format(
        $$UPDATE candidates SET confirmed = false, first_name = 'Unfrozen' WHERE id = '%s'$$,
        test_id ('candidate_a')
      )
    ),
    'Entity name is immutable once confirmed:%',
    'rule order, the negative half: that same statement is NOT refused with the immutability prefix, which is what the opposite order would have produced'
  );

SELECT
  reset_role ();

SELECT
  matches (
    (
      SELECT
        p.prosrc
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'public'
        AND p.proname = 'enforce_entity_immutability'
    ),
    'IF OLD\.confirmed THEN',
    'rule 2 is guarded on the OLD row''s flag, read from pg_proc.prosrc -- a rewrite to NEW.confirmed would make the freeze absolute for any statement that confirms and renames at once, and section 3.3 produces no caller that can tell the two apart behaviourally'
  );

-- =====================================================================
-- Section 7: the structural census -- a trigger that does not fire is indistinguishable from a rule that permits
-- =====================================================================
SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        pg_enum e
        JOIN pg_type t ON t.oid = e.enumtypid
      WHERE
        t.typname = 'entity_type'
    )::integer,
    4,
    'the entity-type population is DERIVED from the catalogue at 4, so the registration count below is compared against a measurement rather than a literal and a fifth entity type would be counted'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        pg_trigger t
        JOIN pg_proc p ON p.oid = t.tgfoid
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'public'
        AND p.proname = 'enforce_entity_immutability'
    )::integer,
    (
      SELECT
        count(*)
      FROM
        pg_enum e
        JOIN pg_type t ON t.oid = e.enumtypid
      WHERE
        t.typname = 'entity_type'
    )::integer,
    'one registration per entity type, compared against the derived population rather than against the number four'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        pg_trigger t
        JOIN pg_proc p ON p.oid = t.tgfoid
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'public'
        AND p.proname = 'enforce_entity_immutability'
        AND t.tgenabled = 'O'
        AND (t.tgtype & 2) <> 0
        AND (t.tgtype & 16) <> 0
        AND (t.tgtype & 1) <> 0
    )::integer,
    4,
    'all four registrations are BEFORE UPDATE, FOR EACH ROW, and enabled with the ORIGIN setting -- a disabled trigger is a rule that permits, and it is the failure this census exists to catch'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          c.relname || '=' || COALESCE(
            (
              SELECT
                string_agg(
                  a.attname,
                  ','
                  ORDER BY
                    a.attname
                )
              FROM
                unnest(t.tgattr) AS k (attnum)
                JOIN pg_attribute a ON a.attrelid = c.oid
                AND a.attnum = k.attnum
            ),
            'UNRESTRICTED'
          ),
          ' '
          ORDER BY
            c.relname
        )
      FROM
        pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        JOIN pg_proc p ON p.oid = t.tgfoid
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'public'
        AND p.proname = 'enforce_entity_immutability'
    ),
    'alliances=confirmed,name candidates=confirmed,first_name,last_name factions=confirmed,name organizations=confirmed,name',
    'each registration is restricted to exactly that table''s protected name columns plus the confirmation column -- four SET comparisons, not four counts, because a list that omits the column it guards is a rule that silently never fires'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          c.relname || '=' || (
            regexp_match(
              pg_get_triggerdef(t.oid),
              'enforce_entity_immutability\((.*)\)$'
            )
          ) [1],
          ' '
          ORDER BY
            c.relname
        )
      FROM
        pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        JOIN pg_proc p ON p.oid = t.tgfoid
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'public'
        AND p.proname = 'enforce_entity_immutability'
    ),
    'alliances=''name'' candidates=''first_name'', ''last_name'' factions=''name'' organizations=''name''',
    'the ARGUMENT list of each registration is that table''s protected name columns -- a registration whose UPDATE OF list names a column it does not pass as an argument is a rule that never fires for that column'
  );

SELECT
  is (
    (
      SELECT
        p.prosecdef::text || '|' || t.typname
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        JOIN pg_type t ON t.oid = p.prorettype
      WHERE
        n.nspname = 'public'
        AND p.proname = 'enforce_entity_immutability'
    ),
    'false|trigger',
    'the function is INVOKER-mode and returns the trigger type -- a SECURITY DEFINER body reports the owner as current_user, the role guard would never match, and both rules would silently never bind'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace,
        LATERAL (
          SELECT
            string_agg(e.enumlabel, '|') AS pat
          FROM
            pg_enum e
            JOIN pg_type t ON t.oid = e.enumtypid
          WHERE
            t.typname = 'entity_type'
        ) x
      WHERE
        n.nspname = 'public'
        AND p.proname = 'enforce_entity_immutability'
        AND p.prosrc ~ x.pat
    )::integer,
    0,
    'D-21: the function body names NO entity type, with the label list derived from pg_enum at run time over the population asserted non-empty above'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE
        n.nspname = 'public'
        AND c.relname IN (
          'organizations',
          'candidates',
          'factions',
          'alliances'
        )
        AND NOT t.tgisinternal
        AND (t.tgtype & 2) <> 0
        AND (t.tgtype & 16) <> 0
        AND (t.tgtype & 1) <> 0
    )::integer,
    20,
    'the row-level BEFORE UPDATE trigger population on the four entity tables is 20 -- the 14 measured before 162-13, plus one registration per table, plus the two 162.1-03 cleanup_answer_files_on_update registrations on candidates and organizations, which read answers and assign no column. A future BEFORE trigger that modified a protected column without the statement naming it would escape the column restriction, so the population is bounded here rather than left unwatched'
  );

-- =====================================================================
-- Section 8: the privilege census -- the coarse outer bound, read from the catalogue and never from the file
-- =====================================================================
-- A comment cannot fake `information_schema`, and a block whose REVOKE was ordered after its GRANT would look correct in review and enforce nothing.
SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        information_schema.columns
      WHERE
        table_schema = 'public'
        AND table_name IN (
          'organizations',
          'candidates',
          'factions',
          'alliances'
        )
        AND column_name IN ('name', 'first_name', 'last_name')
    )::integer,
    5,
    'the protected-column population is DERIVED at 5 across the four entity tables -- one name column on three of them and two personal-name columns on the fourth -- so the census below is compared against a measurement'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        information_schema.role_table_grants
      WHERE
        grantee = 'authenticated'
        AND privilege_type = 'UPDATE'
        AND table_schema = 'public'
        AND table_name IN (
          'organizations',
          'candidates',
          'factions',
          'alliances'
        )
    )::integer,
    0,
    'no entity table grants TABLE-WIDE UPDATE to authenticated: all four are covered by a bounded column list, which is the asymmetry 162-07 recorded and 162-10 and 162-13 closed'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        information_schema.column_privileges
      WHERE
        grantee = 'authenticated'
        AND privilege_type = 'UPDATE'
        AND table_schema = 'public'
        AND table_name IN (
          'organizations',
          'candidates',
          'factions',
          'alliances'
        )
        AND column_name = 'confirmed'
    )::integer,
    4,
    'the confirmation column is inside the UPDATE allow-list on every one of the four entity tables -- the privilege bar 162-13 retired, asserted as retired rather than assumed'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        information_schema.column_privileges
      WHERE
        grantee = 'authenticated'
        AND privilege_type = 'UPDATE'
        AND table_schema = 'public'
        AND table_name IN (
          'organizations',
          'candidates',
          'factions',
          'alliances'
        )
        AND column_name IN ('name', 'first_name', 'last_name')
    )::integer,
    5,
    'every one of the five protected name columns is STILL inside its table''s allow-list -- removing them would freeze a name on an unconfirmed entity and make sign-up impossible, and this is the assertion that would catch it'
  );

SELECT
  ok (
    (
      SELECT
        bool_and(
          granted > 0
          AND granted < total
        )
      FROM
        (
          SELECT
            c.table_name,
            count(*) FILTER (
              WHERE
                p.column_name IS NOT NULL
            ) AS granted,
            count(*) AS total
          FROM
            information_schema.columns c
            LEFT JOIN information_schema.column_privileges p ON p.table_schema = c.table_schema
            AND p.table_name = c.table_name
            AND p.column_name = c.column_name
            AND p.grantee = 'authenticated'
            AND p.privilege_type = 'UPDATE'
          WHERE
            c.table_schema = 'public'
            AND c.table_name IN (
              'organizations',
              'candidates',
              'factions',
              'alliances'
            )
          GROUP BY
            c.table_name
        ) g
    ),
    'on all four entity tables the allow-list is a real bound: more than zero columns and strictly fewer than all of them. A count of zero would mean a REVOKE landed without its GRANT and the write path is dead; a count equal to the column count would mean the GRANT is not a bound at all'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        information_schema.column_privileges
      WHERE
        grantee = 'authenticated'
        AND privilege_type = 'UPDATE'
        AND table_schema = 'public'
        AND table_name IN (
          'organizations',
          'candidates',
          'factions',
          'alliances'
        )
        AND column_name IN ('project_id', 'id', 'external_id')
    )::integer,
    0,
    'the tenancy, identity and import-identity columns are outside every entity allow-list, so an entity editor still cannot move its own row into another project'
  );

-- =====================================================================
-- Section 9: the hot path, on BOTH tables that carry an answers column
-- =====================================================================
-- `upsert_answers` is the candidate application's hottest write and it names only the answers column. A column-restricted trigger fires only when one of its columns appears in the statement's SET list, decided once per statement from the parse tree, so that write never enters this function. The refusal beside it is what makes the success evidence: a trigger that refused everything would also produce the refusal, and only the PAIR distinguishes the column restriction working from the rule being absent.
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  lives_ok (
    format(
      $$UPDATE candidates SET answers = '{}'::jsonb WHERE id = '%s'$$,
      test_id ('candidate_a')
    ),
    'candidates hot path: an answers write on a CONFIRMED row by a caller holding no entity.edit_immutable succeeds, because the statement names no restricted column'
  );

SELECT
  throws_like (
    format(
      $$UPDATE candidates SET first_name = 'Sneaked' WHERE id = '%s'$$,
      test_id ('candidate_a')
    ),
    'Entity name is immutable once confirmed:%',
    'candidates hot path pair: that same caller, on that same row in that same transaction, is refused the name write'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('organization_a'),
    test_user_grants ('organization_a')
  );

SELECT
  lives_ok (
    format(
      $$UPDATE organizations SET answers = '{}'::jsonb WHERE id = '%s'$$,
      test_id ('org_a')
    ),
    'organizations hot path: the answers write succeeds on a CONFIRMED row'
  );

SELECT
  throws_like (
    format(
      $$UPDATE organizations SET name = '{"en":"Sneaked"}'::jsonb WHERE id = '%s'$$,
      test_id ('org_a')
    ),
    'Entity name is immutable once confirmed:%',
    'organizations hot path pair: the name write on that same row is refused'
  );

-- =====================================================================
-- Section 10: the role scope, in the direction that keeps the seeder working
-- =====================================================================
-- MEASURED before this rule was written: an UNSCOPED variant refused a service-role caller, because `user_can` reads the grant set from the JWT and a service-role token carries none -- so every re-seed, bulk import and fixture write that moved a name or a flag would have been refused. The scope is the effective database role, and this is the assertion that pins it in the permissive direction, beside its authenticated opposite on the same row in the same transaction. Accepted and recorded cost: a service-role path can rename a confirmed entity, the same latitude that role already has against row-level security and against the column grants, neither of which names it.
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  throws_like (
    format(
      $$UPDATE candidates SET first_name = 'Reseeded' WHERE id = '%s'$$,
      test_id ('candidate_a')
    ),
    'Entity name is immutable once confirmed:%',
    'the role scope, the bound half: an authenticated caller is refused the name change on the confirmed row'
  );

SELECT
  set_config('request.jwt.claims', '', true);

SELECT
  set_config('role', 'service_role', true);

SELECT
  lives_ok (
    format(
      $$UPDATE candidates SET first_name = 'Reseeded', confirmed = true WHERE id = '%s'$$,
      test_id ('candidate_a')
    ),
    'the role scope, the free half: a service-role caller changes both the protected name column and the confirmation flag on that same row in that same transaction'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        first_name || '/' || confirmed::text
      FROM
        candidates
      WHERE
        id = test_id ('candidate_a')
    ),
    'Reseeded/true',
    'the role scope: the service-role write landed, so the seeder path is open rather than merely unasserted'
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
