-- 59-access-caller-limit.test.sql: the per-caller limit on the anonymous account-access operations
--
-- `access_caller_take (p_project_id, p_address)` takes one slot of a caller in a project through `private.access_throttle_take` and answers 0 when the take is admitted, or the whole seconds until the caller's window ends when it is refused: `private.deployment_settings.access_caller_max` takes per caller per project per ten minutes, thirty by default. The caller is the address the Edge Function read from `cf-connecting-ip`, bucketed by `private.client_address_bucket`: an IPv4 address keyed by its host, an IPv4-mapped IPv6 address (`::ffff:a.b.c.d`) by its IPv4 host and any other IPv6 address by its /64, under the key `caller:<project id>:<caller>`. The feedback limit keys a trusted `cf-connecting-ip` by the same bucket.
--
-- The address is trusted only when `private.deployment_settings.behind_cloudflare` is true and the address is present and parses. Otherwise, and for an id that names no project, the function answers 0 and writes no row, so an absent or unparseable address never shares one bucket. Each take takes its own slot first and then deletes the other `caller:` rows whose window has ended, and no other row; the cleanup skips a row another transaction has locked, so it waits for nothing while the take holds its key's advisory lock.
--
-- Every assertion's description begins with `ACL: `. Each block sets the flag and the limit explicitly at its start, as postgres, so the values `seed.sql` and the column default supply never decide an assertion, and deletes every `caller:` row, so leftover local state cannot decide one either. Addresses use 198.51.100.0/24 (TEST-NET-2) and 2001:db8::/32. `now()` is frozen inside the transaction, so a window is ended by moving `window_start` back with UPDATE. The final ROLLBACK undoes every write and settings change.
--
-- Depends on:
-- - 00-helpers.test.sql (create_test_data, test_id, test_user_id, set_test_user, reset_role)
-- - 109-deployment-settings.sql (private.deployment_settings, private.client_address_bucket)
-- - 107-feedback.sql (private.feedback_client_ip)
-- - 506-invitation-rpcs.sql (the function and the throttle table)
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (44);

SELECT
  create_test_data ();

-- =====================================================================
-- 1. Trusted IPv4: thirty takes admitted, the thirty-first refused, the same address admitted in another project, another address admitted
-- =====================================================================
SELECT
  reset_role ();

DELETE FROM private.access_throttle
WHERE
  key LIKE 'caller:%';

UPDATE private.deployment_settings
SET
  behind_cloudflare = true,
  access_caller_max = 30;

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
            public.access_caller_take (test_id ('project_a'), '198.51.100.7') AS r
          FROM
            generate_series(1, 30)
        ) s
    ),
    30::bigint,
    'ACL: thirty takes of one address in one project are admitted'
  );

SELECT
  ok (
    s.r BETWEEN 1 AND 600,
    'ACL: the thirty-first take is refused with the seconds until the window ends, between 1 and 600'
  )
FROM
  (
    SELECT
      public.access_caller_take (test_id ('project_a'), '198.51.100.7') AS r
  ) s;

SELECT
  is (
    public.access_caller_take (test_id ('project_b'), '198.51.100.7'),
    0,
    'ACL: the address refused in one project is admitted in another, so the bucket is per project'
  );

SELECT
  is (
    (
      SELECT
        count
      FROM
        private.access_throttle
      WHERE
        key = 'caller:' || test_id ('project_b')::text || ':198.51.100.7'
    ),
    1,
    'ACL: the take in the other project is counted under that project''s own key'
  );

SELECT
  is (
    public.access_caller_take (test_id ('project_a'), '198.51.100.8'),
    0,
    'ACL: another address at the same moment is admitted'
  );

-- =====================================================================
-- 2. Untrusted: the flag false admits and writes nothing
-- =====================================================================
SELECT
  reset_role ();

DELETE FROM private.access_throttle
WHERE
  key LIKE 'caller:%';

UPDATE private.deployment_settings
SET
  behind_cloudflare = false,
  access_caller_max = 30;

SELECT
  is (
    public.access_caller_take (test_id ('project_a'), '198.51.100.9'),
    0,
    'ACL: with behind_cloudflare false a take is admitted'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        private.access_throttle
      WHERE
        key LIKE 'caller:%'
    ),
    0::bigint,
    'ACL: with behind_cloudflare false no caller row is written'
  );

