-- 21-entity-organization.test.sql: the entity-to-organization relationship, stated once
--
-- The candidate-to-organization association was stated TWICE in this system: once as `candidates.organization_id`, once as the `parent_nomination_id` edge that `validate_nomination()` already enforces. 162-07b removes the first, and section 11.8 moves a REQUIRED organization onto `public.factions` in the same edit, because a faction with no organization is not a meaningful row. This file is the evidence for both halves.
--
-- EVERY PROPERTY HERE IS READ FROM THE CATALOGUE, NEVER FROM THE TEXT OF A SCHEMA FILE. A comment can claim `ON DELETE CASCADE`; only `pg_constraint.confdeltype` can prove it, and only `information_schema.columns` can prove that a declaration reached PostgreSQL rather than only reaching a file. The same rule governs the two RPC return shapes below, which are read from `pg_get_function_result` on the applied database.
--
-- THE ADJACENCY IS THE SHARPEST EDGE IN THIS FILE, AND SECTION 5 IS WHERE IT IS DISPOSED OF. Two different tables carry a column spelled `organization_id` -- `nominations` and, until this plan, `candidates` -- and BOTH appear in `get_nominations`'s return shape, the first as `organization_id` and the second as `entity_organization_id`. Dropping the wrong one satisfies every count assertion in this file while silently breaking the nomination mapper in the Supabase data provider. Assertion 14 is therefore a MUST-NOT-FIRE companion: it asserts the nominations key SURVIVES, and it is green both before and after the change by construction. Do not "fix" it into a red-before assertion; an assertion that is green in both states is exactly what a must-not-fire companion is.
--
-- SECTIONS 1 TO 6 ARE SELF-CONTAINED AND DELIBERATELY SO. They build their own account, project and two organizations rather than calling `create_test_data()`, because the fixture they need is four rows and because `create_test_data()` writes the candidates column this plan removes -- so depending on it would have coupled the schema-shape instrument to the very edit it was measuring, and the red run that proved this file is an instrument had to happen BEFORE that helper was corrected. Section 7 is the exception and says so where it stands: the email-variable pair needs the multi-tenant fixture, calls `create_test_data()` inside this same transaction, and is rolled back with everything else.
--
-- pgTAP SHIPS ITS OWN has_role(). It is a role-existence assertion returning text, and under this estate's `search_path = public, extensions` it SHADOWS ours, so an unqualified one-argument call fails with `function ok(text, unknown) does not exist` rather than as a clean failed assertion. This file calls no permission predicate, but the rule stands for anything added to it: qualify every call `public.has_role(...)`. 13-shim-parity.test.sql is the reference.
--
-- NO ASSERTION HERE MAY NAME `factions.organization_id` IN AN EAGERLY PARSED EXPRESSION. `is()` evaluates its arguments before it is called, so a direct read of a column that does not yet exist is a hard ERROR that aborts the whole file rather than a counted failure -- and a file that aborts cannot be observed red assertion by assertion. Column-dependent writes therefore go through `lives_ok`/`throws_ok`, whose subtransaction catches the error, and column-dependent reads are expressed as counts over `id` instead.
--
-- The declared assertion count below is explicit and deliberately so: a pgTAP file that asserts nothing exits 0 under no_plan, which is exactly the vacuous pass a schema-shape test must not be able to produce.
--
-- Depends on: 00-helpers.test.sql for the pgTAP extension it installs, and -- in section 7 ONLY -- for `create_test_data()`, `test_id()` and `test_user_id()`. Sections 1 to 6 call nothing from it.
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files in the same session
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (21);

-- =====================================================================
-- Fixtures: four rows, none of which names the column under test, so this block is safe to run against the schema both before and after the change.
-- =====================================================================
INSERT INTO
  public.accounts (id, name)
VALUES
  (
    'eeeeeeee-eeee-eeee-eeee-000000000001',
    'entity-organization fixture account'
  );

INSERT INTO
  public.projects (id, account_id, name)
