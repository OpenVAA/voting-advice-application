-- 27-parent-nomination-queue.test.sql: the admin queue, and the two nominations nothing else distinguishes
--
-- THE CLAIM ABOUT THE SCHEMA IS MEASURED HERE. The free-text branch ("my party is not in the system yet") and the independent branch ("I am independent") are byte-identical in every column but the requested-parent key, so the admin queue keys off that key's presence, not off a status column. The identity is what makes the queue meaningful: the queue assertion below is discriminating precisely because NOTHING ELSE discriminates, and if some other column quietly came to differ, the queue could be keying off that instead and nobody would notice.
--
-- THE ONE COLUMN THAT MUST DIFFER, and why excluding it is not a weakening. Two nominations of the SAME candidate in the SAME contest with the SAME parent are forbidden by `nominations_entity_parent_contest_key` -- asserted by name in 26-uniqueness-keys.test.sql -- so the entity pointer is necessarily different between the two rows. It is excluded by name, with this reason, alongside the identity, the two timestamps and the custom-data column itself. Every other column is compared, and the column list is DERIVED from information_schema.columns at run time so a column added later cannot silently escape the comparison.
--
-- 23-nominations-write.test.sql ASSERTS THE CONFIRMATION GUARD on the candidate; this file adds the queue behaviour AROUND it. The refusal is matched by its stable message prefix, taken verbatim from the trigger source rather than invented, and it is widened to every child-nominee entity type the key admits.
--
-- Depends on: 00-helpers.test.sql (create_test_data, test_id, test_user_id, set_test_user,
--             test_seed_fixture_grants)
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (15);

SELECT
  create_test_data ();

SELECT
  test_seed_fixture_grants ();

-- =====================================================================
-- Two candidates, structurally interchangeable, created here
-- =====================================================================
-- Two rows of the same shape in the same project, so that the two nominations below differ in nothing the schema can express except the custom-data key.
INSERT INTO
  public.candidates (id, project_id, first_name, last_name, confirmed)
VALUES
  (
    'eeeeeeee-1111-0000-0000-000000000001',
    test_id ('project_a'),
    'Queue',
    'Requester',
    false
  ),
  (
    'eeeeeeee-1111-0000-0000-000000000002',
    test_id ('project_a'),
    'Queue',
    'Requester',
    false
  );

-- The two nominations. Identical in every column the schema carries, except the entity pointer (forced apart by the uniqueness key) and `custom_data`.
INSERT INTO
  public.nominations (
    id,
    project_id,
    candidate_id,
    parent_nomination_id,
    election_id,
    constituency_id,
    election_round,
    custom_data,
    confirmed,
    created_by
  )
VALUES
  (
    'eeeeeeee-2222-0000-0000-000000000001',
    test_id ('project_a'),
    'eeeeeeee-1111-0000-0000-000000000001',
    NULL,
    test_id ('election_a'),
    test_id ('constituency_a'),
    1,
    '{"requestedParentOrganization": "A party that is not in the system yet"}'::jsonb,
    false,
    NULL
  ),
  (
    'eeeeeeee-2222-0000-0000-000000000002',
    test_id ('project_a'),
    'eeeeeeee-1111-0000-0000-000000000002',
    NULL,
    test_id ('election_a'),
    test_id ('constituency_a'),
    1,
    NULL,
    false,
    NULL
  );

-- =====================================================================
-- Section 1: the two rows really are indistinguishable
-- =====================================================================
-- The column list is DERIVED, never written out. A hand-written list is a list that silently stops covering a column somebody adds, and every assertion after this one rests on this one.
CREATE TEMP VIEW m17_compared_columns AS
SELECT
  column_name
FROM
  information_schema.columns
WHERE
  table_schema = 'public'
  AND table_name = 'nominations'
  AND column_name NOT IN (
    'id', -- the row identity
    'created_at', -- a timestamp
    'updated_at', -- a timestamp
    'custom_data', -- the column under test
    'candidate_id' -- forced apart by nominations_entity_parent_contest_key; see the header
  );

SELECT
  cmp_ok (
    (
      SELECT
        count(*)::integer
      FROM
        m17_compared_columns
    ),
    '>',
    10,
    'the indistinguishability proof compares a DERIVED column list, and it carries more than ten columns'
  );

SELECT
  is_empty (
    $$
    WITH cols AS (SELECT column_name FROM m17_compared_columns),
    a AS (SELECT to_jsonb(n) j FROM public.nominations n WHERE n.id = 'eeeeeeee-2222-0000-0000-000000000001'),
    b AS (SELECT to_jsonb(n) j FROM public.nominations n WHERE n.id = 'eeeeeeee-2222-0000-0000-000000000002')
    SELECT cols.column_name
    FROM cols, a, b
    WHERE (a.j -> cols.column_name) IS DISTINCT FROM (b.j -> cols.column_name)
    $$,
    'the requested-parent row and the independent row are equal in every compared column'
  );

-- And the one column they DO differ in is the one the queue keys off.
SELECT
  ok (
    (
      SELECT
        jsonb_exists (custom_data, 'requestedParentOrganization')
      FROM
        public.nominations
      WHERE
        id = 'eeeeeeee-2222-0000-0000-000000000001'
    )
    AND NOT COALESCE(
      (
        SELECT
          jsonb_exists (custom_data, 'requestedParentOrganization')
        FROM
          public.nominations
        WHERE
          id = 'eeeeeeee-2222-0000-0000-000000000002'
      ),
      false
    ),
    'the requested-parent key is present on exactly one of the two rows'
  );

