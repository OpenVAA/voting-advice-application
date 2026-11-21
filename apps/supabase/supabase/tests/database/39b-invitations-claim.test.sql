-- 39b-invitations-claim.test.sql: claim_invitations, as behaviour
--
-- An invitation promises one grant to whoever proves control of its address or presents its code. This file asserts the claim: that a user who proved an invitation's address, or the address bound to its code, ends up holding exactly the promised grants and nobody else holds anything new; that each row is claimed or skipped by itself; and that a promise outlives its seeder's authority but not its own deletion. Seeding is asserted by 39a-invitations-seeding.test.sql.
--
-- A REFUSAL NAMES ITS SQLSTATE AND ITS MESSAGE, because the three kinds of refusal here are different controls. `new row violates row-level security policy` is the authority map. `permission denied for table` is a column or table privilege, checked before any policy. A message naming a constraint is a rule that binds every role, the service role included.
--
-- THE IDENTITIES. The fixture provides the project admin, the account admin, the root admin and the entity editor; their grant rows are written by test_seed_fixture_grants. This file adds a project editor of project A and one of project B. Every session passes an empty array to set_test_user, so each claim is projected from public.grants and from nowhere else.
--
-- THE ENTITIES. Every entity of the fixture's project A is already confirmed, so the cases about confirmation use this file's own unconfirmed rows.
--
-- Depends on: 00-helpers.test.sql (set_test_user, reset_role, create_test_data, test_id, test_user_id, test_seed_fixture_grants), 305-invitations.sql (the table, its trigger, privileges and policies), 300-auth-tables.sql (cleanup_grants_on_delete, which also deletes an entity's invitations), 506-invitation-rpcs.sql (create_invitations, claim_invitations), 102-entities.sql and 011-validation-functions.sql (the confirmation flag and its gate).
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (53);

-- Create test fixture data
SELECT
  create_test_data ();

SELECT
  test_seed_fixture_grants ();

-- Both projects serve candidates and organizations and allow every registration mode for each, so an entity invitation of either type is honoured in every section of this file.
UPDATE app_settings
SET
  settings = settings || jsonb_build_object(
    'contestantApp',
    COALESCE(settings -> 'contestantApp', '{}'::jsonb) || '{
      "servedEntityTypes": {
        "candidate": {"registrationModes": ["identity_provider", "email", "code"]},
        "organization": {"registrationModes": ["identity_provider", "email", "code"]}
      }
    }'::jsonb
  )
WHERE
  project_id IN (test_id ('project_a'), test_id ('project_b'));

-- A project editor of project A and one of project B.
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
    '39390000-0000-4000-8000-0000000000e1',
    '00000000-0000-0000-0000-000000000000',
    'project_editor_a@test.com',
    '',
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '39390000-0000-4000-8000-0000000000e2',
    '00000000-0000-0000-0000-000000000000',
    'project_editor_b@test.com',
    '',
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
    '39390000-0000-4000-8000-0000000000e1',
    'project',
    NULL,
    test_id ('project_a'),
    'editor'
  ),
  (
    '39390000-0000-4000-8000-0000000000e2',
    'project',
    NULL,
    test_id ('project_b'),
    'editor'
  );

-- Unconfirmed entities: named and nameless candidates and organizations in project A, and one candidate in project B.
INSERT INTO
  public.candidates (
    id,
    project_id,
    first_name,
    last_name,
    external_id
  )
VALUES
  (
    '39390000-0000-4000-8000-0000000000c1',
    test_id ('project_a'),
    'Nora',
    'Named',
    'inv-cand-named'
  ),
  (
    '39390000-0000-4000-8000-0000000000c2',
    test_id ('project_a'),
    '',
    '',
    'inv-cand-nameless'
  ),
  (
    '39390000-0000-4000-8000-0000000000c3',
    test_id ('project_a'),
    'Una',
    'Uninvited',
    'inv-cand-uninvited'
  ),
  (
    '39390000-0000-4000-8000-0000000000c4',
    test_id ('project_a'),
    'Dana',
    'Direct',
    'inv-cand-direct'
  ),
  (
    '39390000-0000-4000-8000-0000000000c5',
    test_id ('project_b'),
    'Bea',
    'Elsewhere',
    'inv-cand-only-b'
  ),
  (
    '39390000-0000-4000-8000-0000000000c6',
    test_id ('project_a'),
    'Mia',
    'Mailless',
    'inv-cand-mail'
  );

INSERT INTO
  public.organizations (id, project_id, name, external_id)
