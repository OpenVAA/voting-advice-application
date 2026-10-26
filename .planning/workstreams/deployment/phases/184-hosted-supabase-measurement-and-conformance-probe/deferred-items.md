# Deferred items — phase 184

## From 184-01 (2026-10-26)

- **dev-seed default-template integration test red in a full `yarn test:unit`.** Two tests in `packages/dev-seed/tests/integration/default-template.integration.test.ts` failed: `bulkImport failed: Nomination constituency … is no constituency of its election`, then `anon-visible candidate nominations: expected 0 to be greater than 0`. The run overlapped a `-gsd` worktree E2E run (`179.1-05-red`) that restarted the shared local Supabase stack. Root cause UNCONFIRMED. Out of scope for 184-01, which touches no dev-seed or database file. To settle it, rerun `yarn workspace @openvaa/dev-seed test:unit` on a quiet stack.
