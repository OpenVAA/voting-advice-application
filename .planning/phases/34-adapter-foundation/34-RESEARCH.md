# Phase 34: Adapter Foundation - Research

**Completed:** 2026-03-22
**Focus:** What do I need to know to PLAN this phase well?

## Source Analysis

### Parallel Branch Files (feat-gsd-supabase-migration)

**Adapter mixin** (`frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts`):
- TypeScript mixin function `supabaseAdapterMixin(base)` — plain TS, no Svelte syntax
- Takes `Constructor<UniversalAdapter>`, returns `Constructor<SupabaseAdapter> & TBase`
- Uses private fields (`#supabase`, `#locale`, `#defaultLocale`)
- `init(config: SupabaseAdapterConfig)` — calls `super.init(config)`, then sets up Supabase client
- Three client creation paths: serverClient (from hooks), browser (`createBrowserClient` from `@supabase/ssr`), server fallback (`createClient`)
- Imports: `@supabase/supabase-js`, `@supabase/ssr`, `$app/environment` (browser), `@openvaa/supabase-types`, `$lib/utils/constants`
- Exposes getters: `supabase`, `locale`, `defaultLocale`

**Type definitions** (`supabaseAdapter.type.ts`):
- `SupabaseAdapterConfig extends AdapterConfig` with `locale?`, `defaultLocale?`, `serverClient?`
- `SupabaseAdapter` interface with readonly `supabase`, `locale`, `defaultLocale`

**5 utility files + 5 test files:**

1. **mapRow.ts** — `mapRow(row)`, `mapRowToDb(obj)`, `mapRows(rows[])`. Uses `COLUMN_MAP`/`PROPERTY_MAP` from `@openvaa/supabase-types`. Pure functions, no side effects.

2. **getLocalized.ts** — `getLocalized(value, locale, defaultLocale)`. 3-tier fallback: requested locale -> default locale -> first key -> null. Pure function.

3. **localizeRow.ts** — `localizeRow(row, fields, locale, defaultLocale)`. Calls `getLocalized` on specified fields. Supports dot-notation for nested JSONB paths. Non-mutating (shallow clones). Private helper `localizeNested`.

4. **toDataObject.ts** — `toDataObject(row, locale, defaultLocale, additionalLocalizedFields)`. Pipeline: localizeRow -> mapRow. Standard localized fields: `['name', 'short_name', 'info']`.

5. **storageUrl.ts** — `parseStoredImage(stored, supabaseUrl)` -> `Image | undefined`. Converts `StoredImage` JSONB to `Image` (from `@openvaa/data`). Also exports `StoredImage` interface. Pure function, takes supabaseUrl as parameter.

### Current Branch Adapter Infrastructure

**UniversalAdapter** (`apps/frontend/src/lib/api/base/universalAdapter.ts`):
- Abstract class with `init({ fetch })`, `fetch()`, `get()`, `post()`, `put()`, `delete()` methods
- The Supabase mixin extends this same base — compatible

**AdapterConfig** (`universalAdapter.type.ts`):
- `{ fetch: Fetch | undefined }` — the Supabase config extends this

**Strapi mixin** (`apps/frontend/src/lib/api/adapters/strapi/strapiAdapter.ts`):
- Same mixin pattern: `strapiAdapterMixin(base)` returns `Constructor<StrapiAdapter> & TBase`
- Uses identical `Constructor<TClass = UniversalAdapter>` type alias
- Perfect structural parallel for the Supabase mixin

**Adapter switch** files:
- `apps/frontend/src/lib/api/dataProvider.ts` — switch on `staticSettings.dataAdapter.type` ('strapi' | 'local')
- `apps/frontend/src/lib/api/dataWriter.ts` — same switch pattern
- `apps/frontend/src/lib/api/feedbackWriter.ts` — same switch pattern

**Static settings** (`packages/app-shared/src/settings/staticSettings.type.ts`):
- `dataAdapter: StrapiDataAdapter | LocalDataAdapter`
- Need to add `SupabaseDataAdapter` type
- Current value in `staticSettings.ts`: `{ type: 'strapi', supportsCandidateApp: true, supportsAdminApp: true }`

## Dependencies

### Already Available (Phase 30)
- `@openvaa/supabase-types` — `Database`, `COLUMN_MAP`, `PROPERTY_MAP` types ✓
- `@supabase/supabase-js` — in yarn catalog as `^2.49.4` ✓
- `supabase` CLI — in yarn catalog ✓

