-- 35-feedback-rate-limit-key.test.sql: the feedback rate limit keys on an address the client cannot choose
--
-- `check_feedback_rate_limit` allows five feedback inserts per five minutes per client. It keys the counter on `private.feedback_client_ip`, passing `private.deployment_settings.behind_cloudflare` as the helper's trust flag, and a missing settings row reads as false.
--
-- With the flag true the key is `cf-connecting-ip`, which Cloudflare sets to the connecting client. With the flag false a client-sent `cf-connecting-ip` is ignored. Either way the fallback is the last `x-forwarded-for` entry, which the gateway appends from the connection's peer, and otherwise `unknown`. The earlier `x-forwarded-for` entries are written by the client and are never read.
--
-- Each trigger block sets the flag explicitly at its start, as postgres, so the value `seed.sql` supplies never decides an assertion. Each insert sets `request.headers` to exactly the headers of that request, as PostgREST does. Client-written values use 192.0.2.0/24 (TEST-NET-1) and the values a key can land on use 198.51.100.0/24 (TEST-NET-2).
--
-- Before each block the rate-limit rows in both ranges are deleted, so leftover local state cannot decide an assertion. The final ROLLBACK undoes the deletions and every settings change.
--
-- Direct calls to the helper pin its precedence for both flag values, the fallbacks for missing, empty and malformed values, IPv6 normalisation, and that neither API role can execute it. The settings table's default, its single-row constraint and its privileges are pinned as well.
--
-- Depends on: 00-helpers.test.sql (set_test_user, reset_role, create_test_data, test_id).
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (56);

SELECT
  create_test_data ();

-- =====================================================================
-- 1. Rotating the client-written first x-forwarded-for entry does not open a new bucket
-- =====================================================================
SELECT
  reset_role ();

DELETE FROM private.feedback_rate_limits
WHERE
  ip_address LIKE '192.0.2.%'
  OR ip_address LIKE '198.51.100.%';

UPDATE private.deployment_settings
SET
  behind_cloudflare = false;

SELECT
  set_test_user ('anon');

SELECT
  set_config(
    'request.headers',
    '{"x-forwarded-for":"192.0.2.1, 198.51.100.10"}',
    true
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO feedback (project_id, rating) VALUES (%L, 1)$$,
      test_id ('project_a')
    ),
    'rotation: insert 1 behind gateway hop 198.51.100.10 succeeds'
  );

SELECT
  set_config(
    'request.headers',
    '{"x-forwarded-for":"192.0.2.2, 198.51.100.10"}',
    true
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO feedback (project_id, rating) VALUES (%L, 2)$$,
      test_id ('project_a')
    ),
    'rotation: insert 2 behind gateway hop 198.51.100.10 succeeds'
  );

SELECT
  set_config(
    'request.headers',
    '{"x-forwarded-for":"192.0.2.3, 198.51.100.10"}',
    true
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO feedback (project_id, rating) VALUES (%L, 3)$$,
      test_id ('project_a')
    ),
    'rotation: insert 3 behind gateway hop 198.51.100.10 succeeds'
  );

SELECT
  set_config(
    'request.headers',
    '{"x-forwarded-for":"192.0.2.4, 198.51.100.10"}',
    true
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO feedback (project_id, rating) VALUES (%L, 4)$$,
      test_id ('project_a')
    ),
    'rotation: insert 4 behind gateway hop 198.51.100.10 succeeds'
  );

SELECT
  set_config(
    'request.headers',
    '{"x-forwarded-for":"192.0.2.5, 198.51.100.10"}',
    true
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO feedback (project_id, rating) VALUES (%L, 5)$$,
      test_id ('project_a')
    ),
    'rotation: insert 5 behind gateway hop 198.51.100.10 succeeds'
  );

