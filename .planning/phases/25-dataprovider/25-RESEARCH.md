# Phase 25: DataProvider - Research

**Researched:** 2026-03-19
**Domain:** Supabase DataProvider implementation (read operations for voter app)
**Confidence:** HIGH

## Summary

Phase 25 implements the 7 DataProvider read methods in `SupabaseDataProvider`, replacing the Phase 23 stubs with real Supabase queries. The domain is well-constrained: the DataProvider interface is already defined, the Supabase schema is stable, and utilities for row mapping (`mapRow`) and localization (`getLocalized`) are already built. The primary complexity lies in the nominations query (polymorphic table with hierarchical parent-child relationships) and the data transformation pipeline (JSONB localization, storage path-to-URL conversion, column mapping).

The approach uses PostgREST queries directly via the Supabase client for simple data (elections, constituencies, entities, questions, app settings) and an RPC function for nominations where the polymorphic entity resolution requires joining across 4 entity tables with deduplication. Three new utility functions are needed: `localizeRow()` for batch field localization, `toDataObject()` for shared DataObject field extraction, and `storageUrl()` for converting Supabase Storage paths to public URLs.

**Primary recommendation:** Implement utilities first (localizeRow, toDataObject, storageUrl), then simple methods (appSettings, appCustomization, elections, constituencies, questions, entities), then the complex nomination RPC and its client-side consumer last.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- Nomination query strategy: Build an RPC function (`get_nominations`) that combines nominations with their associated entities in a single database round trip. The RPC should be composable: able to return just nominations if needed, or nominations + entities together. Nominations reference entities by `entityId`; entities are returned as a separate deduplicated set. Claude's discretion on CTE vs flat rows.
- Do NOT use Strapi's `parseNominations.ts` as a template -- the Supabase schema is cleaner.
- DPDataType extension: Extend `DPDataType['nominations']` to also accept `NominationVariantTree` format. Similarly for entities with `EntityVariantTree`.
- Localization: Localize at fetch time (each DataProvider method accepts locale option, returns single-locale strings). Create a `localizeRow()` helper with nested dot-notation path support.
- Data transformation: Create a shared `toDataObject()` helper combining mapRow + localizeRow + common DataObject fields. Per-method code adds type-specific fields on top.
- Pass Supabase UUIDs through as-is for `id` fields (no `formatId()` needed).
- Image fields: Create a utility to convert storage paths to absolute Supabase Storage URLs.
- App settings: `app_settings.settings` JSONB matches `DynamicSettings` structure. `app_settings.customization` JSONB mirrors `AppCustomization` structure.

### Claude's Discretion

- Exact RPC SQL implementation (recursive CTE vs flat rows + client nesting) -- optimize for minimal total processing
- Whether `toDataObject()` uses generic type parameters or returns `Record<string, unknown>`
- Test approach: unit tests for each DataProvider method, mocking Supabase client responses
- File organization within the supabase adapter's dataProvider directory
- How `localizeRow()` handles edge cases (missing nested paths, non-object values at nested paths)

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| READ-01 | getAppSettings and getAppCustomization from Supabase | App settings JSONB maps directly to DynamicSettings; customization needs storage URL conversion and localization of string fields |
| READ-02 | getElectionData with constituency groups | Elections query with join table `election_constituency_groups` for constituencyGroupIds; standard mapRow + localizeRow |
| READ-03 | getConstituencyData with parent relationships | Two queries: constituency_groups with join table, constituencies with parentId; deduplicate constituencies across groups |
| READ-04 | getNominationData with entity resolution (polymorphic nominations table) | RPC function `get_nominations` joining nominations with 4 entity tables; returns flat rows with entity data for client-side assembly |
| READ-05 | getEntityData for candidates and organizations | Separate queries per entity type; candidates need firstName/lastName/organizationId; both need answers JSONB pass-through |
| READ-06 | getQuestionData with categories and question types | Categories with election_ids/constituency_ids JSONB arrays; questions with type enum, choices JSONB, categoryId FK |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | (already installed) | Supabase client with PostgREST query builder | Already used in Phase 23/24; provides typed queries via `SupabaseClient<Database>` |
| @openvaa/supabase-types | workspace | Generated database types + COLUMN_MAP/PROPERTY_MAP | Already used in Phase 23; provides type-safe column mapping |
| @openvaa/data | workspace | DataObject types, entity/nomination variants, tree types | Already used; defines all return type shapes |
| @openvaa/app-shared | workspace | DynamicSettings type, LocalizedString utilities | Already used; defines settings shape |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | (already installed) | Unit testing | Testing each DataProvider method with mocked Supabase client |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| RPC for nominations | Multiple PostgREST queries | RPC is one round trip vs 5 separate queries for nominations + 4 entity tables; RPC wins for this use case |
| Client-side entity dedup | SQL DISTINCT in RPC | Client-side dedup with a Map is simpler and avoids SQL complexity; entities are small datasets |

