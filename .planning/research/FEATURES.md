# Feature Landscape: Supabase Frontend Adapter

**Domain:** Frontend adapter migration from Strapi to Supabase (v3.0)
**Researched:** 2026-03-18
**Confidence:** HIGH (based on existing codebase analysis + official Supabase SSR docs)

## Table Stakes

Features users expect. Missing = product feels incomplete or adapter is non-functional.

### Data Reads (DataProvider)

| Feature | Why Expected | Complexity | Supabase Implementation | Notes |
|---------|--------------|------------|------------------------|-------|
| `getAppSettings` | Every page load needs dynamic settings | Low | `supabase.from('app_settings').select('settings').eq('project_id', projectId).single()` | Supabase stores settings as a JSONB blob in `app_settings.settings`. Strapi had deeply nested `populate` params; Supabase returns the blob directly. No parsing utilities needed -- just extract the `settings` field. |
| `getAppCustomization` | Voter/candidate app branding, translation overrides, FAQ | Medium | No dedicated `app_customization` table exists in Supabase schema. Must be stored within `app_settings.settings` JSONB or a new column/table needs to be added. | **Gap identified:** Strapi had a separate `app-customization` endpoint with images (publisherLogo, poster, etc.). The Supabase schema has no equivalent table. Options: (A) embed in `app_settings.settings`, (B) add `app_customizations` table, (C) add a `customization` JSONB column to `app_settings`. Recommend option (C) as it keeps the one-row-per-project pattern. Images would reference Storage paths. |
| `getElectionData` | Core data for VAA operation | Low | `supabase.from('elections').select('*, election_constituency_groups(constituency_group_id)').eq('project_id', projectId)` | Direct select with join table for constituency group IDs. JSONB `name`/`info` fields returned as-is; localization done client-side via `get_localized()` or JS `translate()`. |
| `getConstituencyData` | Constituency selection, filtering | Medium | Two queries: (1) `constituency_groups` with join to `constituency_group_constituencies`, (2) `constituencies` with `parent_id`. Or use a single query with nested selects. | Supabase join tables (`constituency_group_constituencies`, `election_constituency_groups`) replace Strapi's `populate` pattern. The PostgREST nested select syntax handles this: `constituency_groups(*, constituency_group_constituencies(constituency_id))`. |
| `getNominationData` | Lists candidates/parties per election+constituency | High | Complex query involving `nominations` table with FK-based entity type (candidate_id, organization_id, faction_id, alliance_id), plus joins to `candidates`, `organizations`, `alliances`, and `factions`. | **Most complex read.** Strapi required two parallel fetches (nominations + alliances); Supabase has a unified `nominations` table with `entity_type` as a generated column. The nomination hierarchy (parent_nomination_id) is stored directly. PostgREST can fetch related entities via FK relationships: `nominations(*, candidates(*), organizations(*), alliances(*))`. Consider an RPC function if the PostgREST query becomes unwieldy. |
| `getEntityData` | Candidate/organization profiles | Low-Med | `supabase.from('candidates').select('*').eq('project_id', projectId)` and/or `supabase.from('organizations').select('*')`. Filter by entity type parameter. | Simpler than Strapi -- no `documentId` indirection, no `termsOfUseAccepted` filter on the query side (handled by RLS `published` flag instead). Answers are a JSONB column directly on candidates/organizations. |
| `getQuestionData` | Questions and categories for the questionnaire | Medium | Two queries: (1) `question_categories` with election_ids/constituency_ids as JSONB arrays, (2) `questions` with `category_id` FK, `type` enum, `choices` JSONB. | Strapi stored question types in a separate `questionType` relation requiring `parseQuestionType()`; Supabase has `type` as an enum column and `choices`/`settings` as JSONB directly on the `questions` table. Eliminates ~3 parse utilities. The `election_ids` and `constituency_ids` are JSONB arrays rather than FK relations, simplifying the query. |

### Authentication (DataWriter)

