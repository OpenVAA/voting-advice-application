-- 59-identity-provider-entry.test.sql: the identity provider's entry rules and the Contestant App switch
--
-- `identity_provider_entity_types (p_project_id)` answers the entity types an identity provider may register in a project, in the order candidate, organization: those for which the registration-mode rule allows the mode `identity_provider`, and none while the project's Contestant App is switched off. `private.project_contestant_app_closed (p_project_id)` reads the switch: only the JSON boolean false at `access.contestantApp` closes, and a project that does not exist reads as closed. While it is closed `private.invitation_mode_allowed` refuses every entity-scope invitation of the project, whatever its type or mode, and allows a project-scope one. `identity_account_find (p_match_value, p_placeholder_email)` answers the account an identity resolves to: the one holding the match value, and otherwise the one on the placeholder address. The two public functions are the service role's alone.
--
-- Every assertion's description begins with `IDP-ENTRY: `.
--
-- Depends on:
-- - 00-helpers.test.sql (create_test_data, test_id, test_user_id, set_test_user, reset_role)
-- - 301-auth-functions.sql (identity_provider_entity_types, private.project_contestant_app_closed, private.registration_mode_allowed)
-- - 305-invitations.sql (public.invitations and its insert trigger)
-- - 506-invitation-rpcs.sql (private.invitation_mode_allowed, identity_account_find)
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (19);

SELECT
  create_test_data ();

-- Project A allows the identity provider for both types, project B for neither.
UPDATE app_settings
SET
  settings = settings || jsonb_build_object(
    'contestantApp',
    COALESCE(settings -> 'contestantApp', '{}'::jsonb) || '{
      "servedEntityTypes": {
        "candidate": {"registrationModes": ["identity_provider", "email"]},
        "organization": {"registrationModes": ["identity_provider"]}
      }
    }'::jsonb
  )
WHERE
  project_id = test_id ('project_a');

UPDATE app_settings
SET
  settings = settings || jsonb_build_object(
    'contestantApp',
    COALESCE(settings -> 'contestantApp', '{}'::jsonb) || '{
      "servedEntityTypes": {
        "candidate": {"registrationModes": ["email"]}
      }
    }'::jsonb
  )
WHERE
  project_id = test_id ('project_b');

-- An email invitation for a candidate and a project-scope invitation in project A.
INSERT INTO
  public.invitations (
    project_id,
    scope,
    target_type,
    target_id,
    role,
    email
  )
VALUES
  (
    test_id ('project_a'),
    'entity',
    'candidate',
    test_id ('candidate_a'),
    'editor',
    'idp.entry.candidate@test.example'
  ),
  (
    test_id ('project_a'),
    'project',
    NULL,
    test_id ('project_a'),
    'editor',
    'idp.entry.editor@test.example'
  );

-- =====================================================================
-- identity_provider_entity_types while the Contestant App is open
-- =====================================================================
SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.identity_provider_entity_types (test_id ('project_a')),
    ARRAY['candidate', 'organization'],
    'IDP-ENTRY: a project that allows the identity provider for both types answers both, candidate first'
  );

SELECT
  is (
    public.identity_provider_entity_types (test_id ('project_b')),
    ARRAY[]::text[],
    'IDP-ENTRY: a project that allows the identity provider for no type answers an empty array'
  );

SELECT
  is (
    public.identity_provider_entity_types (NULL)::text || ' ' || public.identity_provider_entity_types ('59590000-0000-4000-8000-00000000dead')::text,
    '{} {}',
    'IDP-ENTRY: a null project and a project that does not exist answer an empty array'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        string_agg(
          private.invitation_mode_allowed (i)::text,
          ' '
          ORDER BY
            i.scope
        )
      FROM
        public.invitations i
      WHERE
        i.email IN (
          'idp.entry.candidate@test.example',
          'idp.entry.editor@test.example'
        )
    ),
    'true true',
    'IDP-ENTRY: while the Contestant App is open, the project''s email candidate invitation and its project-scope invitation are allowed'
  );

SELECT
  is (
    private.project_contestant_app_closed (test_id ('project_a')),
    false,
    'IDP-ENTRY: a project whose settings do not switch the Contestant App off reads as open'
  );

-- The string "false" is not the switch.
UPDATE app_settings
SET
  settings = settings || jsonb_build_object(
    'access',
    COALESCE(settings -> 'access', '{}'::jsonb) || '{"contestantApp": "false"}'::jsonb
  )
WHERE
  project_id = test_id ('project_a');

SELECT
  is (
    private.project_contestant_app_closed (test_id ('project_a')),
    false,
    'IDP-ENTRY: the string "false" does not close the Contestant App'
  );

SELECT
  is (
    private.project_contestant_app_closed ('59590000-0000-4000-8000-00000000dead'),
    true,
    'IDP-ENTRY: a project that does not exist reads as closed'
  );

-- =====================================================================
-- The Contestant App switched off
-- =====================================================================
UPDATE app_settings
SET
  settings = settings || jsonb_build_object(
    'access',
    COALESCE(settings -> 'access', '{}'::jsonb) || '{"contestantApp": false}'::jsonb
  )
WHERE
  project_id = test_id ('project_a');

