# Deferred items — phase 184

## From 184-01 (2026-10-26)

- **dev-seed default-template integration test red in a full `yarn test:unit`.** Two tests in `packages/dev-seed/tests/integration/default-template.integration.test.ts` failed: `bulkImport failed: Nomination constituency … is no constituency of its election`, then `anon-visible candidate nominations: expected 0 to be greater than 0`. The run overlapped a `-gsd` worktree E2E run (`179.1-05-red`) that restarted the shared local Supabase stack. Root cause UNCONFIRMED. Out of scope for 184-01, which touches no dev-seed or database file. To settle it, rerun `yarn workspace @openvaa/dev-seed test:unit` on a quiet stack.

## From 184-05 (2026-10-26)

- **`@openvaa/dev-seed` typecheck red on `tests/checkDriftLinkedGuard.test.ts` (from 184-04).** `yarn workspace @openvaa/dev-seed typecheck` exits 2 with one error, TS2345 in `checkDriftLinkedGuard.test.ts`: an env object whose `PGSERVICE`/`PGHOSTADDR` is optional (`?: undefined`) is passed where `Record<string, string>` is expected. This is the only error; `hostedSettingsParityGate.test.ts` (changed by 184-05) has none. Out of scope for 184-05, which does not touch that file. The package `typecheck` runs in `yarn lint:check` through `yarn typecheck` (turbo), so `lint:check` is red until it is fixed.

## From 184-11 (2026-11-10)

- **`push-migrations.sh` reports `push_connection=unknown` on every path with Supabase CLI 2.118.0.** The script greps the dry run's output for `Resolved DNS` (direct) and `Using connection pooler` (pooler). Neither literal occurs in the installed CLI bundle (`node_modules/@supabase/cli-darwin-arm64/bin/supabase`, byte search: 0 of each). The bundle's fallback is a stderr warning, `Warning: Direct connection to <host> is unavailable because this environment does not support IPv6. Retrying via the IPv4 connection pooler.` No direct-path marker was found. Seen live on the throwaway on 2026-11-09/10 (`s16_push_connection=unknown`, while psql had to use the session pooler). To fix it: match the fallback warning for `pooler`, and find the direct-path text from a kept `--log-dir` of a real dry run before choosing a `direct` marker. This also touches the spec of the wrapper. Out of scope for 184-11, whose files do not include the script.
