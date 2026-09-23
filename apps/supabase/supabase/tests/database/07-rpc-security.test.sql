-- 07-rpc-security.test.sql: RPC function security tests
--
-- Verifies security properties of bulk_import, bulk_delete, and resolve_email_variables:
--   - bulk_import/bulk_delete are SECURITY INVOKER (RLS applies to caller)
--   - Candidate cannot insert/delete project data (RLS blocks)
--   - resolve_email_variables is SECURITY DEFINER (can read auth.users)
--   - resolve_email_variables is executable by service_role only (anon and authenticated refused, CR-01)
--   - resolve_email_variables resolves entity variables only for the project it was asked for, and refuses the call outright when the project is omitted
--   - get_nominations partitions its result by the required p_project_id rather than merely filtering it, including when two projects share an external_id, and refuses the call outright when the project is omitted
--   - get_questions does the same on both halves of its jsonb payload, categories and questions alike
--
-- Note: bulk_import has a pre-existing ON CONFLICT issue with partial unique indexes.
-- The RPC security tests verify the SECURITY INVOKER/DEFINER model and RLS enforcement by testing the underlying operations that the RPC functions invoke.
--
-- Depends on: 00-helpers.test.sql (set_test_user, create_test_data, test_id, etc.)
--             016-bulk-operations.sql (bulk_import, bulk_delete) 017-email-helpers.sql (resolve_email_variables)
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (39);

-- Create test fixture data
SELECT
  create_test_data ();

-- =====================================================================
-- Section 1: bulk_import is SECURITY INVOKER
-- =====================================================================
SELECT
  ok (
    NOT (
      SELECT
        prosecdef
      FROM
        pg_proc
      WHERE
        proname = 'bulk_import'
    ),
    'bulk_import is SECURITY INVOKER (not DEFINER)'
  );

-- =====================================================================
-- Section 2: bulk_delete is SECURITY INVOKER
-- =====================================================================
SELECT
  ok (
    NOT (
      SELECT
        prosecdef
      FROM
        pg_proc
      WHERE
        proname = 'bulk_delete'
    ),
    'bulk_delete is SECURITY INVOKER (not DEFINER)'
  );

-- =====================================================================
-- Section 3: Candidate cannot INSERT elections (SECURITY INVOKER means RLS applies) This tests the core security model: even though bulk_import calls INSERT, the authenticated candidate's RLS policies block the operation.
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO elections (id, project_id, name, external_id) VALUES (gen_random_uuid(), '%s', '{"en": "Hacked"}'::jsonb, 'hack-1')$$,
      test_id ('project_a')
    ),
    NULL,
    NULL,
    'Candidate cannot INSERT elections directly (RLS blocks -- SECURITY INVOKER basis)'
  );

-- =====================================================================
-- Section 4: Candidate cannot DELETE elections (SECURITY INVOKER basis)
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

-- The DELETE silently affects 0 rows due to RLS (no matching rows visible)
SELECT
  lives_ok (
    format(
      $$DELETE FROM elections WHERE project_id = '%s'$$,
      test_id ('project_a')
    ),
    'Candidate DELETE on elections does not raise error (RLS filters to 0 rows)'
  );

-- Verify elections still exist (RLS prevented deletion)
SELECT
  reset_role ();

SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        elections
      WHERE
        project_id = test_id ('project_a')
    )::integer >= 1,
    'Election still exists after candidate delete attempt (SECURITY INVOKER protects)'
  );

-- =====================================================================
-- Section 5: Admin can DELETE app_settings in own project (app_settings has no storage cleanup trigger, suitable for admin DELETE test)
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    test_user_grants ('admin_a')
  );

-- Delete the existing app_settings record created by create_test_data()
SELECT
  lives_ok (
    format(
      $$DELETE FROM app_settings WHERE id = '%s'$$,
      test_id ('app_settings_a')
    ),
    'admin_a can DELETE app_settings in own project (admin RLS allows)'
  );

-- Verify it was actually deleted
SELECT
  reset_role ();

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
    0,
    'app_settings record was actually deleted by admin'
  );

