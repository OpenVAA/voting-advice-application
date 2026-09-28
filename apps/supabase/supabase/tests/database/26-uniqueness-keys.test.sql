-- 26-uniqueness-keys.test.sql: both of the phase's uniqueness keys, BY NAME and in BOTH directions
--
-- 162-03's RECORDED SEAM, closed here. That plan names all three of its constraints explicitly in source and records, in its own flagged assumptions, that NOTHING permanently guards them by name until 162-17.
-- A renamed constraint passes a catalogue existence check and breaks every consumer that matched its message, which is why every rejection below is a `throws_ok` against the constraint's OWN NAME, following the `nominations_election_round_check` precedent whose source comment states that being named is what gives a throws_ok a handle.
--
-- D-24, AND WHY THE THREE NULL-BEARING SCOPES ARE ASSERTED ONE BY ONE. `UNIQUE NULLS NOT DISTINCT` is the phase-wide rule because a plain UNIQUE enforces NOTHING on a row with a NULL keyed column: two byte-identical global-scope grants differ in no column that a plain key can compare, and this tree was MEASURED admitting exactly that on the retired role table. Three of the four grant scopes carry a NULL `target_type`, and one carries a NULL `target_id` as well, so those three are the whole reason the rule exists and each is asserted on its own rather than folded into one case.
--
-- BOTH DIRECTIONS, ALWAYS. A suite that only checks rejection stays green when somebody later "simplifies" a key by dropping a column from it -- the key still rejects the duplicates it used to reject, and silently starts rejecting rows it should admit. Control K2 plants exactly that and the admitting assertions are what redden.
--
-- 162-12 ESTABLISHED THE NOMINATION KEY ON THE CANDIDATE; this file is the POPULATION. That plan's SUMMARY records the split in those words, so nothing here re-establishes the property: it widens it to all four entity types the key admits, including the NULL-parent case, which is the case default NULLS-DISTINCT semantics admits silently.
--
-- Depends on: 00-helpers.test.sql (create_test_data, test_id, test_user_id)
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (31);

SELECT
  create_test_data ();

-- =====================================================================
-- Section 1: the grant key -- REJECTING, at each of the four scopes
-- =====================================================================
-- `grants_user_scope_target_role_key` is UNIQUE NULLS NOT DISTINCT (user_id, scope, target_type, target_id, role). Names taken from `162-03-SUMMARY.md` and re-read off pg_constraint below, never guessed.
SELECT
  lives_ok (
    $$INSERT INTO public.grants (user_id, scope, target_type, target_id, role)
      VALUES (public.test_user_id('super_admin'), 'global', NULL, NULL, 'admin')$$,
    'grant key: the first global-scope row is accepted'
  );

SELECT
  throws_ok (
    $$INSERT INTO public.grants (user_id, scope, target_type, target_id, role)
      VALUES (public.test_user_id('super_admin'), 'global', NULL, NULL, 'admin')$$,
    '23505',
    NULL,
    'grant key: a byte-identical GLOBAL-scope duplicate is rejected -- both target_type and target_id are NULL here, so a plain UNIQUE would admit it'
  );

SELECT
  lives_ok (
    $$INSERT INTO public.grants (user_id, scope, target_type, target_id, role)
      VALUES (public.test_user_id('account_admin_a'), 'account', NULL, '11111111-1111-1111-1111-111111111111', 'admin')$$,
    'grant key: the first account-scope row is accepted'
  );

SELECT
  throws_ok (
    $$INSERT INTO public.grants (user_id, scope, target_type, target_id, role)
      VALUES (public.test_user_id('account_admin_a'), 'account', NULL, '11111111-1111-1111-1111-111111111111', 'admin')$$,
    '23505',
    NULL,
    'grant key: a byte-identical ACCOUNT-scope duplicate is rejected -- target_type is NULL here'
  );

SELECT
  lives_ok (
    $$INSERT INTO public.grants (user_id, scope, target_type, target_id, role)
      VALUES (public.test_user_id('admin_a'), 'project', NULL, public.test_id('project_a'), 'admin')$$,
    'grant key: the first project-scope row is accepted'
  );

SELECT
  throws_ok (
    $$INSERT INTO public.grants (user_id, scope, target_type, target_id, role)
      VALUES (public.test_user_id('admin_a'), 'project', NULL, public.test_id('project_a'), 'admin')$$,
    '23505',
    NULL,
    'grant key: a byte-identical PROJECT-scope duplicate is rejected -- target_type is NULL here'
  );

