-- 39e-invitations-recovery-identity-provider.test.sql: recovery_link_request and the claim of an identity-provider account, as behaviour
--
-- An invitation promises one grant to whoever proves control of its address or presents its code. This file asserts who may be sent a recovery mail and which: the recovery mail for a grant holder, the sign-in mail for an address that has only an open invitation, nothing for anyone else, on the slot a sign-in request takes and with nothing else written. Section 24 asserts that an account whose app metadata names an identity provider claims nothing, whatever its confirmed address, beside a control of the same shape that claims.
--
-- A REFUSAL NAMES ITS SQLSTATE AND ITS MESSAGE, because the three kinds of refusal here are different controls. `new row violates row-level security policy` is the authority map. `permission denied for table` is a column or table privilege, checked before any policy. A message naming a constraint is a rule that binds every role, the service role included.
--
-- THE IDENTITIES. The fixture provides the project admin, the account admin, the root admin and the entity editor; their grant rows are written by test_seed_fixture_grants. This file adds a project editor of project A and one of project B. Every session passes an empty array to set_test_user, so each claim is projected from public.grants and from nowhere else.
--
-- THE ENTITIES. Every entity of the fixture's project A is already confirmed, so the cases about confirmation use this file's own unconfirmed rows.
--
-- Depends on: 00-helpers.test.sql (set_test_user, reset_role, create_test_data, test_id, test_user_id, test_seed_fixture_grants), 305-invitations.sql (the table, its trigger, privileges and policies), 300-auth-tables.sql (cleanup_grants_on_delete, which also deletes an entity's invitations), 506-invitation-rpcs.sql (create_invitations, claim_invitations, the invitation_ helpers, recovery_link_request, the throttle, the registration-mode condition and the grant-holder test), 301-auth-functions.sql and 106-app-settings.sql (the two readers of the registration-mode matrix and the settings row they read), 102-entities.sql and 011-validation-functions.sql (the confirmation flag and its gate).
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (51);

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
-- Section 23: who may be sent a recovery mail
-- =====================================================================
-- recovery_link_request answers which mail a recovery request for an address earns in a project: `recovery` for the confirmed address of a user who holds a grant there, `sign-in` for an address that has only an open invitation the project's registration modes allow, and null for everything else. An answered request takes the slot a sign-in request for the same address takes. Every refusal below has a request beside it that is answered, so no refusal is one the call would have given anyway.
--
-- The rows of project A, by their index in `t39.r`: 0 the open email invitation of an address that has no account; 1 an expired one; 2 the one a user claims; 3 the one whose address asks for both kinds of mail.
UPDATE private.access_throttle
SET
  window_start = now() - interval '2 minutes';

-- Project A serves both types with every mode on again.
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
  project_id = test_id ('project_a');

INSERT INTO
  public.candidates (id, project_id, first_name, last_name)
SELECT
  c.id::uuid,
  test_id ('project_a'),
  'Recovery',
  c.last_name
FROM
  (
    VALUES
      ('39390000-0000-4000-8000-00000006c001', 'One'),
      ('39390000-0000-4000-8000-00000006c002', 'Two'),
      ('39390000-0000-4000-8000-00000006c003', 'Three'),
      ('39390000-0000-4000-8000-00000006c004', 'Four'),
      ('39390000-0000-4000-8000-00000006c005', 'Five'),
      ('39390000-0000-4000-8000-00000006c006', 'Six'),
      ('39390000-0000-4000-8000-00000006c007', 'Seven')
  ) AS c (id, last_name);

-- Every user's address is confirmed and every user has a password, except where the address says otherwise.
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
  CASE
    WHEN u.email IN (
      'recover.nopassword@test.example',
      'recover.claimant@test.example'
    ) THEN ''
    ELSE '$2a$10$abcdefghijklmnopqrstuuabcdefghijklmnopqrstuvwxyz0123456'
  END,
  'authenticated',
  'authenticated',
  CASE
    WHEN u.email = 'recover.unconfirmed@test.example' THEN NULL
    ELSE now()
  END,
  '{}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
FROM
  (
    VALUES
      (
        '39390000-0000-4000-8000-00000006e001',
        'recover.pgrant@test.example'
      ),
      (
        '39390000-0000-4000-8000-00000006e002',
        'recover.egrant@test.example'
      ),
      (
        '39390000-0000-4000-8000-00000006e003',
        'recover.nopassword@test.example'
      ),
      (
        '39390000-0000-4000-8000-00000006e004',
        'recover.otherproject@test.example'
      ),
      (
        '39390000-0000-4000-8000-00000006e005',
        'recover.unconfirmed@test.example'
      ),
      (
        '39390000-0000-4000-8000-00000006e006',
        'recover.root@test.example'
      ),
      (
        '39390000-0000-4000-8000-00000006e007',
        'recover.account@test.example'
      ),
      (
        '39390000-0000-4000-8000-00000006e008',
        'recover.claimant@test.example'
      )
  ) AS u (id, email);

INSERT INTO
  public.grants (user_id, scope, target_type, target_id, role)
VALUES
  (
    '39390000-0000-4000-8000-00000006e001',
    'project',
    NULL,
    test_id ('project_a'),
    'editor'
  ),
  (
    '39390000-0000-4000-8000-00000006e002',
    'entity',
    'candidate',
    '39390000-0000-4000-8000-00000006c001',
    'editor'
  ),
  (
    '39390000-0000-4000-8000-00000006e003',
    'entity',
    'candidate',
    '39390000-0000-4000-8000-00000006c006',
    'editor'
  ),
  (
    '39390000-0000-4000-8000-00000006e004',
    'project',
    NULL,
    test_id ('project_b'),
    'editor'
  ),
  (
    '39390000-0000-4000-8000-00000006e005',
    'entity',
    'candidate',
    '39390000-0000-4000-8000-00000006c005',
    'editor'
  ),
  (
    '39390000-0000-4000-8000-00000006e006',
    'global',
    NULL,
    NULL,
    'admin'
  ),
  (
    '39390000-0000-4000-8000-00000006e007',
    'account',
    NULL,
    test_id ('account_a'),
    'admin'
  );

DO $$
BEGIN
  PERFORM set_config(
    't39.r',
    public.create_invitations(
      test_id('project_a'),
      '[
        {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000006c002","email":"recover.invited@test.example"},
        {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000006c003","email":"recover.expired@test.example","expires_at":"2000-01-01T00:00:00Z"},
        {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000006c004","email":"recover.claimant@test.example"},
        {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000006c007","email":"recover.both@test.example"}
      ]'::jsonb,
      true
    )::text,
    true
  );
  -- The users, the grants and every column of every invitation, as they are before any request.
  PERFORM set_config(
    't39.recovery_before',
    (SELECT count(*)::text FROM auth.users) || ' ' || (SELECT count(*)::text FROM public.grants) || ' ' || (SELECT count(*)::text || ' ' || md5(string_agg(to_jsonb(i)::text, ',' ORDER BY i.id)) FROM public.invitations i),
    true
  );
  PERFORM set_config(
    't39.recovery_throttle_before',
    (SELECT count(*)::text FROM private.access_throttle),
    true
  );
END;
$$;

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.recovery_link_request (
      test_id ('project_a'),
      'recover.nobody@test.example'
    ),
    NULL,
    'RECOVERY: an address the project knows nothing of answers null'
  );

SELECT
  is (
    public.recovery_link_request (
      test_id ('project_a'),
      'recover.otherproject@test.example'
    ),
    NULL,
    'RECOVERY: the confirmed address of a user whose only grant is in the other project answers null'
  );

SELECT
  is (
    public.recovery_link_request (
      test_id ('project_a'),
      'recover.unconfirmed@test.example'
    ),
    NULL,
    'RECOVERY: the address of a grant holder whose email_confirmed_at is null answers null'
  );

SELECT
  is (
    public.recovery_link_request (
      test_id ('project_a'),
      'recover.expired@test.example'
    ),
    NULL,
    'RECOVERY: an address whose only invitation has expired answers null'
  );

SELECT
  is (
    public.recovery_link_request (NULL, 'recover.pgrant@test.example') IS NULL
    AND public.recovery_link_request (test_id ('project_a'), NULL) IS NULL
    AND public.recovery_link_request (test_id ('project_a'), '   ') IS NULL,
    true,
    'RECOVERY: no project, no address and a blank address each answer null'
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
    current_setting('t39.recovery_throttle_before'),
    'RECOVERY: none of those refusals wrote a throttle key: no slot is taken for an address no mail would go to'
  );

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.recovery_link_request (
      test_id ('project_a'),
      '  Recover.PGrant@Test.Example '
    ),
    '{"email":"recover.pgrant@test.example","mail":"recovery"}'::jsonb,
    'RECOVERY: the confirmed address of a user who holds a project-scope grant on the project is answered recovery, in an object of exactly the keys email and mail, the address trimmed and lower-cased'
  );

SELECT
  is (
    public.recovery_link_request (
      test_id ('project_a'),
      'recover.egrant@test.example'
    ),
    '{"email":"recover.egrant@test.example","mail":"recovery"}'::jsonb,
    'RECOVERY: the confirmed address of a user who holds an entity-scope grant on an entity of the project is answered recovery'
  );

SELECT
  is (
    public.recovery_link_request (
      test_id ('project_a'),
      'recover.nopassword@test.example'
    ),
    '{"email":"recover.nopassword@test.example","mail":"recovery"}'::jsonb,
    'RECOVERY: a grant holder whose stored password is the empty string is answered recovery as well'
  );

SELECT
  is (
    public.recovery_link_request (
      test_id ('project_a'),
      'recover.root@test.example'
    ),
    '{"email":"recover.root@test.example","mail":"recovery"}'::jsonb,
    'RECOVERY: the confirmed address of a root admin who holds no grant in the project is answered recovery, a global grant reaching every project'
  );

SELECT
  is (
    public.recovery_link_request (
      test_id ('project_a'),
      'recover.account@test.example'
    ),
    '{"email":"recover.account@test.example","mail":"recovery"}'::jsonb,
    'RECOVERY: the confirmed address of an admin of the project''s account, who holds no grant in the project, is answered recovery'
  );

SELECT
  is (
    public.recovery_link_request (
      test_id ('project_a'),
      ' Recover.Invited@Test.Example  '
    ),
    '{"email":"recover.invited@test.example","mail":"sign-in"}'::jsonb,
    'RECOVERY: an address that has no account and one open invitation in the project is answered sign-in, in an object of exactly the keys email and mail, the address trimmed and lower-cased'
  );

SELECT
  is (
    public.recovery_link_request (
      test_id ('project_b'),
      'recover.otherproject@test.example'
    ),
    '{"email":"recover.otherproject@test.example","mail":"recovery"}'::jsonb,
    'RECOVERY: the editor of the other project is answered recovery there'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        count(*)::text
      FROM
        auth.users
    ) || ' ' || (
      SELECT
        count(*)::text
      FROM
        public.grants
    ) || ' ' || (
      SELECT
        count(*)::text || ' ' || md5(
          string_agg(
            to_jsonb(i)::text,
            ','
            ORDER BY
              i.id
          )
        )
      FROM
        public.invitations i
    ),
    current_setting('t39.recovery_before'),
    'RECOVERY: none of those requests, answered recovery, sign-in or null, created a user, wrote a grant or changed any column of any invitation'
  );

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
            sha256(convert_to('recover.pgrant@test.example', 'UTF8')),
            'hex'
          ),
          'link:' || test_id ('project_a')::text || ':' || encode(
            sha256(
              convert_to('recover.invited@test.example', 'UTF8')
            ),
            'hex'
          )
        )
    ),
    2,
    'RECOVERY: a request answered recovery and one answered sign-in each hold the key a sign-in request for that address takes'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        private.access_throttle
    ),
    current_setting('t39.recovery_throttle_before')::integer + 14,
    'RECOVERY: the seven answered requests wrote two throttle keys each, the address''s minute slot in the project and its day slot, and nothing else'
  );