-- =====================================================================
-- Section 6: resolve_email_variables is SECURITY DEFINER
-- =====================================================================
SELECT
  ok (
    (
      SELECT
        prosecdef
      FROM
        pg_proc
      WHERE
        proname = 'resolve_email_variables'
    ),
    'resolve_email_variables is SECURITY DEFINER (can read auth.users)'
  );

-- =====================================================================
-- Section 7: resolve_email_variables is callable by service_role and by nothing else
--
-- 162-REVIEW CR-01: the function reads auth.users under owner rights and carries no authority check of its own, so EXECUTE for anon or authenticated let either read any user's email address. Its only caller is the send-email Edge Function's service-role client. The two denials are asserted against an admin -- the caller most plausibly still entitled -- and against anon; the positive assertions below then run as service_role, which is the role that must keep working.
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    test_user_grants ('admin_a')
  );

SELECT
  throws_ok (
    $$SELECT count(*) FROM resolve_email_variables('00000000-0000-0000-0000-000000000001'::uuid, ARRAY['00000000-0000-0000-0000-000000000010'::uuid])$$,
    '42501',
    NULL,
    'resolve_email_variables is NOT executable by an authenticated caller, even a project admin (CR-01)'
  );

SELECT
  set_test_user ('anon');

SELECT
  throws_ok (
    $$SELECT count(*) FROM resolve_email_variables('00000000-0000-0000-0000-000000000001'::uuid, ARRAY['00000000-0000-0000-0000-000000000010'::uuid])$$,
    '42501',
    NULL,
    'resolve_email_variables is NOT executable by anon (CR-01)'
  );

SELECT
  reset_role ();

SELECT
  set_config('role', 'service_role', true);

SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        resolve_email_variables (
          test_id ('project_a'),
          ARRAY[test_user_id ('candidate_a')]
        )
    )::integer = 1,
    'resolve_email_variables returns data for candidate_a user (SECURITY DEFINER reads auth.users)'
  );

-- =====================================================================
-- Section 8: resolve_email_variables cannot cross a project boundary
--
-- This function is SECURITY DEFINER and reads three project-scoped tables (candidates, organizations, nominations) for a caller-supplied list of user ids, so its own predicates are the only scoping there is: row-level security does not run for it and the only caller reaches it through a service-role client that bypasses RLS anyway.
-- Positive control first, in section 9's shape, and for the same reason: an empty variables object for the other project would hold identically with and without a project predicate, so the assertion that the SAME user resolves its candidate name for its OWN project is what makes the zero below a measurement rather than an artefact of a fixture that resolves nothing at all.
-- Since 162-REVIEW WR-02 the recipient itself is project-bounded as well: a user is returned only when they hold a grant resolving to the requested project, so the cross-project call returns no row rather than a recipient with an empty variables object.
-- =====================================================================
SELECT
  ok (
    (
      SELECT
        r.variables ? 'candidate.first_name'
      FROM
        resolve_email_variables (
          test_id ('project_a'),
          ARRAY[test_user_id ('candidate_a')]
        ) r
    ),
    'resolve_email_variables asked for project A resolves the candidate variables of project A''s own candidate (control for the project B zero below)'
  );

-- 162-REVIEW WR-02: the RECIPIENT set is bounded to the project too. candidate_a holds no grant that resolves to project B, so asked for project B the function returns no row for them at all -- the email address is no longer readable across tenants through send-email's dry run.
SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        resolve_email_variables (
          test_id ('project_b'),
          ARRAY[test_user_id ('candidate_a')]
        )
    )::integer,
    0,
    'resolve_email_variables asked for project B returns NO row for a user whose only grant is in project A (WR-02)'
  );

-- The same bound for an admin of the OTHER tenant: admin_b administers project B and is not a recipient of project A.
SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        resolve_email_variables (
          test_id ('project_a'),
          ARRAY[test_user_id ('admin_b'), test_user_id ('candidate_a')]
        )
    )::integer,
    1,
    'resolve_email_variables asked for project A returns project A''s candidate and NOT project B''s admin (WR-02)'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        resolve_email_variables (
          test_id ('project_b'),
          ARRAY[test_user_id ('candidate_a')]
        ) r
      WHERE
        r.variables ? 'candidate.first_name'
        OR r.variables ? 'organization.name'
        OR r.variables ? 'nomination.constituency.name'
        OR r.variables ? 'nomination.election.name'
    )::integer,
    0,
    'resolve_email_variables asked for project B resolves no entity variable for a user whose candidate row belongs to project A'
  );

