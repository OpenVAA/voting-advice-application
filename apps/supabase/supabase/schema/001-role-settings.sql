-- API role settings
--
-- Provides: the statement_timeout the anon role runs under.
--
-- WHY: Supabase ships `anon` with statement_timeout = 3s and `authenticated` with 8s. At municipal scale (tens of thousands of candidates and nominations) the anonymous whole-project nominations read takes longer than 3 s and fails with HTTP 500 (SQLSTATE 57014). Anon is raised to the 8 s authenticated already has.
--
-- ⚠ HOSTED DEPLOYMENTS: the value lives on the role, not in config.toml, so a project whose migrations are not applied keeps Supabase's 3 s.
--------------------------------------------------------------------------------
ALTER ROLE anon
SET
  statement_timeout = '8s';

-- PostgREST caches role settings; make it re-read them.
NOTIFY pgrst,
'reload config';
