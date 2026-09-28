# Phase 123 — svelte-check Baseline (pinned, criterion-4 reference)

**Captured:** 2026-06-17
**Command:** `yarn workspace @openvaa/frontend check`
**Git HEAD at capture:** `fd97bb7fa4bc252674f9f97c5180f25a8d67f3b2` (branch `feat-gsd-roadmap`)
**Tree state at capture:** CLEAN — `git status --short` showed NO modified `apps/frontend/src` files before this run (only the unrelated pre-existing root `package.json` + `.planning/config.json` working-tree edits, neither of which is in this phase's edit surface). Baseline captured BEFORE any phase source edit per RESEARCH Pitfall 3 (`check` runs `svelte-kit sync` first, so capturing late risks drift).

## Pinned summary line (verbatim, transcribed from the live run — not copied from RESEARCH)

```
COMPLETED 2086 FILES 151 ERRORS 1 WARNINGS 30 FILES_WITH_PROBLEMS
```

This matches the RESEARCH-captured figure (151 errors / 1 warning) exactly — **delta = 0**. The pinned authoritative baseline for this phase is therefore:

| Metric | Pinned baseline |
|--------|-----------------|
| ERRORS | **151** |
| WARNINGS | **1** |
| FILES | 2086 |
| FILES_WITH_PROBLEMS | 30 |

## Criterion-4 rule (the gate downstream plans must hold)

> After ALL Phase-123 edits land, `yarn workspace @openvaa/frontend check` must report:
> - **error count ≤ 151** (no net-new type errors over the pinned baseline)
> - **warning count ≤ 1**
>
> Re-measure on the same tree-state convention (run `check`, read the final `COMPLETED … ERRORS … WARNINGS …` machine-readable summary line). Any increase over the pinned counts is a regression that must be resolved before the touched plan is considered complete.

## Nature of the 151 pre-existing errors (all outside this phase's edit surface)

All 151 errors are pre-existing **TYPE-01 / TYPE-02 deferrals** carried forward from prior milestones — none are introduced by, nor live within, the Phase-123 edit surface (the candidate context/store + the ~21 lifecycle / reactive-`let` audit sites). They fall into three families, visible in the run tail:

1. **`qs` ambient module (TS7016)** — `Could not find a declaration file for module 'qs'` at `src/routes/api/admin/jobs/active|past/+server.ts`, `src/routes/api/data/[collection]/+server.ts`, `src/routes/(voters)/constituencies/+page.svelte`, etc. Missing `@types/qs` declaration.
2. **admin-jobs `+server.ts` cookies/fetch drift** — `Object literal may only specify known properties, and 'cookies' does not exist in type '{ fetch … }'` across the `src/routes/api/admin/jobs/**/+server.ts` handlers.
3. **route string-to-number errors + settings-page prop drift** — `Type 'string' is not assignable to type 'number'` at `src/routes/(voters)/(located)/questions/+layout.svelte:232` and `src/routes/candidate/(protected)/questions/[questionId]/+page.svelte:282`; `currentPassword`/`confirmPasswordTestId` prop-shape errors at `src/routes/candidate/(protected)/settings/+page.svelte`.

These are explicitly out of scope for Phase 123 (idiom polish + two one-line bug fixes + their tests). The criterion-4 gate exists to ensure the phase's edits do not ADD to this count, not to fix the pre-existing deferrals.