-- The parameter is genuinely required, not defaulted: with the user-id array alone there is no such function to call.
SELECT
  throws_ok (
    $$SELECT count(*) FROM resolve_email_variables(ARRAY['cccccccc-cccc-cccc-cccc-000000000003'::uuid])$$,
    '42883',
    NULL,
    'resolve_email_variables with the user ids alone raises undefined_function, so p_project_id carries no DEFAULT'
  );

-- =====================================================================
-- Section 8b: the two branches sections 6-8 never enter
--
-- 162-15 re-pointed this function's entity-context lookup from the retired role table at public.grants. The five assertions above exercise exactly ONE path through it -- a candidate-scoped identity, asked for its own project and for the other one -- so the organization arm and the no-entity-authority arm were both unexercised and a rewrite that broke either would have shipped green. Both are asserted here rather than left to the before/after output capture, because that capture lives in a plan's temp directory and these live in the estate.
--
-- The organization assertion is the one with a control, and NOT the control 162-15's plan text prescribed. That text called for a variant whose candidate-before-organization preference order is reversed; measured, that reversal reddens NOTHING, because no identity in the seed or in the fixture holds both a candidate-kind and an organization-kind entity grant, so the order arbitrates an empty population. The control actually run is the failure the rewrite could really produce: the entity-kind filter narrowed from ('candidate','organization') to ('candidate'). Under it this assertion is the ONE assertion in the file that reddens -- 32 ok, 1 not ok -- so it discriminates on the population it is about.
-- =====================================================================
SELECT
  ok (
    (
      SELECT
        r.variables ? 'organization.name'
      FROM
        resolve_email_variables (
          test_id ('project_a'),
          ARRAY[test_user_id ('organization_a')]
        ) r
    ),
    'resolve_email_variables resolves organization.name for an organization-scoped grantee asked for its own project'
  );

-- An identity holding admin authority and no ENTITY-scope grant at all: the recipient row is still returned, with an empty variables object, rather than raising or being dropped from the result set.
SELECT
  is (
    (
      SELECT
        r.variables::text
      FROM
        resolve_email_variables (
          test_id ('project_a'),
          ARRAY[test_user_id ('admin_a')]
        ) r
    ),
    '{}',
    'resolve_email_variables returns the recipient row with an empty variables object for an identity holding no entity-scope grant'
  );

-- =====================================================================
-- Section 8c: the SECURITY DEFINER surface PostgREST publishes (162-REVIEW WR-01)
--
-- Every SECURITY DEFINER function in `public` that an API role can EXECUTE is an `/rest/v1/rpc/<name>` endpoint that runs with owner rights. WR-01 found ten policy-only hierarchy and visibility hops there, each a cross-tenant oracle; they now live in `private`, which PostgREST does not expose. These censuses pin what is left, so a new definer function in `public` reddens here and has to be added on purpose. Trigger functions are excluded (they cannot be called as RPCs) and so are the `test_*` fixtures 00-helpers.test.sql installs.
-- =====================================================================
SELECT
  is (
    (
      SELECT
        string_agg(p.proname, ',' ORDER BY p.proname)
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'public'
        AND p.prosecdef
        AND p.prorettype <> 'trigger'::regtype
        AND p.proname NOT LIKE 'test\_%'
        AND has_function_privilege('anon', p.oid, 'EXECUTE')
    ),
    'project_open_for_voters,storage_path_can,storage_path_is_public,user_can,user_has_account_grant',
    'WR-01 census: the SECURITY DEFINER functions in public that anon can execute are exactly the five allow-listed ones'
  );

