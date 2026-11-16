-- The smoke contestant: one candidate-editor grant and the terms-of-use acceptance
--
-- Gives one existing user the entity-scope `editor` grant on the project's `smoke_` candidate with the lowest `external_id` that has a nomination, and records the user's acceptance of the terms of use on the project. With both rows a password sign-in reaches the Contestant App home: the access-token hook copies the grant into the token, and the acceptance keeps the terms page from standing in the way.
--
-- The user is created first, through the Auth Admin API, with the address confirmed at creation. Never by an invitation mail: the send-email hook takes the auth service's own mail and sends none.
--
-- Run:
--   psql -X -f infra/scripts/grant-smoke-contestant.sql
--
-- Run it by itself, after infra/scripts/bootstrap.sql and after the smoke dataset is in the project. Included from another script with `\i`, a failure ends this script only, and the status is the including script's.
--
-- Two rules for whoever runs it:
--   1. The connection comes from the libpq variables PGHOST, PGPORT, PGUSER, PGDATABASE and PGPASSWORD, and is a direct or session-pooler connection as `postgres`, which reads auth.users and owns public.grants and public.terms_of_use_acceptances.
--   2. No value is ever given with `-v` or in a connection URL argument. Both put it on the command line, where the process list shows it. The script reads the environment itself and discards a psql variable set from outside.
--
-- Environment. A value is used exactly as given; one that is empty or holds only whitespace counts as not set.
--   Required:
--     SMOKE_CONTESTANT_EMAIL  The user's address. It is compared with each user's address case-insensitively, and exactly one user must match.
--     PUBLIC_PROJECT_ID       The project's id, a uuid. The project row must exist.
--
-- Exit status, which is psql's own:
--   0  the user holds the grant and the acceptance. A second run adds nothing.
--   2  the connection was refused or lost
--   3  a required variable is not set, each one named on standard error; no user or more than one user has the address; the project does not exist, or its id is malformed; no `smoke_` candidate of the project has a nomination; another user already edits the chosen candidate; or the user holds a grant other than the editor grant on that candidate, which keeps an administrator's address from becoming the contestant. Nothing has been written.
--
-- Output: three lines, `candidate=<external_id>`, `grants=<n>` and `terms=<n>`: the chosen candidate, the number of entity-scope candidate editor grants the user holds, and the number of the user's acceptances on the project. The address is never printed: it travels as a bound parameter and is in no statement's text, and no error names it. A server that is set to log the parameters of statements that succeed, or of slow ones, logs it all the same; those settings are the server's and this script cannot change them.
\set ON_ERROR_STOP on
\set QUIET on

-- A statement that fails is logged with its text. This keeps its bound parameters out of that log entry whatever the server's default is.
SET log_parameter_max_length_on_error = 0;

-- Each value is read into a psql variable of the script's own. `\unset` comes first, so a variable given from outside is never used. A variable the environment does not define becomes the empty value, which the test below treats as not set.
\unset missing

\unset contestant_email
\getenv contestant_email SMOKE_CONTESTANT_EMAIL
\if :{?contestant_email}
\else
  \set contestant_email ''
\endif

\unset project_id
\getenv project_id PUBLIC_PROJECT_ID
\if :{?project_id}
\else
  \set project_id ''
\endif

-- The address is tested by itself, as a bound parameter, so that it is in no statement's text.
SELECT btrim(:'project_id') = '' AS project_id_missing \gset

SELECT btrim(coalesce($1, '')) = '' AS contestant_email_missing \bind :contestant_email \gset

\if :contestant_email_missing
  \warn 'grant-smoke-contestant: SMOKE_CONTESTANT_EMAIL is not set'
  \set missing true
\endif
\if :project_id_missing
  \warn 'grant-smoke-contestant: PUBLIC_PROJECT_ID is not set'
  \set missing true
\endif
\if :{?missing}
  DO $$ BEGIN RAISE EXCEPTION 'grant-smoke-contestant: required environment variables are not set, and nothing was written'; END $$;
\endif

-- One transaction. Each refusal below raises inside it, and psql then leaves without committing.
BEGIN;

-- The cast refuses a malformed id.
SELECT NOT EXISTS (
  SELECT 1 FROM public.projects WHERE id = :'project_id'::uuid
) AS no_project \gset