SELECT
  lives_ok (
    $$INSERT INTO public.grants (user_id, scope, target_type, target_id, role)
      VALUES (public.test_user_id('candidate_a'), 'entity', 'candidate', public.test_id('candidate_a'), 'editor')$$,
    'grant key: the first entity-scope row is accepted'
  );

SELECT
  throws_ok (
    $$INSERT INTO public.grants (user_id, scope, target_type, target_id, role)
      VALUES (public.test_user_id('candidate_a'), 'entity', 'candidate', public.test_id('candidate_a'), 'editor')$$,
    '23505',
    NULL,
    'grant key: a byte-identical ENTITY-scope duplicate is rejected -- the one scope carrying no NULL in the key'
  );

-- =====================================================================
-- Section 2: the grant key -- ADMITTING
-- =====================================================================
-- The key SEPARATES as well as rejects. Two grants differing only in `role` at the same scope and target are both legal: an identity may hold admin and editor on one project.
SELECT
  lives_ok (
    $$INSERT INTO public.grants (user_id, scope, target_type, target_id, role)
      VALUES (public.test_user_id('admin_b'), 'project', NULL, public.test_id('project_b'), 'editor')$$,
    'grant key: a second grant differing ONLY in role is admitted at the same scope and target'
  );

-- =====================================================================
-- Section 3: the grant key's SHAPE, read from pg_index
-- =====================================================================
-- A key that keeps its name and loses its NULLS clause looks like a guarantee in the schema, in review and in the diff, and enforces nothing on three of the four scopes. The catalogue is the only place that distinguishes them.
SELECT
  is (
    (
      SELECT
        i.indnullsnotdistinct
      FROM
        pg_index i
        JOIN pg_class c ON c.oid = i.indexrelid
      WHERE
        c.relname = 'grants_user_scope_target_role_key'
    ),
    true,
    'grant key shape: grants_user_scope_target_role_key is UNIQUE NULLS NOT DISTINCT, read from pg_index'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          a.attname,
          ','
          ORDER BY
            x.n
        )
      FROM
        pg_index i
        JOIN pg_class c ON c.oid = i.indexrelid
        CROSS JOIN LATERAL unnest(i.indkey) WITH ORDINALITY AS x (attnum, n)
        JOIN pg_attribute a ON a.attrelid = i.indrelid
        AND a.attnum = x.attnum
      WHERE
        c.relname = 'grants_user_scope_target_role_key'
    ),
    'user_id,scope,target_type,target_id,role',
    'grant key shape: the column list is the five section 3.1 columns, in order, read from pg_index'
  );

-- =====================================================================
-- Section 4: the grant entity-scope CHECK, BOTH WAYS
-- =====================================================================
-- `grants_entity_scope_target_type_check` is CHECK ((target_type IS NOT NULL) = (scope = 'entity')). Two violating shapes and two legal ones, so the CHECK is shown to separate rather than merely to reject.
SELECT
  throws_ok (
    $$INSERT INTO public.grants (user_id, scope, target_type, target_id, role)
      VALUES (public.test_user_id('candidate_b'), 'entity', NULL, public.test_id('candidate_b'), 'editor')$$,
    '23514',
    NULL,
    'grant entity CHECK: an entity-scope row with a NULL target_type is rejected'
  );

SELECT
  throws_ok (
    $$INSERT INTO public.grants (user_id, scope, target_type, target_id, role)
      VALUES (public.test_user_id('candidate_b'), 'project', 'candidate', public.test_id('project_a'), 'editor')$$,
    '23514',
    NULL,
    'grant entity CHECK: a project-scope row carrying a target_type is rejected'
  );

SELECT
  lives_ok (
    $$INSERT INTO public.grants (user_id, scope, target_type, target_id, role)
      VALUES (public.test_user_id('candidate_b'), 'entity', 'candidate', public.test_id('candidate_b'), 'editor')$$,
    'grant entity CHECK: an entity-scope row carrying a target_type is admitted'
  );

SELECT
  lives_ok (
    $$INSERT INTO public.grants (user_id, scope, target_type, target_id, role)
      VALUES (public.test_user_id('candidate_a2'), 'project', NULL, public.test_id('project_a'), 'editor')$$,
    'grant entity CHECK: a project-scope row with a NULL target_type is admitted'
  );