SELECT
  is (
    (
      SELECT
        string_agg(p.proname, ',' ORDER BY p.proname)
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'public'
        AND p.prosecdef
        AND p.prorettype <> 'trigger'::regtype
        AND p.proname NOT LIKE 'test\_%'
        AND has_function_privilege('authenticated', p.oid, 'EXECUTE')
    ),
    'get_entity_basic_data,project_open_for_voters,storage_path_can,storage_path_is_public,user_can,user_has_account_grant',
    'WR-01 census: the SECURITY DEFINER functions in public that authenticated can execute are the same five plus get_entity_basic_data'
  );

-- The ten helpers moved, and moved to the schema policies can still reach: present in `private`, absent from `public`, and executable by both API roles (a policy runs as its caller).
SELECT
  is (
    (
      SELECT
        count(*) FILTER (WHERE n.nspname = 'private') || '/' || count(*) FILTER (WHERE n.nspname = 'public') || '/' || count(*) FILTER (
          WHERE
            n.nspname = 'private'
            AND has_function_privilege('anon', p.oid, 'EXECUTE')
            AND has_function_privilege('authenticated', p.oid, 'EXECUTE')
        )
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        p.proname IN (
          'entity_project_id',
          'is_child_nominee',
          'nomination_exists_in_contest',
          'entity_has_confirmed_nomination',
          'nomination_entities_confirmed',
          'project_nominations_locked',
          'election_project_id',
          'constituency_group_project_id',
          'caller_unconfirmed_originated_count',
          'caller_nominated_in_contest'
        )
    ),
    '10/0/10',
    'WR-01: the ten policy-only helpers live in private (not public) and stay executable by anon and authenticated for policy evaluation'
  );

-- =====================================================================
-- Section 9: get_nominations cannot cross a project boundary
--
-- The fixture ships project B CLOSED to voters and every entity it owns unconfirmed, so an anon caller cannot see any of it. Asserting a zero for project B in that state would be a zero from an empty instrument: it would hold with or without a project predicate in the function. Project B is therefore OPENED and all four of its entity tables CONFIRMED first, which leaves the project predicate as the ONLY thing separating the two projects, and the two "returns at least one row" assertions below are the positive control that says so.
--
-- The mechanism changed at 162-08 and the intent did not. Until then this section made project B public with three `UPDATE ... SET published = true` statements against a column 162-16 has since deleted; that term is no longer read by any anon policy -- visibility moved onto `projects.open_for_voters` and the entity `confirmed` flags -- so the statements would have conferred nothing, project B would have gone dark, and five assertions here would have become zeroes from an empty instrument while still exiting zero. The assertions and their description strings are unchanged; only the statements that put the database into the state they measure.
-- One nomination in each project is given the SAME external_id. The unique index on nominations is (project_id, external_id), so an identifier that collides across projects is a legal state that a real import produces; the adjacency assertion is that the collision neither merges the two rows nor leaks the other project's.
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
  project_id = test_id ('project_b');

UPDATE candidates
SET
  confirmed = true,
  terms_of_use_accepted = now() - interval '1 day'
WHERE
  project_id = test_id ('project_b');

UPDATE factions
SET
  confirmed = true
WHERE
  project_id = test_id ('project_b');

UPDATE alliances
SET
  confirmed = true
WHERE
  project_id = test_id ('project_b');

-- The nominations too, as of 162-12. This section opens project B and confirms all four of its ENTITY tables so the anon path is exercised on both projects; it used to get the NOMINATION half for free, because the column was `unconfirmed boolean DEFAULT false` and the shared fixture named no value. D-11c flips it to `confirmed boolean NOT NULL DEFAULT false` and the shared fixture now states the A-true / B-false polarity explicitly, so this flip has to be stated here too. The assertions below and their description strings are unchanged: what changed is that the fixture says what it always meant.
UPDATE nominations
SET
  confirmed = true
WHERE
  project_id = test_id ('project_b');

UPDATE nominations
SET
  external_id = 'shared-across-projects'
WHERE
  id IN (
    test_id ('nomination_org_a'),
    test_id ('nomination_org_b')
  );