| Feature | Why Expected | Complexity | Supabase Implementation | Notes |
|---------|--------------|------------|------------------------|-------|
| Login (email+password) | Candidate app access | Medium | `supabase.auth.signInWithPassword({ email, password })`. Session cookies set automatically by `@supabase/ssr`. | **Major auth model change.** Strapi returned a JWT token stored in a `token` cookie managed by the frontend. Supabase uses `@supabase/ssr` which manages `sb-<ref>-auth-token` cookies automatically. No explicit `authToken` passing needed for Supabase client calls -- the server client reads cookies from the request. The `WithAuth` pattern in `DataWriter` needs rethinking. |
| Logout | Session termination | Low | `supabase.auth.signOut()`. Cookie cleanup handled by `@supabase/ssr`. | Strapi logout was a no-op (just delete client cookie). Supabase actually invalidates the refresh token server-side. |
| Get basic user data | Display username, email, role in candidate app | Low | `supabase.auth.getUser()` returns user metadata. Roles are in JWT claims (`user_roles` array) injected by the Custom Access Token Hook. | No separate API call needed -- user data is in the session. Role extraction from JWT replaces Strapi's `populate: { role: 'true' }` pattern. |
| Password reset request | "Forgot password" flow | Low | `supabase.auth.resetPasswordForEmail(email, { redirectTo })`. GoTrue sends the email. | Supabase handles the entire flow including email sending. No custom endpoint needed. |
| Password reset (with code) | Complete reset after email link | Low | User lands on redirect URL with token; call `supabase.auth.updateUser({ password })` while the recovery session is active. | Different from Strapi which used a separate `code` parameter. Supabase uses a redirect-based recovery flow where the token is exchanged via the auth callback route. |
| Change password | Authenticated password change | Low | `supabase.auth.updateUser({ password: newPassword })`. Requires active session. | Supabase does not require `currentPassword` for `updateUser` -- the active session IS the proof of identity. This simplifies the interface but may require a UI-level confirmation step. |

### Candidate Data Operations (DataWriter)

| Feature | Why Expected | Complexity | Supabase Implementation | Notes |
|---------|--------------|------------|------------------------|-------|
| Get candidate user data | Candidate app profile, answers, nominations | Medium | Candidate record found via `auth_user_id`: `supabase.from('candidates').select('*, nominations(*)').eq('auth_user_id', userId).single()`. User data from `supabase.auth.getUser()`. | Strapi used `api/users/me` which returned the user with embedded candidate data. Supabase separates user (auth) from candidate (data table). The `auth_user_id` FK links them. |
| Update answers | Save questionnaire responses | Medium | `supabase.from('candidates').update({ answers: mergedAnswers }).eq('id', candidateId)`. JSONB merge done client-side or via `jsonb_set()` RPC. | **Key design decision:** Strapi had separate `update-answers` and `overwrite-answers` endpoints. Supabase stores answers as JSONB. For `updateAnswers` (merge), need to read-then-write or use an RPC with `jsonb_set`. For `overwriteAnswers`, direct `.update()` works. The schema TODO notes: "Add an RPC function for atomic single-answer upsert to prevent race conditions." |
| Update entity properties | Profile image, terms acceptance | Medium | Two-step: (1) upload image to Storage, (2) update candidate record with image JSONB path. `supabase.from('candidates').update({ image: { path: storagePath }, terms_of_use_accepted: value })` | Strapi had a combined upload+update flow. Supabase separates Storage upload from table update. The `image` column is JSONB with `{ path, pathDark?, alt?, width?, height?, focalPoint? }` structure. Old images are auto-cleaned by the `cleanup_old_image_file` trigger. |
| Overwrite answers | Replace all answers at once | Low | `supabase.from('candidates').update({ answers: newAnswers }).eq('id', candidateId)` | Direct JSONB column replacement. Validation trigger fires on the new values. |

### Registration Flow (DataWriter)