-- One mail per address per project per 60 seconds, across both kinds of request.
SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.recovery_link_request (
      test_id ('project_a'),
      'recover.pgrant@test.example'
    ),
    NULL,
    'RECOVERY: a second request for the same address inside 60 seconds answers null'
  );

SELECT
  lives_ok (
    $$SELECT public.invitation_link_release(test_id('project_a'), 'recover.pgrant@test.example')$$,
    'RECOVERY: invitation_link_release gives the slot back'
  );

SELECT
  is (
    public.recovery_link_request (
      test_id ('project_a'),
      'recover.pgrant@test.example'
    ),
    '{"email":"recover.pgrant@test.example","mail":"recovery"}'::jsonb,
    'RECOVERY: and the next recovery request is answered again, with no time moved'
  );

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'recover.pgrant@test.example'
    ),
    NULL,
    'RECOVERY: a sign-in request for an address a recovery request was just answered for answers null'
  );

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'recover.invited@test.example'
    ),
    NULL,
    'RECOVERY: so does a sign-in request for an address a recovery request was just answered sign-in for'
  );

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'recover.both@test.example'
    ),
    'recover.both@test.example',
    'RECOVERY: a sign-in request for an invited address that has asked for nothing is answered'
  );

SELECT
  is (
    public.recovery_link_request (
      test_id ('project_a'),
      'recover.both@test.example'
    ),
    NULL,
    'RECOVERY: and a recovery request for it inside 60 seconds answers null: the two kinds of request share one slot'
  );

