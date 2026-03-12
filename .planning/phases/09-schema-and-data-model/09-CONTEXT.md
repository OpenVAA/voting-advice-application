# Phase 9: Schema and Data Model - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

All database tables modeled on @openvaa/data entities, with multi-tenant structure (accounts, projects, project_id on all content), localization strategy, both JSONB and relational answer storage alternatives (each with trigger validation), and QuestionTemplate added to @openvaa/data as a first-class DataObject. RLS policy creation, auth integration, and load testing are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Localization strategy
- JSONB columns for all localizable fields (same pattern as Strapi: `{"en": "...", "fi": "..."}`)
- A reusable SQL function `get_localized(jsonb, locale, default_locale)` handles fallback: requested locale → default locale → first available key
- Default locale is configured per project in app_settings (not hardcoded)
- Locale parameter set as a session variable per request; views/functions use it
- Voter-facing queries return resolved strings only (flat text, not JSONB)
- Candidate and admin apps sometimes need full JSONB — they query base tables directly (bypassing localized views)

### Answer storage — JSONB alternative
- Answers stored as a JSONB blob on candidate/organization records (same as current Strapi pattern: `Record<QuestionId, Answer>`)
- Trigger validation against question template's expected type and constraints (same validation as relational, for fair load test comparison)

### Answer storage — Relational alternative
- Separate `answers` table with one row per entity-question pair
- Single `value jsonb` column for the answer value (not typed columns)
- Columns: entity_id, entity_type, question_id, value (jsonb), open_answer (text), project_id
- Trigger function validates answer value against the question's template (answer type, valid choice IDs, etc.)
- Consider materialized or regular views for performant voter-facing bulk reads (pre-joining candidates + answers) — Claude evaluates whether this is needed during implementation/load testing

### QuestionTemplate design
- First-class DataObject in @openvaa/data (extends DataObject, lives in DataRoot collection)
- Based on existing QuestionType enum values (text, number, boolean, singleChoiceOrdinal, etc.)
- Defines: answer type, settings (type-specific config), default choices (e.g., Likert labels), info
- Primary use case: shared Likert definitions — define choices/labels once, reuse across many questions
- Questions have an optional templateId reference + can override template defaults
- Template is optional — questions can exist without one
- Corresponding `question_templates` table in the database

### Multi-tenant hierarchy
- `accounts` table representing organizations
- `projects` table linked to accounts (one account → many projects/VAA deployments)
- All content tables linked via `project_id` foreign key
- Users belong to accounts (account membership)
- Account admins have access to all projects in their account
- Project admins have project-level permissions (scoped to specific projects)
- Candidate and party users have project-level permissions only
- Single-tenant deployment: seed data auto-creates a default account + project
- User role/membership tables — Claude decides whether to create schema in Phase 9 or defer to Phase 10

### App settings
- One row per project with a single `settings jsonb` column containing the full settings object
- App layer parses/validates the settings structure

### Deferred tables
- Feedback and AdminJob tables deferred to Phase 12 (Services) — not core VAA entities

### Claude's Discretion
- Whether choices for choice-type questions use a separate table or JSONB on the question — pick based on how it interacts with trigger validation
- Whether voter-facing reads need a materialized view or if regular joins/views suffice — evaluate during implementation
- How to split user role/membership table creation between Phase 9 and Phase 10
- Exact column definitions and constraints for each table (derived from @openvaa/data types)
- Migration file organization (one big migration vs multiple topical migrations)

</decisions>

<specifics>
## Specific Ideas

- Both answer storage alternatives must get trigger validation so load tests isolate the storage format as the only variable
- The `get_localized` SQL function should use COALESCE pattern: `COALESCE(val->>locale, val->>default_locale, val->>first_key)`
- QuestionTemplate is primarily motivated by Likert questions — shared choice definitions across many opinion questions
- Strapi's `QuestionType` (name, settings, info) is the closest prior art for QuestionTemplate

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `@openvaa/data` entity model: Entity (Candidate, Organization, Faction, Alliance), Question (8 types), QuestionCategory, Election, Nomination, Constituency, ConstituencyGroup — all define the target table structure
- `@openvaa/data` LocalizedValue type with `__translations__` key — informs JSONB column format
- Strapi content types (15 entities in `backend/vaa-strapi/src/api/`) — reference for field mappings and relationships
- Strapi QuestionType content type (name, settings JSON, info) — template for QuestionTemplate design
- `@openvaa/data` Question type hierarchy and Choice interface — defines what QuestionTemplate defaults provide

### Established Patterns
- Strapi uses JSON fields for multilingual content — JSONB columns continue this pattern
- Strapi stores answers as JSON blob on candidate/party — JSONB alternative mirrors this
- @openvaa/data uses `Record<Id, Answer>` for answers where Answer has `value` and optional `info`
- snake_case in database, camelCase in TypeScript — type mapping layer needed (SCHM-01)
- Supabase timestamped migration files (from Phase 8 decision)

### Integration Points
- `apps/supabase/supabase/migrations/` — migration SQL files
- `apps/supabase/supabase/seed.sql` — seed data for default account/project/election/etc.
- `packages/supabase-types/` — type generation reflects new tables
- `packages/data/src/` — QuestionTemplate class added here
- `packages/data/src/objects/questions/base/questionTypes.ts` — existing QuestionType enum that templates reference

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-schema-and-data-model*
*Context gathered: 2026-03-12*