-- =====================================================================
-- 3. Absent, blank, unparseable and masked addresses
-- =====================================================================
SELECT
  reset_role ();

DELETE FROM private.access_throttle
WHERE
  key LIKE 'caller:%';

UPDATE private.deployment_settings
SET
  behind_cloudflare = true,
  access_caller_max = 30;

SELECT
  is (
    public.access_caller_take (test_id ('project_a'), NULL),
    0,
    'ACL: a NULL address is admitted'
  );

SELECT
  is (
    public.access_caller_take (test_id ('project_a'), ''),
    0,
    'ACL: an empty address is admitted'
  );

SELECT
  is (
    public.access_caller_take (test_id ('project_a'), '   '),
    0,
    'ACL: an address of blanks is admitted'
  );

SELECT
  is (
    public.access_caller_take (test_id ('project_a'), 'not-an-address'),
    0,
    'ACL: an address that does not parse is admitted'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        private.access_throttle
      WHERE
        key LIKE 'caller:%'
    ),
    0::bigint,
    'ACL: a NULL, empty, blank or unparseable address writes no caller row'
  );

SELECT
  is (
    public.access_caller_take (test_id ('project_a'), '198.51.100.7/8'),
    0,
    'ACL: an address carrying a mask is admitted at its first take'
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
        private.access_throttle
      WHERE
        key LIKE 'caller:%'
    ),
    'caller:' || test_id ('project_a')::text || ':198.51.100.7',
    'ACL: an address carrying a mask is keyed by its host alone'
  );

-- =====================================================================
-- 4. IPv6: one /64 is one caller
-- =====================================================================
SELECT
  reset_role ();

DELETE FROM private.access_throttle
WHERE
  key LIKE 'caller:%';

UPDATE private.deployment_settings
SET
  behind_cloudflare = true,
  access_caller_max = 30;

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
            public.access_caller_take (
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
    'ACL: thirty takes shared between two addresses of one /64 are admitted'
  );

SELECT
  ok (
    s.r BETWEEN 1 AND 600,
    'ACL: the thirty-first take across two addresses of one /64 is refused'
  )
FROM
  (
    SELECT
      public.access_caller_take (test_id ('project_a'), '2001:db8:1:2::1') AS r
  ) s;

SELECT
  is (
    public.access_caller_take (test_id ('project_a'), '2001:db8:1:3::1'),
    0,
    'ACL: an address of another /64 is admitted'
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
        private.access_throttle
      WHERE
        key LIKE 'caller:%'
    ),
    'caller:' || test_id ('project_a')::text || ':2001:db8:1:2::/64,caller:' || test_id ('project_a')::text || ':2001:db8:1:3::/64',
    'ACL: an IPv6 address is keyed by its /64'
  );

-- =====================================================================
-- 5. An id that names no project
-- =====================================================================
SELECT
  reset_role ();

DELETE FROM private.access_throttle
WHERE
  key LIKE 'caller:%';

UPDATE private.deployment_settings
SET
  behind_cloudflare = true,
  access_caller_max = 30;

SELECT
  is (
    public.access_caller_take (
      '00000000-0000-4000-8000-0000000000c1',
      '198.51.100.7'
    ),
    0,
    'ACL: a take for an id that names no project is admitted'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        private.access_throttle
      WHERE
        key LIKE 'caller:%'
    ),
    0::bigint,
    'ACL: a take for an id that names no project writes no caller row'
  );

-- =====================================================================
-- 6. A caller row is held only while its window runs
-- =====================================================================
SELECT
  reset_role ();

DELETE FROM private.access_throttle
WHERE
  key LIKE 'caller:%';

UPDATE private.deployment_settings
SET
  behind_cloudflare = true,
  access_caller_max = 30;

DO $$
BEGIN
  PERFORM public.access_caller_take (test_id ('project_a'), '198.51.100.7');
  PERFORM public.access_caller_take (test_id ('project_a'), '198.51.100.8');
END;
$$;

UPDATE private.access_throttle
SET
  window_start = now() - interval '10 minutes'
WHERE
  key = 'caller:' || test_id ('project_a')::text || ':198.51.100.7';

INSERT INTO
  private.access_throttle (key, count, window_start)
VALUES
  (
    'link:' || test_id ('project_a')::text || ':acl-ended-window',
    1,
    now() - interval '1 day'
  );