VALUES
  (
    'eeeeeeee-eeee-eeee-eeee-000000000002',
    'eeeeeeee-eeee-eeee-eeee-000000000001',
    'entity-organization fixture project'
  );

INSERT INTO
  public.organizations (id, project_id, name)
VALUES
  (
    'eeeeeeee-eeee-eeee-eeee-000000000003',
    'eeeeeeee-eeee-eeee-eeee-000000000002',
    '{"en": "Fixture Organization One"}'::jsonb
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-000000000004',
    'eeeeeeee-eeee-eeee-eeee-000000000002',
    '{"en": "Fixture Organization Two"}'::jsonb
  );

-- =====================================================================
-- Section 1: the four catalogue properties of the new faction column
-- =====================================================================
SELECT
  has_column (
    'public',
    'factions',
    'organization_id',
    'factions declares an organization foreign key'
  );

SELECT
  col_type_is (
    'public',
    'factions',
    'organization_id',
    'uuid',
    'the faction organization key is a uuid'
  );

SELECT
  col_not_null (
    'public',
    'factions',
    'organization_id',
    'the faction organization key is NOT NULL, which is what forecloses ON DELETE SET NULL'
  );

SELECT
  is (
    (
      SELECT
        c.confrelid::regclass::text
      FROM
        pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
      WHERE
        t.relname = 'factions'
        AND c.contype = 'f'
        AND c.conkey = ARRAY[
          (
            SELECT
              attnum
            FROM
              pg_attribute
            WHERE
              attrelid = 'public.factions'::regclass
              AND attname = 'organization_id'
          )
        ]::smallint[]
    ),
    'organizations',
    'the faction organization key references public.organizations, read from pg_constraint rather than from the schema text'
  );

SELECT
  is (
    (
      SELECT
        c.confdeltype
      FROM
        pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
      WHERE
        t.relname = 'factions'
        AND c.contype = 'f'
        AND c.confrelid = 'public.organizations'::regclass
    ),
    'c'::"char",
    'the faction organization key cascades on delete -- NOT NULL forecloses SET NULL and RESTRICT would block deleting an organization that has factions'
  );

-- =====================================================================
-- Section 2: the candidates column is gone from the applied database
-- =====================================================================
SELECT
  hasnt_column (
    'public',
    'candidates',
    'organization_id',
    'candidates declares no organization foreign key -- the relationship is stated once, on the nomination edge'
  );

-- =====================================================================
-- Section 3: the NOT NULL rejection, and the paired allow case without which it would stay green against a table that rejects every insert
-- =====================================================================
SELECT
  throws_ok (
    $$INSERT INTO public.factions (project_id, name) VALUES ('eeeeeeee-eeee-eeee-eeee-000000000002', '{"en": "Orphan"}'::jsonb)$$,
    '23502',
    NULL,
    'a faction naming no organization is REJECTED with a not-null violation'
  );

SELECT
  lives_ok (
    $$INSERT INTO public.factions (id, project_id, organization_id, name) VALUES
      ('eeeeeeee-eeee-eeee-eeee-000000000005', 'eeeeeeee-eeee-eeee-eeee-000000000002', 'eeeeeeee-eeee-eeee-eeee-000000000003', '{"en": "Faction Of One"}'::jsonb),
      ('eeeeeeee-eeee-eeee-eeee-000000000006', 'eeeeeeee-eeee-eeee-eeee-000000000002', 'eeeeeeee-eeee-eeee-eeee-000000000004', '{"en": "Faction Of Two"}'::jsonb)$$,
    'a faction naming a real organization is ACCEPTED -- the paired allow case for the rejection above'
  );

