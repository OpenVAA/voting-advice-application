-- 39c-invitations-service-helpers.test.sql: the service-side invitation helpers, as behaviour
--
-- An invitation promises one grant to whoever proves control of its address or presents its code. This file asserts the helpers the service role calls: the three answers of the code check and that a used code stays used, who may be mailed a sign-in link, the limits and how a slot is given back, the completion witness, and that no API role can execute a helper or touch its tables.
--
-- A REFUSAL NAMES ITS SQLSTATE AND ITS MESSAGE, because the three kinds of refusal here are different controls. `new row violates row-level security policy` is the authority map. `permission denied for table` is a column or table privilege, checked before any policy. A message naming a constraint is a rule that binds every role, the service role included.
--
-- THE IDENTITIES. The fixture provides the project admin, the account admin, the root admin and the entity editor; their grant rows are written by test_seed_fixture_grants. This file adds a project editor of project A and one of project B. Every session passes an empty array to set_test_user, so each claim is projected from public.grants and from nowhere else.
--
-- THE ENTITIES. Every entity of the fixture's project A is already confirmed, so the cases about confirmation use this file's own unconfirmed rows.
--
-- Depends on: 00-helpers.test.sql (set_test_user, reset_role, create_test_data, test_id, test_user_id, test_seed_fixture_grants), 305-invitations.sql (the table, its trigger, privileges and policies), 300-auth-tables.sql (cleanup_grants_on_delete, which also deletes an entity's invitations), 506-invitation-rpcs.sql (create_invitations, claim_invitations, the four invitation_ helpers, recovery_link_request, the throttle and its key helpers), ../fixtures/invitation-link-witness.psql (the witness and its two functions, which 00z-invitation-link-witness.test.sql installs), 102-entities.sql and 011-validation-functions.sql (the confirmation flag and its gate).
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (86);

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
-- Section 16: the used code
-- =====================================================================
-- The entities, users, grants and invitations of Sections 16 to 21. The helpers are the service role's, so every call of one below is made as that role; time is moved by the fixture role, which rewrites a window's start or a row's `pending_email_at`.
INSERT INTO
  public.candidates (id, project_id, first_name, last_name)
VALUES
  (
    '39390000-0000-4000-8000-00000004c001',
    test_id ('project_a'),
    'Code',
    'One'
  ),
  (
    '39390000-0000-4000-8000-00000004c002',
    test_id ('project_a'),
    'Code',
    'Two'
  ),
  (
    '39390000-0000-4000-8000-00000004c003',
    test_id ('project_a'),
    'Code',
    'Three'
  ),
  (
    '39390000-0000-4000-8000-00000004c004',
    test_id ('project_a'),
    'Code',
    'Four'
  ),
  (
    '39390000-0000-4000-8000-00000004c005',
    test_id ('project_a'),
    'Code',
    'Five'
  ),
  (
    '39390000-0000-4000-8000-00000004c006',
    test_id ('project_a'),
    'Code',
    'Six'
  ),
  (
    '39390000-0000-4000-8000-00000004c007',
    test_id ('project_a'),
    'Code',
    'Seven'
  ),
  (
    '39390000-0000-4000-8000-00000004c008',
    test_id ('project_a'),
    'Code',
    'Eight'
  ),
  (
    '39390000-0000-4000-8000-00000004c009',
    test_id ('project_a'),
    'Code',
    'Nine'
  ),
  (
    '39390000-0000-4000-8000-00000004c0b1',
    test_id ('project_b'),
    'Code',
    'Elsewhere'
  );

INSERT INTO
  public.organizations (id, project_id, name)
VALUES
  (
    '39390000-0000-4000-8000-00000004a001',
    test_id ('project_a'),
    '{"en":"Code Org"}'::jsonb
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
    '39390000-0000-4000-8000-00000004e001',
    '00000000-0000-0000-0000-000000000000',
    'code.claimant@test.example',
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
    '39390000-0000-4000-8000-00000004e002',
    '00000000-0000-0000-0000-000000000000',
    'code.other@test.example',
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
    '39390000-0000-4000-8000-00000004e003',
    '00000000-0000-0000-0000-000000000000',
    'mail.pgrant@test.example',
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
    '39390000-0000-4000-8000-00000004e004',
    '00000000-0000-0000-0000-000000000000',
    'mail.egrant@test.example',
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
    '39390000-0000-4000-8000-00000004e005',
    '00000000-0000-0000-0000-000000000000',
    'mail.unconfirmed@test.example',
    '',
    'authenticated',
    'authenticated',
    NULL,
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '39390000-0000-4000-8000-00000004e006',
    '00000000-0000-0000-0000-000000000000',
    'mail.root@test.example',
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
    '39390000-0000-4000-8000-00000004e007',
    '00000000-0000-0000-0000-000000000000',
    'mail.account@test.example',
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
    '39390000-0000-4000-8000-00000004e008',
    '00000000-0000-0000-0000-000000000000',
    'mail.otherproject@test.example',
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
    '39390000-0000-4000-8000-00000004e009',
    '00000000-0000-0000-0000-000000000000',
    'code.keeper@test.example',
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
    '39390000-0000-4000-8000-00000004e010',
    '00000000-0000-0000-0000-000000000000',
    'code.ten@test.example',
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
    '39390000-0000-4000-8000-00000004e003',
    'project',
    NULL,
    test_id ('project_a'),
    'editor'
  ),
  (
    '39390000-0000-4000-8000-00000004e004',
    'entity',
    'candidate',
    '39390000-0000-4000-8000-00000004c003',
    'editor'
  ),
  (
    '39390000-0000-4000-8000-00000004e005',
    'entity',
    'candidate',
    '39390000-0000-4000-8000-00000004c004',
    'editor'
  ),
  (
    '39390000-0000-4000-8000-00000004e006',
    'global',
    NULL,
    NULL,
    'admin'
  ),
  (
    '39390000-0000-4000-8000-00000004e007',
    'account',
    NULL,
    test_id ('account_a'),
    'admin'
  ),
  (
    '39390000-0000-4000-8000-00000004e008',
    'project',
    NULL,
    test_id ('project_b'),
    'editor'
  );

-- The rows of project A, by their index in `t39.h`: 0 the code that is claimed and whose claimant is then deleted; 1 an expired code; 2 the code whose claimant asks for a link; 3 the code that is bound twice; 4 the code whose claimant is looked up ten times; 5 the code that is bound, released and bound again; 6 and 7 two email rows. `t39.hb` holds one code row of project B.
DO $$
BEGIN
  PERFORM set_config(
    't39.h',
    public.create_invitations(
      test_id('project_a'),
      '[
        {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000004c001"},
        {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000004c002","expires_at":"2000-01-01T00:00:00Z"},
        {"target_type":"organization","target_id":"39390000-0000-4000-8000-00000004a001"},
        {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000004c006"},
        {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000004c007"},
        {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000004c009"},
        {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000004c005","email":"mail.invited@test.example"},
        {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000004c008","email":"release.mail@test.example"}
      ]'::jsonb,
      true
    )::text,
    true
  );
  PERFORM set_config(
    't39.hb',
    public.create_invitations(
      test_id('project_b'),
      '[{"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000004c0b1"}]'::jsonb,
      true
    )::text,
    true
  );
END;
$$;

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_code_status (
      test_id ('project_a'),
      current_setting('t39.h')::jsonb -> 0 ->> 'code'
    ),
    'valid',
    'an open code answers valid'
  );

SELECT
  is (
    public.invitation_code_status (
      test_id ('project_a'),
      lower(
        replace(
          current_setting('t39.h')::jsonb -> 0 ->> 'code',
          '-',
          ' '
        )
      )
    ),
    'valid',
    'the same code typed in lower case with spaces answers the same'
  );

SELECT
  is (
    public.invitation_code_status (test_id ('project_a'), 'ZZZZ-ZZZZ-ZZZZ'),
    'unknown',
    'a string that names no code answers unknown'
  );

SELECT
  is (
    public.invitation_code_status (
      test_id ('project_a'),
      current_setting('t39.h')::jsonb -> 1 ->> 'code'
    ),
    'unknown',
    'an expired unclaimed code answers unknown'
  );

SELECT
  is (
    public.invitation_code_status (
      test_id ('project_a'),
      current_setting('t39.hb')::jsonb -> 0 ->> 'code'
    ) || ' ' || public.invitation_code_status (
      test_id ('project_b'),
      current_setting('t39.hb')::jsonb -> 0 ->> 'code'
    ),
    'unknown valid',
    'the code of the other project answers unknown here and valid there'
  );

-- Three codes are bound, each to its own address, and claimed by the user who holds that address.
SELECT
  is (
    ARRAY[
      public.invitation_link_request (
        test_id ('project_a'),
        'code.claimant@test.example',
        current_setting('t39.h')::jsonb -> 0 ->> 'code'
      ),
      public.invitation_link_request (
        test_id ('project_a'),
        'code.keeper@test.example',
        current_setting('t39.h')::jsonb -> 2 ->> 'code'
      ),
      public.invitation_link_request (
        test_id ('project_a'),
        'code.ten@test.example',
        current_setting('t39.h')::jsonb -> 4 ->> 'code'
      )
    ],
    ARRAY[
      'code.claimant@test.example',
      'code.keeper@test.example',
      'code.ten@test.example'
    ],
    'three valid codes are each bound to an address, and each request answers with that address'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000004e001',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')) -> 'claimed',
    '[{"scope":"entity","target_type":"candidate","target_id":"39390000-0000-4000-8000-00000004c001","role":"editor"}]'::jsonb,
    'the user who proved the bound address claims the first code'
  );

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000004e009',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')) -> 'claimed',
    '[{"scope":"entity","target_type":"organization","target_id":"39390000-0000-4000-8000-00000004a001","role":"editor"}]'::jsonb,
    'the second code is claimed by its own user'
  );

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000004e010',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')) -> 'claimed',
    '[{"scope":"entity","target_type":"candidate","target_id":"39390000-0000-4000-8000-00000004c007","role":"editor"}]'::jsonb,
    'the third code is claimed by its own user'
  );

