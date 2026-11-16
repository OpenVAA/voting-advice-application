-- Seed check: does this database hold anything of the local seed?
--
-- apps/supabase/supabase/seed.sql is for a local stack only. It creates users with a published password, and writes the local stack's address and the public demo key into public.storage_config. This check fails when it finds any of that, and names each finding:
--   - a seed user: a row of auth.users whose address is in the `openvaa.test` domain, or whose id is one of the two the seed uses
--   - a local address: the `supabase_url` row of public.storage_config is absent, does not begin with `https://`, or names `kong`, `localhost`, `127.0.0.1` or `host.docker.internal`. A name counts only as a whole word, so a host that merely contains one of them inside a longer word is not refused.
--   - the demo key: the `service_role_key` row of public.storage_config holds a JWT whose issuer is `supabase-demo`
--
-- It reads and never writes, and it never prints a key. Of a seed user it prints the id, and the address only when the address is in the seed's domain.
--
-- Run, with the connection in the libpq variables PGHOST, PGPORT, PGUSER, PGDATABASE and PGPASSWORD, as a role that reads auth.users and public.storage_config:
--   psql -X -f infra/scripts/check-seed.sql
--
-- Run it by itself. Included from another script with `\i`, a finding ends this script only, and the status is the including script's.
--
-- Exit status, which is psql's own and is the verdict:
--   0  nothing of the seed was found
--   2  the connection was refused or lost
--   3  a finding, reported in an error whose message begins `check-seed:`. Any other error with this status means the check could not run.
\set ON_ERROR_STOP on

DO $check$
DECLARE
  seed_domain constant text := '@openvaa.test';
  seed_user_ids constant uuid[] := ARRAY[
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000011'
  ]::uuid[];
  listed_users constant integer := 10;
  findings text[] := ARRAY[]::text[];
  seed_user_count bigint;
  seed_user_list text;
  storage_url text;
  service_key text;
  payload text;
  issuer text;
BEGIN
  SELECT count(*)
  INTO seed_user_count
  FROM auth.users
  WHERE lower(email) LIKE '%' || seed_domain
    OR id = ANY (seed_user_ids);

  IF seed_user_count > 0 THEN
    SELECT string_agg(described, ', ')
    INTO seed_user_list
    FROM (
      SELECT
        CASE
          WHEN lower(email) LIKE '%' || seed_domain THEN email || ' (id ' || id || ')'
          ELSE 'id ' || id || ' (its address is outside the seed domain and is not shown)'
        END AS described
      FROM auth.users
      WHERE lower(email) LIKE '%' || seed_domain
        OR id = ANY (seed_user_ids)
      ORDER BY id
      LIMIT listed_users
    ) AS listed;

    findings := findings || format(
      'seed user: auth.users holds %s row(s) of the local seed, the first %s being: %s',
      seed_user_count,
      least(seed_user_count, listed_users),
      seed_user_list
    );
  END IF;

  SELECT value INTO storage_url FROM public.storage_config WHERE key = 'supabase_url';

  IF storage_url IS NULL THEN
    findings := findings || 'local address: public.storage_config has no supabase_url row, so no deployment address has been written'::text;
  ELSIF storage_url !~* '^https://' THEN
    findings := findings || format('local address: the supabase_url row of public.storage_config does not begin with https:// (%s)', storage_url);
  ELSIF lower(storage_url) ~ '(^|[^a-z0-9])(kong|localhost|127\.0\.0\.1|host\.docker\.internal)([^a-z0-9]|$)' THEN
    findings := findings || format('local address: the supabase_url row of public.storage_config names a local host (%s)', storage_url);
  END IF;

  SELECT value INTO service_key FROM public.storage_config WHERE key = 'service_role_key';

  -- A JWT is three base64url segments. The second is decoded to read its issuer; a value that does not decode is not the demo key.
  IF service_key ~ '^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$' THEN
    BEGIN
      payload := translate(split_part(service_key, '.', 2), '-_', '+/');
      payload := payload || repeat('=', (4 - length(payload) % 4) % 4);
      issuer := convert_from(decode(payload, 'base64'), 'UTF8')::jsonb ->> 'iss';
    EXCEPTION
      WHEN OTHERS THEN
        issuer := NULL;
    END;

    IF issuer = 'supabase-demo' THEN
      findings := findings || 'demo key: the service_role_key row of public.storage_config holds the public demo key of a local stack (a JWT whose issuer is supabase-demo)'::text;
    END IF;
  END IF;

  IF cardinality(findings) > 0 THEN
    RAISE EXCEPTION E'check-seed: % finding(s)\n  - %', cardinality(findings), array_to_string(findings, E'\n  - ');
  END IF;
END
$check$;
