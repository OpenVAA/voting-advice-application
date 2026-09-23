-- API role settings
--
-- Provides: the statement_timeout the anon role runs under.
--
-- WHY: Supabase ships `anon` with statement_timeout = 3s and `authenticated` with 8s. At municipal scale (~36k candidates, ~39k nominations) the anonymous whole-project nominations read costs ~3.2 s of database work and fails with HTTP 500 57014 at 3 s (spike 026, finding F2). Anon is raised to the same 8 s authenticated already has.
--
-- ⚠ HOSTED DEPLOYMENTS: this lands through the migration like any other statement, but the value lives on the role, not in config.toml, and a project whose migrations are not applied keeps Supabase's 3 s. See .planning/todos/pending/2026-09-18-document-supabase-api-limits-for-deployments.md.
--------------------------------------------------------------------------------
ALTER ROLE anon
SET
  statement_timeout = '8s';

-- PostgREST caches role settings; make it re-read them.
NOTIFY pgrst,
'reload config';