VALUES
  (
    '39390000-0000-4000-8000-0000000000a1',
    test_id ('project_a'),
    '{"en":"Named Org"}'::jsonb,
    'inv-org-named'
  ),
  (
    '39390000-0000-4000-8000-0000000000a2',
    test_id ('project_a'),
    '{"en":"   "}'::jsonb,
    'inv-org-nameless'
  ),
  (
    '39390000-0000-4000-8000-0000000000a3',
    test_id ('project_a'),
    '{"en":"Mail Org"}'::jsonb,
    'inv-org-mail'
  );

-- =====================================================================
-- Section 9: the claim's surface
-- =====================================================================
SELECT
  is (
    (
      SELECT
        string_agg(pg_get_function_identity_arguments(p.oid), ' | ')
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'public'
        AND p.proname = 'claim_invitations'
    ),
    'p_project_id uuid',
    'claim_invitations has exactly one signature, and it takes a project and nothing else: no address, no user and no invitation'
  );

SELECT
  is (
    (
      SELECT
        p.prosecdef::text || ' ' || p.proconfig::text
      FROM
        pg_proc p
      WHERE
        p.oid = 'public.claim_invitations(uuid)'::regprocedure
    ),
    'true {"search_path=\"\""}',
    'claim_invitations is SECURITY DEFINER with an empty pinned search_path'
  );

SELECT
  is (
    ARRAY[
      has_function_privilege(
        'anon',
        'public.claim_invitations(uuid)',
        'EXECUTE'
      ),
      has_function_privilege(
        'authenticated',
        'public.claim_invitations(uuid)',
        'EXECUTE'
      ),
      has_function_privilege(
        'service_role',
        'public.claim_invitations(uuid)',
        'EXECUTE'
      )
    ],
    ARRAY[false, true, false],
    'claim_invitations is executable by authenticated, and by neither anon nor service_role'
  );

SELECT
  set_test_user ('anon');

SELECT
  throws_ok (
    $$SELECT public.claim_invitations(test_id('project_a'))$$,
    '42501',
    'permission denied for function claim_invitations',
    'anon calling claim_invitations is refused'
  );

SELECT
  reset_role ();

SET
  LOCAL ROLE service_role;

SELECT
  throws_ok (
    $$SELECT public.claim_invitations(test_id('project_a'))$$,
    '42501',
    'permission denied for function claim_invitations',
    'the service role, which has no auth.uid() to answer for, is refused too'
  );

SELECT
  reset_role ();

-- =====================================================================
-- Section 10: exactly the promised grants
-- =====================================================================
-- The entities and users of Sections 10 to 15. Every candidate and organization is named, and every user's address is confirmed unless a case says otherwise. Each user's `encrypted_password` is the empty string, except where a case needs a hash or a null.
INSERT INTO
  public.candidates (id, project_id, first_name, last_name)
VALUES
  (
    '39390000-0000-4000-8000-00000003c001',
    test_id ('project_a'),
    'Claim',
    'One'
  ),
  (
    '39390000-0000-4000-8000-00000003c002',
    test_id ('project_a'),
    'Claim',
    'Two'
  ),
  (
    '39390000-0000-4000-8000-00000003c003',
    test_id ('project_a'),
    'Claim',
    'Three'
  ),
  (
    '39390000-0000-4000-8000-00000003c004',
    test_id ('project_a'),
    'Claim',
    'Four'
  ),
  (
    '39390000-0000-4000-8000-00000003c005',
    test_id ('project_a'),
    'Claim',
    'Five'
  ),
  (
    '39390000-0000-4000-8000-00000003c006',
    test_id ('project_a'),
    'Claim',
    'Six'
  ),
  (
    '39390000-0000-4000-8000-00000003c007',
    test_id ('project_a'),
    'Claim',
    'Seven'
  ),
  (
    '39390000-0000-4000-8000-00000003c008',
    test_id ('project_a'),
    'Claim',
    'Eight'
  ),
  (
    '39390000-0000-4000-8000-00000003c009',
    test_id ('project_a'),
    'Claim',
    'Nine'
  ),
  (
    '39390000-0000-4000-8000-00000003c010',
    test_id ('project_a'),
    'Claim',
    'Ten'
  ),
  (
    '39390000-0000-4000-8000-00000003c011',
    test_id ('project_a'),
    'Claim',
    'Eleven'
  ),
  (
    '39390000-0000-4000-8000-00000003c012',
    test_id ('project_a'),
    'Claim',
    'Twelve'
  );

INSERT INTO
  public.organizations (id, project_id, name)
