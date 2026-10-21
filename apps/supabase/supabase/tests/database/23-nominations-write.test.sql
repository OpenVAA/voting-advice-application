-- 23-nominations-write.test.sql: the nomination write model
--
-- 162-12 gives `public.nominations` a write model it has never had. Fact 19 records that this table was ADMIN-ONLY TO WRITE, so unlike every other plan in wave 4 this one does not convert existing policies -- it writes a permission surface from nothing. That is where the permissive failure lives, and the permissive failure is invisible: a policy that admits a row it should have refused breaks no test, reddens no gate and ships. Every assertion in this file therefore has a TWIN, and the guards are proven load-bearing by being individually removed and watched to turn an assertion green rather than by being argued for.
--
-- ⚠ THE ORDINAL IS FROM THE RATIFIED REGISTRY, NOT FROM THE TREE. `162-CONTEXT.md`'s pgTAP ordinal registry assigns `23-nominations-write` to 162-12. The tree's lowest free prefix is 19, and taking it would collide with the registry -- which exists precisely because deriving from the tree is correct alone and colliding collectively (three plans once claimed `17-`).
--
-- Synthetic rows use an `e2e12`-shaped id range -- `12121212-...` -- that no fixture, seed or sibling test file uses, following `11-question-rpcs.test.sql`'s stated precedent: an assertion that deletes must never remove a row a later assertion reads.
--
-- Depends on: 00-helpers.test.sql (set_test_user, reset_role, create_test_data, test_id, test_user_id, test_user_grants, test_seed_identity_grants).
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (141);

SELECT
  create_test_data ();

-- `try_edit_nomination` reports how many rows an edit of one nomination actually affected, under whatever row-level security the CALLING session carries. A data-modifying CTE cannot be nested inside a scalar subquery, so `is((WITH u AS (UPDATE ... RETURNING 1) SELECT count(*) FROM u), 0, ...)` is not a legal statement; this is the shape that is.
--
-- ⚠ IT MUST NOT BE `SECURITY DEFINER`. Owner rights would make every caller's edit succeed and every assertion below would pass against any policy at all, including no policy -- an instrument that reports success while measuring nothing. It is created as `postgres` before the first role switch and lives in `pg_temp`, so it is rolled back with the transaction.
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
-- Section 1: the confirmation column and its default
--
-- D-11c flips the column to the confirmed sense and makes it `NOT NULL DEFAULT false`. THE DEFAULT IS THE LOAD-BEARING HALF, not the name: section 11.5 guard 2 says the candidate-created parent is created unconfirmed and that the candidate cannot override that, fact 34 says the mechanism is the INSERT column grant, and a column absent from a `GRANT INSERT` column list takes its declared default rather than erroring. So `DEFAULT false` is what makes guard 2 true in the only case that matters -- the one where the caller does not name the column at all.
--
-- Test 2 is test 1's twin and it is not decoration: without it, test 1 would pass equally against a column that CANNOT be set at all, and would then be measuring an inability rather than a default.
-- =====================================================================
SELECT
  reset_role ();

INSERT INTO
  nominations (
    id,
    project_id,
    organization_id,
    election_id,
    constituency_id,
    election_round
  )
VALUES
  (
    '12121212-1212-1212-1212-000000000001'::uuid,
    test_id ('project_a'),
    test_id ('org_a'),
    test_id ('election_a'),
    test_id ('constituency_a'),
    7
  );

SELECT
  is (
    (
      SELECT
        confirmed
      FROM
        nominations
      WHERE
        id = '12121212-1212-1212-1212-000000000001'::uuid
    ),
    false,
    'a bare insert naming none of the confirmation column lands UNCONFIRMED -- the default section 11.5 guard 2 rests on'
  );

INSERT INTO
  nominations (
    id,
    project_id,
    organization_id,
    election_id,
    constituency_id,
    election_round,
    confirmed
  )
VALUES
  (
    '12121212-1212-1212-1212-000000000002'::uuid,
    test_id ('project_a'),
    test_id ('org_a'),
    test_id ('election_a'),
    test_id ('constituency_a'),
    8,
    true
  );

SELECT
  is (
    (
      SELECT
        confirmed
      FROM
        nominations
      WHERE
        id = '12121212-1212-1212-1212-000000000002'::uuid
    ),
    true,
    'the same insert naming the column as confirmed lands CONFIRMED -- so the assertion above measures the default and not an inability to set it'
  );

-- =====================================================================
-- Section 2: the confirmation transition
--
-- USER-RIGHTS says "when editing, turn confirmed false". The SYSTEM sets it, so this is a trigger and not a policy: a policy can refuse a row, it cannot rewrite one.
--
-- ⚠ RULE 2'S SCOPE IS THE EFFECTIVE DATABASE ROLE, and that is the choice most likely to be got wrong.
-- Scoping it to "the caller has a token" would catch the SERVICE-ROLE caller too, because PostgREST sets claims for that role as well, and a second `yarn db:seed` would then unconfirm every row it upserted.
-- Measured at Task 1 across three caller classes: `authenticated`, `service_role` and `anon` present three distinct strings, so the role test is expressible and does not depend on claim contents at all.
-- =====================================================================
SELECT
  test_seed_identity_grants ('candidate_a');

SELECT
  test_seed_identity_grants ('candidate_a2');

SELECT
  test_seed_identity_grants ('admin_a');

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

UPDATE nominations
SET
  custom_data = '{"note":"edited by the candidate"}'::jsonb
WHERE
  id = test_id ('nomination_cand_a');

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
    'an entity user editing their own confirmed nomination leaves it UNCONFIRMED -- the review gate, which an entity user who could edit and keep confirmation would have defeated'
  );

SELECT
  throws_like (
    format(
      $$UPDATE nominations SET confirmed = true WHERE id = '%s'$$,
      test_id ('nomination_cand_a')
    ),
    '%nomination.confirm%',
    'an entity user attempting to turn confirmation ON is REFUSED with a named exception -- silently ignoring an explicit request is how a client comes to believe it succeeded'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    test_user_grants ('admin_a')
  );

UPDATE nominations
SET
  custom_data = '{"note":"edited and confirmed by the admin"}'::jsonb,
  confirmed = true
WHERE
  id = test_id ('nomination_cand_a');

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
    'a holder of nomination.confirm may edit and confirm in ONE statement -- the paired opposite of the two assertions above'
  );

SELECT
  reset_role ();

UPDATE nominations
SET
  custom_data = '{"note":"re-seeded by the service role"}'::jsonb,
  confirmed = true
WHERE
  id = test_id ('nomination_cand_a');

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
    'an update performed with no authenticated role in effect leaves the flag exactly as supplied -- what stops a service-role re-seed unconfirming everything it upserts'
  );

-- =====================================================================
-- Section 3: the entity update policy, and the nominations lock
--
-- The lock is the app setting `access.nominationsLocked`. `private.project_nominations_locked` reads it from the project's `app_settings` row, and that function is a conjunct of the three policies through which an entity user writes this table. Each of the three carries a pair that differs in the setting alone: the update in this section, the parent insert at G4 and the entity's own insert at OWN. The admin policies do not call the function, and the control below shows it. Section 10 asserts which stored values lock.
--
-- Every write of the setting merges one key into the stored object, so whatever else the row holds stays as it is.
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a2'),
    test_user_grants ('candidate_a2')
  );

SELECT
  is (
    pg_temp.try_edit_nomination (
      test_id ('nomination_cand_a'),
      'by an unrelated entity user'
    ),
    0,
    'an entity user holding no grant on the row entity cannot update it at all -- zero rows, not a silent partial write'
  );

SELECT
  reset_role ();

UPDATE app_settings
SET
  settings = jsonb_recursive_merge (
    settings,
    '{"access":{"nominationsLocked":true}}'::jsonb
  )
WHERE
  project_id = test_id ('project_a');

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  is (
    pg_temp.try_edit_nomination (
      test_id ('nomination_cand_a'),
      'attempted while locked'
    ),
    0,
    'with the project nomination lock ON, the owning entity user affects zero rows -- the `own, unless locked` cell of section 3.3'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    test_user_grants ('admin_a')
  );

SELECT
  is (
    pg_temp.try_edit_nomination (
      test_id ('nomination_cand_a'),
      'by the project admin while locked'
    ),
    1,
    'with the lock still ON a project admin edits the same nomination -- the lock binds the entity policies and not the admin ones'
  );

SELECT
  reset_role ();

UPDATE app_settings
SET
  settings = jsonb_recursive_merge (
    settings,
    '{"access":{"nominationsLocked":false}}'::jsonb
  )
WHERE
  project_id = test_id ('project_a');

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  is (
    pg_temp.try_edit_nomination (
      test_id ('nomination_cand_a'),
      'attempted while unlocked'
    ),
    1,
    'with the lock OFF the same statement affects one row -- the lock asserted in BOTH directions, so a policy that ignored the flag entirely could not pass both halves'
  );

-- =====================================================================
-- Section 4: the flip is complete in the catalogue, not only in the file
-- =====================================================================
SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        information_schema.columns
      WHERE
        table_schema = 'public'
        AND table_name = 'nominations'
        AND column_name = 'unconfirmed'
    ) || '/' || (
      SELECT
        is_nullable
      FROM
        information_schema.columns
      WHERE
        table_schema = 'public'
        AND table_name = 'nominations'
        AND column_name = 'confirmed'
    ),
    '0/NO',
    'the table carries no column of the retired name and its confirmation column is NOT NULL -- the nullability that retires the null-coalescing idiom rather than merely renaming it'
  );

-- =====================================================================
-- Section 5: the eight-column uniqueness key
--
-- Identity of a nomination is (who, under whom, where, when). Including `parent_nomination_id` is the substantive choice: it is what admits the presidential case, where the same person is nominated in one contest by three different parties and each is a genuinely distinct nomination rather than a duplicate.
--
-- ⚠ THREE PAIRS, NOT ONE REJECTION, AND THE THIRD IS THE ONE THAT MATTERS MOST. A test suite that only checked rejection would stay green if someone later "simplified" the key by dropping the parent column, and it would stay green under a PLAIN `UNIQUE` -- which on this table enforces nothing at all, because the exactly-one-entity-FK CHECK guarantees three NULL columns in every row and the parent is NULL for every top-level nomination. Assertion A3 is the pair that separates the two forms BEHAVIOURALLY: green under the default null semantics, red under the correct ones.
-- =====================================================================
SELECT
  is (
    (
      SELECT
        i.indnullsnotdistinct
      FROM
        pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_index i ON i.indexrelid = c.conindid
      WHERE
        t.relname = 'nominations'
        AND c.conname = 'nominations_entity_parent_contest_key'
    ),
    true,
    'the uniqueness key carries NULLS NOT DISTINCT, read from pg_index rather than from the schema file -- the one property review cannot see, and the difference between a guarantee and a no-op on this table'
  );

