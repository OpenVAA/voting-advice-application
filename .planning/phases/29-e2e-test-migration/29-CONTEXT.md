# Phase 29: E2E Test Migration - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate the full E2E test suite from Strapi Admin Tools API to Supabase. The StrapiAdminClient (used in 17 files) is replaced with a SupabaseAdminClient using service_role key. Test data seeding switches to bulk_import/bulk_delete RPCs. Auth test helpers use the Supabase Admin Auth API. Email verification switches from LocalStack SES to Inbucket. The E2E test pipeline runs against `supabase start` (test pipeline only — general `yarn dev` Docker stack stays until Phase 30). All existing E2E tests pass against the Supabase backend with equivalent coverage.

</domain>

<decisions>
## Implementation Decisions

### Test data format
- Convert all JSON datasets (default-dataset.json, voter-dataset.json, candidate-addendum.json, overlay files) to full Supabase-native format
- Use snake_case field names (`external_id` not `externalId`), Supabase table names (`organizations` not `parties`, `question_categories` not `questionCategories`), and `project_id` per item
- Datasets should be directly passable to `bulk_import` RPC with no runtime mapping
- Update `mergeDatasets.ts` utility to work with the new snake_case format and Supabase collection names — keep the overlay/merge pattern for variant datasets

### Admin client connection
- New `SupabaseAdminClient` uses `@supabase/supabase-js` with `service_role` key
- Replaces `StrapiAdminClient` across all 17 consumer files
- Data operations: call `bulk_import` and `bulk_delete` RPCs via `supabase.rpc()`
- Auth operations: use Supabase Admin Auth API (`supabase.auth.admin.createUser()`, `deleteUser()`, `updateUserById()`) for user management
- For candidate-user linking, use service_role queries against the data tables

### Admin client interface
- Use Supabase-native method names where a clear Supabase concept exists (e.g., `bulkImport`, `bulkDelete`)
- Keep existing names for operations without a Supabase-specific equivalent (e.g., `setPassword`, `forceRegister`, `unregisterCandidate`)
- Move toward generic CRUD methods like `update(collection, data)` for regular table operations
- `app_settings` gets a special method since it's a single-row-per-project table, not a standard collection

### App settings management
- Create a general-purpose `merge_jsonb_column(table_name, column_name, row_id, partial_data)` database RPC for deep-merging JSONB fields
- Reusable for `app_settings`, `app_customization`, and any future JSONB column updates
- Similar pattern to existing `merge_custom_data` for questions — evaluate whether it can be refactored into or share logic with this new generic function
- SupabaseAdminClient uses this RPC for `updateAppSettings` and equivalent methods

### Email testing
- Switch from LocalStack SES to Inbucket (built into Supabase CLI local dev at localhost:54324)
- Rewrite `emailHelper.ts` to use Inbucket's REST API instead of LocalStack's `/_aws/ses` endpoint
- E2E test pipeline runs against `supabase start` (which provides PostgREST, GoTrue, Inbucket, etc.)
- General `yarn dev` Docker Compose stack stays unchanged until Phase 30

### Dev environment (test pipeline only)
- E2E test execution switches to `supabase start` for the backend + SvelteKit dev server for the frontend
- This is test-pipeline-only — the general development workflow with Docker Compose stays until Phase 30
- Playwright config updated to point to Supabase-backed frontend (adapter type = supabase)

