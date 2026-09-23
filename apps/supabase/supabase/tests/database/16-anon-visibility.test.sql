-- 16-anon-visibility.test.sql: the anon visibility grid
--
-- 162-08 moved public read off ten per-row publication flags and onto one project flag and two confirmation states; 162-16 then deleted those ten columns and their five partial indexes from the schema. The two failure modes of that move are opposite and only one of them is visible: too strict and the voter application renders empty, which the E2E suite reports at the first spec; too loose and unconfirmed or closed-project rows become world-readable, which NOTHING reports, because a passing read test cannot tell "correctly visible" from "should have been hidden".
--
-- So this file is not a read test. Every case below is a PAIR: a row the anon caller must see and a row it must not, differing in EXACTLY ONE CONJUNCT, with every other conjunct held true. A policy in which two conjuncts are accidentally the same predicate passes a visibility-only test set and reddens here.
--
-- Depends on: 00-helpers.test.sql (set_test_user, reset_role, create_test_data, test_id).
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (52);

SELECT
  create_test_data ();

-- =====================================================================
-- Fixture: one otherwise-identical candidate per conjunct, each with the single conjunct under test flipped
--
-- These rows live in THIS file's transaction rather than in create_test_data(), so a reddening here is attributable to the predicate being asserted and not to a shared fixture in flight. Project A is open for voters and project B is not, which is the polarity create_test_data() already carries.
-- =====================================================================
SELECT
  reset_role ();

INSERT INTO
  candidates (
    id,
    project_id,
    first_name,
    last_name,
    terms_of_use_accepted,
    confirmed
  )
VALUES
  (
    'eeeeeeee-eeee-eeee-eeee-000000000001'::uuid,
    test_id ('project_a'),
    'T',
    'Visible',
    now() - interval '1 day',
    true
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-000000000002'::uuid,
    test_id ('project_b'),
    'T',
    'ClosedProject',
    now() - interval '1 day',
    true
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-000000000003'::uuid,
    test_id ('project_a'),
    'T',
    'Unconfirmed',
    now() - interval '1 day',
    false
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-000000000004'::uuid,
    test_id ('project_a'),
    'T',
    'NominationUnconfirmed',
    now() - interval '1 day',
    true
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-000000000005'::uuid,
    test_id ('project_a'),
    'T',
    'NoNomination',
    now() - interval '1 day',
    true
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-000000000006'::uuid,
    test_id ('project_a'),
    'T',
    'NoTermsOfUse',
    NULL,
    true
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-000000000007'::uuid,
    test_id ('project_a'),
    'T',
    'NullUnconfirmed',
    now() - interval '1 day',
    true
  );