| Feature | Why Expected | Complexity | Supabase Implementation | Notes |
|---------|--------------|------------|------------------------|-------|
| Check registration key | Validate invite before registration | Medium | Supabase uses email invite links with GoTrue magic links, not registration keys. The `invite-candidate` Edge Function creates the user + sends invite email. | **Flow redesign needed.** Strapi had explicit `registrationKey` endpoints. Supabase uses GoTrue's `inviteUserByEmail` which sends a magic link. The candidate lands on a redirect URL, the auth callback exchanges the token for a session. No separate "check key" step -- the token IS the verification. |
| Register with password | Complete registration after invite | Medium | After clicking invite link, user lands on callback route. Exchange token for session, then call `supabase.auth.updateUser({ password })` to set their password. | The flow changes from "submit registrationKey + password" to "click invite link, exchange token, set password." The candidate record already exists (created by `invite-candidate` Edge Function). |
| Preregister with ID token (bank auth) | Finnish bank authentication flow | High | Call `signicat-callback` Edge Function with the OIDC id_token. Function creates user + candidate + role + returns magic link session data. Frontend exchanges magic link for session. | Already implemented as an Edge Function. Frontend integration requires: (1) redirect to Signicat, (2) receive callback, (3) POST id_token to Edge Function, (4) exchange action_link for session. |
| Preregister with API token | Admin-initiated candidate registration | Medium | Call `invite-candidate` Edge Function with admin auth header + candidate data. Function creates candidate + sends invite email. | Already implemented. Frontend needs to pass admin's Supabase auth token (from session) in the Authorization header. |

### File Operations

| Feature | Why Expected | Complexity | Supabase Implementation | Notes |
|---------|--------------|------------|------------------------|-------|
| Image upload (candidate photo) | Candidate profile photo | Medium | `supabase.storage.from('public-assets').upload(path, file, { upsert: true })`. Path format: `{project_id}/candidates/{candidate_id}/filename.ext`. Then update candidate record with image JSONB. | Storage path format is enforced by RLS policies. Candidates can only upload to their own folder. Old files auto-cleaned by triggers. Returns path for constructing public URL. |
| Image URL resolution | Display uploaded images | Low | `supabase.storage.from('public-assets').getPublicUrl(path)`. | Strapi prepended the backend URL to relative paths. Supabase Storage provides full public URLs directly. The `parseImage` utility needs replacement with Supabase URL construction. |

### Admin Operations (AdminWriter)

| Feature | Why Expected | Complexity | Supabase Implementation | Notes |
|---------|--------------|------------|------------------------|-------|
| Update question custom data | Admin editing question metadata | Low | `supabase.from('questions').update({ custom_data: newCustomData }).eq('id', questionId)` | Strapi had a custom `update-custom-data` endpoint. Supabase uses direct table update via PostgREST. RLS checks `can_access_project()` for admin role verification. |
| Insert job result | Save admin job execution results | Low | No `admin_jobs` table exists in Supabase schema. | **Gap identified:** Strapi had an `admin-jobs` content type. The Supabase schema does not include an admin jobs table. This is likely deferred to the admin app milestone (out of scope per PROJECT.md). The job management methods (`getActiveJobs`, `getPastJobs`, `startJob`, etc.) are implemented as universal API route handlers, not backend-specific. |

### Feedback

| Feature | Why Expected | Complexity | Supabase Implementation | Notes |
|---------|--------------|------------|------------------------|-------|
| Post feedback | User satisfaction tracking | Low | Needs a `feedback` table in Supabase (currently missing) or could use an Edge Function/external service. | **Gap identified:** Strapi had a `feedbacks` content type. Supabase schema does not include a feedback table. Simple to add: `CREATE TABLE feedback (id uuid PRIMARY KEY, project_id uuid REFERENCES projects(id), rating integer, description text, url text, user_agent text, date timestamptz, created_at timestamptz DEFAULT now())` with anon INSERT RLS policy. |

## Differentiators

