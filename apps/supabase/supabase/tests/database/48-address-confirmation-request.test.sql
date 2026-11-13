-- 48-address-confirmation-request.test.sql: the slot of the address-confirmation mail
--
-- `address_confirmation_request (p_project_id, p_user_id, p_email)` answers whether one confirmation mail may be sent to an address for a signed-in account. A true answer has taken two slots, neither of them per project: the caller's own, ten per fifteen minutes, and the address's, one per 60 seconds, which is not the slot the sign-in and recovery mails take. A false answer means no mail. The caller's slot is taken first, so a caller who keeps asking about addresses meets its own limit whatever the addresses are and whatever project it names. A project the user's registered-entities record does not name is answered false before any slot. `address_confirmation_release (p_email)` gives the address's slot back.
--
-- Every assertion's description begins with `ACR: `. The function is the service role's, so every call below is made as that role; the throttle rows are read and moved by the fixture role.
--
-- Depends on: 00-helpers.test.sql (reset_role, create_test_data, test_id, test_user_id), 506-invitation-rpcs.sql (the two functions, invitation_link_request, invitation_link_release and the throttle table).
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (19);

-- Create test fixture data
SELECT
  create_test_data ();

-- Project A serves candidates and allows the email mode for them, so its open email invitation makes an address one a sign-in mail may go to.
UPDATE app_settings
SET
  settings = settings || jsonb_build_object(
    'contestantApp',
    COALESCE(settings -> 'contestantApp', '{}'::jsonb) || '{
      "entityTypes": ["candidate"],
      "registrationModes": {
        "candidate": ["email"]
      }
    }'::jsonb
  )
WHERE
  project_id = test_id ('project_a');

INSERT INTO
  public.candidates (id, project_id, first_name, last_name)
VALUES
  (
    '48480000-0000-4000-8000-0000000000c1',
    test_id ('project_a'),
    'Address',
    'Confirmation'
  );

DO $$
BEGIN
  PERFORM public.create_invitations(
    test_id('project_a'),
    '[{"target_type":"candidate","target_id":"48480000-0000-4000-8000-0000000000c1","email":"acr.first@test.example"}]'::jsonb,
    true
  );
END;
$$;

-- Every user who asks below registered an entity in project A through an identity provider, and organization_a and candidate_b in project B as well: the function answers only for a project the user's registered-entities record names. admin_a has no record.
UPDATE auth.users u
SET
  raw_app_meta_data = COALESCE(u.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(
    'registered_entities',
    CASE
      WHEN u.id IN (
        test_user_id ('organization_a'),
        test_user_id ('candidate_b')
      ) THEN jsonb_build_object(
        test_id ('project_a')::text,
        jsonb_build_object('organization', test_id ('org_a')::text),
        test_id ('project_b')::text,
        jsonb_build_object('organization', test_id ('org_b')::text)
      )
      ELSE jsonb_build_object(
        test_id ('project_a')::text,
        jsonb_build_object(
          'candidate',
          '48480000-0000-4000-8000-0000000000c1'
        )
      )
    END
  )
WHERE
  u.id IN (
    test_user_id ('candidate_a'),
    test_user_id ('candidate_b'),
    test_user_id ('candidate_a2'),
    test_user_id ('admin_b'),
    test_user_id ('organization_a')
  );

-- =====================================================================
-- The catalogue
-- =====================================================================
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
        AND p.proname = 'address_confirmation_request'
    ),
    'p_project_id uuid, p_user_id uuid, p_email text -> boolean true {"search_path=\"\""}',
    'ACR: the function has one signature, which takes a project, a user and an address, answers boolean, and is SECURITY DEFINER with an empty pinned search_path'
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
        AND p.proname = 'address_confirmation_request'
    ),
    'false/false/true',
    'ACR: service_role may execute it, and neither anon nor authenticated may'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          pg_get_function_identity_arguments(p.oid) || ' -> ' || p.prorettype::regtype::text || ' ' || p.prosecdef::text || ' ' || p.proconfig::text || ' ' || has_function_privilege('anon', p.oid, 'EXECUTE')::text || '/' || has_function_privilege('authenticated', p.oid, 'EXECUTE')::text || '/' || has_function_privilege('service_role', p.oid, 'EXECUTE')::text,
          ', '
        )
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'public'
        AND p.proname = 'address_confirmation_release'
    ),
    'p_email text -> void true {"search_path=\"\""} false/false/true',
    'ACR: the release has one signature, which takes an address and answers void, is SECURITY DEFINER with an empty pinned search_path, and is the service role''s alone'
  );

-- =====================================================================
-- The address's slot, one per address whatever the project, and not the link mails'
-- =====================================================================
SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.address_confirmation_request (
      test_id ('project_a'),
      test_user_id ('candidate_a'),
      'acr.first@test.example'
    ),
    true,
    'ACR: a first request for a project, a user and an address answers true'
  );

SELECT
  is (
    public.address_confirmation_request (
      test_id ('project_a'),
      test_user_id ('candidate_b'),
      'acr.first@test.example'
    ),
    false,
    'ACR: a second request for the same address within the minute, by another user, answers false: the address has one slot'
  );

SELECT
  is (
    public.address_confirmation_request (
      test_id ('project_b'),
      test_user_id ('candidate_b'),
      'acr.first@test.example'
    ),
    false,
    'ACR: a request for the same address within the minute naming another project answers false: the address''s slot is not per project'
  );

SELECT
  is (
    public.invitation_link_request (test_id ('project_a'), 'acr.first@test.example'),
    'acr.first@test.example',
    'ACR: a sign-in request for that address is still answered: the confirmation mail does not take the link mails'' slot'
  );