## Architecture Patterns

### Recommended Project Structure
```
frontend/src/lib/api/adapters/supabase/
  dataProvider/
    supabaseDataProvider.ts   # Main class with 7 method implementations
    index.ts                  # Re-export (exists)
  utils/
    mapRow.ts                 # Exists (Phase 23)
    mapRow.test.ts            # Exists (Phase 23)
    getLocalized.ts           # Exists (Phase 23)
    getLocalized.test.ts      # Exists (Phase 23)
    localizeRow.ts            # NEW: batch localize multiple fields
    localizeRow.test.ts       # NEW: tests
    toDataObject.ts           # NEW: shared DataObject field extraction
    toDataObject.test.ts      # NEW: tests
    storageUrl.ts             # NEW: storage path -> public URL
    storageUrl.test.ts        # NEW: tests
apps/supabase/supabase/
  migrations/
    YYYYMMDDHHMMSS_get_nominations_rpc.sql  # NEW: nominations RPC
```

### Pattern 1: PostgREST Query for Simple Tables
**What:** Use the typed Supabase client directly for tables with straightforward structure.
**When to use:** Elections, constituencies, constituency groups, entities, questions, question categories, app settings.
**Example:**
```typescript
// Source: Phase 23 established pattern
const { data, error } = await this.supabase
  .from('elections')
  .select('*, election_constituency_groups(constituency_group_id)')
  .order('sort_order');
if (error) throw error;
```

### Pattern 2: RPC for Complex Joins
**What:** Use a PostgreSQL function called via `.rpc()` when multiple tables need joining with custom logic.
**When to use:** Nominations with entity resolution across 4 entity tables.
**Example:**
```typescript
const { data, error } = await this.supabase
  .rpc('get_nominations', {
    p_election_id: options.electionId ?? null,
    p_constituency_id: options.constituencyId ?? null,
    p_include_unconfirmed: options.includeUnconfirmed ?? false
  });
if (error) throw error;
```

### Pattern 3: localizeRow + toDataObject Pipeline
**What:** Chain field localization and common field extraction into a reusable pipeline.
**When to use:** Every DataProvider method that returns DataObjectData-based types.
**Example:**
```typescript
// localizeRow: localize specific fields using getLocalized
function localizeRow(
  row: Record<string, unknown>,
  fields: string[],  // e.g. ['name', 'short_name', 'info', 'custom_data.fillingInfo']
  locale: string,
  defaultLocale: string
): Record<string, unknown>

// toDataObject: mapRow + localizeRow + extract common DataObject fields
function toDataObject(
  row: Record<string, unknown>,
  locale: string,
  defaultLocale: string,
  localizedFields?: string[]  // additional fields beyond the standard set
): Record<string, unknown>
```

### Pattern 4: Storage URL Conversion
**What:** Convert Supabase Storage paths to public URLs for image fields.
**When to use:** Any entity image field, app customization image fields.
**Example:**
```typescript
// StoredImage from DB: { path: "proj-id/candidate/entity-id/photo.jpg", pathDark: "...", alt: "..." }
// Image for frontend: { url: "https://supabase-url/storage/v1/object/public/public-assets/proj-id/...", urlDark: "...", alt: "..." }
function storageUrl(path: string, supabaseUrl: string): string {
  return `${supabaseUrl}/storage/v1/object/public/public-assets/${path}`;
}
```

