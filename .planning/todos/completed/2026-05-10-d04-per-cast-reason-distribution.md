---
title: Distribute the per-cluster `// reason:` anchor in supabaseDataProvider.ts to per-cast lines (D-04 strict reading)
priority: low
created: 2026-05-10
resolves_phase: 78
context: Captured during Phase 71 OOS triage (`71-OUT-OF-SCOPE-FINDINGS.md` row #9). Phase 71 D-04 (`// reason:` convention) was anchored cluster-level in supabaseDataProvider.ts (one anchor per file); the strict reading of D-04 expects one anchor per cast. The grep gate (`≥ 7`) is satisfied with 15 matches across `apps/frontend/src/`, but the supabaseDataProvider.ts cluster has 13 cast sites covered by a single anchor.
---

# Distribute D-04 `// reason:` anchors per-cast in supabaseDataProvider.ts

Phase 71 introduced the convention that any non-trivial type cast or
`@ts-expect-error` deserves a `// reason:` comment. Most call sites
were updated to per-line anchors, but `supabaseDataProvider.ts` was
landed with a single cluster-level anchor that documents the *pattern*
(JSONB columns return `Json` and need to be re-cast through structural
types) rather than per-site rationale.

## Goal

Match the strict reading of D-04: every cast that crosses a non-trivial
type boundary gets its own `// reason:` line, with reason text that
distinguishes:

- `parseStoredImage(data.image as Json as unknown as StoredImage | null, …)`
  — JSONB column → `StoredImage` shape; runtime-guarded by `parseStoredImage`.
- `parseAnswers(answers as Json as unknown as LocalizedAnswers | null)` —
  JSONB column → `LocalizedAnswers` shape; structural guard inside
  `parseAnswers`.

## Approach

1. **Inventory** — `git grep -nE "(parseStoredImage|parseAnswers)\(.*as Json"
   apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts`
   — should return ~13 sites covered by 1 anchor today.
2. **Distribute** — replace the cluster anchor with per-cast anchors.
   Keep the wording specific to each function (parseStoredImage vs.
   parseAnswers) so the comment carries useful information rather than
   restating the pattern.
3. **Grep gate confirmation** — ensure the per-line distribution still
   satisfies the existing `≥ 7` threshold.

## Why deferred from v2.8

Phase 71 OOS triage classified this as ⚠️ STRETCH:
convention-tightening only, with no behavioral or correctness payoff.
The grep gate is already satisfied. Easier to enforce uniformly going
forward via a dedicated lint rule (or a careful PR-review checklist
addition) than to retrofit one cluster.

## Files of interest

- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts`
  (the cluster owning the single anchor today)
- `.planning/phases/71-frontend-strict-typing-cleanup/71-CONTEXT.md`
  D-04 — the convention spec.
- `.planning/phases/71-frontend-strict-typing-cleanup/71-PATTERNS.md`
  — the analog patterns.

## Cross-references

- `.planning/phases/71-frontend-strict-typing-cleanup/71-OUT-OF-SCOPE-FINDINGS.md`
  row #9 — origin of this todo.
- `.planning/phases/71-frontend-strict-typing-cleanup/71-REVIEW.md` IN-02
  — the underlying observation.