SELECT
  set_config(
    'request.headers',
    '{"x-forwarded-for":"192.0.2.6, 198.51.100.10"}',
    true
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO feedback (project_id, rating) VALUES (%L, 1)$$,
      test_id ('project_a')
    ),
    'P0001',
    'Rate limit exceeded. Please try again later.',
    'rotation: a sixth insert with a new first entry behind the same gateway hop is refused'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        count
      FROM
        private.feedback_rate_limits
      WHERE
        ip_address = '198.51.100.10'
    ),
    5,
    'rotation: the counter is keyed on the gateway hop and holds the five accepted inserts'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        private.feedback_rate_limits
      WHERE
        ip_address LIKE '192.0.2.%'
    )::integer,
    0,
    'rotation: no counter is keyed on a client-written x-forwarded-for entry'
  );

-- =====================================================================
-- 2. Not behind Cloudflare: rotating a client-sent cf-connecting-ip does not open a new bucket
-- =====================================================================
SELECT
  reset_role ();

DELETE FROM private.feedback_rate_limits
WHERE
  ip_address LIKE '192.0.2.%'
  OR ip_address LIKE '198.51.100.%';

UPDATE private.deployment_settings
SET
  behind_cloudflare = false;

SELECT
  set_test_user ('anon');

SELECT
  set_config(
    'request.headers',
    '{"x-forwarded-for":"198.51.100.50","cf-connecting-ip":"198.51.100.51"}',
    true
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO feedback (project_id, rating) VALUES (%L, 1)$$,
      test_id ('project_a')
    ),
    'untrusted cf-connecting-ip: insert 1 behind gateway hop 198.51.100.50 succeeds'
  );

SELECT
  set_config(
    'request.headers',
    '{"x-forwarded-for":"198.51.100.50","cf-connecting-ip":"198.51.100.52"}',
    true
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO feedback (project_id, rating) VALUES (%L, 2)$$,
      test_id ('project_a')
    ),
    'untrusted cf-connecting-ip: insert 2 behind gateway hop 198.51.100.50 succeeds'
  );

SELECT
  set_config(
    'request.headers',
    '{"x-forwarded-for":"198.51.100.50","cf-connecting-ip":"198.51.100.53"}',
    true
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO feedback (project_id, rating) VALUES (%L, 3)$$,
      test_id ('project_a')
    ),
    'untrusted cf-connecting-ip: insert 3 behind gateway hop 198.51.100.50 succeeds'
  );

SELECT
  set_config(
    'request.headers',
    '{"x-forwarded-for":"198.51.100.50","cf-connecting-ip":"198.51.100.54"}',
    true
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO feedback (project_id, rating) VALUES (%L, 4)$$,
      test_id ('project_a')
    ),
    'untrusted cf-connecting-ip: insert 4 behind gateway hop 198.51.100.50 succeeds'
  );

SELECT
  set_config(
    'request.headers',
    '{"x-forwarded-for":"198.51.100.50","cf-connecting-ip":"198.51.100.55"}',
    true
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO feedback (project_id, rating) VALUES (%L, 5)$$,
      test_id ('project_a')
    ),
    'untrusted cf-connecting-ip: insert 5 behind gateway hop 198.51.100.50 succeeds'
  );

SELECT
  set_config(
    'request.headers',
    '{"x-forwarded-for":"198.51.100.50","cf-connecting-ip":"198.51.100.56"}',
    true
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO feedback (project_id, rating) VALUES (%L, 1)$$,
      test_id ('project_a')
    ),
    'P0001',
    'Rate limit exceeded. Please try again later.',
    'untrusted cf-connecting-ip: a sixth insert with a sixth cf-connecting-ip behind the same gateway hop is refused'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        count
      FROM
        private.feedback_rate_limits
      WHERE
        ip_address = '198.51.100.50'
    ),
    5,
    'untrusted cf-connecting-ip: the counter is keyed on the gateway hop and holds the five accepted inserts'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        private.feedback_rate_limits
      WHERE
        ip_address IN (
          '198.51.100.51',
          '198.51.100.52',
          '198.51.100.53',
          '198.51.100.54',
          '198.51.100.55',
          '198.51.100.56'
        )
    )::integer,
    0,
    'untrusted cf-connecting-ip: no counter is keyed on a cf-connecting-ip value'
  );