SELECT
  reset_role ();

UPDATE private.access_throttle
SET
  window_start = now() - interval '2 minutes';

SET
  LOCAL ROLE service_role;

SELECT
  is (
    ARRAY[
      public.invitation_link_request (
        test_id ('project_a'),
        'recover.egrant@test.example'
      ),
      public.recovery_link_request (
        test_id ('project_a'),
        'recover.egrant@test.example'
      ) ->> 'mail'
    ],
    ARRAY['recover.egrant@test.example', NULL],
    'RECOVERY: for a grant holder too, a recovery request after an answered sign-in request answers null'
  );

SELECT
  reset_role ();

-- Every window opened so far has ended. No window is moved again before the email mode is back on, so a slot taken by a refused request would still be held then.
UPDATE private.access_throttle
SET
  window_start = now() - interval '2 minutes';

UPDATE app_settings
SET
  settings = jsonb_set(
    settings,
    '{contestantApp,servedEntityTypes,candidate,registrationModes}',
    '["identity_provider", "code"]'::jsonb
  )
WHERE
  project_id = test_id ('project_a');

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.recovery_link_request (
      test_id ('project_a'),
      'recover.invited@test.example'
    ),
    NULL,
    'RECOVERY: with the email mode off for candidates, an address that has only an open candidate invitation answers null'
  );