### Anti-Patterns to Avoid
- **Do NOT use Strapi patterns as template:** The Strapi adapter uses `parseBasics`, `parseCandidate`, `parseOrganization` with Strapi-specific data shapes (documentId, populate-based relations). The Supabase schema is cleaner and needs different transformation.
- **Do NOT wrap PostgREST in apiGet/apiPost:** Phase 23 decision -- the query builder IS the abstraction. Methods call `this.supabase.from(...)` directly.
- **Do NOT duplicate entity data inside nomination rows:** The RPC returns entities as a separate deduplicated set; nominations reference them by entityId.
- **Do NOT call `formatId()`:** Supabase UUIDs pass through as-is (Phase 25 decision). `formatId()` was Strapi-specific for documentId normalization.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Column name mapping | Manual rename per field | `mapRow()` from `supabase/utils/mapRow.ts` | Already handles 30+ column mappings via COLUMN_MAP |
| Locale extraction from JSONB | Per-field locale logic | `getLocalized()` from `supabase/utils/getLocalized.ts` | 3-tier fallback matching SQL `get_localized()` function |
| Storage URL construction | String concatenation per call | `storageUrl()` utility (new) | Centralizes bucket name, URL format; handles pathDark too |
| DataObject field extraction | Per-method copy-paste of id/name/shortName/info/order/customData | `toDataObject()` utility (new) | 7+ methods share these fields; single place to maintain |

**Key insight:** The Supabase adapter has a much thinner transformation layer than Strapi because the Supabase schema was designed to match the TypeScript data model closely. Most fields pass through with just column renaming and localization -- there's no need for deep restructuring.

## Common Pitfalls

### Pitfall 1: Forgetting to localize nested JSONB fields
**What goes wrong:** Fields inside `custom_data` or `settings` JSONB that contain `LocalizedString` values (e.g., `custom_data.fillingInfo`, `notifications.candidateApp.title`) are passed through raw as locale-keyed objects instead of resolved strings.
**Why it happens:** `mapRow()` only renames columns; it doesn't touch JSONB contents. `getLocalized()` is opt-in per field.
**How to avoid:** The `localizeRow()` helper must support dot-notation paths to reach nested fields. Document which fields are localized in each table.
**Warning signs:** Frontend displays `[object Object]` instead of strings.

### Pitfall 2: Missing storage URL conversion for image fields
**What goes wrong:** Image fields contain storage paths like `"proj-id/candidate/id/photo.jpg"` instead of full URLs. Frontend image components fail to load.
**Why it happens:** Supabase stores relative paths in the `image` JSONB column. The Strapi adapter resolved this via `parseImage()` with the backend URL.
**How to avoid:** Apply `storageUrl()` conversion to every image field: entity `image`, nomination `image`, app customization `publisherLogo`/`poster`/`candPoster`. The stored format is `{path, pathDark?, alt?, width?, height?, focalPoint?}` and the expected format is `{url, urlDark?, alt?}`.
**Warning signs:** Broken image URLs in the rendered app.

### Pitfall 3: Election constituencyGroupIds requires join table query
**What goes wrong:** Elections are returned without their constituency group associations.
**Why it happens:** The relationship between elections and constituency groups uses a join table `election_constituency_groups`, not a direct FK. A simple `select('*')` on `elections` won't include this data.
**How to avoid:** Use PostgREST's embedded resource syntax: `.select('*, election_constituency_groups(constituency_group_id)')` to fetch the join table data inline.
**Warning signs:** `constituencyGroupIds` is undefined or empty array on all elections.

### Pitfall 4: Nomination entity_type is a generated column
**What goes wrong:** Attempting to include `entity_type` in INSERT/UPDATE of nominations, or misunderstanding that entity_type is already available in query results without joining.
**Why it happens:** `entity_type` is `GENERATED ALWAYS AS (CASE WHEN candidate_id IS NOT NULL THEN 'candidate'::entity_type ...)`.
**How to avoid:** Read `entity_type` from the nomination row directly; it's always populated. Use it to determine the `entityType` field for the NominationData.
**Warning signs:** N/A for reads; but important context for the RPC design.

### Pitfall 5: Question choices JSONB needs locale-aware label extraction
**What goes wrong:** Choice labels in choice-type questions are stored as `LocalizedString` objects in the `choices` JSONB array, but the frontend expects plain strings.
**Why it happens:** The `choices` column stores `[{id: 1, label: {"en": "Agree", "fi": "Samaa mielta"}, ...}]`.
**How to avoid:** When processing questions with choice types (`singleChoiceOrdinal`, `singleChoiceCategorical`, `multipleChoiceCategorical`), iterate over the choices array and localize each label.
**Warning signs:** Choice labels render as `[object Object]`.

