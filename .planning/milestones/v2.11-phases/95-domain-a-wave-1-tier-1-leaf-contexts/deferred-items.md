# Phase 95 — Deferred Items (out-of-scope discoveries)

These were observed during execution but are OUTSIDE the touched scope of the
current plan(s). They are logged, NOT fixed (SCOPE BOUNDARY rule).

## 95-01 (appContext SSR-init / mergeAppSettings purity)

Pre-existing `yarn check` (svelte-check) type errors in
`apps/frontend/src/lib/contexts/app/appContext.svelte.ts`, all on constructs
present in the pre-edit baseline (HEAD~2) and untouched by the 95-01 edits
(which only changed the appSettings/appCustomization `$state`-init region and
the `mergeInitialAppSettings` import):

- L187: comparison `feedbackStatus !== 'indetermined'` vs `'dismissed'` — types have no overlap (`UserFeedbackStatus` vs `FeedbackStatus`).
- L222 / L229: `Type 'UserFeedbackStatus' is not assignable to type 'FeedbackStatus'` in `setFeedbackStatus` / `setSurveyStatus`.
- L246: `openFeedbackModal` `Writable<(() => void) | undefined>` not assignable to `Writable<() => void | undefined>` (parenthesization in `openFeedbackModal` type).

Repo-wide `yarn check` baseline at execution time: 151 errors / 30 warnings
across 2151 files (qs module declarations, admin/jobs `cookies`,
candidateContext `SupabaseDataWriter` vs `Promise<UniversalDataWriter>`, etc.) —
all pre-existing and unrelated to the rune migration. No NEW errors were
introduced by 95-01 (the 4 appContext errors above predate the edit).

These are candidates for a future type-hygiene sweep (the `UserFeedbackStatus`
/ `FeedbackStatus` mismatch and the `openFeedbackModal` type are the most
self-contained); not in Wave-1 scope.