VALUES
  (
    '39390000-0000-4000-8000-00000003a001',
    test_id ('project_a'),
    '{"en":"Claim Org One"}'::jsonb
  ),
  (
    '39390000-0000-4000-8000-00000003a002',
    test_id ('project_a'),
    '{"en":"Claim Org Two"}'::jsonb
  ),
  (
    '39390000-0000-4000-8000-00000003a003',
    test_id ('project_a'),
    '{"en":"Claim Org Three"}'::jsonb
  ),
  (
    '39390000-0000-4000-8000-00000003a004',
    test_id ('project_a'),
    '{"en":"Claim Org Four"}'::jsonb
  );

INSERT INTO
  public.factions (id, project_id, organization_id, name)
VALUES
  (
    '39390000-0000-4000-8000-00000003f001',
    test_id ('project_a'),
    test_id ('org_a'),
    '{"en":"Claim Faction"}'::jsonb
  );

INSERT INTO
  public.alliances (id, project_id, name)
VALUES
  (
    '39390000-0000-4000-8000-00000003d001',
    test_id ('project_a'),
    '{"en":"Claim Alliance"}'::jsonb
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
    '39390000-0000-4000-8000-00000003e001',
    '00000000-0000-0000-0000-000000000000',
    'claim.cand@test.example',
    '',
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '39390000-0000-4000-8000-00000003e002',
    '00000000-0000-0000-0000-000000000000',
    'claim.org@test.example',
    '$2a$10$abcdefghijklmnopqrstuuabcdefghijklmnopqrstuvwxyz0123456',
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '39390000-0000-4000-8000-00000003e003',
    '00000000-0000-0000-0000-000000000000',
    'claim.faction@test.example',
    '',
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '39390000-0000-4000-8000-00000003e004',
    '00000000-0000-0000-0000-000000000000',
    'claim.alliance@test.example',
    '',
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '39390000-0000-4000-8000-00000003e005',
    '00000000-0000-0000-0000-000000000000',
    'claim.pe@test.example',
    '',
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '39390000-0000-4000-8000-00000003e006',
    '00000000-0000-0000-0000-000000000000',
    'claim.pa@test.example',
    '',
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '39390000-0000-4000-8000-00000003e007',
    '00000000-0000-0000-0000-000000000000',
    'stranger@test.example',
    '$2a$10$abcdefghijklmnopqrstuuabcdefghijklmnopqrstuvwxyz0123456',
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '39390000-0000-4000-8000-00000003e008',
    '00000000-0000-0000-0000-000000000000',
    'claim.unconfirmed@test.example',
    NULL,
    'authenticated',
    'authenticated',
    NULL,
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '39390000-0000-4000-8000-00000003e009',
    '00000000-0000-0000-0000-000000000000',
    'stale.row@test.example',
    '',
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '39390000-0000-4000-8000-00000003e010',
    '00000000-0000-0000-0000-000000000000',
    'claim.expired@test.example',
    '',
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '39390000-0000-4000-8000-00000003e011',
    '00000000-0000-0000-0000-000000000000',
    'claim.otherproject@test.example',
    '',
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '39390000-0000-4000-8000-00000003e012',
    '00000000-0000-0000-0000-000000000000',
    'pend.first@test.example',
    '',
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '39390000-0000-4000-8000-00000003e013',
    '00000000-0000-0000-0000-000000000000',
    'pend.second@test.example',
    '',
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '39390000-0000-4000-8000-00000003e014',
    '00000000-0000-0000-0000-000000000000',
    'd19@test.example',
    '',
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '39390000-0000-4000-8000-00000003e015',
    '00000000-0000-0000-0000-000000000000',
    'd19.editor@test.example',
    '',
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '39390000-0000-4000-8000-00000003e016',
    '00000000-0000-0000-0000-000000000000',
    'd19.held@test.example',
    '',
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '39390000-0000-4000-8000-00000003e017',
    '00000000-0000-0000-0000-000000000000',
    'd19.moved@test.example',
    '',
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '39390000-0000-4000-8000-00000003e018',
    '00000000-0000-0000-0000-000000000000',
    'seeder.kept@test.example',
    '',
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '39390000-0000-4000-8000-00000003e019',
    '00000000-0000-0000-0000-000000000000',
    'seeder.gone@test.example',
    '',
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

-- Grants held before any claim: two invitees already hold something, so "the grants held before" is not the empty set for every shape; one user edits the seventh candidate; one already holds the grant an invitation promises on the ninth.
INSERT INTO
  public.grants (user_id, scope, target_type, target_id, role)
VALUES
  (
    '39390000-0000-4000-8000-00000003e001',
    'entity',
    'candidate',
    '39390000-0000-4000-8000-00000003c012',
    'editor'
  ),
  (
    '39390000-0000-4000-8000-00000003e005',
    'project',
    NULL,
    test_id ('project_b'),
    'editor'
  ),
  (
    '39390000-0000-4000-8000-00000003e015',
    'entity',
    'candidate',
    '39390000-0000-4000-8000-00000003c007',
    'editor'
  ),
  (
    '39390000-0000-4000-8000-00000003e016',
    'entity',
    'candidate',
    '39390000-0000-4000-8000-00000003c009',
    'editor'
  );

-- One invitation of each admitted shape, each for a different user, so that no shape masks another; and the five of Section 11, none of which may be claimed.
DO $$
BEGIN
  PERFORM public.create_invitations(
    test_id('project_a'),
    '[
      {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000003c001","email":"claim.cand@test.example"},
      {"target_type":"organization","target_id":"39390000-0000-4000-8000-00000003a001","email":"claim.org@test.example"},
      {"target_type":"faction","target_id":"39390000-0000-4000-8000-00000003f001","email":"claim.faction@test.example"},
      {"target_type":"alliance","target_id":"39390000-0000-4000-8000-00000003d001","email":"claim.alliance@test.example"},
      {"scope":"project","role":"editor","email":"claim.pe@test.example"},
      {"scope":"project","role":"admin","email":"claim.pa@test.example"},
      {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000003c002","email":"claim.nobody@test.example"},
      {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000003c003","email":"claim.unconfirmed@test.example"},
      {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000003c004","email":"claim.stale@test.example"},
      {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000003c005","email":"claim.expired@test.example","expires_at":"2000-01-01T00:00:00Z"},
      {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000003c006","email":"claim.otherproject@test.example"}
    ]'::jsonb,
    true
  );
END;
$$;

-- What public.grants holds before the first claim.
CREATE TEMPORARY TABLE t39_grants_before AS
SELECT
  g.user_id,
  g.scope::text AS scope,
  g.target_type::text AS target_type,
  g.target_id,
  g.role::text AS role
FROM
  public.grants g;

-- The six rows the six claims below must add, and nothing else.
CREATE TEMPORARY TABLE t39_grants_promised (user_id, scope, target_type, target_id, role) AS
VALUES
  (
    '39390000-0000-4000-8000-00000003e001'::uuid,
    'entity',
    'candidate',
    '39390000-0000-4000-8000-00000003c001'::uuid,
    'editor'
  ),
  (
    '39390000-0000-4000-8000-00000003e002'::uuid,
    'entity',
    'organization',
    '39390000-0000-4000-8000-00000003a001'::uuid,
    'editor'
  ),
  (
    '39390000-0000-4000-8000-00000003e003'::uuid,
    'entity',
    'faction',
    '39390000-0000-4000-8000-00000003f001'::uuid,
    'editor'
  ),
  (
    '39390000-0000-4000-8000-00000003e004'::uuid,
    'entity',
    'alliance',
    '39390000-0000-4000-8000-00000003d001'::uuid,
    'editor'
  ),
  (
    '39390000-0000-4000-8000-00000003e005'::uuid,
    'project',
    NULL,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    'editor'
  ),
  (
    '39390000-0000-4000-8000-00000003e006'::uuid,
    'project',
    NULL,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    'admin'
  );

-- A candidate's editor.
SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e001',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')),
    '{"claimed":[{"scope":"entity","target_type":"candidate","target_id":"39390000-0000-4000-8000-00000003c001","role":"editor"}],"skipped":[]}'::jsonb,
    'the invited candidate editor''s claim returns the one promised specification and nothing else: no address, no code and no invitation id'
  );

SELECT
  reset_role ();

SELECT
  bag_eq (
    $$SELECT g.scope::text, g.target_type::text, g.target_id, g.role::text FROM public.grants g WHERE g.user_id = '39390000-0000-4000-8000-00000003e001'$$,
    $$SELECT b.scope, b.target_type, b.target_id, b.role FROM t39_grants_before b WHERE b.user_id = '39390000-0000-4000-8000-00000003e001' UNION ALL SELECT p.scope, p.target_type, p.target_id, p.role FROM t39_grants_promised p WHERE p.user_id = '39390000-0000-4000-8000-00000003e001'$$,
    'that user''s grants are the one held before plus exactly the promised candidate editor''s grant'
  );

-- An organization's editor.
SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e002',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')),
    '{"claimed":[{"scope":"entity","target_type":"organization","target_id":"39390000-0000-4000-8000-00000003a001","role":"editor"}],"skipped":[]}'::jsonb,
    'the invited organization editor''s claim returns the one promised specification and nothing else'
  );

