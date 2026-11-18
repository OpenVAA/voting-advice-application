-- 59-invitation-caller-limit.test.sql: the per-caller limit on the invitation operations
--
-- `invitation_caller_take (p_project_id, p_address)` takes one slot of a caller in a project through `private.invitation_throttle_take` and answers 0 when the take is admitted, or the whole seconds until the caller's window ends when it is refused: thirty takes per caller per project per ten minutes. The caller is the address the Edge Function read from `cf-connecting-ip`, an IPv4 address keyed by its host and an IPv6 address by its /64, under the key `caller:<project id>:<caller>`.
--
-- The address is trusted only when `private.deployment_settings.behind_cloudflare` is true and the address is present and parses. Otherwise, and for an id that names no project, the function answers 0 and writes no row, so an absent or unparseable address never shares one bucket. Each take deletes the `caller:` rows whose window has ended, and no other row.
--
-- Every assertion's description begins with `ICL: `. Each block sets the flag explicitly at its start, as postgres, so the value `seed.sql` supplies never decides an assertion, and deletes every `caller:` row, so leftover local state cannot decide one either. Addresses use 198.51.100.0/24 (TEST-NET-2) and 2001:db8::/32. `now()` is frozen inside the transaction, so a window is ended by moving `window_start` back with UPDATE. The final ROLLBACK undoes every write and settings change.
--
-- Depends on:
-- - 00-helpers.test.sql (create_test_data, test_id, test_user_id, set_test_user, reset_role)
-- - 107-feedback.sql (private.deployment_settings)
-- - 506-invitation-rpcs.sql (the function and the throttle table)
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (25);

SELECT
  create_test_data ();

-- =====================================================================
-- 1. Trusted IPv4: thirty takes admitted, the thirty-first refused, another address admitted
-- =====================================================================
SELECT
  reset_role ();

DELETE FROM private.invitation_throttle
WHERE
  key LIKE 'caller:%';

UPDATE private.deployment_settings
SET
  behind_cloudflare = true;

SELECT
  is (
    (
      SELECT
        count(*) FILTER (
          WHERE
            s.r = 0
        )
      FROM
        (
          SELECT
            public.invitation_caller_take (test_id ('project_a'), '198.51.100.7') AS r
          FROM
            generate_series(1, 30)
        ) s
    ),
    30::bigint,
    'ICL: thirty takes of one address in one project are admitted'
  );

SELECT
  ok (
    public.invitation_caller_take (test_id ('project_a'), '198.51.100.7') BETWEEN 1 AND 600,
    'ICL: the thirty-first take is refused with the seconds until the window ends, between 1 and 600'
  );

SELECT
  is (
    public.invitation_caller_take (test_id ('project_a'), '198.51.100.8'),
    0,
    'ICL: another address at the same moment is admitted'
  );

-- =====================================================================
-- 2. Untrusted: the flag false admits and writes nothing
-- =====================================================================
SELECT
  reset_role ();

DELETE FROM private.invitation_throttle
WHERE
  key LIKE 'caller:%';

UPDATE private.deployment_settings
SET
  behind_cloudflare = false;

SELECT
  is (
    public.invitation_caller_take (test_id ('project_a'), '198.51.100.9'),
    0,
    'ICL: with behind_cloudflare false a take is admitted'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        private.invitation_throttle
      WHERE
        key LIKE 'caller:%'
    ),
    0::bigint,
    'ICL: with behind_cloudflare false no caller row is written'
  );

-- =====================================================================
-- 3. Absent, blank, unparseable and masked addresses
-- =====================================================================
SELECT
  reset_role ();

DELETE FROM private.invitation_throttle
WHERE
  key LIKE 'caller:%';

UPDATE private.deployment_settings
SET
  behind_cloudflare = true;

SELECT
  is (
    public.invitation_caller_take (test_id ('project_a'), NULL),
    0,
    'ICL: a NULL address is admitted'
  );

SELECT
  is (
    public.invitation_caller_take (test_id ('project_a'), ''),
    0,
    'ICL: an empty address is admitted'
  );

SELECT
  is (
    public.invitation_caller_take (test_id ('project_a'), '   '),
    0,
    'ICL: an address of blanks is admitted'
  );

SELECT
  is (
    public.invitation_caller_take (test_id ('project_a'), 'not-an-address'),
    0,
    'ICL: an address that does not parse is admitted'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        private.invitation_throttle
      WHERE
        key LIKE 'caller:%'
    ),
    0::bigint,
    'ICL: a NULL, empty, blank or unparseable address writes no caller row'
  );

SELECT
  is (
    public.invitation_caller_take (test_id ('project_a'), '198.51.100.7/8'),
    0,
    'ICL: an address carrying a mask is admitted at its first take'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          key,
          ','
          ORDER BY
            key
        )
      FROM
        private.invitation_throttle
      WHERE
        key LIKE 'caller:%'
    ),
    'caller:' || test_id ('project_a')::text || ':198.51.100.7',
    'ICL: an address carrying a mask is keyed by its host alone'
  );

-- =====================================================================
-- 4. IPv6: one /64 is one caller
-- =====================================================================
SELECT
  reset_role ();

DELETE FROM private.invitation_throttle
WHERE
  key LIKE 'caller:%';