SELECT
  throws_like (
    format(
      $$INSERT INTO nominations (project_id, organization_id, election_id, constituency_id, election_round)
      VALUES ('%s', '%s', '%s', '%s', 7)$$,
      test_id ('project_a'),
      test_id ('org_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    '%nominations_entity_parent_contest_key%',
    'a row identical in all eight key columns to an existing one is REJECTED, and the exception names the constraint'
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO nominations (project_id, candidate_id, election_id, constituency_id, election_round, parent_nomination_id)
      VALUES ('%s', '%s', '%s', '%s', 1, '%s')$$,
      test_id ('project_a'),
      test_id ('candidate_a'),
      test_id ('election_a'),
      test_id ('constituency_a'),
      test_id ('nomination_faction_a')
    ),
    'the same candidate nominated at the same election, constituency and round under a DIFFERENT parent is ACCEPTED -- the presidential case the operator gave as the reason for including the parent column'
  );

INSERT INTO
  nominations (
    id,
    project_id,
    alliance_id,
    election_id,
    constituency_id,
    election_round
  )
VALUES
  (
    '12121212-1212-1212-1212-000000000003'::uuid,
    test_id ('project_a'),
    test_id ('alliance_a'),
    test_id ('election_a'),
    test_id ('constituency_a'),
    9
  );

SELECT
  throws_like (
    format(
      $$INSERT INTO nominations (project_id, alliance_id, election_id, constituency_id, election_round)
      VALUES ('%s', '%s', '%s', '%s', 9)$$,
      test_id ('project_a'),
      test_id ('alliance_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    '%nominations_entity_parent_contest_key%',
    'two top-level nominations of the same entity in the same contest, BOTH with a null parent, are REJECTED -- the pair that is green under the default null semantics and red under the correct ones'
  );

-- =====================================================================
-- Section 7: section 11.5 -- the five guards, the cap, the privilege and the free-text branch
--
-- ⚠ THIS IS A DELIBERATE HOLE IN `own`. The insert a child nominee needs is NOT on their own nomination -- it is on an ORGANIZATION's, which under section 3.3 is by definition not theirs. Every guard pair below holds the OTHER FOUR GUARDS SATISFIED and flips exactly one, because a pair that flips two measures neither. Each guard is then removed from the policy in turn and the file re-run; a guard whose removal reddens nothing is being satisfied by one of the others and is decorative, which is how a permission surface acquires a hole that every test passes over.
--
-- Contests, by round, so each guard has somewhere to stand:
--   round 3  candidate_a holds a nomination        -- guard 5 satisfied, the working contest round 4  candidate_a2 holds none at first      -- guard 5's pair round 5  org_race is nominated UNDER AN ALLIANCE -- guard 3 versus the uniqueness key round 6  the lock pair on the parent insert round 40 the lock pair on the own insert round 7  candidate_a holds NO nomination       -- guard 5's contest-scope pair round 70 the pairs of caller type and row type round 71 to 79 the rows of the cap boundary of both parent types round 80 the id lookup round 81 organization A holds NO nomination -- guard 5's pair for an alliance's row
-- =====================================================================
SELECT
  reset_role ();

INSERT INTO
  organizations (id, project_id, name, confirmed)
SELECT
  (
    '12121212-1212-1212-1212-0000000000' || lpad(i::text, 2, '0')
  )::uuid,
  test_id ('project_a'),
  jsonb_build_object('en', 'Org ' || i),
  false
FROM
  generate_series(1, 20) AS i;

-- candidate_a's own nominations: at round 3 and at round 6, and deliberately NOT at round 7.
INSERT INTO
  nominations (
    project_id,
    candidate_id,
    election_id,
    constituency_id,
    election_round
  )
SELECT
  test_id ('project_a'),
  test_id ('candidate_a'),
  test_id ('election_a'),
  test_id ('constituency_a'),
  r
FROM
  unnest(ARRAY[3, 5, 6]) AS r;

-- The guard-3-versus-constraint fixture: org 02 is ALREADY nominated at round 5, under an alliance.
INSERT INTO
  nominations (
    id,
    project_id,
    alliance_id,
    election_id,
    constituency_id,
    election_round
  )
VALUES
  (
    '12121212-1212-1212-1212-0000000000c1'::uuid,
    test_id ('project_a'),
    test_id ('alliance_a'),
    test_id ('election_a'),
    test_id ('constituency_a'),
    5
  );

INSERT INTO
  nominations (
    project_id,
    organization_id,
    election_id,
    constituency_id,
    election_round,
    parent_nomination_id
  )
VALUES
  (
    test_id ('project_a'),
    '12121212-1212-1212-1212-000000000002'::uuid,
    test_id ('election_a'),
    test_id ('constituency_a'),
    5,
    '12121212-1212-1212-1212-0000000000c1'::uuid
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

-- G1: every guard satisfied -> the parent is created, UNCONFIRMED, carrying the caller as originator.
SELECT
  lives_ok (
    format(
      $$INSERT INTO nominations (project_id, organization_id, election_id, constituency_id, election_round)
      VALUES ('%s', '12121212-1212-1212-1212-000000000001'::uuid, '%s', '%s', 3)$$,
      test_id ('project_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    'G1: a child nominee with all five guards satisfied CREATES the unconfirmed parent organization nomination it needs'
  );

SELECT
  reset_role ();

-- Read as the OWNER. The entity user cannot yet SEE the row it just created -- the authenticated read policy is still the legacy project predicate until section 8 below rewrites it -- and reading as the caller would make this assertion measure the read model rather than the insert.
SELECT
  is (
    (
      SELECT
        confirmed::text || '/' || COALESCE(created_by::text, 'NULL')
      FROM
        nominations
      WHERE
        organization_id = '12121212-1212-1212-1212-000000000001'::uuid
        AND election_round = 3
    ),
    'false/' || test_user_id ('candidate_a')::text,
    'G1: the created parent lands UNCONFIRMED and records the CALLER as originator -- the default supplies both, because the caller may name neither'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

-- G1-neg (guard 1): the same caller, same contest, but a CANDIDATE-type row for an entity that is not theirs. `entity_insert_nominations` refuses it because they hold no grant on that candidate, and the parent policy refuses it because guard 1 requires an organization's row or an alliance's. Nothing else differs.
SELECT
  throws_ok (
    format(
      $$INSERT INTO nominations (project_id, candidate_id, election_id, constituency_id, election_round)
      VALUES ('%s', '%s', '%s', '%s', 3)$$,
      test_id ('project_a'),
      test_id ('candidate_a2'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    '42501',
    NULL,
    'G1-neg: guard 1 -- a CANDIDATE-type row is refused through the parent policy, which admits an organization''s row and an alliance''s row only'
  );

-- G2-neg: the confirmation flag is refused at PRIVILEGE level, before any policy is consulted.
SELECT
  throws_ok (
    format(
      $$INSERT INTO nominations (project_id, organization_id, election_id, constituency_id, election_round, confirmed)
      VALUES ('%s', '12121212-1212-1212-1212-000000000003'::uuid, '%s', '%s', 3, true)$$,
      test_id ('project_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    '42501',
    NULL,
    'G2-neg: naming the confirmation column on insert is REFUSED at privilege level -- the belt, which fails before the policy is reached'
  );

-- G2-alt: the policy carries the conjunct too, and the two fail DIFFERENTLY. This half is asserted STRUCTURALLY and that is a limit of the instrument rather than a choice: while the column grant stands, an `authenticated` caller CANNOT reach the policy conjunct at all -- the privilege refuses first -- so there is no behavioural difference to observe. Dropping the grant to observe one would be asserting against a schema this plan does not ship.
SELECT
  is (
    (
      SELECT
        with_check ~ 'NOT confirmed'
      FROM
        pg_policies
      WHERE
        tablename = 'nominations'
        AND policyname = 'entity_insert_parent_nominations'
    ),
    true,
    'G2-alt: the policy ALSO carries the unconfirmed conjunct -- the braces, which would still refuse the row if the column grant were ever widened'
  );

-- G3-race: org 02 is already nominated at round 5 UNDER AN ALLIANCE. The uniqueness key includes the parent, so a null-parent insert does NOT collide with it -- and guard 3 refuses it anyway. This is the pair that shows guard 3 and the constraint are DIFFERENT PREDICATES; without it the guard would look redundant and a later reader would remove it.
SELECT
  throws_ok (
    format(
      $$INSERT INTO nominations (project_id, organization_id, election_id, constituency_id, election_round)
      VALUES ('%s', '12121212-1212-1212-1212-000000000002'::uuid, '%s', '%s', 5)$$,
      test_id ('project_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    '42501',
    NULL,
    'G3-race: guard 3 refuses a second nomination of an organization already nominated at that contest under a DIFFERENT parent -- which the uniqueness key permits, so the guard is doing work the constraint does not'
  );

-- G4: the lock pair. Round 6, org 04, every other guard held satisfied.
SELECT
  reset_role ();

UPDATE app_settings
SET
  settings = jsonb_recursive_merge (
    settings,
    '{"access":{"nominationsLocked":true}}'::jsonb
  )
WHERE
  project_id = test_id ('project_a');

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO nominations (project_id, organization_id, election_id, constituency_id, election_round)
      VALUES ('%s', '12121212-1212-1212-1212-000000000004'::uuid, '%s', '%s', 6)$$,
      test_id ('project_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    '42501',
    NULL,
    'G4-neg: guard 4 -- with the project nomination lock ON the parent insert is refused; a locked project is not writable through a side door'
  );

-- OWN: the lock pair on `entity_insert_nominations`, the entity's insert of its own nomination. candidate_a holds `nomination.edit` on the row's entity and no nomination of it stands at round 40, so between the two halves only the setting differs.
SELECT
  throws_ok (
    format(
      $$INSERT INTO nominations (project_id, candidate_id, election_id, constituency_id, election_round)
      VALUES ('%s', '%s', '%s', '%s', 40)$$,
      test_id ('project_a'),
      test_id ('candidate_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    '42501',
    NULL,
    'OWN-neg: with the project nomination lock ON an entity user''s insert of its OWN nomination is refused'
  );

SELECT
  reset_role ();

UPDATE app_settings
SET
  settings = jsonb_recursive_merge (
    settings,
    '{"access":{"nominationsLocked":false}}'::jsonb
  )
WHERE
  project_id = test_id ('project_a');

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO nominations (project_id, organization_id, election_id, constituency_id, election_round)
      VALUES ('%s', '12121212-1212-1212-1212-000000000004'::uuid, '%s', '%s', 6)$$,
      test_id ('project_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    'G4: with the lock OFF the SAME statement succeeds -- the guard asserted in both directions'
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO nominations (project_id, candidate_id, election_id, constituency_id, election_round)
      VALUES ('%s', '%s', '%s', '%s', 40)$$,
      test_id ('project_a'),
      test_id ('candidate_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    'OWN: with the lock OFF the SAME statement succeeds -- the own insert asserted in both directions'
  );

-- G5: the caller must already hold a nomination at THAT contest. candidate_a2 holds `nomination.create_parent` and holds no nomination at round 4, so the permission alone is not enough.
SELECT
  reset_role ();

SELECT
  test_seed_identity_grants ('candidate_a2');

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a2'),
    test_user_grants ('candidate_a2')
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO nominations (project_id, organization_id, election_id, constituency_id, election_round)
      VALUES ('%s', '12121212-1212-1212-1212-000000000005'::uuid, '%s', '%s', 4)$$,
      test_id ('project_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    '42501',
    NULL,
    'G5-neg: guard 5 -- a caller holding the permission but NO nomination of their own at that contest is refused; a candidate must not create parents they never nominate under'
  );

SELECT
  reset_role ();

INSERT INTO
  nominations (
    project_id,
    candidate_id,
    election_id,
    constituency_id,
    election_round
  )
VALUES
  (
    test_id ('project_a'),
    test_id ('candidate_a2'),
    test_id ('election_a'),
    test_id ('constituency_a'),
    4
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a2'),
    test_user_grants ('candidate_a2')
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO nominations (project_id, organization_id, election_id, constituency_id, election_round)
      VALUES ('%s', '12121212-1212-1212-1212-000000000005'::uuid, '%s', '%s', 4)$$,
      test_id ('project_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    'G5: the SAME caller succeeds once they hold a nomination at that contest -- the guard flipped alone'
  );

-- G5-scope: candidate_a holds nominations at rounds 3, 5 and 6 and NONE at round 7. The guard is the CONTEST MATCH, not the mere existence of some nomination somewhere.
SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO nominations (project_id, organization_id, election_id, constituency_id, election_round)
      VALUES ('%s', '12121212-1212-1212-1212-000000000006'::uuid, '%s', '%s', 7)$$,
      test_id ('project_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    '42501',
    NULL,
    'G5-scope: a caller whose own nominations are at OTHER contests is refused here -- so guard 5 is the contest match rather than the existence of any nomination at all'
  );

-- PROJ: D-12b grants a candidate any organization IN THE PROJECT. No table constraint forces a nomination's entity to share its project -- deliberately, because 07-rpc-security.test.sql section 9 depends on the table staying permissive -- so the agreement is a conjunct of THIS policy only.
SELECT
  throws_ok (
    format(
      $$INSERT INTO nominations (project_id, organization_id, election_id, constituency_id, election_round)
      VALUES ('%s', '%s', '%s', '%s', 3)$$,
      test_id ('project_a'),
      test_id ('org_b'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    '42501',
    NULL,
    'PROJ: a parent naming an organization of a DIFFERENT project is refused -- the agreement D-12b needs, scoped to this policy rather than to the table'
  );

-- ORIG: the originator cannot be forged. Without this the cap would count a value the capped party chooses.
SELECT
  throws_ok (
    format(
      $$INSERT INTO nominations (project_id, organization_id, election_id, constituency_id, election_round, created_by)
      VALUES ('%s', '12121212-1212-1212-1212-000000000007'::uuid, '%s', '%s', 3, '%s')$$,
      test_id ('project_a'),
      test_id ('election_a'),
      test_id ('constituency_a'),
      test_user_id ('candidate_a2')
    ),
    '42501',
    NULL,
    'ORIG: naming the originator column on insert is REFUSED at privilege level -- the absence from the grant list is what makes the cap a cap rather than a suggestion'
  );

-- The pairing: whose row a caller may create through the parent policy. A candidate's editor and a faction's editor create an organization's row, an organization's editor creates an alliance's row, and no other pairing is admitted.
--
-- Round 70 is the contest of the pairs. Organization A, candidate_a and faction A are each nominated there, so every caller below holds a nomination at the contest with an entity of its own type, and each refusal differs from the insert beside it in one thing: the type of the row, or whether the row's entity is already nominated there. Faction A stands under organization A's nomination, so the organization's editor also has a child nominee at the contest.
--
-- The entities are this file's own and none of them holds a nomination when this block begins: thirteen alliances (`...54NN`), twelve organizations (`...55NN`) and a second faction of organization A (`...5701`). The fixture has no editor of a faction, so one is created here (`...5601`), with its grant row.
SELECT
  reset_role ();

INSERT INTO
  alliances (id, project_id, name, confirmed)
SELECT
  (
    '12121212-1212-1212-1212-0000000054' || lpad(i::text, 2, '0')
  )::uuid,
  test_id ('project_a'),
  jsonb_build_object('en', 'Alliance ' || i),
  false
FROM
  generate_series(1, 13) AS i;

INSERT INTO
  organizations (id, project_id, name, confirmed)
SELECT
  (
    '12121212-1212-1212-1212-0000000055' || lpad(i::text, 2, '0')
  )::uuid,
  test_id ('project_a'),
  jsonb_build_object('en', 'Party ' || i),
  false
FROM
  generate_series(1, 12) AS i;

INSERT INTO
  factions (id, project_id, organization_id, name, confirmed)
VALUES
  (
    '12121212-1212-1212-1212-000000005701'::uuid,
    test_id ('project_a'),
    test_id ('org_a'),
    '{"en":"Faction A2"}'::jsonb,
    false
  );

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
    '12121212-1212-1212-1212-000000005601'::uuid,
    '00000000-0000-0000-0000-000000000000',
    'n23_faction_editor@test.com',
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
    '12121212-1212-1212-1212-000000005601'::uuid,
    'entity',
    'faction',
    test_id ('faction_a'),
    'editor'
  );

INSERT INTO
  nominations (
    id,
    project_id,
    organization_id,
    election_id,
    constituency_id,
    election_round
  )
VALUES
  (
    '12121212-1212-1212-1212-000000007001'::uuid,
    test_id ('project_a'),
    test_id ('org_a'),
    test_id ('election_a'),
    test_id ('constituency_a'),
    70
  );

INSERT INTO
  nominations (
    project_id,
    candidate_id,
    election_id,
    constituency_id,
    election_round
  )
VALUES
  (
    test_id ('project_a'),
    test_id ('candidate_a'),
    test_id ('election_a'),
    test_id ('constituency_a'),
    70
  );

INSERT INTO
  nominations (
    project_id,
    faction_id,
    election_id,
    constituency_id,
    election_round,
    parent_nomination_id
  )
VALUES
  (
    test_id ('project_a'),
    test_id ('faction_a'),
    test_id ('election_a'),
    test_id ('constituency_a'),
    70,
    '12121212-1212-1212-1212-000000007001'::uuid
  );

-- Alliance 03 is already nominated at round 70: guard 3's occupant for an alliance's row.
INSERT INTO
  nominations (
    project_id,
    alliance_id,
    election_id,
    constituency_id,
    election_round
  )
VALUES
  (
    test_id ('project_a'),
    '12121212-1212-1212-1212-000000005403'::uuid,
    test_id ('election_a'),
    test_id ('constituency_a'),
    70
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('organization_a'),
    test_user_grants ('organization_a')
  );

-- G1 (an alliance's row): the organization's editor, nominated at the contest, creates the nomination of an alliance that has none there.
SELECT
  lives_ok (
    format(
      $$INSERT INTO nominations (project_id, alliance_id, election_id, constituency_id, election_round)
      VALUES ('%s', '12121212-1212-1212-1212-000000005401'::uuid, '%s', '%s', 70)$$,
      test_id ('project_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    'G1: an organization''s editor whose organization is nominated at the contest creates the nomination of an alliance that has none there'
  );

SELECT
  reset_role ();

-- Read as the owner: the caller cannot read the alliance's row it created.
SELECT
  is (
    (
      SELECT
        confirmed::text || '/' || COALESCE(created_by::text, 'NULL')
      FROM
        nominations
      WHERE
        alliance_id = '12121212-1212-1212-1212-000000005401'::uuid
        AND election_round = 70
    ),
    'false/' || test_user_id ('organization_a')::text,
    'G1: the alliance''s nomination is stored unconfirmed and records the organization''s editor as its creator'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('organization_a'),
    test_user_grants ('organization_a')
  );

-- PAIR-neg: the same caller at the same contest, and the row is another organization's. An organization's editor is not a caller an organization's row admits, and its child nominee at the contest does not make it one.
SELECT
  throws_ok (
    format(
      $$INSERT INTO nominations (project_id, organization_id, election_id, constituency_id, election_round)
      VALUES ('%s', '12121212-1212-1212-1212-000000005501'::uuid, '%s', '%s', 70)$$,
      test_id ('project_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    '42501',
    NULL,
    'PAIR-neg: an organization''s editor is refused another organization''s row, although its own organization and a faction under it are nominated at the contest'
  );

-- G3 (an alliance's row): alliance 03 is nominated at round 70 and alliance 02 is not. Nothing else differs between the two inserts.
SELECT
  throws_ok (
    format(
      $$INSERT INTO nominations (project_id, alliance_id, election_id, constituency_id, election_round)
      VALUES ('%s', '12121212-1212-1212-1212-000000005403'::uuid, '%s', '%s', 70)$$,
      test_id ('project_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    '42501',
    NULL,
    'G3: an alliance that already has a nomination at the contest gets no second one from an organization''s editor'
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO nominations (project_id, alliance_id, election_id, constituency_id, election_round)
      VALUES ('%s', '12121212-1212-1212-1212-000000005402'::uuid, '%s', '%s', 70)$$,
      test_id ('project_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    'G3: the same insert for an alliance with no nomination at the contest is admitted'
  );

-- G5-neg (an alliance's row): organization A holds no nomination at round 81, so the same caller is refused there.
SELECT
  throws_ok (
    format(
      $$INSERT INTO nominations (project_id, alliance_id, election_id, constituency_id, election_round)
      VALUES ('%s', '12121212-1212-1212-1212-000000005402'::uuid, '%s', '%s', 81)$$,
      test_id ('project_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    '42501',
    NULL,
    'G5-neg: an organization''s editor whose organization is not nominated at the contest is refused an alliance''s row there'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

-- PAIR and PAIR-neg for a candidate's editor: one caller, one contest, and the two rows differ in their type alone.
SELECT
  throws_ok (
    format(
      $$INSERT INTO nominations (project_id, alliance_id, election_id, constituency_id, election_round)
      VALUES ('%s', '12121212-1212-1212-1212-000000005404'::uuid, '%s', '%s', 70)$$,
      test_id ('project_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    '42501',
    NULL,
    'PAIR-neg: a candidate''s editor nominated at the contest is refused an alliance''s row'
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO nominations (project_id, organization_id, election_id, constituency_id, election_round)
      VALUES ('%s', '12121212-1212-1212-1212-000000005502'::uuid, '%s', '%s', 70)$$,
      test_id ('project_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    'PAIR: the same candidate''s editor at the same contest creates an organization''s row'
  );

-- G1-neg (a faction's row): faction A2 has no nomination at round 70 and the row names its own organization's nomination as parent, as a faction's nomination must. The caller holds no permission on that faction, so only the parent policy could admit the row.
SELECT
  throws_ok (
    format(
      $$INSERT INTO nominations (project_id, faction_id, election_id, constituency_id, election_round, parent_nomination_id)
      VALUES ('%s', '12121212-1212-1212-1212-000000005701'::uuid, '%s', '%s', 70, '12121212-1212-1212-1212-000000007001'::uuid)$$,
      test_id ('project_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    '42501',
    NULL,
    'G1-neg: a faction''s row is refused through the parent policy, which admits an organization''s row and an alliance''s row only'
  );

-- PAIR and PAIR-neg for a faction's editor. A faction's nomination stands under its own organization's, so that organization is always nominated where the faction is, and the organization's row the faction's editor creates is another organization's.
SELECT
  set_test_user (
    'authenticated',
    '12121212-1212-1212-1212-000000005601'::uuid,
    '[]'::jsonb
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO nominations (project_id, organization_id, election_id, constituency_id, election_round)
      VALUES ('%s', '12121212-1212-1212-1212-000000005503'::uuid, '%s', '%s', 70)$$,
      test_id ('project_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    'PAIR: a faction''s editor whose faction is nominated at the contest creates an organization''s row'
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO nominations (project_id, alliance_id, election_id, constituency_id, election_round)
      VALUES ('%s', '12121212-1212-1212-1212-000000005405'::uuid, '%s', '%s', 70)$$,
      test_id ('project_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    '42501',
    NULL,
    'PAIR-neg: the same faction''s editor at the same contest is refused an alliance''s row'
  );

-- CAP: nine parent nominations already originated by this caller, so the next sits AT the boundary and the one after it is over. They are inserted LAST rather than with the rest of the fixture, and the ordering is load-bearing: the cap is enforced by a BEFORE INSERT trigger, which runs AHEAD of the row-level check clause, so a caller already at the cap is refused by the cap BEFORE any guard is consulted. Creating these rows earlier would have made every guard assertion above measure the cap instead of its guard -- observed directly, as P0001 where 42501 was wanted.
SELECT
  reset_role ();

-- Normalise first. The guard assertions above legitimately originated parents of their own, so the count at this point depends on how many of them ran; clearing the authorship makes the boundary EXACTLY nine rather than nine-plus-whatever-came-before, and an off-by-one here would turn the pair below into an assertion about the fixture rather than about the cap.
UPDATE nominations
SET
  created_by = NULL
WHERE
  created_by = test_user_id ('candidate_a');

INSERT INTO
  nominations (
    project_id,
    organization_id,
    election_id,
    constituency_id,
    election_round,
    created_by
  )
SELECT
  test_id ('project_a'),
  (
    '12121212-1212-1212-1212-0000000000' || lpad((i + 10)::text, 2, '0')
  )::uuid,
  test_id ('election_a'),
  test_id ('constituency_a'),
  20 + i,
  test_user_id ('candidate_a')
FROM
  generate_series(1, 9) AS i;

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO nominations (project_id, organization_id, election_id, constituency_id, election_round)
      VALUES ('%s', '12121212-1212-1212-1212-000000000008'::uuid, '%s', '%s', 3)$$,
      test_id ('project_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    'CAP: the insert AT the cap boundary succeeds -- the tenth originated unconfirmed parent'
  );

SELECT
  throws_like (
    format(
      $$INSERT INTO nominations (project_id, organization_id, election_id, constituency_id, election_round)
      VALUES ('%s', '12121212-1212-1212-1212-000000000009'::uuid, '%s', '%s', 3)$$,
      test_id ('project_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    '%at most 10 unconfirmed parent nominations%',
    'CAP: the next one is REFUSED with a message naming the ruled cap value -- a caller is told what they hit, which a row-level-security refusal alone would never say'
  );

-- CAP (both parent types): an alliance's row counts against the cap as an organization's does, and so does a row of the caller's own organization. Nine unconfirmed rows are recorded for the organization's editor: three of other organizations, two of its own organization and four of alliances, each at a round of its own. Like the block above, it comes after every guard assertion of its caller and clears that caller's authorship first.
SELECT
  reset_role ();

UPDATE nominations
SET
  created_by = NULL
WHERE
  created_by = test_user_id ('organization_a');

INSERT INTO
  nominations (
    project_id,
    organization_id,
    election_id,
    constituency_id,
    election_round,
    created_by
  )
SELECT
  test_id ('project_a'),
  o.id,
  test_id ('election_a'),
  test_id ('constituency_a'),
  70 + o.n,
  test_user_id ('organization_a')
FROM
  (
    VALUES
      (1, '12121212-1212-1212-1212-000000005510'::uuid),
      (2, '12121212-1212-1212-1212-000000005511'::uuid),
      (3, '12121212-1212-1212-1212-000000005512'::uuid),
      (4, test_id ('org_a')),
      (5, test_id ('org_a'))
  ) AS o (n, id);

INSERT INTO
  nominations (
    project_id,
    alliance_id,
    election_id,
    constituency_id,
    election_round,
    created_by
  )
SELECT
  test_id ('project_a'),
  (
    '12121212-1212-1212-1212-0000000054' || lpad((i + 7)::text, 2, '0')
  )::uuid,
  test_id ('election_a'),
  test_id ('constituency_a'),
  75 + i,
  test_user_id ('organization_a')
FROM
  generate_series(1, 4) AS i;

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('organization_a'),
    test_user_grants ('organization_a')
  );

SELECT
  is (
    private.caller_unconfirmed_originated_count (),
    9,
    'CAP: the count holds the caller''s unconfirmed organization rows and alliance rows together, its own organization''s among them'
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO nominations (project_id, alliance_id, election_id, constituency_id, election_round)
      VALUES ('%s', '12121212-1212-1212-1212-000000005412'::uuid, '%s', '%s', 70)$$,
      test_id ('project_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    'CAP: with nine rows of both parent types the tenth, an alliance''s row, is admitted'
  );

SELECT
  throws_like (
    format(
      $$INSERT INTO nominations (project_id, alliance_id, election_id, constituency_id, election_round)
      VALUES ('%s', '12121212-1212-1212-1212-000000005413'::uuid, '%s', '%s', 70)$$,
      test_id ('project_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    '%at most 10 unconfirmed parent nominations%',
    'CAP: the eleventh, an alliance''s row, is refused with the message that names the cap'
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO nominations (project_id, alliance_id, election_id, constituency_id, election_round)
      VALUES ('%s', '12121212-1212-1212-1212-000000005413'::uuid, '%s', '%s', 70)$$,
      test_id ('project_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    'P0001',
    'A caller may originate at most 10 unconfirmed parent nominations; this caller already holds 10. An administrator must confirm or reject some before more can be created.',
    'CAP: that refusal is a raised exception whose whole message states the cap and the number the caller holds'
  );

-- PERM: `nomination.create_parent` is a verb of its own and not a part of `nomination.edit`. Every entity editor's row of the matrix holds both, so no caller of the matrix as it stands holds the one without the other. The matrix is therefore read here with that one verb taken out of every row: `grant_role_permissions` is renamed and a function of its name answers the renamed one's set without `nomination.create_parent`. candidate_a2 holds a nomination at round 4 and created an organization's row there above; with the verb taken out the same caller is refused the next one, and with the matrix put back the same statement is admitted.
SELECT
  reset_role ();

ALTER FUNCTION public.grant_role_permissions (
  public.grant_scope_type,
  public.grant_role_type,
  public.entity_type
)
RENAME TO grant_role_permissions_whole;

CREATE FUNCTION public.grant_role_permissions (
  p_scope public.grant_scope_type,
  p_role public.grant_role_type,
  p_target_type public.entity_type
) RETURNS public.grant_permission[] LANGUAGE sql IMMUTABLE
SET
  search_path = '' AS $fn$
  SELECT array_remove(
    public.grant_role_permissions_whole (p_scope, p_role, p_target_type),
    'nomination.create_parent'::public.grant_permission
  );
$fn$;

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a2'),
    test_user_grants ('candidate_a2')
  );

SELECT
  is (
    user_can (
      'entity',
      test_id ('candidate_a2'),
      'nomination.edit',
      'candidate'
    )::text || '/' || user_can (
      'entity',
      test_id ('candidate_a2'),
      'nomination.create_parent',
      'candidate'
    )::text,
    'true/false',
    'PERM: with the verb taken out of the matrix the caller still holds nomination.edit on its own entity and does not hold nomination.create_parent'
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO nominations (project_id, organization_id, election_id, constituency_id, election_round)
      VALUES ('%s', '12121212-1212-1212-1212-000000005504'::uuid, '%s', '%s', 4)$$,
      test_id ('project_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    '42501',
    NULL,
    'PERM: a caller holding nomination.edit and not nomination.create_parent is refused an organization''s row, even with a nomination of its own at that contest'
  );

SELECT
  reset_role ();

DROP FUNCTION public.grant_role_permissions (
  public.grant_scope_type,
  public.grant_role_type,
  public.entity_type
);

ALTER FUNCTION public.grant_role_permissions_whole (
  public.grant_scope_type,
  public.grant_role_type,
  public.entity_type
)
RENAME TO grant_role_permissions;

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a2'),
    test_user_grants ('candidate_a2')
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO nominations (project_id, organization_id, election_id, constituency_id, election_round)
      VALUES ('%s', '12121212-1212-1212-1212-000000005504'::uuid, '%s', '%s', 4)$$,
      test_id ('project_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    'PERM: with the matrix put back the same caller creates the same row -- the verb alone differed'
  );

-- ID: `private.nomination_id_in_contest` answers the id of an entity's nomination at a contest. Where the entity holds several there it answers the one with no parent first, then the oldest, then the lowest id; where it holds none, and where the type asked is not the entity's, it answers NULL. Round 80 holds every case, and each pair is built so that the rule under test and the rules after it point at different rows.
--
-- `pg_temp.nomination_id_at_round_80` asks the lookup through dynamic SQL and answers its uuid as text, 'NULL' for a NULL and 'no such function' where the lookup does not exist, so each assertion below is an expectation whatever the database holds.
SELECT
  reset_role ();

CREATE FUNCTION pg_temp.nomination_id_at_round_80 (
  p_entity_type public.entity_type,
  p_entity_id uuid
) RETURNS text LANGUAGE plpgsql AS $fn$
DECLARE
  v_id uuid;
BEGIN
  EXECUTE 'SELECT private.nomination_id_in_contest ($1, $2, $3, $4, 80)'
  INTO v_id
  USING p_entity_type, p_entity_id, public.test_id ('election_a'), public.test_id ('constituency_a');
  RETURN COALESCE(v_id::text, 'NULL');
EXCEPTION
  WHEN undefined_function THEN
    RETURN 'no such function';
END;
$fn$;

INSERT INTO
  nominations (
    id,
    project_id,
    alliance_id,
    election_id,
    constituency_id,
    election_round
  )
VALUES
  (
    '12121212-1212-1212-1212-000000008001'::uuid,
    test_id ('project_a'),
    '12121212-1212-1212-1212-000000005406'::uuid,
    test_id ('election_a'),
    test_id ('constituency_a'),
    80
  ),
  (
    '12121212-1212-1212-1212-000000008002'::uuid,
    test_id ('project_a'),
    '12121212-1212-1212-1212-000000005407'::uuid,
    test_id ('election_a'),
    test_id ('constituency_a'),
    80
  );

-- Party 05 once, with no parent. Party 06 twice: under an alliance, older and with the lower id, and with no parent. Party 07 twice under an alliance: the older row has the higher id. Party 08 twice under an alliance, of one age. Party 09 not at all.
INSERT INTO
  nominations (
    id,
    project_id,
    organization_id,
    election_id,
    constituency_id,
    election_round,
    parent_nomination_id,
    created_at
  )
VALUES
  (
    '12121212-1212-1212-1212-000000008003'::uuid,
    test_id ('project_a'),
    '12121212-1212-1212-1212-000000005505'::uuid,
    test_id ('election_a'),
    test_id ('constituency_a'),
    80,
    NULL,
    '2026-01-01T00:00:00Z'
  ),
  (
    '12121212-1212-1212-1212-000000008004'::uuid,
    test_id ('project_a'),
    '12121212-1212-1212-1212-000000005506'::uuid,
    test_id ('election_a'),
    test_id ('constituency_a'),
    80,
    '12121212-1212-1212-1212-000000008001'::uuid,
    '2026-01-01T00:00:00Z'
  ),
  (
    '12121212-1212-1212-1212-000000008005'::uuid,
    test_id ('project_a'),
    '12121212-1212-1212-1212-000000005506'::uuid,
    test_id ('election_a'),
    test_id ('constituency_a'),
    80,
    NULL,
    '2026-02-01T00:00:00Z'
  ),
  (
    '12121212-1212-1212-1212-000000008006'::uuid,
    test_id ('project_a'),
    '12121212-1212-1212-1212-000000005507'::uuid,
    test_id ('election_a'),
    test_id ('constituency_a'),
    80,
    '12121212-1212-1212-1212-000000008002'::uuid,
    '2026-02-01T00:00:00Z'
  ),
  (
    '12121212-1212-1212-1212-000000008007'::uuid,
    test_id ('project_a'),
    '12121212-1212-1212-1212-000000005507'::uuid,
    test_id ('election_a'),
    test_id ('constituency_a'),
    80,
    '12121212-1212-1212-1212-000000008001'::uuid,
    '2026-01-01T00:00:00Z'
  ),
  (
    '12121212-1212-1212-1212-000000008008'::uuid,
    test_id ('project_a'),
    '12121212-1212-1212-1212-000000005508'::uuid,
    test_id ('election_a'),
    test_id ('constituency_a'),
    80,
    '12121212-1212-1212-1212-000000008001'::uuid,
    '2026-01-01T00:00:00Z'
  ),
  (
    '12121212-1212-1212-1212-000000008009'::uuid,
    test_id ('project_a'),
    '12121212-1212-1212-1212-000000005508'::uuid,
    test_id ('election_a'),
    test_id ('constituency_a'),
    80,
    '12121212-1212-1212-1212-000000008002'::uuid,
    '2026-01-01T00:00:00Z'
  );

SELECT
  is (
    (
      SELECT
        p.prosecdef::text || '/' || (p.proconfig = ARRAY['search_path=""'])::text || '/' || p.provolatile::text || '/' || has_function_privilege('authenticated', p.oid, 'EXECUTE')::text
      FROM
        pg_proc p
      WHERE
        p.pronamespace = 'private'::regnamespace
        AND p.proname = 'nomination_id_in_contest'
    ),
    'true/true/s/true',
    'ID: the lookup is a stable SECURITY DEFINER function of the private schema with an empty search_path, and authenticated may execute it'
  );

SELECT
  is (
    pg_temp.nomination_id_at_round_80 (
      'organization',
      '12121212-1212-1212-1212-000000005505'::uuid
    ),
    '12121212-1212-1212-1212-000000008003',
    'ID: an entity nominated once at the contest answers that nomination''s id'
  );

SELECT
  is (
    pg_temp.nomination_id_at_round_80 (
      'organization',
      '12121212-1212-1212-1212-000000005509'::uuid
    ),
    'NULL',
    'ID: an entity with no nomination at the contest answers NULL'
  );

SELECT
  is (
    pg_temp.nomination_id_at_round_80 (
      'alliance',
      '12121212-1212-1212-1212-000000005505'::uuid
    ),
    'NULL',
    'ID: asked with a type that is not the entity''s, the lookup answers NULL'
  );

SELECT
  is (
    pg_temp.nomination_id_at_round_80 (
      'organization',
      '12121212-1212-1212-1212-000000005506'::uuid
    ),
    '12121212-1212-1212-1212-000000008005',
    'ID: of a nomination with no parent and one under an alliance, the lookup answers the one with no parent, although it is the newer and has the higher id'
  );

SELECT
  is (
    pg_temp.nomination_id_at_round_80 (
      'organization',
      '12121212-1212-1212-1212-000000005507'::uuid
    ),
    '12121212-1212-1212-1212-000000008007',
    'ID: of two nominations that both have a parent, the lookup answers the older, although it has the higher id'
  );

SELECT
  is (
    pg_temp.nomination_id_at_round_80 (
      'organization',
      '12121212-1212-1212-1212-000000005508'::uuid
    ),
    '12121212-1212-1212-1212-000000008008',
    'ID: of two nominations of one age that both have a parent, the lookup answers the lower id'
  );

-- D1: THE HARDENING, asserted behaviourally. `validate_nomination` is SECURITY DEFINER because from the moment an entity user may insert, an invoker-rights parent lookup would run under that user's own row-level security and report a parent that EXISTS as one that does not. Measured at Task 1: such a lookup returns ZERO ROWS. This is the paired opposite.
SELECT
  reset_role ();

INSERT INTO
  nominations (
    id,
    project_id,
    organization_id,
    election_id,
    constituency_id,
    election_round,
    confirmed
  )
VALUES
  (
    '12121212-1212-1212-1212-0000000000e1'::uuid,
    test_id ('project_a'),
    '12121212-1212-1212-1212-000000000012'::uuid,
    test_id ('election_a'),
    test_id ('constituency_a'),
    8,
    false
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        nominations
      WHERE
        id = '12121212-1212-1212-1212-0000000000e1'::uuid
    ),
    0,
    'D1 control: the entity user CANNOT READ the parent it is about to name -- without this the assertion below would pass against an unhardened validator too'
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO nominations (project_id, candidate_id, election_id, constituency_id, election_round, parent_nomination_id)
      VALUES ('%s', '%s', '%s', '%s', 8, '12121212-1212-1212-1212-0000000000e1'::uuid)$$,
      test_id ('project_a'),
      test_id ('candidate_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    'D1: the entity user nonetheless INSERTS a child under that parent -- the hardened validator sees what it validates, where an invoker-rights one would have reported the parent missing'
  );

-- REQ: the free-text branch (D-12a). Section 11.5's third and fourth branches are BYTE-IDENTICAL in every column; the only thing distinguishing "my party is not in the system yet" from "I am independent" is this key. Confirming such a row publishes as an INDEPENDENT a candidate who asked for a party. The two rows in the pair differ in that key ALONE, so the guard is shown to be the key's presence and not some other property of the row.
SELECT
  reset_role ();

INSERT INTO
  nominations (
    id,
    project_id,
    candidate_id,
    election_id,
    constituency_id,
    election_round,
    custom_data
  )
VALUES
  (
    '12121212-1212-1212-1212-0000000000f1'::uuid,
    test_id ('project_a'),
    test_id ('candidate_a'),
    test_id ('election_a'),
    test_id ('constituency_a'),
    12,
    '{"requestedParentOrganization":"The Unlisted Party"}'::jsonb
  ),
  (
    '12121212-1212-1212-1212-0000000000f2'::uuid,
    test_id ('project_a'),
    test_id ('candidate_a'),
    test_id ('election_a'),
    test_id ('constituency_a'),
    13,
    '{}'::jsonb
  );

SELECT
  throws_like (
    $$UPDATE nominations SET confirmed = true WHERE id = '12121212-1212-1212-1212-0000000000f1'::uuid$$,
    '%requestedParentOrganization%',
    'REQ: a nomination carrying the requested-parent key CANNOT be confirmed -- confirming it would publish as an independent a candidate who asked for a party'
  );

SELECT
  lives_ok (
    $$UPDATE nominations SET confirmed = true WHERE id = '12121212-1212-1212-1212-0000000000f2'::uuid$$,
    'REQ: the same row WITHOUT that key confirms normally -- so the guard is the key presence and not some other property of the row'
  );

-- =====================================================================
-- Section 8: the read model, in BOTH directions
--
-- A read test that only checks visibility cannot tell "correctly visible" from "should have been hidden", so every assertion here has its opposite. The three disjuncts are exercised one at a time.
--
-- ⚠ THE PUBLIC DISJUNCT IS THE ONE THAT WOULD FAIL SILENTLY. It replaces `OR published = true`, which is what let a SIGNED-IN reader see a project they hold no grant in. Delete it without replacing it and a logged-in candidate browsing the voter application sees nothing at all -- and no anon-read test covers them, because the anonymous policies apply to a different role.
-- =====================================================================
SELECT
  reset_role ();

UPDATE projects
SET
  open_for_voters = true
WHERE
  id = test_id ('project_b');

UPDATE organizations
SET
  confirmed = true
WHERE
  id = test_id ('org_b');

UPDATE nominations
SET
  confirmed = true
WHERE
  id = test_id ('nomination_org_b');

-- Two UNCONFIRMED nominations in project A, differing only in whose entity they name: one candidate_a's own and one an unrelated entity's.
--
-- ⚠ THEY MUST BE UNCONFIRMED OR THE ENTITY DISJUNCT IS NOT MEASURED. Project A is open for voters, so a CONFIRMED nomination of candidate_a is admitted by the PUBLIC disjunct whether or not the entity disjunct exists, and the assertion below would be over-determined. MEASURED: against a confirmed row, removing the entity disjunct from the policy reddened ZERO assertions.
INSERT INTO
  nominations (
    id,
    project_id,
    candidate_id,
    election_id,
    constituency_id,
    election_round,
    confirmed
  )
VALUES
  (
    '12121212-1212-1212-1212-0000000000a1'::uuid,
    test_id ('project_a'),
    test_id ('candidate_a2'),
    test_id ('election_a'),
    test_id ('constituency_a'),
    31,
    false
  ),
  (
    '12121212-1212-1212-1212-0000000000a2'::uuid,
    test_id ('project_a'),
    test_id ('candidate_a'),
    test_id ('election_a'),
    test_id ('constituency_a'),
    32,
    false
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    test_user_grants ('admin_a')
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        nominations
      WHERE
        id = test_id ('nomination_org_b')
    ),
    1,
    'READ: a reader holding a grant in ONE project sees another project PUBLIC nomination -- the disjunct that replaces the publication term, without which a logged-in voter-app reader would see nothing at all'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        nominations
      WHERE
        id = test_id ('nomination_cand_b')
    ),
    0,
    'READ: the same reader does NOT see that project UNCONFIRMED nomination -- the public disjunct is an all-of rule and the confirmation conjunct is flipped alone'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        nominations
      WHERE
        id = '12121212-1212-1212-1212-0000000000a2'::uuid
    ),
    1,
    'READ: an ENTITY grantee sees their own UNCONFIRMED nomination, which no other disjunct admits -- through user_can at entity scope, which is also the branch 162-04 ratified for the parent hop (nomination.read, option D)'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        nominations
      WHERE
        id = '12121212-1212-1212-1212-0000000000a1'::uuid
    ),
    0,
    'READ: the same entity grantee does NOT see an UNCONFIRMED nomination of an unrelated entity in their own project -- the deny half, which a visibility-only test could never detect'
  );

SELECT
  reset_role ();

-- =====================================================================
-- CR-03: an entity grantee cannot write or move its nomination into ANOTHER project
--
-- 162-REVIEW CR-03 reproduced candidate_a (a project-A entity grantee) inserting a nomination with project_id, election_id and constituency_id all naming project B, and succeeding: `nomination.edit` is asked of the ENTITY, which lives in A, and nothing compared the entity's project, or the election's, with the row's. The positive control first, so the refusals below are the tenancy conjuncts at work and not an insert path that was already closed.
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
      $$INSERT INTO nominations (project_id, candidate_id, election_id, constituency_id, election_round)
      VALUES ('%s', '%s', '%s', '%s', 7)$$,
      test_id ('project_a'),
      test_id ('candidate_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    'CR-03 control: candidate_a can insert its own nomination into its OWN project''s contest'
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO nominations (project_id, candidate_id, election_id, constituency_id, election_round)
      VALUES ('%s', '%s', '%s', '%s', 7)$$,
      test_id ('project_b'),
      test_id ('candidate_a'),
      test_id ('election_b'),
      test_id ('constituency_b')
    ),
    '42501',
    NULL,
    'CR-03: candidate_a cannot insert its nomination into project B, whose election and constituency agree with the row but whose project is not the entity''s (policy project-agreement conjunct)'
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO nominations (project_id, candidate_id, election_id, constituency_id, election_round)
      VALUES ('%s', '%s', '%s', '%s', 8)$$,
      test_id ('project_a'),
      test_id ('candidate_a'),
      test_id ('election_b'),
      test_id ('constituency_a')
    ),
    '23514',
    NULL,
    'CR-03: a nomination in project A naming project B''s ELECTION is refused by validate_nomination'
  );

SELECT
  throws_ok (
    format(
      $$UPDATE nominations SET election_id = '%s', constituency_id = '%s' WHERE id = '%s'$$,
      test_id ('election_b'),
      test_id ('constituency_b'),
      test_id ('nomination_cand_a')
    ),
    '23514',
    NULL,
    'CR-03: candidate_a cannot MOVE its existing nomination into project B''s election and constituency'
  );

SELECT
  reset_role ();

-- The trigger half binds every writer, not only entity grantees: a cross-project constituency is corrupt data whoever writes it.
SELECT
  throws_ok (
    format(
      $$INSERT INTO nominations (project_id, organization_id, election_id, constituency_id, election_round)
      VALUES ('%s', '%s', '%s', '%s', 9)$$,
      test_id ('project_a'),
      test_id ('org_a'),
      test_id ('election_a'),
      test_id ('constituency_b')
    ),
    '23514',
    NULL,
    'CR-03: even the database owner cannot write a project-A nomination naming project B''s CONSTITUENCY'
  );

-- =====================================================================
-- WR-05: a project admin writes the ordinary nomination fields; an entity user still cannot
--
-- 162-REVIEW WR-05 reproduced a project admin (project.edit_nominations) refused `permission denied for table nominations` for inserting a nomination with `election_symbol`: the column grant bounding entity users is a global grant against `authenticated` and bound the admin too. The grant now admits the columns and `enforce_nomination_entity_columns()` bounds the caller who lacks project.edit_nominations -- so both directions are asserted.
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    test_user_grants ('admin_a')
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO nominations (project_id, organization_id, election_id, constituency_id, election_round, name, election_symbol, sort_order, external_id)
      VALUES ('%s', '%s', '%s', '%s', 20, '{"en": "List A"}'::jsonb, '7', 3, 'wr05-admin-nomination')$$,
      test_id ('project_a'),
      test_id ('org_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    'WR-05: a project admin can insert a nomination carrying name, election_symbol, sort_order and external_id'
  );

SELECT
  lives_ok (
    $$UPDATE nominations SET election_symbol = '8', short_name = '{"en": "A"}'::jsonb WHERE external_id = 'wr05-admin-nomination'$$,
    'WR-05: a project admin can update a nomination''s election_symbol and short_name'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        election_symbol
      FROM
        nominations
      WHERE
        external_id = 'wr05-admin-nomination'
    ),
    '8',
    'WR-05: the admin''s update landed'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO nominations (project_id, candidate_id, election_id, constituency_id, election_round, sort_order)
      VALUES ('%s', '%s', '%s', '%s', 21, 9)$$,
      test_id ('project_a'),
      test_id ('candidate_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    '42501',
    NULL,
    'WR-05: an entity user cannot set sort_order on its own nomination insert'
  );

SELECT
  throws_ok (
    format(
      $$UPDATE nominations SET short_name = '{"en": "A"}'::jsonb WHERE id = '%s'$$,
      test_id ('nomination_cand_a')
    ),
    '42501',
    NULL,
    'WR-05: an entity user cannot change short_name on its own nomination'
  );

SELECT
  throws_ok (
    format(
      $$UPDATE nominations SET candidate_id = '%s' WHERE id = '%s'$$,
      test_id ('candidate_a2'),
      test_id ('nomination_cand_a')
    ),
    '42501',
    NULL,
    'WR-05: an entity user cannot re-point its own nomination at another entity'
  );

SELECT
  reset_role ();

-- =====================================================================
-- SYM: the election symbol on the entity's own nomination
--
-- `enforce_nomination_entity_columns` lets the editor of a nomination's own entity set and change `election_symbol`, and none of the other eight presentation and bookkeeping columns. A row is the caller's own when the caller holds `nomination.edit` on the entity it nominates, so a placeholder parent row the caller inserts for an organization is not. Each positive below has a control that differs from it in one thing: the entity the row nominates, the column written, or the lock.
--
-- `42501` is the code of this trigger's refusal, of a row-level-security refusal and of a column-grant refusal, so a refusal is asserted with its whole message. The trigger's two messages are stated once, in `pg_temp.symbol_insert_refusal` and `pg_temp.symbol_update_refusal`.
--
-- `pg_temp.try_set_nomination_symbol` returns the number of rows an UPDATE of one nomination's symbol affected under the calling session's row-level security, or -1 when the statement was refused with `42501`. Like `pg_temp.try_edit_nomination` it is not SECURITY DEFINER.
-- =====================================================================
CREATE FUNCTION pg_temp.symbol_insert_refusal () RETURNS text LANGUAGE sql IMMUTABLE AS $fn$
  SELECT $m$Only a holder of project.edit_nominations may set a nomination's name, short_name, info, color, image, sort_order, subtype or external_id, or the election_symbol of a nomination that is not the caller's own$m$::text
$fn$;

CREATE FUNCTION pg_temp.symbol_update_refusal () RETURNS text LANGUAGE sql IMMUTABLE AS $fn$
  SELECT $m$Only a holder of project.edit_nominations may change a nomination's presentation columns, external_id or entity, or the election_symbol of a nomination that is not the caller's own$m$::text
$fn$;

CREATE FUNCTION pg_temp.try_set_nomination_symbol (p_id uuid, p_symbol text) RETURNS integer LANGUAGE plpgsql AS $fn$
DECLARE
  v_rows integer;
BEGIN
  UPDATE public.nominations
  SET election_symbol = p_symbol
  WHERE id = p_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows;
EXCEPTION
  WHEN insufficient_privilege THEN
    RETURN -1;
END;
$fn$;

SELECT
  is (
    (
      SELECT
        prosecdef
      FROM
        pg_proc
      WHERE
        oid = 'public.enforce_nomination_entity_columns()'::regprocedure
    ),
    false,
    'SYM: the column rule is not SECURITY DEFINER, so its role test and its own-row question are asked of the caller'
  );

-- The cap's trigger runs before every guard, and the two CAP blocks left candidate_a and organization_a at the cap. Clearing the authorship puts each caller's count at zero, so the inserts below meet the symbol rule and not the cap.
UPDATE nominations
SET
  created_by = NULL
WHERE
  created_by IN (
    test_user_id ('candidate_a'),
    test_user_id ('organization_a')
  );

-- Round 51: a confirmed nomination of candidate_a and one of candidate_a2, each with a symbol. Both are public, so candidate_a can read the one that is not its own.
INSERT INTO
  nominations (
    id,
    project_id,
    candidate_id,
    election_id,
    constituency_id,
    election_round,
    election_symbol,
    confirmed
  )
VALUES
  (
    '12121212-1212-1212-1212-000000005101'::uuid,
    test_id ('project_a'),
    test_id ('candidate_a'),
    test_id ('election_a'),
    test_id ('constituency_a'),
    51,
    '3',
    true
  ),
  (
    '12121212-1212-1212-1212-000000005102'::uuid,
    test_id ('project_a'),
    test_id ('candidate_a2'),
    test_id ('election_a'),
    test_id ('constituency_a'),
    51,
    '30',
    true
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO nominations (project_id, candidate_id, election_id, constituency_id, election_round, election_symbol)
      VALUES ('%s', '%s', '%s', '%s', 50, '17')$$,
      test_id ('project_a'),
      test_id ('candidate_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    'SYM: a candidate''s editor inserts its own nomination WITH an election symbol'
  );

-- The placeholder pair. candidate_a holds a nomination at round 51 and organization 20 has none there, so every guard of the parent policy is satisfied and the two statements differ in the symbol alone.
SELECT
  throws_ok (
    format(
      $$INSERT INTO nominations (project_id, organization_id, election_id, constituency_id, election_round, election_symbol)
      VALUES ('%s', '12121212-1212-1212-1212-000000000020'::uuid, '%s', '%s', 51, '9')$$,
      test_id ('project_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    '42501',
    pg_temp.symbol_insert_refusal (),
    'SYM-neg: the same editor inserting a placeholder parent row for an organization WITH a symbol is refused by the column rule -- that row is not its own'
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO nominations (project_id, organization_id, election_id, constituency_id, election_round)
      VALUES ('%s', '12121212-1212-1212-1212-000000000020'::uuid, '%s', '%s', 51)$$,
      test_id ('project_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    'SYM-neg: the same placeholder WITHOUT a symbol is created -- so the refusal above is the symbol''s and no other guard''s'
  );

SELECT
  is (
    pg_temp.try_set_nomination_symbol ('12121212-1212-1212-1212-000000005101'::uuid, '4'),
    1,
    'SYM: that editor changes the symbol of its own CONFIRMED nomination -- one row'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        nominations
      WHERE
        id = '12121212-1212-1212-1212-000000005102'::uuid
    ),
    1,
    'SYM-neg: the editor can READ another candidate''s public nomination -- so the zero below is the update policy''s and not the read policy''s'
  );

SELECT
  is (
    pg_temp.try_set_nomination_symbol (
      '12121212-1212-1212-1212-000000005102'::uuid,
      '31'
    ),
    0,
    'SYM-neg: the editor changing the symbol of ANOTHER candidate''s nomination affects zero rows'
  );

-- The other eight columns, one at a time and on both verbs. Each statement differs from an admitted one in the named column alone, and each refusal rolls back, so round 52 and the row of round 51 serve every line.
SELECT
  throws_ok (
    format(
      $$INSERT INTO nominations (project_id, candidate_id, election_id, constituency_id, election_round, %I)
      VALUES ('%s', '%s', '%s', '%s', 52, %s)$$,
      c.col,
      test_id ('project_a'),
      test_id ('candidate_a'),
      test_id ('election_a'),
      test_id ('constituency_a'),
      c.val
    ),
    '42501',
    pg_temp.symbol_insert_refusal (),
    'SYM-neg: the editor setting ' || c.col || ' on an insert of its own nomination is refused by the column rule'
  )
FROM
  (
    VALUES
      ('name', $v$'{"en":"A name"}'::jsonb$v$),
      ('short_name', $v$'{"en":"N"}'::jsonb$v$),
      ('info', $v$'{"en":"Some info"}'::jsonb$v$),
      ('color', $v$'{"normal":"#123456"}'::jsonb$v$),
      ('image', $v$'{"path":"an-image.png"}'::jsonb$v$),
      ('sort_order', $v$5$v$),
      ('subtype', $v$'a-subtype'$v$),
      ('external_id', $v$'sym-neg-insert'$v$)
  ) AS c (col, val);

SELECT
  throws_ok (
    format(
      $$UPDATE nominations SET %I = %s WHERE id = '12121212-1212-1212-1212-000000005101'::uuid$$,
      c.col,
      c.val
    ),
    '42501',
    pg_temp.symbol_update_refusal (),
    'SYM-neg: the editor changing ' || c.col || ' of its own nomination is refused by the column rule'
  )
FROM
  (
    VALUES
      ('name', $v$'{"en":"A name"}'::jsonb$v$),
      ('short_name', $v$'{"en":"N"}'::jsonb$v$),
      ('info', $v$'{"en":"Some info"}'::jsonb$v$),
      ('color', $v$'{"normal":"#123456"}'::jsonb$v$),
      ('image', $v$'{"path":"an-image.png"}'::jsonb$v$),
      ('sort_order', $v$5$v$),
      ('subtype', $v$'a-subtype'$v$),
      ('external_id', $v$'sym-neg-update'$v$)
  ) AS c (col, val);

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        election_symbol || '/' || confirmed::text
      FROM
        nominations
      WHERE
        candidate_id = test_id ('candidate_a')
        AND election_round = 50
    ),
    '17/false',
    'SYM: the inserted row holds the symbol and is UNCONFIRMED, read as the owner'
  );

SELECT
  is (
    (
      SELECT
        election_symbol || '/' || confirmed::text
      FROM
        nominations
      WHERE
        id = '12121212-1212-1212-1212-000000005101'::uuid
    ),
    '4/false',
    'SYM: the changed row holds the new symbol and is UNCONFIRMED afterwards -- an administrator reviews a self-declared symbol before voters see it'
  );

SELECT
  is (
    (
      SELECT
        election_symbol || '/' || confirmed::text
      FROM
        nominations
      WHERE
        id = '12121212-1212-1212-1212-000000005102'::uuid
    ),
    '30/true',
    'SYM-neg: the other candidate''s nomination holds its symbol and its confirmation, read as the owner'
  );

SELECT
  is (
    (
      SELECT
        count(*)::text || '/' || count(election_symbol)::text
      FROM
        nominations
      WHERE
        organization_id = '12121212-1212-1212-1212-000000000020'::uuid
        AND election_round = 51
    ),
    '1/0',
    'SYM-neg: one placeholder row stands at that contest and it carries no symbol'
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
      $$INSERT INTO nominations (project_id, organization_id, election_id, constituency_id, election_round, election_symbol)
      VALUES ('%s', '%s', '%s', '%s', 50, 'A')$$,
      test_id ('project_a'),
      test_id ('org_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    'SYM: an organization''s editor inserts its own nomination WITH an election symbol'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        election_symbol || '/' || confirmed::text
      FROM
        nominations
      WHERE
        organization_id = test_id ('org_a')
        AND election_round = 50
    ),
    'A/false',
    'SYM: the organization''s inserted row holds the symbol and is UNCONFIRMED, read as the owner'
  );

-- SYM-lock: the lock pair on both verbs. With the lock on, the insert passes the column rule, because the row is the caller's own, and is refused by the row-level-security check; the update finds no row. With the lock off the same two statements write.
UPDATE app_settings
SET
  settings = jsonb_recursive_merge (
    settings,
    '{"access":{"nominationsLocked":true}}'::jsonb
  )
WHERE
  project_id = test_id ('project_a');

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO nominations (project_id, candidate_id, election_id, constituency_id, election_round, election_symbol)
      VALUES ('%s', '%s', '%s', '%s', 53, '5')$$,
      test_id ('project_a'),
      test_id ('candidate_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    '42501',
    'new row violates row-level security policy for table "nominations"',
    'SYM-lock: with the project nomination lock ON the insert of an own nomination with a symbol is refused by the policy'
  );

SELECT
  is (
    pg_temp.try_set_nomination_symbol ('12121212-1212-1212-1212-000000005101'::uuid, '6'),
    0,
    'SYM-lock: with the lock ON a change of the symbol of an own nomination affects zero rows'
  );

SELECT
  reset_role ();

SELECT
  isnt (
    (
      SELECT
        election_symbol
      FROM
        nominations
      WHERE
        id = '12121212-1212-1212-1212-000000005101'::uuid
    ),
    '6',
    'SYM-lock: the stored symbol is not the one the locked update named, read as the owner'
  );

UPDATE app_settings
SET
  settings = jsonb_recursive_merge (
    settings,
    '{"access":{"nominationsLocked":false}}'::jsonb
  )
WHERE
  project_id = test_id ('project_a');

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO nominations (project_id, candidate_id, election_id, constituency_id, election_round, election_symbol)
      VALUES ('%s', '%s', '%s', '%s', 53, '5')$$,
      test_id ('project_a'),
      test_id ('candidate_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    'SYM-lock: with the lock OFF the SAME insert is admitted'
  );

SELECT
  is (
    pg_temp.try_set_nomination_symbol ('12121212-1212-1212-1212-000000005101'::uuid, '6'),
    1,
    'SYM-lock: with the lock OFF the SAME update affects one row'
  );

SELECT
  reset_role ();

-- =====================================================================
-- DEL: the entity editor deletes its own nomination
--
-- `entity_delete_nominations` has two conjuncts: `nomination.edit` on the entity the row nominates, and the project's nominations unlocked. Whether the row is confirmed, and who created it, are not asked. The foreign key on `parent_nomination_id` refuses the delete while a nomination is listed under the row.
--
-- `pg_temp.try_delete_nomination` returns the number of rows a DELETE of one nomination removed under the calling session's row-level security. Like `pg_temp.try_edit_nomination` it is not SECURITY DEFINER.
--
-- Every row a control tries to delete is one its caller can read, and an assertion says so, so a count of zero is the delete policy's answer and not the read policy's.
-- =====================================================================
CREATE FUNCTION pg_temp.try_delete_nomination (p_id uuid) RETURNS integer LANGUAGE plpgsql AS $fn$
DECLARE
  v_rows integer;
BEGIN
  DELETE FROM public.nominations
  WHERE id = p_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows;
END;
$fn$;

SELECT
  is (
    has_table_privilege('authenticated', 'public.nominations', 'DELETE'),
    true,
    'DEL: authenticated holds DELETE on public.nominations at the table level -- the policies are the only gate on the verb'
  );

SELECT
  is (
    (
      SELECT
        cmd || '/' || roles::text || '/' || (qual ~ 'private\.project_nominations_locked')::text || '/' || (qual !~ 'app_settings')::text
      FROM
        pg_policies
      WHERE
        schemaname = 'public'
        AND tablename = 'nominations'
        AND policyname = 'entity_delete_nominations'
    ),
    'DELETE/{authenticated}/true/true',
    'DEL: the policy is FOR DELETE TO authenticated, and it asks the lock of private.project_nominations_locked and reads no settings row itself'
  );

-- Rounds 61 to 64. candidate_a: an unconfirmed row, a confirmed row and the confirmed row of the lock pair. candidate_a2: a confirmed, public row. org_a: a row with candidate_a2's nomination listed under it.
INSERT INTO
  nominations (
    id,
    project_id,
    candidate_id,
    election_id,
    constituency_id,
    election_round,
    confirmed
  )
VALUES
  (
    '12121212-1212-1212-1212-000000005201'::uuid,
    test_id ('project_a'),
    test_id ('candidate_a'),
    test_id ('election_a'),
    test_id ('constituency_a'),
    61,
    false
  ),
  (
    '12121212-1212-1212-1212-000000005202'::uuid,
    test_id ('project_a'),
    test_id ('candidate_a'),
    test_id ('election_a'),
    test_id ('constituency_a'),
    62,
    true
  ),
  (
    '12121212-1212-1212-1212-000000005203'::uuid,
    test_id ('project_a'),
    test_id ('candidate_a2'),
    test_id ('election_a'),
    test_id ('constituency_a'),
    61,
    true
  ),
  (
    '12121212-1212-1212-1212-000000005204'::uuid,
    test_id ('project_a'),
    test_id ('candidate_a'),
    test_id ('election_a'),
    test_id ('constituency_a'),
    63,
    true
  );

INSERT INTO
  nominations (
    id,
    project_id,
    organization_id,
    election_id,
    constituency_id,
    election_round
  )
VALUES
  (
    '12121212-1212-1212-1212-000000005210'::uuid,
    test_id ('project_a'),
    test_id ('org_a'),
    test_id ('election_a'),
    test_id ('constituency_a'),
    64
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
    '12121212-1212-1212-1212-000000005211'::uuid,
    test_id ('project_a'),
    test_id ('candidate_a2'),
    test_id ('election_a'),
    test_id ('constituency_a'),
    64,
    '12121212-1212-1212-1212-000000005210'::uuid
  );

-- The placeholder candidate_a created at round 51 is made public, so that its creator can read it and the delete policy alone decides.
UPDATE organizations
SET
  confirmed = true
WHERE
  id = '12121212-1212-1212-1212-000000000020'::uuid;

UPDATE nominations
SET
  confirmed = true
WHERE
  organization_id = '12121212-1212-1212-1212-000000000020'::uuid
  AND election_round = 51;

SELECT
  is (
    (
      SELECT
        created_by
      FROM
        nominations
      WHERE
        organization_id = '12121212-1212-1212-1212-000000000020'::uuid
        AND election_round = 51
    ),
    test_user_id ('candidate_a'),
    'DEL-neg: the placeholder parent row records candidate_a as the caller who created it'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  is (
    pg_temp.try_delete_nomination ('12121212-1212-1212-1212-000000005201'::uuid),
    1,
    'DEL: an editor deletes its own UNCONFIRMED nomination -- one row'
  );

SELECT
  is (
    pg_temp.try_delete_nomination ('12121212-1212-1212-1212-000000005202'::uuid),
    1,
    'DEL: an editor deletes its own CONFIRMED nomination -- one row'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        nominations
      WHERE
        id = '12121212-1212-1212-1212-000000005203'::uuid
        OR (
          organization_id = '12121212-1212-1212-1212-000000000020'::uuid
          AND election_round = 51
        )
    ),
    2,
    'DEL-neg: the editor can READ the placeholder it created and another candidate''s nomination -- so the zeros below are the delete policy''s'
  );

SELECT
  is (
    pg_temp.try_delete_nomination (
      (
        SELECT
          id
        FROM
          nominations
        WHERE
          organization_id = '12121212-1212-1212-1212-000000000020'::uuid
          AND election_round = 51
      )
    ),
    0,
    'DEL-neg: the editor deleting the placeholder parent row it created ITSELF affects zero rows -- a row created for another entity is not its own'
  );

SELECT
  is (
    pg_temp.try_delete_nomination ('12121212-1212-1212-1212-000000005203'::uuid),
    0,
    'DEL-neg: the editor deleting ANOTHER candidate''s nomination affects zero rows'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        nominations
      WHERE
        id IN (
          '12121212-1212-1212-1212-000000005201'::uuid,
          '12121212-1212-1212-1212-000000005202'::uuid
        )
    ),
    0,
    'DEL: both of the editor''s own rows are gone, read as the owner'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        nominations
      WHERE
        id = '12121212-1212-1212-1212-000000005203'::uuid
        OR (
          organization_id = '12121212-1212-1212-1212-000000000020'::uuid
          AND election_round = 51
        )
    ),
    2,
    'DEL-neg: the placeholder and the other candidate''s nomination are still there, read as the owner'
  );

UPDATE app_settings
SET
  settings = jsonb_recursive_merge (
    settings,
    '{"access":{"nominationsLocked":true}}'::jsonb
  )
WHERE
  project_id = test_id ('project_a');

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  is (
    pg_temp.try_delete_nomination ('12121212-1212-1212-1212-000000005204'::uuid),
    0,
    'DEL-neg: with the project nomination lock ON the editor deleting its own nomination affects zero rows'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        nominations
      WHERE
        id = '12121212-1212-1212-1212-000000005204'::uuid
    ),
    1,
    'DEL-neg: that nomination is still there while the lock is on, read as the owner'
  );

UPDATE app_settings
SET
  settings = jsonb_recursive_merge (
    settings,
    '{"access":{"nominationsLocked":false}}'::jsonb
  )
WHERE
  project_id = test_id ('project_a');

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  is (
    pg_temp.try_delete_nomination ('12121212-1212-1212-1212-000000005204'::uuid),
    1,
    'DEL: with the lock OFF the SAME statement removes the row -- the lock asserted in both directions'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('organization_a'),
    test_user_grants ('organization_a')
  );

SELECT
  throws_ok (
    $$DELETE FROM nominations WHERE id = '12121212-1212-1212-1212-000000005210'::uuid$$,
    '23503',
    'update or delete on table "nominations" violates foreign key constraint "nominations_parent_nomination_id_fkey" on table "nominations"',
    'DEL-fk: an organization''s editor deleting its nomination while a candidate''s nomination names it as parent is refused, and the refusal names the constraint'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        nominations
      WHERE
        id = '12121212-1212-1212-1212-000000005210'::uuid
    ),
    1,
    'DEL-fk: the organization''s nomination is still there, read as the owner'
  );

DELETE FROM nominations
WHERE
  id = '12121212-1212-1212-1212-000000005211'::uuid;

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('organization_a'),
    test_user_grants ('organization_a')
  );

SELECT
  is (
    pg_temp.try_delete_nomination ('12121212-1212-1212-1212-000000005210'::uuid),
    1,
    'DEL-fk: once no nomination is listed under it the SAME editor removes the same row -- so the refusal above is the foreign key''s'
  );

SELECT
  reset_role ();

SELECT
  set_test_user ('anon');

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        nominations
      WHERE
        id = '12121212-1212-1212-1212-000000005203'::uuid
    ),
    1,
    'DEL-neg: anon can READ a public nomination -- so the zero below is the absence of a delete policy for anon'
  );

SELECT
  is (
    pg_temp.try_delete_nomination ('12121212-1212-1212-1212-000000005203'::uuid),
    0,
    'DEL-neg: anon deletes nothing'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        nominations
      WHERE
        id = '12121212-1212-1212-1212-000000005203'::uuid
    ),
    1,
    'DEL-neg: the nomination anon named is still there, read as the owner'
  );

-- =====================================================================
-- Section 10: which stored values lock
--
-- `private.project_nominations_locked` answers locked for a project that does not exist and for the JSON boolean `true` at `access.nominationsLocked`, and unlocked for everything else: no settings row, no `access` member, no key, and a key holding any other JSON value. The string is the case a text comparison would read as locked, and the number the case a cast to boolean would.
--
-- `pg_temp.locked_with_access` stores its argument as project B's `access` member, or removes the member when the argument is NULL, and returns the function's answer for project B. It runs as the fixture owner and is not SECURITY DEFINER; the function it calls is, which is how it reads the row whoever asks. Project B is used because no pair above depends on its settings row.
-- =====================================================================
CREATE FUNCTION pg_temp.locked_with_access (p_access jsonb) RETURNS boolean LANGUAGE plpgsql AS $fn$
BEGIN
  UPDATE public.app_settings
  SET settings = CASE
    WHEN p_access IS NULL THEN settings - 'access'
    ELSE jsonb_set(settings, '{access}', p_access)
  END
  WHERE project_id = public.test_id('project_b');
  RETURN private.project_nominations_locked(public.test_id('project_b'));
END;
$fn$;

SELECT
  is (
    private.project_nominations_locked ('0badc0de-0000-4000-8000-000000000023'::uuid),
    true,
    'SOURCE: an id that names no project is LOCKED -- what cannot be read never unlocks anything'
  );

SELECT
  is (
    pg_temp.locked_with_access (NULL),
    false,
    'SOURCE: a settings row with no access member is unlocked'
  );

SELECT
  is (
    pg_temp.locked_with_access ('{"answersLocked":true}'::jsonb),
    false,
    'SOURCE: an access member without the key is unlocked, whatever its other members say'
  );

SELECT
  is (
    pg_temp.locked_with_access ('{"nominationsLocked":true}'::jsonb),
    true,
    'SOURCE: the JSON boolean true is LOCKED -- the one stored value that locks'
  );

SELECT
  is (
    pg_temp.locked_with_access ('{"nominationsLocked":false}'::jsonb),
    false,
    'SOURCE: the JSON boolean false is unlocked'
  );

SELECT
  is (
    pg_temp.locked_with_access ('{"nominationsLocked":"true"}'::jsonb),
    false,
    'SOURCE: the STRING "true" is unlocked -- the value is compared as JSON, not as text'
  );

SELECT
  is (
    pg_temp.locked_with_access ('{"nominationsLocked":1}'::jsonb),
    false,
    'SOURCE: the number 1 is unlocked'
  );

SELECT
  is (
    pg_temp.locked_with_access ('{"nominationsLocked":null}'::jsonb),
    false,
    'SOURCE: a JSON null is unlocked'
  );

SELECT
  is (
    pg_temp.locked_with_access ('["nominationsLocked"]'::jsonb),
    false,
    'SOURCE: an access member that is an array and not an object is unlocked'
  );

DELETE FROM app_settings
WHERE
  project_id = test_id ('project_b');

SELECT
  is (
    private.project_nominations_locked (test_id ('project_b')),
    false,
    'SOURCE: a project with NO settings row is unlocked -- only a missing project fails closed'
  );

-- =====================================================================
-- Section 9: the parent foreign key's delete action (D-12d, task 2 Q2 = A)
--
-- ⚠ LAST IN THE FILE ON PURPOSE. Its second assertion DELETES project B, which the read-model section above reads across; running it earlier left that section reading a project that no longer existed.
--
-- Both halves are asserted BEHAVIOURALLY rather than from `pg_constraint.confdeltype` alone, because the catalogue does not distinguish the two refusing options in the case that decides between them. `NO ACTION` refuses at the END OF THE STATEMENT and `RESTRICT` at the offending row; the second half below is the case `bulk_delete` depends on, and it is the half `RESTRICT` would break.
-- =====================================================================
SELECT
  throws_like (
    format(
      $$DELETE FROM nominations WHERE id = '%s'$$,
      test_id ('nomination_org_b')
    ),
    '%nominations_parent_nomination_id_fkey%',
    'a targeted delete of a parent nomination that still has a child is REFUSED by name -- the loud behaviour that replaces the silent cascade section 11.5 fact 35 forbids'
  );

DELETE FROM projects
WHERE
  id = test_id ('project_b');

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        nominations
      WHERE
        id IN (
          test_id ('nomination_org_b'),
          test_id ('nomination_cand_b')
        )
    ),
    0,
    'deleting the owning PROJECT still removes the whole subtree in one statement -- the cascade `bulk_delete` depends on, which an immediately-refusing action would have broken'
  );

SELECT
  *
FROM
  finish ();

ROLLBACK;