-- The constraint names this file asserts against EXIST. An existence check alone would be worthless -- that is why every rejection above is a throws_ok -- but a throws_ok against a name that has gone would pass on whichever constraint happened to fire, so the names are pinned here as well.
SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        pg_constraint
      WHERE
        conname IN (
          'grants_user_scope_target_role_key',
          'grants_entity_scope_target_type_check',
          'nominations_entity_parent_contest_key'
        )
    ),
    3,
    'all three constraint names this file asserts against exist in pg_constraint'
  );

-- =====================================================================
-- Section 5: the nomination key, all four entity types, both directions
-- =====================================================================
-- `nominations_entity_parent_contest_key` is UNIQUE NULLS NOT DISTINCT over the four entity columns, the parent, the election, the constituency and the round. 162-12 established it on the candidate; the assertions below are the population.
--
-- `validate_nomination()` CONSTRAINS WHICH SHAPES ARE LEGAL AT ALL, and the cases below are chosen to sit inside those rules rather than to fight them: an alliance nomination may carry no parent, an organization nomination's parent must be an alliance nomination, a faction nomination's parent must be the nomination of its OWN organization, and a candidate nomination's parent must be an organization or faction nomination. A "both directions" assertion written outside those rules would measure the validator, not the key.
--
-- Fixture contest: election_a / constituency_a, round 1. org_a's nomination (no parent) is the parent of candidate_a's and faction_a's; alliance_a's nomination has no parent.
-- ----- CANDIDATE -----
SELECT
  throws_ok (
    $$INSERT INTO public.nominations (project_id, candidate_id, parent_nomination_id, election_id, constituency_id, election_round)
      VALUES (public.test_id('project_a'), public.test_id('candidate_a'), public.test_id('nomination_org_a'), public.test_id('election_a'), public.test_id('constituency_a'), 1)$$,
    '23505',
    NULL,
    'nomination key: a duplicate CANDIDATE nomination in the same contest under the same parent is rejected'
  );

SELECT
  lives_ok (
    $$INSERT INTO public.nominations (project_id, candidate_id, parent_nomination_id, election_id, constituency_id, election_round)
      VALUES (public.test_id('project_a'), public.test_id('candidate_a'), public.test_id('nomination_faction_a'), public.test_id('election_a'), public.test_id('constituency_a'), 1)$$,
    'nomination key: the same CANDIDATE in the same contest under a DIFFERENT parent is admitted -- this is what the parent column is in the key for'
  );

SELECT
  lives_ok (
    $$INSERT INTO public.nominations (project_id, candidate_id, parent_nomination_id, election_id, constituency_id, election_round)
      VALUES (public.test_id('project_a'), public.test_id('candidate_a'), NULL, public.test_id('election_a'), public.test_id('constituency_a'), 1)$$,
    'nomination key, NULL parent: the first independent CANDIDATE nomination in the contest is admitted'
  );

SELECT
  throws_ok (
    $$INSERT INTO public.nominations (project_id, candidate_id, parent_nomination_id, election_id, constituency_id, election_round)
      VALUES (public.test_id('project_a'), public.test_id('candidate_a'), NULL, public.test_id('election_a'), public.test_id('constituency_a'), 1)$$,
    '23505',
    NULL,
    'nomination key, NULL parent: a SECOND independent CANDIDATE nomination collides -- the case default NULLS-DISTINCT semantics admits silently'
  );

-- ----- ORGANIZATION -----
SELECT
  throws_ok (
    $$INSERT INTO public.nominations (project_id, organization_id, parent_nomination_id, election_id, constituency_id, election_round)
      VALUES (public.test_id('project_a'), public.test_id('org_a'), NULL, public.test_id('election_a'), public.test_id('constituency_a'), 1)$$,
    '23505',
    NULL,
    'nomination key, NULL parent: a duplicate top-level ORGANIZATION nomination collides'
  );

SELECT
  lives_ok (
    $$INSERT INTO public.nominations (id, project_id, organization_id, parent_nomination_id, election_id, constituency_id, election_round)
      VALUES ('eeeeeeee-0000-0000-0000-000000000001', public.test_id('project_a'), public.test_id('org_a'), public.test_id('nomination_alliance_a'), public.test_id('election_a'), public.test_id('constituency_a'), 1)$$,
    'nomination key: the same ORGANIZATION in the same contest under an alliance parent is admitted beside its top-level row'
  );

-- ----- FACTION -----
SELECT
  throws_ok (
    $$INSERT INTO public.nominations (project_id, faction_id, parent_nomination_id, election_id, constituency_id, election_round)
      VALUES (public.test_id('project_a'), public.test_id('faction_a'), public.test_id('nomination_org_a'), public.test_id('election_a'), public.test_id('constituency_a'), 1)$$,
    '23505',
    NULL,
    'nomination key: a duplicate FACTION nomination in the same contest under the same parent is rejected'
  );