SELECT
  reset_role ();

SELECT
  bag_eq (
    $$SELECT g.scope::text, g.target_type::text, g.target_id, g.role::text FROM public.grants g WHERE g.user_id = '39390000-0000-4000-8000-00000003e002'$$,
    $$SELECT p.scope, p.target_type, p.target_id, p.role FROM t39_grants_promised p WHERE p.user_id = '39390000-0000-4000-8000-00000003e002'$$,
    'that user, who held nothing, holds exactly the promised organization editor''s grant'
  );

-- A faction's editor.
SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e003',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')),
    '{"claimed":[{"scope":"entity","target_type":"faction","target_id":"39390000-0000-4000-8000-00000003f001","role":"editor"}],"skipped":[]}'::jsonb,
    'the invited faction editor''s claim returns the one promised specification and nothing else'
  );

SELECT
  reset_role ();

SELECT
  bag_eq (
    $$SELECT g.scope::text, g.target_type::text, g.target_id, g.role::text FROM public.grants g WHERE g.user_id = '39390000-0000-4000-8000-00000003e003'$$,
    $$SELECT p.scope, p.target_type, p.target_id, p.role FROM t39_grants_promised p WHERE p.user_id = '39390000-0000-4000-8000-00000003e003'$$,
    'that user, who held nothing, holds exactly the promised faction editor''s grant'
  );

