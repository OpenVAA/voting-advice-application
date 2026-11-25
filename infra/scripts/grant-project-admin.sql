-- The first administrator: one project-scope `admin` grant
--
-- Gives one existing user the project-scope `admin` grant on the project named by PUBLIC_PROJECT_ID, the grant seed.sql gives the local stack's administrator. The access-token hook copies a user's grants into the token, so without this row the user can sign in and do nothing.
--
-- The user is created first, in the dashboard, with the address confirmed at creation. Never by an invitation mail: the send-email hook takes the auth service's own mail and sends none.
--
-- Run:
--   psql -X -f infra/scripts/grant-project-admin.sql
--
-- Run it by itself, after infra/scripts/bootstrap.sql. Included from another script with `\i`, a failure ends this script only, and the status is the including script's.
--
-- Two rules for whoever runs it:
--   1. The connection comes from the libpq variables PGHOST, PGPORT, PGUSER, PGDATABASE and PGPASSWORD, and is a direct or session-pooler connection as `postgres`, which reads auth.users and owns public.grants.
--   2. No value is ever given with `-v` or in a connection URL argument. Both put it on the command line, where the process list shows it. The script reads the environment itself and discards a psql variable set from outside.
--
-- Environment. A value is used exactly as given; one that is empty or holds only whitespace counts as not set.
--   Required:
--     ADMIN_EMAIL:        The user's address. It is compared with each user's address case-insensitively, and exactly one user must match.
--     PUBLIC_PROJECT_ID:  The project's id, a uuid. The project row must exist.
--
-- Exit status, which is psql's own:
--   0:  the user holds the grant. A second run adds nothing.
--   2:  the connection was refused or lost
--   3:  a required variable is not set, each one named on standard error; no user or more than one user has the address; the project does not exist; or the project id is malformed. Nothing has been written.
--
-- Output: one line, `grants_on_project=<n>`, the number of project-scope grants the user holds on the project. The address is never printed: it travels as a bound parameter and is in no statement's text, and no error names it. A server that is set to log the parameters of statements that succeed, or of slow ones, logs it all the same; those settings are the server's and this script cannot change them.
\set ON_ERROR_STOP on
\set QUIET on

-- A statement that fails is logged with its text. This keeps its bound parameters out of that log entry whatever the server's default is.
SET log_parameter_max_length_on_error = 0;

-- Each value is read into a psql variable of the script's own. `\unset` comes first, so a variable given from outside is never used. A variable the environment does not define becomes the empty value, which the test below treats as not set.
\unset missing

\unset admin_email
\getenv admin_email ADMIN_EMAIL
\if :{?admin_email}
\else
  \set admin_email ''
\endif

\unset project_id
\getenv project_id PUBLIC_PROJECT_ID
\if :{?project_id}
\else
  \set project_id ''
\endif

-- The address is tested by itself, as a bound parameter, so that it is in no statement's text.
SELECT btrim(:'project_id') = '' AS project_id_missing \gset

SELECT btrim(coalesce($1, '')) = '' AS admin_email_missing \bind :admin_email \gset

\if :admin_email_missing
  \warn 'grant-project-admin: ADMIN_EMAIL is not set'
  \set missing true
\endif
\if :project_id_missing
  \warn 'grant-project-admin: PUBLIC_PROJECT_ID is not set'
  \set missing true
\endif
\if :{?missing}
  DO $$ BEGIN RAISE EXCEPTION 'grant-project-admin: required environment variables are not set, and nothing was written'; END $$;
\endif

-- One transaction. Each refusal below raises inside it, and psql then leaves without committing.
BEGIN;

-- The cast refuses a malformed id.
SELECT NOT EXISTS (
  SELECT 1 FROM public.projects WHERE id = :'project_id'::uuid
) AS no_project \gset

\if :no_project
  DO $$ BEGIN RAISE EXCEPTION 'grant-project-admin: no project has the id PUBLIC_PROJECT_ID names, and nothing was written'; END $$;
\endif

-- The user's id. From the insert below to the commit, the grant's foreign key keeps the user row from being deleted.
SELECT count(*) = 0 AS no_user, count(*) > 1 AS many_users, min(id::text) AS user_id
FROM auth.users
WHERE lower(email) = lower($1) \bind :admin_email \gset

\if :no_user
  DO $$ BEGIN RAISE EXCEPTION 'grant-project-admin: no user has the address ADMIN_EMAIL names, and nothing was written'; END $$;
\endif
\if :many_users
  DO $$ BEGIN RAISE EXCEPTION 'grant-project-admin: more than one user has the address ADMIN_EMAIL names, and nothing was written'; END $$;
\endif

-- Arbitrated on grants_user_scope_target_role_key, so a second run inserts nothing. The named constraint is load-bearing: target_type is NULL on a project grant, and only this NULLS NOT DISTINCT constraint treats two such rows as equal.
INSERT INTO public.grants (user_id, scope, target_type, target_id, role)
VALUES (:'user_id'::uuid, 'project', NULL, :'project_id'::uuid, 'admin')
ON CONFLICT ON CONSTRAINT grants_user_scope_target_role_key DO NOTHING;

COMMIT;

SELECT count(*) AS grants_on_project
FROM public.grants
WHERE user_id = :'user_id'::uuid
  AND scope = 'project'
  AND target_id = :'project_id'::uuid \gset

\echo grants_on_project=:grants_on_project
