# Skill Boundaries

This document maps every file path and concept domain to exactly one primary skill owner. When multiple skills could apply, the primary owner provides the authoritative guidance. Secondary skills may reference the concept briefly but defer to the primary owner for details.

Some ownership is real but belongs to no skill. Those rows name `CLAUDE.md` in the owner column, in the shape `(none - CLAUDE.md)`, and the Notes column names the section that answers them. The marker is not a gap: it is where the answer actually lives.

## Directory Ownership

| Directory                                     | Primary Skill        | Notes                                                                                              |
| --------------------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------- |
| `packages/data/`                              | data                 | All source, tests, types for @openvaa/data                                                          |
| `packages/matching/`                          | matching             | All source, tests, types for @openvaa/matching                                                      |
| `packages/filters/`                           | filters              | All source, tests, types for @openvaa/filters                                                       |
| `packages/core/`                              | data                 | Primary owner; matching and filters reference core interfaces                                       |
| `apps/supabase/`                              | database             | Schema, migrations, RLS, Edge Functions, pgTAP tests                                                |
| `packages/supabase-types/`                    | database             | Generated types, COLUMN_MAP, PROPERTY_MAP                                                           |
| `apps/frontend/`                              | (none - CLAUDE.md)   | Routing, the API layer and the data adapters: `CLAUDE.md` § _Architecture_ and § _Frontend (SvelteKit)_ |
| `apps/frontend/src/lib/components/`           | components           | Base UI component library                                                                           |
| `apps/frontend/src/lib/dynamic-components/`   | components           | Data-aware composed components                                                                      |
| `apps/frontend/src/lib/candidate/components/` | components           | Candidate-app-specific components                                                                   |
| `apps/frontend/src/lib/contexts/`             | components           | How a component reads a context, and the reactivity rules that govern it                            |
| `packages/app-shared/`                        | (none - CLAUDE.md)   | Cross-cutting settings and shared types: `CLAUDE.md` § _Settings Architecture_                       |
| `packages/llm/`                               | (none)               | No LLM skill stub per context decision                                                              |

**Process skills own no source directory.** `ship-review-stack` is the first of these: it owns a
_procedure_ (restructuring commit history into a reviewable PR stack) rather than a subsystem, so it
claims no row above and never contradicts a directory owner. Where the two meet -- a sweep fix inside
`packages/data/`, say -- the **directory owner is authoritative on the change** and `ship-review-stack`
is authoritative only on how the change is sliced, committed and proved.

**The retired Strapi backend's row was removed, not repointed.** That subsystem is gone from the
tree -- Supabase is the only backend, and `apps/supabase/` is owned by `database` above -- so there
was no directory left for the row to name. It was deleted together with its "see CLAUDE.md legacy
note" reference, which named a note that no longer exists either. The removal is recorded here so a
reader does not conclude the map merely forgot the subsystem.

## Concept Domains