-- An alliance's editor.
SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e004',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')),
    '{"claimed":[{"scope":"entity","target_type":"alliance","target_id":"39390000-0000-4000-8000-00000003d001","role":"editor"}],"skipped":[]}'::jsonb,
    'the invited alliance editor''s claim returns the one promised specification and nothing else'
  );

SELECT
  reset_role ();

SELECT
  bag_eq (
    $$SELECT g.scope::text, g.target_type::text, g.target_id, g.role::text FROM public.grants g WHERE g.user_id = '39390000-0000-4000-8000-00000003e004'$$,
    $$SELECT p.scope, p.target_type, p.target_id, p.role FROM t39_grants_promised p WHERE p.user_id = '39390000-0000-4000-8000-00000003e004'$$,
    'that user, who held nothing, holds exactly the promised alliance editor''s grant'
  );

-- A project editor.
SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e005',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')),
    '{"claimed":[{"scope":"project","target_type":null,"target_id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"editor"}],"skipped":[]}'::jsonb,
    'the invited project editor''s claim returns the one promised specification and nothing else'
  );

SELECT
  reset_role ();

SELECT
  bag_eq (
    $$SELECT g.scope::text, g.target_type::text, g.target_id, g.role::text FROM public.grants g WHERE g.user_id = '39390000-0000-4000-8000-00000003e005'$$,
    $$SELECT b.scope, b.target_type, b.target_id, b.role FROM t39_grants_before b WHERE b.user_id = '39390000-0000-4000-8000-00000003e005' UNION ALL SELECT p.scope, p.target_type, p.target_id, p.role FROM t39_grants_promised p WHERE p.user_id = '39390000-0000-4000-8000-00000003e005'$$,
    'that user''s grants are the one held before, on the other project, plus exactly the promised project editor''s grant'
  );

-- A project admin.
SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e006',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')),
    '{"claimed":[{"scope":"project","target_type":null,"target_id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"admin"}],"skipped":[]}'::jsonb,
    'the invited project admin''s claim returns the one promised specification and nothing else'
  );

SELECT
  reset_role ();

SELECT
  bag_eq (
    $$SELECT g.scope::text, g.target_type::text, g.target_id, g.role::text FROM public.grants g WHERE g.user_id = '39390000-0000-4000-8000-00000003e006'$$,
    $$SELECT p.scope, p.target_type, p.target_id, p.role FROM t39_grants_promised p WHERE p.user_id = '39390000-0000-4000-8000-00000003e006'$$,
    'that user, who held nothing, holds exactly the promised project admin''s grant'
  );

SELECT
  bag_eq (
    $$SELECT g.user_id, g.scope::text, g.target_type::text, g.target_id, g.role::text FROM public.grants g$$,
    $$SELECT b.user_id, b.scope, b.target_type, b.target_id, b.role FROM t39_grants_before b UNION ALL SELECT p.user_id, p.scope, p.target_type, p.target_id, p.role FROM t39_grants_promised p$$,
    'after the six claims public.grants holds the rows it held before plus the six promised rows, for every user and not only for the six'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        public.invitations i
        JOIN auth.users u ON u.id = i.claimed_by
      WHERE
        i.project_id = test_id ('project_a')
        AND i.email LIKE 'claim.%'
        AND i.email = u.email
        AND i.claimed_at IS NOT NULL
    ),
    6,
    'each of the six invitations is stamped with its claimant and the time of the claim'
  );

-- =====================================================================
-- Section 11: nobody else
-- =====================================================================
-- A confirmed user with another address.
SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e007',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')),
    '{"claimed":[],"skipped":[]}'::jsonb,
    'a confirmed user whose address no invitation names claims nothing'
  );

