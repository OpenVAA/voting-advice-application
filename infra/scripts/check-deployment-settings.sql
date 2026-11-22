-- Deployment settings check: does this database trust cf-connecting-ip?
--
-- It reads the one row of private.deployment_settings. Unless its `behind_cloudflare` is true, public.access_caller_take admits every call, so the per-caller limit of account-access does nothing, and the feedback trigger check_feedback_rate_limit keys its limit on the last `x-forwarded-for` hop, which on hosted Supabase can be a platform address that many callers share. This check fails when the table or its row is absent or the setting is not true, and names the remedy.
--
-- It reads and never writes, and it prints no connection value. Once the check passes it prints one line, `access_caller_max=<n>`, the per-caller limit the row holds, which the deploy's caller-limit smoke run counts against.
--
-- Run, with the connection in the libpq variables PGHOST, PGPORT, PGUSER, PGDATABASE and PGPASSWORD, as the table's owner `postgres` (an API role is refused the table):
--   psql -X -f infra/scripts/check-deployment-settings.sql
--
-- Run it by itself. Included from another script with `\i`, a finding ends this script only, and the status is the including script's.
--
-- Exit status, which is psql's own and is the verdict:
--   0  behind_cloudflare is true, and the `access_caller_max=` line is printed.
--   1  psql itself failed before the check, for instance on a script file it could not read or on running out of memory.
--   2  the connection was refused or lost.
--   3  a finding, reported in an error whose message begins `check-deployment-settings:`. Any other error with this status means the check could not run.
\set ON_ERROR_STOP on

DO $check$
DECLARE
  rows_found bigint;
  trusted boolean;
BEGIN
  IF to_regclass('private.deployment_settings') IS NULL THEN
    RAISE EXCEPTION 'check-deployment-settings: private.deployment_settings does not exist; apply the migrations, then run infra/scripts/bootstrap.sql with BOOTSTRAP_BEHIND_CLOUDFLARE=true';
  END IF;

  SELECT count(*), bool_and(behind_cloudflare)
  INTO rows_found, trusted
  FROM private.deployment_settings;

  IF rows_found = 0 THEN
    RAISE EXCEPTION 'check-deployment-settings: private.deployment_settings holds no row; run infra/scripts/bootstrap.sql with BOOTSTRAP_BEHIND_CLOUDFLARE=true';
  ELSIF trusted IS NOT TRUE THEN
    RAISE EXCEPTION 'check-deployment-settings: behind_cloudflare is false, so the per-caller limit of account-access admits every call and the feedback limit keys on the gateway hop; run infra/scripts/bootstrap.sql with BOOTSTRAP_BEHIND_CLOUDFLARE=true';
  END IF;
END
$check$;

SELECT access_caller_max FROM private.deployment_settings \gset
\echo access_caller_max=:access_caller_max