### Claude's Discretion
- Whether to use a hardcoded test project UUID from seed data or create/find project at runtime for test datasets
- Exact Inbucket REST API integration details (endpoint structure, email parsing)
- SupabaseAdminClient constructor parameters (URL, service_role key from env vars)
- How to handle the `sendForgotPassword` test helper (Admin Auth API password reset vs custom approach)
- Test parallelism adjustments (Strapi had admin rate limiting; Supabase may not need worker limits)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Current test infrastructure (what's being replaced)
- `tests/tests/utils/strapiAdminClient.ts` — Full StrapiAdminClient implementation with all methods (importData, deleteData, findData, updateAppSettings, sendEmail, sendForgotPassword, setPassword, forceRegister, unregisterCandidate)
- `tests/tests/setup/data.setup.ts` — Data setup project: imports datasets, configures app settings, resets candidate auth state
- `tests/tests/setup/data.teardown.ts` — Data teardown: deletes test data by prefix
- `tests/tests/setup/auth.setup.ts` — Auth setup: browser login + storageState save
- `tests/tests/utils/emailHelper.ts` — LocalStack SES email helper (fetchEmails, getLatestEmailHtml, extractLinkFromHtml, getRegistrationLink)
- `tests/tests/utils/mergeDatasets.ts` — Overlay/merge utility for variant datasets
- `tests/playwright.config.ts` — Full Playwright config with project dependencies, 17+ projects

### Test data files (to be converted)
- `tests/tests/data/default-dataset.json` — Base dataset (elections, constituencies, questions, candidates)
- `tests/tests/data/voter-dataset.json` — Voter-specific data (voter questions, candidates with deterministic answers)
- `tests/tests/data/candidate-addendum.json` — Unregistered candidates and nominations
- `tests/tests/data/overlays/` — Variant overlay datasets for configuration variant tests

### Supabase bulk operations (replacement infrastructure)
- `apps/supabase/supabase/schema/016-bulk-operations.sql` — bulk_import and bulk_delete RPCs with external_id-based upsert, SECURITY INVOKER
- `apps/supabase/supabase/schema/015-external-id.sql` — external_id columns and unique indexes
- `apps/supabase/supabase/schema/012-auth-hooks.sql` — Custom access token hook, can_access_project(), admin role validation

### Existing JSONB merge pattern (reference for new generic RPC)
- `apps/supabase/supabase/schema/016-bulk-operations.sql` — merge_custom_data for questions (potential refactor target)

### Auth infrastructure
- `apps/supabase/supabase/schema/011-auth-tables.sql` — user_roles, candidate-user linking
- `apps/supabase/supabase/schema/013-auth-rls.sql` — Auth RLS policies

### Fixtures and page objects
- `tests/tests/fixtures/auth.fixture.ts` — Worker-scoped auth fixture (browser login pattern)
- `tests/tests/fixtures/index.ts` — Fixture barrel export
- `tests/tests/pages/` — Page object models (may need testId updates if Supabase changes field visibility)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `bulk_import` RPC: Handles transactional upsert with external_id resolution, dependency-ordered processing, FK reference resolution — direct replacement for Strapi Admin Tools `/import-data`
- `bulk_delete` RPC: Supports prefix, UUID list, and external_id list deletion modes — direct replacement for Strapi `/delete-data`
- Supabase Admin Auth API: `createUser`, `deleteUser`, `updateUserById` — replaces Strapi user management endpoints
- `merge_custom_data` RPC: Existing JSONB merge pattern for questions — reference for new generic `merge_jsonb_column`
- Page objects and testId constants: Unchanged — tests interact with the same frontend UI regardless of backend

### Established Patterns
- Project dependencies in Playwright: data-setup -> auth-setup -> test projects -> data-teardown (keep this pattern)
- Browser-based auth setup: Login via UI form, save storageState — works the same with Supabase backend
- External_id-based test data isolation: `test-` prefix for all test records — same pattern works with Supabase bulk_delete prefix mode

### Integration Points
- `tests/tests/utils/strapiAdminClient.ts` → Replace with `supabaseAdminClient.ts`
- All 17 consumer files: Update import path and adapt method calls to new interface
- `tests/tests/utils/emailHelper.ts` → Rewrite for Inbucket REST API
- `tests/tests/utils/mergeDatasets.ts` → Update for snake_case format
- `tests/tests/data/*.json` → Convert to Supabase-native format
- `tests/playwright.config.ts` → Update comments, possibly worker count (no more Strapi rate limiting)

</code_context>

<specifics>
## Specific Ideas

- The StrapiAdminClient has methods that don't exist in Supabase natively (forceRegister, unregisterCandidate) — these need to be composed from Admin Auth API + service_role data queries
- The generic `merge_jsonb_column` RPC should evaluate whether `merge_custom_data` (existing) can be generalized rather than creating a separate function
- The SupabaseAdminClient should use generic CRUD methods (`update(collection, data)`) for regular table operations, keeping the interface clean and extensible
- Inbucket REST API is simpler than LocalStack SES — fewer parsing steps needed

</specifics>

<deferred>
## Deferred Ideas

- Full dev environment switch to supabase CLI (yarn dev) — Phase 30
- Strapi adapter code removal — Phase 30
- Docker Compose simplification — Phase 30

</deferred>

---

*Phase: 29-e2e-test-migration*
*Context gathered: 2026-03-19*
