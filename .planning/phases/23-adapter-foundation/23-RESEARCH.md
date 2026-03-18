# Phase 23: Adapter Foundation - Research

**Researched:** 2026-03-18
**Domain:** SvelteKit data adapter architecture, Supabase JS client, row mapping, JSONB localization
**Confidence:** HIGH

## Summary

Phase 23 builds the shared infrastructure that all Supabase adapter classes depend on: a mixin providing a typed Supabase client, row mapping utilities for snake_case/camelCase conversion, a JSONB localization utility with 3-tier fallback, and the dynamic import switch wiring. The existing codebase has a well-established adapter pattern (mixin on UniversalAdapter base class) demonstrated by the Strapi adapter, making this phase primarily a matter of mirroring that pattern with Supabase-specific client creation.

The project already has `@supabase/supabase-js@^2.99.1` and `@supabase/ssr@^0.9.0` installed in the frontend, the `COLUMN_MAP`/`PROPERTY_MAP` bidirectional mappings fully defined in `packages/supabase-types`, and generated database types in `packages/supabase-types/src/database.ts`. The `get_localized()` SQL function in `000-functions.sql` defines the exact 3-tier fallback logic to replicate in TypeScript. All concrete patterns exist as reference implementations -- this phase is wiring them together for Supabase.

**Primary recommendation:** Mirror the `strapiAdapterMixin` pattern exactly -- create `supabaseAdapterMixin` that adds a typed `SupabaseClient<Database>` to any class extending `UniversalAdapter`, with `createClient()` using the fetch from `AdapterConfig` and env vars from the constants pattern. Use `COLUMN_MAP`/`PROPERTY_MAP` from `@openvaa/supabase-types` for bidirectional row mapping. Implement `getLocalized()` as a standalone utility function matching the SQL semantics.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Use `@supabase/supabase-js` `createClient()` with SvelteKit's `fetch` -- not raw PostgREST calls
- Create a `supabaseAdapterMixin` that mirrors the `strapiAdapterMixin` pattern (mixin on UniversalAdapter)
- Default path: `createClient(url, anonKey, { global: { fetch } })` using the fetch from AdapterConfig
- Also accept an injected pre-built `SupabaseClient` via AdapterConfig for server-side routes (e.g., from `hooks.server.ts`)
- Supabase URL and anon key from environment variables: `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` (via `$lib/utils/constants` pattern)
- Add `locale` to AdapterConfig so the adapter knows which locale to extract from JSONB columns
- Column rename + JSONB passthrough: rename snake_case keys to camelCase using COLUMN_MAP, JSONB columns (answers, customization, name, info) pass through as-is
- Prefer standalone utility function `mapRow()` unless there's a reason to need class instance access
- Unmapped columns pass through unchanged -- no data loss. Add a TODO note that RLS is responsible for preventing sensitive data leakage, not the mapper
- Include reverse mapping `mapRowToDb()` (camelCase to snake_case for writes) in this phase
- Client-side extraction: a utility `getLocalized(jsonb, locale, defaultLocale)` matching the SQL `get_localized()` 3-tier fallback
- Default locale comes from `app_settings.default_locale` (DB), not staticSettings -- respects per-project config
- Top-level localized columns only (name, info, description). Nested JSONB structures handled by specific DataProvider methods
- Localization utility should be opt-in per field, not automatic
- Add `'supabase'` case to all three switch files now: `dataProvider.ts`, `dataWriter.ts`, `feedbackWriter.ts`
- Add a TODO comment that the adapter loading logic should be rewritten later
- Add `SupabaseDataAdapter` type: `{ type: 'supabase', supportsCandidateApp: true, supportsAdminApp: false }`
- Supabase adapter files live in `frontend/src/lib/api/adapters/supabase/`
- Create stub adapter classes (DataProvider, DataWriter, FeedbackWriter) that extend UniversalAdapter with supabaseAdapterMixin, throwing 'not implemented' for each method