-- =====================================================================
-- Section 4: the cascade, asserted in both directions by one composite so that an empty table cannot satisfy the deletion half on its own
-- =====================================================================
DELETE FROM public.organizations
WHERE
  id = 'eeeeeeee-eeee-eeee-eeee-000000000003';

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        public.factions
      WHERE
        id = 'eeeeeeee-eeee-eeee-eeee-000000000005'
    )::text || '/' || (
      SELECT
        count(*)
      FROM
        public.factions
      WHERE
        id = 'eeeeeeee-eeee-eeee-eeee-000000000006'
    )::text,
    '0/1',
    'deleting an organization deletes ITS factions and leaves every other organization''s alone -- both halves in one reading, because a count of zero on an empty table would satisfy the first half by itself'
  );

-- =====================================================================
-- Section 5: the two return shapes, and the must-not-fire companion for the identically-named column that SURVIVES
-- =====================================================================
SELECT
  is (
    (
      SELECT
        array_length(
          string_to_array(pg_get_function_result(p.oid), ','),
          1
        )
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'public'
        AND p.proname = 'get_nominations'
    ),
    31,
    'get_nominations declares 31 output columns -- exactly one fewer than the 32 recorded as the baseline'
  );

SELECT
  ok (
    (
      SELECT
        pg_get_function_result(p.oid) NOT LIKE '%entity_organization_id%'
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'public'
        AND p.proname = 'get_nominations'
    ),
    'get_nominations returns no candidate-organization output column'
  );

SELECT
  is (
    (
      SELECT
        array_length(
          string_to_array(pg_get_function_result(p.oid), ','),
          1
        )
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'public'
        AND p.proname = 'get_candidate_user_data'
    ),
    14,
    'get_candidate_user_data declares 14 output columns -- exactly one fewer than the 15 recorded as the baseline'
  );

SELECT
  ok (
    (
      SELECT
        pg_get_function_result(p.oid) NOT LIKE '%organization_id%'
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'public'
        AND p.proname = 'get_candidate_user_data'
    ),
    'get_candidate_user_data returns no organization output column'
  );

-- MUST-NOT-FIRE COMPANION. `get_nominations` projects TWO columns whose base column is spelled `organization_id`: the nominations foreign key, which stays, and the candidates projection aliased `entity_organization_id`, which goes. Dropping the wrong one would satisfy assertions 10 to 13 above while breaking every nomination the data provider maps. This assertion is green before the change and green after it, and that is the point of it.
SELECT
  ok (
    (
      SELECT
        pg_get_function_result(p.oid) LIKE '%organization_id uuid%'
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'public'
        AND p.proname = 'get_nominations'
    ),
    'get_nominations STILL returns the nominations organization foreign key -- the correct one of the two identically-named columns survived'
  );

-- =====================================================================
-- Section 6: the index moved with the column rather than being dropped on one table and forgotten on the other
-- =====================================================================
SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        pg_indexes
      WHERE
        schemaname = 'public'
        AND tablename = 'factions'
        AND indexname = 'idx_factions_organization_id'
    )::text || '/' || (
      SELECT
        count(*)
      FROM
        pg_indexes
      WHERE
        schemaname = 'public'
        AND tablename = 'candidates'
        AND indexname = 'idx_candidates_organization_id'
    )::text,
    '1/0',
    'the foreign-key index is on factions and no longer on candidates -- read as one composite so a run that dropped both would not satisfy the second half alone'
  );

-- =====================================================================
-- Section 7: the email helper's organization name, re-sourced through the nomination hierarchy
-- =====================================================================
-- TEST C. `resolve_email_variables` used to read the candidate's organization off the dropped column; it now reaches it through the parent nomination, on the `nominations` walk that branch already ran for the constituency and election names. The PAIR is what distinguishes "resolved through the hierarchy" from "hardcoded to always emit": candidate_a is nominated under an organization nomination and must still get the name, candidate_a2 is a member with NO nomination at all and must get none. Observed RED against the base SHA on the negative half with candidate_a2 emitting 'Org A' off the column; the positive half is green in both states, because its VALUE does not change even though its SOURCE does.
--
-- This section needs the multi-tenant fixture the rest of this file deliberately avoids, so it builds it here rather than at the top: `create_test_data()` is called inside this transaction and rolled back with everything else. The four fixture rows above are untouched by it, because they live in their own account and project.
SELECT
  create_test_data ();