-- One standalone nomination per candidate above, except T NoNomination, which is the absence case. Every `confirmed` value is stated explicitly.
--
-- ⚠ FLIPPED BY 162-12 (D-11c): the column was `unconfirmed boolean DEFAULT false` and is now `confirmed boolean NOT NULL DEFAULT false`, so every value here is the negation of what it was. Row a7 used to carry a literal NULL, because the old column was nullable and the whole point of that row was that a NULL read as "not unconfirmed"; `NOT NULL` makes that row UNREPRESENTABLE, so it now carries `confirmed = true` -- the same visibility it always had -- and the assertion that used to read it has been TRANSFORMED into a structural one stating that the NULL case can no longer occur at all. See section 2.
--
-- ⚠ ROW a9 MOVED FROM election_round 1 TO 2, AND THE REASON IS THE UNIQUENESS KEY 162-12 ADDS. a1 and a9 are the same candidate at the same (election, constituency, round) with no parent, differing only in the confirmation flag -- which is precisely what `nominations_entity_parent_contest_key UNIQUE NULLS NOT DISTINCT` forbids. MEASURED: installing that key turned this file red at this INSERT. The round is read by NO anon predicate, so a9 still differs from a1 in the confirmation flag ALONE as far as the rule under test is concerned, and the denial below is still un-over-determined. The collision itself is 162-08's: it added `nomination_faction_a` / `nomination_alliance_a` to the shared fixture, duplicating rows three files already created locally.
--
-- The last rows exist because the obvious spellings of the nomination-side denials are OVER-DETERMINED and were measured to be so. A nomination in a closed project linking a candidate in that same closed project is hidden by TWO conjuncts -- its own project term and the transitive one, which reads the same flag through the entity -- so flipping open_for_voters flips both and the assertion isolates nothing; it reddened under no wrong-predicate variant at all. Likewise a nomination whose only linked candidate has no OTHER confirmed nomination is hidden both by its own `confirmed` and by the transitive term. Both denials therefore point at a nomination whose linked candidate is the fully visible one, so exactly one conjunct is false in each.
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
    'eeeeeeee-eeee-eeee-eeee-0000000000a1'::uuid,
    test_id ('project_a'),
    'eeeeeeee-eeee-eeee-eeee-000000000001'::uuid,
    test_id ('election_a'),
    test_id ('constituency_a'),
    1,
    true
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-0000000000a2'::uuid,
    test_id ('project_b'),
    'eeeeeeee-eeee-eeee-eeee-000000000002'::uuid,
    test_id ('election_b'),
    test_id ('constituency_b'),
    1,
    true
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-0000000000a3'::uuid,
    test_id ('project_a'),
    'eeeeeeee-eeee-eeee-eeee-000000000003'::uuid,
    test_id ('election_a'),
    test_id ('constituency_a'),
    1,
    true
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-0000000000a4'::uuid,
    test_id ('project_a'),
    'eeeeeeee-eeee-eeee-eeee-000000000004'::uuid,
    test_id ('election_a'),
    test_id ('constituency_a'),
    1,
    false
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-0000000000a6'::uuid,
    test_id ('project_a'),
    'eeeeeeee-eeee-eeee-eeee-000000000006'::uuid,
    test_id ('election_a'),
    test_id ('constituency_a'),
    1,
    true
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-0000000000a7'::uuid,
    test_id ('project_a'),
    'eeeeeeee-eeee-eeee-eeee-000000000007'::uuid,
    test_id ('election_a'),
    test_id ('constituency_a'),
    1,
    true
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-0000000000a8'::uuid,
    test_id ('project_b'),
    'eeeeeeee-eeee-eeee-eeee-000000000001'::uuid,
    test_id ('election_b'),
    test_id ('constituency_b'),
    1,
    true
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-0000000000a9'::uuid,
    test_id ('project_a'),
    'eeeeeeee-eeee-eeee-eeee-000000000001'::uuid,
    test_id ('election_a'),
    test_id ('constituency_a'),
    2,
    false
  );

-- =====================================================================
-- Fixture, second half: the other three entity tables, one row per conjunct each
--
-- The fixture's own org_b / faction_b / alliance_b cannot serve as the closed-project denial, because they are ALSO not confirmed and ALSO unnominated -- three false conjuncts at once, which isolates nothing. Each table therefore gets a purpose-built row per conjunct, with every other conjunct held true.
-- =====================================================================
INSERT INTO
  organizations (id, project_id, name, confirmed)
VALUES
  (
    'eeeeeeee-eeee-eeee-eeee-000000000101'::uuid,
    test_id ('project_b'),
    '{"en":"Org ClosedProject"}'::jsonb,
    true
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-000000000102'::uuid,
    test_id ('project_a'),
    '{"en":"Org Unconfirmed"}'::jsonb,
    false
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-000000000103'::uuid,
    test_id ('project_a'),
    '{"en":"Org NoNomination"}'::jsonb,
    true
  );

INSERT INTO
  factions (id, project_id, organization_id, name, confirmed)
VALUES
  (
    'eeeeeeee-eeee-eeee-eeee-000000000111'::uuid,
    test_id ('project_b'),
    test_id ('org_b'),
    '{"en":"Faction ClosedProject"}'::jsonb,
    true
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-000000000112'::uuid,
    test_id ('project_a'),
    test_id ('org_a'),
    '{"en":"Faction Unconfirmed"}'::jsonb,
    false
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-000000000113'::uuid,
    test_id ('project_a'),
    test_id ('org_a'),
    '{"en":"Faction NoNomination"}'::jsonb,
    true
  );