SELECT
  is (
    public.recovery_link_request (
      test_id ('project_a'),
      'recover.egrant@test.example'
    ),
    '{"email":"recover.egrant@test.example","mail":"recovery"}'::jsonb,
    'RECOVERY: a grant holder is answered recovery with that mode off'
  );

SELECT
  reset_role ();

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
    public.recovery_link_request (
      test_id ('project_a'),
      'recover.invited@test.example'
    ),
    '{"email":"recover.invited@test.example","mail":"sign-in"}'::jsonb,
    'RECOVERY: with the mode on again the same address is answered sign-in in the same minute: the refused request took no slot'
  );

-- An invitation earns the sign-in mail while it is open, the grant it becomes earns the recovery mail, and a claimed invitation by itself earns nothing.
SELECT
  is (
    public.recovery_link_request (
      test_id ('project_a'),
      'recover.claimant@test.example'
    ),
    '{"email":"recover.claimant@test.example","mail":"sign-in"}'::jsonb,
    'RECOVERY: a confirmed account that holds no grant and has an open invitation in the project is answered sign-in'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000006e008',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')) -> 'claimed',
    '[{"scope":"entity","target_type":"candidate","target_id":"39390000-0000-4000-8000-00000006c004","role":"editor"}]'::jsonb,
    'RECOVERY: that user claims the invitation'
  );

SELECT
  reset_role ();

UPDATE private.access_throttle
SET
  window_start = now() - interval '2 minutes';

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.recovery_link_request (
      test_id ('project_a'),
      'recover.claimant@test.example'
    ),
    '{"email":"recover.claimant@test.example","mail":"recovery"}'::jsonb,
    'RECOVERY: and is answered recovery from then on'
  );

