---
created: "2026-08-22T21:20:00.000Z"
title: "`.cjs` reach in the svelte/store guard covers `import`, not `require()`"
area: frontend
files:
  - apps/frontend/eslint.config.mjs
  - apps/frontend/src/lib/_guards/eslint-store-guard.test.ts
source: Phase 143 code review, finding IN-01 (143-REVIEW.md)
resolves_phase: null
---

## Problem

Phase 143 widened the guard glob to `src/**/*.{ts,js,mjs,cjs,svelte}` (D-05), closing the measured
`.js`/`.mjs`/`.cjs` extension gap. The 30-case standing matrix proves the guard fires on a
`svelte/store` **ESM `import`** in each of those extensions.

But a real CommonJS file does not use `import` — it uses `require('svelte/store')`. The `.cjs`
half of the widening therefore guards a form that a genuine `.cjs` file would not contain. Nothing
here is wrong: the phase measured what it claims and the matrix is honest. The risk is purely one
of **reading**: `{ts,js,mjs,cjs,svelte}` looks like "CommonJS is now covered", and it is not, in the
sense a reader would assume.

Phase 143 research recorded that `require()` is independently closed by
`@typescript-eslint/no-require-imports` — so the practical hole is small. This todo is about making
the boundary legible, not about a live defect.

## Solution

Either (or both):

1. Add a comment at the `files:` glob in `apps/frontend/eslint.config.mjs` stating that `.cjs`
   coverage is the ESM-`import`-in-a-`.cjs`-file case, and that the `require()` form is closed by
   `@typescript-eslint/no-require-imports` rather than by this rule.
2. Add a matrix case asserting the `require('svelte/store')` form is caught (by whichever rule
   actually catches it), so the division of labour between the two rules is proven rather than
   asserted.

**Do not land either as a drive-by.** Phase 143's six gates ran at HEAD `a3414c4ed`; changing
`eslint.config.mjs` after that point invalidates them. Whoever picks this up re-runs the gates, or
folds it into a phase that is running them anyway.

## Context

- Raised as **IN-01** in `.planning/phases/143-svelte-store-guard-app-wide-reach-fallout-triage/143-REVIEW.md`
  (0 Critical, 0 Warning, 2 Info — the review was otherwise clean).
- Related residue from the same phase, filed separately: the `svelte/motion` ban, and the frontend
  lint script's `src/`-only scope.
- The phase also recorded that the **computed-specifier** form `import(n)` is genuinely open and no
  static rule can close it — stated in the ledger rather than papered over.