INSERT INTO
  alliances (id, project_id, name, confirmed)
VALUES
  (
    'eeeeeeee-eeee-eeee-eeee-000000000121'::uuid,
    test_id ('project_b'),
    '{"en":"Alliance ClosedProject"}'::jsonb,
    true
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-000000000122'::uuid,
    test_id ('project_a'),
    '{"en":"Alliance Unconfirmed"}'::jsonb,
    false
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-000000000123'::uuid,
    test_id ('project_a'),
    '{"en":"Alliance NoNomination"}'::jsonb,
    true
  );

-- A confirmed nomination for the closed-project row and for the unconfirmed row of each table, and NONE for the no-nomination row. `validate_nomination` requires a faction nomination to hang off an organization nomination sharing its election, constituency and round, and an alliance nomination to have no parent at all.
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
    'eeeeeeee-eeee-eeee-eeee-000000000201'::uuid,
    test_id ('project_b'),
    'eeeeeeee-eeee-eeee-eeee-000000000101'::uuid,
    test_id ('election_b'),
    test_id ('constituency_b'),
    1,
    true
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-000000000202'::uuid,
    test_id ('project_a'),
    'eeeeeeee-eeee-eeee-eeee-000000000102'::uuid,
    test_id ('election_a'),
    test_id ('constituency_a'),
    1,
    true
  );

INSERT INTO
  nominations (
    id,
    project_id,
    faction_id,
    election_id,
    constituency_id,
    election_round,
    parent_nomination_id,
    confirmed
  )
VALUES
  (
    'eeeeeeee-eeee-eeee-eeee-000000000211'::uuid,
    test_id ('project_b'),
    'eeeeeeee-eeee-eeee-eeee-000000000111'::uuid,
    test_id ('election_b'),
    test_id ('constituency_b'),
    1,
    test_id ('nomination_org_b'),
    true
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-000000000212'::uuid,
    test_id ('project_a'),
    'eeeeeeee-eeee-eeee-eeee-000000000112'::uuid,
    test_id ('election_a'),
    test_id ('constituency_a'),
    1,
    test_id ('nomination_org_a'),
    true
  );

INSERT INTO
  nominations (
    id,
    project_id,
    alliance_id,
    election_id,
    constituency_id,
    election_round,
    confirmed
  )
VALUES
  (
    'eeeeeeee-eeee-eeee-eeee-000000000221'::uuid,
    test_id ('project_b'),
    'eeeeeeee-eeee-eeee-eeee-000000000121'::uuid,
    test_id ('election_b'),
    test_id ('constituency_b'),
    1,
    true
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-000000000222'::uuid,
    test_id ('project_a'),
    'eeeeeeee-eeee-eeee-eeee-000000000122'::uuid,
    test_id ('election_a'),
    test_id ('constituency_a'),
    1,
    true
  );

-- =====================================================================
-- Section 1: the candidate pairs -- one conjunct flipped at a time
-- =====================================================================
SELECT
  set_test_user ('anon');

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        candidates
      WHERE
        id = 'eeeeeeee-eeee-eeee-eeee-000000000001'::uuid
    )::integer,
    1,
    'anon CAN see a candidate with every conjunct true: project open, confirmed, a non-unconfirmed nomination in the same project, and terms of use accepted in the past'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        candidates
      WHERE
        id = 'eeeeeeee-eeee-eeee-eeee-000000000002'::uuid
    )::integer,
    0,
    'anon CANNOT see an otherwise-visible candidate whose project is not open for voters -- the project conjunct, flipped alone'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        candidates
      WHERE
        id = 'eeeeeeee-eeee-eeee-eeee-000000000003'::uuid
    )::integer,
    0,
    'anon CANNOT see an otherwise-visible candidate whose own confirmed is false -- the entity conjunct, flipped alone'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        candidates
      WHERE
        id = 'eeeeeeee-eeee-eeee-eeee-000000000004'::uuid
    )::integer,
    0,
    'anon CANNOT see an otherwise-visible candidate whose only nomination is unconfirmed -- the nomination conjunct, flipped alone by state'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        candidates
      WHERE
        id = 'eeeeeeee-eeee-eeee-eeee-000000000005'::uuid
    )::integer,
    0,
    'anon CANNOT see an otherwise-visible candidate with no nomination at all -- the nomination conjunct, flipped alone by absence'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        candidates
      WHERE
        id = 'eeeeeeee-eeee-eeee-eeee-000000000006'::uuid
    )::integer,
    0,
    'anon CANNOT see an otherwise-visible candidate whose terms_of_use_accepted is NULL -- the terms-of-use conjunct, flipped alone'
  );

