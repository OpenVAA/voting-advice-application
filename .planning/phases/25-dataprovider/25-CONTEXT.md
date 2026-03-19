# Phase 25: DataProvider - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement all read operations in SupabaseDataProvider so the voter app loads data from Supabase end-to-end without Strapi. This covers: getAppSettings, getAppCustomization, getElectionData, getConstituencyData, getNominationData, getEntityData, and getQuestionData. The existing stub methods (Phase 23) are replaced with real implementations. No write operations (Phase 26), no admin operations (Phase 27), no Edge Function integration (Phase 28).

</domain>

<decisions>
## Implementation Decisions

### Nomination query strategy
- Build an RPC function (`get_nominations`) that combines nominations with their associated entities in a single database round trip
- The RPC should be composable: able to return just nominations if needed, or nominations + entities together
- Nominations reference entities by `entityId`; entities are returned as a separate deduplicated set (not duplicated inside nomination rows)
- Claude's discretion on whether to use recursive CTE or flat rows with client-side nesting — optimize for minimal total processing across DB + client. Nesting depth is max 3 levels (alliance -> org -> candidate). Tests will validate correctness, so complexity/debuggability are secondary concerns
- Do NOT use Strapi's `parseNominations.ts` as a template — it's shaped by Strapi's messy data format (separate alliances table, populate-based relations). The Supabase schema is cleaner with `parent_nomination_id` and direct entity FKs

### DPDataType extension
- Extend `DPDataType['nominations']` to also accept `NominationVariantTree` (in addition to the existing flat array format), matching what `DataRoot.provideNominationData` already accepts
- Similarly, entities return type should support `EntityVariantTree` format if beneficial, since `DataRoot.provideEntityData` also accepts both formats
- The tree format maps naturally to the Supabase schema: `election_id`/`constituency_id` for grouping, `entity_type` generated column for entity categorization

### Localization handling
- Localize at fetch time (each DataProvider method accepts locale option, returns single-locale strings) — consistent with existing DataRoot types
- Create a `localizeRow()` helper that takes a row and a list of field paths to localize, calling `getLocalized()` on each
- `localizeRow()` supports nested dot-notation paths (e.g., `'custom_data.fillingInfo'`) to handle localized fields inside JSONB objects like custom_data
- Non-listed fields (answers JSONB, raw custom_data) pass through untouched

### Data transformation approach
- Create a shared `toDataObject()` helper that combines `mapRow()` + `localizeRow()` + common DataObject fields (id, name, shortName, info, order, customData) — reduces repetition across the 4+ entity types
- Per-method code adds type-specific fields on top (e.g., `type: ENTITY_TYPE.Candidate`, `firstName`, `lastName` for candidates)
- Pass Supabase UUIDs through as-is for `id` fields — no `formatId()` needed (that was Strapi-specific for documentId normalization)
- Image fields: Supabase stores Images with storage paths instead of absolute URLs. Create a utility to convert storage paths to absolute Supabase Storage URLs (using Supabase URL + bucket + path)

### App settings shape
- The `app_settings.settings` JSONB column stores data matching the `DynamicSettings` type structure — `getAppSettings()` returns it with minimal transformation (localization of notification fields that contain LocalizedString values)
- The `app_settings.customization` JSONB column mirrors the `AppCustomization` structure — adapter fetches it, converts storage paths to URLs for image fields (publisherLogo, poster, candPoster), and localizes string fields (publisherName, translationOverrides, candidateAppFAQ)

### Claude's Discretion
- Exact RPC SQL implementation (recursive CTE vs flat rows + client nesting) — optimize for minimal total processing
- Whether `toDataObject()` uses generic type parameters or returns `Record<string, unknown>`
- Test approach: unit tests for each DataProvider method, mocking Supabase client responses
- File organization within the supabase adapter's dataProvider directory
- How `localizeRow()` handles edge cases (missing nested paths, non-object values at nested paths)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### DataProvider interface and types
- `frontend/src/lib/api/base/dataProvider.type.ts` -- DataProvider interface with all 7 method signatures
- `frontend/src/lib/api/base/dataTypes.ts` -- DPDataType defining return types for each method (needs extension for tree formats)
- `frontend/src/lib/api/base/getDataOptions.type.ts` -- Options types for each getter method