### Needs Adding
- `@supabase/ssr` — NOT in catalog or any package.json. Parallel branch uses `^0.9.0`. Required by `supabaseAdapter.ts` (`createBrowserClient`)
- `@openvaa/supabase-types` — NOT in frontend's package.json dependencies
- `@supabase/supabase-js` — NOT in frontend's package.json dependencies
- `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` — NOT in current constants.ts

### Vitest Environment
- Frontend uses `vitest` with `jsdom` environment, `$lib` alias configured
- Test files use `import { describe, it, expect } from 'vitest'`
- All 5 utility test files are pure unit tests — no SvelteKit-specific mocking needed
- `$app/environment` is mocked in vitest config — the mixin test would need this but mixin tests are NOT in scope (no mixin test exists on parallel branch)

## Adaptation Requirements

### Path Changes
- All source imports from `frontend/src/lib/` → `apps/frontend/src/lib/` (file system paths only, import aliases unchanged)
- `$lib/api/base/universalAdapter` — already exists at correct path on current branch
- `$lib/utils/constants` — already exists, needs 2 new constants added

### Svelte 5 Compatibility
- All source files are plain TypeScript — no `.svelte` files, no runes, no Svelte 4 patterns to migrate
- The mixin uses `$app/environment` (SvelteKit built-in, unchanged in Svelte 5)
- No Svelte 5 adaptation needed for any file

### Adapter Switch Design
1. Add `'supabase'` to the switch in `dataProvider.ts`, `dataWriter.ts`, `feedbackWriter.ts`
2. Add `SupabaseDataAdapter` type to `staticSettings.type.ts`
3. Default remains `'strapi'` in `staticSettings.ts`
4. Supabase DataProvider/DataWriter/FeedbackWriter imports won't exist yet (Phase 35) — the switch case should be prepared with TODO comments or conditional imports that won't break
5. Phase 38 cleanup: delete `'strapi'` case and Strapi adapter directory

### Design Decision: Adapter Switch Timing
The switch cases for Supabase in `dataProvider.ts`/`dataWriter.ts`/`feedbackWriter.ts` should be added in this phase even though the provider/writer implementations don't exist yet. The cases should import from the `supabase/` subdirectories that will be created in Phase 35. This means:
- **Option A**: Add switch cases now pointing to not-yet-existing modules → build fails if selected before Phase 35
- **Option B**: Add only the type/config infrastructure now, add switch cases in Phase 35

**Recommendation**: Option A — add the switch cases now. Since `staticSettings.ts` defaults to `'strapi'`, the Supabase import paths are dead code until someone changes the config. Dynamic `import()` won't fail at build time for unused code paths. This keeps the adapter switch complete in one phase.

## Validation Architecture

### Testable Properties
1. **mapRow** — COLUMN_MAP keys correctly renamed to camelCase; unmapped keys pass through; JSONB preserved
2. **mapRowToDb** — PROPERTY_MAP keys correctly renamed to snake_case; unmapped keys pass through
3. **mapRows** — Array mapping works; empty arrays handled
4. **getLocalized** — 3-tier fallback works correctly; null/undefined/empty object handled
5. **localizeRow** — Top-level and nested dot-notation fields localized; non-listed fields untouched; immutability
6. **toDataObject** — Standard fields localized, columns mapped, additional fields supported
7. **parseStoredImage** — Path to URL conversion; null/undefined handled; optional fields included

### Existing Test Coverage
All 5 utility files have comprehensive test suites on the parallel branch. These can be copied directly — they test pure functions with no external dependencies.

### Type Safety Verification
- `SupabaseAdapterConfig extends AdapterConfig` — TypeScript compiler checks this
- `COLUMN_MAP` and `PROPERTY_MAP` types from `@openvaa/supabase-types` — type-safe

## Risk Assessment

### Low Risk
- Utility files are pure functions — copy-paste with path adjustments
- Test files are self-contained — no mocking infrastructure needed
- Mixin pattern is established by Strapi adapter — same structure

### Medium Risk
- `@supabase/ssr` dependency needs to be added to catalog and frontend package.json
- Constants need new env vars that won't exist in development until Supabase stack is configured
- Adapter switch cases for not-yet-implemented modules (dead code until Phase 35)

### Mitigations
- `@supabase/ssr` version from parallel branch (`^0.9.0`) is known-compatible
- Constants use `?? ''` fallback — missing env vars won't crash
- Dynamic `import()` in switch only executes for selected adapter type

---

## RESEARCH COMPLETE

*Phase: 34-adapter-foundation*
*Research completed: 2026-03-22*