SELECT
  reset_role ();

-- Every window opened so far has ended, so what follows starts with free slots.
UPDATE private.access_throttle
SET
  window_start = now() - interval '2 minutes';

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_code_status (
      test_id ('project_a'),
      current_setting('t39.h')::jsonb -> 0 ->> 'code'
    ) || ' ' || public.invitation_code_status (
      test_id ('project_a'),
      lower(
        replace(
          current_setting('t39.h')::jsonb -> 0 ->> 'code',
          '-',
          ' '
        )
      )
    ),
    'used used',
    'after the claim the code answers used, however it is typed'
  );

SELECT
  reset_role ();

-- The claimant is deleted.
DELETE FROM auth.users
WHERE
  id = '39390000-0000-4000-8000-00000004e001';

SELECT
  is (
    (
      SELECT
        (i.claimed_by IS NULL)::text || ' ' || (i.claimed_at IS NOT NULL)::text
      FROM
        public.invitations i
      WHERE
        i.id = (current_setting('t39.h')::jsonb -> 0 ->> 'id')::uuid
    ),
    'true true',
    'after the claimant is deleted the row reads claimed_by null and claimed_at set'
  );

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_code_status (
      test_id ('project_a'),
      current_setting('t39.h')::jsonb -> 0 ->> 'code'
    ),
    'used',
    'and the code still answers used: deleting the claimant does not reopen it'
  );

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'code.other@test.example',
      current_setting('t39.h')::jsonb -> 0 ->> 'code'
    ),
    NULL,
    'a link request with the used code and another address answers null'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        (i.pending_email IS NULL)::text || ' ' || (i.pending_email_at IS NULL)::text
      FROM
        public.invitations i
      WHERE
        i.id = (current_setting('t39.h')::jsonb -> 0 ->> 'id')::uuid
    ),
    'true true',
    'and binds nothing: the used row''s pending address is still null'
  );

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000004e002',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')),
    '{"claimed":[],"skipped":[]}'::jsonb,
    'the user with that other address claims nothing: a used code grants nothing a second time'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

