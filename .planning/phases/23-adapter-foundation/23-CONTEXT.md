# Phase 23: Adapter Foundation - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the shared utilities and infrastructure that all Supabase adapter classes depend on: a mixin providing a typed Supabase client, row mapping utilities for snake_case/camelCase conversion, a JSONB localization utility with 3-tier fallback, and the dynamic import switch wiring. Stub adapter classes are created for DataProvider, DataWriter, and FeedbackWriter but actual method implementations are in later phases (25, 26).

</domain>

<decisions>
## Implementation Decisions

### Supabase client strategy
- Use `@supabase/supabase-js` `createClient()` with SvelteKit's `fetch` — not raw PostgREST calls
- Create a `supabaseAdapterMixin` that mirrors the `strapiAdapterMixin` pattern (mixin on UniversalAdapter)
- Default path: `createClient(url, anonKey, { global: { fetch } })` using the fetch from AdapterConfig
- Also accept an injected pre-built `SupabaseClient` via AdapterConfig for server-side routes (e.g., from `hooks.server.ts`)
- Supabase URL and anon key from environment variables: `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` (via `$lib/utils/constants` pattern)
- Add `locale` to AdapterConfig so the adapter knows which locale to extract from JSONB columns

### Row mapping scope
- Column rename + JSONB passthrough: rename snake_case keys to camelCase using COLUMN_MAP, JSONB columns (answers, customization, name, info) pass through as-is
- Prefer standalone utility function `mapRow()` unless there's a reason to need class instance access, in which case use a mixin method
- Unmapped columns (those not in COLUMN_MAP, like `id`, `name`, `type`) pass through unchanged — no data loss. Add a TODO note that RLS is responsible for preventing sensitive data leakage, not the mapper
- Include reverse mapping `mapRowToDb()` (camelCase to snake_case for writes) in this phase — both directions use COLUMN_MAP/PROPERTY_MAP which already exist

### Localization approach
- Client-side extraction: a utility `getLocalized(jsonb, locale, defaultLocale)` matching the SQL `get_localized()` 3-tier fallback (requested locale -> default locale -> first key)
- Default locale comes from `app_settings.default_locale` (DB), not staticSettings — respects per-project config
- Top-level localized columns only (name, info, description). Nested JSONB structures handled by specific DataProvider methods
- Note: some DataWriter methods need to handle multilingual data as raw JSONB (not extracting a single locale) — the localization utility should be opt-in per field, not automatic
- Deferred: extend translation functions in app-shared package (where localized objects are defined), move `translate(Object)` functions from `frontend/src/lib/i18n/init.ts` there. Add a note to remove custom translation functions from the data package

### Adapter switch wiring
- Add `'supabase'` case to all three switch files now: `dataProvider.ts`, `dataWriter.ts`, `feedbackWriter.ts` — wiring in place even if implementations are stubs
- Add a TODO/comment that the adapter loading logic should be rewritten later (dynamic import switch pattern is clunky)
- Add `SupabaseDataAdapter` type to `staticSettings.type.ts`: `{ type: 'supabase', supportsCandidateApp: true, supportsAdminApp: false }` — mirrors existing flag pattern, admin false for v3.0
- Supabase adapter files live in `frontend/src/lib/api/adapters/supabase/` alongside the Strapi adapter
- Create stub adapter classes (DataProvider, DataWriter, FeedbackWriter) that extend UniversalAdapter with supabaseAdapterMixin, throwing 'not implemented' for each method. Phase 25/26/etc. fill in implementations

### Claude's Discretion
- Exact file organization within `frontend/src/lib/api/adapters/supabase/`
- Whether the mixin exposes the Supabase client directly or wraps it in helper methods (like strapiAdapterMixin has `apiGet`/`apiPost`)
- Test approach and coverage for the utilities (unit tests for mapRow, getLocalized)
- Whether `mapRow` needs generic type parameters or just returns `Record<string, unknown>`

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing adapter architecture
- `frontend/src/lib/api/base/universalAdapter.ts` — Base class all adapters extend; init({ fetch }) pattern, get/post/put/delete methods
- `frontend/src/lib/api/base/adapterType.type.ts` — AdapterType = 'universal' | 'server'
- `frontend/src/lib/api/adapters/strapi/strapiAdapter.ts` — Reference mixin implementation (strapiAdapterMixin pattern)
- `frontend/src/lib/api/adapters/strapi/strapiAdapter.type.ts` — StrapiAdapter type definition

