---
quick_id: 260602-hiz
slug: fix-perm-hide-hero-deeplink-race
date: 2026-06-02
---

# Quick Task: Fix perm-hide-hero "no questions" empty-state failure

## Problem

`perm-hide-hero.spec.ts:26` fails:

```
expect(getByTestId('candidate-questions-hero')).toBeVisible() — element(s) not found
```

The page snapshot shows the candidate landed on the `error.noQuestions`
empty state ("There are no questions related to your constituency in the
Election Compass yet.") instead of the opinion-question page, so the hero
`<figure>` never mounted.

## Root cause (why we get the "no questions" error)

Two compounding issues:

1. **Deep-link data race (primary).** The spec does
   `page.goto('/en/candidate/questions/<external_id>')` straight to the
   `[questionId]` route. The candidate-questions `+layout.svelte:57` gates
   rendering of the question page on `ctx.opinionQuestions.length > 0`,
   otherwise it shows `error.noQuestions`. `opinionQuestions` is populated by
   an async `$effect` chain in `candidateContext.svelte.ts`:
   `reactiveDataRoot.current` → `userData.current` (nominations) →
   `selectedElections` / `selectedConstituencies` `$effect`s → questions
   `$effect`. On a cold deep-link with a stored session, that chain settles
   *after* mount, so for a window `opinionQuestions.length === 0` and the
   layout flashes the no-questions empty state. The layout cannot distinguish
   "still loading" from "genuinely empty" — which is why the symptom
   "surfaces in other tests but disappears before test timeouts."

   Also: the per-question URL is keyed on the INTERNAL question id, not the
   seed `external_id`, so `page.goto(.../qu-opin-l5-1)` (an external_id) is
   the wrong URL regardless of timing.

2. **Empty-figure visibility (secondary).** With `hideHero=true` the figure
   still mounts but its `<Hero>` child is gated out, leaving an empty
   `<figure>`. Under Tailwind preflight an empty figure has a zero-height
   box, so `toBeVisible()` would fail with "not visible" even once the page
   renders.

The authoritative spec (TEST-INVENTORY-REFACTOR-6.md:24-32) describes a UI
walk — "Login → Go to opinions → Open 1st question → Expect hero hidden" —
NOT a deep link. The implemented spec deviated from it.

## Fix

Rewrite the spec to navigate via the questions OVERVIEW using the existing
`candidateQuestionsOverviewPage` fixture (the canonical
`perm-answers-locked.spec.ts` pattern):

- `goToPage()` — loads the overview, which itself gates on `opinionQuestions`
  being populated, so it warms the candidate context before we open a
  question (eliminates the race).
- `goToQuestion(/\[QU-OPIN-L5-1\]/)` — expands categories, opens the labelled
  first opinion question by its rendered label (label is internal-id-safe),
  awaits navigation off the overview.

Harden the assertions:
- Anchor page-readiness on `candidate-questions-answer` (`toBeVisible`).
- Assert the hero figure is `toBeAttached()` (not visible — empty box).
- Keep `expect(hero.locator('img, span')).toHaveCount(0)`.

Respects the rigidity contract (no soft assertions, no `.catch`, testid-only)
and Playwright best practices (web-first assertions via app flow, no
arbitrary waits).

## Scope

- Edit only: `tests/tests/specs/perm/perm-hide-hero.spec.ts`
- No app-code change. (Follow-up candidate: give the questions `+layout.svelte`
  a loading state so it stops flashing `error.noQuestions` during the cold
  data-resolution window — a real UX nit affecting both voter + candidate
  apps, but out of scope for this test-stabilization task.)

## Verification

- `yarn lint:check` / type-check the spec.
- Full E2E run requires the perm-hide-hero setup project (seeds data + mints
  session, ~90s) + running stack; left to the suite run.
