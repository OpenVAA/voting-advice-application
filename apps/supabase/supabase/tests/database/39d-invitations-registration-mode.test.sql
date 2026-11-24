-- 39d-invitations-registration-mode.test.sql: the registration-mode condition of the invitation model, as behaviour
--
-- An invitation promises one grant to whoever proves control of its address or presents its code. This file asserts the registration-mode condition: that an open invitation of a candidate or an organization is honoured only while the project allows its mode for that type, in the code check, the link request and the claim, and that nothing else is judged.
--
-- A REFUSAL NAMES ITS SQLSTATE AND ITS MESSAGE, because the three kinds of refusal here are different controls. `new row violates row-level security policy` is the authority map. `permission denied for table` is a column or table privilege, checked before any policy. A message naming a constraint is a rule that binds every role, the service role included.
--
-- THE IDENTITIES. The fixture provides the project admin, the account admin, the root admin and the entity editor; their grant rows are written by test_seed_fixture_grants. This file adds a project editor of project A and one of project B. Every session passes an empty array to set_test_user, so each claim is projected from public.grants and from nowhere else.
--
-- THE ENTITIES. Every entity of the fixture's project A is already confirmed, so the cases about confirmation use this file's own unconfirmed rows.
--
-- Depends on: 00-helpers.test.sql (set_test_user, reset_role, create_test_data, test_id, test_user_id, test_seed_fixture_grants), 305-invitations.sql (the table, its trigger, privileges and policies), 300-auth-tables.sql (cleanup_grants_on_delete, which also deletes an entity's invitations), 506-invitation-rpcs.sql (create_invitations, claim_invitations, the invitation_ helpers and the registration-mode condition), 301-auth-functions.sql and 106-app-settings.sql (the two readers of the registration-mode matrix and the settings row they read), 102-entities.sql and 011-validation-functions.sql (the confirmation flag and its gate).
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (34);

-- Create test fixture data
SELECT
  create_test_data ();

SELECT
  test_seed_fixture_grants ();

-- Both projects serve candidates and organizations and allow every registration mode for each, so an entity invitation of either type is honoured until the section below switches modes off and on.
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
-- Section 22: the registration-mode condition
-- =====================================================================
-- An open invitation of a candidate or an organization is honoured only while the project allows its mode for its target's type: `code` for a row bound to a code, `email` for a row bound to an address. A row that is not honoured is treated as absent, in the code check, the link request and the claim alike. Every refusal below is followed by the same call with the mode on again, so no refusal is one the call would have given anyway.
--
-- The rows of project A, by their index in `t39.m`: 0 the open candidate code; 1 the candidate code that is claimed while its mode is on; 2 an organization's email row; 3 a project-scope promise; 4 a faction's row; 5 an alliance's row. `t39.md` holds a candidate's code row and an organization's email row of project D, which has no settings row when they are seeded.
UPDATE private.access_throttle
SET
  window_start = now() - interval '2 minutes';

INSERT INTO
  public.candidates (id, project_id, first_name, last_name)
VALUES
  (
    '39390000-0000-4000-8000-00000005c001',
    test_id ('project_a'),
    'Mode',
    'One'
  ),
  (
    '39390000-0000-4000-8000-00000005c002',
    test_id ('project_a'),
    'Mode',
    'Two'
  ),
  (
    '39390000-0000-4000-8000-00000005c003',
    test_id ('project_a'),
    'Mode',
    'Three'
  );

INSERT INTO
  public.organizations (id, project_id, name)
VALUES
  (
    '39390000-0000-4000-8000-00000005a001',
    test_id ('project_a'),
    '{"en":"Mode Org"}'::jsonb
  );

INSERT INTO
  public.factions (id, project_id, organization_id, name)
VALUES
  (
    '39390000-0000-4000-8000-00000005f001',
    test_id ('project_a'),
    test_id ('org_a'),
    '{"en":"Mode Faction"}'::jsonb
  );

INSERT INTO
  public.alliances (id, project_id, name)
VALUES
  (
    '39390000-0000-4000-8000-00000005d001',
    test_id ('project_a'),
    '{"en":"Mode Alliance"}'::jsonb
  );

INSERT INTO
  public.projects (id, account_id, name)
VALUES
  (
    '39390000-0000-4000-8000-0000000005f1',
    test_id ('account_a'),
    'Project D'
  );

INSERT INTO
  public.candidates (id, project_id, first_name, last_name)
VALUES
  (
    '39390000-0000-4000-8000-00000005c0d1',
    '39390000-0000-4000-8000-0000000005f1',
    'Mode',
    'Elsewhere'
  );

INSERT INTO
  public.organizations (id, project_id, name)
VALUES
  (
    '39390000-0000-4000-8000-00000005a0d1',
    '39390000-0000-4000-8000-0000000005f1',
    '{"en":"Mode Org Elsewhere"}'::jsonb
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
SELECT
  u.id::uuid,
  '00000000-0000-0000-0000-000000000000',
  u.email,
  '',
  'authenticated',
  'authenticated',
  now(),
  '{}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
FROM
  (
    VALUES
      (
        '39390000-0000-4000-8000-00000005e001',
        'mode.code@test.example'
      ),
      (
        '39390000-0000-4000-8000-00000005e002',
        'mode.claimed@test.example'
      ),
      (
        '39390000-0000-4000-8000-00000005e003',
        'mode.org@test.example'
      ),
      (
        '39390000-0000-4000-8000-00000005e004',
        'mode.holder@test.example'
      ),
      (
        '39390000-0000-4000-8000-00000005e005',
        'mode.pscope@test.example'
      ),
      (
        '39390000-0000-4000-8000-00000005e006',
        'mode.faction@test.example'
      ),
      (
        '39390000-0000-4000-8000-00000005e007',
        'mode.alliance@test.example'
      )
  ) AS u (id, email);

-- The holder edits a candidate of project A, by a grant written directly.
INSERT INTO
  public.grants (user_id, scope, target_type, target_id, role)
VALUES
  (
    '39390000-0000-4000-8000-00000005e004',
    'entity',
    'candidate',
    '39390000-0000-4000-8000-00000005c003',
    'editor'
  );

DO $$
BEGIN
  PERFORM set_config(
    't39.m',
    public.create_invitations(
      test_id('project_a'),
      '[
        {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000005c001"},
        {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000005c002"},
        {"target_type":"organization","target_id":"39390000-0000-4000-8000-00000005a001","email":"mode.org@test.example"},
        {"scope":"project","role":"editor","email":"mode.pscope@test.example"},
        {"target_type":"faction","target_id":"39390000-0000-4000-8000-00000005f001","email":"mode.faction@test.example"},
        {"target_type":"alliance","target_id":"39390000-0000-4000-8000-00000005d001","email":"mode.alliance@test.example"}
      ]'::jsonb,
      true
    )::text,
    true
  );
  PERFORM set_config(
    't39.md',
    public.create_invitations(
      '39390000-0000-4000-8000-0000000005f1',
      '[
        {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000005c0d1"},
        {"target_type":"organization","target_id":"39390000-0000-4000-8000-00000005a0d1","email":"mode.nomatrix@test.example"}
      ]'::jsonb,
      true
    )::text,
    true
  );
END;
$$;

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        public.invitations i
      WHERE
        i.project_id = '39390000-0000-4000-8000-0000000005f1'
        AND i.claimed_at IS NULL
    ),
    2,
    'MODE: seeding is not judged: create_invitations writes a candidate''s code row and an organization''s email row in a project that allows neither mode'
  );

-- With every mode on, the second code is bound and claimed.
SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'mode.claimed@test.example',
      current_setting('t39.m')::jsonb -> 1 ->> 'code'
    ),
    'mode.claimed@test.example',
    'MODE: with every mode on, a candidate''s open code is bound to an address'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000005e002',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')) -> 'claimed',
    '[{"scope":"entity","target_type":"candidate","target_id":"39390000-0000-4000-8000-00000005c002","role":"editor"}]'::jsonb,
    'MODE: and the user who holds that address claims it'
  );

