-- 57-email-invitation-hold.test.sql: which hold an open invitation of a project has on an address
--
-- `email_invitation_hold (p_project_id, p_email)` looks at the invitations of the project that are not claimed and have not expired and that hold the address, trimmed and lower-cased, as their `email` or as their `pending_email`. It answers `allowed` when the project would honour at least one of them (`private.invitation_mode_allowed`), `held` when it would honour none, and `none` when there is no such invitation. A null argument and a blank address answer `none`. It reads and writes nothing else, and the service role alone may execute it.
--
-- Every assertion's description begins with `AOI: `. The invitations below are written by the fixture role, straight into the table, so each holds exactly the columns it states. The function is the service role's, so every call below is made as that role.
--
-- Depends on:
-- - 00-helpers.test.sql (create_test_data, test_id, reset_role)
-- - 305-invitations.sql (public.invitations and its insert trigger)
-- - 506-invitation-rpcs.sql (the function, private.invitation_mode_allowed and the throttle table)
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (22);

-- Create test fixture data
SELECT
  create_test_data ();

-- Project A honours candidate invitations by email and by code and organization invitations by email only; project B honours candidate invitations by email.
UPDATE app_settings
SET
  settings = settings || '{"contestantApp": {"servedEntityTypes": {"candidate": {"registrationModes": ["email", "code"]}, "organization": {"registrationModes": ["email"]}}}}'::jsonb
WHERE
  project_id = test_id ('project_a');

UPDATE app_settings
SET
  settings = settings || '{"contestantApp": {"servedEntityTypes": {"candidate": {"registrationModes": ["email"]}}}}'::jsonb
WHERE
  project_id = test_id ('project_b');

-- One invitation per case, each for its own address. The code row binds a pending address to a code; its hash is a fixed value no code produces here.
INSERT INTO
  public.invitations (
    project_id,
    scope,
    target_type,
    target_id,
    role,
    email,
    code_hash,
    pending_email,
    pending_email_at,
    expires_at,
    claimed_at
  )
VALUES
  (
    test_id ('project_a'),
    'entity',
    'candidate',
    test_id ('candidate_a'),
    'editor',
    'aoi.open@test.example',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL
  ),
  (
    test_id ('project_a'),
    'entity',
    'candidate',
    test_id ('candidate_a2'),
    'editor',
    NULL,
    repeat('a0', 32),
    'aoi.pending@test.example',
    now(),
    NULL,
    NULL
  ),
  (
    test_id ('project_a'),
    'entity',
    'organization',
    test_id ('org_a'),
    'editor',
    'aoi.later@test.example',
    NULL,
    NULL,
    NULL,
    now() + interval '1 day',
    NULL
  ),
  (
    test_id ('project_a'),
    'entity',
    'candidate',
    test_id ('candidate_a'),
    'editor',
    'aoi.claimed@test.example',
    NULL,
    NULL,
    NULL,
    NULL,
    now() - interval '1 hour'
  ),
  (
    test_id ('project_a'),
    'entity',
    'candidate',
    test_id ('candidate_a'),
    'editor',
    'aoi.expired@test.example',
    NULL,
    NULL,
    NULL,
    now() - interval '1 day',
    NULL
  ),
  (
    test_id ('project_b'),
    'entity',
    'candidate',
    test_id ('candidate_b'),
    'editor',
    'aoi.other.project@test.example',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL
  ),
  (
    test_id ('project_a'),
    'entity',
    'organization',
    test_id ('org_a'),
    'editor',
    NULL,
    repeat('b0', 32),
    'aoi.mode.off@test.example',
    now(),
    NULL,
    NULL
  ),
  (
    test_id ('project_a'),
    'entity',
    'candidate',
    test_id ('candidate_a'),
    'editor',
    'aoi.mixed@test.example',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL
  ),
  (
    test_id ('project_a'),
    'entity',
    'organization',
    test_id ('org_a'),
    'editor',
    NULL,
    repeat('c0', 32),
    'aoi.mixed@test.example',
    now(),
    NULL,
    NULL
  ),
  (
    test_id ('project_b'),
    'project',
    NULL,
    test_id ('project_b'),
    'editor',
    'aoi.admin@test.example',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL
  );

-- =====================================================================
-- The catalogue
-- =====================================================================
SELECT
  is (
    (
      SELECT
        string_agg(
          pg_get_function_identity_arguments(p.oid) || ' -> ' || p.prorettype::regtype::text || ' ' || p.prosecdef::text || ' ' || p.provolatile::text || ' ' || p.proconfig::text,
          ', '
        )
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'public'
        AND p.proname = 'email_invitation_hold'
    ),
    'p_project_id uuid, p_email text -> text true s {"search_path=\"\""}',
    'AOI: the function has one signature, which takes a project and an address, answers text, and is a stable SECURITY DEFINER function with an empty pinned search_path'
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
        AND p.proname = 'email_invitation_hold'
    ),
    'false/false/true',
    'AOI: service_role may execute it, and neither anon nor authenticated may'
  );