SELECT
  reset_role ();

DELETE FROM public.grants
WHERE
  user_id = '39390000-0000-4000-8000-00000006e008';

UPDATE private.access_throttle
SET
  window_start = now() - interval '2 minutes';

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.recovery_link_request (
      test_id ('project_a'),
      'recover.claimant@test.example'
    ),
    NULL,
    'RECOVERY: a claimed invitation earns nothing by itself: with the grant gone, the same address answers null'
  );

SELECT
  reset_role ();

-- The function and the grant-holder test it shares with invitation_link_request, read from the catalogue by name.
SELECT
  is (
    (
      SELECT
        string_agg(
          pg_get_function_identity_arguments(p.oid) || ' -> ' || p.prorettype::regtype::text || ' ' || p.prosecdef::text || ' ' || p.proconfig::text,
          ', '
        )
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'public'
        AND p.proname = 'recovery_link_request'
    ),
    'p_project_id uuid, p_email text -> jsonb true {"search_path=\"\""}',
    'RECOVERY: the function has one signature, which takes a project and an address and nothing else, answers jsonb, and is SECURITY DEFINER with an empty pinned search_path'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          has_function_privilege('anon', p.oid, 'EXECUTE')::text || '/' || has_function_privilege('authenticated', p.oid, 'EXECUTE')::text || '/' || has_function_privilege('service_role', p.oid, 'EXECUTE')::text,
          ', '
        )
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'public'
        AND p.proname = 'recovery_link_request'
    ),
    'false/false/true',
    'RECOVERY: service_role may execute it, and neither anon nor authenticated may'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          n.nspname || ' ' || pg_get_function_identity_arguments(p.oid) || ' ' || p.provolatile::text || ' ' || p.prosecdef::text || ' ' || p.proconfig::text || ' ' || has_function_privilege('anon', p.oid, 'EXECUTE')::text || '/' || has_function_privilege('authenticated', p.oid, 'EXECUTE')::text,
          ', '
        )
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        p.proname = 'email_holds_grant_in_project'
    ),
    'private p_project_id uuid, p_email text s false {"search_path=\"\""} false/false',
    'RECOVERY: the grant-holder test is one function, in private, stable, running as its caller with an empty search_path, and executable by neither anon nor authenticated'
  );

-- Global and account grants, whatever their role, through both callers of the grant-holder test. A global grant reaches every project and an account grant every project of its account, so either makes a confirmed address eligible in project A; an account grant on account B does not, and neither does a global grant whose address is unconfirmed. Each caller asks about addresses of its own, because an answered address takes its slots.
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
  '$2a$10$abcdefghijklmnopqrstuuabcdefghijklmnopqrstuvwxyz0123456',
  'authenticated',
  'authenticated',
  CASE
    WHEN u.email LIKE '%.unconfirmed@test.example' THEN NULL
    ELSE now()
  END,
  '{}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
FROM
  (
    VALUES
      (
        '39390000-0000-4000-8000-00000008e001',
        'gar.link.otheraccount@test.example'
      ),
      (
        '39390000-0000-4000-8000-00000008e002',
        'gar.link.globaleditor@test.example'
      ),
      (
        '39390000-0000-4000-8000-00000008e003',
        'gar.link.accounteditor@test.example'
      ),
      (
        '39390000-0000-4000-8000-00000008e004',
        'gar.link.otheraccounteditor@test.example'
      ),
      (
        '39390000-0000-4000-8000-00000008e005',
        'gar.link.unconfirmed@test.example'
      ),
      (
        '39390000-0000-4000-8000-00000008e006',
        'gar.recover.otheraccount@test.example'
      ),
      (
        '39390000-0000-4000-8000-00000008e007',
        'gar.recover.globaleditor@test.example'
      ),
      (
        '39390000-0000-4000-8000-00000008e008',
        'gar.recover.accounteditor@test.example'
      ),
      (
        '39390000-0000-4000-8000-00000008e009',
        'gar.recover.otheraccounteditor@test.example'
      ),
      (
        '39390000-0000-4000-8000-00000008e010',
        'gar.recover.unconfirmed@test.example'
      )
  ) AS u (id, email);