UPDATE private.deployment_settings
SET
  behind_cloudflare = true;

SELECT
  is (
    (
      SELECT
        count(*) FILTER (
          WHERE
            s.r = 0
        )
      FROM
        (
          SELECT
            public.invitation_caller_take (
              test_id ('project_a'),
              CASE
                WHEN g % 2 = 0 THEN '2001:db8:1:2::1'
                ELSE '2001:db8:1:2::ffff'
              END
            ) AS r
          FROM
            generate_series(1, 30) g
        ) s
    ),
    30::bigint,
    'ICL: thirty takes shared between two addresses of one /64 are admitted'
  );

SELECT
  ok (
    public.invitation_caller_take (test_id ('project_a'), '2001:db8:1:2::1') BETWEEN 1 AND 600,
    'ICL: the thirty-first take across two addresses of one /64 is refused'
  );

SELECT
  is (
    public.invitation_caller_take (test_id ('project_a'), '2001:db8:1:3::1'),
    0,
    'ICL: an address of another /64 is admitted'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          key,
          ','
          ORDER BY
            key
        )
      FROM
        private.invitation_throttle
      WHERE
        key LIKE 'caller:%'
    ),
    'caller:' || test_id ('project_a')::text || ':2001:db8:1:2::/64,caller:' || test_id ('project_a')::text || ':2001:db8:1:3::/64',
    'ICL: an IPv6 address is keyed by its /64'
  );

-- =====================================================================
-- 5. An id that names no project
-- =====================================================================
SELECT
  reset_role ();

DELETE FROM private.invitation_throttle
WHERE
  key LIKE 'caller:%';

UPDATE private.deployment_settings
SET
  behind_cloudflare = true;

SELECT
  is (
    public.invitation_caller_take (
      '00000000-0000-4000-8000-0000000000c1',
      '198.51.100.7'
    ),
    0,
    'ICL: a take for an id that names no project is admitted'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        private.invitation_throttle
      WHERE
        key LIKE 'caller:%'
    ),
    0::bigint,
    'ICL: a take for an id that names no project writes no caller row'
  );

-- =====================================================================
-- 6. A caller row is held only while its window runs
-- =====================================================================
SELECT
  reset_role ();

DELETE FROM private.invitation_throttle
WHERE
  key LIKE 'caller:%';

UPDATE private.deployment_settings
SET
  behind_cloudflare = true;

DO $$
BEGIN
  PERFORM public.invitation_caller_take (test_id ('project_a'), '198.51.100.7');
  PERFORM public.invitation_caller_take (test_id ('project_a'), '198.51.100.8');
END;
$$;

UPDATE private.invitation_throttle
SET
  window_start = now() - interval '10 minutes'
WHERE
  key = 'caller:' || test_id ('project_a')::text || ':198.51.100.7';

INSERT INTO
  private.invitation_throttle (key, count, window_start)
VALUES
  (
    'link:' || test_id ('project_a')::text || ':icl-ended-window',
    1,
    now() - interval '1 day'
  );

DO $$
BEGIN
  PERFORM public.invitation_caller_take (test_id ('project_a'), '198.51.100.9');
END;
$$;

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        private.invitation_throttle
      WHERE
        key = 'caller:' || test_id ('project_a')::text || ':198.51.100.7'
    ),
    0::bigint,
    'ICL: a caller row whose window has ended is deleted by the next take of another address'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        private.invitation_throttle
      WHERE
        key = 'caller:' || test_id ('project_a')::text || ':198.51.100.8'
    ),
    1::bigint,
    'ICL: a caller row whose window still runs is kept'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        private.invitation_throttle
      WHERE
        key = 'link:' || test_id ('project_a')::text || ':icl-ended-window'
    ),
    1::bigint,
    'ICL: a row of another key form whose window has ended is kept'
  );

-- =====================================================================
-- 7. Privileges and definition
-- =====================================================================
SELECT
  reset_role ();

SELECT
  set_test_user ('anon');

SELECT
  throws_ok (
    format(
      $$SELECT public.invitation_caller_take (%L, '198.51.100.7')$$,
      test_id ('project_a')
    ),
    '42501',
    NULL,
    'ICL: anon cannot execute it'
  );

SELECT
  reset_role ();

SELECT
  set_test_user ('authenticated', test_user_id ('admin_a'));

SELECT
  throws_ok (
    format(
      $$SELECT public.invitation_caller_take (%L, '198.51.100.7')$$,
      test_id ('project_a')
    ),
    '42501',
    NULL,
    'ICL: authenticated cannot execute it'
  );

SELECT
  reset_role ();

DELETE FROM private.invitation_throttle
WHERE
  key LIKE 'caller:%';

SELECT
  set_config('role', 'service_role', true);

SELECT
  is (
    public.invitation_caller_take (test_id ('project_a'), '198.51.100.7'),
    0,
    'ICL: service_role may execute it'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        p.prosecdef::text || ' ' || p.proconfig::text || ' ' || p.prorettype::regtype::text
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'public'
        AND p.proname = 'invitation_caller_take'
    ),
    'true {"search_path=\"\""} integer',
    'ICL: it is SECURITY DEFINER with an empty pinned search_path and returns integer'
  );

SELECT
  *
FROM
  finish ();

ROLLBACK;