-- The illegal state this section exists to detect, created deliberately: a nomination that BELONGS to project A whose entity is project B's candidate. Nothing in the schema forbids it -- the nominations table has separate foreign keys to project and to entity with no composite constraint between them, and `validate_nomination` reads the type hierarchy and the shared election/constituency without ever looking at project_id. So this is a state a real import can reach, not a state contrived by disabling something.
-- Without this row every entity assertion below would be a zero from an empty instrument: it would hold identically with and without a project term on the entity joins, and would therefore say nothing about them. With it, those joins are the only thing standing between project A's ballot and project B's candidate.
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
    'dddddddd-dddd-dddd-dddd-0000000000f1'::uuid,
    test_id ('project_a'),
    test_id ('candidate_b'),
    test_id ('election_a'),
    test_id ('constituency_a'),
    1,
    true
  );

SELECT
  set_test_user ('anon');

-- Positive control for project A: the call returns rows at all.
SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        get_nominations (p_project_id => test_id ('project_a'))
    )::integer >= 1,
    'get_nominations for project A returns rows (control for the project B exclusion below)'
  );

-- Positive control for project B, and the reason project A's zero below is a measurement rather than an artefact of RLS.
SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        get_nominations (p_project_id => test_id ('project_b'))
    )::integer >= 1,
    'get_nominations for project B returns rows, so project B is anon-visible and its exclusion from project A is the predicate at work'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        get_nominations (p_project_id => test_id ('project_a')) g
      WHERE
        g.id IN (
          SELECT
            n.id
          FROM
            nominations n
          WHERE
            n.project_id = test_id ('project_b')
        )
    )::integer,
    0,
    'get_nominations for project A returns no nomination belonging to project B'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        get_nominations (p_project_id => test_id ('project_b')) g
      WHERE
        g.id IN (
          SELECT
            n.id
          FROM
            nominations n
          WHERE
            n.project_id = test_id ('project_a')
        )
    )::integer,
    0,
    'get_nominations for project B returns no nomination belonging to project A'
  );

-- Partition rather than mere filtering: the two project-scoped results add up to every confirmed nomination this fixture owns and the anon caller can see, with none dropped and none counted twice.
--
-- The right-hand side is restricted to the fixture's own two projects. It was written by 161-02 as an unrestricted count over `nominations`, which made the assertion depend on what the database happened to hold: `create_test_data()` runs inside this file's transaction and contributes a fixed number of rows, but any dev-seed or E2E data already committed outside it was counted too. 161-03 measured the result on a database carrying 377 previously seeded nominations — `have: 4, want: 381` — a red half that says nothing about get_nominations. The clean-database precondition was never stated anywhere, so the failure presented as an intermittent mystery rather than as the test-authoring bug it is, and plan 161-07 has to prove `yarn test:e2e` green twice with no `yarn db:reset` between the runs, which an assertion coupled to pristine state cannot survive.
-- Scoping the count is not a weakening. The claim under test is that the two project-scoped calls PARTITION the fixture's nominations — each row appearing exactly once across the two results — and every way that claim can break still fails here: dropping the project predicate makes each call return both projects and the sum overshoot, dropping a row makes it undershoot, and double-counting overshoots. Both directions were probed on the live database before this was committed.
SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        get_nominations (p_project_id => test_id ('project_a'))
    )::integer + (
      SELECT
        count(*)
      FROM
        get_nominations (p_project_id => test_id ('project_b'))
    )::integer,
    (
      SELECT
        count(*)
      FROM
        nominations n
      WHERE
        n.project_id IN (test_id ('project_a'), test_id ('project_b'))
        AND n.confirmed
        -- The cross-project probe is excluded because it is CORRECTLY absent from both results. Its entity belongs to project B, so project A's call resolves every entity-side column to NULL and the function's trailing `COALESCE(c.id, o.id, f.id, a.id) IS NOT NULL` filter drops the row; project B's call never sees it, because the nomination itself belongs to project A. A row both calls rightly decline to return is not part of the partition, and counting it here would make this assertion demand the leak back.
        AND n.id <> 'dddddddd-dddd-dddd-dddd-0000000000f1'::uuid
    )::integer,
    'the two project-scoped counts partition this fixture''s anon-visible confirmed nominations rather than merely filtering them'
  );