SELECT
  lives_ok (
    $$INSERT INTO public.nominations (project_id, faction_id, parent_nomination_id, election_id, constituency_id, election_round)
      VALUES (public.test_id('project_a'), public.test_id('faction_a'), 'eeeeeeee-0000-0000-0000-000000000001', public.test_id('election_a'), public.test_id('constituency_a'), 1)$$,
    'nomination key: the same FACTION in the same contest under a DIFFERENT nomination of its OWN organization is admitted'
  );

-- The faction NULL-parent case is structurally excluded rather than key-excluded, and that is asserted here rather than assumed: the key would admit it and validate_nomination refuses it first.
SELECT
  throws_like (
    $$INSERT INTO public.nominations (project_id, faction_id, parent_nomination_id, election_id, constituency_id, election_round)
      VALUES (public.test_id('project_a'), public.test_id('faction_a'), NULL, public.test_id('election_a'), public.test_id('constituency_a'), 1)$$,
    '%Faction nominations must have a parent organization nomination%',
    'nomination key, NULL parent: the FACTION case is excluded by validate_nomination before the key sees it, which is why this type has no NULL-parent key assertion'
  );

-- ----- ALLIANCE -----
SELECT
  throws_ok (
    $$INSERT INTO public.nominations (project_id, alliance_id, parent_nomination_id, election_id, constituency_id, election_round)
      VALUES (public.test_id('project_a'), public.test_id('alliance_a'), NULL, public.test_id('election_a'), public.test_id('constituency_a'), 1)$$,
    '23505',
    NULL,
    'nomination key, NULL parent: a duplicate top-level ALLIANCE nomination collides'
  );

SELECT
  lives_ok (
    $$INSERT INTO public.nominations (project_id, alliance_id, parent_nomination_id, election_id, constituency_id, election_round)
      VALUES (public.test_id('project_a'), public.test_id('alliance_a'), NULL, public.test_id('election_a'), public.test_id('constituency_a'), 2)$$,
    'nomination key: the same ALLIANCE in the same election and constituency at a DIFFERENT ROUND is admitted -- election_round is in the key'
  );

SELECT
  throws_ok (
    $$INSERT INTO public.nominations (project_id, alliance_id, parent_nomination_id, election_id, constituency_id, election_round)
      VALUES (public.test_id('project_a'), public.test_id('alliance_a'), NULL, public.test_id('election_a'), public.test_id('constituency_a'), 2)$$,
    '23505',
    NULL,
    'nomination key, NULL parent: the round-2 ALLIANCE nomination is itself unique-keyed'
  );

-- =====================================================================
-- Section 6: the nomination key's SHAPE, read from pg_index
-- =====================================================================
-- Section 11.7's own reason for including the parent column, asserted from the catalogue so a later "simplification" that drops it reddens here as well as in 162-12.
SELECT
  is (
    (
      SELECT
        i.indnullsnotdistinct
      FROM
        pg_index i
        JOIN pg_class c ON c.oid = i.indexrelid
      WHERE
        c.relname = 'nominations_entity_parent_contest_key'
    ),
    true,
    'nomination key shape: nominations_entity_parent_contest_key is UNIQUE NULLS NOT DISTINCT, read from pg_index'
  );

SELECT
  ok (
    (
      SELECT
        'parent_nomination_id' = ANY (array_agg(a.attname))
      FROM
        pg_index i
        JOIN pg_class c ON c.oid = i.indexrelid
        CROSS JOIN LATERAL unnest(i.indkey) WITH ORDINALITY AS x (attnum, n)
        JOIN pg_attribute a ON a.attrelid = i.indrelid
        AND a.attnum = x.attnum
      WHERE
        c.relname = 'nominations_entity_parent_contest_key'
    ),
    'nomination key shape: parent_nomination_id is IN the key column list, read from pg_index'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        pg_index i
        JOIN pg_class c ON c.oid = i.indexrelid
        CROSS JOIN LATERAL unnest(i.indkey) WITH ORDINALITY AS x (attnum, n)
        JOIN pg_attribute a ON a.attrelid = i.indrelid
        AND a.attnum = x.attnum
      WHERE
        c.relname = 'nominations_entity_parent_contest_key'
    ),
    8,
    'nomination key shape: the key carries exactly eight columns'
  );

SELECT
  *
FROM
  finish ();

ROLLBACK;