### Claude's Discretion
- Exact file organization within `frontend/src/lib/api/adapters/supabase/`
- Whether the mixin exposes the Supabase client directly or wraps it in helper methods (like strapiAdapterMixin has `apiGet`/`apiPost`)
- Test approach and coverage for the utilities (unit tests for mapRow, getLocalized)
- Whether `mapRow` needs generic type parameters or just returns `Record<string, unknown>`

### Deferred Ideas (OUT OF SCOPE)
- Rewrite adapter loading logic (switch pattern is clunky) -- future refactor phase
- Move translate(Object) functions from frontend/src/lib/i18n/init.ts to app-shared package -- future phase
- Remove custom translation functions from data package -- future cleanup
- Admin app support (supportsAdminApp: true) -- post v3.0 milestone
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ADPT-01 | supabaseAdapterMixin providing typed Supabase client with init({ fetch }) compatibility | Mixin pattern fully documented from strapiAdapterMixin reference. SupabaseClient generic typing from `@supabase/supabase-js` confirmed. createClient options structure verified from package types. |
| ADPT-02 | Row mapping utility using COLUMN_MAP/PROPERTY_MAP for snake_case to camelCase transforms | COLUMN_MAP/PROPERTY_MAP already exist in `packages/supabase-types/src/column-map.ts` with 30+ entries. Both directions available. Standalone utility function approach confirmed. |
| ADPT-03 | JSONB localization utility implementing 3-tier fallback (requested, default, first key) | SQL `get_localized()` logic fully documented (lines 53-76 of 000-functions.sql). TypeScript implementation is straightforward port. Default locale sourced from `projects.default_locale` column. |
| ADPT-04 | staticSettings.dataAdapter.type = 'supabase' support in dynamic import switch | All three switch files (dataProvider.ts, dataWriter.ts, feedbackWriter.ts) examined. Pattern is simple case addition. SupabaseDataAdapter type addition to staticSettings.type.ts confirmed. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.99.1 (latest: 2.99.2) | Typed Supabase client for PostgREST, Auth, Storage | Already installed in frontend. Provides typed queries when parameterized with Database type. |
| @supabase/ssr | ^0.9.0 | Server-side cookie-based auth for SvelteKit | Already installed. Used in Phase 24 for auth, but mixin should be aware of it for server client injection. |
| @openvaa/supabase-types | workspace | Generated database types, COLUMN_MAP, PROPERTY_MAP | Existing workspace package with complete bidirectional column mapping. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | ^2.1.8 (latest: 4.1.0) | Unit testing for utilities | Already configured in frontend. Test mapRow, getLocalized utilities. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @supabase/supabase-js | Raw fetch to PostgREST | Locked decision: use supabase-js. Raw fetch loses typed queries, auth integration, and storage helpers. |
| Standalone mapRow() | Mixin method | Decision says prefer standalone. Standalone is simpler, independently testable, no class coupling. |

**Installation:**
No new packages needed -- `@supabase/supabase-js` and `@supabase/ssr` are already in `frontend/package.json`.