SELECT
  reset_role ();

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_code_status (
      test_id ('project_a'),
      current_setting('t39.m')::jsonb -> 1 ->> 'code'
    ),
    'used',
    'MODE: the claimed code answers used while the code mode is on'
  );

SELECT
  reset_role ();

-- Every window opened so far has ended. No window is moved again before the code mode is back on, so a slot taken by a refused request would still be held then.
UPDATE private.access_throttle
SET
  window_start = now() - interval '2 minutes';

-- The code mode is switched off for candidates.
UPDATE app_settings
SET
  settings = jsonb_set(
    settings,
    '{contestantApp,servedEntityTypes,candidate,registrationModes}',
    '["identity_provider", "email"]'::jsonb
  )
WHERE
  project_id = test_id ('project_a');

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_code_status (
      test_id ('project_a'),
      current_setting('t39.m')::jsonb -> 0 ->> 'code'
    ),
    'unknown',
    'MODE: with the code mode off for candidates, an open candidate code answers unknown'
  );

SELECT
  is (
    public.invitation_code_status (
      test_id ('project_a'),
      current_setting('t39.m')::jsonb -> 1 ->> 'code'
    ),
    'used',
    'MODE: a claimed candidate code still answers used with the code mode off'
  );

SELECT
  is (
    ARRAY[
      public.invitation_code_status (
        test_id ('project_a'),
        current_setting('t39.m')::jsonb -> 0 ->> 'code'
      ),
      public.invitation_code_status (
        test_id ('project_a'),
        current_setting('t39.m')::jsonb -> 0 ->> 'code'
      ),
      public.invitation_code_status (
        test_id ('project_a'),
        current_setting('t39.m')::jsonb -> 1 ->> 'code'
      ),
      public.invitation_code_status (
        test_id ('project_a'),
        current_setting('t39.m')::jsonb -> 1 ->> 'code'
      )
    ],
    ARRAY['unknown', 'unknown', 'used', 'used'],
    'MODE: the same code checked twice gives the same answer both times, the open code and the claimed one alike'
  );

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'mode.code@test.example',
      current_setting('t39.m')::jsonb -> 0 ->> 'code'
    ),
    NULL,
    'MODE: a link request with that open code and an address answers null'
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
        i.id = (current_setting('t39.m')::jsonb -> 0 ->> 'id')::uuid
    ),
    'true true',
    'MODE: and binds nothing: the row''s pending address is still unset'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        private.access_throttle t
      WHERE
        t.key = 'link:' || test_id ('project_a')::text || ':' || encode(
          sha256(convert_to('mode.code@test.example', 'UTF8')),
          'hex'
        )
    ),
    0,
    'MODE: and writes no throttle key for the address'
  );

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'mode.elsewhere@test.example',
      current_setting('t39.m')::jsonb -> 1 ->> 'code'
    ),
    'mode.claimed@test.example',
    'MODE: a link request with the claimed code still answers its claimant''s own address with the code mode off'
  );