SELECT
  public.invitation_link_release (test_id ('project_a'), 'acr.first@test.example');

SELECT
  is (
    public.address_confirmation_request (
      test_id ('project_a'),
      test_user_id ('candidate_b'),
      'acr.first@test.example'
    ),
    false,
    'ACR: invitation_link_release does not give the confirmation''s slot back'
  );

SELECT
  public.address_confirmation_release ('  ACR.First@Test.Example ');

SELECT
  is (
    public.address_confirmation_request (
      test_id ('project_a'),
      test_user_id ('candidate_b'),
      'acr.first@test.example'
    ),
    true,
    'ACR: once address_confirmation_release gives the address''s slot back, given the address in any case and spacing, the next request answers true'
  );

-- =====================================================================
-- The caller's slot
-- =====================================================================
SELECT
  is (
    (
      SELECT
        count(*) FILTER (
          WHERE
            public.address_confirmation_request (
              test_id ('project_a'),
              test_user_id ('organization_a'),
              'acr.caller.' || g::text || '@test.example'
            )
        )::integer
      FROM
        generate_series(1, 10) AS g
    ),
    10,
    'ACR: one user''s first ten requests within fifteen minutes, each to a fresh address, all answer true'
  );

SELECT
  is (
    public.address_confirmation_request (
      test_id ('project_a'),
      test_user_id ('organization_a'),
      'acr.caller.11@test.example'
    ),
    false,
    'ACR: the eleventh request within fifteen minutes by the same user, to a fresh address, answers false: the caller has ten'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        (
          SELECT
            t.count::text
          FROM
            private.invitation_throttle t
          WHERE
            t.key = 'confirm:' || test_user_id ('organization_a')::text
        ) || ' ' || (
          SELECT
            count(*)::text
          FROM
            private.invitation_throttle t
          WHERE
            t.key LIKE '%' || encode(
              sha256(convert_to('acr.caller.11@test.example', 'UTF8')),
              'hex'
            )
        )
    ),
    '11 0',
    'ACR: the caller''s slot is keyed on the user alone and counted eleven times, and the refused eleventh request took no slot for its address'
  );

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.address_confirmation_request (
      test_id ('project_b'),
      test_user_id ('organization_a'),
      'acr.caller.11@test.example'
    ),
    false,
    'ACR: the same user''s request naming another project it registered in answers false: one user has one budget whatever project the request names'
  );

SELECT
  reset_role ();

UPDATE private.invitation_throttle
SET
  window_start = now() - interval '16 minutes'
WHERE
  key = 'confirm:' || test_user_id ('organization_a')::text;

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.address_confirmation_request (
      test_id ('project_a'),
      test_user_id ('organization_a'),
      'acr.caller.12@test.example'
    ),
    true,
    'ACR: once the caller''s window began sixteen minutes ago, the same user''s request answers true again'
  );

-- =====================================================================
-- Arguments
-- =====================================================================
SELECT
  reset_role ();

DO $$
BEGIN
  PERFORM set_config(
    't48.throttle_before',
    (SELECT count(*)::text || ' ' || COALESCE(sum(t.count), 0)::text FROM private.invitation_throttle t),
    true
  );
END;
$$;

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.address_confirmation_request (
      NULL,
      test_user_id ('candidate_a2'),
      'acr.args@test.example'
    )::text || ' ' || public.address_confirmation_request (
      test_id ('project_a'),
      NULL,
      'acr.args@test.example'
    )::text || ' ' || public.address_confirmation_request (
      test_id ('project_a'),
      test_user_id ('candidate_a2'),
      NULL
    )::text || ' ' || public.address_confirmation_request (
      test_id ('project_a'),
      test_user_id ('candidate_a2'),
      '   '
    )::text || ' ' || public.address_confirmation_request (
      test_id ('project_b'),
      test_user_id ('candidate_a2'),
      'acr.args@test.example'
    )::text || ' ' || public.address_confirmation_request (
      test_id ('project_a'),
      test_user_id ('admin_a'),
      'acr.args@test.example'
    )::text || ' ' || public.address_confirmation_request (
      test_id ('project_a'),
      '48480000-0000-4000-8000-00000000dead',
      'acr.args@test.example'
    )::text,
    'false false false false false false false',
    'ACR: no project, no user, no address, a blank address, a project the user''s record does not name, a user with no record and a user who does not exist each answer false'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        count(*)::text || ' ' || COALESCE(sum(t.count), 0)::text
      FROM
        private.invitation_throttle t
    ),
    current_setting('t48.throttle_before'),
    'ACR: those seven requests wrote nothing: no key was created and no count moved'
  );

-- =====================================================================
-- The address as typed
-- =====================================================================
SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.address_confirmation_request (
      test_id ('project_a'),
      test_user_id ('candidate_a2'),
      '  ACR.Case@Test.Example '
    ),
    true,
    'ACR: an address given with surrounding spaces and capitals answers true'
  );

SELECT
  is (
    public.address_confirmation_request (
      test_id ('project_a'),
      test_user_id ('admin_b'),
      'acr.case@test.example'
    ),
    false,
    'ACR: its trimmed, lower-cased form, asked by another user within the minute, answers false: both took the same slot'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        private.invitation_throttle t
      WHERE
        t.key = 'confirm-address:' || encode(
          sha256(convert_to('acr.case@test.example', 'UTF8')),
          'hex'
        )
    ),
    1,
    'ACR: the address''s slot is the `confirm-address:` key of the trimmed, lower-cased address, with no project in it'
  );

SELECT
  *
FROM
  finish ();

ROLLBACK;