-- =====================================================================
-- Section 2: the nomination pairs -- including the transitive conjunct, which is the one new shape in 162-08
-- =====================================================================
SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        nominations
      WHERE
        id = 'eeeeeeee-eeee-eeee-eeee-0000000000a1'::uuid
    )::integer,
    1,
    'anon CAN see a nomination with every conjunct true: project open, not unconfirmed, and its linked candidate fully anon-readable'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        nominations
      WHERE
        id = 'eeeeeeee-eeee-eeee-eeee-0000000000a8'::uuid
    )::integer,
    0,
    'anon CANNOT see a nomination in a closed project whose linked candidate is fully anon-readable in an OPEN one -- the nomination project conjunct, flipped alone and not over-determined by the transitive one'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        nominations
      WHERE
        id = 'eeeeeeee-eeee-eeee-eeee-0000000000a9'::uuid
    )::integer,
    0,
    'anon CANNOT see an unconfirmed nomination whose linked candidate is fully anon-readable -- the unconfirmed conjunct, flipped alone and not over-determined by the transitive one'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        nominations
      WHERE
        id = 'eeeeeeee-eeee-eeee-eeee-0000000000a3'::uuid
    )::integer,
    0,
    'anon CANNOT see an otherwise-visible nomination whose linked candidate carries confirmed = false -- the TRANSITIVE conjunct, flipped alone'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        nominations
      WHERE
        id = 'eeeeeeee-eeee-eeee-eeee-0000000000a7'::uuid
    )::integer,
    1,
    'anon CAN see a confirmed nomination whose linked candidate is fully anon-readable -- row a7, kept from the NULL case this assertion used to carry'
  );

-- ⚠ TRANSFORMED BY 162-12, NOT DELETED, and the replacement is STRICTLY STRONGER. This assertion used to read: "anon CAN see a nomination whose unconfirmed is NULL rather than false -- the NULL-safe reading, which the `unconfirmed = false` spelling would drop". It proved that the predicate TOLERATED a NULL that COULD occur. D-11c makes the column `NOT NULL`, so the NULL can no longer occur at all and the old claim is not merely false, it is UNSTATABLE -- the fixture row it rested on cannot be inserted. The assertion below proves the better guarantee that replaces it: the hazard is gone by CONSTRUCTION rather than handled by a wrapper. One claim became another and the file's assertion count did not drop.
SELECT
  col_not_null (
    'public',
    'nominations',
    'confirmed',
    'the confirmation column is NOT NULL, so the NULL a null-coalescing reader used to compensate for is unrepresentable by construction -- strictly stronger than the tolerated-NULL assertion this replaces'
  );

-- =====================================================================
-- Section 3: the biconditional, and the recursion asserted absent
--
-- The biconditional is the mitigation for writing the terms-of-use rule in two expressions (task 2 Q3 = A): it fails when the nomination policy and the candidate policy DISAGREE, not merely when they differ.
-- =====================================================================
SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        nominations n
      WHERE
        n.candidate_id IS NOT NULL
        AND NOT EXISTS (
          SELECT
            1
          FROM
            candidates c
          WHERE
            c.id = n.candidate_id
        )
    )::integer,
    0,
    'zero nominations are visible to anon whose linked candidate that same anon caller cannot see -- the nomination policy and the candidate policy agree exactly'
  );

