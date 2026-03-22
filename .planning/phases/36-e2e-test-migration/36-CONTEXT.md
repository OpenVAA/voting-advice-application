# Phase 36: E2E Test Migration - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace StrapiAdminClient with SupabaseAdminClient, convert datasets to Supabase format, update spec files for Supabase method signatures, migrate email helper to Mailpit, and update Playwright config. All E2E infrastructure points at Supabase.

</domain>

<decisions>
## Implementation Decisions

### Admin client (TEST-01)
- **D-01:** Replace `strapiAdminClient.ts` with `supabaseAdminClient.ts` from parallel branch
- **D-02:** SupabaseAdminClient is stateless (service_role key) — no login/dispose lifecycle
- **D-03:** All 14 methods: bulkImport, bulkDelete, importAnswers, linkJoinTables, CRUD for elections/candidates/questions etc.

### Datasets (TEST-02)
- **D-04:** Update dataset JSON files to Supabase format: `organizations` instead of `parties`, add `projectId` and `published` fields, remove `questionTypes`
- **D-05:** Keep camelCase property names in datasets (SupabaseAdminClient handles snake_case conversion)

### Spec files (TEST-03)
- **D-06:** Diff-merge approach — do NOT copy parallel branch specs wholesale
- **D-07:** Current branch specs have Svelte 5 adaptations from v1.3-v1.4 that parallel branch missed
- **D-08:** Apply only Supabase-specific changes: admin client method signatures, data format references, auth flow changes
- **D-09:** Preserve all Svelte 5 test adaptations (runes-aware selectors, updated page objects, etc.)

### Email helper (TEST-04)
- **D-10:** Replace LocalStack SES email helper with Mailpit REST API version from parallel branch
- **D-11:** Mailpit runs on port 54324 (started by `supabase start`)
- **D-12:** Uses cheerio for link extraction (drops mailparser dependency)

### Playwright config (TEST-05)
- **D-13:** Update worker count from 4 to 6 (no Strapi rate limiting concern with Supabase)
- **D-14:** Update project comments to reference Supabase session layer instead of JWT
- **D-15:** Keep existing project dependency chain structure

### Claude's Discretion
- Exact diff-merge strategy per spec file (some may need more changes than others)
- Whether `candidate-password.spec.ts` (new in parallel branch) should be added
- Page object updates needed for Supabase auth flows
- Fixture updates for SupabaseAdminClient

</decisions>

<specifics>
## Specific Ideas

- Diff-merge is critical — parallel branch specs are Svelte 4 era, current specs have Svelte 5 work from v1.3-v1.4
- The admin client swap is the biggest change — most spec changes flow from different method signatures
- Mailpit is simpler than LocalStack SES — cleaner dependency chain

</specifics>

<canonical_refs>
## Canonical References

### Parallel branch E2E infrastructure
- `git show feat-gsd-supabase-migration:tests/tests/utils/supabaseAdminClient.ts` — Full SupabaseAdminClient implementation
- `git show feat-gsd-supabase-migration:tests/tests/utils/emailHelper.ts` — Mailpit email helper
- `git show feat-gsd-supabase-migration:tests/playwright.config.ts` — Updated Playwright config
- `git show feat-gsd-supabase-migration:tests/tests/data/default-dataset.json` — Supabase-format dataset

### Current branch E2E (to diff-merge against)
- `tests/tests/utils/strapiAdminClient.ts` — Current admin client (to be replaced)
- `tests/tests/utils/emailHelper.ts` — Current LocalStack SES helper (to be replaced)
- `tests/tests/specs/candidate/` — 5 candidate spec files (Svelte 5 adapted)
- `tests/tests/specs/voter/` — 7 voter spec files (Svelte 5 adapted)
- `tests/tests/data/` — Current datasets (to be updated)
- `tests/playwright.config.ts` — Current config (to be updated)

### Parallel branch specs (for Supabase-specific changes)
- `git show feat-gsd-supabase-migration:tests/tests/specs/candidate/` — Supabase-adapted candidate specs
- `git show feat-gsd-supabase-migration:tests/tests/specs/voter/` — Supabase-adapted voter specs

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Page objects in `tests/tests/pages/` — likely need minimal changes (UI selectors unchanged)
- Test fixtures in `tests/tests/fixtures/` — need SupabaseAdminClient import swap
- Overlay datasets — same merge pattern, just field format changes

### Established Patterns
- Project dependency chain: data-setup → auth-setup → candidate-app → mutation → settings
- testIds.ts as single source of truth for selectors
- Base + overlay dataset composition

### Integration Points
- SupabaseAdminClient uses `@openvaa/supabase-types` (PROPERTY_MAP, TABLE_MAP) from Phase 30
- Email helper needs Mailpit running (part of `supabase start`)
- Auth fixtures need Supabase session-based auth instead of JWT cookies

</code_context>

<deferred>
## Deferred Ideas

- Visual regression baseline updates — may need new screenshots after Supabase migration
- Performance budget spec updates — deferred to Phase 37 if needed

</deferred>

---

*Phase: 36-e2e-test-migration*
*Context gathered: 2026-03-22*