WITH
  d AS (
    DELETE FROM public.invitations
    WHERE
      id = (current_setting('t39.h')::jsonb -> 0 ->> 'id')::uuid
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
    0,
    'a project admin''s DELETE of the used code''s row removes nothing'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        (
          SELECT
            count(*)
          FROM
            public.invitations i
          WHERE
            i.id = (current_setting('t39.h')::jsonb -> 0 ->> 'id')::uuid
            AND i.claimed_at IS NOT NULL
        )::text || ' ' || (
          SELECT
            count(*)
          FROM
            public.grants g
          WHERE
            g.user_id = '39390000-0000-4000-8000-00000004e002'
        )::text
    ),
    '1 0',
    'the used row is still there, and the other user holds no grant'
  );

-- =====================================================================
-- Section 17: who may be mailed
-- =====================================================================
DO $$
BEGIN
  PERFORM set_config(
    't39.throttle_before',
    (SELECT count(*)::text FROM private.access_throttle),
    true
  );
END;
$$;

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'nobody.at.all@test.example'
    ),
    NULL,
    'an address the project knows nothing of answers null'
  );

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'mail.otherproject@test.example'
    ),
    NULL,
    'the confirmed address of an editor of the other project answers null'
  );

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'mail.unconfirmed@test.example'
    ),
    NULL,
    'the address of a grant holder whose email_confirmed_at is null answers null'
  );