-- =====================================================================
-- 3. Behind Cloudflare: cf-connecting-ip decides the bucket when present
-- =====================================================================
SELECT
  reset_role ();

DELETE FROM private.feedback_rate_limits
WHERE
  ip_address LIKE '192.0.2.%'
  OR ip_address LIKE '198.51.100.%';

UPDATE private.deployment_settings
SET
  behind_cloudflare = true;

SELECT
  set_test_user ('anon');

SELECT
  set_config(
    'request.headers',
    '{"x-forwarded-for":"198.51.100.31","cf-connecting-ip":"198.51.100.20"}',
    true
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO feedback (project_id, rating) VALUES (%L, 1)$$,
      test_id ('project_a')
    ),
    'cf-connecting-ip: insert 1 from 198.51.100.20 succeeds'
  );

SELECT
  set_config(
    'request.headers',
    '{"x-forwarded-for":"198.51.100.32","cf-connecting-ip":"198.51.100.20"}',
    true
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO feedback (project_id, rating) VALUES (%L, 2)$$,
      test_id ('project_a')
    ),
    'cf-connecting-ip: insert 2 from 198.51.100.20 succeeds'
  );

SELECT
  set_config(
    'request.headers',
    '{"x-forwarded-for":"198.51.100.33","cf-connecting-ip":"198.51.100.20"}',
    true
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO feedback (project_id, rating) VALUES (%L, 3)$$,
      test_id ('project_a')
    ),
    'cf-connecting-ip: insert 3 from 198.51.100.20 succeeds'
  );

SELECT
  set_config(
    'request.headers',
    '{"x-forwarded-for":"198.51.100.34","cf-connecting-ip":"198.51.100.20"}',
    true
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO feedback (project_id, rating) VALUES (%L, 4)$$,
      test_id ('project_a')
    ),
    'cf-connecting-ip: insert 4 from 198.51.100.20 succeeds'
  );

SELECT
  set_config(
    'request.headers',
    '{"x-forwarded-for":"198.51.100.35","cf-connecting-ip":"198.51.100.20"}',
    true
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO feedback (project_id, rating) VALUES (%L, 5)$$,
      test_id ('project_a')
    ),
    'cf-connecting-ip: insert 5 from 198.51.100.20 succeeds'
  );

SELECT
  set_config(
    'request.headers',
    '{"x-forwarded-for":"198.51.100.36","cf-connecting-ip":"198.51.100.20"}',
    true
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO feedback (project_id, rating) VALUES (%L, 1)$$,
      test_id ('project_a')
    ),
    'P0001',
    'Rate limit exceeded. Please try again later.',
    'cf-connecting-ip: a sixth insert from the same cf-connecting-ip is refused whatever the last hop'
  );

-- =====================================================================
-- 4. Behind Cloudflare: distinct cf-connecting-ip values behind one shared hop keep separate buckets
-- =====================================================================
SELECT
  reset_role ();

DELETE FROM private.feedback_rate_limits
WHERE
  ip_address LIKE '192.0.2.%'
  OR ip_address LIKE '198.51.100.%';

UPDATE private.deployment_settings
SET
  behind_cloudflare = true;

SELECT
  set_test_user ('anon');

SELECT
  set_config(
    'request.headers',
    '{"x-forwarded-for":"198.51.100.99","cf-connecting-ip":"198.51.100.41"}',
    true
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO feedback (project_id, rating) VALUES (%L, 1)$$,
      test_id ('project_a')
    ),
    'shared hop: insert from 198.51.100.41 succeeds'
  );

SELECT
  set_config(
    'request.headers',
    '{"x-forwarded-for":"198.51.100.99","cf-connecting-ip":"198.51.100.42"}',
    true
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO feedback (project_id, rating) VALUES (%L, 2)$$,
      test_id ('project_a')
    ),
    'shared hop: insert from 198.51.100.42 succeeds'
  );

SELECT
  set_config(
    'request.headers',
    '{"x-forwarded-for":"198.51.100.99","cf-connecting-ip":"198.51.100.43"}',
    true
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO feedback (project_id, rating) VALUES (%L, 3)$$,
      test_id ('project_a')
    ),
    'shared hop: insert from 198.51.100.43 succeeds'
  );