-- The invited address on a user whose email_confirmed_at is null.
SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e008',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')),
    '{"claimed":[],"skipped":[]}'::jsonb,
    'the invited address on a user whose email_confirmed_at is null claims nothing'
  );

-- The invited address in the token's email claim, on a user whose row of auth.users holds another address.
SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e009',
    '[]'::jsonb
  );

DO $$
BEGIN
  PERFORM set_config(
    'request.jwt.claims',
    (current_setting('request.jwt.claims')::jsonb || '{"email":"claim.stale@test.example"}'::jsonb)::text,
    true
  );
END;
$$;

SELECT
  is (
    (
      SELECT
        (auth.jwt () ->> 'email') || ' ' || (public.claim_invitations (test_id ('project_a')))::text
    ),
    'claim.stale@test.example {"claimed": [], "skipped": []}',
    'a token whose email claim carries the invited address claims nothing while the user''s row holds another address: the claim reads the table, never the token'
  );

-- An expired invitation, for its own confirmed address.
SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e010',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')),
    '{"claimed":[],"skipped":[]}'::jsonb,
    'an expired invitation is not claimed by the confirmed user it names'
  );

-- The same call a second time.
SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e001',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')),
    '{"claimed":[],"skipped":[]}'::jsonb,
    'a second call by a user who has claimed returns an empty list'
  );

-- The other project.
SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e011',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_b')),
    '{"claimed":[],"skipped":[]}'::jsonb,
    'a call for the other project claims nothing of an invitation that belongs to this one'
  );

SELECT
  reset_role ();

SELECT
  bag_eq (
    $$SELECT g.user_id, g.scope::text, g.target_type::text, g.target_id, g.role::text FROM public.grants g$$,
    $$SELECT b.user_id, b.scope, b.target_type, b.target_id, b.role FROM t39_grants_before b UNION ALL SELECT p.user_id, p.scope, p.target_type, p.target_id, p.role FROM t39_grants_promised p$$,
    'none of the six calls wrote a grant: public.grants holds what it held after Section 10'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        public.invitations i
      WHERE
        i.project_id = test_id ('project_a')
        AND i.email IN (
          'claim.nobody@test.example',
          'claim.unconfirmed@test.example',
          'claim.stale@test.example',
          'claim.expired@test.example',
          'claim.otherproject@test.example'
        )
        AND i.claimed_at IS NULL
        AND i.claimed_by IS NULL
    ),
    5,
    'the five invitations nobody proved are still open'
  );

-- =====================================================================
-- Section 12: the pending address
-- =====================================================================
DO $$
BEGIN
  PERFORM set_config(
    't39.pend',
    public.create_invitations(test_id('project_a'), '[{"target_type":"organization","target_id":"39390000-0000-4000-8000-00000003a002"}]'::jsonb, true)::text,
    true
  );
END;
$$;

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e012',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')),
    '{"claimed":[],"skipped":[]}'::jsonb,
    'a code row with no pending address is claimed by nobody'
  );

SELECT
  reset_role ();

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      ' Pend.First@Test.Example ',
      current_setting('t39.pend')::jsonb -> 0 ->> 'code'
    ),
    'pend.first@test.example',
    'a link request with the code binds the first address and answers with it, trimmed and lower-cased'
  );

SELECT
  reset_role ();

-- The rebinding interval has passed.
UPDATE public.invitations
SET
  pending_email_at = now() - interval '2 minutes'
WHERE
  id = (current_setting('t39.pend')::jsonb -> 0 ->> 'id')::uuid;

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'pend.second@test.example',
      current_setting('t39.pend')::jsonb -> 0 ->> 'code'
    ),
    'pend.second@test.example',
    'a later link request with the same code replaces the pending address'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e012',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')),
    '{"claimed":[],"skipped":[]}'::jsonb,
    'the user whose address was bound earlier and since replaced claims nothing'
  );

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e013',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')),
    '{"claimed":[{"scope":"entity","target_type":"organization","target_id":"39390000-0000-4000-8000-00000003a002","role":"editor"}],"skipped":[]}'::jsonb,
    'the user whose confirmed address is the pending address claims the code row'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        (i.pending_email IS NULL)::text || ' ' || (i.pending_email_at IS NULL)::text || ' ' || (i.claimed_at IS NOT NULL)::text || ' ' || i.claimed_by::text
      FROM
        public.invitations i
      WHERE
        i.id = (current_setting('t39.pend')::jsonb -> 0 ->> 'id')::uuid
    ),
    'true true true 39390000-0000-4000-8000-00000003e013',
    'after the claim the row is stamped with its claimant and its pending address is cleared'
  );