SELECT
  is (
    public.invitation_link_request (test_id ('project_a'), '   ') IS NULL
    AND public.invitation_link_request (test_id ('project_a')) IS NULL
    AND public.invitation_link_request (NULL, 'mail.invited@test.example') IS NULL,
    true,
    'a blank address, no address and no project each answer null'
  );

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'whoever@test.example',
      'ZZZZ-ZZZZ-ZZZZ'
    ) IS NULL
    AND public.invitation_link_request (
      test_id ('project_a'),
      'whoever@test.example',
      current_setting('t39.h')::jsonb -> 1 ->> 'code'
    ) IS NULL
    AND public.invitation_link_request (
      test_id ('project_a'),
      'whoever@test.example',
      current_setting('t39.hb')::jsonb -> 0 ->> 'code'
    ) IS NULL
    AND public.invitation_link_request (
      test_id ('project_a'),
      '  ',
      current_setting('t39.h')::jsonb -> 3 ->> 'code'
    ) IS NULL,
    true,
    'a code that names nothing, an expired code, the code of the other project, and a valid code with a blank address each answer null'
  );

SELECT
  is (
    public.invitation_code_claimant_email (test_id ('project_a'), 'ZZZZ-ZZZZ-ZZZZ') IS NULL
    AND public.invitation_code_claimant_email (
      test_id ('project_a'),
      current_setting('t39.h')::jsonb -> 3 ->> 'code'
    ) IS NULL
    AND public.invitation_code_claimant_email (
      test_id ('project_a'),
      current_setting('t39.h')::jsonb -> 0 ->> 'code'
    ) IS NULL,
    true,
    'the claimant look-up answers null for an unknown code, for an open code and for a used code whose claimant is gone'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        count(*)::text
      FROM
        private.access_throttle
    ),
    current_setting('t39.throttle_before'),
    'none of those refusals wrote a throttle key: no slot is taken for an address no mail would go to, and nothing is counted for a code that names no claimant'
  );

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      '  Mail.Invited@Test.Example '
    ),
    'mail.invited@test.example',
    'an address with an open invitation in the project answers with the address, trimmed and lower-cased'
  );

SELECT
  is (
    public.invitation_link_request (test_id ('project_a'), 'mail.pgrant@test.example'),
    'mail.pgrant@test.example',
    'the confirmed address of a user who holds a project-scope grant on the project answers with the address'
  );

SELECT
  is (
    public.invitation_link_request (test_id ('project_a'), 'mail.egrant@test.example'),
    'mail.egrant@test.example',
    'the confirmed address of a user who holds an entity-scope grant on an entity of the project answers with the address'
  );

SELECT
  is (
    public.invitation_link_request (test_id ('project_a'), 'mail.root@test.example'),
    'mail.root@test.example',
    'the confirmed address of a root admin who holds no grant in the project answers with the address, a global grant reaching every project'
  );

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'mail.account@test.example'
    ),
    'mail.account@test.example',
    'the confirmed address of an admin of the project''s account, who holds no grant in the project, answers with the address'
  );

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'code.other@test.example',
      current_setting('t39.h')::jsonb -> 2 ->> 'code'
    ),
    'code.keeper@test.example',
    'a used code whose claimant exists answers with the claimant''s own address, whatever address was typed'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        (i.pending_email IS NULL)::text || ' ' || (i.pending_email_at IS NULL)::text
      FROM
        public.invitations i
      WHERE
        i.id = (current_setting('t39.h')::jsonb -> 2 ->> 'id')::uuid
    ),
    'true true',
    'and the typed address is bound to nothing: a used code cannot be bound to another address'
  );

UPDATE private.access_throttle
SET
  window_start = now() - interval '2 minutes'
WHERE
  key LIKE 'link:%';

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      NULL,
      current_setting('t39.h')::jsonb -> 2 ->> 'code'
    ),
    'code.keeper@test.example',
    'a used code with no address answers with its claimant''s address'
  );

SELECT
  reset_role ();

DELETE FROM auth.users
WHERE
  id = '39390000-0000-4000-8000-00000004e009';

UPDATE private.access_throttle
SET
  window_start = now() - interval '2 minutes'
WHERE
  key LIKE 'link:%';

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      NULL,
      current_setting('t39.h')::jsonb -> 2 ->> 'code'
    ),
    NULL,
    'and null once the claimant is deleted'
  );

-- =====================================================================
-- Section 18: the limits
-- =====================================================================
-- One mail per address per 60 seconds.
SELECT
  is (
    public.invitation_link_request (test_id ('project_a'), 'mail.pgrant@test.example'),
    'mail.pgrant@test.example',
    'a first request in a new window answers with the address'
  );

SELECT
  is (
    public.invitation_link_request (test_id ('project_a'), 'mail.pgrant@test.example'),
    NULL,
    'a second request for the same address inside 60 seconds answers null'
  );

SELECT
  reset_role ();

UPDATE private.access_throttle
SET
  window_start = now() - interval '61 seconds'