SELECT
  reset_role ();

-- The code mode is switched on again.
UPDATE app_settings
SET
  settings = jsonb_set(
    settings,
    '{contestantApp,servedEntityTypes,candidate,registrationModes}',
    '["identity_provider", "email", "code"]'::jsonb
  )
WHERE
  project_id = test_id ('project_a');

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_code_status (
      test_id ('project_a'),
      current_setting('t39.m')::jsonb -> 0 ->> 'code'
    ) || ' ' || public.invitation_code_status (
      test_id ('project_a'),
      current_setting('t39.m')::jsonb -> 1 ->> 'code'
    ),
    'valid used',
    'MODE: with the code mode on again the same open code answers valid, and the claimed one used as before'
  );

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'mode.code@test.example',
      current_setting('t39.m')::jsonb -> 0 ->> 'code'
    ),
    'mode.code@test.example',
    'MODE: and a link request made in the same minute answers the address, so the refused request had left the slot free'
  );

SELECT
  reset_role ();

-- The code mode is switched off again, with the open code now bound to that address.
UPDATE app_settings
SET
  settings = jsonb_set(
    settings,
    '{contestantApp,servedEntityTypes,candidate,registrationModes}',
    '["identity_provider", "email"]'::jsonb
  )
WHERE
  project_id = test_id ('project_a');

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000005e001',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')),
    '{"claimed":[],"skipped":[]}'::jsonb,
    'MODE: with the code mode off, the user whose address is the open code row''s pending address claims nothing, and the row is neither claimed nor skipped'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        (i.claimed_at IS NULL)::text || ' ' || COALESCE(i.pending_email, '') || ' ' || (
          SELECT
            count(*)
          FROM
            public.grants g
          WHERE
            g.user_id = '39390000-0000-4000-8000-00000005e001'
        )::text
      FROM
        public.invitations i
      WHERE
        i.id = (current_setting('t39.m')::jsonb -> 0 ->> 'id')::uuid
    ),
    'true mode.code@test.example 0',
    'MODE: and the row is still open with its pending address kept, and the user holds no grant'
  );