**Version verification:** `@supabase/supabase-js` current is 2.99.2, project has ^2.99.1 (compatible). `@supabase/ssr` current is 0.9.0 (exact match). `vitest` current is 4.1.0, project has ^2.1.8 (project's own version, no need to upgrade for this phase).

## Architecture Patterns

### Recommended Project Structure
```
frontend/src/lib/api/adapters/supabase/
  supabaseAdapter.ts          # supabaseAdapterMixin function
  supabaseAdapter.type.ts     # SupabaseAdapter interface, SupabaseAdapterConfig type
  utils/
    mapRow.ts                 # mapRow() and mapRowToDb() utilities
    getLocalized.ts           # getLocalized() JSONB extraction utility
  dataProvider/
    index.ts                  # exports instantiated SupabaseDataProvider
    supabaseDataProvider.ts   # Stub class extending mixin(UniversalDataProvider)
  dataWriter/
    index.ts                  # exports instantiated SupabaseDataWriter
    supabaseDataWriter.ts     # Stub class extending mixin(UniversalDataWriter)
  feedbackWriter/
    index.ts                  # exports instantiated SupabaseFeedbackWriter
    supabaseFeedbackWriter.ts # Stub class extending mixin(UniversalFeedbackWriter)
```

This mirrors the existing Strapi adapter structure exactly:
```
frontend/src/lib/api/adapters/strapi/
  strapiAdapter.ts            # strapiAdapterMixin function
  strapiAdapter.type.ts       # StrapiAdapter interface
  strapiApi.ts                # API endpoint definitions
  strapiData.type.ts          # Strapi response types
  utils/                      # Parse/transform utilities
  dataProvider/
    index.ts
    strapiDataProvider.ts
  dataWriter/
    index.ts
    strapiDataWriter.ts
  feedbackWriter/
    index.ts
    strapiFeedbackWriter.ts
```

### Pattern 1: Mixin Pattern (supabaseAdapterMixin)
**What:** A function that takes a base class constructor and returns a new class extending it with Supabase client functionality.
**When to use:** Every Supabase adapter class (DataProvider, DataWriter, FeedbackWriter) uses this mixin.
**Reference:** `frontend/src/lib/api/adapters/strapi/strapiAdapter.ts` (lines 22-81)

```typescript
// Source: Derived from strapiAdapterMixin pattern + Supabase createClient API
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@openvaa/supabase-types';
import { constants } from '$lib/utils/constants';
import type { UniversalAdapter } from '$lib/api/base/universalAdapter';
import type { AdapterConfig } from '$lib/api/base/universalAdapter.type';

export interface SupabaseAdapterConfig extends AdapterConfig {
  locale?: string;
  defaultLocale?: string;
  serverClient?: SupabaseClient<Database>;
}

export interface SupabaseAdapter {
  readonly supabase: SupabaseClient<Database>;
  readonly locale: string;
  readonly defaultLocale: string;
}

type Constructor<TClass = UniversalAdapter> = abstract new (...args: any[]) => TClass;

export function supabaseAdapterMixin<TBase extends Constructor>(
  base: TBase
): Constructor<SupabaseAdapter> & TBase {
  abstract class WithMixin extends base {
    #supabase: SupabaseClient<Database> | undefined;
    #locale = '';
    #defaultLocale = 'en';

    init(config: SupabaseAdapterConfig): this {
      super.init(config);
      if (config.serverClient) {
        this.#supabase = config.serverClient;
      } else {
        this.#supabase = createClient<Database>(
          constants.PUBLIC_SUPABASE_URL,
          constants.PUBLIC_SUPABASE_ANON_KEY,
          { global: { fetch: config.fetch! } }
        );
      }
      if (config.locale) this.#locale = config.locale;
      if (config.defaultLocale) this.#defaultLocale = config.defaultLocale;
      return this;
    }

    get supabase(): SupabaseClient<Database> {
      if (!this.#supabase) throw new Error('Supabase client not initialized. Call init() first.');
      return this.#supabase;
    }

    get locale(): string { return this.#locale; }
    get defaultLocale(): string { return this.#defaultLocale; }
  }
  return WithMixin;
}
```

**Key design decisions:**
- The mixin exposes `supabase` as a property getter (not wrapped in helper methods like Strapi's `apiGet`/`apiPost`). Rationale: Supabase's PostgREST query builder is already a fluent API; wrapping it adds no value. Each adapter method directly uses `this.supabase.from('table').select(...)`.
- `locale` and `defaultLocale` are stored as instance properties, set during `init()`.
- The `init()` method calls `super.init(config)` to maintain the UniversalAdapter's fetch initialization.

### Pattern 2: Row Mapping Utility
**What:** Standalone functions to convert between snake_case DB rows and camelCase TypeScript objects.
**When to use:** Every adapter method that reads from or writes to Supabase.

```typescript
// Source: Derived from packages/supabase-types/src/column-map.ts
import { COLUMN_MAP, PROPERTY_MAP } from '@openvaa/supabase-types';

/**
 * Map a snake_case database row to a camelCase domain object.
 * Columns in COLUMN_MAP are renamed; unmapped columns pass through unchanged.
 *
 * TODO: RLS is responsible for preventing sensitive data leakage, not the mapper.
 */
export function mapRow<T extends Record<string, unknown>>(row: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const mappedKey = (COLUMN_MAP as Record<string, string>)[key] ?? key;
    result[mappedKey] = value;
  }
  return result;
}

/**
 * Map a camelCase domain object to a snake_case database row for writes.
 */
export function mapRowToDb<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const mappedKey = (PROPERTY_MAP as Record<string, string>)[key] ?? key;
    result[mappedKey] = value;
  }
  return result;
}

/** Map an array of rows */
export function mapRows<T extends Record<string, unknown>>(rows: T[]): Record<string, unknown>[] {
  return rows.map(mapRow);
}
```

### Pattern 3: JSONB Localization Utility
**What:** Client-side extraction of locale-appropriate strings from JSONB locale objects.
**When to use:** DataProvider methods when converting JSONB columns (name, info, description) to single-locale strings for the voter/candidate app.

```typescript
// Source: SQL get_localized() in apps/supabase/supabase/schema/000-functions.sql (lines 53-76)

/**
 * Extract a locale-appropriate string from a JSONB locale object.
 * Implements 3-tier fallback matching the SQL get_localized() function:
 *   1. requested locale
 *   2. default locale
 *   3. first available key
 *   4. null (if value is null/undefined or empty)
 */
export function getLocalized(
  value: Record<string, string> | null | undefined,
  locale: string,
  defaultLocale: string = 'en'
): string | null {
  if (value == null) return null;

  if (locale in value) return value[locale];
  if (defaultLocale in value) return value[defaultLocale];

  const keys = Object.keys(value);
  if (keys.length > 0) return value[keys[0]];

  return null;
}
```

**Important distinction from the data package `translate()` function:**
- The data package's `translate()` uses the `TRANSLATIONS_KEY` (`__translations__`) wrapper and handles nested localized objects recursively.
- `getLocalized()` works directly with the raw JSONB locale objects from Supabase (`{"en": "Text", "fi": "Teksti"}`), which is the DB storage format.
- The DataProvider must convert raw JSONB `{"en": "Text"}` into the data package's `LocalizedValue` format `{ __translations__: {"en": "Text"} }` for fields that the data model expects as `LocalizedValue`. This conversion happens in the DataProvider methods (Phase 25), not in this utility.
- For methods that need a single locale string (e.g., voter app display), `getLocalized()` extracts the right string.

### Pattern 4: Dynamic Import Switch
**What:** Adding `'supabase'` case to the three switch files that resolve which adapter to load.
**When to use:** When `staticSettings.dataAdapter.type` is set to `'supabase'`.

```typescript
// Source: frontend/src/lib/api/dataProvider.ts -- adding supabase case
case 'supabase':
  module = import('./adapters/supabase/dataProvider');
  break;
```

### Pattern 5: Stub Adapter Classes
**What:** Concrete classes that extend `supabaseAdapterMixin(UniversalDataProvider|UniversalDataWriter|UniversalFeedbackWriter)` with 'not implemented' stubs for all abstract methods.
**When to use:** This phase creates the stubs; Phase 25/26 fill in implementations.

```typescript
// Source: Pattern from StrapiDataProvider
import { UniversalDataProvider } from '$lib/api/base/universalDataProvider';
import { supabaseAdapterMixin } from '../supabaseAdapter';

export class SupabaseDataProvider extends supabaseAdapterMixin(UniversalDataProvider) {
  protected async _getAppSettings() {
    throw new Error('SupabaseDataProvider._getAppSettings not implemented');
  }
  // ... all other abstract methods throw 'not implemented'
}
```

### Anti-Patterns to Avoid
- **Wrapping supabase-js in custom HTTP helpers:** Unlike Strapi where `apiGet`/`apiPost` construct URLs and parse responses, Supabase's query builder IS the abstraction. Do not add a `query()` helper that duplicates what `supabase.from().select()` already does.
- **Automatic localization in mapRow:** The `mapRow()` function must NOT automatically extract locale strings from JSONB columns. Localization is opt-in per field because: (1) DataWriter needs raw JSONB for multilingual writes, (2) different columns have different localization needs, (3) the DataProvider controls which fields get localized.
- **Using `qs` for Supabase queries:** Strapi uses `qs.stringify` for filter params. Supabase uses its PostgREST query builder (`from().select().eq().in()`). Do not use `qs` in the Supabase adapter.
- **Storing default locale in staticSettings:** The decision says default locale comes from `projects.default_locale` in the DB, not from staticSettings. The adapter must fetch this value and pass it through.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Column name mapping | Custom mapping objects | COLUMN_MAP/PROPERTY_MAP from `@openvaa/supabase-types` | Already has 30+ entries, maintained alongside schema. Both directions available. |
| Supabase client creation | Custom fetch wrapper | `createClient<Database>()` from `@supabase/supabase-js` | Handles auth, PostgREST, storage, realtime. Typed with generated Database type. |
| Database types | Manual type definitions | Generated types from `packages/supabase-types/src/database.ts` | Auto-generated from schema, always in sync. |
| PostgREST query building | URL string construction | Supabase query builder (`.from().select().eq()`) | Type-safe, handles encoding, pagination, filtering. |

**Key insight:** The entire Supabase client library IS the abstraction layer. The mixin's job is to create and expose a properly configured instance, not to wrap its API.

## Common Pitfalls

### Pitfall 1: Forgetting to Call super.init() in the Mixin
**What goes wrong:** The `UniversalAdapter.init()` sets the private `#fetch` field. If the mixin overrides `init()` without calling `super.init()`, the base class's `fetch()`, `get()`, `post()` methods all throw "Adapter fetch is not defined."
**Why it happens:** The mixin pattern requires explicit super delegation.
**How to avoid:** Always call `super.init(config)` first in the mixin's `init()` method. The Strapi adapter does not override `init()` but the Supabase adapter must to create the client.
**Warning signs:** "Adapter fetch is not defined" errors at runtime.

### Pitfall 2: AdapterConfig Type Compatibility
**What goes wrong:** The `UniversalAdapter.init()` accepts `AdapterConfig = { fetch: Fetch | undefined }`. The Supabase mixin needs additional fields (locale, serverClient). If the extended type is not compatible with the base, TypeScript compilation fails or callers get type errors.
**Why it happens:** The mixin's `init()` signature must be a superset of the base's.
**How to avoid:** Define `SupabaseAdapterConfig extends AdapterConfig` and use it as the parameter type in the mixin's `init()`. Callers who know they're using Supabase can pass the full config; the base class receives only what it needs via super.
**Warning signs:** TypeScript errors about init() parameter types.

### Pitfall 3: COLUMN_MAP Collision for organization_id
**What goes wrong:** `COLUMN_MAP` has both `organization_id: 'organizationId'` (for CandidateData) and `organization_id_nom: 'organizationId'` (for NominationData). The nominations table uses `organization_id` as the actual column name, but in COLUMN_MAP it's mapped as `organization_id_nom` to avoid the collision.
**Why it happens:** The same camelCase property name maps to different snake_case columns in different tables.
**How to avoid:** The `mapRow()` utility uses COLUMN_MAP mechanically. For nominations, the DataProvider (Phase 25) may need to handle the `organization_id` column specially rather than relying on `mapRow()` alone. The row mapper should just do the mechanical rename -- table-specific logic belongs in the DataProvider methods.
**Warning signs:** Nomination organization_id mapped to the candidate-table mapping.

### Pitfall 4: Supabase Client in Browser vs Server
**What goes wrong:** The Supabase client created with `createClient()` in the browser handles auth tokens via localStorage by default. On the server, there's no localStorage. Server-side usage requires injecting a pre-built client (from `@supabase/ssr` via hooks.server.ts).
**Why it happens:** SvelteKit code runs on both server and client. The adapter needs different client creation strategies.
**How to avoid:** The mixin accepts an optional `serverClient` in the config. When present, it uses the injected client instead of creating one. This is the locked decision from CONTEXT.md. The actual server client setup is Phase 24 (Auth Migration) scope.
**Warning signs:** Auth errors, localStorage not available on server.

### Pitfall 5: Constants Not Including Supabase Env Vars
**What goes wrong:** The `$lib/utils/constants.ts` file currently only has Strapi-era env vars. Adding `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` requires updating this file.
**Why it happens:** New env vars need explicit registration in the constants pattern.
**How to avoid:** Add the two new constants to `$lib/utils/constants.ts` as part of this phase.
**Warning signs:** Empty string defaults for Supabase URL/key causing connection failures.

### Pitfall 6: staticSettings Union Type Not Including Supabase
**What goes wrong:** The `dataAdapter` property type is `StrapiDataAdapter | LocalDataAdapter`. Adding `SupabaseDataAdapter` requires updating the union AND the switch exhaustiveness checks.
**Why it happens:** TypeScript discriminated unions need all members declared.
**How to avoid:** Add `SupabaseDataAdapter` to the union in `staticSettings.type.ts`. Update the switch `default` cases to handle the new type.
**Warning signs:** TypeScript errors about `'supabase'` not being assignable to existing union.

## Code Examples

### Constants Update
```typescript
// Source: frontend/src/lib/utils/constants.ts -- add these entries
export const constants = {
  // ... existing entries ...
  PUBLIC_SUPABASE_URL: env.PUBLIC_SUPABASE_URL ?? '',
  PUBLIC_SUPABASE_ANON_KEY: env.PUBLIC_SUPABASE_ANON_KEY ?? ''
};
```

### SupabaseDataAdapter Type
```typescript
// Source: packages/app-shared/src/settings/staticSettings.type.ts -- add alongside existing types
export type SupabaseDataAdapter = {
  readonly type: 'supabase';
  readonly supportsCandidateApp: true;
  readonly supportsAdminApp: false;
};
```

### Static Settings Type Union Update
```typescript
// In staticSettings.type.ts, update:
readonly dataAdapter: StrapiDataAdapter | LocalDataAdapter | SupabaseDataAdapter;
```

### DataWriter Switch (Most Complex Pattern)
```typescript
// Source: frontend/src/lib/api/dataWriter.ts -- the dataWriter has a special default case
switch (type) {
  case 'strapi':
    module = import('./adapters/strapi/dataWriter');
    break;
  case 'supabase':
    module = import('./adapters/supabase/dataWriter');
    break;
  default:
    module = new Promise(() => {
      logDebugError(
        `[dataWriter] DataWriter imported when using an unsupported data adapter (${type}).`
      );
      return { dataWriter: undefined };
    });
}
```

### Stub Adapter Export Pattern
```typescript
// frontend/src/lib/api/adapters/supabase/dataProvider/index.ts
import { SupabaseDataProvider } from './supabaseDataProvider';
export const dataProvider = new SupabaseDataProvider();
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Strapi REST API with qs params | Supabase PostgREST query builder | This migration (v3.0) | No URL construction, typed queries, built-in auth |
| JWT auth tokens passed explicitly | Cookie-based sessions via @supabase/ssr | Supabase SSR v0.9 | Server-side auth handled by hooks, not adapter |
| Custom translate() with TRANSLATIONS_KEY | Direct JSONB locale objects from DB | This migration (v3.0) | Simpler: DB stores `{"en":"text"}`, adapter extracts or passes through |

**Deprecated/outdated:**
- Strapi adapter pattern: still in use but being replaced by this Supabase adapter. Will be removed in Phase 30.

## Open Questions

1. **Default locale sourcing at init time**
   - What we know: Default locale comes from `projects.default_locale` column. The adapter needs this value during `init()` or early in data fetching.
   - What's unclear: Whether `defaultLocale` should be fetched from the DB during adapter init, or passed in from the calling context (layout/hooks). During SSR the locale is typically known from the URL/cookie.
   - Recommendation: Accept `defaultLocale` as a config parameter (set by layout load function after fetching app_settings). The mixin stores it but does not fetch it itself. Phase 25 `getAppSettings()` will be the method that reads it from DB.

2. **mapRow generic type parameter**
   - What we know: Decision says Claude's discretion on whether mapRow needs generics.
   - Recommendation: Use `Record<string, unknown>` return type for now. The concrete type narrowing happens in each DataProvider method that calls mapRow and knows what shape the result should be. Generic type parameters on mapRow add complexity without type safety (COLUMN_MAP remapping changes the shape unpredictably at the type level).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest ^2.1.8 |
| Config file | `frontend/vitest.config.ts` (exists, jsdom environment, globals: true) |
| Quick run command | `cd frontend && yarn vitest run src/lib/api/adapters/supabase` |
| Full suite command | `cd frontend && yarn test:unit` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ADPT-02 | mapRow renames snake_case to camelCase using COLUMN_MAP | unit | `cd frontend && yarn vitest run src/lib/api/adapters/supabase/utils/mapRow.test.ts -x` | Wave 0 |
| ADPT-02 | mapRow passes unmapped columns through unchanged | unit | Same test file | Wave 0 |
| ADPT-02 | mapRowToDb reverses camelCase to snake_case using PROPERTY_MAP | unit | Same test file | Wave 0 |
| ADPT-03 | getLocalized returns requested locale string | unit | `cd frontend && yarn vitest run src/lib/api/adapters/supabase/utils/getLocalized.test.ts -x` | Wave 0 |
| ADPT-03 | getLocalized falls back to default locale | unit | Same test file | Wave 0 |
| ADPT-03 | getLocalized falls back to first key when neither locale found | unit | Same test file | Wave 0 |
| ADPT-03 | getLocalized returns null for null/undefined input | unit | Same test file | Wave 0 |
| ADPT-01 | supabaseAdapterMixin creates class with supabase property | unit | Requires mocking -- may be integration test in later phase | Wave 0 |
| ADPT-04 | Switch files have 'supabase' case (no runtime error) | manual-only | Visual inspection -- runtime testing requires full app context | N/A |

### Sampling Rate
- **Per task commit:** `cd frontend && yarn vitest run src/lib/api/adapters/supabase`
- **Per wave merge:** `cd frontend && yarn test:unit`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `frontend/src/lib/api/adapters/supabase/utils/mapRow.test.ts` -- covers ADPT-02
- [ ] `frontend/src/lib/api/adapters/supabase/utils/getLocalized.test.ts` -- covers ADPT-03

Note: Mixin testing (ADPT-01) is complex because `createClient` requires network/env setup. A minimal test can verify the mixin creates a class with the correct interface. Full integration testing will occur in Phase 25 when real queries are made.

## Sources

### Primary (HIGH confidence)
- `frontend/src/lib/api/adapters/strapi/strapiAdapter.ts` -- Reference mixin implementation (lines 22-81)
- `frontend/src/lib/api/base/universalAdapter.ts` -- Base class with init({ fetch }) pattern
- `frontend/src/lib/api/base/universalAdapter.type.ts` -- AdapterConfig type definition
- `packages/supabase-types/src/column-map.ts` -- COLUMN_MAP/PROPERTY_MAP with 30+ entries
- `apps/supabase/supabase/schema/000-functions.sql` -- SQL get_localized() (lines 41-76)
- `packages/app-shared/src/settings/staticSettings.type.ts` -- DataAdapter type definitions
- `frontend/src/lib/api/dataProvider.ts`, `dataWriter.ts`, `feedbackWriter.ts` -- Switch files
- `@supabase/supabase-js` v2.99.1 type declarations (`dist/index.d.mts`) -- SupabaseClient class, createClient options
- `packages/supabase-types/src/database.ts` -- Generated Database type
- `frontend/src/lib/utils/constants.ts` -- Env var access pattern

### Secondary (MEDIUM confidence)
- `packages/data/src/i18n/translate.ts` -- Data package translate() for contrast with getLocalized()
- `packages/data/src/i18n/localized.ts` -- LocalizedValue type and TRANSLATIONS_KEY

### Tertiary (LOW confidence)
- None -- all findings verified from project source code.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed, versions verified against npm registry
- Architecture: HIGH -- mixin pattern, switch pattern, and utility patterns all have concrete reference implementations in the codebase
- Pitfalls: HIGH -- identified from reading actual code, especially the COLUMN_MAP collision and AdapterConfig compatibility

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable -- patterns are project-internal, not external API dependent)
