-- 00-helpers.test.sql: Shared test helpers, fixtures, and constants
--
-- This file runs first (alphabetical ordering) and creates persistent helper functions that subsequent test files depend on:
--   set_test_user()     - simulate an authenticated or anon user with JWT claims reset_role()        - switch back to postgres superuser for fixture insertion test_user_id()      - predictable UUID for a named test user test_user_grants()  - the named user's public.grants rows, as the fixture's authority map test_id()           - predictable UUID for a named test entity create_test_data()  - create a complete multi-tenant test dataset set_test_retired_claim() - build a token of the RETIRED claim shape, for the assertions that such a token confers nothing
--
-- Architecture: Function definitions are COMMITted (persisted for other test files to use). Smoke tests run in a separate BEGIN/ROLLBACK transaction.
-- The `supabase db reset` between test runs removes these functions.
--
-- Each subsequent test file calls create_test_data() after BEGIN, then ROLLBACK at end, getting a fresh dataset each time.
-- ======================================================================
-- Phase 1: Create persistent helper functions (outside transaction)
-- ======================================================================
CREATE EXTENSION IF NOT EXISTS pgtap
WITH
  SCHEMA extensions;

--------------------------------------------------------------------------------
-- Predictable UUID constants
--------------------------------------------------------------------------------
-- Accounts Account A: 11111111-1111-1111-1111-111111111111 Account B: 22222222-2222-2222-2222-222222222222.
-- Projects Project A: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa Project B: bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb.
-- Users
-- admin_a:          cccccccc-cccc-cccc-cccc-000000000001
-- admin_b:          cccccccc-cccc-cccc-cccc-000000000002
-- candidate_a:      cccccccc-cccc-cccc-cccc-000000000003
-- candidate_b:      cccccccc-cccc-cccc-cccc-000000000004
-- organization_a:   cccccccc-cccc-cccc-cccc-000000000005
-- super_admin:      cccccccc-cccc-cccc-cccc-000000000006
-- account_admin_a:  cccccccc-cccc-cccc-cccc-000000000007
-- candidate_a2:     cccccccc-cccc-cccc-cccc-000000000008
-- Entities (elections, orgs, candidates, etc.)
-- election_a:              dddddddd-dddd-dddd-dddd-000000000001
-- election_b:              dddddddd-dddd-dddd-dddd-000000000002
-- org_a:                   dddddddd-dddd-dddd-dddd-000000000003
-- org_b:                   dddddddd-dddd-dddd-dddd-000000000004
-- cand_a:                  dddddddd-dddd-dddd-dddd-000000000005
-- cand_b:                  dddddddd-dddd-dddd-dddd-000000000006
-- constituency_group_a:    dddddddd-dddd-dddd-dddd-000000000007
-- constituency_group_b:    dddddddd-dddd-dddd-dddd-000000000008
-- constituency_a:          dddddddd-dddd-dddd-dddd-000000000009
-- constituency_b:          dddddddd-dddd-dddd-dddd-000000000010
-- question_category_a:     dddddddd-dddd-dddd-dddd-000000000013
-- question_category_b:     dddddddd-dddd-dddd-dddd-000000000014
-- question_a:              dddddddd-dddd-dddd-dddd-000000000015
-- question_b:              dddddddd-dddd-dddd-dddd-000000000016
-- nomination_org_a:        dddddddd-dddd-dddd-dddd-000000000017
-- nomination_cand_a:       dddddddd-dddd-dddd-dddd-000000000018
-- nomination_org_b:        dddddddd-dddd-dddd-dddd-000000000019
-- nomination_cand_b:       dddddddd-dddd-dddd-dddd-000000000020
-- faction_a:               dddddddd-dddd-dddd-dddd-000000000021
-- faction_b:               dddddddd-dddd-dddd-dddd-000000000022
-- alliance_a:              dddddddd-dddd-dddd-dddd-000000000023
-- alliance_b:              dddddddd-dddd-dddd-dddd-000000000024
-- app_settings_a:          dddddddd-dddd-dddd-dddd-000000000025
-- app_settings_b:          dddddddd-dddd-dddd-dddd-000000000026
-- cand_a2:                 dddddddd-dddd-dddd-dddd-000000000027
-- feedback_a:              dddddddd-dddd-dddd-dddd-000000000028
-- feedback_b:              dddddddd-dddd-dddd-dddd-000000000029
-- admin_job_a:             dddddddd-dddd-dddd-dddd-000000000030
-- nomination_faction_a:   dddddddd-dddd-dddd-dddd-000000000031
-- nomination_alliance_a:  dddddddd-dddd-dddd-dddd-000000000032
-- nomination_faction_b:   dddddddd-dddd-dddd-dddd-000000000033
-- nomination_alliance_b:  dddddddd-dddd-dddd-dddd-000000000034
--------------------------------------------------------------------------------
-- test_user_id: map user name to predictable UUID
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION test_user_id (user_name text) RETURNS uuid LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE user_name
    WHEN 'admin_a'         THEN 'cccccccc-cccc-cccc-cccc-000000000001'::uuid
    WHEN 'admin_b'         THEN 'cccccccc-cccc-cccc-cccc-000000000002'::uuid
    WHEN 'candidate_a'     THEN 'cccccccc-cccc-cccc-cccc-000000000003'::uuid
    WHEN 'candidate_b'     THEN 'cccccccc-cccc-cccc-cccc-000000000004'::uuid
    WHEN 'organization_a'  THEN 'cccccccc-cccc-cccc-cccc-000000000005'::uuid
    WHEN 'super_admin'     THEN 'cccccccc-cccc-cccc-cccc-000000000006'::uuid
    WHEN 'account_admin_a' THEN 'cccccccc-cccc-cccc-cccc-000000000007'::uuid
    WHEN 'candidate_a2'    THEN 'cccccccc-cccc-cccc-cccc-000000000008'::uuid
    ELSE NULL
  END;