INSERT INTO
  public.grants (user_id, scope, target_type, target_id, role)
VALUES
  (
    '39390000-0000-4000-8000-00000008e001',
    'account',
    NULL,
    test_id ('account_b'),
    'admin'
  ),
  (
    '39390000-0000-4000-8000-00000008e002',
    'global',
    NULL,
    NULL,
    'editor'
  ),
  (
    '39390000-0000-4000-8000-00000008e003',
    'account',
    NULL,
    test_id ('account_a'),
    'editor'
  ),
  (
    '39390000-0000-4000-8000-00000008e004',
    'account',
    NULL,
    test_id ('account_b'),
    'editor'
  ),
  (
    '39390000-0000-4000-8000-00000008e005',
    'global',
    NULL,
    NULL,
    'admin'
  ),
  (
    '39390000-0000-4000-8000-00000008e006',
    'account',
    NULL,
    test_id ('account_b'),
    'admin'
  ),
  (
    '39390000-0000-4000-8000-00000008e007',
    'global',
    NULL,
    NULL,
    'editor'
  ),
  (
    '39390000-0000-4000-8000-00000008e008',
    'account',
    NULL,
    test_id ('account_a'),
    'editor'
  ),
  (
    '39390000-0000-4000-8000-00000008e009',
    'account',
    NULL,
    test_id ('account_b'),
    'editor'
  ),
  (
    '39390000-0000-4000-8000-00000008e010',
    'global',
    NULL,
    NULL,
    'admin'
  );

DO $$
BEGIN
  PERFORM set_config(
    't39.gar_throttle_before',
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
      'gar.link.otheraccount@test.example'
    ),
    NULL,
    'GAR: the confirmed address of an admin of the other account, asking about a project of this one, answers null'
  );

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'gar.link.otheraccounteditor@test.example'
    ),
    NULL,
    'GAR: the confirmed address of an editor of the other account answers null'
  );

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'gar.link.unconfirmed@test.example'
    ),
    NULL,
    'GAR: the address of a global grant holder whose email_confirmed_at is null answers null'
  );

SELECT
  is (
    public.recovery_link_request (
      test_id ('project_a'),
      'gar.recover.otheraccount@test.example'
    ),
    NULL,
    'GAR: RECOVERY: the confirmed address of an admin of the other account, asking about a project of this one, answers null'
  );

SELECT
  is (
    public.recovery_link_request (
      test_id ('project_a'),
      'gar.recover.otheraccounteditor@test.example'
    ),
    NULL,
    'GAR: RECOVERY: the confirmed address of an editor of the other account answers null'
  );

SELECT
  is (
    public.recovery_link_request (
      test_id ('project_a'),
      'gar.recover.unconfirmed@test.example'
    ),
    NULL,
    'GAR: RECOVERY: the address of a global grant holder whose email_confirmed_at is null answers null'
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
    current_setting('t39.gar_throttle_before'),
    'GAR: none of those refusals wrote a throttle key'
  );

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'gar.link.globaleditor@test.example'
    ),
    'gar.link.globaleditor@test.example',
    'GAR: the confirmed address of a global editor answers with the address, whatever the role'
  );

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'gar.link.accounteditor@test.example'
    ),
    'gar.link.accounteditor@test.example',
    'GAR: the confirmed address of an editor of the project''s account answers with the address, whatever the role'
  );

SELECT
  is (
    public.recovery_link_request (
      test_id ('project_a'),
      'gar.recover.globaleditor@test.example'
    ),
    '{"email":"gar.recover.globaleditor@test.example","mail":"recovery"}'::jsonb,
    'GAR: RECOVERY: the confirmed address of a global editor is answered recovery, whatever the role'
  );

SELECT
  is (
    public.recovery_link_request (
      test_id ('project_a'),
      'gar.recover.accounteditor@test.example'
    ),
    '{"email":"gar.recover.accounteditor@test.example","mail":"recovery"}'::jsonb,
    'GAR: RECOVERY: the confirmed address of an editor of the project''s account is answered recovery, whatever the role'
  );

SELECT
  reset_role ();

