-- 57-address-holds-open-invitation.test.sql: whether an address holds an open invitation in a project
--
-- `address_holds_open_invitation (p_project_id, p_email)` answers true when an invitation of the project that is not claimed and has not expired holds the address, trimmed and lower-cased, as its `email` or as its `pending_email`, and false otherwise. A null argument and a blank address answer false. It reads and writes nothing else, and the service role alone may execute it.
--
-- Every assertion's description begins with `AOI: `. The invitations below are written by the fixture role, straight into the table, so each holds exactly the columns it states. The function is the service role's, so every call below is made as that role.
--
-- Depends on:
-- - 00-helpers.test.sql (create_test_data, test_id, reset_role)
-- - 305-invitations.sql (public.invitations and its insert trigger)
-- - 506-invitation-rpcs.sql (the function and the throttle table)
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (17);

-- Create test fixture data
SELECT
  create_test_data ();

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
        AND p.proname = 'address_holds_open_invitation'
    ),
    'p_project_id uuid, p_email text -> boolean true s {"search_path=\"\""}',
    'AOI: the function has one signature, which takes a project and an address, answers boolean, and is a stable SECURITY DEFINER function with an empty pinned search_path'
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
        AND p.proname = 'address_holds_open_invitation'
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
  private.invitation_throttle;

-- =====================================================================
-- What an open invitation is
-- =====================================================================
SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.address_holds_open_invitation (test_id ('project_a'), 'aoi.open@test.example'),
    true,
    'AOI: an address an open invitation of the project holds as its email answers true'
  );

SELECT
  is (
    public.address_holds_open_invitation (test_id ('project_a'), 'aoi.pending@test.example'),
    true,
    'AOI: an address an open code invitation of the project holds as its pending email answers true'
  );

SELECT
  is (
    public.address_holds_open_invitation (test_id ('project_a'), 'aoi.later@test.example'),
    true,
    'AOI: an address an open invitation holds that expires later answers true'
  );

SELECT
  is (
    public.address_holds_open_invitation (test_id ('project_a'), '  AOI.Open@Test.Example '),
    true,
    'AOI: the email asked with surrounding spaces and capitals answers true'
  );

SELECT
  is (
    public.address_holds_open_invitation (
      test_id ('project_a'),
      ' Aoi.PENDING@test.example  '
    ),
    true,
    'AOI: the pending email asked with surrounding spaces and capitals answers true'
  );

SELECT
  is (
    public.address_holds_open_invitation (test_id ('project_a'), 'aoi.claimed@test.example'),
    false,
    'AOI: an address only a claimed invitation holds answers false'
  );

SELECT
  is (
    public.address_holds_open_invitation (test_id ('project_a'), 'aoi.expired@test.example'),
    false,
    'AOI: an address only an expired invitation holds answers false'
  );

SELECT
  is (
    public.address_holds_open_invitation (
      test_id ('project_a'),
      'aoi.other.project@test.example'
    ),
    false,
    'AOI: an address only another project''s open invitation holds answers false'
  );

SELECT
  is (
    public.address_holds_open_invitation (
      test_id ('project_b'),
      'aoi.other.project@test.example'
    ),
    true,
    'AOI: the same address asked in the project whose open invitation holds it answers true'
  );

SELECT
  is (
    public.address_holds_open_invitation (test_id ('project_a'), 'aoi.nobody@test.example'),
    false,
    'AOI: an address no invitation holds answers false'
  );

SELECT
  is (
    public.address_holds_open_invitation (NULL, 'aoi.open@test.example'),
    false,
    'AOI: a null project answers false'
  );

SELECT
  is (
    public.address_holds_open_invitation (test_id ('project_a'), NULL),
    false,
    'AOI: a null address answers false'
  );

SELECT
  is (
    public.address_holds_open_invitation (test_id ('project_a'), '   '),
    false,
    'AOI: a blank address answers false'
  );

SELECT
  reset_role ();

SELECT
  set_eq (
    'SELECT key, count FROM private.invitation_throttle',
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
    6,
    'AOI: the calls above changed no invitation: all six rows are there'
  );

SELECT
  *
FROM
  finish ();

ROLLBACK;