$$;

--------------------------------------------------------------------------------
-- test_id: map entity name to predictable UUID
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION test_id (entity_name text) RETURNS uuid LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE entity_name
    -- Accounts
    WHEN 'account_a'            THEN '11111111-1111-1111-1111-111111111111'::uuid
    WHEN 'account_b'            THEN '22222222-2222-2222-2222-222222222222'::uuid
    -- Projects
    WHEN 'project_a'            THEN 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
    WHEN 'project_b'            THEN 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid
    -- Elections
    WHEN 'election_a'           THEN 'dddddddd-dddd-dddd-dddd-000000000001'::uuid
    WHEN 'election_b'           THEN 'dddddddd-dddd-dddd-dddd-000000000002'::uuid
    -- Organizations
    WHEN 'org_a'                THEN 'dddddddd-dddd-dddd-dddd-000000000003'::uuid
    WHEN 'org_b'                THEN 'dddddddd-dddd-dddd-dddd-000000000004'::uuid
    -- Candidates
    WHEN 'candidate_a'          THEN 'dddddddd-dddd-dddd-dddd-000000000005'::uuid
    WHEN 'candidate_b'          THEN 'dddddddd-dddd-dddd-dddd-000000000006'::uuid
    WHEN 'candidate_a2'         THEN 'dddddddd-dddd-dddd-dddd-000000000027'::uuid
    -- Constituency groups
    WHEN 'constituency_group_a' THEN 'dddddddd-dddd-dddd-dddd-000000000007'::uuid
    WHEN 'constituency_group_b' THEN 'dddddddd-dddd-dddd-dddd-000000000008'::uuid
    -- Constituencies
    WHEN 'constituency_a'       THEN 'dddddddd-dddd-dddd-dddd-000000000009'::uuid
    WHEN 'constituency_b'       THEN 'dddddddd-dddd-dddd-dddd-000000000010'::uuid
    -- Question categories
    WHEN 'question_category_a'  THEN 'dddddddd-dddd-dddd-dddd-000000000013'::uuid
    WHEN 'question_category_b'  THEN 'dddddddd-dddd-dddd-dddd-000000000014'::uuid
    -- Questions
    WHEN 'question_a'           THEN 'dddddddd-dddd-dddd-dddd-000000000015'::uuid
    WHEN 'question_b'           THEN 'dddddddd-dddd-dddd-dddd-000000000016'::uuid
    -- Nominations
    WHEN 'nomination_org_a'     THEN 'dddddddd-dddd-dddd-dddd-000000000017'::uuid
    WHEN 'nomination_cand_a'    THEN 'dddddddd-dddd-dddd-dddd-000000000018'::uuid
    WHEN 'nomination_org_b'     THEN 'dddddddd-dddd-dddd-dddd-000000000019'::uuid
    WHEN 'nomination_cand_b'    THEN 'dddddddd-dddd-dddd-dddd-000000000020'::uuid
    WHEN 'nomination_faction_a'  THEN 'dddddddd-dddd-dddd-dddd-000000000031'::uuid
    WHEN 'nomination_alliance_a' THEN 'dddddddd-dddd-dddd-dddd-000000000032'::uuid
    WHEN 'nomination_faction_b'  THEN 'dddddddd-dddd-dddd-dddd-000000000033'::uuid
    WHEN 'nomination_alliance_b' THEN 'dddddddd-dddd-dddd-dddd-000000000034'::uuid
    -- Factions
    WHEN 'faction_a'            THEN 'dddddddd-dddd-dddd-dddd-000000000021'::uuid
    WHEN 'faction_b'            THEN 'dddddddd-dddd-dddd-dddd-000000000022'::uuid
    -- Alliances
    WHEN 'alliance_a'           THEN 'dddddddd-dddd-dddd-dddd-000000000023'::uuid
    WHEN 'alliance_b'           THEN 'dddddddd-dddd-dddd-dddd-000000000024'::uuid
    -- App settings
    WHEN 'app_settings_a'       THEN 'dddddddd-dddd-dddd-dddd-000000000025'::uuid
    WHEN 'app_settings_b'       THEN 'dddddddd-dddd-dddd-dddd-000000000026'::uuid
    -- Feedback
    WHEN 'feedback_a'           THEN 'dddddddd-dddd-dddd-dddd-000000000028'::uuid
    WHEN 'feedback_b'           THEN 'dddddddd-dddd-dddd-dddd-000000000029'::uuid
    -- Admin jobs
    WHEN 'admin_job_a'          THEN 'dddddddd-dddd-dddd-dddd-000000000030'::uuid
    ELSE NULL
  END;
$$;