-- =====================================================================
-- Section 13: each row by itself
-- =====================================================================
-- Three open rows for one address: a candidate another user already edits, a free candidate and an organization. One row for a grant its user already holds. One row whose candidate is then moved to the other project.
DO $$
BEGIN
  PERFORM public.create_invitations(
    test_id('project_a'),
    '[
      {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000003c007","email":"d19@test.example"},
      {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000003c008","email":"d19@test.example"},
      {"target_type":"organization","target_id":"39390000-0000-4000-8000-00000003a003","email":"d19@test.example"},
      {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000003c009","email":"d19.held@test.example"},
      {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000003c010","email":"d19.moved@test.example"}
    ]'::jsonb,
    true
  );
END;
$$;

UPDATE public.candidates
SET
  project_id = test_id ('project_b')
WHERE
  id = '39390000-0000-4000-8000-00000003c010';

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e014',
    '[]'::jsonb
  );

SELECT
  is (
    (
      SELECT
        jsonb_build_object(
          'claimed',
          (
            SELECT
              jsonb_agg(
                e
                ORDER BY
                  e ->> 'target_id'
              )
            FROM
              jsonb_array_elements(r.result -> 'claimed') AS e
          ),
          'skipped',
          r.result -> 'skipped'
        )
      FROM
        (
          SELECT
            public.claim_invitations (test_id ('project_a')) AS result
        ) AS r
    ),
    '{"claimed":[{"scope":"entity","target_type":"organization","target_id":"39390000-0000-4000-8000-00000003a003","role":"editor"},{"scope":"entity","target_type":"candidate","target_id":"39390000-0000-4000-8000-00000003c008","role":"editor"}],"skipped":[{"scope":"entity","target_type":"candidate","target_id":"39390000-0000-4000-8000-00000003c007","role":"editor","reason":"candidate_has_editor"}]}'::jsonb,
    'of three rows for one address two are claimed, and the candidate another user edits is skipped with the reason candidate_has_editor'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        i.claimed_at IS NULL
        AND i.claimed_by IS NULL
      FROM
        public.invitations i
      WHERE
        i.email = 'd19@test.example'
        AND i.target_id = '39390000-0000-4000-8000-00000003c007'
    ),
    true,
    'the skipped row stays open'
  );

SELECT
  bag_eq (
    $$SELECT g.scope::text, g.target_type::text, g.target_id, g.role::text FROM public.grants g WHERE g.user_id = '39390000-0000-4000-8000-00000003e014'$$,
    $$VALUES ('entity', 'candidate', '39390000-0000-4000-8000-00000003c008'::uuid, 'editor'), ('entity', 'organization', '39390000-0000-4000-8000-00000003a003'::uuid, 'editor')$$,
    'the caller holds the two claimed grants and not the skipped one'
  );

SELECT
  is (
    (
      SELECT
        string_agg(g.user_id::text, ',')
      FROM
        public.grants g
      WHERE
        g.target_id = '39390000-0000-4000-8000-00000003c007'
    ),
    '39390000-0000-4000-8000-00000003e015',
    'the candidate keeps its one editor'
  );

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e016',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')),
    '{"claimed":[{"scope":"entity","target_type":"candidate","target_id":"39390000-0000-4000-8000-00000003c009","role":"editor"}],"skipped":[]}'::jsonb,
    'an invitation for a grant its user already holds on a candidate is returned as claimed, not skipped as a candidate another user edits'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        (i.claimed_at IS NOT NULL)::text || ' ' || i.claimed_by::text
      FROM
        public.invitations i
      WHERE
        i.email = 'd19.held@test.example'
    ),
    'true 39390000-0000-4000-8000-00000003e016',
    'that row is marked claimed'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        public.grants g
      WHERE
        g.target_id = '39390000-0000-4000-8000-00000003c009'
    ),
    1,
    'and the candidate has one grant afterwards, not two'
  );

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e017',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')),
    '{"claimed":[],"skipped":[{"scope":"entity","target_type":"candidate","target_id":"39390000-0000-4000-8000-00000003c010","role":"editor","reason":"target_not_in_project"}]}'::jsonb,
    'an entity-scope row whose candidate was moved to the other project is skipped with the reason target_not_in_project'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        (i.claimed_at IS NULL)::text || ' ' || (
          SELECT
            count(*)
          FROM
            public.grants g
          WHERE
            g.user_id = '39390000-0000-4000-8000-00000003e017'
        )::text
      FROM
        public.invitations i
      WHERE
        i.email = 'd19.moved@test.example'
    ),
    'true 0',
    'that row stays open and its user holds no grant'
  );