-- An anon read of `candidates` raises NOTHING. Written inline, the entity policy referencing `nominations` and the nomination policy referencing `candidates` produce `infinite recursion detected in policy for relation "candidates"` at plan time -- reproduced deliberately before this design was chosen. This assertion is that failure pinned absent as a standing property, and it reddens the moment a later plan inlines either lookup back into a policy.
SELECT
  lives_ok (
    $$
    SELECT count(*) FROM candidates
    $$,
    'an anon SELECT over candidates raises no error, so the entity and nomination predicates are not mutually recursive'
  );

-- =====================================================================
-- Section 5: the six project-scoped structure tables
--
-- One conjunct each, so one pair each: the project-A row is visible and the project-B row is not, and the ONLY thing separating them is `projects.open_for_voters`.
-- =====================================================================
SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        elections
      WHERE
        id = test_id ('election_a')
    )::integer,
    1,
    'anon CAN see an election in a project that is open for voters'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        elections
      WHERE
        id = test_id ('election_b')
    )::integer,
    0,
    'anon CANNOT see an election in a project that is not open for voters -- the project conjunct, flipped alone'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        constituency_groups
      WHERE
        id = test_id ('constituency_group_a')
    )::integer,
    1,
    'anon CAN see an constituency group in a project that is open for voters'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        constituency_groups
      WHERE
        id = test_id ('constituency_group_b')
    )::integer,
    0,
    'anon CANNOT see an constituency group in a project that is not open for voters -- the project conjunct, flipped alone'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        constituencies
      WHERE
        id = test_id ('constituency_a')
    )::integer,
    1,
    'anon CAN see an constituency in a project that is open for voters'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        constituencies
      WHERE
        id = test_id ('constituency_b')
    )::integer,
    0,
    'anon CANNOT see an constituency in a project that is not open for voters -- the project conjunct, flipped alone'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        question_categories
      WHERE
        id = test_id ('question_category_a')
    )::integer,
    1,
    'anon CAN see an question category in a project that is open for voters'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        question_categories
      WHERE
        id = test_id ('question_category_b')
    )::integer,
    0,
    'anon CANNOT see an question category in a project that is not open for voters -- the project conjunct, flipped alone'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        questions
      WHERE
        id = test_id ('question_a')
    )::integer,
    1,
    'anon CAN see an question in a project that is open for voters'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        questions
      WHERE
        id = test_id ('question_b')
    )::integer,
    0,
    'anon CANNOT see an question in a project that is not open for voters -- the project conjunct, flipped alone'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        app_settings
      WHERE
        id = test_id ('app_settings_a')
    )::integer,
    1,
    'anon CAN see an app_settings row in a project that is open for voters'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        app_settings
      WHERE
        id = test_id ('app_settings_b')
    )::integer,
    0,
    'anon CANNOT see an app_settings row in a project that is not open for voters -- the project conjunct, flipped alone'
  );