--------------------------------------------------------------------------------
-- test_user_grants: map user name to the public.grants rows that identity holds
--
-- THE AUTHORITY MAP OF THE PGTAP FIXTURE, WRITTEN DOWN IN EXACTLY ONE PLACE, AND THIS IS IT. Every one of the estate's derived call sites passes it as set_test_user's third argument, set_test_user writes the rows it describes and then asserts the database agrees with it, and 162-15 measured what the estate can catch by mutating this one function and re-running everything.
--
-- 162-15 REPLACED test_user_grants WITH THIS, one token renamed per call site (task 2 Q1 = approved: same call shape, same argument position, argument list unchanged). The predecessor answered "which rows of the retired role table does this identity hold"; that table is gone and the question with it. The entries are the column names of public.grants -- scope, target_type, target_id, role -- so this function's output is directly comparable with test_grants_claim's projection of the table, which is what makes the two-source agreement assertion in set_test_user possible at all.
--
-- The eight arms are the image the retired path produced, captured and asserted set-equal to it in both directions rather than re-derived: 162-CONTEXT.md D-07's mapping, already applied.
-- An unknown name returns an empty array -- the grant-less identity, which is a legal state and not an error.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION test_user_grants (user_name text) RETURNS jsonb LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE user_name
    WHEN 'admin_a' THEN
      jsonb_build_array(jsonb_build_object(
        'scope', 'project',
        'target_type', NULL,
        'target_id', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'role', 'admin'
      ))
    WHEN 'admin_b' THEN
      jsonb_build_array(jsonb_build_object(
        'scope', 'project',
        'target_type', NULL,
        'target_id', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'role', 'admin'
      ))
    WHEN 'candidate_a' THEN
      jsonb_build_array(jsonb_build_object(
        'scope', 'entity',
        'target_type', 'candidate',
        'target_id', 'dddddddd-dddd-dddd-dddd-000000000005',
        'role', 'editor'
      ))
    WHEN 'candidate_b' THEN
      jsonb_build_array(jsonb_build_object(
        'scope', 'entity',
        'target_type', 'candidate',
        'target_id', 'dddddddd-dddd-dddd-dddd-000000000006',
        'role', 'editor'
      ))
    WHEN 'candidate_a2' THEN
      jsonb_build_array(jsonb_build_object(
        'scope', 'entity',
        'target_type', 'candidate',
        'target_id', 'dddddddd-dddd-dddd-dddd-000000000027',
        'role', 'editor'
      ))
    WHEN 'organization_a' THEN
      jsonb_build_array(jsonb_build_object(
        'scope', 'entity',
        'target_type', 'organization',
        'target_id', 'dddddddd-dddd-dddd-dddd-000000000003',
        'role', 'editor'
      ))
    WHEN 'super_admin' THEN
      jsonb_build_array(jsonb_build_object(
        'scope', 'global',
        'target_type', NULL,
        'target_id', NULL,
        'role', 'admin'
      ))
    WHEN 'account_admin_a' THEN
      jsonb_build_array(jsonb_build_object(
        'scope', 'account',
        'target_type', NULL,
        'target_id', '11111111-1111-1111-1111-111111111111',
        'role', 'admin'
      ))
    ELSE '[]'::jsonb
  END;
$$;

--------------------------------------------------------------------------------
-- set_test_user: simulate a Supabase user with JWT claims
--
-- For 'anon': sets role to anon, clears JWT claims For 'authenticated': sets role to authenticated, builds full JWT claims
--   with sub, role, and a `grants` array projected from public.grants
--
-- THE CLAIM IS NOW THE HOOK'S, NOT A SYNTHESISED ONE. It is built through test_grants_claim(p_user_id) — the same table-to-claim projection custom_access_token_hook performs, asserted set-equal to it in 14-grants-migration.test.sql — so every assertion in the estate runs against a table-to-claim path. The retired key is NOT set: emitting both vocabularies is the option the phase did not take (K1), and a fixture that carried the retired key would keep proving a claim nobody issues.
--
-- THE THIRD PARAMETER CANNOT BE REMOVED and is therefore given work. CREATE OR REPLACE FUNCTION cannot change an argument list — it creates an OVERLOAD — and every three-argument call site across the estate would then bind ambiguously. So it does two things. It WRITES the authority rows the array describes, because an identity must hold its grants before its token is projected from them; and it is a TWO-SOURCE AGREEMENT ASSERTION, raising when the array a call site passes is not set-equal to the projection of that identity's rows out of public.grants.
--
-- 162-15 TURNED THE TRIPWIRE INTO THE AGREEMENT ASSERTION, which is strictly more. The tripwire caught one case: a non-empty array for an identity that ends up with NO grant rows. The agreement assertion catches that case and every other disagreement between the fixture's written-down authority map and the table — a call site naming an identity whose arm has drifted, an arm that grants something the table does not, a row the table carries that the fixture never claimed. Its subject was also the retired role array; the array is now grant-shaped, so the two sides are comparable at all.
--
-- WHY THE WRITE IS HERE AND NOT AT THE END OF create_test_data(). 162-15's plan text called for create_test_data() to write the grant rows. MEASURED, and it is the same measurement 162-06 recorded as its first deviation: 12-user-can.test.sql calls create_test_data() and then builds its OWN thirteen-row grant fixture, five rows of which are byte-identical to rows this map produces, with a plain INSERT carrying no ON CONFLICT — so a write inside create_test_data() violates grants_user_scope_target_role_key and aborts that file, and three more of its rows would gain a SECOND grant that silently redefines the identity they were chosen to represent. 12-user-can.test.sql passes an EMPTY array at every one of its set_test_user calls, deliberately, because its authority comes from public.grants and from nowhere else — so nothing is written inside its transaction and its fixture is exactly what it was. The call site stays where 162-06 put it; only the mechanism changed.
--
-- NOT SECURITY DEFINER, and that matters for the write: it switches to the postgres role for the insert and for nothing else, inside the caller's transaction, and every row it writes is rolled back with that transaction. Owner rights would let an `authenticated` session write its own authority row, which is the one thing no test here should be able to do.
--------------------------------------------------------------------------------
--------------------------------------------------------------------------------
-- test_seed_identity_grants / test_seed_fixture_grants: write the fixture's authority rows into public.grants
--
-- THE ONE-FOR-ONE REPLACEMENT FOR THE TRANSITIONAL BACKFILL'S TRIGGER SEMANTICS, and for 162-05's per-identity oracle beside it. Both read the retired role table; both are gone. These two read test_user_grants and nothing else, so the fixture's authority map stays written down in exactly one place.
--
-- The whole-fixture entry point is whole-fixture for a measured reason. The backfill it replaced wrote the grants of EVERY identity holding a role row, so the first impersonation in a file seeded all eight. A per-identity write looks tidier and is wrong: 07-rpc-security.test.sql impersonates admin_a and then asks about organization_a, and that assertion went red against a per-identity write because the identity being READ ABOUT had never been impersonated.
--
-- The per-identity entry point is what 23-nominations-write.test.sql needs, and what 162-05's oracle gave it: that file stages authority deliberately, granting one identity at a time so a guard can be asserted to flip alone.
--
-- Neither is called from create_test_data(), for the reason 162-06 measured, recorded as its first deviation, and 162-15 re-measured rather than trusted: 12-user-can.test.sql calls create_test_data() and then builds its OWN thirteen-row grant fixture with a plain INSERT carrying no ON CONFLICT, five rows of which are byte-identical to rows this map writes, and three more of whose identities would gain a SECOND grant that silently redefines what they were chosen to represent. That file passes an empty array at every set_test_user call, so neither fires inside its transaction.
--
-- Arbitrated on the NAMED unique constraint, so a second call inserts zero: target_type is NULL on every non-entity row and an unnamed conflict target would match none of them.
--
-- Deliberately NOT SECURITY DEFINER, which is the property 162-05 recorded for the oracle and which survives it: owner rights would let an `authenticated` session grant itself authority, which is precisely the thing no test in this estate should be able to do. Callers run them as postgres, inside the caller's transaction, and every row they write is rolled back with it.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION test_seed_identity_grants (p_user_name text) RETURNS integer LANGUAGE plpgsql AS $$
DECLARE
  v_rows integer;