DO $$
BEGIN
  PERFORM public.access_caller_take (test_id ('project_a'), '198.51.100.9');
END;
$$;

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        private.access_throttle
      WHERE
        key = 'caller:' || test_id ('project_a')::text || ':198.51.100.7'
    ),
    0::bigint,
    'ACL: a caller row whose window has ended is deleted by the next take of another address'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        private.access_throttle
      WHERE
        key = 'caller:' || test_id ('project_a')::text || ':198.51.100.8'
    ),
    1::bigint,
    'ACL: a caller row whose window still runs is kept'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        private.access_throttle
      WHERE
        key = 'link:' || test_id ('project_a')::text || ':acl-ended-window'
    ),
    1::bigint,
    'ACL: a row of another key form whose window has ended is kept'
  );

-- =====================================================================
-- 7. The take comes before the cleanup, and the cleanup waits for nothing
-- =====================================================================
SELECT
  reset_role ();

DELETE FROM private.access_throttle
WHERE
  key LIKE 'caller:%';

UPDATE private.deployment_settings
SET
  behind_cloudflare = true,
  access_caller_max = 30;

INSERT INTO
  private.access_throttle (key, count, window_start)
VALUES
  (
    'caller:' || test_id ('project_a')::text || ':198.51.100.7',
    30,
    now() - interval '10 minutes'
  );

SELECT
  is (
    public.access_caller_take (test_id ('project_a'), '198.51.100.7'),
    0,
    'ACL: a take on a caller''s own row whose window has ended is admitted'
  );

SELECT
  is (
    (
      SELECT
        t.count::text || ' ' || (t.window_start = now())::text
      FROM
        private.access_throttle t
      WHERE
        t.key = 'caller:' || test_id ('project_a')::text || ':198.51.100.7'
    ),
    '1 true',
    'ACL: the caller''s own ended row is taken anew, at 1 in a window starting now, and not deleted'
  );

-- Two concurrent takes cannot be run inside one pgTAP transaction, so the order that keeps them from waiting on each other is read from the definition: the take, which holds its key's advisory lock, before the cleanup, and a cleanup that leaves out the caller's own key and skips locked rows.
SELECT
  ok (
    (
      SELECT
        position('private.access_throttle_take' IN p.prosrc) > 0
        AND position('private.access_throttle_take' IN p.prosrc) < position('DELETE FROM private.access_throttle' IN p.prosrc)
        AND p.prosrc LIKE '%x.key <> v_key%'
        AND p.prosrc LIKE '%FOR UPDATE SKIP LOCKED%'
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'public'
        AND p.proname = 'access_caller_take'
    ),
    'ACL: the take comes before the cleanup, and the cleanup leaves out its own key and skips locked rows'
  );

-- =====================================================================
-- 8. An IPv4-mapped IPv6 address is its IPv4 address
-- =====================================================================
SELECT
  reset_role ();

DELETE FROM private.access_throttle
WHERE
  key LIKE 'caller:%';

UPDATE private.deployment_settings
SET
  behind_cloudflare = true,
  access_caller_max = 30;

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
            public.access_caller_take (
              test_id ('project_a'),
              CASE
                WHEN g % 2 = 0 THEN '::ffff:198.51.100.7'
                ELSE '198.51.100.7'
              END
            ) AS r
          FROM
            generate_series(1, 30) g
        ) s
    ),
    30::bigint,
    'ACL: thirty takes shared between an IPv4 address and its IPv4-mapped form are admitted'
  );

SELECT
  ok (
    s.r BETWEEN 1 AND 600,
    'ACL: the thirty-first take, in the IPv4-mapped form, is refused'
  )
FROM
  (
    SELECT
      public.access_caller_take (test_id ('project_a'), '::ffff:198.51.100.7') AS r
  ) s;

SELECT
  is (
    public.access_caller_take (test_id ('project_a'), '::ffff:198.51.100.8'),
    0,
    'ACL: another IPv4-mapped address is admitted, so the mapped addresses share no bucket'
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
        private.access_throttle
      WHERE
        key LIKE 'caller:%'
    ),
    'caller:' || test_id ('project_a')::text || ':198.51.100.7,caller:' || test_id ('project_a')::text || ':198.51.100.8',
    'ACL: an IPv4-mapped address is keyed by its IPv4 host'
  );

-- =====================================================================
-- 9. Privileges and definition
-- =====================================================================
SELECT
  reset_role ();