\if :no_project
  DO $$ BEGIN RAISE EXCEPTION 'grant-smoke-contestant: no project has the id PUBLIC_PROJECT_ID names, and nothing was written'; END $$;
\endif

-- The user's id. From the inserts below to the commit, their foreign keys keep the user row from being deleted.
SELECT count(*) = 0 AS no_user, count(*) > 1 AS many_users, min(id::text) AS user_id
FROM auth.users
WHERE lower(email) = lower($1) \bind :contestant_email \gset

\if :no_user
  DO $$ BEGIN RAISE EXCEPTION 'grant-smoke-contestant: no user has the address SMOKE_CONTESTANT_EMAIL names, and nothing was written'; END $$;
\endif
\if :many_users
  DO $$ BEGIN RAISE EXCEPTION 'grant-smoke-contestant: more than one user has the address SMOKE_CONTESTANT_EMAIL names, and nothing was written'; END $$;
\endif

-- The candidate. COLLATE "C" orders the external ids byte by byte, so the choice does not depend on the database's collation. The row lock holds the choice until the commit.
SELECT count(*) = 0 AS no_candidate, min(id::text) AS candidate_id, min(external_id) AS candidate_external_id
FROM (
  SELECT c.id, c.external_id
  FROM public.candidates c
  WHERE c.project_id = :'project_id'::uuid
    AND c.external_id LIKE 'smoke\_%' ESCAPE '\'
    AND EXISTS (SELECT 1 FROM public.nominations n WHERE n.candidate_id = c.id)
  ORDER BY c.external_id COLLATE "C"
  LIMIT 1
  FOR UPDATE OF c
) AS chosen \gset

\if :no_candidate
  DO $$ BEGIN RAISE EXCEPTION 'grant-smoke-contestant: no smoke_ candidate of the project has a nomination, and nothing was written'; END $$;
\endif

-- Any grant but the one this script writes. An administrator holds one, so an administrator's address cannot become the contestant.
SELECT EXISTS (
  SELECT 1 FROM public.grants
  WHERE user_id = :'user_id'::uuid
    AND NOT (
      scope = 'entity'
      AND target_type = 'candidate'
      AND role = 'editor'
      AND target_id = :'candidate_id'::uuid
    )
) AS other_grant \gset

\if :other_grant
  DO $$ BEGIN RAISE EXCEPTION 'grant-smoke-contestant: the user holds another grant, and nothing was written'; END $$;
\endif

-- Checked here rather than left to idx_grants_one_candidate_editor, whose error names neither the candidate nor this script.
SELECT EXISTS (
  SELECT 1 FROM public.grants
  WHERE scope = 'entity'
    AND target_type = 'candidate'
    AND role = 'editor'
    AND target_id = :'candidate_id'::uuid
    AND user_id <> :'user_id'::uuid
) AS other_editor \gset

\if :other_editor
  DO $$ BEGIN RAISE EXCEPTION 'grant-smoke-contestant: another user already edits the chosen candidate, and nothing was written'; END $$;
\endif

-- Arbitrated on grants_user_scope_target_role_key, so a second run inserts nothing.
INSERT INTO public.grants (user_id, scope, target_type, target_id, role)
VALUES (:'user_id'::uuid, 'entity', 'candidate', :'candidate_id'::uuid, 'editor')
ON CONFLICT ON CONSTRAINT grants_user_scope_target_role_key DO NOTHING;

-- The user is named explicitly: the column's default is auth.uid(), which is null for `postgres`.
INSERT INTO public.terms_of_use_acceptances (user_id, project_id)
VALUES (:'user_id'::uuid, :'project_id'::uuid)
ON CONFLICT (user_id, project_id) DO NOTHING;

COMMIT;

SELECT count(*) AS grants
FROM public.grants
WHERE user_id = :'user_id'::uuid
  AND scope = 'entity'
  AND target_type = 'candidate'
  AND role = 'editor' \gset

SELECT count(*) AS terms
FROM public.terms_of_use_acceptances
WHERE user_id = :'user_id'::uuid
  AND project_id = :'project_id'::uuid \gset

\echo candidate=:candidate_external_id
\echo grants=:grants
\echo terms=:terms