UPDATE app_settings
SET
  settings = jsonb_set(
    settings,
    '{contestantApp,servedEntityTypes,candidate,registrationModes}',
    '["identity_provider", "email", "code"]'::jsonb
  )
WHERE
  project_id = test_id ('project_a');

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000005e001',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')) -> 'claimed',
    '[{"scope":"entity","target_type":"candidate","target_id":"39390000-0000-4000-8000-00000005c001","role":"editor"}]'::jsonb,
    'MODE: with the code mode on again the same user claims the same row'
  );

SELECT
  reset_role ();

-- The email mode is switched off for organizations.
UPDATE app_settings
SET
  settings = jsonb_set(
    settings,
    '{contestantApp,servedEntityTypes,organization,registrationModes}',
    '["identity_provider", "code"]'::jsonb
  )
WHERE
  project_id = test_id ('project_a');

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_link_request (test_id ('project_a'), 'mode.org@test.example'),
    NULL,
    'MODE: with the email mode off for organizations, the address of an open organization email invitation answers null'
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
        t.key = 'link:' || test_id ('project_a')::text || ':' || encode(
          sha256(convert_to('mode.org@test.example', 'UTF8')),
          'hex'
        )
    ),
    0,
    'MODE: and writes no throttle key for that address'
  );

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000005e003',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')),
    '{"claimed":[],"skipped":[]}'::jsonb,
    'MODE: and the user who holds that address claims nothing, the row neither claimed nor skipped'
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
            g.user_id = '39390000-0000-4000-8000-00000005e003'
        )::text
      FROM
        public.invitations i
      WHERE
        i.id = (current_setting('t39.m')::jsonb -> 2 ->> 'id')::uuid
    ),
    'true 0',
    'MODE: and the organization''s row is still open, and the user holds no grant'
  );

-- The email mode is switched on again.
UPDATE app_settings
SET
  settings = jsonb_set(
    settings,
    '{contestantApp,servedEntityTypes,organization,registrationModes}',
    '["identity_provider", "email", "code"]'::jsonb
  )
WHERE
  project_id = test_id ('project_a');

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_link_request (test_id ('project_a'), 'mode.org@test.example'),
    'mode.org@test.example',
    'MODE: with the email mode on again the same address is answered, in the same minute'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000005e003',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')) -> 'claimed',
    '[{"scope":"entity","target_type":"organization","target_id":"39390000-0000-4000-8000-00000005a001","role":"editor"}]'::jsonb,
    'MODE: and its user claims the organization''s row'
  );

SELECT
  reset_role ();

-- The matrix allows nothing, for either type.
UPDATE app_settings
SET
  settings = jsonb_set(
    settings,
    '{contestantApp,servedEntityTypes}',
    '{"candidate": {"registrationModes": []}, "organization": {"registrationModes": []}}'::jsonb
  )
WHERE
  project_id = test_id ('project_a');

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_link_request (test_id ('project_a'), 'mode.holder@test.example'),
    'mode.holder@test.example',
    'MODE: under a matrix that allows nothing, a user who holds a grant in the project is answered their own address'
  );

SELECT
  is (
    ARRAY[
      public.invitation_link_request (test_id ('project_a'), 'mode.pscope@test.example'),
      public.invitation_link_request (
        test_id ('project_a'),
        'mode.faction@test.example'
      ),
      public.invitation_link_request (
        test_id ('project_a'),
        'mode.alliance@test.example'
      )
    ],
    ARRAY[
      'mode.pscope@test.example',
      'mode.faction@test.example',
      'mode.alliance@test.example'
    ],
    'MODE: under that matrix the address of a project-scope promise, of a faction''s invitation and of an alliance''s invitation is each answered'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000005e005',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')) -> 'claimed',
    '[{"scope":"project","target_type":null,"target_id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"editor"}]'::jsonb,
    'MODE: under that matrix a project-scope promise is claimed'
  );

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000005e006',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')) -> 'claimed',
    '[{"scope":"entity","target_type":"faction","target_id":"39390000-0000-4000-8000-00000005f001","role":"editor"}]'::jsonb,
    'MODE: and a faction''s invitation is claimed'
  );

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000005e007',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')) -> 'claimed',
    '[{"scope":"entity","target_type":"alliance","target_id":"39390000-0000-4000-8000-00000005d001","role":"editor"}]'::jsonb,
    'MODE: and an alliance''s invitation is claimed'
  );