SELECT
  set_config(
    'request.headers',
    '{"x-forwarded-for":"198.51.100.99","cf-connecting-ip":"198.51.100.44"}',
    true
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO feedback (project_id, rating) VALUES (%L, 4)$$,
      test_id ('project_a')
    ),
    'shared hop: insert from 198.51.100.44 succeeds'
  );

SELECT
  set_config(
    'request.headers',
    '{"x-forwarded-for":"198.51.100.99","cf-connecting-ip":"198.51.100.45"}',
    true
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO feedback (project_id, rating) VALUES (%L, 5)$$,
      test_id ('project_a')
    ),
    'shared hop: insert from 198.51.100.45 succeeds'
  );

SELECT
  set_config(
    'request.headers',
    '{"x-forwarded-for":"198.51.100.99","cf-connecting-ip":"198.51.100.46"}',
    true
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO feedback (project_id, rating) VALUES (%L, 1)$$,
      test_id ('project_a')
    ),
    'shared hop: a sixth insert from a sixth cf-connecting-ip succeeds, so clients behind one hop are not collapsed into one bucket'
  );

-- =====================================================================
-- 5. The settings table: default, single row, privileges
-- =====================================================================
SELECT
  reset_role ();

SELECT
  col_default_is (
    'private',
    'deployment_settings',
    'behind_cloudflare',
    'false',
    'behind_cloudflare defaults to false'
  );

SELECT
  throws_ok (
    $$INSERT INTO private.deployment_settings DEFAULT VALUES$$,
    '23505',
    NULL,
    'a second default settings row is refused'
  );

SELECT
  throws_ok (
    $$INSERT INTO private.deployment_settings (singleton, behind_cloudflare) VALUES (false, true)$$,
    '23514',
    NULL,
    'a settings row with another singleton key is refused'
  );

SELECT
  ok (
    NOT has_table_privilege('anon', 'private.deployment_settings', 'SELECT'),
    'anon has no SELECT on private.deployment_settings'
  );

SELECT
  ok (
    NOT has_table_privilege('anon', 'private.deployment_settings', 'INSERT'),
    'anon has no INSERT on private.deployment_settings'
  );

SELECT
  ok (
    NOT has_table_privilege('anon', 'private.deployment_settings', 'UPDATE'),
    'anon has no UPDATE on private.deployment_settings'
  );

SELECT
  ok (
    NOT has_table_privilege('anon', 'private.deployment_settings', 'DELETE'),
    'anon has no DELETE on private.deployment_settings'
  );

SELECT
  ok (
    NOT has_table_privilege(
      'authenticated',
      'private.deployment_settings',
      'SELECT'
    ),
    'authenticated has no SELECT on private.deployment_settings'
  );

SELECT
  ok (
    NOT has_table_privilege(
      'authenticated',
      'private.deployment_settings',
      'INSERT'
    ),
    'authenticated has no INSERT on private.deployment_settings'
  );

SELECT
  ok (
    NOT has_table_privilege(
      'authenticated',
      'private.deployment_settings',
      'UPDATE'
    ),
    'authenticated has no UPDATE on private.deployment_settings'
  );

SELECT
  ok (
    NOT has_table_privilege(
      'authenticated',
      'private.deployment_settings',
      'DELETE'
    ),
    'authenticated has no DELETE on private.deployment_settings'
  );

-- =====================================================================
-- 6. A missing settings row fails closed: cf-connecting-ip is not trusted
-- =====================================================================
SELECT
  reset_role ();

DELETE FROM private.feedback_rate_limits
WHERE
  ip_address LIKE '192.0.2.%'
  OR ip_address LIKE '198.51.100.%';

DELETE FROM private.deployment_settings;

SELECT
  set_test_user ('anon');