Features the Supabase adapter enables that Strapi could not easily provide.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Direct PostgREST queries (no middleware) | Eliminates entire REST API layer. PostgREST auto-generates endpoints from Postgres schema. Fewer moving parts, lower latency. | N/A (architectural) | Strapi required custom controllers, routes, and a running Node.js server. Supabase client queries Postgres directly via PostgREST. |
| RLS-enforced data access | Security rules live in the database, not application code. Every query is automatically filtered by the user's role/project. | N/A (already built) | 79 RLS policies already cover all content tables. The adapter does not need to implement authorization logic -- it is handled by Supabase. |
| Session-based auth (no manual token management) | `@supabase/ssr` handles cookie lifecycle automatically. No `AUTH_TOKEN_KEY` cookie management, no explicit `authToken` passing. | Low | Eliminates the entire `WithAuth` pattern for Supabase calls. The session is in cookies, the Supabase client reads them automatically. |
| Type-safe queries via generated Database types | `@openvaa/supabase-types` provides `Database` type. `supabase.from('candidates').select('*')` returns typed rows. | N/A (already built) | Eliminates all 17 Strapi parse utilities. COLUMN_MAP + PROPERTY_MAP handle the snake_case-to-camelCase conversion. |
| JSONB localization at DB level | `get_localized()` function provides locale fallback chain (requested -> default -> any). Can be used in RPC functions for server-side localization. | Low | Strapi required client-side `translate()` for every field. Supabase can do it server-side via RPC or client-side -- the adapter has a choice. |
| Atomic answer validation | JSONB answer validation trigger checks answer types against question definitions. Invalid answers are rejected at DB level. | N/A (already built) | Strapi required custom middleware. Supabase trigger fires on INSERT/UPDATE, validates only changed keys (smart diffing). |
| Storage with path-based RLS | Candidates can only upload to their own folder. Admins to any project folder. Published entity check for public reads. | N/A (already built) | Eliminates need for custom upload authorization logic. |
| Automatic old file cleanup | Triggers delete old Storage files when image JSONB column changes or entity is deleted. | N/A (already built) | Strapi required manual file management. |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Strapi-compatible response parsing | The 17 parse utilities (`parseBasics`, `parseCandidate`, `parseNominations`, etc.) exist solely because Strapi returns deeply nested, denormalized response objects with `documentId` indirection. | Build thin mapping functions that use COLUMN_MAP/PROPERTY_MAP to convert snake_case rows to camelCase. Supabase returns flat rows matching the schema directly. |
| Manual JWT token management | Strapi auth required explicit `authToken` parameter threading through every DataWriter call. The `WithAuth` type, `AUTH_TOKEN_KEY` cookie, and `getUserData` helper exist for this pattern. | Use Supabase session from `@supabase/ssr`. The server client reads cookies automatically. The `WithAuth` pattern is unnecessary for Supabase adapter methods. |
| Dual-fetch nomination loading | Strapi required separate fetches for nominations and alliances because they were different content types. | Use the unified `nominations` table with `entity_type` generated column. A single query with FK joins retrieves all nomination types. |
| Custom population/expansion params | Strapi's `populate` parameter was central to every query (e.g., `populate: { candidate: { populate: { image: 'true', party: 'true' } } }`). | Use PostgREST `select()` syntax for column selection and FK traversal: `select('*, candidates(*), organizations(*)')`. |
| Separate question type table | Strapi had `questionTypes` as a separate content type with its own parsing logic. | Question `type` is an enum column directly on `questions` table. `choices` and `settings` are JSONB columns. No join needed. |
| Backend-mediated file uploads | Strapi uploads went through `api/upload` with the backend handling file storage. | Upload directly to Supabase Storage from the client/server. The path format and RLS policies enforce access control. |
| Registration key flow | Strapi's `checkRegistrationKey` + `registerCandidate` two-step flow. | Use GoTrue invite links. The `invite-candidate` Edge Function handles candidate creation and email sending. Registration becomes "click invite link + set password." |
| App customization via separate endpoint | Strapi's `app-customization` single type with deeply nested image relations. | Embed customization data in `app_settings.settings` JSONB (or a new `customization` column). Image references use Storage paths instead of Strapi media library relations. |