-- Adjacency: an external_id collision across projects does not merge or leak rows.
SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        get_nominations (p_project_id => test_id ('project_a')) g
      WHERE
        g.id IN (
          SELECT
            n.id
          FROM
            nominations n
          WHERE
            n.external_id = 'shared-across-projects'
        )
    )::integer,
    1,
    'an external_id shared by two projects yields exactly one row for project A, not both projects rows'
  );

-- The ENTITY side of the boundary, which every assertion above is blind to. They all compare nomination ids, and a nomination correctly scoped to project A that carries project B's candidate data passes every one of them: the row belongs to project A, it is counted once, and its id appears in no project-B set. What leaks is the entity, so the entity is what these assert on.
-- Control first: the illegal nomination is visible to this anon caller. Without it a zero below could mean the entity joins are scoped, or it could mean row-level security hid the nomination and nothing was tested at all.
SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        nominations n
      WHERE
        n.id = 'dddddddd-dddd-dddd-dddd-0000000000f1'::uuid
    )::integer,
    1,
    'the cross-project nomination is visible to the anon caller, so the entity assertions below measure the joins rather than row-level security'
  );

-- Second control: project B owns at least one entity this anon caller can see, so the set the next assertion tests membership of is not an empty one.
SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        candidates c
      WHERE
        c.project_id = test_id ('project_b')
    )::integer >= 1,
    'project B has an anon-visible entity, so the entity-id set the next assertion excludes is a real set'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        get_nominations (p_project_id => test_id ('project_a')) g
      WHERE
        g.entity_id IN (
          SELECT
            c.id
          FROM
            candidates c
          WHERE
            c.project_id = test_id ('project_b')
          UNION ALL
          SELECT
            o.id
          FROM
            organizations o
          WHERE
            o.project_id = test_id ('project_b')
          UNION ALL
          SELECT
            f.id
          FROM
            factions f
          WHERE
            f.project_id = test_id ('project_b')
          UNION ALL
          SELECT
            a.id
          FROM
            alliances a
          WHERE
            a.project_id = test_id ('project_b')
        )
    )::integer,
    0,
    'get_nominations for project A returns no row whose entity belongs to project B'
  );

-- The row is absent ENTIRELY rather than returned with its entity columns blanked. Once the joins carry the project predicate, every entity-side column of a cross-project nomination resolves to NULL, and the function's existing `COALESCE(c.id, o.id, f.id, a.id) IS NOT NULL` filter then drops the row. A half-populated nomination would be worse than either outcome, so this asserts which of the two happens.
SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        get_nominations (p_project_id => test_id ('project_a')) g
      WHERE
        g.id = 'dddddddd-dddd-dddd-dddd-0000000000f1'::uuid
    )::integer,
    0,
    'a nomination whose entity belongs to another project is dropped entirely rather than returned with null entity columns'
  );

-- The parameter is genuinely required, not defaulted: with no argument there is no such function to call.
SELECT
  throws_ok (
    $$SELECT count(*) FROM get_nominations()$$,
    '42883',
    NULL,
    'get_nominations with no arguments raises undefined_function, so p_project_id carries no DEFAULT'
  );

-- =====================================================================
-- Section 10: get_questions cannot cross a project boundary
--
-- The same proof as section 9, on the other read RPC the voter app calls, and built the same way for the same reason. The fixture ships project B CLOSED to voters, so an anon caller cannot see its question category or its question at all. Asserting a zero for project B's rows in that state would be a zero from an empty instrument — it would hold identically with and without a project predicate in the function, and would therefore prove nothing about the predicate. Project B is OPENED FIRST, which leaves the project predicate as the only thing separating the two projects, and the two "returns rows at all" controls below are what say so.
-- Both halves of the payload are asserted separately, because get_questions filters categories and questions in two independent subqueries: a project predicate present on one and missing from the other is a real and silent failure mode.
-- One category in each project is given the SAME external_id. The unique index on question_categories is (project_id, external_id), so a cross-project collision is a legal state a real import produces; the adjacency assertion is that it neither merges the two rows nor leaks the other project's.
-- =====================================================================
SELECT
  reset_role ();