-- =====================================================================
-- Section 2: the queue, run as a project admin THROUGH THE REAL POLICIES
-- =====================================================================
-- Not as postgres. A queue query run as the owner bypasses row-level security and would pass against an estate in which no administrator could read the rows at all.
--
-- `jsonb_exists(custom_data, '<key>')` rather than the question-mark operator: the operator is a parameter placeholder in several of the clients that will later read these files, and the function form is unambiguous in all of them.
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          id::text,
          ','
          ORDER BY
            id
        )
      FROM
        public.nominations
      WHERE
        project_id = public.test_id ('project_a')
        AND jsonb_exists (custom_data, 'requestedParentOrganization')
    ),
    'eeeeeeee-2222-0000-0000-000000000001',
    'the admin queue returns exactly the requesting nomination and not the independent one, read through the real policies as a project admin'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        public.nominations
      WHERE
        id IN (
          'eeeeeeee-2222-0000-0000-000000000001',
          'eeeeeeee-2222-0000-0000-000000000002'
        )
    ),
    2,
    'non-vacuity: the project admin can read BOTH rows, so the queue filter is what selects one of them and not the policy'
  );

SELECT
  reset_role ();

-- =====================================================================
-- Section 3: the confirmation refusal, widened across the child-nominee entity types
-- =====================================================================
-- The guard: a row carrying the requested-parent key can never be confirmed, on either verb, because confirming it would publish as an INDEPENDENT a candidate who asked for a party. 23-nominations-write.test.sql proves it on the candidate. Every entity type the key admits is proved here, each with its paired opposite -- the SAME row with the key absent IS confirmed -- so the guard is shown to be the key's presence and not some other property of the row.
--
-- The message prefix is taken verbatim from `enforce_nomination_confirmation`'s source.
SELECT
  throws_like (
    $$UPDATE public.nominations SET confirmed = true WHERE id = 'eeeeeeee-2222-0000-0000-000000000001'$$,
    '%cannot be confirmed while custom_data carries "requestedParentOrganization"%',
    'confirmation refusal, CANDIDATE: a nomination carrying the requested-parent key is refused confirmation on UPDATE'
  );

SELECT
  lives_ok (
    $$UPDATE public.nominations SET confirmed = true WHERE id = 'eeeeeeee-2222-0000-0000-000000000002'$$,
    'confirmation refusal, CANDIDATE, paired opposite: the same row shape with the key ABSENT is confirmed'
  );

SELECT
  throws_like (
    $$UPDATE public.nominations SET custom_data = '{"requestedParentOrganization": "x"}'::jsonb, confirmed = true
      WHERE id = public.test_id('nomination_faction_a')$$,
    '%cannot be confirmed while custom_data carries "requestedParentOrganization"%',
    'confirmation refusal, FACTION: a faction nomination carrying the key is refused confirmation'
  );

SELECT
  lives_ok (
    $$UPDATE public.nominations SET confirmed = true WHERE id = public.test_id('nomination_faction_a')$$,
    'confirmation refusal, FACTION, paired opposite: the same row with no key is confirmed'
  );

SELECT
  throws_like (
    $$UPDATE public.nominations SET custom_data = '{"requestedParentOrganization": "x"}'::jsonb, confirmed = true
      WHERE id = public.test_id('nomination_org_a')$$,
    '%cannot be confirmed while custom_data carries "requestedParentOrganization"%',
    'confirmation refusal, ORGANIZATION: an organization nomination carrying the key is refused confirmation'
  );

SELECT
  lives_ok (
    $$UPDATE public.nominations SET confirmed = true WHERE id = public.test_id('nomination_org_a')$$,
    'confirmation refusal, ORGANIZATION, paired opposite: the same row with no key is confirmed'
  );

SELECT
  throws_like (
    $$UPDATE public.nominations SET custom_data = '{"requestedParentOrganization": "x"}'::jsonb, confirmed = true
      WHERE id = public.test_id('nomination_alliance_a')$$,
    '%cannot be confirmed while custom_data carries "requestedParentOrganization"%',
    'confirmation refusal, ALLIANCE: an alliance nomination carrying the key is refused confirmation'
  );

SELECT
  lives_ok (
    $$UPDATE public.nominations SET confirmed = true WHERE id = public.test_id('nomination_alliance_a')$$,
    'confirmation refusal, ALLIANCE, paired opposite: the same row with no key is confirmed'
  );

-- The guard is on INSERT as well as UPDATE -- "on either verb" is the rule's own wording, and a guard that only caught the update would let the row in already confirmed.
SELECT
  throws_like (
    $$INSERT INTO public.nominations (project_id, candidate_id, parent_nomination_id, election_id, constituency_id, election_round, custom_data, confirmed)
      VALUES (public.test_id('project_a'), public.test_id('candidate_a2'), NULL, public.test_id('election_a'), public.test_id('constituency_a'), 1,
              '{"requestedParentOrganization": "x"}'::jsonb, true)$$,
    '%cannot be confirmed while custom_data carries "requestedParentOrganization"%',
    'confirmation refusal, INSERT: a row arriving already confirmed with the key present is refused'
  );

SELECT
  lives_ok (
    $$INSERT INTO public.nominations (project_id, candidate_id, parent_nomination_id, election_id, constituency_id, election_round, custom_data, confirmed)
      VALUES (public.test_id('project_a'), public.test_id('candidate_a2'), NULL, public.test_id('election_a'), public.test_id('constituency_a'), 1,
              NULL, true)$$,
    'confirmation refusal, INSERT, paired opposite: the same row with no key arrives confirmed'
  );

SELECT
  *
FROM
  finish ();

ROLLBACK;