## Feature Dependencies

```
Supabase Client Setup (hooks.server.ts, browser.ts) [DONE]
  |
  +-> SupabaseDataProvider (reads)
  |     +-> getAppSettings (needed first for settings)
  |     +-> getElectionData
  |     +-> getConstituencyData
  |     +-> getNominationData (depends on election/constituency schema understanding)
  |     +-> getEntityData
  |     +-> getQuestionData
  |     +-> getAppCustomization (depends on schema decision for customization storage)
  |
  +-> SupabaseDataWriter (writes + auth)
  |     +-> login/logout (foundation for all authenticated operations)
  |     +-> getBasicUserData (needed by candidate app layout)
  |     +-> getCandidateUserData (depends on login)
  |     +-> updateAnswers / overwriteAnswers (depends on getCandidateUserData)
  |     +-> updateEntityProperties (depends on Storage upload)
  |     +-> setPassword / resetPassword (depends on login/session)
  |     +-> Registration flow (invite-candidate Edge Function integration)
  |     +-> Bank auth flow (signicat-callback Edge Function integration)
  |
  +-> SupabaseFeedbackWriter (anonymous writes)
  |     +-> postFeedback (depends on feedback table creation)
  |
  +-> SupabaseAdminWriter (admin operations)
        +-> updateQuestion (depends on admin auth)
        +-> insertJobResult (depends on admin_jobs table or deferral)
```

## Schema Gaps to Address Before Adapter Work

These gaps in the Supabase schema must be resolved before the corresponding adapter features can be implemented:

| Gap | Impact | Recommended Resolution | Complexity |
|-----|--------|----------------------|------------|
| No `app_customization` table or column | `getAppCustomization` has no data source | Add `customization` JSONB column to `app_settings` table. Store `publisherName`, image Storage paths, `translationOverrides`, `candidateAppFAQ` as JSONB. | Low (one ALTER TABLE + migration) |
| No `feedback` table | `postFeedback` has no target | Add `feedback` table with `project_id`, `rating`, `description`, `url`, `user_agent`, `date` columns. Anon INSERT policy needed. | Low (new table + RLS) |
| No `terms_of_use_accepted` column on candidates | `updateEntityProperties` sets this value | Add `terms_of_use_accepted` timestamptz column to `candidates` table. | Low (one ALTER TABLE) |
| No atomic answer upsert RPC | `updateAnswers` (merge) requires read-modify-write which is race-prone | Add `upsert_candidate_answer(candidate_id uuid, question_id uuid, answer jsonb)` RPC function using `jsonb_set` with implicit row lock. Schema TODO already notes this. | Medium (function + grant) |
| No admin_jobs table | `insertJobResult` has no target | Defer -- job management is handled by universal API route handlers (in-memory job store), not backend-specific. Admin app is out of scope per PROJECT.md. | N/A (defer) |
| `published` column filtering for voter reads | DataProvider reads need to respect `published = true` for anon/voter context | Already handled by RLS policies. Anon users see only `published = true` rows. No adapter logic needed. | N/A (already built) |

## MVP Recommendation

### Phase 1: DataProvider (read-only, no auth required)

Prioritize:
1. **getAppSettings** -- Simplest read, needed by every page, proves the adapter pattern works.
2. **getElectionData** -- Core VAA data, simple schema mapping.
3. **getConstituencyData** -- Slightly more complex (join table), validates FK traversal pattern.
4. **getQuestionData** -- Important for questionnaire, validates JSONB array handling.
5. **getEntityData** -- Candidate/org profiles, validates `published` filtering via RLS.
6. **getNominationData** -- Most complex read, do last in DataProvider phase.

Defer: **getAppCustomization** -- Requires schema migration first (customization column/table).

### Phase 2: Auth + DataWriter (core candidate app operations)