### Pitfall 6: Answers JSONB passes through without localization
**What goes wrong:** Answer `info` fields contain `LocalizedString` objects that get passed to the frontend unlocalized.
**Why it happens:** The `answers` column stores `{questionId: {value: ..., info: {"en": "...", "fi": "..."}}}`. The value itself may also be a `LocalizedString` for text-type questions.
**How to avoid:** Use `parseAnswers()` from `$lib/api/utils/parseAnswers.ts` -- it already handles localizing both `value` and `info` fields. This utility is shared between Strapi and Supabase adapters.
**Warning signs:** Answer explanations display as `[object Object]`.

### Pitfall 7: Constituency keywords stored as JSONB locale object, not array
**What goes wrong:** Constituency keywords are returned as a locale-keyed JSONB object instead of an array of strings.
**Why it happens:** The `keywords` column is `jsonb` storing `{"en": "Helsinki, Espoo", "fi": "Helsinki, Espoo"}` -- a LocalizedString that needs to be localized then split by comma.
**How to avoid:** Localize the keywords field with `getLocalized()`, then split the result by comma+whitespace to get the array.
**Warning signs:** Keywords property is an object or a single string instead of string array.

## Code Examples

Verified patterns from the codebase:

### Supabase PostgREST Query with Embedded Relations
```typescript
// Source: Supabase PostgREST query builder pattern
const { data, error } = await this.supabase
  .from('elections')
  .select(`
    *,
    election_constituency_groups(constituency_group_id)
  `)
  .order('sort_order');
if (error) throw new Error(`getElectionData: ${error.message}`);
// data is typed as Array<Database['public']['Tables']['elections']['Row'] & {...}>
```

### localizeRow Helper Pattern
```typescript
// NEW utility: localizeRow.ts
import { getLocalized } from './getLocalized';

/**
 * Localize specified fields in a row using getLocalized.
 * Supports dot-notation for nested JSONB fields.
 */
export function localizeRow(
  row: Record<string, unknown>,
  fields: string[],
  locale: string,
  defaultLocale: string = 'en'
): Record<string, unknown> {
  const result = { ...row };
  for (const field of fields) {
    if (field.includes('.')) {
      // Handle nested paths like 'custom_data.fillingInfo'
      const parts = field.split('.');
      let target = result;
      for (let i = 0; i < parts.length - 1; i++) {
        if (target[parts[i]] && typeof target[parts[i]] === 'object') {
          target[parts[i]] = { ...(target[parts[i]] as Record<string, unknown>) };
          target = target[parts[i]] as Record<string, unknown>;
        } else {
          target = null as any;
          break;
        }
      }
      if (target) {
        const lastKey = parts[parts.length - 1];
        target[lastKey] = getLocalized(
          target[lastKey] as Record<string, string> | null,
          locale, defaultLocale
        );
      }
    } else {
      result[field] = getLocalized(
        result[field] as Record<string, string> | null,
        locale, defaultLocale
      );
    }
  }
  return result;
}
```

### storageUrl Helper Pattern
```typescript
// NEW utility: storageUrl.ts
import type { Image } from '@openvaa/data';

interface StoredImage {
  path: string;
  pathDark?: string;
  alt?: string;
  width?: number;
  height?: number;
  focalPoint?: { x: number; y: number };
}

/**
 * Convert a Supabase StoredImage to a frontend Image with absolute URLs.
 * Returns undefined if the input is null/undefined or has no path.
 */
export function parseStoredImage(
  stored: StoredImage | null | undefined,
  supabaseUrl: string
): Image | undefined {
  if (!stored?.path) return undefined;
  const toUrl = (p: string) =>
    `${supabaseUrl}/storage/v1/object/public/public-assets/${p}`;
  return {
    url: toUrl(stored.path),
    urlDark: stored.pathDark ? toUrl(stored.pathDark) : undefined,
    alt: stored.alt
  };
}
```