WHERE
  key = 'link:' || test_id ('project_a')::text || ':' || encode(
    sha256(convert_to('mail.pgrant@test.example', 'UTF8')),
    'hex'
  );

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_link_request (test_id ('project_a'), 'mail.pgrant@test.example'),
    'mail.pgrant@test.example',
    'a third request, once the window''s start is 61 seconds old, answers with the address again'
  );

-- One rebinding per code per 60 seconds.
SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'bind.one@test.example',
      current_setting('t39.h')::jsonb -> 3 ->> 'code'
    ),
    'bind.one@test.example',
    'a first binding of a code answers with the address'
  );

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'bind.two@test.example',
      current_setting('t39.h')::jsonb -> 3 ->> 'code'
    ),
    NULL,
    'a second binding of the same code inside 60 seconds answers null'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        i.pending_email || ' ' || (
          SELECT
            count(*)
          FROM
            private.access_throttle t
          WHERE
            t.key = 'link:' || test_id ('project_a')::text || ':' || encode(
              sha256(convert_to('bind.two@test.example', 'UTF8')),
              'hex'
            )
        )::text
      FROM
        public.invitations i
      WHERE
        i.id = (current_setting('t39.h')::jsonb -> 3 ->> 'id')::uuid
    ),
    'bind.one@test.example 0',
    'the refused binding leaves the pending address unchanged and takes no slot for the second address'
  );

UPDATE public.invitations
SET
  pending_email_at = now() - interval '61 seconds'
WHERE
  id = (current_setting('t39.h')::jsonb -> 3 ->> 'id')::uuid;

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'bind.two@test.example',
      current_setting('t39.h')::jsonb -> 3 ->> 'code'
    ),
    'bind.two@test.example',
    'once the binding is 61 seconds old the code is bound to the second address'
  );

-- Ten claimant look-ups per used code per fifteen minutes.
SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        generate_series(1, 10) AS n
      WHERE
        public.invitation_code_claimant_email (
          test_id ('project_a'),
          current_setting('t39.h')::jsonb -> 4 ->> 'code'
        ) = 'code.ten@test.example'
    ),
    10,
    'ten claimant look-ups of a used code each answer with the claimant''s address'
  );

SELECT
  is (
    public.invitation_code_claimant_email (
      test_id ('project_a'),
      current_setting('t39.h')::jsonb -> 4 ->> 'code'
    ),
    NULL,
    'the eleventh answers null, as an unknown code does'
  );

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      NULL,
      current_setting('t39.h')::jsonb -> 4 ->> 'code'
    ),
    'code.ten@test.example',
    'a link request with that code is still answered with the claimant''s address: it reads the claimant without counting against the look-up budget'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        t.count::text || ' ' || (t.window_start < now())::text
      FROM
        private.access_throttle t
      WHERE
        t.key = 'link:' || test_id ('project_a')::text || ':' || encode(
          sha256(convert_to('code.ten@test.example', 'UTF8')),
          'hex'
        )
    ),
    '1 false',
    'and it is bounded by the claimant''s address slot instead, which it took afresh'
  );

UPDATE private.access_throttle
SET
  window_start = now() - interval '16 minutes'
WHERE
  key = 'code:' || test_id ('project_a')::text || ':' || (
    SELECT
      i.code_hash
    FROM
      public.invitations i
    WHERE
      i.id = (current_setting('t39.h')::jsonb -> 4 ->> 'id')::uuid
  );

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_code_claimant_email (
      test_id ('project_a'),
      current_setting('t39.h')::jsonb -> 4 ->> 'code'
    ),
    'code.ten@test.example',
    'once the window''s start is sixteen minutes old the look-up answers again'
  );

-- =====================================================================
-- Section 19: the slot is given back
-- =====================================================================
SELECT
  is (
    ARRAY[
      public.invitation_link_request (
        test_id ('project_a'),
        'release.mail@test.example'
      ),
      public.invitation_link_request (
        test_id ('project_a'),
        'release.mail@test.example'
      )
    ],
    ARRAY['release.mail@test.example', NULL],
    'a request takes its address''s slot, and a second request finds it taken'
  );

SELECT
  lives_ok (
    $$SELECT public.invitation_link_release(test_id('project_a'), '  Release.Mail@Test.Example ')$$,
    'the slot is given back'
  );

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'release.mail@test.example'
    ),
    'release.mail@test.example',
    'the next request answers with the address again, with no time moved'
  );