-- =====================================================================
-- Section 6: organizations, factions and alliances -- one visible row and three single-conjunct denials each
--
-- The helper resolves all four entity FK columns, not just the `candidate_id` the tracer exercised, and the entity type is an argument rather than a fact baked into four near-identical predicates.
-- =====================================================================
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
    'anon CAN see a organization with every conjunct true: project open, confirmed, and a non-unconfirmed nomination in the same project'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        organizations
      WHERE
        id = 'eeeeeeee-eeee-eeee-eeee-000000000101'::uuid
    )::integer,
    0,
    'anon CANNOT see a confirmed, nominated organization whose project is not open for voters -- the project conjunct, flipped alone'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        organizations
      WHERE
        id = 'eeeeeeee-eeee-eeee-eeee-000000000102'::uuid
    )::integer,
    0,
    'anon CANNOT see a nominated organization in an open project whose own confirmed is false -- the entity conjunct, flipped alone'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        organizations
      WHERE
        id = 'eeeeeeee-eeee-eeee-eeee-000000000103'::uuid
    )::integer,
    0,
    'anon CANNOT see a confirmed organization in an open project with no nomination at all -- the nomination conjunct, flipped alone'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        factions
      WHERE
        id = test_id ('faction_a')
    )::integer,
    1,
    'anon CAN see a faction with every conjunct true: project open, confirmed, and a non-unconfirmed nomination in the same project'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        factions
      WHERE
        id = 'eeeeeeee-eeee-eeee-eeee-000000000111'::uuid
    )::integer,
    0,
    'anon CANNOT see a confirmed, nominated faction whose project is not open for voters -- the project conjunct, flipped alone'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        factions
      WHERE
        id = 'eeeeeeee-eeee-eeee-eeee-000000000112'::uuid
    )::integer,
    0,
    'anon CANNOT see a nominated faction in an open project whose own confirmed is false -- the entity conjunct, flipped alone'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        factions
      WHERE
        id = 'eeeeeeee-eeee-eeee-eeee-000000000113'::uuid
    )::integer,
    0,
    'anon CANNOT see a confirmed faction in an open project with no nomination at all -- the nomination conjunct, flipped alone'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        alliances
      WHERE
        id = test_id ('alliance_a')
    )::integer,
    1,
    'anon CAN see a alliance with every conjunct true: project open, confirmed, and a non-unconfirmed nomination in the same project'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        alliances
      WHERE
        id = 'eeeeeeee-eeee-eeee-eeee-000000000121'::uuid
    )::integer,
    0,
    'anon CANNOT see a confirmed, nominated alliance whose project is not open for voters -- the project conjunct, flipped alone'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        alliances
      WHERE
        id = 'eeeeeeee-eeee-eeee-eeee-000000000122'::uuid
    )::integer,
    0,
    'anon CANNOT see a nominated alliance in an open project whose own confirmed is false -- the entity conjunct, flipped alone'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        alliances
      WHERE
        id = 'eeeeeeee-eeee-eeee-eeee-000000000123'::uuid
    )::integer,
    0,
    'anon CANNOT see a confirmed alliance in an open project with no nomination at all -- the nomination conjunct, flipped alone'
  );

-- =====================================================================
-- Section 7: the two join tables, which delegate rather than re-derive
--
-- Neither carries a project_id. Their policies hold the one inline sub-select in the whole anon set, and it is correct because it delegates to `anon_select_constituency_groups` -- that policy answering -- rather than restating the rule.
-- =====================================================================
SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        constituency_group_constituencies
      WHERE
        constituency_group_id = test_id ('constituency_group_a')
    )::integer,
    1,
    'anon CAN see a constituency_group_constituencies row whose constituency group is anon-visible'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        constituency_group_constituencies
      WHERE
        constituency_group_id = test_id ('constituency_group_b')
    )::integer,
    0,
    'anon CANNOT see a constituency_group_constituencies row whose constituency group''s project is not open for voters -- the delegation, flipped alone'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        election_constituency_groups
      WHERE
        constituency_group_id = test_id ('constituency_group_a')
    )::integer,
    1,
    'anon CAN see an election_constituency_groups row whose constituency group is anon-visible'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        election_constituency_groups
      WHERE
        constituency_group_id = test_id ('constituency_group_b')
    )::integer,
    0,
    'anon CANNOT see an election_constituency_groups row whose constituency group''s project is not open for voters -- the delegation, flipped alone'
  );

-- =====================================================================
-- Section 8: the closed-project settings case, and the transitive conjunct on an entity table other than candidates
-- =====================================================================
-- The behaviour the operator was asked to accept at task 2 Q4 and did, stated as its own assertion because NOTHING ELSE IN THE TREE IS IN THIS STATE: every project in every seed is open for voters, so no other gate can catch it. A closed project returns the anon caller no settings row at all, and the voter application has to be able to render that.
SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        app_settings
      WHERE
        project_id = test_id ('project_b')
    )::integer,
    0,
    'anon reading app_settings for a project that is not open for voters sees ZERO rows -- the frontend consequence ratified at task 2 Q4'
  );

-- The transitive conjunct on an entity table other than `candidates`, so the helper is shown to resolve the organization FK and not only the one the tracer exercised.
SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        nominations
      WHERE
        id = 'eeeeeeee-eeee-eeee-eeee-000000000202'::uuid
    )::integer,
    0,
    'anon CANNOT see a nomination in an open project whose linked ORGANIZATION carries confirmed = false -- the transitive conjunct on a second entity table'
  );

