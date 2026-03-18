# Phase 22: Schema Migrations - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Add missing schema objects that the frontend adapter depends on: app customization storage, feedback table, candidate terms-of-use tracking, and an atomic answer upsert RPC. All additions go into the existing Supabase schema with pgTAP tests and regenerated types.

</domain>

<decisions>
## Implementation Decisions

### Customization storage
- Add a `customization jsonb` column to the existing `app_settings` table (not a separate table)
- No DB-level validation on the customization JSONB — app layer handles parsing/validation
- Image references inside customization use the same format as image-type answer values (object with `path`, optional `pathDark`, `alt`, `width`, `height`)
- Existing app_settings RLS policies cover the new column automatically (anon SELECT, admin INSERT/UPDATE/DELETE)

### Feedback table
- New `feedback` table with columns: `id`, `project_id`, `rating` (integer, nullable), `description` (text, nullable), `date` (timestamptz), `url` (text, nullable), `user_agent` (text, nullable), `created_at`
- At least one of `rating` or `description` must be present (CHECK constraint)
- Anonymous insert-only: RLS allows INSERT for anon, SELECT/DELETE for admin only. No UPDATE policy
- DB-level rate limiting to prevent spam — Claude picks simplest effective approach (e.g., IP-based cooldown trigger or similar lightweight mechanism)

### Terms-of-use tracking
- Add `terms_of_use_accepted timestamptz` column to the `candidates` table (nullable, null = not yet accepted)
- Existing candidate RLS policies cover the column — candidates can update their own row

### Answer upsert RPC
- Single `upsert_answers(entity_id uuid, answers jsonb, overwrite boolean)` function
- `SECURITY INVOKER` — relies on existing RLS (candidates can update own rows), no extra auth check in the function body
- When `overwrite = false`: merges new answers into existing JSONB (`||` operator)
- When `overwrite = true`: replaces entire answers JSONB
- Returns the updated answers JSONB (not the full candidate row)
- Existing `validate_answers_jsonb()` trigger fires on the underlying UPDATE, so validation is automatic

### Migration strategy
- Append all additions to the existing `00001_initial_schema.sql` (pre-production, single consolidated migration)
- Also update/create schema source files: update `007-app-settings.sql`, `003-entities.sql`, `006-answers-jsonb.sql`; create new `018-feedback.sql`
- Include pgTAP tests for all new schema objects (table existence, column types, RLS policies, RPC behavior)
- Regenerate `@openvaa/supabase-types` after schema changes so new tables/columns are available in TypeScript immediately

### Claude's Discretion
- Exact rate limiting mechanism for feedback (IP-based cooldown, session fingerprint, or other lightweight approach)
- Whether the upsert RPC needs explicit `project_id` parameter or derives it from the candidate row
- pgTAP test file organization (new file vs extending existing test files)
- Exact CHECK constraint syntax for feedback (rating OR description required)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing schema
- `apps/supabase/supabase/migrations/00001_initial_schema.sql` — Current consolidated migration with all tables, RLS, functions, and triggers
- `apps/supabase/supabase/schema/007-app-settings.sql` — app_settings table definition (add customization column here)
- `apps/supabase/supabase/schema/003-entities.sql` — candidates/organizations table definitions (add terms_of_use_accepted here)
- `apps/supabase/supabase/schema/006-answers-jsonb.sql` — JSONB answer storage, validate_answers_jsonb() trigger (add upsert RPC here)
- `apps/supabase/supabase/schema/010-rls.sql` — RLS policy definitions (add feedback RLS here)

### Frontend adapter interfaces (what the schema must support)
- `frontend/src/lib/api/base/dataProvider.type.ts` — getAppCustomization interface
- `frontend/src/lib/api/base/dataWriter.type.ts` — updateAnswers/overwriteAnswers and updateEntityProperties (termsOfUseAccepted) interfaces
- `frontend/src/lib/api/base/feedbackWriter.type.ts` — postFeedback interface and FeedbackData type
- `frontend/src/lib/contexts/app/appCustomization.type.ts` — AppCustomization type definition

### Existing patterns
- `apps/supabase/supabase/tests/database/` — pgTAP test directory and conventions
- `packages/supabase-types/` — Type generation package

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `validate_answers_jsonb()` trigger: Already validates JSONB answers on candidates/organizations — the upsert RPC's UPDATE will trigger this automatically
- `update_updated_at()` trigger: Already on candidates and app_settings — auto-updates `updated_at` on writes
- `_bulk_upsert_record()`: Existing upsert helper for bulk import — reference for function patterns
- 204 existing pgTAP tests: Established patterns for testing RLS, table structure, and function behavior

### Established Patterns
- All content tables have `project_id` FK to `projects(id)` with ON DELETE CASCADE
- RLS policies follow naming: `{role}_{operation}_{table}` (e.g., `anon_select_app_settings`)
- JSONB columns use `DEFAULT '{}'::jsonb` for empty objects
- Schema source files numbered 000-017 in topical order
- Image data validated as object with required `path` string, optional `pathDark`/`alt`/`width`/`height`

### Integration Points
- `apps/supabase/supabase/migrations/00001_initial_schema.sql` — append new schema objects
- `apps/supabase/supabase/schema/` — update/create source files
- `apps/supabase/supabase/tests/database/` — add pgTAP tests
- `packages/supabase-types/` — regenerate after schema changes

</code_context>

<specifics>
## Specific Ideas

- Image references in customization should use the exact same format validated for image-type answer values — not a separate convention
- The answer upsert RPC should be simple enough that the existing trigger handles all validation (no duplicated logic)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 22-schema-migrations*
*Context gathered: 2026-03-18*