### toDataObject Helper Pattern
```typescript
// NEW utility: toDataObject.ts
import { mapRow } from './mapRow';
import { localizeRow } from './localizeRow';

const STANDARD_LOCALIZED_FIELDS = ['name', 'short_name', 'info'];

/**
 * Transform a Supabase row into a partial DataObject:
 * 1. Localize specified fields (standard + additional)
 * 2. Map column names from snake_case to camelCase
 * Returns the mapped, localized row as Record<string, unknown>.
 */
export function toDataObject(
  row: Record<string, unknown>,
  locale: string,
  defaultLocale: string = 'en',
  additionalLocalizedFields: string[] = []
): Record<string, unknown> {
  const localized = localizeRow(
    row,
    [...STANDARD_LOCALIZED_FIELDS, ...additionalLocalizedFields],
    locale,
    defaultLocale
  );
  return mapRow(localized);
}
```

### Mock Supabase Client Pattern for Tests
```typescript
// Source: frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts
vi.mock('$env/dynamic/public', () => ({
  env: {
    PUBLIC_SUPABASE_URL: 'http://localhost:54321',
    PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key'
  }
}));

function createMockSupabaseClient() {
  const selectMock = vi.fn().mockReturnThis();
  const eqMock = vi.fn().mockReturnThis();
  const orderMock = vi.fn().mockResolvedValue({ data: [], error: null });
  return {
    from: vi.fn().mockReturnValue({
      select: selectMock,
      eq: eqMock,
      order: orderMock
    }),
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    storage: {
      from: vi.fn().mockReturnValue({
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'http://example.com/img.jpg' } })
      })
    }
  };
}
```

### Nominations RPC Design (SQL)
```sql
-- NEW: get_nominations RPC
-- Returns flat rows: each nomination row includes entity columns
-- Client-side deduplication extracts unique entities
CREATE OR REPLACE FUNCTION get_nominations(
  p_election_id uuid DEFAULT NULL,
  p_constituency_id uuid DEFAULT NULL,
  p_include_unconfirmed boolean DEFAULT false
)
RETURNS TABLE (
  -- Nomination columns
  id uuid,
  name jsonb,
  short_name jsonb,
  info jsonb,
  color jsonb,
  image jsonb,
  sort_order integer,
  subtype text,
  custom_data jsonb,
  entity_type entity_type,
  candidate_id uuid,
  organization_id uuid,
  faction_id uuid,
  alliance_id uuid,
  election_id uuid,
  constituency_id uuid,
  election_round integer,
  election_symbol text,
  parent_nomination_id uuid,
  -- Entity columns (prefixed to avoid name collision)
  entity_id uuid,
  entity_name jsonb,
  entity_short_name jsonb,
  entity_info jsonb,
  entity_color jsonb,
  entity_image jsonb,
  entity_sort_order integer,
  entity_subtype text,
  entity_custom_data jsonb,
  entity_answers jsonb,
  -- Candidate-specific entity columns
  entity_first_name text,
  entity_last_name text,
  entity_organization_id uuid
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT
    n.id, n.name, n.short_name, n.info, n.color, n.image,
    n.sort_order, n.subtype, n.custom_data,
    n.entity_type,
    n.candidate_id, n.organization_id, n.faction_id, n.alliance_id,
    n.election_id, n.constituency_id, n.election_round, n.election_symbol,
    n.parent_nomination_id,
    -- Entity id (whichever FK is set)
    COALESCE(n.candidate_id, n.organization_id, n.faction_id, n.alliance_id) AS entity_id,
    -- Entity common columns via COALESCE across all 4 tables
    COALESCE(c.name, o.name, f.name, a.name) AS entity_name,
    COALESCE(c.short_name, o.short_name, f.short_name, a.short_name) AS entity_short_name,
    COALESCE(c.info, o.info, f.info, a.info) AS entity_info,
    COALESCE(c.color, o.color, f.color, a.color) AS entity_color,
    COALESCE(c.image, o.image, f.image, a.image) AS entity_image,
    COALESCE(c.sort_order, o.sort_order, f.sort_order, a.sort_order) AS entity_sort_order,
    COALESCE(c.subtype, o.subtype, f.subtype, a.subtype) AS entity_subtype,
    COALESCE(c.custom_data, o.custom_data, f.custom_data, a.custom_data) AS entity_custom_data,
    COALESCE(c.answers, o.answers) AS entity_answers,
    -- Candidate-specific
    c.first_name AS entity_first_name,
    c.last_name AS entity_last_name,
    c.organization_id AS entity_organization_id
  FROM nominations n
  LEFT JOIN candidates c ON n.candidate_id = c.id
  LEFT JOIN organizations o ON n.organization_id = o.id
  LEFT JOIN factions f ON n.faction_id = f.id
  LEFT JOIN alliances a ON n.alliance_id = a.id
  WHERE (p_election_id IS NULL OR n.election_id = p_election_id)
    AND (p_constituency_id IS NULL OR n.constituency_id = p_constituency_id)
    AND (p_include_unconfirmed OR NOT COALESCE(n.unconfirmed, false))
  ORDER BY n.sort_order NULLS LAST, n.id;
$$;

GRANT EXECUTE ON FUNCTION get_nominations(uuid, uuid, boolean) TO anon, authenticated;
```