-- =====================================================================
-- Section 9: the fixture's own natural negative control
--
-- `candidate_a2` is confirmed, has accepted the terms of use in the past, sits in a project open for voters and is DELIBERATELY UNNOMINATED; `candidate_a` is identical in every other respect and carries `nomination_cand_a`. The pair isolates the nomination conjunct on rows the shared fixture already owns rather than on rows this file manufactures, which is what makes it a control on the real fixture rather than on a private one.
-- =====================================================================
SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        candidates
      WHERE
        id = test_id ('candidate_a')
    )::integer,
    1,
    'anon CAN see candidate_a -- project open, confirmed, terms accepted, and nominated'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        candidates
      WHERE
        id = test_id ('candidate_a2')
    )::integer,
    0,
    'anon CANNOT see candidate_a2 -- identical to candidate_a in every respect except that it has no nomination at all'
  );

-- =====================================================================
-- Section 10: the structural absences and the invariant, read from the applied database rather than from the schema file
--
-- These are the assertions 162-17 generalises into `lint-schema.mjs`; this file proves them for its own thirteen. Each count is floored or pinned so that a clean answer cannot come from an empty result set -- the way a structural assertion lies.
-- =====================================================================
SELECT
  reset_role ();

-- ⚠ THE ONE ASSERTION IN THIS FILE THAT HAS BEEN RE-POINTED, AND IT HAS NOW BEEN RE-POINTED TWICE. The prohibition on this file was lifted for this assertion alone, by 162-10 and again by D-36 (2026-09-17). Its original form pinned the TEXT of `anon_select_candidates` -- `qual LIKE '%project_open_for_voters%'`. V-6(A) made that unsatisfiable by moving the project conjunct INSIDE a `entity_is_anon_visible` composition, so 162-10 re-pointed it at the composition's body. D-36 then REMOVED that composition -- the nesting cost 271.9 ms anon against 39.4 for the direct calls -- which makes 162-10's form unsatisfiable by construction in its turn: there is no function left whose `pg_get_functiondef` could carry the term.
--
-- THE REPLACEMENT IS STRICTLY STRONGER THAN EITHER FORM IT REPLACES, which is the whole justification for touching this file a second time. Three ways stronger. (1) It is DERIVED from `pg_policies` -- every `TO anon` SELECT policy on the four entity tables -- rather than naming one policy or two, so a fifth entity table, or a renamed policy, is judged by it automatically instead of escaping it. (2) It requires each of those quals to name BOTH sub-rule helpers DIRECTLY, where the old form accepted a single delegating call, so a qual that kept the project term and quietly lost the nomination term now reddens. (3) It pins the POPULATION as well as the pass count -- `4/4`, not `4` -- so the clean answer cannot come from an empty result set, which is the way a structural assertion lies.
--
-- IT ALSO KEEPS THE NOMINATIONS HALF AND THE FUNCTION-BODY HALF. `anon_select_nominations` still names `project_open_for_voters` directly, and `nomination_entities_confirmed` -- which D-36 restored to its pre-162-10 four-arm body -- must still require BOTH helpers in its own definition, read from `pg_get_functiondef` and not from the schema file, so a term dropped from that function cannot hide behind a policy that merely calls it. That was the sharpest clause of the 162-10 form and it survives, pointed at the function that now holds the rule.
--
-- WHAT IT DELIBERATELY DOES NOT DO is assert that the eight entity SELECT quals are identical to each other. That is D-36's accepted cost and 162-17's commissioned guard, and writing half of it here, in a fenced file, by a different hand, is what the D-35 investigation stopped rather than do.
SELECT
  is (
    (
      SELECT
        count(*) FILTER (
          WHERE
            COALESCE(qual, '') LIKE '%project_open_for_voters%'
            AND COALESCE(qual, '') LIKE '%entity_has_confirmed_nomination%'
            AND COALESCE(qual, '') NOT LIKE '%published%'
            AND COALESCE(qual, '') NOT LIKE '%entity_is_anon_visible%'
        )::text || '/' || count(*)::text
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
        AND 'anon' = ANY (roles)
    ) || ' ' || (
      SELECT
        count(*) FILTER (
          WHERE
            COALESCE(qual, '') LIKE '%project_open_for_voters%'
            AND COALESCE(qual, '') NOT LIKE '%published%'
        )::text || '/' || count(*)::text
      FROM
        pg_policies
      WHERE
        schemaname = 'public'
        AND policyname = 'anon_select_nominations'
    ) || ' ' || (
      SELECT
        count(*)::text
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname IN ('public', 'private')
        AND p.proname = 'nomination_entities_confirmed'
        AND pg_get_functiondef(p.oid) LIKE '%project_open_for_voters%'
        AND pg_get_functiondef(p.oid) LIKE '%entity_has_confirmed_nomination%'
    ),
    '4/4 1/1 1',
    'all FOUR anon entity SELECT policies name BOTH public-visibility helpers directly and neither published nor the withdrawn composition; anon_select_nominations still reaches the project term directly; and nomination_entities_confirmed still requires both helpers in its own body, read from pg_get_functiondef so a term dropped from the function cannot hide behind a policy that merely calls it -- populations pinned, so a clean answer cannot come from an empty instrument'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        pg_policies
      WHERE
        schemaname = 'public'
        AND 'anon' = ANY (roles)
        AND cmd = 'SELECT'
        AND COALESCE(qual, '') LIKE '%published%'
    )::integer,
    0,
    'no TO anon SELECT policy in schema public mentions published -- D-11b, so 162-16 found nothing left to strip in the policy layer and deleted the columns alone'
  );

