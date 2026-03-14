# Phase 12: Services - Context

**Gathered:** 2026-03-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Storage buckets with RLS, candidate/entity photo upload and serve, dev email via Mailpit, bulk admin import/delete via Postgres RPC functions, and transactional email via Edge Function. Frontend adapter, Strapi removal, and Admin App UI are separate milestones.

</domain>

<decisions>
## Implementation Decisions

### Storage bucket design
- Two buckets: `public-assets` (anon-readable) and `private-assets` (auth-required)
- Public bucket only serves files for published entities — unpublished entity files stay private until published
- Use Supabase Storage (not AWS S3) — RLS integration, no extra credentials, works locally out of the box
- Project-scoped paths: `{project_id}/{entity_type}/{entity_id}/filename.ext`
- Project-level public files (images, videos, PDFs) stored under `{project_id}/project/` path
- Permissive file types — trust project admins. Higher max size for videos (500MB)
- Write/delete permissions tied to the user and the entities (candidates/organizations) they control via user_roles
- DB trigger cleanup: when an entity is deleted, its storage files are automatically removed
- DB trigger on image column update: when an image JSONB column is updated, the old file is deleted from storage (prevents orphaned files on image replacement)

### Bulk import/delete operations
- `external_id` column added to all content tables — optional (nullable), unique when present
- Research whether `external_id` should be immutable once set (benefits of preventing accidental overwrites)
- ExternalId-based upsert: records matched by external_id for idempotent create-or-update
- Bulk delete supports both modes: (1) externalId prefix-based (delete all with matching prefix) and (2) explicit ID list
- ExternalId-based relationship resolution: import JSON expresses relationships as externalIds (e.g. `{candidate: "ext-cand-1"}`), RPC resolves to UUIDs internally
- All content tables supported: elections, constituencies, constituency_groups, candidates, organizations, factions, alliances, nominations, questions, question_categories, question_templates, app_settings
- Transactional guarantee: entire import/delete fully succeeds or fully rolls back
- Postgres RPC function (not Edge Function) — runs in-database for performance and atomicity

### Transactional email
- Generic email API — not candidate-specific, reusable for any notification scenario
- Frontend sends multilingual templates (all locales) + recipient userIds to Edge Function
- Server-side variable resolution via Postgres RPC: joins user_roles → entity tables → relationships to resolve template variables like `{{candidate.first_name}}` or `{{nomination.constituency.name}}`
- User's preferred locale stored in `auth.users.raw_user_meta_data` (Supabase Auth user metadata) — set during registration/onboarding
- Edge Function picks the correct locale template per recipient based on their preferred_locale
- Dry-run flag: same send endpoint with `dry_run=true` returns rendered content per recipient without sending — enables admin preview of messages before sending
- Dev: emails captured by Inbucket/Mailpit (already running on port 54324)
- Production: configurable SMTP/provider (not implemented in this phase, just the interface)

### Image metadata format
- Separate `StoredImage` type for database JSONB: `{path, pathDark?, alt?, width?, height?, focalPoint?: {x: 0-1, y: 0-1}}`
- Based on existing `Image` type in `@openvaa/data` but uses storage paths instead of URLs
- Frontend Supabase adapter maps `StoredImage` → `Image` (resolving paths to full Supabase Storage URLs)
- On-the-fly image transforms via Supabase URL parameters for different sizes (Pro plan in production; dev serves originals)
- No pre-generated format variants — source sets handled by transform API
- Focal point as relative coordinates (x: 0.0-1.0, y: 0.0-1.0) — maps to CSS `object-position`
- Image question answers use the same `StoredImage` format as entity image columns — consistent handling everywhere
- `validate_answer_value()` trigger updated to validate StoredImage structure for image-type questions

### Claude's Discretion
- Exact RLS policy SQL for storage buckets (read/write/delete per role)
- DB trigger implementation for storage cleanup (direct delete vs queue-based)
- RPC function internal structure (processing order, error handling, batch sizes)
- Edge Function email sending implementation (Deno SMTP client or fetch-based)
- How to handle the published flag transition (moving files between private/public buckets vs. RLS-only approach)
- StoredImage validation trigger details

</decisions>

<specifics>
## Specific Ideas

- When a candidate uploads a new image (e.g., portrait question answer), the old image should be automatically removed at the storage level — the DB trigger on image column update handles this
- File storage is not just for images — candidates may upload PDFs and other file types as answer values
- Project admins upload project-level public assets (images, videos, PDFs/documents)
- The email template variable resolution should support deep relationship paths like `{{nomination.constituency.name}}` — the Postgres RPC can efficiently join across these relationships
- The bulk import pattern should mirror Strapi's admin tools (collection-keyed JSON with externalId-based upsert) for familiarity, but with robust external_id as a first-class column rather than a Strapi-specific field
- Email preview (dry-run) allows admins to review rendered messages before sending

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `@openvaa/data` Image type (`packages/data/src/core/image.type.ts`): url, urlDark, alt, formats — reference for StoredImage design
- Strapi admin tools data service (`backend/vaa-strapi/src/plugins/openvaa-admin-tools/server/src/services/data.ts`): transactional import/delete with collection-keyed JSON — direct reference for RPC design
- Strapi admin tools email service (`backend/vaa-strapi/src/plugins/openvaa-admin-tools/server/src/services/email.ts`): candidate email with {LINK} placeholder — reference for template variable pattern
- `importableCollections.ts`: defines 12 importable collections with externalRelation configs — maps to RPC's supported tables + relationship resolution
- Existing Edge Functions: `invite-candidate` and `signicat-callback` — established patterns for Deno Edge Functions with auth
- `validate_answer_value()` in `000-functions.sql`: shared validation function, needs update for StoredImage format on image-type questions

### Established Patterns
- Declarative schema in `schema/` folder, concatenated to migrations (Phase 9)
- RLS policies reference JWT claims via `(SELECT auth.jwt())` pattern with 79 existing policies (Phase 10)
- user_roles table links auth users to entities with scoped roles (Phase 10)
- JSONB for localized content: `{"en": "...", "fi": "..."}` pattern (Phase 9)
- Supabase config.toml has Storage enabled, Inbucket on port 54324, no buckets configured yet
- Edge runtime policy: "oneshot" for monorepo stability (Phase 8)

### Integration Points
- `apps/supabase/supabase/config.toml`: bucket definitions to add under `[storage.buckets.*]`
- `apps/supabase/supabase/schema/`: new SQL files for storage policies, RPC functions, triggers
- `apps/supabase/supabase/functions/`: new Edge Function for transactional email
- `apps/supabase/supabase/schema/003-entities.sql`: existing `image jsonb` columns on all entity tables
- `apps/supabase/supabase/schema/000-functions.sql`: `validate_answer_value()` needs StoredImage validation for image questions
- `packages/supabase-types/`: type regeneration after schema changes (external_id columns, RPC function types)
- `apps/supabase/supabase/migrations/00001_initial_schema.sql`: regenerated after schema file additions

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 12-services*
*Context gathered: 2026-03-14*
