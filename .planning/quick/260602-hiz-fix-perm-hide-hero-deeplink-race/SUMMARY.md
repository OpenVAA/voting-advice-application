---
quick_id: 260602-hiz
slug: fix-perm-hide-hero-deeplink-race
date: 2026-06-02
status: complete
commits:
  - a15fd5bb4 test(quick-260602-hiz): navigate perm-hide-hero via overview, not deep-link
---

# Summary: Fix perm-hide-hero "no questions" empty-state failure

## What was wrong

`perm-hide-hero.spec.ts` deep-linked to
`/en/candidate/questions/<external_id>` and immediately asserted the hero
`<figure>` visible. The candidate landed on the `error.noQuestions` empty
state instead, so the figure was never in the DOM ("element(s) not found").

## Root cause

The candidate-questions `+layout.svelte:57` renders the question page only
when `ctx.opinionQuestions.length > 0`, else it shows `error.noQuestions`.
`opinionQuestions` is filled by an async `$effect` chain in
`candidateContext.svelte.ts`: `reactiveDataRoot.current` → `userData.current`
(nominations) → `selectedElections` / `selectedConstituencies` `$effect`s →
questions `$effect`. On a cold deep-link with a stored session that chain
settles *after* mount, so the layout flashes the no-questions empty state
during the window — the layout cannot distinguish "loading" from "empty".
That's the "surfaces in other tests but disappears before timeout" symptom.

Two extra facts made the deep link doubly wrong:
- The per-question URL is keyed on the INTERNAL question id, not the seed
  `external_id`, so `goto(.../qu-opin-l5-1)` was never the right URL.
- With `hideHero=true` the figure mounts but empty; an empty `<figure>` has a
  zero-height box under Tailwind preflight, so `toBeVisible()` would fail even
  after the page renders.

The authoritative spec (TIR6:24-32) prescribes a UI walk
("Login → Go to opinions → Open 1st question → Expect hero hidden"), not a
deep link — the implemented spec had deviated.

## Fix (commit a15fd5bb4)

Rewrote `tests/tests/specs/perm/perm-hide-hero.spec.ts` to navigate via the
`candidateQuestionsOverviewPage` fixture (canonical perm-answers-locked
pattern):
- `goToPage()` loads the overview (gates on `opinionQuestions` populated →
  warms the context, kills the race).
- `goToQuestion(/\[QU-OPIN-L5-1\]/)` opens the labelled first opinion question.
- Anchor readiness on `candidate-questions-answer` (`toBeVisible`).
- Assert hero figure `toBeAttached()` (not visible — empty box) +
  `expect(hero.locator('img, span')).toHaveCount(0)` (raw-locator
  inline-justified, matching candidate-settings.spec.ts:246).

No app-code change.

## Verification

- ESLint clean on the spec (`playwright/no-raw-locators` inline-justified).
- Imports/types mirror the working sibling `perm-answers-locked.spec.ts`.
- Full E2E left to the suite run (needs the perm-hide-hero setup project —
  seeds data + mints session ~90s — plus a running stack).

## Follow-up (out of scope)

The questions `+layout.svelte` (both candidate AND voter apps) flashes
`error.noQuestions` during the cold data-resolution window because it treats
"still loading" identically to "genuinely empty". A loading-state guard would
fix the misleading UX at the source. Captured here as a candidate for a future
phase; not done as part of this test-stabilization task.