-- =====================================================================
-- Section 14: the answer holds no fact about the account
-- =====================================================================
-- Each of these three calls claims nothing. The claim answers only what it claimed and skipped; whether the account holds a password is get_caller_account_state's answer, asked here of the same three accounts.
SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e001',
    '[]'::jsonb
  );

SELECT
  is (
    ARRAY(
      SELECT
        jsonb_object_keys(public.claim_invitations (test_id ('project_a')))
      ORDER BY
        1
    ) || ARRAY[
      public.get_caller_account_state () ->> 'password_set'
    ],
    ARRAY['claimed', 'skipped', 'false'],
    'the claim answers exactly claimed and skipped, and the account state says no password for a user whose encrypted_password is the empty string'
  );

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e002',
    '[]'::jsonb
  );

SELECT
  is (
    ARRAY(
      SELECT
        jsonb_object_keys(public.claim_invitations (test_id ('project_a')))
      ORDER BY
        1
    ) || ARRAY[
      public.get_caller_account_state () ->> 'password_set'
    ],
    ARRAY['claimed', 'skipped', 'true'],
    'the claim answers exactly claimed and skipped, and the account state says a password for a user whose encrypted_password holds a hash'
  );

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e008',
    '[]'::jsonb
  );

SELECT
  is (
    ARRAY(
      SELECT
        jsonb_object_keys(public.claim_invitations (test_id ('project_a')))
      ORDER BY
        1
    ) || ARRAY[
      public.get_caller_account_state () ->> 'password_set'
    ],
    ARRAY['claimed', 'skipped', 'false'],
    'the claim answers exactly claimed and skipped, and the account state says no password for a user whose encrypted_password is null'
  );

SELECT
  reset_role ();

-- =====================================================================
-- Section 15: the seeder's authority is asked when the row is written, and not again
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-0000000000e1',
    '[]'::jsonb
  );

SELECT
  lives_ok (
    $$SELECT public.create_invitations(test_id('project_a'), '[{"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000003c011","email":"seeder.kept@test.example"}]', true)$$,
    'a project editor seeds an entity editor''s promise'
  );

SELECT
  reset_role ();

-- The seeder loses the grant the promise needed.
DELETE FROM public.grants
WHERE
  user_id = '39390000-0000-4000-8000-0000000000e1';

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-0000000000e1',
    '[]'::jsonb
  );

SELECT
  throws_ok (
    $$SELECT public.create_invitations(test_id('project_a'), '[{"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000003c012","email":"seeder.late@test.example"}]', true)$$,
    '42501',
    'new row violates row-level security policy for table "invitations"',
    'the demoted seeder can promise nothing more'
  );

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e018',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')),
    '{"claimed":[{"scope":"entity","target_type":"candidate","target_id":"39390000-0000-4000-8000-00000003c011","role":"editor"}],"skipped":[]}'::jsonb,
    'the promise of a seeder who has since lost the authority to make it is still honoured'
  );

SELECT
  reset_role ();

SELECT
  bag_eq (
    $$SELECT g.scope::text, g.target_type::text, g.target_id, g.role::text FROM public.grants g WHERE g.user_id = '39390000-0000-4000-8000-00000003e018'$$,
    $$VALUES ('entity', 'candidate', '39390000-0000-4000-8000-00000003c011'::uuid, 'editor')$$,
    'and the invitee holds exactly the promised grant'
  );

-- A promise an admin deletes before it is claimed.
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

SELECT
  lives_ok (
    $$SELECT public.create_invitations(test_id('project_a'), '[{"target_type":"organization","target_id":"39390000-0000-4000-8000-00000003a004","email":"seeder.gone@test.example"}]', true)$$,
    'a project admin seeds a second promise'
  );

WITH
  d AS (
    DELETE FROM public.invitations
    WHERE
      email = 'seeder.gone@test.example'
    RETURNING
      id
  )
SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        d
    ),
    1,
    'the project admin deletes that promise before it is claimed'
  );

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e019',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')),
    '{"claimed":[],"skipped":[]}'::jsonb,
    'the invitee of a deleted promise claims nothing: both lists are empty'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        public.grants g
      WHERE
        g.user_id = '39390000-0000-4000-8000-00000003e019'
    ),
    0,
    'and holds no grant'
  );

-- The project editor of project A holds their grant again, as the preamble wrote it.
INSERT INTO
  public.grants (user_id, scope, target_type, target_id, role)
VALUES
  (
    '39390000-0000-4000-8000-0000000000e1',
    'project',
    NULL,
    test_id ('project_a'),
    'editor'
  );

SELECT
  *
FROM
  finish ();

ROLLBACK;