SELECT
  reset_role ();

-- Project D: no settings row, then a row that stores no matrix, then one that serves both types and allows both modes.
SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_code_status (
      '39390000-0000-4000-8000-0000000005f1',
      current_setting('t39.md')::jsonb -> 0 ->> 'code'
    ) || ' ' || COALESCE(
      public.invitation_link_request (
        '39390000-0000-4000-8000-0000000005f1',
        'mode.nomatrix@test.example'
      ),
      'null'
    ),
    'unknown null',
    'MODE: a project with no settings row honours neither a candidate''s open code nor an organization''s open email invitation'
  );

SELECT
  reset_role ();

INSERT INTO
  app_settings (project_id, settings)
VALUES
  (
    '39390000-0000-4000-8000-0000000005f1',
    '{"theme":"light"}'::jsonb
  );

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_code_status (
      '39390000-0000-4000-8000-0000000005f1',
      current_setting('t39.md')::jsonb -> 0 ->> 'code'
    ) || ' ' || COALESCE(
      public.invitation_link_request (
        '39390000-0000-4000-8000-0000000005f1',
        'mode.nomatrix@test.example'
      ),
      'null'
    ),
    'unknown null',
    'MODE: nor does a project whose settings store no matrix'
  );

SELECT
  reset_role ();

UPDATE app_settings
SET
  settings = '{
    "contestantApp": {
      "servedEntityTypes": {"candidate": {"registrationModes": ["code"]}, "organization": {"registrationModes": ["email"]}}
    }
  }'::jsonb
WHERE
  project_id = '39390000-0000-4000-8000-0000000005f1';

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_code_status (
      '39390000-0000-4000-8000-0000000005f1',
      current_setting('t39.md')::jsonb -> 0 ->> 'code'
    ) || ' ' || COALESCE(
      public.invitation_link_request (
        '39390000-0000-4000-8000-0000000005f1',
        'mode.nomatrix@test.example'
      ),
      'null'
    ),
    'valid mode.nomatrix@test.example',
    'MODE: and once its settings serve both types and allow the two modes, the same code answers valid and the same address is answered'
  );

SELECT
  reset_role ();

-- The three functions behind the condition, read from the catalogue by name.
SELECT
  is (
    (
      SELECT
        string_agg(
          p.proname || ' ' || p.pronargs::text || ' ' || p.provolatile::text || ' ' || p.prosecdef::text,
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
          'registration_mode_allowed_in',
          'registration_mode_allowed',
          'invitation_mode_allowed'
        )
    ),
    'invitation_mode_allowed 1 s false, registration_mode_allowed 3 s true, registration_mode_allowed_in 3 i false',
    'MODE: each of the three functions has one signature: the rule is immutable, the reader of a project''s settings is a stable definer function, and the condition is stable and runs as its caller'
  );

SELECT
  is (
    (
      SELECT
        count(*)::text || ' ' || bool_and(p.proconfig::text = '{"search_path=\"\""}')::text
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'private'
        AND p.proname IN (
          'registration_mode_allowed_in',
          'registration_mode_allowed',
          'invitation_mode_allowed'
        )
    ),
    '3 true',
    'MODE: each of the three runs with an empty search_path and no other setting'
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
          'registration_mode_allowed_in',
          'registration_mode_allowed',
          'invitation_mode_allowed'
        )
    ),
    'invitation_mode_allowed false/false, registration_mode_allowed false/false, registration_mode_allowed_in false/false',
    'MODE: none of the three is executable by anon or by authenticated'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'public'
        AND p.proname IN (
          'registration_mode_allowed_in',
          'registration_mode_allowed',
          'invitation_mode_allowed'
        )
    ),
    0,
    'MODE: none of the three is a public function, so PostgREST publishes none'
  );

SELECT
  *
FROM
  finish ();

ROLLBACK;