SELECT
  is (
    ARRAY[
      public.invitation_link_request (
        test_id ('project_a'),
        'release.code@test.example',
        current_setting('t39.h')::jsonb -> 5 ->> 'code'
      ),
      public.invitation_link_request (
        test_id ('project_a'),
        'release.code@test.example',
        current_setting('t39.h')::jsonb -> 5 ->> 'code'
      )
    ],
    ARRAY['release.code@test.example', NULL],
    'a code is bound to an address, and the same binding asked again at once answers null'
  );

SELECT
  lives_ok (
    $$SELECT public.invitation_link_release(test_id('project_a'), 'release.code@test.example', current_setting('t39.h')::jsonb -> 5 ->> 'code')$$,
    'the binding''s slot and clock are given back'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        i.pending_email || ' ' || (i.pending_email_at IS NULL)::text
      FROM
        public.invitations i
      WHERE
        i.id = (current_setting('t39.h')::jsonb -> 5 ->> 'id')::uuid
    ),
    'release.code@test.example true',
    'the release keeps the pending address and clears only the time it was bound'
  );

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'release.code@test.example',
      current_setting('t39.h')::jsonb -> 5 ->> 'code'
    ),
    'release.code@test.example',
    'the same code and address are bound again at once'
  );

SELECT
  reset_role ();

-- A release that has nothing to give back, and one that names a claimed row's code.
DO $$
BEGIN
  PERFORM set_config(
    't39.digest_before',
    (SELECT md5(coalesce(string_agg(t::text, '|' ORDER BY t.key), '')) FROM private.access_throttle t)
      || ' ' || (SELECT md5(coalesce(string_agg(i::text, '|' ORDER BY i.id), '')) FROM public.invitations i),
    true
  );
END;
$$;

SET
  LOCAL ROLE service_role;

SELECT
  lives_ok (
    $$SELECT public.invitation_link_release(test_id('project_a'), 'never.asked@test.example'), public.invitation_link_release(test_id('project_a'), 'never.asked@test.example', current_setting('t39.h')::jsonb -> 4 ->> 'code'), public.invitation_link_release(test_id('project_a'), NULL), public.invitation_link_release(NULL, 'never.asked@test.example')$$,
    'a release for an address that holds no slot raises nothing, with or without a claimed row''s code'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        md5(
          coalesce(
            string_agg(
              t::text,
              '|'
              ORDER BY
                t.key
            ),
            ''
          )
        )
      FROM
        private.access_throttle t
    ) || ' ' || (
      SELECT
        md5(
          coalesce(
            string_agg(
              i::text,
              '|'
              ORDER BY
                i.id
            ),
            ''
          )
        )
      FROM
        public.invitations i
    ),
    current_setting('t39.digest_before'),
    'and writes nothing: every throttle key and every invitation row, the claimed one included, is unchanged'
  );

-- =====================================================================
-- Section 20: the witness
-- =====================================================================
-- A record opened more than a day ago, which the next open removes.
INSERT INTO
  private.invitation_link_witness (id, opened_at)
VALUES
  (
    '39390000-0000-4000-8000-000000050001',
    now() - interval '2 days'
  );

SET
  LOCAL ROLE service_role;

SELECT
  lives_ok (
    $$SELECT set_config('t39.witness', public.invitation_link_witness_open()::text, true)$$,
    'the service role opens a witness and receives its id'
  );

SELECT
  is (
    public.invitation_link_witness (current_setting('t39.witness')::uuid),
    NULL,
    'an open witness reads null'
  );

SELECT
  is (
    public.invitation_link_witness (current_setting('t39.witness')::uuid, 'sent'),
    'sent',
    'completing it with sent reads sent'
  );

SELECT
  is (
    public.invitation_link_witness (current_setting('t39.witness')::uuid, 'not-sent') || ' ' || public.invitation_link_witness (current_setting('t39.witness')::uuid),
    'sent sent',
    'a second completion with not-sent leaves it sent'
  );

SELECT
  set_config(
    't39.witness_2',
    public.invitation_link_witness_open ()::text,
    true
  );

SELECT
  is (
    public.invitation_link_witness (
      current_setting('t39.witness_2')::uuid,
      'not-sent'
    ),
    'not-sent',
    'another witness completed with not-sent reads not-sent'
  );

SELECT
  is (
    public.invitation_link_witness ('39390000-0000-4000-8000-000000050002', 'sent'),
    NULL,
    'completing an id that was never opened answers null'
  );