-- =====================================================================
-- Section 24: an identity-provider account claims nothing
-- =====================================================================
-- An account whose app metadata names an identity provider was created by that provider, and its address does not decide who the person is, so the claim reads no address for it. Beside it is a control of the same shape with no `identity_provider` key, which claims its invitation.
--
-- The rows of project A: in `t39.idp`, 0 the email invitation of the identity-provider account and 1 the control's; in `t39.idp_code`, 0 a code invitation whose pending address the identity-provider account's address is bound to.
INSERT INTO
  public.candidates (id, project_id, first_name, last_name)
VALUES
  (
    '39390000-0000-4000-8000-00000007c001',
    test_id ('project_a'),
    'Provider',
    'Account'
  ),
  (
    '39390000-0000-4000-8000-00000007c002',
    test_id ('project_a'),
    'Provider',
    'Control'
  );

INSERT INTO
  public.organizations (id, project_id, name)
VALUES
  (
    '39390000-0000-4000-8000-00000007a001',
    test_id ('project_a'),
    '{"en": "Provider Code Party"}'::jsonb
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
    '39390000-0000-4000-8000-00000007e001',
    '00000000-0000-0000-0000-000000000000',
    'idp.account@test.example',
    '',
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{"provider": "email", "providers": ["email"], "identity_provider": "idura-ftn"}'::jsonb,
    now(),
    now()
  ),
  (
    '39390000-0000-4000-8000-00000007e002',
    '00000000-0000-0000-0000-000000000000',
    'idp.control@test.example',
    '',
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    now(),
    now()
  );

DO $$
BEGIN
  PERFORM set_config(
    't39.idp',
    public.create_invitations(
      test_id('project_a'),
      '[
        {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000007c001","email":"idp.account@test.example"},
        {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000007c002","email":"idp.control@test.example"}
      ]'::jsonb,
      true
    )::text,
    true
  );
  PERFORM set_config(
    't39.idp_code',
    public.create_invitations(
      test_id('project_a'),
      '[{"target_type":"organization","target_id":"39390000-0000-4000-8000-00000007a001"}]'::jsonb,
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
    public.invitation_link_request (
      test_id ('project_a'),
      'idp.account@test.example',
      current_setting('t39.idp_code')::jsonb -> 0 ->> 'code'
    ),
    'idp.account@test.example',
    'IDP: the code invitation is bound to the identity-provider account''s address'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000007e001',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')),
    '{"claimed":[],"skipped":[]}'::jsonb,
    'IDP: an account whose app metadata names an identity provider claims nothing and skips nothing, though its confirmed address is invited by email and bound to a code'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        public.invitations i
      WHERE
        i.id IN (
          (current_setting('t39.idp')::jsonb -> 0 ->> 'id')::uuid,
          (
            current_setting('t39.idp_code')::jsonb -> 0 ->> 'id'
          )::uuid
        )
        AND i.claimed_at IS NULL
        AND i.claimed_by IS NULL
    ),
    2,
    'IDP: both invitations of its address stay open'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        public.grants g
      WHERE
        g.user_id = '39390000-0000-4000-8000-00000007e001'
    ),
    0,
    'IDP: the identity-provider account holds no grant'
  );

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000007e002',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')),
    '{"claimed":[{"scope":"entity","target_type":"candidate","target_id":"39390000-0000-4000-8000-00000007c002","role":"editor"}],"skipped":[]}'::jsonb,
    'IDP: the control, an account of the same shape with no identity_provider key in its app metadata, claims its invitation'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        (
          i.claimed_by = '39390000-0000-4000-8000-00000007e002'
        )::text || ' ' || (
          SELECT
            count(*)::text
          FROM
            public.grants g
          WHERE
            g.user_id = '39390000-0000-4000-8000-00000007e002'
            AND g.scope = 'entity'
            AND g.target_type = 'candidate'
            AND g.target_id = '39390000-0000-4000-8000-00000007c002'
            AND g.role = 'editor'
        )
      FROM
        public.invitations i
      WHERE
        i.id = (current_setting('t39.idp')::jsonb -> 1 ->> 'id')::uuid
    ),
    'true 1',
    'IDP: the control''s invitation is claimed by it and its grant is written'
  );

SELECT
  *
FROM
  finish ();

ROLLBACK;