BEGIN
  INSERT INTO public.grants (user_id, scope, target_type, target_id, role)
  SELECT
    test_user_id(p_user_name),
    (e ->> 'scope')::public.grant_scope_type,
    (e ->> 'target_type')::public.entity_type,
    (e ->> 'target_id')::uuid,
    (e ->> 'role')::public.grant_role_type
  FROM jsonb_array_elements(test_user_grants(p_user_name)) AS e
  WHERE EXISTS (SELECT 1 FROM auth.users au WHERE au.id = test_user_id(p_user_name))
  ON CONFLICT ON CONSTRAINT grants_user_scope_target_role_key DO NOTHING;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows;
END;
$$;

CREATE OR REPLACE FUNCTION test_seed_fixture_grants () RETURNS integer LANGUAGE plpgsql AS $$
DECLARE
  v_name text;
  v_total integer := 0;
BEGIN
  FOREACH v_name IN ARRAY ARRAY[
    'admin_a', 'admin_b', 'candidate_a', 'candidate_b',
    'candidate_a2', 'organization_a', 'super_admin', 'account_admin_a'
  ]
  LOOP
    v_total := v_total + test_seed_identity_grants(v_name);
  END LOOP;
  RETURN v_total;
END;
$$;

-- The parameter's NAME changes, and PostgreSQL refuses to rename an input parameter through CREATE OR REPLACE — it answers "cannot change name of input parameter". A stale three-argument copy left by a previous run of this file against the same database would therefore make the redeclaration below error, so the exact three-argument signature is dropped first. This is a test-estate file: 162-15's prohibition on drop statements is about the DECLARATIVE SCHEMA, where a drop is dead code on the first reset, and this file already uses conditional drops elsewhere.
DROP FUNCTION IF EXISTS set_test_user (text, uuid, jsonb);