UPDATE projects
SET
  open_for_voters = true
WHERE
  id = test_id ('project_b');

UPDATE question_categories
SET
  external_id = 'shared-across-projects'
WHERE
  id IN (
    test_id ('question_category_a'),
    test_id ('question_category_b')
  );

SELECT
  set_test_user ('anon');

-- Positive control for project A: both halves of the payload carry rows at all.
SELECT
  ok (
    jsonb_array_length(
      get_questions (test_id ('project_a')) -> 'categories'
    ) >= 1
    AND jsonb_array_length(
      get_questions (test_id ('project_a')) -> 'questions'
    ) >= 1,
    'get_questions for project A returns both a category and a question (control for the project B exclusion below)'
  );

-- Positive control for project B, and the reason project A's zeros below are a measurement rather than an artefact of RLS hiding project B entirely.
SELECT
  ok (
    jsonb_array_length(
      get_questions (test_id ('project_b')) -> 'categories'
    ) >= 1
    AND jsonb_array_length(
      get_questions (test_id ('project_b')) -> 'questions'
    ) >= 1,
    'get_questions for project B returns both a category and a question, so project B is anon-visible and its exclusion from project A is the predicate at work'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        jsonb_array_elements(
          get_questions (test_id ('project_a')) -> 'categories'
        ) AS e
      WHERE
        e ->> 'id' = test_id ('question_category_b')::text
    ) + (
      SELECT
        count(*)::integer
      FROM
        jsonb_array_elements(
          get_questions (test_id ('project_a')) -> 'questions'
        ) AS e
      WHERE
        e ->> 'id' = test_id ('question_b')::text
    ),
    0,
    'get_questions for project A returns neither the category nor the question belonging to project B'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        jsonb_array_elements(
          get_questions (test_id ('project_b')) -> 'categories'
        ) AS e
      WHERE
        e ->> 'id' = test_id ('question_category_a')::text
    ) + (
      SELECT
        count(*)::integer
      FROM
        jsonb_array_elements(
          get_questions (test_id ('project_b')) -> 'questions'
        ) AS e
      WHERE
        e ->> 'id' = test_id ('question_a')::text
    ),
    0,
    'get_questions for project B returns neither the category nor the question belonging to project A'
  );

-- Partition rather than mere filtering: the two project-scoped payloads add up to every question category and question these two projects own that the anon caller can see, with none dropped and none counted twice. Both table counts are restricted to the fixture's own projects, so the assertion does not depend on what dev-seed or E2E data the database happens to be carrying — the state coupling that made the get_nominations partition assertion above read `have: 4, want: 381` on a seeded database.
SELECT
  is (
    jsonb_array_length(
      get_questions (test_id ('project_a')) -> 'categories'
    ) + jsonb_array_length(
      get_questions (test_id ('project_b')) -> 'categories'
    ) + jsonb_array_length(
      get_questions (test_id ('project_a')) -> 'questions'
    ) + jsonb_array_length(
      get_questions (test_id ('project_b')) -> 'questions'
    ),
    (
      SELECT
        count(*)::integer
      FROM
        question_categories qc
      WHERE
        qc.project_id IN (test_id ('project_a'), test_id ('project_b'))
    ) + (
      SELECT
        count(*)::integer
      FROM
        questions q
      WHERE
        q.project_id IN (test_id ('project_a'), test_id ('project_b'))
    ),
    'the two project-scoped payloads partition this fixture''s anon-visible categories and questions rather than merely filtering them'
  );

-- Adjacency: an external_id collision across projects does not merge or leak rows.
SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        jsonb_array_elements(
          get_questions (test_id ('project_a')) -> 'categories'
        ) AS e
      WHERE
        e ->> 'external_id' = 'shared-across-projects'
    ),
    1,
    'an external_id shared by two projects yields exactly one category for project A, not both projects categories'
  );

-- The parameter is genuinely required, not defaulted: with no argument there is no such function to call.
SELECT
  throws_ok (
    $$SELECT get_questions()$$,
    '42883',
    NULL,
    'get_questions with no arguments raises undefined_function, so p_project_id carries no DEFAULT'
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