SELECT
  is (
    private.project_contestant_app_closed (test_id ('project_a')),
    true,
    'IDP-ENTRY: the JSON boolean false closes the Contestant App'
  );

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.identity_provider_entity_types (test_id ('project_a')),
    ARRAY[]::text[],
    'IDP-ENTRY: while the Contestant App is switched off, the project answers no entity type, though its matrix allows the identity provider for both'
  );

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'idp.entry.candidate@test.example'
    ),
    NULL,
    'IDP-ENTRY: while the Contestant App is switched off, an invited address is not mailed a sign-in link'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        string_agg(
          i.scope::text || ' ' || private.invitation_mode_allowed (i)::text,
          ', '
          ORDER BY
            i.scope
        )
      FROM
        public.invitations i
      WHERE
        i.email IN (
          'idp.entry.candidate@test.example',
          'idp.entry.editor@test.example'
        )
    ),
    'project true, entity false',
    'IDP-ENTRY: while the Contestant App is switched off, the entity invitation of the project is refused and the project-scope one, which leads to the Admin App, is allowed'
  );

-- =====================================================================
-- identity_account_find
-- =====================================================================
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
    'cccccccc-cccc-cccc-cccc-0000000059a1',
    '00000000-0000-0000-0000-000000000000',
    'idp-entry-bound@placeholder.test',
    '',
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{"identity_provider": "idura-ftn", "identity_match_prop": "sub", "identity_match_value": "Entry-Match-1"}'::jsonb,
    now(),
    now()
  ),
  (
    'cccccccc-cccc-cccc-cccc-0000000059a2',
    '00000000-0000-0000-0000-000000000000',
    'idp-entry-fresh@placeholder.test',
    '',
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    now(),
    now()
  );

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.identity_account_find (
      'Entry-Match-1',
      'idp-entry-fresh@placeholder.test'
    ) ->> 'id',
    'cccccccc-cccc-cccc-cccc-0000000059a1',
    'IDP-ENTRY: the account holding the match value is answered before an account on the placeholder address'
  );

SELECT
  is (
    public.identity_account_find ('Entry-Match-1', NULL) - 'id',
    jsonb_build_object(
      'email',
      'idp-entry-bound@placeholder.test',
      'raw_app_meta_data',
      '{"identity_provider": "idura-ftn", "identity_match_prop": "sub", "identity_match_value": "Entry-Match-1"}'::jsonb
    ),
    'IDP-ENTRY: the answer carries the account''s address and its app metadata'
  );

SELECT
  is (
    public.identity_account_find (
      'entry-match-2',
      'IDP-Entry-Fresh@placeholder.test'
    ) ->> 'id',
    'cccccccc-cccc-cccc-cccc-0000000059a2',
    'IDP-ENTRY: with no account holding the match value, the account on the placeholder address is answered, compared lower-cased'
  );

SELECT
  is (
    public.identity_account_find (
      'entry-match-1',
      'idp-entry-bound@placeholder.test'
    ) ->> 'id',
    'cccccccc-cccc-cccc-cccc-0000000059a1',
    'IDP-ENTRY: a match value that differs from a stored one only by case matches nothing itself, and the placeholder address answers its account'
  );

SELECT
  is (
    public.identity_account_find ('entry-match-1', NULL),
    NULL,
    'IDP-ENTRY: a match value only another case of which is stored answers SQL null'
  );

SELECT
  is (
    COALESCE(
      public.identity_account_find (NULL, NULL)::text,
      'null'
    ) || ' ' || COALESCE(
      public.identity_account_find ('entry-match-9', 'nobody@placeholder.test')::text,
      'null'
    ),
    'null null',
    'IDP-ENTRY: two null arguments and arguments that match no account answer SQL null'
  );

SELECT
  reset_role ();

-- =====================================================================
-- Privileges
-- =====================================================================
SELECT
  is (
    (
      SELECT
        string_agg(
          p.proname || ' ' || pg_get_function_identity_arguments(p.oid) || ' -> ' || p.prorettype::regtype::text || ' ' || p.prosecdef::text || ' ' || p.proconfig::text || ' ' || has_function_privilege('anon', p.oid, 'EXECUTE')::text || '/' || has_function_privilege('authenticated', p.oid, 'EXECUTE')::text || '/' || has_function_privilege('service_role', p.oid, 'EXECUTE')::text,
          ', '
          ORDER BY
            p.proname
        )
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'public'
        AND p.proname IN (
          'identity_account_find',
          'identity_provider_entity_types'
        )
    ),
    'identity_account_find p_match_value text, p_placeholder_email text -> jsonb true {"search_path=\"\""} false/false/true, identity_provider_entity_types p_project_id uuid -> text[] true {"search_path=\"\""} false/false/true',
    'IDP-ENTRY: each function has one signature, is SECURITY DEFINER with an empty pinned search_path, and is executable by service_role and by neither anon nor authenticated'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    '[]'::jsonb
  );

SELECT
  throws_ok (
    $$SELECT public.identity_provider_entity_types(test_id('project_a'))$$,
    '42501',
    NULL,
    'IDP-ENTRY: an authenticated caller is refused identity_provider_entity_types'
  );

SELECT
  reset_role ();

SELECT
  *
FROM
  finish ();

ROLLBACK;