SELECT
  throws_ok (
    format(
      $$SELECT public.invitation_link_witness('%s', 'maybe')$$,
      current_setting('t39.witness')
    ),
    '22023',
    'invitation_link_witness: p_outcome must be sent or not-sent',
    'an outcome other than the two words is refused'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        private.invitation_link_witness w
      WHERE
        w.id IN (
          '39390000-0000-4000-8000-000000050001',
          '39390000-0000-4000-8000-000000050002'
        )
    ),
    0,
    'the witness table holds no row for the id that was never opened, and the record opened two days ago is gone'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          w.outcome || ' ' || (w.completed_at IS NOT NULL)::text,
          ', '
          ORDER BY
            w.outcome
        )
      FROM
        private.invitation_link_witness w
      WHERE
        w.id IN (
          current_setting('t39.witness')::uuid,
          current_setting('t39.witness_2')::uuid
        )
    ),
    'not-sent true, sent true',
    'the table holds exactly the two records the service role opened, each completed once'
  );

-- =====================================================================
-- Section 21: exposure
-- =====================================================================
SELECT
  is (
    (
      SELECT
        string_agg(
          p.proname || ' ' || has_function_privilege('anon', p.oid, 'EXECUTE')::text || '/' || has_function_privilege('authenticated', p.oid, 'EXECUTE')::text || '/' || has_function_privilege('service_role', p.oid, 'EXECUTE')::text,
          ', '
          ORDER BY
            p.proname
        )
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'public'
        AND (
          p.proname LIKE 'invitation\_%'
          OR p.proname IN ('recovery_link_request', 'access_caller_take')
        )
    ),
    'access_caller_take false/false/true, invitation_code_claimant_email false/false/true, invitation_code_status false/false/true, invitation_link_release false/false/true, invitation_link_request false/false/true, invitation_link_witness false/false/true, invitation_link_witness_open false/false/true, recovery_link_request false/false/true',
    'the eight helpers, each with one signature, are executable by service_role and by neither anon nor authenticated'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          p.proname || ' ' || has_function_privilege('anon', p.oid, 'EXECUTE')::text || '/' || has_function_privilege('authenticated', p.oid, 'EXECUTE')::text,
          ', '
          ORDER BY
            p.proname
        )
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'private'
        AND p.proname IN (
          'access_throttle_take',
          'email_hash',
          'email_holds_allowed_invitation',
          'email_link_slot_key',
          'email_link_slots_take',
          'invitation_is_open',
          'project_contestant_app_closed',
          'user_password_set'
        )
    ),
    'access_throttle_take false/false, email_hash false/false, email_holds_allowed_invitation false/false, email_link_slot_key false/false, email_link_slots_take false/false, invitation_is_open false/false, project_contestant_app_closed false/false, user_password_set false/false',
    'the throttle, its key helpers, the open-invitation helpers, the Contestant App switch and the password fact are executable by neither anon nor authenticated'
  );

SELECT
  is (
    (
      SELECT
        count(*)::text || ' ' || bool_and(
          p.prosecdef
          AND p.proconfig::text = '{"search_path=\"\""}'
        )::text
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        (
          n.nspname = 'public'
          AND (
            p.proname LIKE 'invitation\_%'
            OR p.proname IN (
              'access_caller_take',
              'claim_invitations',
              'cleanup_access_throttle_on_delete',
              'recovery_link_request'
            )
          )
        )
        OR (
          n.nspname = 'private'
          AND p.proname IN ('access_throttle_take', 'user_password_set')
        )
    ),
    '12 true',
    'each of the twelve functions is SECURITY DEFINER with an empty pinned search_path'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          c.relname || ' ' || c.relrowsecurity::text || ' ' || (
            SELECT
              count(*)
            FROM
              (
                VALUES
                  ('anon'),
                  ('authenticated'),
                  ('service_role')
              ) AS r (rolname)
            WHERE
              has_table_privilege(
                r.rolname,
                c.oid,
                'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER'
              )
              OR has_any_column_privilege(
                r.rolname,
                c.oid,
                'SELECT, INSERT, UPDATE, REFERENCES'
              )
          )::text,
          ', '
          ORDER BY
            c.relname
        )
      FROM
        pg_class c
      WHERE
        c.oid IN (
          'private.access_throttle'::regclass,
          'private.identity_registrations'::regclass,
          'private.invitation_link_witness'::regclass
        )
    ),
    'access_throttle true 0, identity_registrations true 0, invitation_link_witness true 0',
    'the three private tables have row-level security enabled, and neither anon, authenticated nor service_role holds any privilege on any of them'
  );

SELECT
  set_test_user ('anon');

SELECT
  throws_ok (
    'SELECT public.' || v.call,
    '42501',
    'permission denied for function ' || v.name,
    'anon calling ' || v.name || ' is refused'
  )
