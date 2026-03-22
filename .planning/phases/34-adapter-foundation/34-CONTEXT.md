# Phase 34: Adapter Foundation - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Integrate the shared adapter infrastructure — mixin, utility functions, type definitions, and adapter switch — so provider/writer implementations (Phase 35) can build on it. Strapi adapter remains as default until Phase 38 cleanup.

</domain>

<decisions>
## Implementation Decisions

### Adapter mixin (ADPT-05)
- **D-01:** Copy and adapt `supabaseAdapter.ts` mixin from parallel branch to `apps/frontend/src/lib/api/adapters/supabase/`
- **D-02:** Copy `supabaseAdapter.type.ts` — `SupabaseAdapterConfig` extends base `AdapterConfig` with locale, defaultLocale, serverClient
- **D-03:** Mixin provides typed `SupabaseClient<Database>`, locale, and defaultLocale to all adapter classes
- **D-04:** Adapt any Svelte 4 patterns to Svelte 5 (mixin itself is plain TypeScript, likely minimal changes)

### Utility functions (ADPT-05)
- **D-05:** Copy and adapt 5 utility files with their tests:
  - `mapRow.ts` — snake_case DB columns to camelCase properties using COLUMN_MAP
  - `getLocalized.ts` — Extract localized value from JSONB with 3-tier fallback
  - `localizeRow.ts` — Apply getLocalized across all JSONB columns in a row
  - `toDataObject.ts` — Convert DB row to typed DataObject
  - `storageUrl.ts` — Generate Supabase storage URLs for uploaded files
- **D-06:** All utilities must be type-safe with `@openvaa/supabase-types` Database type

### Dynamic adapter switch (ADPT-06)
- **D-07:** Adapter switch defaults to Strapi (existing behavior) during the transition period
- **D-08:** Supabase adapter selectable via configuration (env var or settings)
- **D-09:** Both adapters coexist until Phase 38 removes Strapi adapter and makes Supabase the only option

### Strapi adapter preservation
- **D-10:** Do NOT modify or remove the existing Strapi adapter in this phase
- **D-11:** Phase 38 will do thorough Strapi cleanup: remove Strapi adapter directory, auth utilities, all references
- **D-12:** The adapter switch mechanism should be designed so Phase 38 can simply delete the Strapi adapter and remove the switch (making Supabase the default/only option)

### Claude's Discretion
- Exact adapter switch mechanism (env var name, config location)
- Whether utility test files need updates for Svelte 5 test environment
- Import path organization within `adapters/supabase/`

</decisions>

<specifics>
## Specific Ideas

- The mixin pattern from parallel branch is well-designed — preserve it
- Adapter switch should be simple enough that Phase 38 can delete the Strapi side without refactoring
- Future: tsconfig-based package-based adapter loading (captured as TODO, not this phase)

</specifics>

<canonical_refs>
## Canonical References

### Parallel branch adapter code
- `git show feat-gsd-supabase-migration:frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts` — Mixin implementation
- `git show feat-gsd-supabase-migration:frontend/src/lib/api/adapters/supabase/supabaseAdapter.type.ts` — Config and interface types
- `git show feat-gsd-supabase-migration:frontend/src/lib/api/adapters/supabase/utils/` — 5 utility files + 4 test files

### Current branch adapter infrastructure
- `apps/frontend/src/lib/api/base/universalAdapter.ts` — Base adapter class (mixin target)
- `apps/frontend/src/lib/api/base/universalAdapter.type.ts` — Base AdapterConfig interface
- `apps/frontend/src/lib/api/adapters/` — Current adapter directory (Strapi adapter lives here)

### Type dependencies
- `packages/supabase-types/src/column-map.ts` — COLUMN_MAP used by mapRow utility
- `packages/supabase-types/src/database.ts` — Database type used by mixin generics

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `UniversalAdapter` base class — mixin extends this, preserving the init({ fetch }) pattern
- Existing Strapi adapter structure — Supabase adapter follows same directory organization
- `@openvaa/supabase-types` (Phase 30) — provides Database, COLUMN_MAP for adapter utilities

### Established Patterns
- Adapter mixin pattern: `supabaseAdapterMixin(base)` returns class extending both base and SupabaseAdapter
- `init({ fetch, serverClient, locale })` — server client passed from hooks, browser client created lazily
- PostgREST query builder as the abstraction (no apiGet/apiPost wrappers like Strapi adapter)

### Integration Points
- Phase 30 provides `@openvaa/supabase-types` and `@supabase/supabase-js`
- Phase 32 provides `event.locals.supabase` (server client) for SSR adapter initialization
- Phase 35 will build DataProvider, DataWriter, AdminWriter on top of this foundation
- Phase 38 removes Strapi adapter and switch mechanism

</code_context>

<deferred>
## Deferred Ideas

- TSConfig-based importable package-based adapter loading — captured as TODO
- DataProvider/DataWriter/AdminWriter implementations — Phase 35
- FeedbackWriter — Phase 35
- Strapi adapter removal — Phase 38

</deferred>

---

*Phase: 34-adapter-foundation*
*Context gathered: 2026-03-22*
