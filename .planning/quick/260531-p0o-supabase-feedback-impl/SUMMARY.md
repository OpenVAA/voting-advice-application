---
quick_id: 260531-p0o
slug: supabase-feedback-impl
date: 2026-05-31
status: complete
commit: 8ae1b3d1a
---

# Summary: SupabaseFeedbackWriter._postFeedback

## Changes

- `apps/frontend/src/lib/api/adapters/supabase/feedbackWriter/supabaseFeedbackWriter.ts`: replaced the throwing stub with a real implementation.
  - Resolves `project_id` from `public.app_settings` (single-project deploy; anon SELECT already open per `anon_select_app_settings`).
  - Inserts `{ project_id, rating, description, date, url, user_agent }` into `public.feedback`.
  - Throws on either error; returns `{ type: 'success' }` on success (matches the deleted Strapi pattern @ `c4331dadf^`).

## Why this shape

- `_postFeedback` receives `data.date` already filled by `UniversalFeedbackWriter.postFeedback`; no extra defaulting here.
- No client-side rating/description validation: the DB CHECK (`rating IS NOT NULL OR description IS NOT NULL`) is authoritative, and the rate-limit trigger handles spam.
- No `userAgent`/`user_agent` mismatch: API uses `userAgent` (camelCase), DB column uses `user_agent` (snake_case); insert maps the field.

## Verification

- `tsc --noEmit` on the changed file: clean (pre-existing errors in other supabase adapter files are unrelated and pre-existed this commit).
- `eslint` on the changed file: clean.
- Runtime not exercised — feedback popup writes from the browser via the anon client; will land in `feedback` table on next manual or E2E run that triggers the feedback flow.