-- The regex is deliberately NOT the literal `FROM public.nominations`. `pg_get_expr` renders a policy predicate against the CURRENT search_path, so a genuine inline sub-select over either table renders SCHEMA-UNQUALIFIED and a literal match on the qualified spelling is a check that cannot fail -- measured, in a rolled-back transaction, against exactly the construction it is meant to catch.
SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        pg_policies
      WHERE
        schemaname = 'public'
        AND 'anon' = ANY (roles)
        AND COALESCE(qual, '') ~ 'FROM[[:space:]]+(public\.)?(nominations|projects)[[:space:]]'
    )::integer,
    0,
    'no anon policy holds an inline sub-select over nominations or projects -- those lookups live in the three helpers, and a policy that re-derives one is a plan away from the recursion this design exists to avoid'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        pg_policies
      WHERE
        schemaname = 'public'
        AND 'anon' = ANY (roles)
        AND cmd = 'SELECT'
    )::integer,
    13,
    'schema public carries exactly thirteen TO anon SELECT policies, so a fourteenth added later reddens here rather than slipping past the two absence assertions above by being new'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname IN ('public', 'private')
        AND p.proname IN (
          'project_open_for_voters',
          'entity_has_confirmed_nomination',
          'nomination_entities_confirmed'
        )
        AND p.prosecdef
        AND array_to_string(COALESCE(p.proconfig, '{}'), ',') LIKE '%search_path%'
    )::integer,
    3,
    'all three visibility helpers are SECURITY DEFINER with a pinned search_path -- a mutable search_path on a function that reads tables the caller cannot is a privilege-escalation primitive, and the count is pinned at three so an absent declaration cannot pass as a clean zero'
  );

-- The invariant the whole design rests on, asserted here because NOTHING ELSE IN THE TREE ASSERTS IT. Both numbers are in one assertion on purpose: a count of zero forced tables is equally true of a query that examined no tables at all, so the examined count is pinned beside it.
SELECT
  is (
    (
      SELECT
        count(*)::text || '/' || count(*) FILTER (
          WHERE
            c.relforcerowsecurity
        )::text
      FROM
        pg_class c
      WHERE
        c.relnamespace = 'public'::regnamespace
        AND c.relname IN (
          'projects',
          'nominations',
          'candidates',
          'organizations',
          'factions',
          'alliances'
        )
    ),
    '6/0',
    'six tables examined and none carries FORCE ROW LEVEL SECURITY -- a single ALTER TABLE on any of them reintroduces the policy recursion, and the failure would surface as a query-time error in thirteen policies rather than as a schema diff'
  );

SELECT
  *
FROM
  finish ();

ROLLBACK;