### Dynamic import switch
- `frontend/src/lib/api/dataProvider.ts` — Switch on staticSettings.dataAdapter.type
- `frontend/src/lib/api/dataWriter.ts` — Switch on staticSettings.dataAdapter.type
- `frontend/src/lib/api/feedbackWriter.ts` — Switch on staticSettings.dataAdapter.type

### Type definitions
- `frontend/src/lib/api/base/dataProvider.type.ts` — DataProvider interface (all method signatures)
- `frontend/src/lib/api/base/dataWriter.type.ts` — DataWriter/WithAuth/WithTargetEntity interfaces
- `frontend/src/lib/api/base/feedbackWriter.type.ts` — FeedbackWriter interface and FeedbackData type
- `packages/app-shared/src/settings/staticSettings.type.ts` — StrapiDataAdapter, LocalDataAdapter types (add SupabaseDataAdapter here)
- `packages/app-shared/src/settings/staticSettings.ts` — dataAdapter config object

### Column/property mapping
- `packages/supabase-types/src/column-map.ts` — COLUMN_MAP, PROPERTY_MAP, ColumnName, PropertyName types
- `packages/supabase-types/src/database.ts` — Generated database types

### Localization reference
- `apps/supabase/supabase/schema/000-functions.sql` — SQL get_localized() with 3-tier fallback (lines 41-70)
- `frontend/src/lib/i18n/init.ts` — Current client-side translate() functions (to be moved to app-shared later)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `COLUMN_MAP` / `PROPERTY_MAP` in `packages/supabase-types/src/column-map.ts`: Complete bidirectional mapping with 30+ entries, ready to use
- `UniversalAdapter` base class: Provides init({ fetch }), get(), post(), put(), delete() — all adapters extend this
- `strapiAdapterMixin`: Reference implementation of the mixin pattern — adds apiGet/apiPost/apiUpload helpers
- `get_localized()` SQL function: 3-tier fallback logic to replicate in TypeScript

### Established Patterns
- Mixin pattern: `function strapiAdapterMixin<TBase extends Constructor>(base: TBase)` returning `Constructor<StrapiAdapter> & TBase`
- Dynamic import switch: `staticSettings.dataAdapter.type` determines which adapter module is loaded
- AdapterConfig: `{ fetch }` passed to `init()` — Supabase adapter extends this with `locale` and optional `serverClient`
- Constants pattern: env vars accessed via `$lib/utils/constants`

### Integration Points
- `frontend/src/lib/api/adapters/supabase/` — New directory mirroring `strapi/`
- `packages/app-shared/src/settings/staticSettings.type.ts` — Add `SupabaseDataAdapter` union member
- Three switch files (dataProvider, dataWriter, feedbackWriter) — Add `'supabase'` cases

</code_context>

<specifics>
## Specific Ideas

- The adapter loading logic (switch on type) should have a TODO comment noting it needs to be rewritten later
- Row mapper should have a TODO note that the database/RLS is responsible for preventing sensitive data leakage, not the mapper
- Translation refactoring note: extend translation functions in app-shared, move translate(Object) from frontend/src/lib/i18n/init.ts there, and remove custom translation functions from the data package (deferred to a later phase)

</specifics>

<deferred>
## Deferred Ideas

- Rewrite adapter loading logic (switch pattern is clunky) — future refactor phase
- Move translate(Object) functions from frontend/src/lib/i18n/init.ts to app-shared package — future phase
- Remove custom translation functions from data package — future cleanup
- Admin app support (supportsAdminApp: true) — post v3.0 milestone

</deferred>

---

*Phase: 23-adapter-foundation*
*Context gathered: 2026-03-18*
