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
  plan (51);

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
-- Section 3: the entity update policy, and the nomination lock's first and only reader
--
-- `projects.lock_nominations` shipped INERT in 162-07 and said so in its own schema comment: nothing read it, nothing set it, and no assertion claimed anything for it beyond type and default. This is its first reader, which means an error in its declaration surfaces here rather than there.
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

UPDATE projects
SET
  lock_nominations = true
WHERE
  id = test_id ('project_a');

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

UPDATE projects
SET
  lock_nominations = false
WHERE
  id = test_id ('project_a');

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
--   round 3  candidate_a holds a nomination        -- guard 5 satisfied, the working contest round 4  candidate_a2 holds none at first      -- guard 5's pair round 5  org_race is nominated UNDER AN ALLIANCE -- guard 3 versus the uniqueness key round 6  the lock pair round 7  candidate_a holds NO nomination       -- guard 5's contest-scope pair
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

-- G1-neg (guard 1): the same caller, same contest, but a CANDIDATE-type row for an entity that is not theirs. `entity_insert_nominations` refuses it because they hold no grant on that candidate, and the parent policy refuses it because guard 1 requires an organization. Nothing else differs.
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
    'G1-neg: guard 1 -- a CANDIDATE-type row is refused through the parent policy; the hole is organization-shaped'
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

UPDATE projects
SET
  lock_nominations = true
WHERE
  id = test_id ('project_a');

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

SELECT
  reset_role ();

UPDATE projects
SET
  lock_nominations = false
WHERE
  id = test_id ('project_a');

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
    '%at most 10 unconfirmed parent organization nominations%',
    'CAP: the next one is REFUSED with a message naming the ruled cap value -- a caller is told what they hit, which a row-level-security refusal alone would never say'
  );

-- PERM: `nomination.create_parent` is SEPARATELY REVOCABLE, which is the whole argument for it being its own verb rather than a widening of `nomination.edit`. An organization editor holds the edit verb and not this one (section 3.3 withholds it: an organization's parent would be an alliance nomination).
SELECT
  reset_role ();

SELECT
  test_seed_identity_grants ('organization_a');

INSERT INTO
  nominations (
    project_id,
    organization_id,
    election_id,
    constituency_id,
    election_round
  )
VALUES
  (
    test_id ('project_a'),
    test_id ('org_a'),
    test_id ('election_a'),
    test_id ('constituency_a'),
    9
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('organization_a'),
    test_user_grants ('organization_a')
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO nominations (project_id, organization_id, election_id, constituency_id, election_round)
      VALUES ('%s', '12121212-1212-1212-1212-000000000010'::uuid, '%s', '%s', 9)$$,
      test_id ('project_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    '42501',
    NULL,
    'PERM: a caller holding nomination.edit but NOT nomination.create_parent is refused, even with a nomination of their own at that contest -- the verb is separately revocable'
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
      $$INSERT INTO nominations (project_id, candidate_id, election_id, constituency_id, election_round, election_symbol)
      VALUES ('%s', '%s', '%s', '%s', 21, '9')$$,
      test_id ('project_a'),
      test_id ('candidate_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    '42501',
    NULL,
    'WR-05: an entity user still cannot set election_symbol on its own nomination insert'
  );

SELECT
  throws_ok (
    format(
      $$UPDATE nominations SET election_symbol = '9' WHERE id = '%s'$$,
      test_id ('nomination_cand_a')
    ),
    '42501',
    NULL,
    'WR-05: an entity user still cannot change election_symbol on its own nomination'
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