SELECT
  set_test_user ('anon');

SELECT
  throws_ok (
    format(
      $$SELECT public.access_caller_take (%L, '198.51.100.7')$$,
      test_id ('project_a')
    ),
    '42501',
    NULL,
    'ACL: anon cannot execute it'
  );

SELECT
  reset_role ();

SELECT
  set_test_user ('authenticated', test_user_id ('admin_a'));

SELECT
  throws_ok (
    format(
      $$SELECT public.access_caller_take (%L, '198.51.100.7')$$,
      test_id ('project_a')
    ),
    '42501',
    NULL,
    'ACL: authenticated cannot execute it'
  );

SELECT
  reset_role ();

DELETE FROM private.access_throttle
WHERE
  key LIKE 'caller:%';

SELECT
  set_config('role', 'service_role', true);

SELECT
  is (
    public.access_caller_take (test_id ('project_a'), '198.51.100.7'),
    0,
    'ACL: service_role may execute it'
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
        AND p.proname = 'access_caller_take'
    ),
    'true {"search_path=\"\""} integer',
    'ACL: it is SECURITY DEFINER with an empty pinned search_path and returns integer'
  );

-- =====================================================================
-- 10. The limit is the deployment's access_caller_max
-- =====================================================================
SELECT
  reset_role ();

DELETE FROM private.access_throttle
WHERE
  key LIKE 'caller:%';

UPDATE private.deployment_settings
SET
  behind_cloudflare = true,
  access_caller_max = 3;

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
            public.access_caller_take (test_id ('project_a'), '198.51.100.7') AS r
          FROM
            generate_series(1, 3)
        ) s
    ),
    3::bigint,
    'ACL: with access_caller_max 3, three takes of one address are admitted'
  );

SELECT
  ok (
    s.r BETWEEN 1 AND 600,
    'ACL: with access_caller_max 3, the fourth take is refused'
  )
FROM
  (
    SELECT
      public.access_caller_take (test_id ('project_a'), '198.51.100.7') AS r
  ) s;

UPDATE private.deployment_settings
SET
  access_caller_max = 5;

SELECT
  is (
    public.access_caller_take (test_id ('project_a'), '198.51.100.7'),
    0,
    'ACL: a raised access_caller_max applies to a window that is already running'
  );

SELECT
  col_default_is (
    'private',
    'deployment_settings',
    'access_caller_max',
    '30',
    'ACL: access_caller_max defaults to 30'
  );

SELECT
  throws_ok (
    $$UPDATE private.deployment_settings SET access_caller_max = 0$$,
    '23514',
    NULL,
    'ACL: an access_caller_max of 0 is refused'
  );

SELECT
  throws_ok (
    $$UPDATE private.deployment_settings SET access_caller_max = NULL$$,
    '23502',
    NULL,
    'ACL: a NULL access_caller_max is refused'
  );

-- =====================================================================
-- 11. One bucket rule: the caller key and the feedback key agree
-- =====================================================================
SELECT
  is (
    private.client_address_bucket ('2001:db8:1:2::1'),
    '2001:db8:1:2::/64',
    'ACL: the bucket of an IPv6 address is its /64'
  );

SELECT
  is (
    private.feedback_client_ip (
      '{"cf-connecting-ip":"2001:db8:1:2::ffff"}'::json,
      true
    ),
    '2001:db8:1:2::/64',
    'ACL: the feedback key of a trusted IPv6 cf-connecting-ip is its /64, the caller key''s bucket'
  );

SELECT
  is (
    private.feedback_client_ip (
      '{"cf-connecting-ip":"::ffff:198.51.100.7"}'::json,
      true
    ),
    '198.51.100.7',
    'ACL: the feedback key of a trusted IPv4-mapped cf-connecting-ip is its IPv4 host, the caller key''s bucket'
  );

SELECT
  ok (
    NOT has_function_privilege(
      'anon',
      'private.client_address_bucket(text)',
      'EXECUTE'
    )
    AND NOT has_function_privilege(
      'authenticated',
      'private.client_address_bucket(text)',
      'EXECUTE'
    )
    AND NOT has_function_privilege(
      'service_role',
      'private.client_address_bucket(text)',
      'EXECUTE'
    ),
    'ACL: no API role can execute private.client_address_bucket'
  );

SELECT
  *
FROM
  finish ();

ROLLBACK;