Prioritize:
1. **login/logout** -- Foundation for everything else. Proves `@supabase/ssr` cookie session flow works.
2. **getBasicUserData** -- Needed by candidate app layout.
3. **getCandidateUserData** -- Core candidate profile loading.
4. **updateAnswers/overwriteAnswers** -- Core candidate questionnaire interaction.
5. **updateEntityProperties** -- Image upload + terms acceptance.
6. **Password management** -- Reset flow, change password.

Defer: **Registration flows** -- Invite + bank auth are more complex, require Edge Function integration.

### Phase 3: Registration + Edge Functions

1. **invite-candidate integration** -- Admin invites candidate, links to registration.
2. **signicat-callback integration** -- Bank auth flow for Finnish elections.
3. **sendEmail integration** -- Admin transactional emails.

### Phase 4: Cleanup + Feedback

1. **Feedback table creation + SupabaseFeedbackWriter**
2. **App customization schema + getAppCustomization**
3. **Strapi adapter removal**

## Interface Adaptation Notes

### The `WithAuth` Pattern

The existing `DataWriter` interface requires `WithAuth` (`{ authToken: string }`) on nearly every method. For the Supabase adapter:

- **Server-side calls:** The Supabase server client already has the session from cookies. No `authToken` parameter needed. The adapter's `_login`, `_logout`, etc. methods can ignore the `authToken` param and use `event.locals.supabase` instead.
- **Client-side calls:** The browser Supabase client manages its own session. Again, no `authToken` needed.
- **Compatibility:** The abstract `UniversalDataWriter` interface mandates `WithAuth`. The Supabase adapter should accept it (for interface compliance) but not use it for Supabase calls. This avoids changing the interface contract while other adapters might still exist.

### The `init({ fetch })` Pattern

The `UniversalAdapter.init({ fetch })` pattern passes SvelteKit's `fetch` to the adapter. The Supabase adapter does not use raw `fetch` -- it uses the typed Supabase client. However:

- The Supabase server client is created in `hooks.server.ts` with cookie handlers tied to the request event.
- The adapter needs access to this per-request client, not a global one.
- **Recommendation:** Override `init()` to accept the Supabase client (from `event.locals.supabase`) instead of or in addition to `fetch`. Or create the adapter per-request in the server hook.

### Column Mapping

The `COLUMN_MAP` / `PROPERTY_MAP` from `@openvaa/supabase-types` provides the snake_case-to-camelCase mapping. A generic `mapRow<T>(row: DatabaseRow): T` utility can replace all 17 Strapi parse functions with a single ~20-line function that:
1. Iterates row keys
2. Maps via COLUMN_MAP
3. Handles special cases (JSONB `name`/`info` localization, `image` JSONB -> Image type)

## Sources

- Existing codebase analysis: `frontend/src/lib/api/` adapter interfaces and Strapi implementation
- Existing codebase: `apps/supabase/supabase/migrations/00001_initial_schema.sql` (schema, RLS, triggers, functions)
- Existing codebase: `packages/supabase-types/src/column-map.ts` (COLUMN_MAP/PROPERTY_MAP)
- Existing codebase: `frontend/src/hooks.server.ts`, `frontend/src/lib/supabase/` (existing Supabase client setup)
- [Setting up Server-Side Auth for SvelteKit | Supabase Docs](https://supabase.com/docs/guides/auth/server-side/sveltekit)
- [Creating a Supabase client for SSR | Supabase Docs](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Advanced SSR guide | Supabase Docs](https://supabase.com/docs/guides/auth/server-side/advanced-guide)
- [User sessions | Supabase Docs](https://supabase.com/docs/guides/auth/sessions)
- [Standard Uploads | Supabase Docs](https://supabase.com/docs/guides/storage/uploads/standard-uploads)
- [JavaScript: Upload a file | Supabase Docs](https://supabase.com/docs/reference/javascript/storage-from-upload)
- [RLS Performance and Best Practices | Supabase](https://github.com/orgs/supabase/discussions/14576)
- [PostgREST and RPC | Supabase Docs](https://supabase.com/docs/reference/javascript/v1/rpc)