CREATE OR REPLACE FUNCTION set_test_user (
  p_role text,
  p_user_id uuid DEFAULT NULL,
  p_user_grants jsonb DEFAULT '[]'::jsonb
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  claims text;
  v_claims_grants jsonb;
  v_asserts_grants boolean;
BEGIN
  IF p_role = 'anon' THEN
    PERFORM set_config('role', 'anon', true);
    PERFORM set_config('request.jwt.claims', '', true);
    PERFORM set_config('request.jwt.claim.sub', '', true);
    RETURN;
  END IF;

  v_asserts_grants := p_user_grants IS NOT NULL
    AND jsonb_typeof(p_user_grants) = 'array'
    AND jsonb_array_length(p_user_grants) > 0;

  IF v_asserts_grants THEN
    -- MEASURED, AND THE REASON THIS IS NOT A PLAIN INSERT. The transitional backfill this replaced was SECURITY DEFINER, so it wrote public.grants from whatever role the session happened to be in; a plain insert here runs with invoker rights and public.grants REVOKEs ALL from authenticated, so the second and every later set_test_user call in a file -- which arrive while the session is already `authenticated` -- died with `permission denied for table grants` and took 14 of the 24 estate files down with them.
    -- The role is therefore switched exactly as reset_role() does, for the write and for nothing else. Deliberately NOT by making this function or a companion SECURITY DEFINER: owner rights would let an `authenticated` session grant itself authority, which is precisely the thing no test in this estate should be able to do (the reasoning test_grants_from_user_roles recorded, applied to its successor). The session user is postgres in every pgTAP run, so the switch is permitted; the tail of this function puts the role back to `authenticated` unconditionally.
    PERFORM set_config('role', 'postgres', true);
    PERFORM test_seed_fixture_grants();
  END IF;

  v_claims_grants := test_grants_claim(p_user_id);

  -- The two-source agreement assertion. Both sides are compared as SETS of the four grant columns, so entry order and the ordering test_grants_claim imposes are not part of the comparison; what is compared is what each side says this identity may do. Follows validate_nomination()'s error-message discipline (162-CONTEXT.md D-23): it names the identity, both arrays and the plan, so a failure in a seed log reads as a fixture disagreement rather than as a denial.
  IF v_asserts_grants AND NOT (
    (SELECT COALESCE(jsonb_agg(x ORDER BY x::text), '[]'::jsonb) FROM (
       SELECT DISTINCT jsonb_build_object('scope', e ->> 'scope', 'target_type', e ->> 'target_type', 'target_id', e ->> 'target_id', 'role', e ->> 'role') AS x
       FROM jsonb_array_elements(p_user_grants) AS e) a)
    =
    (SELECT COALESCE(jsonb_agg(x ORDER BY x::text), '[]'::jsonb) FROM (
       SELECT DISTINCT jsonb_build_object('scope', e ->> 'scope', 'target_type', e ->> 'target_type', 'target_id', e ->> 'target_id', 'role', e ->> 'role') AS x
       FROM jsonb_array_elements(v_claims_grants) AS e) b)
  ) THEN
    RAISE EXCEPTION 'set_test_user(%) was handed a grant array that is not set-equal to that identity''s rows in public.grants. The fixture says % and the table projects %. 162-15 turned this parameter into a two-source agreement assertion: the written-down authority map of the pgTAP fixture and the grant map are two spellings of one fact, and a token built while they disagree confers something no call site asked for. Correct the arm in test_user_grants, or pass an empty array.', p_user_id, p_user_grants, v_claims_grants;
  END IF;

  -- Build JWT claims JSON
  claims := json_build_object(
    'sub', p_user_id::text,
    'role', 'authenticated',
    'grants', v_claims_grants
  )::text;

  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', claims, true);
  PERFORM set_config('request.jwt.claim.sub', p_user_id::text, true);
END;
$$;

--------------------------------------------------------------------------------
-- set_test_retired_claim: build a token of the claim shape 162-06 retired
--
-- The ONE place in the estate that constructs a retired-shaped token, and it exists for a single question: does that shape still confer anything? 13-shim-parity.test.sql answers it as an EQUALITY with the view of an authenticated caller carrying no authority claim at all, rather than as an assertion about zero rows — several policies admit published rows to any authenticated caller, so a zero assertion would be false for a reason that has nothing to do with authority.
--
-- It sets the retired key and no `grants` key, which is exactly what a session minted before the hook changed still carries until its token refreshes.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_test_retired_claim (p_user_id uuid, p_user_roles jsonb) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  claims text;
BEGIN
  claims := json_build_object(
    'sub', p_user_id::text,
    'role', 'authenticated',
    'user_roles', p_user_roles
  )::text;

  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', claims, true);
  PERFORM set_config('request.jwt.claim.sub', p_user_id::text, true);
END;
$$;

--------------------------------------------------------------------------------
-- test_grants_claim: project public.grants rows into the JWT `grants` claim
--
-- This is the table-to-claim projection 162-06's access-token hook must reproduce exactly: the same jsonb_agg + COALESCE(..., '[]'::jsonb) form custom_access_token_hook already uses for user_roles, and per-entry keys that are the column names of public.grants (scope, target_type, target_id, role).
-- A key-name disagreement across that boundary is a silent total denial rather than an error, so 162-06 asserts equality against this helper.
--
-- SECURITY DEFINER so it can read public.grants from a session that is already `authenticated` — the table REVOKEs ALL from authenticated and anon. It is declared only here in tests/, never in schema/, so it exists only on a database that has run the pgTAP estate and `supabase db reset` removes it.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION test_grants_claim (p_user_id uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'scope', g.scope::text,
      'target_type', g.target_type::text,
      'target_id', g.target_id,
      'role', g.role::text
    )
    ORDER BY g.created_at, g.id
  ), '[]'::jsonb)
  FROM public.grants g
  WHERE g.user_id = p_user_id;
$$;

--------------------------------------------------------------------------------
-- set_test_grants: merge a user's grants into the current session's JWT claims
--
-- Called AFTER set_test_user, which builds the claims object this merges into.
-- set_test_user deliberately keeps its three-argument signature: CREATE OR REPLACE FUNCTION cannot change an argument list, so a fourth parameter would create an overload and every existing three-argument call across the pgTAP estate would then resolve ambiguously.
--
-- Raises when no claims are set, because "no grants" is a legal and silent state under user_can: a mis-ordered call must fail loudly rather than leave the caller looking like a legitimately grant-less user.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_test_grants (p_user_id uuid) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  claims jsonb;
BEGIN
  claims := NULLIF(current_setting('request.jwt.claims', true), '')::jsonb;
  IF claims IS NULL THEN
    RAISE EXCEPTION 'set_test_grants(%) called with no JWT claims set; call set_test_user first', p_user_id;
  END IF;

  claims := jsonb_set(claims, '{grants}', test_grants_claim(p_user_id));
  PERFORM set_config('request.jwt.claims', claims::text, true);
END;
$$;

--------------------------------------------------------------------------------
-- test_rls_digest: the caller's own view of every row-level-security table, as one digest per table
--
-- The instrument behind the policy-level row-set differential of 13-shim-parity.test.sql, and behind the same question waves 3, 4 and 5 each have to answer: did any identity's view of any table move. Written generically over the catalogue for that reason rather than for this plan's convenience.
--
-- The table list is DERIVED, never written down: every public table with row-level security enabled, plus storage.objects. A hardcoded list would stop measuring the moment a later wave enables row-level security on a new table, and it would do so silently and green.
--
-- SECURITY INVOKER, and that is the single most load-bearing line in the differential. With owner rights it would read past row-level security, every identity would digest identically, every comparison would pass, and the whole instrument would measure nothing while reporting success. 13-shim-parity.test.sql asserts `prosecdef = false` from the catalogue rather than trusting this comment.
--
-- A table the caller may not read AT ALL — public.grants and public.user_roles both REVOKE ALL from authenticated — digests as the literal 'DENIED' rather than raising. That is a real and comparable answer: it must be the same under both claim shapes, and a table that became readable would change it.
--
-- Declared only here, under tests/, and never in schema/, so it exists only on a database that has run the pgTAP estate and `supabase db reset` removes it.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION test_rls_digest () RETURNS TABLE (tbl text, digest text) LANGUAGE plpgsql STABLE
SET
  search_path = '' AS $$