-- 162-15 RE-POINTED THIS FUNCTION'S ENTITY-CONTEXT LOOKUP AT public.grants, AND THIS SECTION IS THE ONE PLACE IN THE ESTATE THAT REACHES IT WITHOUT set_test_user.
-- Every other caller of resolve_email_variables impersonates first, and set_test_user is where the fixture's authority rows are written; this section calls create_test_data() and then the function directly, so without the two lines below candidate_a would hold no grant row and both halves of TEST C would read an unauthorised identity. The impersonation is performed and immediately undone, purely for its write: what this section measures is the function's output as postgres, not any caller's view.
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        variables ->> 'organization.name'
      FROM
        public.resolve_email_variables (
          test_id ('project_a'),
          ARRAY[test_user_id ('candidate_a')],
          '',
          ''
        )
    ),
    'Org A',
    'TEST C positive: a candidate nominated under an organization nomination still resolves its organization name, now off the parent edge'
  );

SELECT
  ok (
    (
      SELECT
        NOT (variables ? 'organization.name')
      FROM
        public.resolve_email_variables (
          test_id ('project_a'),
          ARRAY[test_user_id ('candidate_a2')],
          '',
          ''
        )
    ),
    'TEST C negative: a candidate with no nomination resolves NO organization name -- the paired negative without which the positive would pass against a helper hardcoded to always emit'
  );

-- The email helper's RETURNS TABLE shape did NOT move, and this asserts it rather than assuming it: if it had, Phase 164's three artifacts would need an entry this plan did not budget for.
SELECT
  is (
    (
      SELECT
        array_length(
          string_to_array(pg_get_function_result(p.oid), ','),
          1
        )
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'public'
        AND p.proname = 'resolve_email_variables'
    ),
    4,
    'resolve_email_variables still declares 4 output columns -- its return shape was re-sourced, not reshaped'
  );

-- =====================================================================
-- WR-08: get_candidate_user_data answers for ONE project, named by the caller
--
-- 162-REVIEW WR-08: an identity may hold candidate rows in several projects, and the function used to end `LIMIT 1` with no project term and no ORDER BY, so such a user got an arbitrary row. candidate_a is given a second candidate row in project B, with a grant on it, so BOTH rows are visible to them through RLS -- the project argument is then the only thing that can pick one.
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  reset_role ();

INSERT INTO
  candidates (
    id,
    project_id,
    first_name,
    last_name,
    auth_user_id
  )
VALUES
  (
    '21212121-2121-2121-2121-0000000000b1'::uuid,
    test_id ('project_b'),
    'Alice',
    'InB',
    test_user_id ('candidate_a')
  );

INSERT INTO
  grants (user_id, scope, target_type, target_id, role)
VALUES
  (
    test_user_id ('candidate_a'),
    'entity',
    'candidate',
    '21212121-2121-2121-2121-0000000000b1'::uuid,
    'editor'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    '[]'::jsonb
  );

SELECT
  is (
    (
      SELECT
        string_agg(id::text, ',')
      FROM
        get_candidate_user_data (test_id ('project_a'))
    ),
    test_id ('candidate_a')::text,
    'WR-08: asked for project A, a two-project identity gets exactly its project A row'
  );

SELECT
  is (
    (
      SELECT
        string_agg(id::text, ',')
      FROM
        get_candidate_user_data (test_id ('project_b'))
    ),
    '21212121-2121-2121-2121-0000000000b1',
    'WR-08: asked for project B, the same identity gets exactly its project B row'
  );

SELECT
  throws_ok (
    $$SELECT count(*) FROM get_candidate_user_data('candidate'::public.entity_type)$$,
    '42883',
    NULL,
    'WR-08: get_candidate_user_data without a project raises undefined_function, so p_project_id carries no DEFAULT'
  );

SELECT
  reset_role ();

SELECT
  *
FROM
  finish ();

ROLLBACK;