## State of the Art

| Old Approach (Strapi) | Current Approach (Supabase) | When Changed | Impact |
|----------------------|----------------------------|--------------|--------|
| `formatId(documentId)` normalization | UUIDs pass through as-is | Phase 25 decision | No id normalization needed |
| `parseBasics()` + `parseCandidate()` separate helpers | `toDataObject()` + per-method type additions | Phase 25 decision | Simpler, less code duplication |
| Separate alliances API + nominations API | Single `get_nominations` RPC | Phase 25 decision | One round trip instead of two |
| Image URLs from Strapi upload path | Storage paths converted via `storageUrl()` | Phase 25 (new schema) | Different URL construction |
| `apiGet()` wrapper around fetch | Direct PostgREST query builder | Phase 23 decision | No wrapper needed |
| `populate` params for nested relations | PostgREST embedded resources or RPC joins | Schema difference | Simpler query syntax |

**Deprecated/outdated:**
- `formatId()`: Was Strapi-specific, not needed for Supabase UUIDs
- `parseBasics()`, `parseCandidate()`, `parseOrganization()`, `parseImage()`: Strapi-specific transformers
- `buildFilterParams()`, `makeRule()`: Strapi query filter builders

## Open Questions

1. **Answers localization in getNominationData**
   - What we know: `parseAnswers()` from `$lib/api/utils/parseAnswers.ts` handles answer localization and is shared between adapters. The RPC returns `entity_answers` as raw JSONB.
   - What's unclear: Whether the RPC should also return entity answers or whether entities from nominations should be enriched separately.
   - Recommendation: Include answers in the RPC entity columns (already in the design). Apply `parseAnswers()` client-side during entity deduplication.

2. **DPDataType extension for tree formats**
   - What we know: `DataRoot.provideEntityData()` and `DataRoot.provideNominationData()` already accept both array and tree formats. The `DPDataType` currently only defines array format.
   - What's unclear: Whether the Supabase adapter should return tree format (more efficient for DataRoot) or array format (simpler transformation).
   - Recommendation: Return flat array format (simpler). The tree format acceptance in DPDataType is for future use. Extending the type is still worth doing for completeness.

3. **Question `choices` localization depth**
   - What we know: The `choices` JSONB column stores an array of objects where `label` is a `LocalizedString`. The `settings` JSONB may also contain localized content.
   - What's unclear: Exactly which fields inside `choices` and `settings` need localization.
   - Recommendation: Localize `choices[*].label` for all choice-type questions. Pass `settings` through as-is (it contains non-localized configuration like min/max values).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (already configured) |