DECLARE
  r record;
  d text;
BEGIN
  FOR r IN
    SELECT q.qname
    FROM (
      SELECT 'public.' || t.tablename AS qname
      FROM pg_catalog.pg_tables t
      WHERE t.schemaname = 'public' AND t.rowsecurity
      UNION ALL
      SELECT 'storage.objects'
    ) q
    ORDER BY q.qname
  LOOP
    BEGIN
      EXECUTE format(
        'SELECT COALESCE(md5(string_agg(s.r, ''|'' ORDER BY s.r)), '''') FROM (SELECT x::text AS r FROM %s x) s',
        r.qname
      ) INTO d;
    EXCEPTION
      WHEN insufficient_privilege THEN
        d := 'DENIED';
    END;

    tbl := r.qname;
    digest := d;
    RETURN NEXT;
  END LOOP;
END;
$$;

--------------------------------------------------------------------------------
-- reset_role: switch back to postgres superuser for fixture operations
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION reset_role () RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role', 'postgres', true);
END;
$$;

--------------------------------------------------------------------------------
-- create_test_data: create a complete multi-tenant test dataset
--
-- Creates:
--   2 accounts, 2 projects 8 auth.users Corresponding grant rows Full entity hierarchy in each project. The fixture's polarity is carried by section 3.4's three flags: Project A is OPEN FOR VOTERS and its rows are confirmed; Project B is neither, so every row of project A is anon-visible and every row of project B is not. That polarity predates 162-16 and SURVIVED it -- until then it was carried twice over, by these flags and by a per-row publication column, and deleting the column changed which term states it and not which rows are visible.
--
-- MUST be called while in the postgres role (the default at test start).
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_test_data () RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  -- ===== Auth users =====
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, aud, role, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, created_at, updated_at)
  VALUES
    (test_user_id('admin_a'),         '00000000-0000-0000-0000-000000000000', 'admin_a@test.com',         crypt('testpass', gen_salt('bf')), 'authenticated', 'authenticated', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
    (test_user_id('admin_b'),         '00000000-0000-0000-0000-000000000000', 'admin_b@test.com',         crypt('testpass', gen_salt('bf')), 'authenticated', 'authenticated', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
    (test_user_id('candidate_a'),     '00000000-0000-0000-0000-000000000000', 'candidate_a@test.com',     crypt('testpass', gen_salt('bf')), 'authenticated', 'authenticated', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
    (test_user_id('candidate_b'),     '00000000-0000-0000-0000-000000000000', 'candidate_b@test.com',     crypt('testpass', gen_salt('bf')), 'authenticated', 'authenticated', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
    (test_user_id('candidate_a2'),    '00000000-0000-0000-0000-000000000000', 'candidate_a2@test.com',    crypt('testpass', gen_salt('bf')), 'authenticated', 'authenticated', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
    (test_user_id('organization_a'),  '00000000-0000-0000-0000-000000000000', 'organization_a@test.com',  crypt('testpass', gen_salt('bf')), 'authenticated', 'authenticated', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
    (test_user_id('super_admin'),     '00000000-0000-0000-0000-000000000000', 'super_admin@test.com',     crypt('testpass', gen_salt('bf')), 'authenticated', 'authenticated', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
    (test_user_id('account_admin_a'), '00000000-0000-0000-0000-000000000000', 'account_admin_a@test.com', crypt('testpass', gen_salt('bf')), 'authenticated', 'authenticated', now(), '{}'::jsonb, '{}'::jsonb, now(), now());

  -- ===== Accounts =====
  INSERT INTO accounts (id, name) VALUES
    (test_id('account_a'), 'Account A'),
    (test_id('account_b'), 'Account B');

  -- ===== Projects ===== `open_for_voters` follows the A-true / B-false polarity this fixture already uses for all ten publication columns, so 162-08 inherits a two-directional control group and 162-16 can swap one term for another without re-cutting it.
  --
  -- `lock_nominations` is deliberately NOT named on either row. It ships inert -- nothing reads it until 162-12 -- so both projects take its default, and 15-visibility-flags.test.sql asserts exactly that.
  INSERT INTO projects (id, account_id, name, open_for_voters) VALUES
    (test_id('project_a'), test_id('account_a'), 'Project A', true),
    (test_id('project_b'), test_id('account_b'), 'Project B', false);

  -- ===== User roles =====


  -- ===== Elections =====
  INSERT INTO elections (id, project_id, name) VALUES
    (test_id('election_a'), test_id('project_a'), '{"en":"Election A"}'::jsonb),
    (test_id('election_b'), test_id('project_b'), '{"en":"Election B"}'::jsonb);

  -- ===== Constituency groups =====
  INSERT INTO constituency_groups (id, project_id, name) VALUES
    (test_id('constituency_group_a'), test_id('project_a'), '{"en":"CG A"}'::jsonb),
    (test_id('constituency_group_b'), test_id('project_b'), '{"en":"CG B"}'::jsonb);

  -- ===== Constituencies =====
  INSERT INTO constituencies (id, project_id, name) VALUES
    (test_id('constituency_a'), test_id('project_a'), '{"en":"Constituency A"}'::jsonb),
    (test_id('constituency_b'), test_id('project_b'), '{"en":"Constituency B"}'::jsonb);

  -- ===== Join tables =====
  INSERT INTO constituency_group_constituencies (constituency_group_id, constituency_id) VALUES
    (test_id('constituency_group_a'), test_id('constituency_a')),
    (test_id('constituency_group_b'), test_id('constituency_b'));

  INSERT INTO election_constituency_groups (election_id, constituency_group_id) VALUES
    (test_id('election_a'), test_id('constituency_group_a')),
    (test_id('election_b'), test_id('constituency_group_b'));

  -- ===== Organizations ===== `confirmed` follows the publication column's A-true / B-false polarity, one term per row rather than a second pass over the same rows.
  INSERT INTO organizations (id, project_id, auth_user_id, name, confirmed) VALUES
    (test_id('org_a'), test_id('project_a'), test_user_id('organization_a'), '{"en":"Org A"}'::jsonb,  true),
    (test_id('org_b'), test_id('project_b'), NULL,                           '{"en":"Org B"}'::jsonb, false);

  -- ===== Candidates (no answers to avoid trigger complications) ===== candidate_a + candidate_a2 are confirmed, in the open project, and must stay visible to anon.
  -- `anon_select_candidates` requires `terms_of_use_accepted IS NOT NULL AND < now()` as well as the confirmation and nomination terms of section 3.4, so both are given a timestamp strictly in the past; otherwise the anon-visible-candidate assertions in 03-anon-read.test fail.
  --
  -- It MUST NOT be a bare now(). pgTAP runs each file inside one transaction (the BEGIN/ROLLBACK pattern), and now() is transaction_timestamp(): it is frozen for the whole transaction. A row inserted with ToU = now() is then read back under a policy asking ToU < now(), which is now() < now() = FALSE, so candidate_a was invisible to anon and 03-anon-read tests 9 and 13 failed deterministically. Use clock_timestamp() if a moving clock is ever wanted.
  --
  -- candidate_b stays NULL — it is unconfirmed and its project is closed to voters, so it is invisible twice over anyway, AND a NULL ToU value lets 10-schema-migrations test #30 continue to assert the candidate_b ToU column is NULL after a candidate_a-as-other cross-tenant UPDATE attempt.
  --
  -- The candidates carry NO organization column: 162-07b removed it, and the candidate-to-organization association is now stated once, on the parent_nomination_id edge below. candidate_a reaches org_a through nomination_cand_a -> nomination_org_a; candidate_a2 reaches nothing, because it is a member with no nomination at all, and that asymmetry is what 21-entity-organization.test.sql's email-variable pair discriminates on.
  INSERT INTO candidates (id, project_id, auth_user_id, first_name, last_name, terms_of_use_accepted, confirmed) VALUES
    (test_id('candidate_a'),  test_id('project_a'), test_user_id('candidate_a'),  'Alice', 'Alpha',   now() - interval '1 day', true),
    (test_id('candidate_b'),  test_id('project_b'), test_user_id('candidate_b'),  'Bob',   'Bravo',   NULL,                     false),
    (test_id('candidate_a2'), test_id('project_a'), test_user_id('candidate_a2'), 'Carol', 'Charlie', now() - interval '1 day', true);

  -- ===== Factions ===== organization_id is NOT NULL as of 162-07b, so each faction is given the organization of its own project: faction_a to org_a, faction_b to org_b. A faction whose organization sat in the other project would violate no constraint the database declares today, which is exactly why the pairing is stated here rather than left to chance -- 162-12 tightens validate_nomination to read it.
  INSERT INTO factions (id, project_id, organization_id, name, confirmed) VALUES
    (test_id('faction_a'), test_id('project_a'), test_id('org_a'), '{"en":"Faction A"}'::jsonb,  true),
    (test_id('faction_b'), test_id('project_b'), test_id('org_b'), '{"en":"Faction B"}'::jsonb, false);

  -- ===== Alliances =====
  INSERT INTO alliances (id, project_id, name, confirmed) VALUES
    (test_id('alliance_a'), test_id('project_a'), '{"en":"Alliance A"}'::jsonb,  true),
    (test_id('alliance_b'), test_id('project_b'), '{"en":"Alliance B"}'::jsonb, false);

  -- ===== Question categories =====
  INSERT INTO question_categories (id, project_id, name) VALUES
    (test_id('question_category_a'), test_id('project_a'), '{"en":"Category A"}'::jsonb),
    (test_id('question_category_b'), test_id('project_b'), '{"en":"Category B"}'::jsonb);

  -- ===== Questions =====
  INSERT INTO questions (id, project_id, type, category_id, name, choices) VALUES
    (test_id('question_a'), test_id('project_a'), 'singleChoiceOrdinal', test_id('question_category_a'), '{"en":"Question A"}'::jsonb, '[{"id":1,"label":{"en":"Agree"}},{"id":2,"label":{"en":"Disagree"}}]'::jsonb),
    (test_id('question_b'), test_id('project_b'), 'singleChoiceOrdinal', test_id('question_category_b'), '{"en":"Question B"}'::jsonb, '[{"id":1,"label":{"en":"Agree"}},{"id":2,"label":{"en":"Disagree"}}]'::jsonb);

  -- ===== Nominations (org nomination first, then candidate under it) ===== `confirmed` is stated explicitly on every row as of 162-12. The column was `unconfirmed boolean DEFAULT false`, so every fixture nomination was EFFECTIVELY CONFIRMED without saying so; D-11c flips it to `confirmed boolean NOT NULL DEFAULT false`, which means a row that says nothing is now the opposite of what this fixture has always meant. It follows the project A visible / project B hidden polarity the fixture already carries for all ten publication columns and for the four entity confirmation columns.
  INSERT INTO nominations (id, project_id, organization_id, election_id, constituency_id, election_round, confirmed) VALUES
    (test_id('nomination_org_a'), test_id('project_a'), test_id('org_a'), test_id('election_a'), test_id('constituency_a'), 1, true);

  INSERT INTO nominations (id, project_id, candidate_id, election_id, constituency_id, election_round, parent_nomination_id, confirmed) VALUES
    (test_id('nomination_cand_a'), test_id('project_a'), test_id('candidate_a'), test_id('election_a'), test_id('constituency_a'), 1, test_id('nomination_org_a'), true);

  INSERT INTO nominations (id, project_id, organization_id, election_id, constituency_id, election_round, confirmed) VALUES
    (test_id('nomination_org_b'), test_id('project_b'), test_id('org_b'), test_id('election_b'), test_id('constituency_b'), 1, false);

  INSERT INTO nominations (id, project_id, candidate_id, election_id, constituency_id, election_round, parent_nomination_id, confirmed) VALUES
    (test_id('nomination_cand_b'), test_id('project_b'), test_id('candidate_b'), test_id('election_b'), test_id('constituency_b'), 1, test_id('nomination_org_b'), false);

  -- ===== Faction and alliance nominations ===== Added by 162-08, and a REPAIR rather than a change: this fixture's contract is that project A's rows are visible to anon and project B's are not, and 162-08 makes an entity anon-visible only THROUGH a confirmed nomination. `faction_a` and `alliance_a` carried no nomination of any kind, so two assertions in 03-anon-read.test.sql that name them by their publication state went red -- the polarity, not the assertions, was what had gone missing. All four entity tables now carry it.
  --
  -- `validate_nomination` requires a faction nomination to have an organization nomination as its parent and an alliance nomination to have none, and requires parent and child to share election, constituency and round; both project-A rows therefore hang off `nomination_org_a` and both project-B rows off `nomination_org_b`.
  --
  -- `candidate_a2` is deliberately left with NO nomination. It is the fixture's natural negative control for the entity conjunct, and 16-anon-visibility.test.sql asserts against it by name.
  INSERT INTO nominations (id, project_id, faction_id, election_id, constituency_id, election_round, parent_nomination_id, confirmed) VALUES
    (test_id('nomination_faction_a'), test_id('project_a'), test_id('faction_a'), test_id('election_a'), test_id('constituency_a'), 1, test_id('nomination_org_a'), true),
    (test_id('nomination_faction_b'), test_id('project_b'), test_id('faction_b'), test_id('election_b'), test_id('constituency_b'), 1, test_id('nomination_org_b'), false);

  INSERT INTO nominations (id, project_id, alliance_id, election_id, constituency_id, election_round, confirmed) VALUES
    (test_id('nomination_alliance_a'), test_id('project_a'), test_id('alliance_a'), test_id('election_a'), test_id('constituency_a'), 1, true),
    (test_id('nomination_alliance_b'), test_id('project_b'), test_id('alliance_b'), test_id('election_b'), test_id('constituency_b'), 1, false);

  -- ===== App settings =====
  INSERT INTO app_settings (id, project_id, settings) VALUES
    (test_id('app_settings_a'), test_id('project_a'), '{"theme":"light"}'::jsonb),
    (test_id('app_settings_b'), test_id('project_b'), '{"theme":"dark"}'::jsonb);

  -- ===== Feedback ===== Insert as superuser (bypasses RLS and rate limiting trigger context)
  INSERT INTO feedback (id, project_id, rating, description, date, created_at) VALUES
    (test_id('feedback_a'), test_id('project_a'), 5, 'Great app!',  now(), now()),
    (test_id('feedback_b'), test_id('project_b'), 3, 'Decent app.', now(), now());

  -- ===== Admin jobs =====
  INSERT INTO admin_jobs (id, project_id, job_id, job_type, election_id, author, end_status, start_time, end_time, input, output, messages, metadata) VALUES
    (test_id('admin_job_a'), test_id('project_a'), 'job-001', 'QuestionInfoGeneration', test_id('election_a'), 'admin_a@test.com', 'completed', now() - interval '10 minutes', now(), '{"param":"value"}'::jsonb, '{"result":"ok"}'::jsonb, '[{"text":"Processing..."}]'::jsonb, '{"questionsProcessed":5}'::jsonb);

END;
$$;

-- ======================================================================
-- Phase 2: Smoke tests (in a transaction that rolls back)
-- ======================================================================
BEGIN;

SET
  search_path = public,
  extensions;

SELECT
  no_plan ();

SELECT
  ok (true, 'pgTAP loaded successfully');

-- Test create_test_data
SELECT
  create_test_data ();

SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        accounts
      WHERE
        id = test_id ('account_a')
    )::integer = 1,
    'Account A created'
  );

SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        accounts
      WHERE
        id = test_id ('account_b')
    )::integer = 1,
    'Account B created'
  );

SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        projects
      WHERE
        id = test_id ('project_a')
    )::integer = 1,
    'Project A created'
  );

SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        candidates
      WHERE
        id = test_id ('candidate_a')
    )::integer = 1,
    'Candidate A created'
  );

-- Test set_test_user round-trip
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
        auth.uid ()
    )::text,
    test_user_id ('admin_a')::text,
    'auth.uid() returns admin_a UUID after set_test_user'
  );

SELECT
  ok (
    (
      SELECT
        auth.jwt () -> 'grants'
    ) IS NOT NULL,
    'auth.jwt() grants is not null after set_test_user'
  );

-- The other direction, and it is the half that matters: emitting the retired key alongside the new one is the option K1 forbids, and a fixture that still set it would keep the retired vocabulary alive in the one place the whole estate reads.
SELECT
  ok (
    NOT (
      (
        SELECT
          auth.jwt ()
      ) ? 'user_roles'
    ),
    'and the retired claim key is absent from the same token'
  );

-- Test anon mode
SELECT
  set_test_user ('anon');

SELECT
  is (
    current_setting('role', true),
    'anon',
    'set_test_user(anon) sets role to anon'
  );

-- Reset to postgres for cleanup
SELECT
  reset_role ();

SELECT
  *
FROM
  finish ();

ROLLBACK;