| Concept                                                                                   | Primary Skill      | Also Referenced By                                       |
| ------------------------------------------------------------------------------------------ | ------------------ | -------------------------------------------------------- |
| DataRoot hierarchy                                                                        | data               | --                                                       |
| DataObject / entity variants                                                              | data               | filters (filtered entities), matching (matched entities) |
| Question types and normalizedDimensions                                                   | data               | matching (MatchableQuestion interface)                   |
| MISSING_VALUE conventions                                                                 | data               | matching (imputation), filters (missing value handling)  |
| Smart default values                                                                      | data               | --                                                       |
| internal.ts barrel pattern                                                                | data               | --                                                       |
| Nomination system                                                                         | data               | --                                                       |
| MatchingAlgorithm class                                                                   | matching           | --                                                       |
| MatchingSpace and dimensions                                                              | matching           | --                                                       |
| Distance metrics (Manhattan, Euclidean, directional)                                      | matching           | --                                                       |
| CategoricalQuestion subdimensions                                                         | matching           | data (normalizedDimensions property)                     |
| Match / SubMatch result objects                                                           | matching           | --                                                       |
| Missing value imputation                                                                  | matching           | data (MISSING_VALUE definition)                          |
| Filter base class and hierarchy                                                           | filters            | --                                                       |
| FilterGroup composition                                                                   | filters            | --                                                       |
| Rules system                                                                              | filters            | --                                                       |
| Entity filtering by answers                                                               | filters            | data (entity/answer types)                               |
| PostgreSQL schema conventions                                                             | database           | --                                                       |
| Row Level Security policies                                                               | database           | --                                                       |
| JWT claims and Access Token Hook                                                          | database           | --                                                       |
| Edge Functions                                                                            | database           | --                                                       |
| pgTAP test patterns                                                                       | database           | --                                                       |
| get_localized() and JSONB localization                                                    | database           | data (LocalizedValue type)                               |
| COLUMN_MAP / PROPERTY_MAP                                                                 | database           | --                                                       |
| Monorepo structure and dependency flow                                                    | (none - CLAUDE.md) | § _Architecture_ answers it directly                     |
| Frontend routing                                                                          | (none - CLAUDE.md) | § _Frontend (SvelteKit)_ answers it directly             |
| Data adapter pattern                                                                      | (none - CLAUDE.md) | § _Architecture_ answers it directly                     |
| Settings architecture (Static/Dynamic)                                                    | (none - CLAUDE.md) | § _Architecture_ answers it directly                     |
| Component library patterns                                                                | components         | --                                                       |
| Tailwind/DaisyUI styling                                                                  | components         | --                                                       |
| WCAG 2.1 AA accessibility                                                                 | components         | --                                                       |
| Runes-era component conventions (`$props()` typed by a co-located type file, `$state` / `$derived`, snippets rendered with `{@render}`) | components | -- |
| Context reactivity rules (the destructure trap; the `dataRoot` `#version`-bridge carve-out) | components         | --                                                       |
| Commit-history restructure into a reviewable PR stack                                     | ship-review-stack  | --                                                       |
| Path-partitioned slice construction (index-level tree surgery)                            | ship-review-stack  | --                                                       |
| Byte-identity proof of a reconstructed history                                            | ship-review-stack  | --                                                       |
| Commit taxonomy and `[db]`-tag conformance                                                | ship-review-stack  | database (what counts as a database change)              |
| Comment-hygiene sweep (codemod + residue pass)                                            | ship-review-stack  | --                                                       |
| Per-slice code-review-checklist disposition                                               | ship-review-stack  | each directory owner (the verdict on its own files)      |

## Gray Zones

| Area                                                                                      | Contenders                             | Primary Owner       | Resolution                                                                                                                |
| ----------------------------------------------------------------------------------------- | -------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `@openvaa/core` interfaces (Id, MISSING_VALUE, MatchableQuestion, HasAnswers, COORDINATE) | data, matching, filters                | data                | Core defines interfaces consumed by all; data owns because it implements the primary types                                |
| MatchableQuestion interface                                                               | data, matching                         | data                | Implemented by question classes in data; matching consumes it                                                             |
| Entity filtering by answers                                                               | data, filters                          | filters             | Filters own the filtering logic; data owns the entity/answer types                                                        |
| CategoricalQuestion subdimensions                                                         | data, matching                         | matching            | Matching owns the mathematical model; data defines normalizedDimensions property                                          |
| MISSING_VALUE usage in filters                                                            | data, filters                          | data                | data defines the constant and its semantics; filters follows the convention                                               |
| Frontend contexts (voterContext, candidateContext)                                        | components, `CLAUDE.md`                | components          | `CLAUDE.md` § _Architecture_ describes where contexts sit in the app; the components skill owns how one is read and the reactivity rules that govern the read |
| LocalizedValue / get_localized()                                                          | data, database                         | data                | data owns the TypeScript type; database owns the SQL function                                                             |
| `packages/app-shared/` settings                                                           | data, `CLAUDE.md`                      | (none - CLAUDE.md)  | Cross-cutting settings are architecture and are answered in `CLAUDE.md` § _Settings Architecture_; data model settings are secondary |
| A sweep fix inside a subsystem while cutting a review stack                               | ship-review-stack, the directory owner | the directory owner | ship-review-stack owns slicing, committing and proving; it never overrides a subsystem owner on what the change should be |
| Whether a commit needs a `[db]` tag                                                       | ship-review-stack, database            | ship-review-stack   | ship-review-stack owns the taxonomy rule and its gate; database owns which paths count as database changes                |
