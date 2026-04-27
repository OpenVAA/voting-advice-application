# Skill Boundaries

This document maps every file path and concept domain to exactly one primary skill owner. When multiple skills could apply, the primary owner provides the authoritative guidance. Secondary skills may reference the concept briefly but defer to the primary owner for details.

## Directory Ownership

| Directory | Primary Skill | Notes |
|-----------|--------------|-------|
| `packages/data/` | data | All source, tests, types for @openvaa/data |
| `packages/matching/` | matching | All source, tests, types for @openvaa/matching |
| `packages/filters/` | filters | All source, tests, types for @openvaa/filters |
| `packages/core/` | data | Primary owner; matching and filters reference core interfaces |
| `apps/supabase/` | database | Schema, migrations, RLS, Edge Functions, pgTAP tests |
| `packages/supabase-types/` | database | Generated types, COLUMN_MAP, PROPERTY_MAP |
| `frontend/` | architect | Routing, contexts, API layer, data adapters (deferred) |
| `frontend/src/lib/components/` | components | Base UI component library (deferred) |
| `frontend/src/lib/dynamic-components/` | components | Data-aware composed components (deferred) |
| `frontend/src/lib/candidate/components/` | components | Candidate-app-specific components (deferred) |
| `packages/app-shared/` | architect | Cross-cutting settings, shared types (deferred) |
| `packages/llm/` | (none) | No LLM skill stub per context decision |
| `backend/vaa-strapi/` | (none - legacy) | Being sunset; see CLAUDE.md legacy note |

## Concept Domains

| Concept | Primary Skill | Also Referenced By |
|---------|--------------|-------------------|
| DataRoot hierarchy | data | -- |
| DataObject / entity variants | data | filters (filtered entities), matching (matched entities) |
| Question types and normalizedDimensions | data | matching (MatchableQuestion interface) |
| MISSING_VALUE conventions | data | matching (imputation), filters (missing value handling) |
| Smart default values | data | -- |
| internal.ts barrel pattern | data | -- |
| Nomination system | data | -- |
| MatchingAlgorithm class | matching | -- |
| MatchingSpace and dimensions | matching | -- |
| Distance metrics (Manhattan, Euclidean, directional) | matching | -- |
| CategoricalQuestion subdimensions | matching | data (normalizedDimensions property) |
| Match / SubMatch result objects | matching | -- |
| Missing value imputation | matching | data (MISSING_VALUE definition) |
| Filter base class and hierarchy | filters | -- |
| FilterGroup composition | filters | -- |
| Rules system | filters | -- |
| Entity filtering by answers | filters | data (entity/answer types) |
| PostgreSQL schema conventions | database | -- |
| Row Level Security policies | database | -- |
| JWT claims and Access Token Hook | database | -- |
| Edge Functions | database | -- |
| pgTAP test patterns | database | -- |
| get_localized() and JSONB localization | database | data (LocalizedValue type) |
| COLUMN_MAP / PROPERTY_MAP | database | -- |
| Monorepo structure and dependency flow | architect | -- |
| Frontend routing and contexts | architect | components (context consumption) |
| Data adapter pattern | architect | -- |
| Settings architecture (Static/Dynamic) | architect | -- |
| Component library patterns | components | -- |
| Tailwind/DaisyUI styling | components | -- |
| WCAG 2.1 AA accessibility | components | -- |
| Svelte 4 component conventions | components | -- |

## Gray Zones

| Area | Contenders | Primary Owner | Resolution |
|------|-----------|---------------|------------|
| `@openvaa/core` interfaces (Id, MISSING_VALUE, MatchableQuestion, HasAnswers, COORDINATE) | data, matching, filters | data | Core defines interfaces consumed by all; data owns because it implements the primary types |
| MatchableQuestion interface | data, matching | data | Implemented by question classes in data; matching consumes it |
| Entity filtering by answers | data, filters | filters | Filters own the filtering logic; data owns the entity/answer types |
| CategoricalQuestion subdimensions | data, matching | matching | Matching owns the mathematical model; data defines normalizedDimensions property |
| MISSING_VALUE usage in filters | data, filters | data | data defines the constant and its semantics; filters follows the convention |
| Frontend contexts (voterContext, candidateContext) | architect, components | architect | Contexts are architecture; components consume them via getter functions |
| LocalizedValue / get_localized() | data, database | data | data owns the TypeScript type; database owns the SQL function |
| `packages/app-shared/` settings | architect, data | architect | Cross-cutting settings are architecture; data model settings are secondary |
