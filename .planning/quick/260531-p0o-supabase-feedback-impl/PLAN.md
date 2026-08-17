---
quick_id: 260531-p0o
slug: supabase-feedback-impl
date: 2026-05-31
---

# Quick Task: Implement SupabaseFeedbackWriter._postFeedback

## Description

The `SupabaseFeedbackWriter._postFeedback` stub throws `'not implemented'`. Implement it so the in-app feedback popup writes to `public.feedback`.

## Context

- Table `public.feedback` exists with NOT NULL `project_id` FK to `public.projects`, CHECK constraint requires at least `rating` OR `description`, rate-limit trigger handles spam, immutable after insert (no UPDATE policy).
- Anon-insert RLS already in place (`anon_insert_feedback`); anon SELECT on `public.app_settings` is open (`anon_select_app_settings`) — safe channel to resolve `project_id` (single-project deploy: one row in `app_settings`).
- Reference shape (from deleted Strapi pattern, commit `c4331dadf^`): subclass overrides `_postFeedback` and returns `{ type: 'success' }`. Errors freely throw — `UniversalAdapter.postFeedback` wraps them.
- Insert columns per `Database['public']['Tables']['feedback']['Insert']`: `project_id` (required), `rating?`, `description?`, `date?`, `url?`, `user_agent?`. `date` is supplied by `UniversalFeedbackWriter.postFeedback` before `_postFeedback` runs.

## Steps

1. Replace stub in `apps/frontend/src/lib/api/adapters/supabase/feedbackWriter/supabaseFeedbackWriter.ts`:
   - Resolve `project_id` via `supabase.from('app_settings').select('project_id').limit(1).single()`.
   - Insert into `feedback` with `{ project_id, rating, description, date, url, user_agent }`.
   - Throw on either error; return `{ type: 'success' as const }` on success.
2. Typecheck frontend.
3. Atomic commit.