SELECT
  set_config(
    'request.headers',
    '{"x-forwarded-for":"198.51.100.60","cf-connecting-ip":"198.51.100.61"}',
    true
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO feedback (project_id, rating) VALUES (%L, 1)$$,
      test_id ('project_a')
    ),
    'missing settings: an insert behind gateway hop 198.51.100.60 succeeds'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        count
      FROM
        private.feedback_rate_limits
      WHERE
        ip_address = '198.51.100.60'
    ),
    1,
    'missing settings: the counter is keyed on the gateway hop'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        private.feedback_rate_limits
      WHERE
        ip_address = '198.51.100.61'
    )::integer,
    0,
    'missing settings: no counter is keyed on the cf-connecting-ip value'
  );

-- =====================================================================
-- 7. The helper's precedence and fallbacks
-- =====================================================================
SELECT
  is (
    private.feedback_client_ip (
      '{"x-forwarded-for":"192.0.2.1, 192.0.2.2, 198.51.100.7"}'::json,
      true
    ),
    '198.51.100.7',
    'the helper takes the last x-forwarded-for entry of a chain'
  );

SELECT
  is (
    private.feedback_client_ip (
      '{"x-forwarded-for":"192.0.2.1 ,  198.51.100.7 "}'::json,
      true
    ),
    '198.51.100.7',
    'the helper ignores whitespace around x-forwarded-for entries'
  );

SELECT
  is (
    private.feedback_client_ip (
      '{"x-forwarded-for":"192.0.2.1, 198.51.100.7","cf-connecting-ip":"198.51.100.20"}'::json,
      true
    ),
    '198.51.100.20',
    'trusted, the helper prefers cf-connecting-ip over the last hop'
  );

SELECT
  is (
    private.feedback_client_ip (
      '{"x-forwarded-for":"198.51.100.7","cf-connecting-ip":"not-an-address"}'::json,
      true
    ),
    '198.51.100.7',
    'the helper ignores a cf-connecting-ip that is not an address'
  );

SELECT
  is (
    private.feedback_client_ip (
      '{"x-forwarded-for":"198.51.100.7","cf-connecting-ip":""}'::json,
      true
    ),
    '198.51.100.7',
    'the helper ignores an empty cf-connecting-ip'
  );

SELECT
  is (
    private.feedback_client_ip (
      '{"x-forwarded-for":"192.0.2.1, not-an-address"}'::json,
      true
    ),
    'unknown',
    'a malformed last hop yields unknown, never a client-written earlier entry'
  );

SELECT
  is (
    private.feedback_client_ip ('{"cf-connecting-ip":"2001:DB8::1"}'::json, true),
    '2001:db8::1',
    'the helper normalises an IPv6 address'
  );

SELECT
  is (
    private.feedback_client_ip ('{}'::json, true),
    'unknown',
    'headers without either field yield unknown'
  );

SELECT
  is (
    private.feedback_client_ip (NULL::json, true),
    'unknown',
    'NULL headers yield unknown'
  );

SELECT
  is (
    private.feedback_client_ip (
      '{"x-forwarded-for":"192.0.2.1, 198.51.100.7","cf-connecting-ip":"198.51.100.20"}'::json,
      false
    ),
    '198.51.100.7',
    'untrusted, the helper ignores a valid cf-connecting-ip and takes the last hop'
  );

SELECT
  is (
    private.feedback_client_ip (
      '{"cf-connecting-ip":"198.51.100.20"}'::json,
      false
    ),
    'unknown',
    'untrusted, a cf-connecting-ip alone yields unknown'
  );

SELECT
  has_function (
    'private',
    'feedback_client_ip',
    ARRAY['json', 'boolean'],
    'private.feedback_client_ip(json, boolean) exists'
  );

SELECT
  ok (
    NOT has_function_privilege(
      'anon',
      'private.feedback_client_ip(json, boolean)',
      'EXECUTE'
    ),
    'anon cannot execute private.feedback_client_ip'
  );

SELECT
  ok (
    NOT has_function_privilege(
      'authenticated',
      'private.feedback_client_ip(json, boolean)',
      'EXECUTE'
    ),
    'authenticated cannot execute private.feedback_client_ip'
  );

SELECT
  *
FROM
  finish ();

ROLLBACK;