### Existing Supabase adapter infrastructure
- `frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` -- Current stub class (Phase 23)
- `frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts` -- supabaseAdapterMixin providing Supabase client
- `frontend/src/lib/api/adapters/supabase/utils/mapRow.ts` -- mapRow/mapRowToDb/mapRows utilities
- `frontend/src/lib/api/adapters/supabase/utils/getLocalized.ts` -- getLocalized() with 3-tier fallback

### DataRoot accepted formats (tree vs array)
- `packages/data/src/objects/nominations/variants/variants.ts` -- NominationVariantTree type and parseNominationTree (lines 74-107)
- `packages/data/src/objects/entities/variants/variants.ts` -- EntityVariantTree type and parseEntityTree (lines 47-59)
- `packages/data/src/root/dataRoot.ts` -- provideNominationData (line 670) and provideEntityData (line 636) accept both formats

### Supabase database schema
- `apps/supabase/supabase/schema/005-nominations.sql` -- Nominations table with parent_nomination_id, 4 entity FK columns, generated entity_type
- `apps/supabase/supabase/schema/003-entities.sql` -- Candidates, organizations, factions, alliances tables with common columns
- `apps/supabase/supabase/schema/002-elections.sql` -- Elections and constituencies tables
- `apps/supabase/supabase/schema/004-questions.sql` -- Questions and question_categories tables
- `apps/supabase/supabase/schema/007-app-settings.sql` -- app_settings with settings JSONB and customization JSONB columns
- `apps/supabase/supabase/schema/006-answers-jsonb.sql` -- Answers as JSONB on candidates and organizations

### Column mapping
- `packages/supabase-types/src/column-map.ts` -- COLUMN_MAP and PROPERTY_MAP for snake_case/camelCase conversion

### App types
- `packages/app-shared/src/settings/dynamicSettings.type.ts` -- DynamicSettings type (settings JSONB must match this structure)
- `frontend/src/lib/contexts/app/appCustomization.type.ts` -- AppCustomization type with Image fields and localized strings

### Strapi adapter (reference only, NOT a template)
- `frontend/src/lib/api/adapters/strapi/dataProvider/strapiDataProvider.ts` -- Reference for what each method returns (but Supabase implementation should not mimic Strapi patterns)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `mapRow()` / `mapRows()` in supabase utils: snake_case to camelCase column renaming via COLUMN_MAP
- `getLocalized()` in supabase utils: 3-tier fallback locale extraction from JSONB
- `supabaseAdapterMixin`: provides typed Supabase client via `.supabase` property
- `COLUMN_MAP` / `PROPERTY_MAP` in `@openvaa/supabase-types`: 30+ bidirectional column name mappings
- `NominationVariantTree` / `EntityVariantTree`: existing tree types that DataRoot accepts, Supabase schema maps to naturally

### Established Patterns
- Phase 23 decision: Supabase adapter exposes client directly (no apiGet/apiPost wrappers) -- PostgREST query builder IS the abstraction
- Phase 23 decision: Localization is opt-in per field via getLocalized(), not automatic
- Phase 24 decision: Auth is cookie-based via adapter, no Supabase imports in routes
- All locales returned from DB, client-side extraction (v2.0 load testing decision)

### Integration Points
- `frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` -- Replace 7 stub methods with implementations
- `frontend/src/lib/api/base/dataTypes.ts` -- Extend DPDataType to accept tree formats
- `apps/supabase/supabase/` -- New RPC function for nominations (new migration file)
- `frontend/src/lib/api/adapters/supabase/utils/` -- New utilities: localizeRow(), toDataObject(), storageUrl()

</code_context>

<specifics>
## Specific Ideas

- The nomination RPC should be designed so that entities are not duplicated in the return value -- nominations reference entityId, entities come as a separate deduplicated set
- Storage path to URL conversion utility needed for all image fields across all entity types and customization
- The `toDataObject()` helper should handle the common DataObject fields (id, name, shortName, info, order, customData) that all entities and nominations share, reducing per-method boilerplate
- The `localizeRow()` helper with nested path support covers both top-level columns (name, short_name, info) and nested JSONB fields (custom_data.fillingInfo, notifications.candidateApp.title)

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 25-dataprovider*
*Context gathered: 2026-03-19*
