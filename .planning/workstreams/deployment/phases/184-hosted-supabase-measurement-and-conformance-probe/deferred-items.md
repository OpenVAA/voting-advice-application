# Deferred items — phase 184

## From 184-01 (2026-10-26)

- **dev-seed default-template integration test red in a full `yarn test:unit`.** Two tests in `packages/dev-seed/tests/integration/default-template.integration.test.ts` failed: `bulkImport failed: Nomination constituency … is no constituency of its election`, then `anon-visible candidate nominations: expected 0 to be greater than 0`. The run overlapped a `-gsd` worktree E2E run (`179.1-05-red`) that restarted the shared local Supabase stack. Root cause UNCONFIRMED. Out of scope for 184-01, which touches no dev-seed or database file. To settle it, rerun `yarn workspace @openvaa/dev-seed test:unit` on a quiet stack.

## From 184-05 (2026-10-26)

- **`@openvaa/dev-seed` typecheck red on `tests/checkDriftLinkedGuard.test.ts` (from 184-04).** `yarn workspace @openvaa/dev-seed typecheck` exits 2 with one error, TS2345 in `checkDriftLinkedGuard.test.ts`: an env object whose `PGSERVICE`/`PGHOSTADDR` is optional (`?: undefined`) is passed where `Record<string, string>` is expected. This is the only error; `hostedSettingsParityGate.test.ts` (changed by 184-05) has none. Out of scope for 184-05, which does not touch that file. The package `typecheck` runs in `yarn lint:check` through `yarn typecheck` (turbo), so `lint:check` is red until it is fixed.