-- The throttle rows before any call, to compare with after them.
CREATE TEMP TABLE aoi_throttle_before AS
SELECT
  key,
  count
FROM
  private.access_throttle;

-- =====================================================================
-- What an open invitation is
-- =====================================================================
SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.email_invitation_hold (test_id ('project_a'), 'aoi.open@test.example'),
    'allowed',
    'AOI: an address an open, honoured invitation of the project holds as its email answers allowed'
  );

SELECT
  is (
    public.email_invitation_hold (test_id ('project_a'), 'aoi.pending@test.example'),
    'allowed',
    'AOI: an address an open, honoured code invitation of the project holds as its pending email answers allowed'
  );

SELECT
  is (
    public.email_invitation_hold (test_id ('project_a'), 'aoi.later@test.example'),
    'allowed',
    'AOI: an address an open invitation holds that expires later answers allowed'
  );

SELECT
  is (
    public.email_invitation_hold (test_id ('project_a'), '  AOI.Open@Test.Example '),
    'allowed',
    'AOI: the email asked with surrounding spaces and capitals answers allowed'
  );

SELECT
  is (
    public.email_invitation_hold (
      test_id ('project_a'),
      ' Aoi.PENDING@test.example  '
    ),
    'allowed',
    'AOI: the pending email asked with surrounding spaces and capitals answers allowed'
  );

SELECT
  is (
    public.email_invitation_hold (test_id ('project_a'), 'aoi.claimed@test.example'),
    'none',
    'AOI: an address only a claimed invitation holds answers none'
  );

SELECT
  is (
    public.email_invitation_hold (test_id ('project_a'), 'aoi.expired@test.example'),
    'none',
    'AOI: an address only an expired invitation holds answers none'
  );

SELECT
  is (
    public.email_invitation_hold (
      test_id ('project_a'),
      'aoi.other.project@test.example'
    ),
    'none',
    'AOI: an address only another project''s open invitation holds answers none'
  );

SELECT
  is (
    public.email_invitation_hold (
      test_id ('project_b'),
      'aoi.other.project@test.example'
    ),
    'allowed',
    'AOI: the same address asked in the project whose open invitation holds it answers allowed'
  );

SELECT
  is (
    public.email_invitation_hold (test_id ('project_a'), 'aoi.nobody@test.example'),
    'none',
    'AOI: an address no invitation holds answers none'
  );

SELECT
  is (
    public.email_invitation_hold (NULL, 'aoi.open@test.example'),
    'none',
    'AOI: a null project answers none'
  );

SELECT
  is (
    public.email_invitation_hold (test_id ('project_a'), NULL),
    'none',
    'AOI: a null address answers none'
  );

SELECT
  is (
    public.email_invitation_hold (test_id ('project_a'), '   '),
    'none',
    'AOI: a blank address answers none'
  );

SELECT
  is (
    public.email_invitation_hold (
      test_id ('project_a'),
      'aoi.mode.off@test.example'
    ),
    'held',
    'AOI: an address only an open invitation whose registration mode is off holds answers held'
  );

SELECT
  is (
    public.email_invitation_hold (test_id ('project_a'), 'aoi.mixed@test.example'),
    'allowed',
    'AOI: an address held by an honoured and an unhonoured invitation answers allowed'
  );

SELECT
  is (
    public.email_invitation_hold (test_id ('project_b'), 'aoi.admin@test.example'),
    'allowed',
    'AOI: an address an open project-scope invitation holds answers allowed'
  );

SELECT
  reset_role ();

-- Project B's Contestant App is switched off.
UPDATE app_settings
SET
  settings = settings || '{"access": {"contestantApp": false}}'::jsonb
WHERE
  project_id = test_id ('project_b');

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.email_invitation_hold (
      test_id ('project_b'),
      'aoi.other.project@test.example'
    ),
    'held',
    'AOI: while the Contestant App is switched off, an address an open entity invitation holds answers held'
  );

SELECT
  is (
    public.email_invitation_hold (test_id ('project_b'), 'aoi.admin@test.example'),
    'allowed',
    'AOI: while the Contestant App is switched off, an address an open project-scope invitation holds still answers allowed'
  );

SELECT
  reset_role ();

SELECT
  set_eq (
    'SELECT key, count FROM private.access_throttle',
    'SELECT key, count FROM aoi_throttle_before',
    'AOI: the calls above took no throttle slot'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        public.invitations
      WHERE
        email LIKE 'aoi.%'
        OR pending_email LIKE 'aoi.%'
    ),
    10,
    'AOI: the calls above changed no invitation: all ten rows are there'
  );

SELECT
  *
FROM
  finish ();

ROLLBACK;
