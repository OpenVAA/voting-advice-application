-- Bootstrap: the rows a deployment needs that no migration can write
--
-- A migration is the same text for every deployment, and two of these rows hold a deployment's own address and key. This script writes them in one transaction:
--   - the account `00000000-0000-0000-0000-000000000001`, the project named by PUBLIC_PROJECT_ID and that project's settings row. A row that already exists is left exactly as it is, so a second run never undoes what an administrator has changed since, `open_for_voters` included.
--   - the two rows of public.storage_config and the row of private.deployment_settings. These are overwritten on every run, so a rotated key or a corrected address is applied by running the script again.
--
-- It does not create the first administrator. That is a separate, one-off step.
--
-- Run:
--   psql -X -f infra/scripts/bootstrap.sql
--
-- Run it by itself. Included from another script with `\i`, a failure ends this script only, and the status is the including script's.
--
-- Two rules for whoever runs it:
--   1. The connection comes from the libpq variables PGHOST, PGPORT, PGUSER, PGDATABASE and PGPASSWORD, and is a direct connection as `postgres`, the owner of the five tables. private.deployment_settings is closed to every API role, the service role included.
--   2. No value is ever given with `-v` or in a connection URL argument. Both put it on the command line, where the process list shows it. The script reads the environment itself and discards a psql variable set from outside.
--
-- Environment. A value is used exactly as given; one that is empty or holds only whitespace counts as not set.
--   Required:
--     PUBLIC_PROJECT_ID            The project's id, a uuid. The frontend is scoped to the same value under the same name.
--     BOOTSTRAP_STORAGE_URL        The address the database uses to reach the Storage API. On a hosted project it is the project's own URL; on a local stack it is the gateway's address inside the Docker network, the value seed.sql writes.
--     SUPABASE_SERVICE_ROLE_KEY    The key the storage cleanup triggers send to the Storage API.
--     BOOTSTRAP_BEHIND_CLOUDFLARE  `true` when every request reaches the API through Cloudflare, otherwise `false`.
--   Optional, with the value used when not set:
--     BOOTSTRAP_ACCOUNT_NAME       Default Account
--     BOOTSTRAP_PROJECT_NAME       Default Project
--     BOOTSTRAP_DEFAULT_LOCALE     en
--     BOOTSTRAP_OPEN_FOR_VOTERS    false
--
-- Exit status, which is psql's own:
--   0  every row is in place
--   2  the connection was refused or lost
--   3  a required variable is not set, each one named on standard error, or a value is malformed. Nothing has been written.
--
-- The script holds no secret and prints no value it was given, except that psql quotes a malformed project id or boolean in its error. The key travels as a bound parameter and is in no statement's text. A server that is set to log the parameters of statements that succeed, or of slow ones, logs it all the same; those settings are the server's and this script cannot change them.
\set ON_ERROR_STOP on

-- A statement that fails is logged with its text. This keeps its bound parameters out of that log entry whatever the server's default is.
SET log_parameter_max_length_on_error = 0;

-- Each value is read into a psql variable of the script's own. `\unset` comes first, so a variable given from outside is never used. A variable the environment does not define becomes the empty value, which the test below treats as not set.
\unset missing

\unset project_id
\getenv project_id PUBLIC_PROJECT_ID
\if :{?project_id}
\else
  \set project_id ''
\endif

\unset storage_url
\getenv storage_url BOOTSTRAP_STORAGE_URL
\if :{?storage_url}
\else
  \set storage_url ''
\endif

\unset service_role_key
\getenv service_role_key SUPABASE_SERVICE_ROLE_KEY
\if :{?service_role_key}
\else
  \set service_role_key ''
\endif

\unset behind_cloudflare
\getenv behind_cloudflare BOOTSTRAP_BEHIND_CLOUDFLARE
\if :{?behind_cloudflare}
\else
  \set behind_cloudflare ''
\endif

\unset account_name
\getenv account_name BOOTSTRAP_ACCOUNT_NAME
\if :{?account_name}
\else
  \set account_name ''
\endif

\unset project_name
\getenv project_name BOOTSTRAP_PROJECT_NAME
\if :{?project_name}
\else
  \set project_name ''
\endif

\unset default_locale
\getenv default_locale BOOTSTRAP_DEFAULT_LOCALE
\if :{?default_locale}
\else
  \set default_locale ''
\endif

\unset open_for_voters
\getenv open_for_voters BOOTSTRAP_OPEN_FOR_VOTERS
\if :{?open_for_voters}
\else
  \set open_for_voters ''
\endif

-- Two statements that write nothing: they say which required values are not set and give each optional value its default. The key is tested by itself, as a bound parameter, so that it is in no statement's text.
SELECT
  btrim(:'project_id') = '' AS project_id_missing,
  btrim(:'storage_url') = '' AS storage_url_missing,
  btrim(:'behind_cloudflare') = '' AS behind_cloudflare_missing,
  CASE WHEN btrim(:'account_name') = '' THEN 'Default Account' ELSE :'account_name' END AS account_name,
  CASE WHEN btrim(:'project_name') = '' THEN 'Default Project' ELSE :'project_name' END AS project_name,
  CASE WHEN btrim(:'default_locale') = '' THEN 'en' ELSE :'default_locale' END AS default_locale,
  CASE WHEN btrim(:'open_for_voters') = '' THEN 'false' ELSE :'open_for_voters' END AS open_for_voters
\gset

SELECT btrim($1) = '' AS service_role_key_missing \bind :service_role_key \gset

\if :project_id_missing
  \warn 'bootstrap: PUBLIC_PROJECT_ID is not set'
  \set missing true
\endif
\if :storage_url_missing
  \warn 'bootstrap: BOOTSTRAP_STORAGE_URL is not set'
  \set missing true
\endif
\if :service_role_key_missing
  \warn 'bootstrap: SUPABASE_SERVICE_ROLE_KEY is not set'
  \set missing true
\endif
\if :behind_cloudflare_missing
  \warn 'bootstrap: BOOTSTRAP_BEHIND_CLOUDFLARE is not set'
  \set missing true
\endif
\if :{?missing}
  DO $$ BEGIN RAISE EXCEPTION 'bootstrap: required environment variables are not set, and nothing was written'; END $$;
\endif

-- One transaction. The casts to uuid and boolean refuse a malformed value inside it, and psql then leaves without committing.
BEGIN;

-- The seeding tool attaches every project it creates to this account id, so the id is fixed.
INSERT INTO public.accounts (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', :'account_name')
ON CONFLICT (id) DO NOTHING;

-- `open_for_voters` is written here and nowhere else in this script.
INSERT INTO public.projects (id, account_id, name, default_locale, open_for_voters)
VALUES (
  :'project_id'::uuid,
  '00000000-0000-0000-0000-000000000001',
  :'project_name',
  :'default_locale',
  :'open_for_voters'::boolean
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.app_settings (project_id, settings)
VALUES (:'project_id'::uuid, '{}'::jsonb)
ON CONFLICT (project_id) DO NOTHING;

INSERT INTO public.storage_config (key, value)
VALUES ('supabase_url', :'storage_url')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- The key is a bound parameter: the statement's text holds `$1` and never the key. `:service_role_key` is given unquoted, because the quoted form would store the quote characters with it.
INSERT INTO public.storage_config (key, value)
VALUES ('service_role_key', $1)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value \bind :service_role_key \g

INSERT INTO private.deployment_settings (singleton, behind_cloudflare)
VALUES (true, :'behind_cloudflare'::boolean)
ON CONFLICT (singleton) DO UPDATE SET behind_cloudflare = EXCLUDED.behind_cloudflare;

COMMIT;
