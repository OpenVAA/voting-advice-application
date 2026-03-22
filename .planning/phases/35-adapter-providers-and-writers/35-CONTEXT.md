# Phase 35: Adapter Providers and Writers - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Integrate DataProvider, DataWriter, AdminWriter, and FeedbackWriter implementations so the frontend can read all VAA data from Supabase and candidates can write answers, profiles, and feedback. All adapter code uses Svelte 5 paths but keeps existing Svelte store patterns.

</domain>

<decisions>
## Implementation Decisions

### DataProvider (ADPT-01)
- **D-01:** Copy and adapt SupabaseDataProvider from parallel branch — all 7+ read methods (appSettings, appCustomization, elections, entities, questions, constituencies, nominations)
- **D-02:** Adapt imports to `apps/frontend/` paths and `@openvaa/supabase-types`
- **D-03:** Uses supabaseAdapterMixin from Phase 34 foundation

### DataWriter (ADPT-02)
- **D-04:** Copy and adapt SupabaseDataWriter — auth methods (login, logout, password reset), answer save, profile updates, registration
- **D-05:** Remove admin methods that were erroneously placed in DataWriter — move them to AdminWriter (D-07)
- **D-06:** DataWriter uses cookie-based sessions — authToken parameter ignored (empty string pattern)

### AdminWriter (ADPT-03)
- **D-07:** Extract admin methods from SupabaseDataWriter into a proper SupabaseAdminWriter class
- **D-08:** AdminWriter handles: question custom data operations (merge_custom_data RPC) and job management (insert_job_result, get_jobs)
- **D-09:** AdminWriter extends supabaseAdapterMixin like the other adapter classes
- **D-10:** Naming is acknowledged as awkward — captured as TODO for later rename

### FeedbackWriter (ADPT-04)
- **D-11:** Copy and adapt SupabaseFeedbackWriter — simple feedback submission to Supabase
- **D-12:** Minimal implementation, no complex logic

### Svelte patterns
- **D-13:** Keep existing Svelte store patterns throughout — do NOT convert to runes
- **D-14:** Context system runes rewrite deferred to CTX-01 — only after 100% E2E pass with Supabase

### Claude's Discretion
- Which specific methods from DataWriter belong in AdminWriter (inspect parallel branch implementation)
- Test file adaptation details
- Whether utility imports need adjustment beyond path changes

</decisions>

<specifics>
## Specific Ideas

- Admin methods were put in DataWriter by mistake on the parallel branch — this phase fixes that by creating a proper AdminWriter class
- Keep Svelte stores — runes conversion is a separate concern after E2E stability
- All adapter classes follow the same mixin pattern from Phase 34

</specifics>

<canonical_refs>
## Canonical References

### Parallel branch adapter implementations
- `git show feat-gsd-supabase-migration:frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` — Full DataProvider (7+ read methods)
- `git show feat-gsd-supabase-migration:frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts` — DataProvider tests
- `git show feat-gsd-supabase-migration:frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` — DataWriter with auth + admin methods mixed together
- `git show feat-gsd-supabase-migration:frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts` — DataWriter tests
- `git show feat-gsd-supabase-migration:frontend/src/lib/api/adapters/supabase/feedbackWriter/supabaseFeedbackWriter.ts` — FeedbackWriter

### Base classes and types
- `apps/frontend/src/lib/api/base/universalDataProvider.ts` — Base class for DataProvider
- `apps/frontend/src/lib/api/base/universalDataWriter.ts` — Base class for DataWriter
- `apps/frontend/src/lib/api/base/dataWriter.type.ts` — WithAuth, BasicUserData, CandidateUserData types
- `apps/frontend/src/lib/api/base/dataTypes.ts` — DPDataType return types

### Phase 34 foundation
- `apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts` — Mixin (from Phase 34)
- `apps/frontend/src/lib/api/adapters/supabase/utils/` — Utility functions (from Phase 34)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- supabaseAdapterMixin from Phase 34 — shared typed client for all adapter classes
- Utility functions (mapRow, getLocalized, toDataObject, storageUrl) from Phase 34
- UniversalDataProvider/Writer base classes — mixin target

### Established Patterns
- PostgREST query builder as the abstraction (no apiGet/apiPost wrappers)
- `parseAnswers` utility for converting stored answer format
- `parseStoredImage` for storage URL generation
- `getLocalized` for JSONB localization extraction

### Integration Points
- Phase 32 provides `event.locals.supabase` for SSR adapter initialization (serverClient)
- Phase 33 provides auth context (isAuthenticated) consumed by candidate context
- Phase 34 provides mixin and utilities — this phase builds on top
- Adapter switch (Phase 34) selects these implementations when configured for Supabase
- E2E tests (Phase 36-37) will verify all adapter methods work end-to-end

</code_context>

<deferred>
## Deferred Ideas

- AdminWriter rename — captured as TODO
- Context system runes rewrite — CTX-01, after 100% E2E pass
- WithAuth interface refactoring — WAUTH-01

</deferred>

---

*Phase: 35-adapter-providers-and-writers*
*Context gathered: 2026-03-22*