FROM
  (
    VALUES
      (
        1,
        'invitation_code_status',
        'invitation_code_status(NULL, NULL)'
      ),
      (
        2,
        'invitation_link_request',
        'invitation_link_request(NULL, NULL, NULL)'
      ),
      (
        3,
        'invitation_link_release',
        'invitation_link_release(NULL, NULL, NULL)'
      ),
      (
        4,
        'invitation_code_claimant_email',
        'invitation_code_claimant_email(NULL, NULL)'
      ),
      (
        5,
        'invitation_link_witness_open',
        'invitation_link_witness_open()'
      ),
      (
        6,
        'invitation_link_witness',
        'invitation_link_witness(NULL, NULL)'
      ),
      (
        7,
        'recovery_link_request',
        'recovery_link_request(NULL, NULL)'
      )
  ) AS v (
    ord,
    name,
    call
  )
ORDER BY
  v.ord;

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

SELECT
  throws_ok (
    'SELECT public.' || v.call,
    '42501',
    'permission denied for function ' || v.name,
    'a project admin calling ' || v.name || ' as authenticated is refused'
  )
FROM
  (
    VALUES
      (
        1,
        'invitation_code_status',
        'invitation_code_status(NULL, NULL)'
      ),
      (
        2,
        'invitation_link_request',
        'invitation_link_request(NULL, NULL, NULL)'
      ),
      (
        3,
        'invitation_link_release',
        'invitation_link_release(NULL, NULL, NULL)'
      ),
      (
        4,
        'invitation_code_claimant_email',
        'invitation_code_claimant_email(NULL, NULL)'
      ),
      (
        5,
        'invitation_link_witness_open',
        'invitation_link_witness_open()'
      ),
      (
        6,
        'invitation_link_witness',
        'invitation_link_witness(NULL, NULL)'
      ),
      (
        7,
        'recovery_link_request',
        'recovery_link_request(NULL, NULL)'
      )
  ) AS v (
    ord,
    name,
    call
  )
ORDER BY
  v.ord;

SELECT
  reset_role ();

-- Deleting an invitation deletes its throttle keys: the slot of an email row's address, the slot of a code row's pending address, and the look-up count of a used code. The used row is deleted with its candidate, since no API role can delete it directly.
SELECT
  is (
    (
      SELECT
        string_agg(
          split_part(t.key, ':', 1),
          ','
          ORDER BY
            t.key
        )
      FROM
        private.access_throttle t
      WHERE
        t.key IN (
          'link:' || test_id ('project_a')::text || ':' || encode(
            sha256(convert_to('release.mail@test.example', 'UTF8')),
            'hex'
          ),
          'link:' || test_id ('project_a')::text || ':' || encode(
            sha256(convert_to('bind.two@test.example', 'UTF8')),
            'hex'
          ),
          'code:' || test_id ('project_a')::text || ':' || (
            SELECT
              i.code_hash
            FROM
              public.invitations i
            WHERE
              i.id = (current_setting('t39.h')::jsonb -> 4 ->> 'id')::uuid
          )
        )
    ),
    'code,link,link',
    'before the deletes the three keys exist'
  );

DO $$
BEGIN
  PERFORM set_config(
    't39.code_key',
    'code:' || test_id('project_a')::text || ':' || (SELECT i.code_hash FROM public.invitations i WHERE i.id = (current_setting('t39.h')::jsonb -> 4 ->> 'id')::uuid),
    true
  );
END;
$$;

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

WITH
  d AS (
    DELETE FROM public.invitations
    WHERE
      id IN (
        (current_setting('t39.h')::jsonb -> 3 ->> 'id')::uuid,
        (current_setting('t39.h')::jsonb -> 7 ->> 'id')::uuid
      )
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
    2,
    'a project admin deletes the open email row and the open code row'
  );

SELECT
  lives_ok (
    $$DELETE FROM public.candidates WHERE id = '39390000-0000-4000-8000-00000004c007'$$,
    'and deletes the candidate whose used code''s row goes with it'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        private.access_throttle t
      WHERE
        t.key IN (
          'link:' || test_id ('project_a')::text || ':' || encode(
            sha256(convert_to('release.mail@test.example', 'UTF8')),
            'hex'
          ),
          'link:' || test_id ('project_a')::text || ':' || encode(
            sha256(convert_to('bind.two@test.example', 'UTF8')),
            'hex'
          ),
          current_setting('t39.code_key')
        )
    ),
    0,
    'deleting an invitation removes its link: and code: keys'
  );

SELECT
  is (
    (
      SELECT
        t.tgrelid::regclass::text || ' ' || t.tgtype::text
      FROM
        pg_trigger t
      WHERE
        t.tgname = 'cleanup_access_throttle'
        AND NOT t.tgisinternal
    ),
    'invitations 9',
    'the cleanup trigger is an AFTER DELETE row trigger on invitations'
  );

SELECT
  *
FROM
  finish ();

ROLLBACK;