| Config file | `frontend/vitest.config.ts` |
| Quick run command | `cd frontend && yarn test:unit --run` |
| Full suite command | `yarn test:unit` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| READ-01 | getAppSettings returns DynamicSettings from app_settings.settings | unit | `cd frontend && npx vitest run src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts -t "getAppSettings"` | Wave 0 |
| READ-01 | getAppCustomization returns AppCustomization with localized strings and image URLs | unit | `cd frontend && npx vitest run src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts -t "getAppCustomization"` | Wave 0 |
| READ-02 | getElectionData returns elections with constituencyGroupIds | unit | `cd frontend && npx vitest run src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts -t "getElectionData"` | Wave 0 |
| READ-03 | getConstituencyData returns groups and constituencies with parent relationships | unit | `cd frontend && npx vitest run src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts -t "getConstituencyData"` | Wave 0 |
| READ-04 | getNominationData returns nominations and deduplicated entities | unit | `cd frontend && npx vitest run src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts -t "getNominationData"` | Wave 0 |
| READ-05 | getEntityData returns candidates and organizations with answers | unit | `cd frontend && npx vitest run src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts -t "getEntityData"` | Wave 0 |
| READ-06 | getQuestionData returns categories and questions with types and choices | unit | `cd frontend && npx vitest run src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts -t "getQuestionData"` | Wave 0 |
| UTIL | localizeRow correctly localizes top-level and nested dot-notation fields | unit | `cd frontend && npx vitest run src/lib/api/adapters/supabase/utils/localizeRow.test.ts` | Wave 0 |
| UTIL | toDataObject combines mapRow + localizeRow for common fields | unit | `cd frontend && npx vitest run src/lib/api/adapters/supabase/utils/toDataObject.test.ts` | Wave 0 |
| UTIL | storageUrl converts storage paths to public URLs | unit | `cd frontend && npx vitest run src/lib/api/adapters/supabase/utils/storageUrl.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd frontend && npx vitest run src/lib/api/adapters/supabase/ --reporter=verbose`
- **Per wave merge:** `yarn test:unit`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts` -- covers READ-01 through READ-06
- [ ] `frontend/src/lib/api/adapters/supabase/utils/localizeRow.test.ts` -- covers localizeRow utility
- [ ] `frontend/src/lib/api/adapters/supabase/utils/toDataObject.test.ts` -- covers toDataObject utility
- [ ] `frontend/src/lib/api/adapters/supabase/utils/storageUrl.test.ts` -- covers storageUrl utility

## Field Mapping Reference

### Elections: DB -> ElectionData
| DB Column | TS Property | Transform |
|-----------|-------------|-----------|
| `id` | `id` | pass-through |
| `name` | `name` | `getLocalized()` (required) |
| `short_name` | `shortName` | `getLocalized()` |
| `info` | `info` | `getLocalized()` |
| `sort_order` | `order` | `mapRow()` renames |
| `color` | `color` | pass-through (already Colors shape) |
| `image` | `image` | `parseStoredImage()` |
| `custom_data` | `customData` | `mapRow()` renames |
| `subtype` | `subtype` | pass-through |
| `election_date` | `date` | map to string (ElectionData uses `date` not `electionDate`) |
| `election_type` | `subtype` | map (ElectionData uses `subtype` for election type) |
| `multiple_rounds` | `multipleRounds` | `mapRow()` renames |
| `current_round` | `round` | manual rename (ElectionData uses `round` not `currentRound`) |
| `election_constituency_groups` | `constituencyGroupIds` | extract `.constituency_group_id` from join rows |

### Constituencies: DB -> ConstituencyData
| DB Column | TS Property | Transform |
|-----------|-------------|-----------|
| `id` | `id` | pass-through |
| `name` | `name` | `getLocalized()` (required) |
| `short_name` | `shortName` | `getLocalized()` |
| `info` | `info` | `getLocalized()` |
| `sort_order` | `order` | `mapRow()` renames |
| `color` | `color` | pass-through |
| `image` | `image` | `parseStoredImage()` |
| `custom_data` | `customData` | `mapRow()` renames |
| `keywords` | `keywords` | `getLocalized()` then split by `,\s*` |
| `parent_id` | `parentId` | `mapRow()` renames |

### Constituency Groups: DB -> ConstituencyGroupData
| DB Column | TS Property | Transform |
|-----------|-------------|-----------|
| `id` | `id` | pass-through |
| Standard DataObject fields | ... | `toDataObject()` |
| `constituency_group_constituencies` | `constituencyIds` | extract `.constituency_id` from join rows |

### Candidates: DB -> CandidateData
| DB Column | TS Property | Transform |
|-----------|-------------|-----------|
| `id` | `id` | pass-through |
| Standard DataObject fields | ... | `toDataObject()` |
| `first_name` | `firstName` | `mapRow()` renames |
| `last_name` | `lastName` | `mapRow()` renames |
| `organization_id` | `organizationId` | `mapRow()` renames |
| `image` | `image` | `parseStoredImage()` |
| `answers` | `answers` | `parseAnswers()` for localization |
| (hardcoded) | `type` | `ENTITY_TYPE.Candidate` |

### Organizations: DB -> OrganizationData
| DB Column | TS Property | Transform |
|-----------|-------------|-----------|
| `id` | `id` | pass-through |
| Standard DataObject fields | ... | `toDataObject()` |
| `name` | `name` | `getLocalized()` (required) |
| `image` | `image` | `parseStoredImage()` |
| `answers` | `answers` | `parseAnswers()` for localization |
| (hardcoded) | `type` | `ENTITY_TYPE.Organization` |

### Questions: DB -> AnyQuestionVariantData
| DB Column | TS Property | Transform |
|-----------|-------------|-----------|
| `id` | `id` | pass-through |
| Standard DataObject fields | ... | `toDataObject()` |
| `type` | `type` | pass-through (enum matches) |
| `category_id` | `categoryId` | `mapRow()` renames |
| `choices` | `choices` | localize each `label` field |
| `settings` | (merged into customData) | pass-through |
| `election_ids` | `electionIds` | pass-through (JSONB array) |
| `election_rounds` | `electionRounds` | `mapRow()` renames |
| `constituency_ids` | `constituencyIds` | `mapRow()` renames |
| `entity_type` | `entityType` | `mapRow()` renames |
| `allow_open` | `allowOpen` | `mapRow()` renames (into customData) |
| `required` | (merged into customData) | pass-through |

### Question Categories: DB -> QuestionCategoryData
| DB Column | TS Property | Transform |
|-----------|-------------|-----------|
| `id` | `id` | pass-through |
| Standard DataObject fields | ... | `toDataObject()` |
| `category_type` | `type` | manual rename (QuestionCategoryData uses `type` not `categoryType`) |
| `election_ids` | `electionIds` | pass-through (JSONB array) |
| `election_rounds` | `electionRounds` | `mapRow()` renames |
| `constituency_ids` | `constituencyIds` | `mapRow()` renames |
| `entity_type` | `entityType` | `mapRow()` renames |

### Nominations: DB -> AnyNominationVariantPublicData
| DB Column | TS Property | Transform |
|-----------|-------------|-----------|
| `id` | `id` | pass-through |
| Standard DataObject fields | ... | `toDataObject()` |
| `entity_type` | `entityType` | pass-through (generated column) |
| `COALESCE(candidate_id, org_id, ...)` | `entityId` | computed from whichever FK is set |
| `election_id` | `electionId` | `mapRow()` renames |
| `constituency_id` | `constituencyId` | `mapRow()` renames |
| `election_round` | `electionRound` | `mapRow()` renames |
| `election_symbol` | `electionSymbol` | `mapRow()` renames |
| `parent_nomination_id` | `parentNominationId` | `mapRow()` renames |

## Sources

### Primary (HIGH confidence)
- Codebase: `frontend/src/lib/api/base/dataProvider.type.ts` -- DataProvider interface (7 methods)
- Codebase: `frontend/src/lib/api/base/dataTypes.ts` -- DPDataType return types
- Codebase: `frontend/src/lib/api/base/universalDataProvider.ts` -- Base class with ensureColors
- Codebase: `frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts` -- Mixin providing `this.supabase` and `this.locale`
- Codebase: `frontend/src/lib/api/adapters/supabase/utils/mapRow.ts` -- Row mapping utility
- Codebase: `frontend/src/lib/api/adapters/supabase/utils/getLocalized.ts` -- JSONB locale extraction
- Codebase: `packages/supabase-types/src/column-map.ts` -- 30+ column mappings
- Codebase: `apps/supabase/supabase/schema/002-007` -- All table schemas
- Codebase: `packages/data/src/objects/` -- All data type definitions
- Codebase: `.claude/skills/database/SKILL.md` -- Database schema conventions
- Codebase: `.claude/skills/data/SKILL.md` -- Data package conventions

### Secondary (MEDIUM confidence)
- [Supabase JS getPublicUrl](https://supabase.com/docs/reference/javascript/storage-from-getpublicurl) -- Storage URL construction

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed and used in prior phases
- Architecture: HIGH - patterns established in Phase 23, data types defined in @openvaa/data
- Field mapping: HIGH - verified by reading both DB schema and TypeScript types directly
- Pitfalls: HIGH - identified by comparing Strapi adapter patterns with Supabase schema differences
- Nomination RPC: MEDIUM - SQL design is sound but untested; exact performance characteristics unknown

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable domain, no external dependencies changing)
